import Link from "next/link";
import { ArrowLeft, BarChart3, Bell, CheckCircle2, CreditCard, LifeBuoy, Link2, ShieldCheck, Users } from "lucide-react";
import WorkspaceShell from "@/components/workspace-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const subscriptionLabels: Record<string, string> = {
  TRIAL: "تجريبية",
  ACTIVE: "نشطة",
  PAST_DUE: "متأخرة السداد",
  GRACE_PERIOD: "فترة سماح",
  SUSPENDED: "موقوفة",
  CANCELLED: "ملغاة",
  PAYMENT_REVIEW: "قيد المراجعة",
};

const ticketLabels: Record<string, string> = {
  OPEN: "مفتوحة",
  IN_PROGRESS: "قيد المتابعة",
  WAITING_ON_CUSTOMER: "بانتظار ردك",
  RESOLVED: "تم الحل",
  CLOSED: "مغلقة",
};

const linkLabels: Record<string, string> = {
  NOT_CHECKED: "لم يتم الفحص",
  REACHABLE: "قابل للوصول",
  UNREACHABLE: "غير قابل للوصول",
  NEEDS_ATTENTION: "يحتاج مراجعة",
  DISABLED: "معطل",
};

function date(value: Date | null | undefined) {
  return value ? value.toLocaleDateString("ar-EG") : "غير متاح";
}

