import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOpaqueChallengeToken } from "@/lib/auth-challenge";
import { requireWorkspaceRole, safeAuthError } from "@/lib/auth";

const headers = { "cache-control": "no-store" };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await (await import("@/lib/auth")).requireUser();
    const access = await requireWorkspaceRole(user.id, ["OWNER", "BILLING_MANAGER"]);
    const { id } = await params;
    const invite = await prisma.workspaceInvite.findUnique({
      where: { id },
      select: { id: true, workspaceId: true, email: true, role: true, acceptedAt: true, revokedAt: true },
    });
    if (!invite || invite.workspaceId !== access.workspace.id) return NextResponse.json({ error: "الدعوة غير موجودة" }, { status: 404, headers });
    if (invite.acceptedAt) return NextResponse.json({ error: "لا يمكن إعادة إرسال دعوة تم قبولها" }, { status: 409, headers });
    if (invite.revokedAt) return NextResponse.json({ error: "لا يمكن إعادة إرسال دعوة ملغاة" }, { status: 409, headers });

    const { rawToken, tokenHash } = createOpaqueChallengeToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const replacement = await prisma.$transaction(async (tx) => {
      await tx.workspaceInvite.update({ where: { id: invite.id }, data: { revokedAt: new Date() } });
      const created = await tx.workspaceInvite.create({
        data: { workspaceId: access.workspace.id, createdById: user.id, email: invite.email, role: invite.role, tokenHash, expiresAt },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          workspaceId: access.workspace.id,
          action: "CREATE",
          entity: "WorkspaceInvite",
          entityId: created.id,
          reason: "workspace_invite_resent",
          metadataJson: JSON.stringify({ replacedInviteId: invite.id, email: created.email, role: created.role, expiresAt: created.expiresAt.toISOString() }),
        },
      });
      return created;
    });
    const origin = new URL(request.url).origin;
    return NextResponse.json({
      invite: { id: replacement.id, email: replacement.email, role: replacement.role, expiresAt: replacement.expiresAt, inviteUrl: `${origin}/invite/${rawToken}` },
    }, { status: 201, headers });
  } catch (error) {
    return safeAuthError(error);
  }
}
