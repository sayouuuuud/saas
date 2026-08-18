import crypto from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(request, "auth:reset-password", 10);
  if (!rate.allowed) return NextResponse.json({ error: "محاولات كثيرة، حاول مرة أخرى لاحقًا" }, { status: 429, headers: rateLimitHeaders(rate) });
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token || password.length < 6 || password.length > 72) return NextResponse.json({ error: "الرمز وكلمة المرور الجديدة مطلوبان" }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { passwordResetTokenHash: hash(token) } });
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) return NextResponse.json({ error: "رمز الاستعادة غير صالح أو منتهي" }, { status: 400 });
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 12), passwordResetTokenHash: null, passwordResetExpiresAt: null } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    const membership = await tx.workspaceMember.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { workspaceId: true } });
    if (membership) await tx.auditLog.create({ data: { actorId: user.id, workspaceId: membership.workspaceId, action: "SECURITY_EVENT", entity: "User", entityId: user.id, reason: "password_reset" } });
  });
    return NextResponse.json({ reset: true });
  } catch (error) {
    return safeAuthError(error);
  }
}
