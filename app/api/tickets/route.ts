import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 50;
const MAX_OFFSET = 10_000;

function parsePage(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedLimit = Number(params.get("limit") || DEFAULT_LIMIT);
  const requestedOffset = Number(params.get("offset") || "0");
  return {
    limit: Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, MAX_LIMIT) : DEFAULT_LIMIT,
    offset: Number.isInteger(requestedOffset) && requestedOffset >= 0 ? Math.min(requestedOffset, MAX_OFFSET) : 0,
  };
}

const schema = z.object({
  category: z.enum(["BILLING", "SUBSCRIPTION", "ACCOUNT", "LMS_LINK", "INTEGRATION", "USAGE", "SECURITY", "FEATURE_REQUEST", "GENERAL"]).default("GENERAL"),
  subject: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  priority: z.enum(["normal", "high"]).default("normal"),
});

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    const { limit, offset } = parsePage(request);
    const tickets = await prisma.supportTicket.findMany({
      where: { workspaceId: user.workspace.id },
      orderBy: { updatedAt: "desc" },
      skip: offset,
      take: limit + 1,
      select: {
        id: true,
        number: true,
        category: true,
        subject: true,
        description: true,
        status: true,
        priority: true,
        requesterId: true,
        createdAt: true,
        updatedAt: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, createdAt: true, isInternal: true } },
        _count: { select: { messages: true } },
      },
    });
    const hasMore = tickets.length > limit;
    return NextResponse.json({ tickets: tickets.slice(0, limit), pagination: { limit, offset, hasMore, nextOffset: hasMore ? offset + limit : null } });
  } catch (error) {
    return safeAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "أكمل موضوع الطلب وتفاصيله" }, { status: 400 });
    const number = `SUP-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.supportTicket.create({ data: { number, workspaceId: user.workspace.id, requesterId: user.id, ...parsed.data, messages: { create: { authorId: user.id, body: parsed.data.description } } }, include: { messages: true } });
      await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "CREATE", entity: "SupportTicket", entityId: created.id, reason: "ticket created" } });
      return created;
    });
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return safeAuthError(error);
  }
}
