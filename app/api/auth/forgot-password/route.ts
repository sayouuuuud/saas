import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export async function POST(request: Request) {
  const rate = checkRateLimit(request, "auth:forgot-password", 5);
  if (!rate.allowed) return NextResponse.json({ accepted: true }, { status: 200, headers: rateLimitHeaders(rate) });
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const response: { accepted: boolean; resetToken?: string } = { accepted: true };
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.user.update({ where: { id: user.id }, data: { passwordResetTokenHash: hash(token), passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
      if (process.env.NODE_ENV !== "production") response.resetToken = token;
    }
  }
  return NextResponse.json(response);
}
