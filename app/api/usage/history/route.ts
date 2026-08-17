import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.workspace) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: { "content-type": "application/json" } });
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const events = await prisma.auditLog.findMany({ where: { workspaceId: user.workspace.id, createdAt: { gte: start } }, select: { createdAt: true, entity: true, action: true }, orderBy: { createdAt: "asc" } });
  const grouped = new Map<string, number>();
  for (const event of events) {
    const day = event.createdAt.toISOString().slice(0, 10);
    grouped.set(day, (grouped.get(day) || 0) + 1);
  }
  return Response.json({ source: "saas_audit_log", accuracy: "exact_for_saas_events", history: Array.from(grouped, ([date, count]) => ({ date, count })) });
}
