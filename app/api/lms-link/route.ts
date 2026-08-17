import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateExternalHttpsUrl } from "@/lib/url-safety";

const schema = z.object({ displayName: z.string().trim().min(2).max(80), publicUrl: z.string().url(), adminUrl: z.string().url().optional().or(z.literal("")), notes: z.string().max(500).optional() });

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const links = await prisma.lmsLink.findMany({ where: { workspaceId: user.workspace.id }, include: { checks: { orderBy: { checkedAt: "desc" }, take: 5 } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ links });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات الرابط غير صالحة" }, { status: 400 });
  const publicSafe = await validateExternalHttpsUrl(parsed.data.publicUrl);
  const adminSafe = parsed.data.adminUrl ? await validateExternalHttpsUrl(parsed.data.adminUrl) : { ok: true as const };
  if (!publicSafe.ok || !adminSafe.ok) return NextResponse.json({ error: "أدخل روابط HTTPS عامة فقط. لا يمكن حفظ localhost أو العناوين الداخلية." }, { status: 400 });
  const link = await prisma.lmsLink.create({ data: { workspaceId: user.workspace.id, addedByUserId: user.id, displayName: parsed.data.displayName, publicUrl: parsed.data.publicUrl, adminUrl: parsed.data.adminUrl || null, notes: parsed.data.notes || null } });
  await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "CREATE", entity: "LmsLink", entityId: link.id, reason: "teacher added external LMS link" } });
  return NextResponse.json({ link }, { status: 201 });
}
