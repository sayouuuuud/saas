import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return NextResponse.json({ error: "رمز التحقق مطلوب" }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { emailVerificationTokenHash: hash(token) } });
  if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= new Date()) return NextResponse.json({ error: "رمز التحقق غير صالح أو منتهي" }, { status: 400 });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), emailVerificationTokenHash: null, emailVerificationExpiresAt: null } });
  if (updated.workspace) await prisma.auditLog.create({ data: { actorId: updated.id, workspaceId: updated.workspace.id, action: "SECURITY_EVENT", entity: "User", entityId: updated.id, reason: "email_verified" } });
  return NextResponse.json({ verified: true });
}
