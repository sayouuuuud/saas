import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, safeAuthError } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(72) });

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(request, "auth:login", 10);
  if (!rate.allowed) return NextResponse.json({ error: "محاولات كثيرة، حاول مرة أخرى لاحقًا" }, { status: 429, headers: rateLimitHeaders(rate) });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات الدخول غير صالحة" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { workspace: { select: { id: true } } } });
  const valid = user?.passwordHash ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) return NextResponse.json({ error: "البريد أو كلمة المرور غير صحيحة" }, { status: 401 });
  await createSession(user.id);
  await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace?.id ?? null, action: "LOGIN", entity: "Session", entityId: user.id, reason: "password_login_success" } });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    return safeAuthError(error);
  }
}
