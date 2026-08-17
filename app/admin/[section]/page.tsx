import Link from 'next/link'
import { ArrowRight, CreditCard, ExternalLink, Link2, ShieldCheck, Users } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ReactNode } from 'react'

const sections = {
  teachers: { title: 'المدرسون', description: 'حسابات المستخدمين المرتبطة بمساحات عمل SaaS.', icon: Users },
  plans: { title: 'الخطط', description: 'كتالوج الخطط التجارية الذي يديره SaaS.', icon: CreditCard },
  subscriptions: { title: 'الاشتراكات', description: 'حالات الاشتراك ومواعيدها دون بيانات دفع حساسة.', icon: CreditCard },
  billing: { title: 'الفوترة', description: 'الفواتير المملوكة لـ SaaS وحالاتها التجارية.', icon: CreditCard },
  'lms-links': { title: 'روابط المنصات', description: 'مراجع الروابط المحفوظة، لا محتوى LMS.', icon: Link2 },
} as const

type SectionKey = keyof typeof sections

function formatDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleString('ar-EG') : '—'
}

function emptyState() { return <div className="invoice-empty">لا توجد سجلات في هذا القسم.</div> }

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const config = sections[section as SectionKey]
  const user = await getCurrentUser()
  if (!user || !user.isStaff) return <main className="admin-guard"><ShieldCheck size={28} /><h1>هذه المساحة محمية</h1><p>يلزم حساب Staff مصرح للوصول إلى تشغيل SaaS. لا يعتمد الحارس على إخفاء الرابط فقط.</p><Link href="/dashboard" className="button button-dark"><ArrowRight size={14} /> العودة للوحة التحكم</Link></main>
  if (!config) return <main className="admin-guard"><h1>القسم غير موجود</h1><Link href="/admin" className="button button-dark">لوحة الإدارة</Link></main>

  let content: ReactNode
  if (section === 'teachers') {
    const rows = await prisma.workspaceMember.findMany({ take: 50, orderBy: { createdAt: 'desc' }, select: { id: true, role: true, createdAt: true, user: { select: { name: true, email: true } }, workspace: { select: { name: true } } } })
    content = rows.length ? rows.map((row) => <div className="invoice-row" key={row.id}><span>{row.user.name}</span><span>{row.user.email}</span><span>{row.workspace.name}</span><span>{row.role}</span></div>) : emptyState()
  } else if (section === 'plans') {
    const rows = await prisma.plan.findMany({ take: 50, orderBy: { monthlyCents: 'asc' }, select: { id: true, code: true, name: true, monthlyCents: true, yearlyCents: true, trialDays: true, supportTier: true, active: true } })
    content = rows.length ? rows.map((row) => <div className="invoice-row" key={row.id}><span>{row.name} ({row.code})</span><span>{(row.monthlyCents / 100).toFixed(2)} شهريًا</span><span>{(row.yearlyCents / 100).toFixed(2)} سنويًا</span><span>{row.active ? 'نشطة' : 'متوقفة'} · تجربة {row.trialDays} يوم · {row.supportTier}</span></div>) : emptyState()
  } else if (section === 'subscriptions') {
    const rows = await prisma.subscription.findMany({ take: 50, orderBy: { createdAt: 'desc' }, select: { id: true, status: true, billingCycle: true, currentPeriodEnd: true, cancelAtPeriodEnd: true, workspace: { select: { name: true } }, plan: { select: { code: true, name: true } } } })
    content = rows.length ? rows.map((row) => <div className="invoice-row" key={row.id}><span>{row.workspace.name}</span><span>{row.plan.name} ({row.plan.code})</span><span>{row.status} · {row.billingCycle}</span><span>{row.cancelAtPeriodEnd ? 'تلغى بنهاية الفترة' : formatDate(row.currentPeriodEnd)}</span></div>) : emptyState()
  } else if (section === 'billing') {
    const rows = await prisma.invoice.findMany({ take: 50, orderBy: { createdAt: 'desc' }, select: { id: true, number: true, status: true, amountCents: true, currency: true, createdAt: true, workspace: { select: { name: true } } } })
    content = rows.length ? rows.map((row) => <div className="invoice-row" key={row.id}><span>{row.number}</span><span>{row.workspace.name}</span><span>{(row.amountCents / 100).toFixed(2)} {row.currency}</span><span>{row.status} · {formatDate(row.createdAt)}</span></div>) : emptyState()
  } else {
    const rows = await prisma.lmsLink.findMany({ take: 50, orderBy: { createdAt: 'desc' }, select: { id: true, displayName: true, publicUrl: true, status: true, lastCheckedAt: true, createdAt: true, workspace: { select: { name: true } } } })
    content = rows.length ? rows.map((row) => <div className="invoice-row" key={row.id}><span><Link2 size={14} /> {row.displayName}</span><a href={row.publicUrl} target="_blank" rel="noreferrer">فتح الرابط <ExternalLink size={13} /></a><span>{row.workspace.name}</span><span>{row.status} · {formatDate(row.lastCheckedAt || row.createdAt)}</span></div>) : emptyState()
  }

  const Icon = config.icon
  return <main className="admin-page"><header className="admin-header section-container"><Link href="/admin" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><div><span className="section-eyebrow"><span className="eyebrow-dot" />مساحة الموظفين</span><h1>{config.title} <em>SaaS</em></h1></div><span className="staff-badge"><ShieldCheck size={13} /> Staff</span></header><section className="admin-content section-container"><div className="admin-panel"><div className="admin-panel-heading"><div><b>{config.title}</b><span>{config.description} الحد الأقصى للعرض 50 سجلًا.</span></div><Icon size={17} /></div><div className="admin-links admin-section-nav">{Object.entries(sections).map(([key, value]) => <Link href={`/admin/${key}`} key={key} className={key === section ? 'active' : ''}>{value.title}</Link>)}</div><div className="invoice-table">{content}</div><p className="dashboard-footer-note"><ShieldCheck size={15} /> هذه شاشة تشغيل SaaS فقط؛ لا تعرض بيانات المتعلمين أو محتوى LMS.</p></div></section></main>
}
