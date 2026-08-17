import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const user = await getCurrentUser();
  const { id } = await context.params;
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const ticket = await prisma.supportTicket.findFirst({ where: { id, workspaceId: user.workspace.id } });
  if (!ticket) return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
  const updated = await prisma.supportTicket.update({ where: { id }, data: { status: "CLOSED" } });
  await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "UPDATE", entity: "SupportTicket", entityId: id, reason: "ticket_closed" } });
  return NextResponse.json({ ticket: updated });
}
