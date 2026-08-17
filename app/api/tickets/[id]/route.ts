import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"]).optional(), priority: z.enum(["low", "normal", "high", "urgent"]).optional(), message: z.string().trim().min(2).max(5000).optional() });
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  const { id } = await context.params;
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const ticket = await prisma.supportTicket.findFirst({ where: { id, workspaceId: user.workspace.id } });
  if (!ticket) return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات التحديث غير صالحة" }, { status: 400 });
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.supportTicket.update({ where: { id }, data: { status: parsed.data.status, priority: parsed.data.priority } });
    if (parsed.data.message) await tx.supportMessage.create({ data: { ticketId: id, authorId: user.id, body: parsed.data.message } });
    await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "TICKET_UPDATE", entity: "SupportTicket", entityId: id, reason: parsed.data.status || "message added" } });
    return next;
  });
  return NextResponse.json({ ticket: updated });
}
