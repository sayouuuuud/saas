import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  id: z.string().cuid().optional(),
  all: z.boolean().optional(),
  read: z.boolean().optional(),
}).refine((value) => Boolean(value.id || value.all), { message: "حدد إشعارًا أو كل الإشعارات" });

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers: { "cache-control": "no-store" } });
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25), 1), 50);
    const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
    const rows = await prisma.notification.findMany({ where: { userId: user.id, OR: [{ workspaceId: user.workspace.id }, { workspaceId: null }] }, orderBy: { createdAt: "desc" }, skip: offset, take: limit + 1, select: { id: true, type: true, title: true, body: true, readAt: true, createdAt: true } });
    const hasMore = rows.length > limit;
    const notifications = rows.slice(0, limit);
    const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null, OR: [{ workspaceId: user.workspace.id }, { workspaceId: null }] } });
    return NextResponse.json({ notifications, unread, pagination: { limit, offset, nextOffset: hasMore ? offset + limit : null } }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return safeAuthError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers: { "cache-control": "no-store" } });
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "بيانات الإشعار غير صالحة" }, { status: 400, headers: { "cache-control": "no-store" } });
    const readAt = parsed.data.read === false ? null : new Date();
    const where = parsed.data.all ? { userId: user.id, readAt: null, OR: [{ workspaceId: user.workspace.id }, { workspaceId: null }] } : { id: parsed.data.id, userId: user.id, OR: [{ workspaceId: user.workspace.id }, { workspaceId: null }] };
    const result = await prisma.notification.updateMany({ where, data: { readAt } });
    return NextResponse.json({ updated: result.count }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return safeAuthError(error);
  }
}
