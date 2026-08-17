import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };
const requestReason = "teacher requested future integration; no external call made";

export async function POST(_request: Request, context: Context) {
  const user = await getCurrentUser();
  const { id } = await context.params;
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const link = await prisma.lmsLink.findFirst({ where: { id, workspaceId: user.workspace.id }, select: { id: true } });
  if (!link) return NextResponse.json({ error: "الرابط غير موجود" }, { status: 404 });
  const status = await prisma.$transaction(async (tx) => {
    const existingRequest = await tx.auditLog.findFirst({ where: { workspaceId: user.workspace.id, action: "CREATE", entity: "IntegrationRequest", entityId: id, reason: requestReason }, select: { id: true } });
    if (existingRequest) return "already_recorded" as const;
    await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "CREATE", entity: "IntegrationRequest", entityId: id, reason: requestReason } });
    return "recorded" as const;
  });
  if (status === "already_recorded") return NextResponse.json({ status, message: "تم تسجيل طلب التكامل لهذا الرابط مسبقًا. لن يبدأ أي تكامل قبل توفير API رسمي وموافقة منفصلة." }, { status: 200 });
  return NextResponse.json({ status, message: "تم تسجيل الطلب. لن يبدأ أي تكامل قبل توفير API رسمي وموافقة منفصلة." }, { status: 202 });
}
