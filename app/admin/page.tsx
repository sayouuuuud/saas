import Link from 'next/link'
import { ArrowRight, BarChart3, CreditCard, ExternalLink, FileText, Link2, ShieldCheck, Ticket, Users } from 'lucide-react'
import { getCurrentUser, staffTwoFactorRequired } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { accessibleStaffSections } from '@/lib/staff-access'

function formatDate(value: Date | null) {
  return value ? value.toLocaleString('ar-EG') : 'لا يوجد حدث مسجل'
}

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user || !user.isStaff) return <main className="admin-guard"><ShieldCheck size={28} /><h1>لوحة الإدارة محمية</h1><p>تحتاج إلى حساب Staff مصرح للوصول إلى بيانات التشغيل. لا تعتمد هذه الصفحة على إخفاء زر فقط.</p><Link href="/dashboard" className="button button-dark"><ArrowRight size={14} /> العودة للوحة التحكم</Link></main>
  if (staffTwoFactorRequired(user)) return <main className="admin-guard"><ShieldCheck size={28} /><h1>فعّل المصادقة الثنائية أولًا</h1><p>المصادقة الثنائية إلزامية لكل حساب Staff قبل الوصول إلى أدوات الإدارة. أكمل الإعداد من صفحة أمان الحساب ثم عد إلى هنا.</p><Link href="/app/security" className="button button-dark"><ShieldCheck size={14} /> فتح إعدادات الأمان</Link></main>

  const allowedSections = new Set(accessibleStaffSections(user.staffRole))
  const [teachers, subscriptions, tickets, links, invoices, audits, failedWebhooks, pendingDeletionRequests] = await Promise.all([
    prisma.user.count({ where: { workspace: { isNot: null } } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER'] } } }),
    prisma.lmsLink.count(),
    prisma.invoice.count({ where: { status: 'PAID' } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, action: true, entity: true, createdAt: true, actor: { select: { email: true } }, workspace: { select: { name: true } } } }),
    prisma.billingWebhookEvent.count({ where: { state: { not: 'PROCESSED' } } }),
    prisma.dataDeletionRequest.count({ where: { status: { in: ['REQUESTED', 'IN_REVIEW', 'APPROVED'] } } }),
  ])

  const lastAudit = audits[0]?.createdAt || null
  const auditFresh = Boolean(lastAudit)
  const incidentCount = failedWebhooks + pendingDeletionRequests
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown'

  return <main className="admin-page">
    <header className="admin-header section-container"><Link href="/dashboard" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><div><span className="section-eyebrow"><span className="eyebrow-dot" />مساحة الموظفين</span><h1>لوحة تشغيل <em>SaaS</em></h1></div><span className="staff-badge"><ShieldCheck size={13} /> Staff</span></header>
    <section className="admin-content section-container">
      <div className="admin-panel" aria-label="حالة البيئة والتشغيل"><div className="admin-stat-row"><span>بيئة التشغيل</span><strong>{environment}</strong></div><div className="admin-stat-row"><span>توفر التدقيق</span><strong className={auditFresh ? 'safe-state' : ''}>{auditFresh ? 'آخر حدث متاح' : 'غير متاح'}</strong></div><div className="admin-stat-row"><span>آخر حدث تدقيق</span><strong>{formatDate(lastAudit)}</strong></div></div>
      {incidentCount > 0 ? <div className="admin-panel" role="alert"><div className="admin-panel-heading"><div><b>تحتاج هذه العناصر إلى متابعة</b><span>{failedWebhooks} Webhooks غير معالجة و{pendingDeletionRequests} طلبات حذف معلقة.</span></div><ShieldCheck size={17} /></div><div className="admin-links"><Link href="/admin/webhooks">فتح أحداث الدفع</Link><Link href="/admin/settings">فتح إعدادات التشغيل</Link></div></div> : <div className="admin-panel"><div className="admin-panel-heading"><div><b>لا توجد حوادث تشغيلية معلقة</b><span>تم فحص Webhooks وطلبات الحذف ضمن مؤشرات لوحة الإدارة الحالية.</span></div><ShieldCheck size={17} /></div></div>}
      <div className="admin-metrics"><article><Users size={17} /><span>المدرسون</span><strong>{teachers}</strong></article><article><CreditCard size={17} /><span>اشتراكات نشطة</span><strong>{subscriptions}</strong></article><article><Ticket size={17} /><span>تذاكر مفتوحة</span><strong>{tickets}</strong></article><article><Link2 size={17} /><span>روابط LMS محفوظة</span><strong>{links}</strong></article></div>
      <div className="admin-grid"><article className="admin-panel"><div className="admin-panel-heading"><div><b>نظرة تشغيلية</b><span>بيانات SaaS فقط، دون قراءة لمحتوى LMS.</span></div><BarChart3 size={17} /></div><div className="admin-stat-row"><span>الفواتير المدفوعة</span><strong>{invoices}</strong></div><div className="admin-stat-row"><span>حالة العزل</span><strong className="safe-state">مفعّل</strong></div><div className="admin-stat-row"><span>مصدر Usage</span><strong>غير متاح دون API رسمي</strong></div></article><article className="admin-panel"><div className="admin-panel-heading"><div><b>روابط سريعة</b><span>إدارة السطح التجاري للحسابات.</span></div><ExternalLink size={17} /></div><div className="admin-links">{allowedSections.has('plans') && <Link href="/admin/plans"><CreditCard size={14} /> الخطط</Link>}{allowedSections.has('teachers') && <Link href="/admin/teachers"><Users size={14} /> المدرسون</Link>}{allowedSections.has('subscriptions') && <Link href="/admin/subscriptions"><CreditCard size={14} /> الاشتراكات</Link>}{allowedSections.has('billing') && <Link href="/admin/billing"><Ticket size={14} /> الفوترة</Link>}{allowedSections.has('lms-links') && <Link href="/admin/lms-links"><Link2 size={14} /> روابط المنصات</Link>}{allowedSections.has('integrations') && <Link href="/admin/integrations"><Link2 size={14} /> التكاملات</Link>}{allowedSections.has('usage') && <Link href="/admin/usage"><BarChart3 size={14} /> الاستخدام</Link>}{allowedSections.has('reports') && <Link href="/admin/reports"><FileText size={14} /> التقارير</Link>}{allowedSections.has('support') && <Link href="/admin/support"><Ticket size={14} /> الدعم والتذاكر</Link>}{allowedSections.has('staff') && <Link href="/admin/staff"><Users size={14} /> الموظفون</Link>}{allowedSections.has('audit') && <Link href="/admin/audit"><FileText size={14} /> سجل التدقيق</Link>}{allowedSections.has('notifications') && <Link href="/admin/notifications"><FileText size={14} /> الإشعارات</Link>}{allowedSections.has('coupons') && <Link href="/admin/coupons"><CreditCard size={14} /> أكواد الخصم</Link>}{allowedSections.has('webhooks') && <Link href="/admin/webhooks"><ShieldCheck size={14} /> أحداث الدفع</Link>}{allowedSections.has('settings') && <Link href="/admin/settings"><CreditCard size={14} /> إعدادات النظام</Link>}</div></article></div>
      <article className="admin-panel audit-panel"><div className="admin-panel-heading"><div><b>آخر أحداث التدقيق</b><span>كل حدث مرتبط بفاعل ومساحة عمل عند توفرهما.</span></div><FileText size={17} /></div><div className="audit-list">{audits.map((audit) => <div className="audit-row" key={audit.id}><span>{audit.action}</span><b>{audit.entity}</b><small>{audit.actor?.email || 'system'} · {audit.workspace?.name || '—'} · {audit.createdAt.toLocaleString('ar-EG')}</small></div>)}</div></article>
    </section>
  </main>
}
