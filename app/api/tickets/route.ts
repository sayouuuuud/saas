import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  category: z.enum(["BILLING", "SUBSCRIPTION", "ACCOUNT", "LMS_LINK", "INTEGRATION", "USAGE", "SECURITY", "FEATURE_REQUEST", "GENERAL"]).default("GENERAL"),
  subject: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  priority: z.enum(["normal", "high"]).default("normal"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const tickets = await prisma.supportTicket.findMany({ where: { workspaceId: user.workspace.id }, include: { messages: { orderBy: { createdAt: "asc" } } }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "أكمل موضوع الطلب وتفاصيله" }, { status: 400 });
  const number = `SUP-${Date.now().toString().slice(-8)}`;
  const ticket = await prisma.supportTicket.create({ data: { number, workspaceId: user.workspace.id, requesterId: user.id, ...parsed.data, messages: { create: { authorId: user.id, body: parsed.data.description } } }, include: { messages: true } });
  await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "CREATE", entity: "SupportTicket", entityId: ticket.id, reason: "ticket created" } });
  return NextResponse.json({ ticket }, { status: 201 });
}
