import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: { "cache-control": "no-store", "content-type": "application/json" } });
    const workspaceId = user.workspace.id;
    const [members, tickets, linkChecks, auditEvents, apiCalls] = await Promise.all([
      prisma.workspaceMember.count({ where: { workspaceId } }),
      prisma.supportTicket.count({ where: { workspaceId } }),
      prisma.lmsLinkCheck.count({ where: { lmsLink: { workspaceId } } }),
      prisma.auditLog.count({ where: { workspaceId } }),
      prisma.auditLog.count({ where: { workspaceId, entity: "IntegrationEvent" } }),
    ]);
    return Response.json({
      measuredAt: new Date().toISOString(),
      metrics: {
        teamMembers: { value: members, source: "saas_database", accuracy: "exact" },
        supportTickets: { value: tickets, source: "saas_database", accuracy: "exact" },
        linkChecks: { value: linkChecks, source: "saas_database", accuracy: "exact" },
        auditEvents: { value: auditEvents, source: "saas_database", accuracy: "exact" },
        integrationApiCalls: { value: apiCalls, source: "saas_database", accuracy: "exact" },
        students: { value: null, source: null, accuracy: "unavailable_without_official_source" },
        videos: { value: null, source: null, accuracy: "unavailable_without_official_source" },
        storage: { value: null, source: null, accuracy: "unavailable_without_official_source" },
        bandwidth: { value: null, source: null, accuracy: "unavailable_without_official_source" },
        cpuRam: { value: null, source: null, accuracy: "unavailable_without_official_source" },
      },
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return safeAuthError(error);
  }
}
