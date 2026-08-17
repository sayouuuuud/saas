import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  if (!eventId) return NextResponse.json({ error: "event id is required" }, { status: 400 });
  const signatureValid = validSignature(rawBody, signature);
  const existing = await prisma.billingWebhookEvent.findUnique({ where: { eventId } });
  if (existing?.state === "processed") return NextResponse.json({ ok: true, duplicate: true });
  const event = await prisma.billingWebhookEvent.upsert({ where: { eventId }, update: { signatureValid, state: signatureValid ? "received" : "rejected" }, create: { provider: "configured", eventId, signatureValid, state: signatureValid ? "received" : "rejected", payloadHash: crypto.createHash("sha256").update(rawBody).digest("hex") } });
  if (!signatureValid) return NextResponse.json({ error: "invalid signature", eventId: event.id }, { status: 401 });
  let payload: { type?: string; workspaceId?: string; invoiceId?: string; amountCents?: number };
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid payload shape");
    payload = parsed as { type?: string; workspaceId?: string; invoiceId?: string; amountCents?: number };
  } catch {
    await prisma.billingWebhookEvent.update({ where: { id: event.id }, data: { state: "rejected", errorCode: "invalid_json" } });
    return NextResponse.json({ error: "invalid JSON payload" }, { status: 400 });
  }
  if (payload.type !== "payment.succeeded" || !payload.workspaceId) return NextResponse.json({ ok: true, ignored: true });
  const subscription = await prisma.subscription.findUnique({ where: { workspaceId: payload.workspaceId } });
  if (!subscription) return NextResponse.json({ error: "subscription not found" }, { status: 404 });
  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE" } });
    if (payload.invoiceId) await tx.invoice.updateMany({ where: { id: payload.invoiceId, workspaceId: payload.workspaceId }, data: { status: "PAID", paidAt: new Date() } });
    await tx.billingWebhookEvent.update({ where: { id: event.id }, data: { state: "processed", processedAt: new Date() } });
    await tx.subscriptionEvent.create({ data: { subscriptionId: subscription.id, type: payload.type!, fromStatus: subscription.status, toStatus: "ACTIVE", metadataJson: JSON.stringify({ source: "billing_webhook", eventId }) } });
  });
  return NextResponse.json({ ok: true });
}
