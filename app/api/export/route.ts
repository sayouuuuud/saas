import { NextResponse } from "next/server";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers: { "cache-control": "no-store" } });
    const workspaceId = user.workspace.id;
    const [workspace, subscription, members, invoices, tickets, links, notifications, auditEvents] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspaceId }, select: { id: true, name: true, createdAt: true, owner: { select: { name: true, email: true } }, plan: { select: { code: true, name: true } } } }),
      prisma.subscription.findUnique({ where: { workspaceId }, select: { status: true, billingCycle: true, startedAt: true, currentPeriodStart: true, currentPeriodEnd: true, cancelAtPeriodEnd: true, plan: { select: { code: true, name: true } } } }),
      prisma.workspaceMember.findMany({ where: { workspaceId }, take: 1000, orderBy: { createdAt: "asc" }, select: { role: true, createdAt: true, user: { select: { name: true, email: true, emailVerifiedAt: true } } } }),
      prisma.invoice.findMany({ where: { workspaceId }, take: 1000, orderBy: { createdAt: "desc" }, select: { number: true, status: true, amountCents: true, currency: true, periodStart: true, periodEnd: true, paidAt: true, createdAt: true } }),
      prisma.supportTicket.findMany({ where: { workspaceId }, take: 1000, orderBy: { createdAt: "desc" }, select: { number: true, category: true, subject: true, status: true, priority: true, createdAt: true, updatedAt: true } }),
      prisma.lmsLink.findMany({ where: { workspaceId }, take: 1000, orderBy: { createdAt: "desc" }, select: { displayName: true, publicUrl: true, status: true, lastCheckedAt: true, createdAt: true } }),
      prisma.notification.findMany({ where: { userId: user.id, OR: [{ workspaceId }, { workspaceId: null }] }, take: 1000, orderBy: { createdAt: "desc" }, select: { type: true, title: true, body: true, readAt: true, createdAt: true } }),
      prisma.auditLog.findMany({ where: { workspaceId }, take: 1000, orderBy: { createdAt: "desc" }, select: { action: true, entity: true, entityId: true, reason: true, createdAt: true } }),
    ]);
    await prisma.auditLog.create({ data: { actorId: user.id, workspaceId, action: "EXPORT", entity: "Workspace", entityId: workspaceId, reason: "workspace_data_export" } });
    const payload = { exportedAt: new Date().toISOString(), scope: "saas_only", workspace, subscription, members, invoices, tickets, links, notifications, auditEvents, educationalData: { status: "unavailable", reason: "Centralia does not read or copy LMS educational data without an official integration." } };
    return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="centralia-workspace-export-${workspaceId}.json"`, "cache-control": "no-store" } });
  } catch (error) {
    return safeAuthError(error);
  }
}
