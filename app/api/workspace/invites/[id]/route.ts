import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceRole, safeAuthError } from "@/lib/auth";

const headers = { "cache-control": "no-store" };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await (await import("@/lib/auth")).requireUser();
    const access = await requireWorkspaceRole(user.id, ["OWNER", "BILLING_MANAGER"]);
    const { id } = await params;
    const invite = await prisma.workspaceInvite.findUnique({ where: { id }, select: { id: true, workspaceId: true, revokedAt: true, acceptedAt: true } });
    if (!invite || invite.workspaceId !== access.workspace.id) return NextResponse.json({ error: "الدعوة غير موجودة" }, { status: 404, headers });
    if (invite.acceptedAt) return NextResponse.json({ error: "لا يمكن إلغاء دعوة تم قبولها" }, { status: 409, headers });
    if (invite.revokedAt) return NextResponse.json({ ok: true, alreadyRevoked: true }, { headers });
    await prisma.$transaction([
      prisma.workspaceInvite.update({ where: { id: invite.id }, data: { revokedAt: new Date() } }),
      prisma.auditLog.create({ data: { actorId: user.id, workspaceId: access.workspace.id, action: "DELETE", entity: "WorkspaceInvite", entityId: invite.id, reason: "workspace_invite_revoked" } }),
    ]);
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return safeAuthError(error);
  }
}
