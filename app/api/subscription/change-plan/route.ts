import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ planCode: z.string().trim().min(2).max(40), billingCycle: z.enum(["MONTHLY", "YEARLY"]) });

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: user.workspace.id, userId: user.id } },
    });
    if (!membership || !["OWNER", "BILLING_MANAGER"].includes(membership.role)) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة الاشتراك" }, { status: 403 });
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "بيانات تغيير الباقة غير صالحة" }, { status: 400 });

    const plan = await prisma.plan.findUnique({ where: { code: parsed.data.planCode } });
    if (!plan || !plan.active) return NextResponse.json({ error: "الخطة المطلوبة غير متاحة" }, { status: 404 });

    const current = await prisma.subscription.findUnique({ where: { workspaceId: user.workspace.id } });
    if (!current) return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });
    if (current.status === "CANCELLED") return NextResponse.json({ error: "الاشتراك منتهٍ؛ أنشئ اشتراكًا جديدًا لإعادة التفعيل" }, { status: 409 });
    if (current.planId === plan.id && current.billingCycle === parsed.data.billingCycle) {
      return NextResponse.json({ subscription: current, unchanged: true });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const locked = await tx.subscription.findUnique({ where: { id: current.id } });
      if (!locked) throw new Error("SUBSCRIPTION_NOT_FOUND");
      if (locked.status === "CANCELLED") throw new Error("SUBSCRIPTION_TERMINAL");
      const next = await tx.subscription.update({
        where: { id: locked.id },
        data: {
          planId: plan.id,
          billingCycle: parsed.data.billingCycle,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
        },
      });
      await tx.workspace.update({ where: { id: user.workspace!.id }, data: { planId: plan.id } });
      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: locked.id,
          type: "plan_changed",
          fromStatus: locked.status,
          toStatus: next.status,
          metadataJson: JSON.stringify({ fromPlanId: locked.planId, toPlanId: plan.id, billingCycle: parsed.data.billingCycle }),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          workspaceId: user.workspace!.id,
          action: "SUBSCRIPTION_CHANGE",
          entity: "Subscription",
          entityId: locked.id,
          reason: `changed to ${plan.code}`,
        },
      });
      return next;
    });
    return NextResponse.json({ subscription: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "SUBSCRIPTION_NOT_FOUND") return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });
    if (error instanceof Error && error.message === "SUBSCRIPTION_TERMINAL") return NextResponse.json({ error: "الاشتراك منتهٍ؛ أنشئ اشتراكًا جديدًا لإعادة التفعيل" }, { status: 409 });
    return safeAuthError(error);
  }
}