export default async function OverviewPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <main className="auth-required"><ShieldCheck size={30} /><h1>سجّل الدخول أولًا</h1><p>هذه مساحة SaaS محمية وتعرض بيانات Workspace الخاصة بك فقط.</p><Link href="/login" className="button button-dark">تسجيل الدخول</Link></main>;
  }
  if (!user.workspace) {
    return <main className="auth-required"><ShieldCheck size={30} /><h1>لا توجد مساحة عمل</h1><p>لا يمكن بناء النظرة العامة قبل إسناد الحساب إلى مساحة SaaS.</p><Link href="/dashboard" className="button button-dark">العودة للوحة التحكم</Link></main>;
  }

  const workspaceId = user.workspace.id;
  const [subscription, invoices, tickets, links, memberCount, unreadNotifications] = await Promise.all([
    prisma.subscription.findUnique({ where: { workspaceId }, select: { status: true, billingCycle: true, currentPeriodEnd: true, cancelAtPeriodEnd: true, plan: { select: { name: true, code: true } } } }),
    prisma.invoice.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, number: true, amountCents: true, currency: true, status: true, createdAt: true } }),
    prisma.supportTicket.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 3, select: { id: true, number: true, subject: true, status: true, updatedAt: true } }),
    prisma.lmsLink.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 3, select: { id: true, displayName: true, status: true, lastCheckedAt: true } }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.notification.count({ where: { workspaceId, userId: user.id, readAt: null } }),
  ]);

  const openTickets = tickets.filter((ticket) => !["CLOSED", "RESOLVED"].includes(ticket.status)).length;
  const activeLinks = links.filter((link) => link.status === "REACHABLE").length;

  return <WorkspaceShell active="overview" title="نظرة عامة" intro="صورة عملية عن حسابك ومساحة عملك، مبنية على بيانات SaaS الفعلية.">
    <section className="workspace-card-grid">
      <article className="workspace-panel workspace-panel-accent">
        <span className="section-eyebrow"><span className="eyebrow-dot" />حالة الحساب</span>
        <h2>{subscription?.plan.name || "لم تُحدد باقة بعد"}</h2>
        <p>{subscription ? `حالة الاشتراك: ${subscriptionLabels[subscription.status] || subscription.status}. ${subscription.cancelAtPeriodEnd ? "سيتم الإلغاء في نهاية الفترة الحالية." : "لا يوجد إلغاء مجدول حاليًا."}` : "ابدأ باختيار خطة مناسبة من صفحة الفوترة."}</p>
        <ul className="workspace-bullets">
          <li><CheckCircle2 size={15} />الفترة الحالية تنتهي في {date(subscription?.currentPeriodEnd)}</li>
          <li><CheckCircle2 size={15} />دورة الفوترة: {subscription?.billingCycle === "YEARLY" ? "سنوية" : "شهرية"}</li>
          <li><CheckCircle2 size={15} />كل الأرقام هنا خاصة بـ SaaS وليست بيانات تعليمية</li>
        </ul>
        <div className="workspace-next"><Link href="/app/subscription" className="button button-dark">إدارة الاشتراك <ArrowLeft size={14} /></Link><Link href="/billing" className="button button-outline">الفوترة</Link></div>
      </article>
      <article className="workspace-panel">
        <div className="workspace-panel-heading"><b>خطة العمل السريعة</b><BarChart3 size={16} /></div>
        <div className="workspace-stat-list"><div><span>أعضاء مساحة العمل</span><strong>{memberCount}</strong></div><div><span>التذاكر المفتوحة</span><strong>{openTickets}</strong></div><div><span>الروابط القابلة للوصول</span><strong>{activeLinks}</strong></div></div>
        <p className="safe-note"><ShieldCheck size={15} /> لا نقرأ محتوى LMS ولا ننسخ بياناته.</p>
      </article>
    </section>

    <section className="workspace-card-grid">
      <article className="workspace-panel"><div className="workspace-panel-heading"><b>الفواتير الأخيرة</b><CreditCard size={16} /></div>{invoices.length ? <div className="workspace-list">{invoices.map((invoice) => <Link href="/billing" className="workspace-list-row" key={invoice.id}><span>{invoice.number}<small>{date(invoice.createdAt)}</small></span><strong dir="ltr">{(invoice.amountCents / 100).toFixed(2)} {invoice.currency}</strong><span>{invoice.status === "PAID" ? "مدفوعة" : invoice.status}</span></Link>)}</div> : <p className="invoice-empty">لا توجد فواتير بعد.</p>}<Link href="/billing" className="text-link">عرض كل الفواتير <ArrowLeft size={13} /></Link></article>
      <article className="workspace-panel"><div className="workspace-panel-heading"><b>الدعم</b><LifeBuoy size={16} /></div>{tickets.length ? <div className="workspace-list">{tickets.map((ticket) => <Link href={`/support/${ticket.id}`} className="workspace-list-row" key={ticket.id}><span>{ticket.subject}<small>{ticket.number} · {date(ticket.updatedAt)}</small></span><strong>{ticketLabels[ticket.status] || ticket.status}</strong></Link>)}</div> : <p className="invoice-empty">لا توجد تذاكر بعد.</p>}<Link href="/support" className="text-link">فتح مركز الدعم <ArrowLeft size={13} /></Link></article>
      <article className="workspace-panel"><div className="workspace-panel-heading"><b>روابط المنصة</b><Link2 size={16} /></div>{links.length ? <div className="workspace-list">{links.map((link) => <Link href="/app/lms-connection" className="workspace-list-row" key={link.id}><span>{link.displayName}<small>آخر فحص: {date(link.lastCheckedAt)}</small></span><strong>{linkLabels[link.status] || link.status}</strong></Link>)}</div> : <p className="invoice-empty">أضف رابط LMS مرجعيًا للبدء.</p>}<Link href="/app/lms-connection" className="text-link">إدارة الروابط <ArrowLeft size={13} /></Link></article>
    </section>

    <section className="workspace-panel"><div className="workspace-panel-heading"><div><b>إجراءات سريعة</b><span>الخطوات التالية المقترحة حسب حالة الحساب الحالية.</span></div><Users size={16} /></div><div className="workspace-next"><Link href="/app/profile" className="button button-outline">تحديث الملف</Link><Link href="/app/team" className="button button-outline">إدارة الفريق</Link><Link href="/app/reports" className="button button-outline">فتح التقارير</Link><Link href="/app/notifications" className="button button-outline">الإشعارات {unreadNotifications ? `(${unreadNotifications})` : ""}<Bell size={14} /></Link></div></section>
  </WorkspaceShell>;
}
