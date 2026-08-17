import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"]).optional(), priority: z.enum(["low", "normal", "high", "urgent"]).optional(), message: z.string().trim().min(2).max(5000).optional() });
const actionSchema = z.object({ action: z.enum(["close", "reopen"]).optional(), message: z.string().trim().min(2).max(5000).optional() });
type Context = { params: Promise<{ id: string }> };
type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
type TicketPriority = "low" | "normal" | "high" | "urgent";

const publicTicketInclude = { messages: { where: { isInternal: false }, include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } } } as const;

async function ticketForUser(id: string) {
  const user = await getCurrentUser();
  if (!user?.workspace) return { user: null, ticket: null };
  const ticket = await prisma.supportTicket.findFirst({ where: { id, workspaceId: user.workspace.id }, include: publicTicketInclude });
  return { user, ticket };
}

async function updateTicket({ id, userId, workspaceId, status, priority, message, reason }: { id: string; userId: string; workspaceId: string; status?: TicketStatus; priority?: TicketPriority; message?: string; reason: string }) {
  return prisma.$transaction(async (tx) => {
    await tx.supportTicket.update({ where: { id }, data: { ...(status ? { status } : {}), ...(priority ? { priority } : {}) } });
    if (message) await tx.supportMessage.create({ data: { ticketId: id, authorId: userId, body: message } });
    await tx.auditLog.create({ data: { actorId: userId, workspaceId, action: "UPDATE", entity: "SupportTicket", entityId: id, reason } });
    return tx.supportTicket.findUnique({ where: { id }, include: publicTicketInclude });
  });
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
  const updated = await updateTicket({ id, userId: user.id, workspaceId: user.workspace.id, ...parsed.data, reason: parsed.data.status || (parsed.data.message ? "message_added" : "priority_updated") });
  return NextResponse.json({ ticket: updated });
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const { user, ticket } = await ticketForUser(id);
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  if (!ticket) return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.action && !parsed.data.message)) return NextResponse.json({ error: "بيانات التذكرة غير صالحة" }, { status: 400 });
  const status = parsed.data.action === "close" ? "CLOSED" : parsed.data.action === "reopen" ? "OPEN" : undefined;
  const updated = await updateTicket({ id, userId: user.id, workspaceId: user.workspace.id, status, message: parsed.data.message, reason: status || "message_added" });
  return NextResponse.json({ ticket: updated });
}
