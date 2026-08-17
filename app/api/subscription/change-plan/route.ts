import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ planCode: z.string().min(2), billingCycle: z.enum(["MONTHLY", "YEARLY"]) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات تغيير الباقة غير صالحة" }, { status: 400 });
  const plan = await prisma.plan.findUnique({ where: { code: parsed.data.planCode } });
  const current = await prisma.subscription.findUnique({ where: { workspaceId: user.workspace.id } });
  if (!plan || !current) return NextResponse.json({ error: "الخطة أو الاشتراك غير موجود" }, { status: 404 });
  if (current.planId === plan.id && current.billingCycle === parsed.data.billingCycle) return NextResponse.json({ subscription: current, unchanged: true });
  const oldPlan = current.planId;
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.subscription.update({ where: { id: current.id }, data: { planId: plan.id, billingCycle: parsed.data.billingCycle, status: current.status === "CANCELLED" ? "ACTIVE" : current.status, cancelAtPeriodEnd: false } });
    await tx.workspace.update({ where: { id: user.workspace!.id }, data: { planId: plan.id } });
    await tx.subscriptionEvent.create({ data: { subscriptionId: current.id, type: "plan_changed", fromStatus: current.status, toStatus: next.status, metadataJson: JSON.stringify({ fromPlanId: oldPlan, toPlanId: plan.id }) } });
    await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace!.id, action: "SUBSCRIPTION_CHANGE", entity: "Subscription", entityId: current.id, reason: `changed to ${plan.code}` } });
    return next;
  });
  return NextResponse.json({ subscription: updated });
}
