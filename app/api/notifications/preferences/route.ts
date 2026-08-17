import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, safeAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  emailEnabled: z.boolean(),
  productEnabled: z.boolean(),
  billingEnabled: z.boolean(),
});

const headers = { "cache-control": "no-store" };

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers });
    return NextResponse.json({ preferences: { emailEnabled: user.notificationEmailEnabled, productEnabled: user.notificationProductEnabled, billingEnabled: user.notificationBillingEnabled } }, { headers });
  } catch (error) {
    return safeAuthError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401, headers });
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "إعدادات الإشعارات غير صالحة" }, { status: 400, headers });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { notificationEmailEnabled: parsed.data.emailEnabled, notificationProductEnabled: parsed.data.productEnabled, notificationBillingEnabled: parsed.data.billingEnabled } });
    await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace?.id, action: "UPDATE", entity: "NotificationPreferences", entityId: user.id, reason: "user updated SaaS notification preferences" } });
    return NextResponse.json({ preferences: { emailEnabled: updated.notificationEmailEnabled, productEnabled: updated.notificationProductEnabled, billingEnabled: updated.notificationBillingEnabled } }, { headers });
  } catch (error) {
    return safeAuthError(error);
  }
}
