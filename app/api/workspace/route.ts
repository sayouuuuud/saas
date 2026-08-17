import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, safeAuthError } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.workspace) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: { "content-type": "application/json" } });
  const workspace = await prisma.workspace.findUnique({ where: { id: user.workspace.id }, include: { plan: true, subscription: { include: { plan: true } }, members: { include: { user: { select: { id: true, name: true, email: true } } } } } });
  return Response.json({ workspace });
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: { "content-type": "application/json" } });
    const membership = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: user.workspace.id, userId: user.id } } });
    if (!membership || !["OWNER", "BILLING_MANAGER"].includes(membership.role)) return new Response(JSON.stringify({ error: "لا تملك صلاحية تعديل مساحة العمل" }), { status: 403 });
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 120) return new Response(JSON.stringify({ error: "اسم مساحة العمل يجب أن يكون بين حرفين و120 حرفًا" }), { status: 400 });
    const workspace = await prisma.workspace.update({ where: { id: user.workspace.id }, data: { name } });
    await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: workspace.id, action: "UPDATE", entity: "Workspace", entityId: workspace.id, reason: "workspace_name_update" } });
    return Response.json({ workspace: { id: workspace.id, name: workspace.name } });
  } catch (error) {
    return safeAuthError(error);
  }
}
