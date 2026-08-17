import { NextResponse } from "next/server";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkExternalUrl } from "@/lib/url-safety";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    const link = await prisma.lmsLink.findFirst({ where: { id, workspaceId: user.workspace.id } });
    if (!link) return NextResponse.json({ error: "الرابط غير موجود" }, { status: 404 });
    const result = await checkExternalUrl(link.publicUrl);
    const checkedAt = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      await tx.lmsLinkCheck.create({ data: { lmsLinkId: id, status: result.status, statusCode: result.statusCode, durationMs: result.durationMs, safeMessage: result.safeMessage, checkedAt } });
      const next = await tx.lmsLink.update({ where: { id }, data: { status: result.status, lastCheckedAt: checkedAt, lastErrorCode: result.status === "REACHABLE" ? null : result.safeMessage } });
      await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "LINK_CHECK", entity: "LmsLink", entityId: id, reason: result.safeMessage } });
      return next;
    });
    return NextResponse.json({ link: updated, check: result });
  } catch (error) {
    return safeAuthError(error);
  }
}
