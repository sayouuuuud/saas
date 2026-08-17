import crypto from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, safeAuthError } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email(), password: z.string().min(8).max(72) });
const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(request, "auth:register", 5);
  if (!rate.allowed) return NextResponse.json({ error: "محاولات كثيرة، حاول مرة أخرى لاحقًا" }, { status: 429, headers: rateLimitHeaders(rate) });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "تحقق من الاسم والبريد وكلمة المرور" }, { status: 400 });
  const { name, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "هذا البريد مسجل بالفعل" }, { status: 409 });
  const starter = await prisma.plan.findUnique({ where: { code: "starter" } });
  if (!starter) return NextResponse.json({ error: "خطط الاشتراك غير مهيأة بعد" }, { status: 503 });
  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const periodEnd = new Date(Date.now() + starter.trialDays * 86400000);
  const registration = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({ data: { name, email, passwordHash, emailVerificationTokenHash: hash(verificationToken), emailVerificationExpiresAt: verificationExpiresAt } });
    const workspace = await tx.workspace.create({ data: { name: `${name} workspace`, ownerId: createdUser.id, planId: starter.id } });
    await tx.workspaceMember.create({ data: { workspaceId: workspace.id, userId: createdUser.id, role: "OWNER" } });
    await tx.subscription.create({ data: { workspaceId: workspace.id, planId: starter.id, status: "TRIAL", currentPeriodEnd: periodEnd, events: { create: { type: "trial_started", toStatus: "TRIAL" } } } });
    await tx.auditLog.create({ data: { actorId: createdUser.id, workspaceId: workspace.id, action: "CREATE", entity: "Workspace", entityId: workspace.id, reason: "initial_registration" } });
    return { user: createdUser, workspaceId: workspace.id };
  });
  const { user, workspaceId } = registration;
  await createSession(user.id);
  await prisma.auditLog.create({ data: { actorId: user.id, workspaceId, action: "LOGIN", entity: "Session", entityId: user.id, reason: "registration_session_created" } });
  const response: { user: { id: string; name: string; email: string }; verificationToken?: string } = { user: { id: user.id, name: user.name, email: user.email } };
  if (process.env.NODE_ENV !== "production") response.verificationToken = verificationToken;
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return safeAuthError(error);
  }
}
