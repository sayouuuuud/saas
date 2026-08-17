import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, safeAuthError } from "@/lib/auth";

const headers = { "cache-control": "private, no-store", "content-type": "application/json" };
const allowedRoles = ["OWNER", "BILLING_MANAGER"];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

async function billingActor() {
  const user = await getCurrentUser();
  if (!user?.workspace) return { user: null, membership: null };
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: user.workspace.id, userId: user.id } },
    select: { role: true },
  });
  return { user, membership };
}

function publicMethod(method: { id: string; brand: string; last4: string; expiryMonth: number; expiryYear: number; isDefault: boolean; createdAt: Date }) {
  return {
    id: method.id,
    brand: method.brand,
    last4: method.last4,
    expiryMonth: method.expiryMonth,
    expiryYear: method.expiryYear,
    isDefault: method.isDefault,
    createdAt: method.createdAt,
  };
}

export async function GET() {
  try {
    const { user } = await billingActor();
    if (!user?.workspace) return json({ error: "يجب تسجيل الدخول أولًا" }, 401);
    const methods = await prisma.paymentMethodReference.findMany({
      where: { workspaceId: user.workspace.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      take: 10,
      select: { id: true, brand: true, last4: true, expiryMonth: true, expiryYear: true, isDefault: true, createdAt: true },
    });
    return json({ paymentMethods: methods.map(publicMethod), provider: process.env.PAYMENT_PROVIDER || "unconfigured" });
  } catch (error) {
    return safeAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, membership } = await billingActor();
    if (!user?.workspace) return json({ error: "يجب تسجيل الدخول أولًا" }, 401);
    if (!membership || !allowedRoles.includes(membership.role)) return json({ error: "لا تملك صلاحية إدارة طريقة الدفع" }, 403);
    if ((process.env.PAYMENT_PROVIDER || "mock") !== "mock") return json({ error: "أضف طريقة الدفع من خلال مزود الدفع المهيأ" }, 503);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "بيانات الطلب غير صالحة" }, 400);
    const brand = typeof body.brand === "string" ? body.brand.trim().slice(0, 40) : "";
    const last4 = typeof body.last4 === "string" ? body.last4.trim() : "";
    const expiryMonth = Number(body.expiryMonth);
    const expiryYear = Number(body.expiryYear);
    if (!brand || !/^\d{4}$/.test(last4) || !Number.isInteger(expiryMonth) || expiryMonth < 1 || expiryMonth > 12 || !Number.isInteger(expiryYear) || expiryYear < new Date().getFullYear() || expiryYear > new Date().getFullYear() + 20) {
      return json({ error: "أدخل نوع البطاقة وآخر أربعة أرقام وتاريخ انتهاء صالحًا" }, 400);
    }
    const shouldDefault = body.default === true;
    const method = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.paymentMethodReference.count({ where: { workspaceId: user.workspace.id } });
      const isDefault = shouldDefault || existingCount === 0;
      if (isDefault) await tx.paymentMethodReference.updateMany({ where: { workspaceId: user.workspace.id }, data: { isDefault: false } });
      const created = await tx.paymentMethodReference.create({ data: { workspaceId: user.workspace.id, providerReference: `mock_pm_${randomUUID()}`, brand, last4, expiryMonth, expiryYear, isDefault } });
      await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "CREATE", entity: "PaymentMethodReference", entityId: created.id, reason: "payment_method_reference_added" } });
      return created;
    });
    return json({ paymentMethod: publicMethod(method) }, 201);
  } catch (error) {
    return safeAuthError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, membership } = await billingActor();
    if (!user?.workspace) return json({ error: "يجب تسجيل الدخول أولًا" }, 401);
    if (!membership || !allowedRoles.includes(membership.role)) return json({ error: "لا تملك صلاحية إدارة طريقة الدفع" }, 403);
    const body = await request.json().catch(() => null);
    const id = body && typeof body === "object" && !Array.isArray(body) && typeof body.id === "string" ? body.id : "";
    if (!id) return json({ error: "معرّف طريقة الدفع مطلوب" }, 400);
    await prisma.$transaction(async (tx) => {
      const method = await tx.paymentMethodReference.findFirst({ where: { id, workspaceId: user.workspace.id } });
      if (!method) throw new Error("PAYMENT_METHOD_NOT_FOUND");
      await tx.paymentMethodReference.delete({ where: { id: method.id } });
      if (method.isDefault) {
        const replacement = await tx.paymentMethodReference.findFirst({ where: { workspaceId: user.workspace.id }, orderBy: { createdAt: "desc" } });
        if (replacement) await tx.paymentMethodReference.update({ where: { id: replacement.id }, data: { isDefault: true } });
      }
      await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace.id, action: "DELETE", entity: "PaymentMethodReference", entityId: method.id, reason: "payment_method_reference_removed" } });
    });
    return json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_METHOD_NOT_FOUND") return json({ error: "طريقة الدفع غير موجودة" }, 404);
    return safeAuthError(error);
  }
}
