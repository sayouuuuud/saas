import crypto from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token || password.length < 8 || password.length > 72) return NextResponse.json({ error: "الرمز وكلمة المرور الجديدة مطلوبان" }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { passwordResetTokenHash: hash(token) } });
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) return NextResponse.json({ error: "رمز الاستعادة غير صالح أو منتهي" }, { status: 400 });
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 12), passwordResetTokenHash: null, passwordResetExpiresAt: null } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    if (user.workspace) await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "SECURITY_EVENT", entity: "User", entityId: user.id, reason: "password_reset" } });
  });
  return NextResponse.json({ reset: true });
}
