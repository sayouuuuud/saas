import { NextResponse } from "next/server";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: user.workspace.id, userId: user.id } },
    });
    if (!membership || !["OWNER", "BILLING_MANAGER"].includes(membership.role)) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة الاشتراك" }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUnique({ where: { workspaceId: user.workspace!.id } });
      if (!subscription) return { kind: "missing" as const };
      if (subscription.status === "CANCELLED") return { kind: "terminal" as const, subscription };
      if (!subscription.cancelAtPeriodEnd) return { kind: "unchanged" as const, subscription };

      const updated = await tx.subscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: false, cancelledAt: null },
      });
      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          type: "reactivated",
          fromStatus: subscription.status,
          toStatus: subscription.status,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          workspaceId: user.workspace!.id,
          action: "SUBSCRIPTION_CHANGE",
          entity: "Subscription",
          entityId: subscription.id,
          reason: "subscription reactivated",
        },
      });
      return { kind: "updated" as const, subscription: updated };
    });

    if (result.kind === "missing") return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });
    if (result.kind === "terminal") return NextResponse.json({ error: "لا يمكن إعادة تفعيل اشتراك منتهٍ" }, { status: 409 });
    return NextResponse.json({ subscription: result.subscription, unchanged: result.kind === "unchanged" });
  } catch (error) {
    return safeAuthError(error);
  }
}
