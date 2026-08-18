import Link from "next/link";
import { ArrowRight, BarChart3, CreditCard, ExternalLink, FileText, Link2, ShieldCheck, Ticket, Users } from "lucide-react";

export const metadata = { title: "ديمو الأدمن | مركزية", description: "نسخة مطابقة للقراءة فقط من لوحة إدارة مركزية ببيانات تجريبية." };

const adminSections = [
  ["الخطط", "plans"], ["المدرسون", "teachers"], ["الاشتراكات", "subscriptions"], ["الفوترة", "billing"], ["روابط المنصات", "lms-links"], ["التكاملات", "integrations"], ["الاستخدام", "usage"], ["التقارير", "reports"], ["الدعم والتذاكر", "support"], ["الموظفون", "staff"], ["سجل التدقيق", "audit"], ["الإشعارات", "notifications"], ["أكواد الخصم", "coupons"], ["أحداث الدفع", "webhooks"], ["إعدادات النظام", "settings"],
] as const;
const demoBasePath = "/demo/admin";

export default function DemoAdminPage() {
  return <main className="admin-page">
    <header className="admin-header section-container"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><div><span className="section-eyebrow"><span className="eyebrow-dot" />مساحة الموظفين</span><h1>لوحة تشغيل <em>SaaS</em></h1></div><span className="staff-badge"><ShieldCheck size={13} /> Staff · Demo</span></header>
    <section className="admin-content section-container">
      <div className="demo-admin-notice" role="note"><strong>وضع الأدمن التجريبي · قراءة فقط</strong><span>هذه نسخة مطابقة لبنية لوحة الإدارة ببيانات ثابتة غير حساسة. لا توجد صلاحيات Staff حقيقية ولا تُستدعى APIs إدارية.</span><Link href="/register" className="button button-outline">إنشاء حساب حقيقي</Link></div>
      <div className="admin-panel" aria-label="حالة البيئة والتشغيل"><div className="admin-stat-row"><span>بيئة التشغيل</span><strong>demo</strong></div><div className="admin-stat-row"><span>توفر التدقيق</span><strong className="safe-state">آخر حدث متاح</strong></div><div className="admin-stat-row"><span>آخر حدث تدقيق</span><strong>اليوم، 10:30</strong></div></div>
      <div className="admin-panel"><div className="admin-panel-heading"><div><b>لا توجد حوادث تشغيلية فعلية</b><span>البيانات أدناه تجريبية ولا تمثل نظامًا حقيقيًا.</span></div><ShieldCheck size={17} /></div></div>
      <div className="admin-metrics"><article><Users size={17} /><span>المدرسون</span><strong>128</strong></article><article><CreditCard size={17} /><span>اشتراكات نشطة</span><strong>96</strong></article><article><Ticket size={17} /><span>تذاكر مفتوحة</span><strong>14</strong></article><article><Link2 size={17} /><span>روابط LMS محفوظة</span><strong>84</strong></article></div>
      <div className="admin-grid"><article className="admin-panel"><div className="admin-panel-heading"><div><b>نظرة تشغيلية</b><span>بيانات SaaS فقط، دون قراءة لمحتوى LMS.</span></div><BarChart3 size={17} /></div><div className="admin-stat-row"><span>الفواتير المدفوعة</span><strong>1,042</strong></div><div className="admin-stat-row"><span>حالة العزل</span><strong className="safe-state">مفعّل</strong></div><div className="admin-stat-row"><span>مصدر Usage</span><strong>بيانات SaaS التجريبية</strong></div></article><article className="admin-panel"><div className="admin-panel-heading"><div><b>روابط سريعة</b><span>نفس أقسام لوحة الإدارة الحقيقية.</span></div><ExternalLink size={17} /></div><div className="admin-links">{adminSections.map(([label, slug]) => <Link key={slug} href={`${demoBasePath}/${slug}`}><FileText size={14} /> {label}</Link>)}</div></article></div>
      <article className="admin-panel audit-panel"><div className="admin-panel-heading"><div><b>آخر أحداث التدقيق</b><span>أحداث تجريبية مرتبطة بفاعل ومساحة عمل.</span></div><FileText size={17} /></div><div className="audit-list"><div className="audit-row"><span>SUBSCRIPTION_UPDATED</span><b>Subscription</b><small>demo.admin · أكاديمية المدار · اليوم 10:30</small></div><div className="audit-row"><span>SUPPORT_TICKET_CREATED</span><b>SupportTicket</b><small>demo.support · أكاديمية المدار · أمس 16:12</small></div><div className="audit-row"><span>LMS_LINK_CHECKED</span><b>LmsLink</b><small>system · أكاديمية المدار · أمس 09:45</small></div></div></article>
      <div className="admin-panel"><div className="admin-panel-heading"><div><b>استكشف التحكم</b><span>هذه الروابط للعرض فقط ولا تنفذ عمليات إدارية.</span></div><ArrowRight size={17} /></div><div className="admin-links"><Link href="/demo/account"><Users size={14} /> ديمو حساب المدرس</Link><Link href="/"><ExternalLink size={14} /> الصفحة الرئيسية</Link></div></div>
    </section>
  </main>;
}
