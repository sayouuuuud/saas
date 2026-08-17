import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DailyAuditCount = { date: string; count: bigint | number };

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: { "content-type": "application/json" } });
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const rows = await prisma.$queryRaw<DailyAuditCount[]>`
      SELECT DATE("createdAt") AS "date", COUNT(*) AS "count"
      FROM "AuditLog"
      WHERE "workspaceId" = ${user.workspace.id} AND "createdAt" >= ${start}
      GROUP BY DATE("createdAt")
      ORDER BY "date" ASC
    `;
    return Response.json({
      source: "saas_audit_log",
      accuracy: "exact_for_saas_events",
      history: rows.map((row) => ({ date: row.date, count: Number(row.count) })),
    });
  } catch (error) {
    return safeAuthError(error);
  }
}
