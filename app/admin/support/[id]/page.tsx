import Link from 'next/link'
import { ArrowRight, LifeBuoy, ShieldCheck } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function date(value: Date | null | undefined) { return value ? new Date(value).toLocaleString('ar-EG') : '—' }

export default async function AdminSupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const staff = await getCurrentUser()
  if (!staff || !staff.isStaff) return <main className="admin-guard"><ShieldCheck size={28} /><h1>هذه المساحة محمية</h1><p>يلزم حساب Staff مصرح للوصول إلى تذاكر العملاء.</p><Link href="/dashboard" className="button button-dark"><ArrowRight size={14} /> العودة للوحة التحكم</Link></main>

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: {
      id: true,
      number: true,
      subject: true,
      description: true,
      category: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      requester: { select: { name: true, email: true } },
      workspace: { select: { name: true, id: true } },
      messages: { take: 50, orderBy: { createdAt: 'asc' }, select: { id: true, body: true, isInternal: true, createdAt: true, author: { select: { name: true, email: true, isStaff: true } } } },
    },
  })
  if (!ticket) return <main className="admin-guard"><h1>التذكرة غير موجودة</h1><p>لم يتم العثور على تذكرة بهذا المعرّف.</p><Link href="/admin/support" className="button button-dark"><ArrowRight size={14} /> العودة للدعم</Link></main>

  return <main className="admin-page"><header className="admin-header section-container"><Link href="/admin/support" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><div><span className="section-eyebrow"><span className="eyebrow-dot" />تفاصيل تذكرة SaaS</span><h1>{ticket.number} <em>للمتابعة.</em></h1></div><span className="staff-badge"><ShieldCheck size={13} /> Staff</span></header><section className="admin-content section-container"><div className="admin-panel"><div className="admin-panel-heading"><div><b>{ticket.subject}</b><span>{ticket.workspace.name} · {ticket.requester.name} · {ticket.requester.email}</span></div><LifeBuoy size={17} /></div><div className="dashboard-metrics usage-metrics"><article className="dash-card"><span>الحالة</span><strong>{ticket.status}</strong><small>أولوية {ticket.priority}</small></article><article className="dash-card"><span>الفئة</span><strong>{ticket.category}</strong><small>فتحت في {date(ticket.createdAt)}</small></article><article className="dash-card"><span>آخر تحديث</span><strong>{date(ticket.updatedAt)}</strong><small>نطاق مساحة العمل: SaaS</small></article></div><div className="invoice-table"><div className="invoice-row"><span>وصف الطلب</span><span>{ticket.description}</span><span>—</span><span>—</span></div>{ticket.messages.length ? ticket.messages.map((message) => <div className="invoice-row" key={message.id}><span>{message.author.name || message.author.email}{message.author.isStaff ? ' · Staff' : ''}{message.isInternal ? ' · داخلي' : ''}</span><span>{message.body}</span><span>{message.isInternal ? 'لا يظهر للعميل' : 'مرئي للعميل'}</span><span>{date(message.createdAt)}</span></div>) : <div className="invoice-empty">لا توجد رسائل إضافية.</div>}</div><p className="dashboard-footer-note"><ShieldCheck size={15} /> هذه الشاشة للمتابعة التشغيلية فقط. لا تعرض بيانات تعليمية ولا تنفذ تغييرات على نظام LMS.</p></div></section></main>
}
