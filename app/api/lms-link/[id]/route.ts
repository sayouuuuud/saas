import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateExternalHttpsUrl } from "@/lib/url-safety";

const patchSchema = z.object({ displayName: z.string().trim().min(2).max(80).optional(), publicUrl: z.string().url().optional(), adminUrl: z.string().url().nullable().optional(), notes: z.string().max(500).nullable().optional() });

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    const link = await prisma.lmsLink.findFirst({ where: { id, workspaceId: user.workspace.id } });
    if (!link) return NextResponse.json({ error: "الرابط غير موجود" }, { status: 404 });
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "بيانات الرابط غير صالحة" }, { status: 400 });
    if (parsed.data.publicUrl && !(await validateExternalHttpsUrl(parsed.data.publicUrl)).ok) return NextResponse.json({ error: "الرابط يجب أن يكون HTTPS خارجيًا وآمنًا" }, { status: 400 });
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.lmsLink.update({ where: { id }, data: { ...parsed.data, status: parsed.data.publicUrl && parsed.data.publicUrl !== link.publicUrl ? "NOT_CHECKED" : undefined, lastCheckedAt: parsed.data.publicUrl && parsed.data.publicUrl !== link.publicUrl ? null : undefined } });
      await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "UPDATE", entity: "LmsLink", entityId: id, reason: "link updated" } });
      return next;
    });
    return NextResponse.json({ link: updated });
  } catch (error) {
    return safeAuthError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    const link = await prisma.lmsLink.findFirst({ where: { id, workspaceId: user.workspace.id } });
    if (!link) return NextResponse.json({ error: "الرابط غير موجود" }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.lmsLink.delete({ where: { id } });
      await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "DELETE", entity: "LmsLink", entityId: id, reason: "link deleted" } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeAuthError(error);
  }
}
