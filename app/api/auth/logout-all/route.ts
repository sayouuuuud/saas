import { NextResponse } from "next/server";
import { clearSession, getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers: { "cache-control": "no-store" } });
    const [count, latest] = await Promise.all([
      prisma.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } }),
      prisma.session.findFirst({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, select: { createdAt: true, expiresAt: true } }),
    ]);
    return NextResponse.json({ activeSessions: count, latestCreatedAt: latest?.createdAt || null, latestExpiresAt: latest?.expiresAt || null }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return safeAuthError(error);
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers: { "cache-control": "no-store" } });
    const result = await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace?.id, action: "SECURITY_EVENT", entity: "Session", reason: "logout_all_sessions" } });
    await clearSession();
    return NextResponse.json({ revoked: result.count }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return safeAuthError(error);
  }
}
