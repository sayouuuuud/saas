import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, safeAuthError } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: { "content-type": "application/json" } });
  return Response.json({ user: { id: user.id, name: user.name, email: user.email, emailVerifiedAt: user.emailVerifiedAt, createdAt: user.createdAt } });
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return new Response(JSON.stringify({ error: "يجب تسجيل الدخول أولًا" }), { status: 401, headers: { "content-type": "application/json" } });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return new Response(JSON.stringify({ error: "بيانات الطلب غير صالحة" }), { status: 400, headers: { "content-type": "application/json" } });
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    if (name !== undefined && (name.length < 2 || name.length > 120)) return new Response(JSON.stringify({ error: "الاسم يجب أن يكون بين حرفين و120 حرفًا" }), { status: 400 });
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response(JSON.stringify({ error: "صيغة البريد الإلكتروني غير صحيحة" }), { status: 400 });
    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return new Response(JSON.stringify({ error: "البريد الإلكتروني مستخدم بالفعل" }), { status: 409 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({ where: { id: user.id }, data: { ...(name !== undefined ? { name } : {}), ...(email !== undefined ? { email, emailVerifiedAt: null } : {}) } });
      if (user.workspace) await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "UPDATE", entity: "User", entityId: user.id, reason: "profile_update" } });
      return updatedUser;
    });
    return Response.json({ user: { id: updated.id, name: updated.name, email: updated.email, emailVerifiedAt: updated.emailVerifiedAt } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return new Response(JSON.stringify({ error: "البريد الإلكتروني مستخدم بالفعل" }), { status: 409, headers: { "content-type": "application/json" } });
    return safeAuthError(error);
  }
}
