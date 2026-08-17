import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };
const schema = z.object({ body: z.string().trim().min(2).max(5000) });

export async function POST(request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
  const { id } = await context.params;
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const ticket = await prisma.supportTicket.findFirst({ where: { id, workspaceId: user.workspace.id } });
  if (!ticket) return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "نص الرسالة غير صالح" }, { status: 400 });
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.supportMessage.create({ data: { ticketId: id, authorId: user.id, body: parsed.data.body } });
    await tx.supportTicket.update({ where: { id }, data: { status: "OPEN" } });
    await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "UPDATE", entity: "SupportTicket", entityId: id, reason: "message_added" } });
    return created;
  });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return safeAuthError(error);
  }
}
