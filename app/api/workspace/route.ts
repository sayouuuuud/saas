import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, safeAuthError } from "@/lib/auth";

const DEFAULT_MEMBER_LIMIT = 50;
const MAX_MEMBER_LIMIT = 50;
const MAX_MEMBER_OFFSET = 10_000;
const noStoreJsonHeaders = { "cache-control": "private, no-store", "content-type": "application/json" };

function parseMemberPage(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedLimit = Number(params.get("memberLimit") || DEFAULT_MEMBER_LIMIT);
  const requestedOffset = Number(params.get("memberOffset") || "0");
  return {
    limit: Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, MAX_MEMBER_LIMIT) : DEFAULT_MEMBER_LIMIT,
    offset: Number.isInteger(requestedOffset) && requestedOffset >= 0 ? Math.min(requestedOffset, MAX_MEMBER_OFFSET) : 0,
  };
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: noStoreJsonHeaders });
    const { limit: memberLimit, offset: memberOffset } = parseMemberPage(request);
    const workspace = await prisma.workspace.findUnique({ where: { id: user.workspace.id }, include: { plan: true, subscription: { include: { plan: true } }, members: { orderBy: { createdAt: "asc" }, skip: memberOffset, take: memberLimit + 1, include: { user: { select: { id: true, name: true, email: true } } } } } });
    if (!workspace) return new Response(JSON.stringify({ error: "مساحة العمل غير موجودة" }), { status: 404, headers: noStoreJsonHeaders });
    const hasMoreMembers = workspace.members.length > memberLimit;
    return Response.json({ workspace: { ...workspace, members: workspace.members.slice(0, memberLimit) }, membersPagination: { limit: memberLimit, offset: memberOffset, hasMore: hasMoreMembers, nextOffset: hasMoreMembers ? memberOffset + memberLimit : null } }, { headers: noStoreJsonHeaders });
  } catch (error) {
    return safeAuthError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: noStoreJsonHeaders });
    const membership = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: user.workspace.id, userId: user.id } } });
    if (!membership || !["OWNER", "BILLING_MANAGER"].includes(membership.role)) return new Response(JSON.stringify({ error: "لا تملك صلاحية تعديل مساحة العمل" }), { status: 403, headers: noStoreJsonHeaders });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return new Response(JSON.stringify({ error: "بيانات الطلب غير صالحة" }), { status: 400, headers: noStoreJsonHeaders });
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 120) return new Response(JSON.stringify({ error: "اسم مساحة العمل يجب أن يكون بين حرفين و120 حرفًا" }), { status: 400, headers: noStoreJsonHeaders });
    const workspace = await prisma.$transaction(async (tx) => {
      const updated = await tx.workspace.update({ where: { id: user.workspace.id }, data: { name } });
      await tx.auditLog.create({ data: { actorId: user.id, workspaceId: updated.id, action: "UPDATE", entity: "Workspace", entityId: updated.id, reason: "workspace_name_update" } });
      return updated;
    });
    return Response.json({ workspace: { id: workspace.id, name: workspace.name } }, { headers: noStoreJsonHeaders });
  } catch (error) {
    return safeAuthError(error);
  }
}
