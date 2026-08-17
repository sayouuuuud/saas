import Link from 'next/link'
import { ArrowRight, Link2, ShieldCheck, UserRound } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function date(value: Date | null | undefined) { return value ? new Date(value).toLocaleString('ar-EG') : '—' }

export default async function AdminTeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const staff = await getCurrentUser()
  if (!staff || !staff.isStaff) return <main className="admin-guard"><ShieldCheck size={28} /><h1>هذه المساحة محمية</h1><p>يلزم حساب Staff مصرح للوصول إلى تفاصيل حسابات SaaS.</p><Link href="/dashboard" className="button button-dark"><ArrowRight size={14} /> العودة للوحة التحكم</Link></main>

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      isStaff: true,
      emailVerifiedAt: true,
      createdAt: true,
      memberships: {
        take: 20,
        orderBy: { createdAt: 'asc' },
        select: {
          role: true,
          createdAt: true,
          workspace: {
            select: {
              id: true,
              name: true,
              subscription: {
                select: {
                  status: true,
                  billingCycle: true,
                  currentPeriodEnd: true,
                  cancelAtPeriodEnd: true,
                  plan: { select: { name: true, code: true } },
                },
              },
              _count: { select: { members: true, lmsLinks: true, tickets: true } },
            },
          },
        },
      },
      auditEvents: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: { id: true, action: true, entity: true, reason: true, createdAt: true, workspace: { select: { name: true } } },
      },
    },
  })
  if (!user) return <main className="admin-guard"><h1>الحساب غير موجود</h1><p>لم يتم العثور على حساب SaaS بهذا المعرّف.</p><Link href="/admin/teachers" className="button button-dark"><ArrowRight size={14} /> العودة للمدرسين</Link></main>

  return <main className="admin-page"><header className="admin-header section-container"><Link href="/admin/teachers" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><div><span className="section-eyebrow"><span className="eyebrow-dot" />تفاصيل حساب SaaS</span><h1>{user.name} <em>بشكل آمن.</em></h1></div><span className="staff-badge"><ShieldCheck size={13} /> Staff</span></header><section className="admin-content section-container"><div className="admin-panel"><div className="admin-panel-heading"><div><b>بيانات المدرس</b><span>عرض تشغيلي محدود ببيانات SaaS فقط، دون محتوى تعليمي أو بيانات LMS.</span></div><UserRound size={17} /></div><div className="dashboard-metrics usage-metrics"><article className="dash-card"><span>الاسم</span><strong>{user.name}</strong><small>{user.email}</small></article><article className="dash-card"><span>البريد</span><strong>{user.emailVerifiedAt ? 'موثق' : 'غير موثق'}</strong><small>منذ {date(user.createdAt)}</small></article><article className="dash-card"><span>حساب Staff</span><strong>{user.isStaff ? 'نعم' : 'لا'}</strong><small>صلاحية تشغيل منفصلة</small></article></div><div className="invoice-table">{user.memberships.length ? user.memberships.map((membership) => <div className="invoice-row" key={`${membership.workspace.id}-${membership.role}`}><span>{membership.workspace.name}</span><span>{membership.role}</span><span>{membership.workspace.subscription ? `${membership.workspace.subscription.plan.name} (${membership.workspace.subscription.status})` : 'بلا اشتراك'}</span><span>{membership.workspace._count.members} أعضاء · {membership.workspace._count.lmsLinks} روابط · {membership.workspace._count.tickets} تذاكر</span><span>{membership.workspace.subscription ? `ينتهي ${date(membership.workspace.subscription.currentPeriodEnd)}` : '—'}</span></div>) : <div className="invoice-empty">لا توجد عضويات مساحة عمل.</div>}</div><div className="admin-panel-heading"><div><b>آخر أحداث التدقيق</b><span>الأحداث المرتبطة بالمستخدم أو مساحاته فقط.</span></div><Link2 size={17} /></div><div className="invoice-table">{user.auditEvents.length ? user.auditEvents.map((event) => <div className="invoice-row" key={event.id}><span>{event.action} · {event.entity}</span><span>{event.workspace?.name || 'عام'}</span><span>{event.reason || '—'}</span><span>{date(event.createdAt)}</span></div>) : <div className="invoice-empty">لا توجد أحداث تدقيق لهذا الحساب.</div>}</div><p className="dashboard-footer-note"><ShieldCheck size={15} /> رابط LMS المعروض هنا مرجع فقط؛ لا يتم فتح قاعدة بيانات LMS أو نسخ محتواه.</p></div></section></main>
}
