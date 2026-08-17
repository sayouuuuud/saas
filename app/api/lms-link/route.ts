import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateExternalHttpsUrl } from "@/lib/url-safety";

const schema = z.object({ displayName: z.string().trim().min(2).max(80), publicUrl: z.string().url(), adminUrl: z.string().url().optional().or(z.literal("")), notes: z.string().max(500).optional() });
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
  const rows = await prisma.lmsLink.findMany({ where: { workspaceId: user.workspace.id }, include: { checks: { orderBy: { checkedAt: "desc" }, take: 5 } }, orderBy: { createdAt: "desc" }, take: limit + 1 });
  const hasMore = rows.length > limit;
  return NextResponse.json({ links: rows.slice(0, limit), pagination: { limit, hasMore } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات الرابط غير صالحة" }, { status: 400 });
  const publicSafe = await validateExternalHttpsUrl(parsed.data.publicUrl);
  const adminSafe = parsed.data.adminUrl ? await validateExternalHttpsUrl(parsed.data.adminUrl) : { ok: true as const };
  if (!publicSafe.ok || !adminSafe.ok) return NextResponse.json({ error: "أدخل روابط HTTPS عامة فقط. لا يمكن حفظ localhost أو العناوين الداخلية." }, { status: 400 });
  const link = await prisma.$transaction(async (tx) => {
    const created = await tx.lmsLink.create({ data: { workspaceId: user.workspace.id, addedByUserId: user.id, displayName: parsed.data.displayName, publicUrl: parsed.data.publicUrl, adminUrl: parsed.data.adminUrl || null, notes: parsed.data.notes || null } });
    await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "CREATE", entity: "LmsLink", entityId: created.id, reason: "teacher added external LMS link" } });
    return created;
  });
  return NextResponse.json({ link }, { status: 201 });
}
