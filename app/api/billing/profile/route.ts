import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, safeAuthError } from '@/lib/auth'

const headers = { 'cache-control': 'private, no-store', 'content-type': 'application/json' }
const fields = ['billingCompany', 'billingContactName', 'billingContactEmail', 'billingTaxId', 'billingAddress', 'billingCity', 'billingCountry'] as const
type BillingField = typeof fields[number]

function profile(workspace: Record<BillingField, string | null>) {
  return Object.fromEntries(fields.map((field) => [field, workspace[field] || '']))
}

function clean(value: unknown, max: number) {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  return text ? text.slice(0, max) : null
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user?.workspace) return new Response(JSON.stringify({ error: 'يجب تسجيل الدخول أولًا' }), { status: 401, headers })
    const workspace = await prisma.workspace.findUnique({ where: { id: user.workspace.id }, select: { billingCompany: true, billingContactName: true, billingContactEmail: true, billingTaxId: true, billingAddress: true, billingCity: true, billingCountry: true } })
    if (!workspace) return new Response(JSON.stringify({ error: 'مساحة العمل غير موجودة' }), { status: 404, headers })
    return Response.json({ profile: profile(workspace) }, { headers })
  } catch (error) { return safeAuthError(error) }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.workspace) return new Response(JSON.stringify({ error: 'يجب تسجيل الدخول أولًا' }), { status: 401, headers })
    const membership = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: user.workspace.id, userId: user.id } }, select: { role: true } })
    if (!membership || !['OWNER', 'BILLING_MANAGER'].includes(membership.role)) return new Response(JSON.stringify({ error: 'لا تملك صلاحية تعديل ملف الفوترة' }), { status: 403, headers })
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) return new Response(JSON.stringify({ error: 'بيانات الطلب غير صالحة' }), { status: 400, headers })
    const limits: Record<BillingField, number> = { billingCompany: 160, billingContactName: 120, billingContactEmail: 254, billingTaxId: 80, billingAddress: 240, billingCity: 120, billingCountry: 80 }
    const data: Partial<Record<BillingField, string | null>> = {}
    for (const field of fields) {
      if (field in body) {
        const value = clean((body as Record<string, unknown>)[field], limits[field])
        if (value === undefined) return new Response(JSON.stringify({ error: `قيمة ${field} غير صالحة` }), { status: 400, headers })
        data[field] = value
      }
    }
    if (!Object.keys(data).length) return new Response(JSON.stringify({ error: 'أرسل حقلًا واحدًا على الأقل' }), { status: 400, headers })
    if (data.billingContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.billingContactEmail)) return new Response(JSON.stringify({ error: 'بريد ملف الفوترة غير صالح' }), { status: 400, headers })
    const updated = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.update({ where: { id: user.workspace!.id }, data, select: { billingCompany: true, billingContactName: true, billingContactEmail: true, billingTaxId: true, billingAddress: true, billingCity: true, billingCountry: true } })
      await tx.auditLog.create({ data: { actorId: user.id, workspaceId: user.workspace!.id, action: 'UPDATE', entity: 'WorkspaceBillingProfile', entityId: user.workspace!.id, reason: 'billing_profile_update' } })
      return workspace
    })
    return Response.json({ profile: profile(updated) }, { headers })
  } catch (error) { return safeAuthError(error) }
}
