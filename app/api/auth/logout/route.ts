import { NextResponse } from "next/server";
import { clearSession, getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace?.id ?? null, action: "LOGOUT", entity: "Session", entityId: user.id, reason: "explicit_logout" } });
    }
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeAuthError(error);
  }
}
