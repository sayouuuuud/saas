import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.workspace) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const subscription = await prisma.subscription.findUnique({ where: { workspaceId: user.workspace.id } });
  if (!subscription) return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });
  const updated = await prisma.subscription.update({ where: { id: subscription.id }, data: { cancelAtPeriodEnd: true } });
  await prisma.subscriptionEvent.create({ data: { subscriptionId: subscription.id, type: "cancel_at_period_end", fromStatus: subscription.status, toStatus: subscription.status } });
  await prisma.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "SUBSCRIPTION_CHANGE", entity: "Subscription", entityId: subscription.id, reason: "cancel at period end" } });
  return NextResponse.json({ subscription: updated });
}
