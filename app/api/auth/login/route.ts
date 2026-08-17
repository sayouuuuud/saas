import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(72) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات الدخول غير صالحة" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const valid = user?.passwordHash ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) return NextResponse.json({ error: "البريد أو كلمة المرور غير صحيحة" }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}
