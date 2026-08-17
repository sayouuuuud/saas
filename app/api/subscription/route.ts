import { NextResponse } from "next/server";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId: user.workspace.id },
      select: {
        id: true,
        status: true,
        billingCycle: true,
        startedAt: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        cancelledAt: true,
        plan: { select: { code: true, name: true, description: true, monthlyCents: true, yearlyCents: true, supportTier: true } },
        events: { select: { id: true, type: true, fromStatus: true, toStatus: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    return NextResponse.json({ subscription });
  } catch (error) {
    return safeAuthError(error);
  }
}
