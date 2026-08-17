import Link from "next/link";
import { ArrowLeft, CheckCircle2, Link2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "إتمام إعداد الحساب | مركزية", robots: { index: false, follow: false } };

const statusLabels: Record<string, string> = {
  TRIAL: "تجريبية",
  ACTIVE: "نشطة",
  GRACE_PERIOD: "فترة سماح",
  PAYMENT_REVIEW: "قيد المراجعة",
  PAST_DUE: "متأخرة السداد",
  SUSPENDED: "موقوفة",
  CANCELLED: "ملغاة",
};

function date(value: Date | null | undefined) {
  return value ? value.toLocaleDateString("ar-EG") : "سيُحدد بعد تأكيد الدفع";
}

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <main className="auth-required"><ShieldCheck size={30} /><h1>سجّل الدخول أولًا</h1><p>صفحة إتمام إعداد مساحة SaaS محمية بالحساب.</p><Link href="/login" className="button button-dark">تسجيل الدخول</Link></main>;
  }
  if (!user.workspace) {
    return <main className="auth-required"><ShieldCheck size={30} /><h1>لم تُجهز مساحة العمل بعد</h1><p>أكمل إنشاء الحساب أو قبول دعوة مساحة SaaS أولًا.</p><Link href="/dashboard" className="button button-dark">العودة للوحة التحكم</Link></main>;
  }

  const workspaceId = user.workspace.id;
  const [subscription, memberCount, linkCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { workspaceId }, select: { status: true, currentPeriodEnd: true, billingCycle: true, plan: { select: { name: true, code: true } } } }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.lmsLink.count({ where: { workspaceId } }),
  ]);

  return <main className="workspace-page"><header className="workspace-header section-container"><Link href="/dashboard" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/app/overview" className="button button-outline"><ArrowLeft size={14} /> فتح مساحة العمل</Link></header><section className="workspace-content section-container"><div className="workspace-panel workspace-panel-accent onboarding-hero"><span className="section-eyebrow"><span className="eyebrow-dot" />اكتمل الإعداد الأولي</span><div className="onboarding-icon"><Sparkles size={24} /></div><h1>أهلًا بك في مساحة <em>{user.workspace.name}</em>.</h1><p>تم تسجيل نتيجة عملية الاشتراك داخل SaaS. الخطوة التالية هي تهيئة مساحة العمل وربط المرجع الذي تستخدمه دون نقل أي محتوى تعليمي.</p><div className="workspace-next"><Link href="/app/overview" className="button button-dark">ابدأ من النظرة العامة <ArrowLeft size={14} /></Link><Link href="/billing" className="button button-outline">مراجعة الفوترة</Link></div></div><section className="workspace-card-grid onboarding-grid"><article className="workspace-panel"><div className="workspace-panel-heading"><b>حالة الاشتراك</b><CheckCircle2 size={17} /></div><div className="workspace-stat-list"><div><span>الباقة</span><strong>{subscription?.plan.name || "لم تُحدد"}</strong></div><div><span>الحالة</span><strong>{subscription ? statusLabels[subscription.status] || subscription.status : "غير مفعلة"}</strong></div><div><span>الدورة</span><strong>{subscription?.billingCycle === "YEARLY" ? "سنوية" : "شهرية"}</strong></div><div><span>الفترة الحالية</span><strong>{date(subscription?.currentPeriodEnd)}</strong></div></div></article><article className="workspace-panel"><div className="workspace-panel-heading"><b>مساحة العمل</b><Users size={17} /></div><div className="workspace-stat-list"><div><span>الأعضاء</span><strong>{memberCount}</strong></div><div><span>الروابط المرجعية</span><strong>{linkCount}</strong></div></div><p className="safe-note"><ShieldCheck size={15} /> البيانات هنا تخص SaaS فقط، ولا نقرأ قاعدة LMS أو ننسخ محتواها.</p></article></section><section className="workspace-panel"><div className="workspace-panel-heading"><div><b>ثلاث خطوات للبدء</b><span>يمكنك تنفيذها الآن أو العودة إليها لاحقًا.</span></div><CheckCircle2 size={17} /></div><div className="onboarding-steps"><Link href="/app/profile" className="onboarding-step"><span>01</span><div><b>راجع ملفك الشخصي</b><small>تأكد من الاسم والبريد المستخدمين داخل مساحة SaaS.</small></div><ArrowLeft size={15} /></Link><Link href="/app/team" className="onboarding-step"><span>02</span><div><b>أضف أعضاء الفريق</b><small>أرسل دعوات بأدوار واضحة، ويمكن إلغاؤها قبل القبول.</small></div><ArrowLeft size={15} /></Link><Link href="/app/lms-connection" className="onboarding-step"><span>03</span><div><b>أضف رابطًا مرجعيًا</b><small>احفظ URL واسم العرض فقط، ثم راقب آخر فحص وصول.</small></div><Link2 size={15} /></Link></div></section></section></main>;
}
