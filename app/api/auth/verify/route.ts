import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(request, "auth:verify", 10);
  if (!rate.allowed) return NextResponse.json({ error: "محاولات كثيرة، حاول مرة أخرى لاحقًا" }, { status: 429, headers: rateLimitHeaders(rate) });
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return NextResponse.json({ error: "رمز التحقق مطلوب" }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { emailVerificationTokenHash: hash(token) } });
  if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= new Date()) return NextResponse.json({ error: "رمز التحقق غير صالح أو منتهي" }, { status: 400 });
  await prisma.$transaction(async (tx) => {
    const nextUser = await tx.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), emailVerificationTokenHash: null, emailVerificationExpiresAt: null }, select: { id: true } });
    const workspace = await tx.workspace.findUnique({ where: { ownerId: nextUser.id }, select: { id: true } });
    if (workspace) await tx.auditLog.create({ data: { actorId: nextUser.id, workspaceId: workspace.id, action: "SECURITY_EVENT", entity: "User", entityId: nextUser.id, reason: "email_verified" } });
    return nextUser;
  });
    return NextResponse.json({ verified: true });
  } catch (error) {
    return safeAuthError(error);
  }
}
