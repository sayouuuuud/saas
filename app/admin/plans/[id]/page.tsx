import Link from 'next/link'
import { ArrowRight, CreditCard, ShieldCheck } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseJson(value: string) {
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
  } catch { return {} }
}

export default async function AdminPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const staff = await getCurrentUser()
  if (!staff || !staff.isStaff) return <main className="admin-guard"><ShieldCheck size={28} /><h1>هذه المساحة محمية</h1><p>يلزم حساب Staff مصرح للوصول إلى تفاصيل الخطط.</p><Link href="/dashboard" className="button button-dark"><ArrowRight size={14} /> العودة للوحة التحكم</Link></main>
  const plan = await prisma.plan.findUnique({ where: { id }, select: { id: true, code: true, name: true, description: true, monthlyCents: true, yearlyCents: true, trialDays: true, supportTier: true, active: true, featuresJson: true, limitsJson: true, createdAt: true, updatedAt: true, _count: { select: { subscriptions: true, workspaces: true } } } })
  if (!plan) return <main className="admin-guard"><h1>الخطة غير موجودة</h1><p>لم يتم العثور على خطة SaaS بهذا المعرّف.</p><Link href="/admin/plans" className="button button-dark"><ArrowRight size={14} /> العودة للخطط</Link></main>
  const features = parseJson(plan.featuresJson)
  const limits = parseJson(plan.limitsJson)
  return <main className="admin-page"><header className="admin-header section-container"><Link href="/admin/plans" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><div><span className="section-eyebrow"><span className="eyebrow-dot" />تفاصيل خطة SaaS</span><h1>{plan.name} <em>بشكل قابل للمراجعة.</em></h1></div><span className="staff-badge"><ShieldCheck size={13} /> Staff</span></header><section className="admin-content section-container"><div className="admin-panel"><div className="admin-panel-heading"><div><b>{plan.name} · {plan.code}</b><span>{plan.description}</span></div><CreditCard size={17} /></div><div className="dashboard-metrics usage-metrics"><article className="dash-card"><span>السعر الشهري</span><strong>{(plan.monthlyCents / 100).toFixed(2)}</strong><small>USD حسب كتالوج SaaS</small></article><article className="dash-card"><span>السعر السنوي</span><strong>{(plan.yearlyCents / 100).toFixed(2)}</strong><small>دورة سنوية</small></article><article className="dash-card"><span>التجربة</span><strong>{plan.trialDays} يوم</strong><small>دعم {plan.supportTier}</small></article><article className="dash-card"><span>الاستخدام التجاري</span><strong>{plan._count.subscriptions}</strong><small>{plan._count.workspaces} مساحات مرتبطة</small></article></div><div className="invoice-table"><div className="invoice-row invoice-table-head"><span>الميزة</span><span>القيمة</span></div>{Object.entries(features).map(([key, value]) => <div className="invoice-row" key={`feature-${key}`}><span>{key}</span><span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span></div>)}{Object.entries(limits).map(([key, value]) => <div className="invoice-row" key={`limit-${key}`}><span>حد · {key}</span><span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span></div>)}{!Object.keys(features).length && !Object.keys(limits).length && <div className="invoice-empty">لا توجد مميزات أو حدود منظمة.</div>}</div><p className="dashboard-footer-note"><ShieldCheck size={15} /> تعديل الأسعار أو تفعيل خطة في الإنتاج يجب أن يمر عبر مزود الدفع ومسار مراجعة Staff واضح.</p></div></section></main>
}
