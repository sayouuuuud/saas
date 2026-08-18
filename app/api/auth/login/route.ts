import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, safeAuthError } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { createOpaqueChallengeToken, hashChallengeToken } from "@/lib/auth-challenge";
import { decryptSecret, verifyCode } from "@/lib/totp";
import { getClientIp, getUserAgent } from "@/lib/request-context";

const headers = { "cache-control": "no-store" };
const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
  challengeToken: z.string().min(32).max(128).optional(),
  code: z.string().regex(/^\d{6}$/).optional(),
});

export async function POST(request: Request) {
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);
  const recordLoginEvent = (input: { userId?: string | null; email: string; success: boolean; failureReason?: string }) =>
    prisma.loginEvent.create({ data: { userId: input.userId || null, email: input.email, success: input.success, failureReason: input.failureReason || null, ipAddress, userAgent } }).catch(() => {});

  try {
    const rate = checkRateLimit(request, "auth:login", 10);
    if (!rate.allowed) return NextResponse.json({ error: "محاولات كثيرة، حاول مرة أخرى لاحقًا" }, { status: 429, headers: rateLimitHeaders(rate) });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "بيانات الدخول غير صالحة" }, { status: 400, headers });
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { workspace: { select: { id: true } } } });
    const valid = user?.passwordHash ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
    if (!user || !valid) {
      await recordLoginEvent({ userId: user?.id, email: parsed.data.email, success: false, failureReason: "invalid_credentials" });
      return NextResponse.json({ error: "البريد أو كلمة المرور غير صحيحة" }, { status: 401, headers });
    }

    if (user.twoFactorEnabled) {
      if (!parsed.data.challengeToken) {
        const { rawToken, tokenHash } = createOpaqueChallengeToken();
        await prisma.twoFactorChallenge.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } });
        await prisma.twoFactorChallenge.create({ data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 5 * 60 * 1000) } });
        await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace?.id ?? null, action: "LOGIN", entity: "TwoFactorChallenge", entityId: user.id, reason: "password_login_2fa_required" } });
        return NextResponse.json({ twoFactorRequired: true, challengeToken: rawToken }, { headers });
      }
      if (!parsed.data.code) return NextResponse.json({ error: "أدخل رمز المصادقة" }, { status: 400, headers });
      const challenge = await prisma.twoFactorChallenge.findUnique({ where: { tokenHash: hashChallengeToken(parsed.data.challengeToken) } });
      if (!challenge || challenge.userId !== user.id || challenge.expiresAt <= new Date() || challenge.attempts >= 5 || !user.twoFactorSecretEncrypted) {
        await recordLoginEvent({ userId: user.id, email: user.email, success: false, failureReason: "2fa_challenge_expired" });
        return NextResponse.json({ error: "جلسة التحقق منتهية، ابدأ تسجيل الدخول من جديد" }, { status: 401, headers });
      }
      const secret = decryptSecret(user.twoFactorSecretEncrypted);
      if (!verifyCode(secret, parsed.data.code)) {
        await prisma.twoFactorChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
        await recordLoginEvent({ userId: user.id, email: user.email, success: false, failureReason: "2fa_code_invalid" });
        return NextResponse.json({ error: "رمز المصادقة غير صحيح" }, { status: 401, headers });
      }
      await prisma.twoFactorChallenge.delete({ where: { id: challenge.id } });
      await createSession(user.id, { ipAddress, userAgent });
      await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace?.id ?? null, action: "LOGIN", entity: "Session", entityId: user.id, reason: "password_login_2fa_success" } });
      await recordLoginEvent({ userId: user.id, email: user.email, success: true });
      return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { headers });
    }

    await createSession(user.id, { ipAddress, userAgent });
    const staffTwoFactorSetupRequired = Boolean(user.isStaff && !user.twoFactorEnabled);
    await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace?.id ?? null, action: "LOGIN", entity: "Session", entityId: user.id, reason: staffTwoFactorSetupRequired ? "password_login_staff_2fa_setup_required" : "password_login_success" } });
    await recordLoginEvent({ userId: user.id, email: user.email, success: true });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email }, twoFactorSetupRequired: staffTwoFactorSetupRequired }, { headers });
  } catch (error) {
    return safeAuthError(error);
  }
}
