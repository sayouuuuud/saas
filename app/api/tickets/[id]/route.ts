import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"]).optional(), priority: z.enum(["low", "normal", "high", "urgent"]).optional(), message: z.string().trim().min(2).max(5000).optional() });
const actionSchema = z.object({ action: z.enum(["close", "reopen"]).optional(), message: z.string().trim().min(2).max(5000).optional() });
type Context = { params: Promise<{ id: string }> };

async function ticketForUser(id: string) {
  const user = await getCurrentUser();
  if (!user?.workspace) return { user: null, ticket: null };
  const ticket = await prisma.supportTicket.findFirst({ where: { id, workspaceId: user.workspace.id }, include: { messages: { where: { isInternal: false }, include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } } } });
  return { user, ticket };
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const { user, ticket } = await ticketForUser(id);
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  if (!ticket) return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const { user, ticket } = await ticketForUser(id);
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  if (!ticket) return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.status && !parsed.data.priority && !parsed.data.message)) return NextResponse.json({ error: "بيانات التحديث غير صالحة" }, { status: 400 });
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.supportTicket.update({ where: { id }, data: { ...(parsed.data.status ? { status: parsed.data.status } : {}), ...(parsed.data.priority ? { priority: parsed.data.priority } : {}) }, include: { messages: { where: { isInternal: false }, orderBy: { createdAt: "asc" } } } });
    if (parsed.data.message) await tx.supportMessage.create({ data: { ticketId: id, authorId: user.id, body: parsed.data.message } });
    await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "UPDATE", entity: "SupportTicket", entityId: id, reason: parsed.data.status || (parsed.data.message ? "message_added" : "priority_updated") } });
    return next;
  });
  return NextResponse.json({ ticket: updated });
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const { user, ticket } = await ticketForUser(id);
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  if (!ticket) return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.action && !parsed.data.message)) return NextResponse.json({ error: "بيانات التذكرة غير صالحة" }, { status: 400 });
  const action = parsed.data.action === "close" ? "CLOSED" : parsed.data.action === "reopen" ? "OPEN" : null;
  const message = parsed.data.message || "";
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.supportTicket.update({ where: { id }, data: action ? { status: action } : {} });
    if (message) await tx.supportMessage.create({ data: { ticketId: id, authorId: user.id, body: message } });
    await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "UPDATE", entity: "SupportTicket", entityId: id, reason: action || "message_added" } });
    return next;
  });
  return NextResponse.json({ ticket: updated });
}
