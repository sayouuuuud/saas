import { getCurrentUser, safeAuthError, staffTwoFactorRequired } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { canAccessStaffSection } from "@/lib/staff-access";

const HEALTH_LIMIT = 30;
const HEALTH_WINDOW_MS = 60_000;
const THRESHOLDS = {
  openTickets: 100,
  pendingDeletionRequests: 0,
  unprocessedWebhooks: 0,
  auditAgeSeconds: 86_400,
} as const;

function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "private, no-store",
      ...init.headers,
    },
  });
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isStaff) return json({ error: "هذه المساحة محمية" }, { status: 403 });
    if (staffTwoFactorRequired(user)) return json({ error: "يجب تفعيل المصادقة الثنائية لحسابات Staff قبل الوصول إلى أدوات الإدارة" }, { status: 428 });
    if (!canAccessStaffSection(user.staffRole, "settings")) return json({ error: "لا تملك صلاحية تنفيذ هذا الإجراء" }, { status: 403 });

    const rate = checkRateLimit(request, "admin-operations-health", HEALTH_LIMIT, HEALTH_WINDOW_MS);
    if (!rate.allowed) return json({ error: "تم تجاوز حد الطلبات" }, { status: 429, headers: rateLimitHeaders(rate) });

    const [openTickets, pendingDeletionRequests, unprocessedWebhooks, lastAudit] = await Promise.all([
      prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"] } } }),
      prisma.dataDeletionRequest.count({ where: { status: { in: ["REQUESTED", "IN_REVIEW", "APPROVED"] } } }),
      prisma.billingWebhookEvent.count({ where: { state: { not: "processed" } } }),
      prisma.auditLog.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    ]);

    const measuredAt = new Date();
    const auditAgeSeconds = lastAudit ? Math.max(0, Math.floor((measuredAt.getTime() - lastAudit.createdAt.getTime()) / 1000)) : null;
    const alerts = [
      ...(openTickets > THRESHOLDS.openTickets ? [{ code: "open_tickets_backlog", severity: "warning", observed: openTickets, threshold: THRESHOLDS.openTickets }] : []),
      ...(pendingDeletionRequests > THRESHOLDS.pendingDeletionRequests ? [{ code: "pending_deletion_review", severity: "warning", observed: pendingDeletionRequests, threshold: THRESHOLDS.pendingDeletionRequests }] : []),
      ...(unprocessedWebhooks > THRESHOLDS.unprocessedWebhooks ? [{ code: "unprocessed_webhooks", severity: "critical", observed: unprocessedWebhooks, threshold: THRESHOLDS.unprocessedWebhooks }] : []),
      ...(auditAgeSeconds !== null && auditAgeSeconds > THRESHOLDS.auditAgeSeconds ? [{ code: "stale_audit_activity", severity: "warning", observed: auditAgeSeconds, threshold: THRESHOLDS.auditAgeSeconds }] : []),
    ];

    return json({
      measuredAt: measuredAt.toISOString(),
      status: alerts.some((alert) => alert.severity === "critical") ? "critical" : alerts.length ? "attention" : "healthy",
      metrics: { openTickets, pendingDeletionRequests, unprocessedWebhooks, lastAuditAt: lastAudit?.createdAt.toISOString() ?? null, auditAgeSeconds },
      thresholds: THRESHOLDS,
      alerts,
      retention: { mode: "manual_review", automaticDeletion: false, scope: "saas_only", deletionRequestReviewRequired: true },
    }, { headers: rateLimitHeaders(rate) });
  } catch (error) {
    return safeAuthError(error);
  }
}
