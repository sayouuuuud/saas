import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { encryptSecret, decryptSecret, generateSecret, otpauthUri, verifyCode } from "@/lib/totp";
import { prisma } from "@/lib/prisma";

const headers = { "cache-control": "no-store" };
const codeSchema = z.object({ action: z.enum(["start", "enable", "disable"]), code: z.string().regex(/^\d{6}$/).optional() });

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers });
    return NextResponse.json({ enabled: user.twoFactorEnabled, enrollmentPending: Boolean(user.twoFactorSecretEncrypted && !user.twoFactorEnabled) }, { headers });
  } catch (error) {
    return safeAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers });
    const parsed = codeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "بيانات التحقق غير صالحة" }, { status: 400, headers });
    const { action, code } = parsed.data;

    if (action === "start") {
      if (user.twoFactorEnabled) return NextResponse.json({ error: "المصادقة الثنائية مفعلة بالفعل" }, { status: 409, headers });
      const secret = generateSecret();
      await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecretEncrypted: encryptSecret(secret), twoFactorEnabled: false } });
      return NextResponse.json({ secret, otpauthUri: otpauthUri(user.email, secret), enrollmentPending: true }, { headers });
    }

    if (!code) return NextResponse.json({ error: "أدخل رمز المصادقة المكون من 6 أرقام" }, { status: 400, headers });
    if (!user.twoFactorSecretEncrypted) return NextResponse.json({ error: "ابدأ إعداد المصادقة الثنائية أولًا" }, { status: 409, headers });
    const secret = decryptSecret(user.twoFactorSecretEncrypted);
    if (!verifyCode(secret, code)) return NextResponse.json({ error: "رمز المصادقة غير صحيح أو منتهي" }, { status: 400, headers });

    const enabled = action === "enable";
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: enabled, twoFactorSecretEncrypted: enabled ? user.twoFactorSecretEncrypted : null } });
    await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace?.id, action: "SECURITY_EVENT", entity: "TwoFactorAuth", entityId: user.id, reason: enabled ? "user enabled TOTP" : "user disabled TOTP" } });
    return NextResponse.json({ enabled }, { headers });
  } catch (error) {
    return safeAuthError(error);
  }
}
