import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  type: z.string().min(1).max(80),
  workspaceId: z.string().min(1).max(100).optional(),
  invoiceId: z.string().min(1).max(100).optional(),
  amountCents: z.number().int().nonnegative().optional(),
});

function validSignature(rawBody: string, signature: string | null) {
  const secret = process.env.BILLING_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = Buffer.from(signature, "utf8");
  const wanted = Buffer.from(expected, "utf8");
  return actual.length === wanted.length && crypto.timingSafeEqual(actual, wanted);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-billing-signature");
  const eventId = request.headers.get("x-billing-event-id");
  if (!eventId || eventId.length > 160) return NextResponse.json({ error: "event id is required" }, { status: 400 });

  const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");
  const signatureValid = validSignature(rawBody, signature);
  const existing = await prisma.billingWebhookEvent.findUnique({ where: { eventId } });
  if (existing?.payloadHash && existing.payloadHash !== payloadHash) {
    await prisma.billingWebhookEvent.update({ where: { id: existing.id }, data: { signatureValid, state: "rejected", errorCode: "event_payload_mismatch" } });
    return NextResponse.json({ error: "event id was reused with a different payload" }, { status: 409 });
  }
  if (existing?.state === "processed" || existing?.state === "ignored") return NextResponse.json({ ok: true, duplicate: true });

  const event = await prisma.billingWebhookEvent.upsert({
    where: { eventId },
    update: { signatureValid, state: signatureValid ? "received" : "rejected", errorCode: null, payloadHash },
    create: { provider: "configured", eventId, signatureValid, state: signatureValid ? "received" : "rejected", payloadHash },
  });
  if (!signatureValid) return NextResponse.json({ error: "invalid signature", eventId: event.id }, { status: 401 });

  let payload: z.infer<typeof payloadSchema>;
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    const result = payloadSchema.safeParse(parsed);
    if (!result.success) throw new Error("invalid payload shape");
    payload = result.data;
  } catch {
    await prisma.billingWebhookEvent.update({ where: { id: event.id }, data: { state: "rejected", errorCode: "invalid_json" } });
    return NextResponse.json({ error: "invalid JSON payload" }, { status: 400 });
  }

  if (payload.type !== "payment.succeeded") {
    await prisma.billingWebhookEvent.update({ where: { id: event.id }, data: { state: "ignored", processedAt: new Date() } });
    return NextResponse.json({ ok: true, ignored: true });
  }
  if (!payload.workspaceId) {
    await prisma.billingWebhookEvent.update({ where: { id: event.id }, data: { state: "rejected", errorCode: "workspace_required" } });
    return NextResponse.json({ error: "workspace id is required" }, { status: 400 });
  }

  const subscription = await prisma.subscription.findUnique({ where: { workspaceId: payload.workspaceId } });
  if (!subscription) {
    await prisma.billingWebhookEvent.update({ where: { id: event.id }, data: { state: "rejected", errorCode: "subscription_not_found" } });
    return NextResponse.json({ error: "subscription not found" }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (payload.invoiceId) {
        const invoice = await tx.invoice.findFirst({ where: { id: payload.invoiceId, workspaceId: payload.workspaceId } });
        if (!invoice) throw new Error("INVOICE_NOT_FOUND");
        if (payload.amountCents !== undefined && payload.amountCents !== invoice.amountCents) throw new Error("INVOICE_AMOUNT_MISMATCH");
        await tx.invoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt: new Date() } });
      }
      await tx.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE", cancelAtPeriodEnd: false, cancelledAt: null } });
      await tx.billingWebhookEvent.update({ where: { id: event.id }, data: { state: "processed", processedAt: new Date(), errorCode: null } });
      await tx.subscriptionEvent.create({ data: { subscriptionId: subscription.id, type: payload.type, fromStatus: subscription.status, toStatus: "ACTIVE", metadataJson: JSON.stringify({ source: "billing_webhook", eventId }) } });
      await tx.auditLog.create({ data: { actorId: null, workspaceId: payload.workspaceId, action: "PAYMENT", entity: "Subscription", entityId: subscription.id, reason: "billing_webhook_payment_succeeded", metadataJson: JSON.stringify({ eventId, invoiceId: payload.invoiceId ?? null, amountCents: payload.amountCents ?? null }) } });
    });
  } catch (error) {
    const errorCode = error instanceof Error && error.message === "INVOICE_NOT_FOUND" ? "invoice_not_found" : error instanceof Error && error.message === "INVOICE_AMOUNT_MISMATCH" ? "invoice_amount_mismatch" : "processing_failed";
    await prisma.billingWebhookEvent.update({ where: { id: event.id }, data: { state: "rejected", errorCode } }).catch(() => undefined);
    if (errorCode === "invoice_not_found") return NextResponse.json({ error: "invoice not found" }, { status: 404 });
    if (errorCode === "invoice_amount_mismatch") return NextResponse.json({ error: "invoice amount mismatch" }, { status: 409 });
    return NextResponse.json({ error: "webhook processing failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
