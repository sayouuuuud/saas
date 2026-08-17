import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, safeAuthError } from "@/lib/auth";

const DEFAULT_MEMBER_LIMIT = 50;
const MAX_MEMBER_LIMIT = 50;

function parseMemberLimit(request: Request) {
  const raw = new URL(request.url).searchParams.get("memberLimit");
  const requested = raw ? Number(raw) : DEFAULT_MEMBER_LIMIT;
  return Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_MEMBER_LIMIT) : DEFAULT_MEMBER_LIMIT;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.workspace) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: { "content-type": "application/json" } });
  const memberLimit = parseMemberLimit(request);
  const workspace = await prisma.workspace.findUnique({ where: { id: user.workspace.id }, include: { plan: true, subscription: { include: { plan: true } }, members: { orderBy: { createdAt: "asc" }, take: memberLimit + 1, include: { user: { select: { id: true, name: true, email: true } } } } } });
  if (!workspace) return new Response(JSON.stringify({ error: "مساحة العمل غير موجودة" }), { status: 404, headers: { "content-type": "application/json" } });
  const hasMoreMembers = workspace.members.length > memberLimit;
  return Response.json({ workspace: { ...workspace, members: workspace.members.slice(0, memberLimit) }, membersPagination: { limit: memberLimit, hasMore: hasMoreMembers } });
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: { "content-type": "application/json" } });
    const membership = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: user.workspace.id, userId: user.id } } });
    if (!membership || !["OWNER", "BILLING_MANAGER"].includes(membership.role)) return new Response(JSON.stringify({ error: "لا تملك صلاحية تعديل مساحة العمل" }), { status: 403 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return new Response(JSON.stringify({ error: "بيانات الطلب غير صالحة" }), { status: 400, headers: { "content-type": "application/json" } });
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 120) return new Response(JSON.stringify({ error: "اسم مساحة العمل يجب أن يكون بين حرفين و120 حرفًا" }), { status: 400 });
    const workspace = await prisma.$transaction(async (tx) => {
      const updated = await tx.workspace.update({ where: { id: user.workspace.id }, data: { name } });
      await tx.auditLog.create({ data: { actorId: user.id, workspaceId: updated.id, action: "UPDATE", entity: "Workspace", entityId: updated.id, reason: "workspace_name_update" } });
      return updated;
    });
    return Response.json({ workspace: { id: workspace.id, name: workspace.name } });
  } catch (error) {
    return safeAuthError(error);
  }
}
