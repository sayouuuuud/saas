import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOpaqueChallengeToken } from "@/lib/auth-challenge";
import { requireWorkspaceRole, safeAuthError } from "@/lib/auth";
import { sendWorkspaceInviteEmail } from "@/lib/email";

const headers = { "cache-control": "no-store" };
const roleLabels: Record<string, string> = { OWNER: "المالك", BILLING_MANAGER: "مدير الفوترة", ANALYST: "محلل", SUPPORT_CONTACT: "جهة اتصال الدعم", VIEWER: "مشاهد" };
const createSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["BILLING_MANAGER", "ANALYST", "SUPPORT_CONTACT", "VIEWER"]).default("VIEWER"),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export async function GET(request: Request) {
  try {
    const user = await (await import("@/lib/auth")).requireUser();
    if (!user.workspace) return NextResponse.json({ error: "مساحة العمل غير موجودة" }, { status: 404, headers });
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25) || 25, 1), 50);
    const offset = Math.max(Number(url.searchParams.get("offset") || 0) || 0, 0);
    const rows = await prisma.workspaceInvite.findMany({
      where: { workspaceId: user.workspace.id },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit + 1,
      select: { id: true, email: true, role: true, expiresAt: true, acceptedAt: true, revokedAt: true, createdAt: true },
    });
    const hasMore = rows.length > limit;
    const invites = rows.slice(0, limit);
    return NextResponse.json({ invites, pagination: { limit, offset, hasMore, nextOffset: hasMore ? offset + limit : null } }, { headers });
  } catch (error) {
    return safeAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await (await import("@/lib/auth")).requireUser();
    const access = await requireWorkspaceRole(user.id, ["OWNER", "BILLING_MANAGER"]);
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "البريد أو الدور غير صالح" }, { status: 400, headers });
    const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: access.workspace.id, userId: existingUser.id } } });
      if (existingMember) return NextResponse.json({ error: "هذا البريد عضو بالفعل في مساحة العمل" }, { status: 409, headers });
    }
    const { rawToken, tokenHash } = createOpaqueChallengeToken();
    const expiresAt = new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000);
    const invite = await prisma.$transaction(async (tx) => {
      await tx.workspaceInvite.updateMany({ where: { workspaceId: access.workspace.id, email: parsed.data.email, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
      const created = await tx.workspaceInvite.create({ data: { workspaceId: access.workspace.id, createdById: user.id, email: parsed.data.email, role: parsed.data.role, tokenHash, expiresAt } });
      await tx.auditLog.create({ data: { actorId: user.id, workspaceId: access.workspace.id, action: "CREATE", entity: "WorkspaceInvite", entityId: created.id, reason: "workspace_invite_created", metadataJson: JSON.stringify({ email: created.email, role: created.role, expiresAt: created.expiresAt.toISOString() }) } });
      return created;
    });
    await sendWorkspaceInviteEmail(invite.email, rawToken, access.workspace.name, roleLabels[invite.role] || invite.role);
    const origin = new URL(request.url).origin;
    return NextResponse.json({ invite: { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt, inviteUrl: `${origin}/invite/${rawToken}` } }, { status: 201, headers });
  } catch (error) {
    return safeAuthError(error);
  }
}
