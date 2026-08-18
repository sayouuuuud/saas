import { NextResponse } from "next/server";
import { clearSession, getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { describeUserAgent } from "@/lib/request-context";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers: { "cache-control": "no-store" } });
    const [count, latest, sessions, loginEvents] = await Promise.all([
      prisma.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } }),
      prisma.session.findFirst({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, select: { createdAt: true, expiresAt: true } }),
      prisma.session.findMany({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true } }),
      prisma.loginEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, success: true, failureReason: true, ipAddress: true, userAgent: true, createdAt: true } }),
    ]);
    return NextResponse.json(
      {
        activeSessions: count,
        latestCreatedAt: latest?.createdAt || null,
        latestExpiresAt: latest?.expiresAt || null,
        sessions: sessions.map((session) => ({ id: session.id, ipAddress: session.ipAddress, device: describeUserAgent(session.userAgent), createdAt: session.createdAt, expiresAt: session.expiresAt })),
        loginHistory: loginEvents.map((event) => ({ id: event.id, success: event.success, failureReason: event.failureReason, ipAddress: event.ipAddress, device: describeUserAgent(event.userAgent), createdAt: event.createdAt })),
      },
      { headers: { "cache-control": "no-store" } },
    );
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
