import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ planCode: z.string().min(2), billingCycle: z.enum(["MONTHLY", "YEARLY"]) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "خطة أو دورة فوترة غير صالحة" }, { status: 400 });
  const plan = await prisma.plan.findUnique({ where: { code: parsed.data.planCode } });
  if (!plan || !plan.active) return NextResponse.json({ error: "الخطة غير متاحة" }, { status: 404 });
  if (process.env.PAYMENT_PROVIDER !== "mock") return NextResponse.json({ error: "بوابة الدفع غير مهيأة. أضف مزود دفع معتمد قبل تفعيل الاشتراكات." }, { status: 503 });
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + (parsed.data.billingCycle === "YEARLY" ? 12 : 1));
  const amountCents = parsed.data.billingCycle === "YEARLY" ? plan.yearlyCents : plan.monthlyCents;
  const subscription = await prisma.$transaction(async (tx) => {
    const current = await tx.subscription.findUnique({ where: { workspaceId: user.workspace!.id } });
    const next = current
      ? await tx.subscription.update({ where: { id: current.id }, data: { planId: plan.id, status: "ACTIVE", billingCycle: parsed.data.billingCycle, currentPeriodStart: now, currentPeriodEnd: periodEnd, cancelAtPeriodEnd: false } })
      : await tx.subscription.create({ data: { workspaceId: user.workspace!.id, planId: plan.id, status: "ACTIVE", billingCycle: parsed.data.billingCycle, currentPeriodStart: now, currentPeriodEnd: periodEnd } });
    await tx.workspace.update({ where: { id: user.workspace!.id }, data: { planId: plan.id } });
    await tx.subscriptionEvent.create({ data: { subscriptionId: next.id, type: "mock_payment_confirmed", fromStatus: current?.status ?? null, toStatus: "ACTIVE" } });
    await tx.invoice.create({ data: { workspaceId: user.workspace!.id, subscriptionId: next.id, number: `INV-${Date.now()}`, periodStart: now, periodEnd, amountCents, currency: "USD", status: "PAID", paidAt: now, lineItemsJson: JSON.stringify([{ description: `${plan.name} / ${parsed.data.billingCycle}`, amountCents }]), payments: { create: { providerEvent: `mock_${Date.now()}`, amountCents, status: "paid", paidAt: now } } } });
    await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace!.id, action: "PAYMENT", entity: "Subscription", entityId: next.id, reason: "local mock provider only" } });
    return next;
  });
  return NextResponse.json({ subscription, mode: "mock", warning: "هذه العملية متاحة محليًا فقط. فعّل مزود دفع حقيقي قبل الإنتاج." });
}
