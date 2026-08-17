import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, safeAuthError } from "@/lib/auth";
import { hashChallengeToken } from "@/lib/auth-challenge";

const headers = { "cache-control": "no-store" };
const schema = z.object({ token: z.string().min(32).max(128), name: z.string().trim().min(2).max(100), password: z.string().min(8).max(72) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "بيانات قبول الدعوة غير صالحة" }, { status: 400, headers });
    const invite = await prisma.workspaceInvite.findUnique({ where: { tokenHash: hashChallengeToken(parsed.data.token) }, include: { workspace: { select: { id: true, name: true } } } });
    if (!invite || invite.acceptedAt || invite.revokedAt || invite.expiresAt <= new Date()) return NextResponse.json({ error: "الدعوة غير صالحة أو منتهية" }, { status: 410, headers });
    const existing = await prisma.user.findUnique({ where: { email: invite.email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "يوجد حساب بهذا البريد. سجّل الدخول أولًا ثم اطلب دعوة مرتبطة بحسابك." }, { status: 409, headers });
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const created = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ data: { email: invite.email, name: parsed.data.name, passwordHash, emailVerifiedAt: new Date() } });
      await tx.workspaceMember.create({ data: { workspaceId: invite.workspaceId, userId: newUser.id, role: invite.role } });
      await tx.workspaceInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
      await tx.auditLog.create({ data: { actorId: newUser.id, workspaceId: invite.workspaceId, action: "CREATE", entity: "WorkspaceMember", entityId: newUser.id, reason: "workspace_invite_accepted", metadataJson: JSON.stringify({ inviteId: invite.id, role: invite.role }) } });
      return newUser;
    });
    await createSession(created.id);
    return NextResponse.json({ user: { id: created.id, name: created.name, email: created.email }, workspace: invite.workspace }, { status: 201, headers });
  } catch (error) {
    return safeAuthError(error);
  }
}
