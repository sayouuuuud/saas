import Link from 'next/link'
import { ArrowRight, CreditCard, FileText, ShieldCheck } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function date(value: Date | null | undefined) { return value ? new Date(value).toLocaleString('ar-EG') : '—' }
function money(cents: number, currency: string) { return `${(cents / 100).toFixed(2)} ${currency}` }
function lineItems(value: string) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.slice(0, 25) : []
  } catch { return [] }
}

export default async function AdminInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const staff = await getCurrentUser()
  if (!staff || !staff.isStaff) return <main className="admin-guard"><ShieldCheck size={28} /><h1>هذه المساحة محمية</h1><p>يلزم حساب Staff مصرح للوصول إلى تفاصيل الفواتير.</p><Link href="/dashboard" className="button button-dark"><ArrowRight size={14} /> العودة للوحة التحكم</Link></main>

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      number: true,
      amountCents: true,
      currency: true,
      status: true,
      periodStart: true,
      periodEnd: true,
      paidAt: true,
      lineItemsJson: true,
      createdAt: true,
      workspace: { select: { id: true, name: true, owner: { select: { name: true, email: true } } } },
      subscription: { select: { status: true, billingCycle: true, plan: { select: { name: true, code: true } } } },
      payments: { take: 20, orderBy: { createdAt: 'desc' }, select: { id: true, providerEvent: true, amountCents: true, status: true, paidAt: true, createdAt: true } },
    },
  })
  if (!invoice) return <main className="admin-guard"><h1>الفاتورة غير موجودة</h1><p>لم يتم العثور على فاتورة SaaS بهذا المعرّف.</p><Link href="/admin/billing" className="button button-dark"><ArrowRight size={14} /> العودة للفوترة</Link></main>

  const items = lineItems(invoice.lineItemsJson)
  return <main className="admin-page"><header className="admin-header section-container"><Link href="/admin/billing" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><div><span className="section-eyebrow"><span className="eyebrow-dot" />تفاصيل فاتورة SaaS</span><h1>{invoice.number} <em>بوضوح.</em></h1></div><span className="staff-badge"><ShieldCheck size={13} /> Staff</span></header><section className="admin-content section-container"><div className="admin-panel"><div className="admin-panel-heading"><div><b>ملخص الفاتورة</b><span>بيانات فوترة SaaS فقط، دون أي أرقام بطاقات أو محتوى LMS.</span></div><FileText size={17} /></div><div className="dashboard-metrics usage-metrics"><article className="dash-card"><span>المساحة</span><strong>{invoice.workspace.name}</strong><small>{invoice.workspace.owner.email}</small></article><article className="dash-card"><span>الإجمالي</span><strong>{money(invoice.amountCents, invoice.currency)}</strong><small>الحالة: {invoice.status}</small></article><article className="dash-card"><span>الفترة</span><strong>{date(invoice.periodStart)}</strong><small>إلى {date(invoice.periodEnd)}</small></article><article className="dash-card"><span>الاشتراك</span><strong>{invoice.subscription?.plan.name || '—'}</strong><small>{invoice.subscription ? `${invoice.subscription.status} · ${invoice.subscription.billingCycle}` : 'غير مرتبط'}</small></article></div><div className="invoice-table"><div className="invoice-row invoice-table-head"><span>البند</span><span>الوصف</span><span>المبلغ</span><span>التاريخ</span></div>{items.length ? items.map((item, index) => <div className="invoice-row" key={`line-${index}`}><span>{typeof item === 'object' && item && 'name' in item ? String(item.name) : `بند ${index + 1}`}</span><span>{typeof item === 'object' && item && 'description' in item ? String(item.description) : '—'}</span><span>{typeof item === 'object' && item && 'amountCents' in item ? money(Number(item.amountCents) || 0, invoice.currency) : '—'}</span><span>{date(invoice.createdAt)}</span></div>) : <div className="invoice-empty">لا توجد تفاصيل بنود منظمة لهذه الفاتورة.</div>}</div><div className="admin-panel-heading"><div><b>سجل الدفعات</b><span>مرجع مزود الدفع فقط مع الحالة والمبلغ.</span></div><CreditCard size={17} /></div><div className="invoice-table">{invoice.payments.length ? invoice.payments.map((payment) => <div className="invoice-row" key={payment.id}><span>{payment.providerEvent}</span><span>{payment.status}</span><span>{money(payment.amountCents, invoice.currency)}</span><span>{date(payment.paidAt || payment.createdAt)}</span></div>) : <div className="invoice-empty">لا توجد دفعات مسجلة.</div>}</div><p className="dashboard-footer-note"><ShieldCheck size={15} /> تم إخفاء أي بيانات دفع حساسة. رقم مزود الدفع لا يُعرض إلا كمرجع تشغيلي.</p></div></section></main>
}
