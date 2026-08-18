import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "centralia_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, context?: { ipAddress?: string | null; userAgent?: string | null }) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await prisma.session.create({ data: { tokenHash: hashToken(rawToken), userId, expiresAt, ipAddress: context?.ipAddress || null, userAgent: context?.userAgent || null } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const jar = await cookies();
  const rawToken = jar.get(SESSION_COOKIE)?.value;
  if (rawToken) await prisma.session.deleteMany({ where: { tokenHash: hashToken(rawToken) } });
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const rawToken = jar.get(SESSION_COOKIE)?.value;
  if (!rawToken) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: {
      user: {
        include: {
          workspace: { select: { id: true, name: true } },
          memberships: {
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { workspace: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }
  const { memberships, ...user } = session.user;
  return { ...user, workspace: user.workspace ?? memberships[0]?.workspace ?? null };
}

export type StaffSecurityUser = { isStaff: boolean; twoFactorEnabled: boolean };

export function staffTwoFactorRequired(user: StaffSecurityUser) {
  return user.isStaff && !user.twoFactorEnabled;
}

export function requireStaffTwoFactor(user: StaffSecurityUser) {
  if (staffTwoFactorRequired(user)) throw new Error("STAFF_2FA_REQUIRED");
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireWorkspaceRole(userId: string, allowed: string[]) {
  const user = await requireUser();
  if (!user.workspace) throw new Error("WORKSPACE_NOT_FOUND");
  const membership = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: user.workspace.id, userId } } });
  if (!membership || !allowed.includes(membership.role)) throw new Error("FORBIDDEN");
  return { user, workspace: user.workspace, membership };
}

const noStoreJsonHeaders = { "cache-control": "no-store", "content-type": "application/json" };

export function safeAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: noStoreJsonHeaders });
  if (error instanceof Error && error.message === "FORBIDDEN") return new Response(JSON.stringify({ error: "لا تملك صلاحية تنفيذ هذا الإجراء" }), { status: 403, headers: noStoreJsonHeaders });
  if (error instanceof Error && error.message === "WORKSPACE_NOT_FOUND") return new Response(JSON.stringify({ error: "مساحة العمل غير موجودة" }), { status: 404, headers: noStoreJsonHeaders });
  if (error instanceof Error && error.message === "STAFF_2FA_REQUIRED") return new Response(JSON.stringify({ error: "يجب تفعيل المصادقة الثنائية لحسابات Staff قبل الوصول إلى أدوات الإدارة" }), { status: 428, headers: noStoreJsonHeaders });
  return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), { status: 500, headers: noStoreJsonHeaders });
}
