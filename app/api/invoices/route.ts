import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 50;

function parseLimit(request: Request) {
  const raw = new URL(request.url).searchParams.get("limit");
  const requested = raw ? Number(raw) : DEFAULT_LIMIT;
  return Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : DEFAULT_LIMIT;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const limit = parseLimit(request);
  const rows = await prisma.invoice.findMany({ where: { workspaceId: user.workspace.id }, orderBy: { createdAt: "desc" }, take: limit + 1 });
  const hasMore = rows.length > limit;
  return NextResponse.json({ invoices: rows.slice(0, limit), pagination: { limit, hasMore } });
}
