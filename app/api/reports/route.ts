import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: { "content-type": "application/json" } });
    const workspaceId = user.workspace.id;
    const [subscription, invoices, invoiceCount, tickets, links, auditEventCount] = await Promise.all([
      prisma.subscription.findUnique({ where: { workspaceId }, select: { status: true, plan: { select: { name: true } } } }),
      prisma.invoice.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 12, select: { number: true, status: true, amountCents: true, currency: true, createdAt: true } }),
      prisma.invoice.count({ where: { workspaceId } }),
      prisma.supportTicket.count({ where: { workspaceId } }),
      prisma.lmsLink.count({ where: { workspaceId } }),
      prisma.auditLog.count({ where: { workspaceId } }),
    ]);
    return Response.json({
      generatedAt: new Date().toISOString(),
      scope: "saas_only",
      summary: { subscriptionStatus: subscription?.status || null, plan: subscription?.plan.name || null, invoiceCount, ticketCount: tickets, lmsLinkCount: links, auditEventCount },
      invoices,
      educationalMetrics: { status: "unavailable", reason: "لا يوجد مصدر رسمي أو تكامل موثق لبيانات LMS التعليمية" },
    });
  } catch (error) {
    return safeAuthError(error);
  }
}
