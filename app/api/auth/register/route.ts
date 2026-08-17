import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "تحقق من الاسم والبريد وكلمة المرور" }, { status: 400 });
  const { name, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "هذا البريد مسجل بالفعل" }, { status: 409 });
  const starter = await prisma.plan.findUnique({ where: { code: "starter" } });
  if (!starter) return NextResponse.json({ error: "خطط الاشتراك غير مهيأة بعد" }, { status: 503 });
  const passwordHash = await bcrypt.hash(password, 12);
  const periodEnd = new Date(Date.now() + starter.trialDays * 86400000);
  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({ data: { name, email, passwordHash } });
    const workspace = await tx.workspace.create({ data: { name: `${name} workspace`, ownerId: createdUser.id, planId: starter.id } });
    await tx.workspaceMember.create({ data: { workspaceId: workspace.id, userId: createdUser.id, role: "OWNER" } });
    await tx.subscription.create({ data: { workspaceId: workspace.id, planId: starter.id, status: "TRIAL", currentPeriodEnd: periodEnd, events: { create: { type: "trial_started", toStatus: "TRIAL" } } } });
    await tx.auditLog.create({ data: { actorId: createdUser.id, workspaceId: workspace.id, action: "CREATE", entity: "Workspace", entityId: workspace.id, reason: "initial registration" } });
    return createdUser;
  });
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
}
