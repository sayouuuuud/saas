import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ planCode: z.string().trim().min(2).max(40), billingCycle: z.enum(["MONTHLY", "YEARLY"]), couponCode: z.string().trim().toUpperCase().min(3).max(40).optional() });

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: user.workspace.id, userId: user.id } },
    });
    if (!membership || !["OWNER", "BILLING_MANAGER"].includes(membership.role)) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة الفوترة" }, { status: 403 });
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "خطة أو دورة فوترة غير صالحة" }, { status: 400 });
    const plan = await prisma.plan.findUnique({ where: { code: parsed.data.planCode } });
    if (!plan || !plan.active) return NextResponse.json({ error: "الخطة غير متاحة" }, { status: 404 });
    if (process.env.PAYMENT_PROVIDER !== "mock") return NextResponse.json({ error: "بوابة الدفع غير مهيأة. أضف مزود دفع معتمد قبل تفعيل الاشتراكات." }, { status: 503 });

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (parsed.data.billingCycle === "YEARLY" ? 12 : 1));
    const listAmountCents = parsed.data.billingCycle === "YEARLY" ? plan.yearlyCents : plan.monthlyCents;
    const coupon = parsed.data.couponCode ? await prisma.coupon.findUnique({ where: { code: parsed.data.couponCode } }) : null;
    if (parsed.data.couponCode && (!coupon || !coupon.active || (coupon.expiresAt && coupon.expiresAt <= now) || (coupon.maxRedemptions !== null && coupon.redeemedCount >= coupon.maxRedemptions))) return NextResponse.json({ error: "كود الخصم غير صالح أو منتهي" }, { status: 400 });
    const discountCents = coupon ? Math.min(listAmountCents, Math.floor(listAmountCents * coupon.percentOff / 100)) : 0;
    const amountCents = listAmountCents - discountCents;
    const invoiceNumber = `INV-${crypto.randomUUID()}`;
    const providerEvent = `mock_${crypto.randomUUID()}`;
    const subscription = await prisma.$transaction(async (tx) => {
      const current = await tx.subscription.findUnique({ where: { workspaceId: user.workspace!.id } });
      const next = current
        ? await tx.subscription.update({ where: { id: current.id }, data: { planId: plan.id, status: "ACTIVE", billingCycle: parsed.data.billingCycle, currentPeriodStart: now, currentPeriodEnd: periodEnd, cancelAtPeriodEnd: false, cancelledAt: null } })
        : await tx.subscription.create({ data: { workspaceId: user.workspace!.id, planId: plan.id, status: "ACTIVE", billingCycle: parsed.data.billingCycle, currentPeriodStart: now, currentPeriodEnd: periodEnd } });
      await tx.workspace.update({ where: { id: user.workspace!.id }, data: { planId: plan.id } });
      await tx.subscriptionEvent.create({ data: { subscriptionId: next.id, type: "mock_payment_confirmed", fromStatus: current?.status ?? null, toStatus: "ACTIVE", metadataJson: JSON.stringify({ couponCode: coupon?.code || null, discountCents }) } });
      await tx.invoice.create({ data: { workspaceId: user.workspace!.id, subscriptionId: next.id, number: invoiceNumber, periodStart: now, periodEnd, amountCents, currency: "USD", status: "PAID", paidAt: now, lineItemsJson: JSON.stringify([{ description: `${plan.name} / ${parsed.data.billingCycle}`, amountCents: listAmountCents }, ...(coupon ? [{ description: `Coupon ${coupon.code} / ${coupon.percentOff}%`, amountCents: -discountCents }] : [])]), payments: { create: { providerEvent, amountCents, status: "paid", paidAt: now } } } });
      if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { redeemedCount: { increment: 1 } } });
      await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace!.id, action: "PAYMENT", entity: "Subscription", entityId: next.id, reason: `local mock provider only${coupon ? `; coupon ${coupon.code}` : ""}` } });
      return next;
    });
    return NextResponse.json({ subscription, mode: "mock", coupon: coupon ? { code: coupon.code, percentOff: coupon.percentOff, discountCents } : null, amountCents, modeWarning: "هذه العملية متاحة محليًا فقط. فعّل مزود دفع حقيقي قبل الإنتاج." });
  } catch (error) {
    return safeAuthError(error);
  }
}
