import Link from 'next/link'
import { ArrowRight, CreditCard, FileText, ShieldCheck } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function date(value: Date | null | undefined) { return value ? new Date(value).toLocaleString('ar-EG') : '—' }

export default async function AdminSubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const staff = await getCurrentUser()
  if (!staff || !staff.isStaff) return <main className="admin-guard"><ShieldCheck size={28} /><h1>هذه المساحة محمية</h1><p>يلزم حساب Staff مصرح للوصول إلى تفاصيل الاشتراكات.</p><Link href="/dashboard" className="button button-dark"><ArrowRight size={14} /> العودة للوحة التحكم</Link></main>

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      billingCycle: true,
      startedAt: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      cancelledAt: true,
      createdAt: true,
      workspace: { select: { id: true, name: true, owner: { select: { name: true, email: true } } } },
      plan: { select: { name: true, code: true, monthlyCents: true, yearlyCents: true, supportTier: true } },
      events: { take: 30, orderBy: { createdAt: 'desc' }, select: { id: true, type: true, fromStatus: true, toStatus: true, metadataJson: true, createdAt: true } },
      invoices: { take: 20, orderBy: { createdAt: 'desc' }, select: { id: true, number: true, status: true, amountCents: true, currency: true, createdAt: true } },
    },
  })
  if (!subscription) return <main className="admin-guard"><h1>الاشتراك غير موجود</h1><p>لم يتم العثور على اشتراك SaaS بهذا المعرّف.</p><Link href="/admin/subscriptions" className="button button-dark"><ArrowRight size={14} /> العودة للاشتراكات</Link></main>

  return <main className="admin-page"><header className="admin-header section-container"><Link href="/admin/subscriptions" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><div><span className="section-eyebrow"><span className="eyebrow-dot" />تفاصيل اشتراك SaaS</span><h1>{subscription.plan.name} <em>بدورة {subscription.billingCycle === 'YEARLY' ? 'سنوية' : 'شهرية'}.</em></h1></div><span className="staff-badge"><ShieldCheck size={13} /> Staff</span></header><section className="admin-content section-container"><div className="admin-panel"><div className="admin-panel-heading"><div><b>ملخص الاشتراك</b><span>حالة الاشتراك ودورته وفواتيره داخل SaaS فقط.</span></div><CreditCard size={17} /></div><div className="dashboard-metrics usage-metrics"><article className="dash-card"><span>المساحة</span><strong>{subscription.workspace.name}</strong><small>{subscription.workspace.owner.email}</small></article><article className="dash-card"><span>الخطة</span><strong>{subscription.plan.name}</strong><small>{subscription.plan.code} · دعم {subscription.plan.supportTier}</small></article><article className="dash-card"><span>الحالة</span><strong>{subscription.status}</strong><small>{subscription.cancelAtPeriodEnd ? 'تلغى بنهاية الفترة' : 'تجدد حسب الإعداد'}</small></article><article className="dash-card"><span>الفترة الحالية</span><strong>{date(subscription.currentPeriodStart)}</strong><small>إلى {date(subscription.currentPeriodEnd)}</small></article></div><div className="admin-panel-heading"><div><b>تاريخ تغييرات الحالة</b><span>أحداث الاشتراك المسجلة للتدقيق.</span></div><ShieldCheck size={17} /></div><div className="invoice-table">{subscription.events.length ? subscription.events.map((event) => <div className="invoice-row" key={event.id}><span>{event.type}</span><span>{event.fromStatus || '—'} → {event.toStatus || '—'}</span><span>{event.metadataJson ? 'بيانات مرفقة' : '—'}</span><span>{date(event.createdAt)}</span></div>) : <div className="invoice-empty">لا توجد أحداث اشتراك.</div>}</div><div className="admin-panel-heading"><div><b>الفواتير المرتبطة</b><span>انتقل إلى تفاصيل كل فاتورة دون عرض بيانات بطاقة.</span></div><FileText size={17} /></div><div className="invoice-table">{subscription.invoices.length ? subscription.invoices.map((invoice) => <div className="invoice-row" key={invoice.id}><span><Link href={`/admin/billing/${invoice.id}`}>{invoice.number}</Link></span><span>{invoice.status}</span><span>{(invoice.amountCents / 100).toFixed(2)} {invoice.currency}</span><span>{date(invoice.createdAt)}</span></div>) : <div className="invoice-empty">لا توجد فواتير مرتبطة.</div>}</div><p className="dashboard-footer-note"><ShieldCheck size={15} /> مزود الدفع لا يرسل بيانات البطاقة إلى شاشة التشغيل؛ المرجع التجاري فقط هو المعروض.</p></div></section></main>
}
