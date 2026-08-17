import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "centralia_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await prisma.session.create({ data: { tokenHash: hashToken(rawToken), userId, expiresAt } });
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
    include: { user: { include: { workspace: { select: { id: true, name: true } } } } },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
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

export function safeAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: { "content-type": "application/json" } });
  if (error instanceof Error && error.message === "FORBIDDEN") return new Response(JSON.stringify({ error: "لا تملك صلاحية تنفيذ هذا الإجراء" }), { status: 403, headers: { "content-type": "application/json" } });
  return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), { status: 500, headers: { "content-type": "application/json" } });
}
