import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
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

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const { limit, offset } = parsePage(request);
  const rows = await prisma.invoice.findMany({ where: { workspaceId: user.workspace.id }, orderBy: { createdAt: "desc" }, skip: offset, take: limit + 1 });
  const hasMore = rows.length > limit;
  return NextResponse.json({ invoices: rows.slice(0, limit), pagination: { limit, offset, hasMore, nextOffset: hasMore ? offset + limit : null } });
}
