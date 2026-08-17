import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const user = await getCurrentUser();
  const { id } = await context.params;
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const link = await prisma.lmsLink.findFirst({ where: { id, workspaceId: user.workspace.id } });
  if (!link) return NextResponse.json({ error: "الرابط غير موجود" }, { status: 404 });
  await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "CREATE", entity: "IntegrationRequest", entityId: id, reason: "teacher requested future integration; no external call made" } });
  return NextResponse.json({ status: "recorded", message: "تم تسجيل الطلب. لن يبدأ أي تكامل قبل توفير API رسمي وموافقة منفصلة." }, { status: 202 });
}
