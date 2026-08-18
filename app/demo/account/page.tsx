import Link from "next/link";
import { ArrowLeft, BarChart3, Bell, CheckCircle2, CreditCard, LifeBuoy, Link2, ShieldCheck, Users } from "lucide-react";
import WorkspaceShell from "@/components/workspace-shell";

export const metadata = {
  title: "حساب المدرس التجريبي | مركزية",
  description: "نسخة مطابقة للقراءة فقط من مساحة حساب المدرس في مركزية.",
};

const demoUser = { name: "محمد", email: "teacher.demo@centralia.test", workspaceName: "أكاديمية المدار" };
const demoBasePath = "/demo/account";

export default function DemoAccountPage() {
  return <WorkspaceShell active="overview" title="نظرة عامة" intro="صورة عملية عن حسابك ومساحة عملك، مبنية على بيانات SaaS التجريبية للعرض فقط." demoBasePath={demoBasePath} demoUser={demoUser}>
    <section className="workspace-card-grid">
      <article className="workspace-panel workspace-panel-accent">
        <span className="section-eyebrow"><span className="eyebrow-dot" />حالة الحساب</span>
        <h2>Growth</h2>
        <p>حالة الاشتراك: تجريبية. لا يوجد إلغاء مجدول حاليًا لأن هذه نسخة عرض للقراءة فقط.</p>
        <ul className="workspace-bullets">
          <li><CheckCircle2 size={15} />الفترة الحالية تنتهي في ١٥ سبتمبر ٢٠٢٦</li>
          <li><CheckCircle2 size={15} />دورة الفوترة: شهرية</li>
          <li><CheckCircle2 size={15} />كل الأرقام هنا خاصة بـ SaaS وليست بيانات تعليمية</li>
        </ul>
        <div className="workspace-next"><Link href={`${demoBasePath}/subscription`} className="button button-dark">إدارة الاشتراك <ArrowLeft size={14} /></Link><Link href={`${demoBasePath}/billing`} className="button button-outline">الفوترة</Link></div>
      </article>
      <article className="workspace-panel">
        <div className="workspace-panel-heading"><b>خطة العمل السريعة</b><BarChart3 size={16} /></div>
        <div className="workspace-stat-list"><div><span>أعضاء مساحة العمل</span><strong>4</strong></div><div><span>التذاكر المفتوحة</span><strong>2</strong></div><div><span>الروابط القابلة للوصول</span><strong>1</strong></div></div>
        <p className="safe-note"><ShieldCheck size={15} /> لا نقرأ محتوى LMS ولا ننسخ بياناته.</p>
      </article>
    </section>
    <section className="workspace-card-grid">
      <article className="workspace-panel"><div className="workspace-panel-heading"><b>الفواتير الأخيرة</b><CreditCard size={16} /></div><div className="workspace-list"><Link href={`${demoBasePath}/billing`} className="workspace-list-row"><span>INV-DEMO-002<small>١ أغسطس ٢٠٢٦</small></span><strong dir="ltr">49.00 USD</strong><span>مدفوعة</span></Link><Link href={`${demoBasePath}/billing`} className="workspace-list-row"><span>INV-DEMO-001<small>١ يوليو ٢٠٢٦</small></span><strong dir="ltr">49.00 USD</strong><span>مدفوعة</span></Link></div><Link href={`${demoBasePath}/billing`} className="text-link">عرض كل الفواتير <ArrowLeft size={13} /></Link></article>
      <article className="workspace-panel"><div className="workspace-panel-heading"><b>الدعم</b><LifeBuoy size={16} /></div><div className="workspace-list"><Link href={`${demoBasePath}/support`} className="workspace-list-row"><span>مشكلة في إعداد الرابط<small>تذكرة تجريبية · اليوم</small></span><strong>مفتوحة</strong></Link><Link href={`${demoBasePath}/support`} className="workspace-list-row"><span>استفسار عن الخطة<small>تذكرة تجريبية · أمس</small></span><strong>قيد المتابعة</strong></Link></div><Link href={`${demoBasePath}/support`} className="text-link">فتح مركز الدعم <ArrowLeft size={13} /></Link></article>
      <article className="workspace-panel"><div className="workspace-panel-heading"><b>روابط المنصة</b><Link2 size={16} /></div><div className="workspace-list"><Link href={`${demoBasePath}/lms`} className="workspace-list-row"><span>المنصة التعليمية الرئيسية<small>آخر فحص: اليوم ١٠:٣٠</small></span><strong>قابل للوصول</strong></Link></div><Link href={`${demoBasePath}/lms`} className="text-link">إدارة الروابط <ArrowLeft size={13} /></Link></article>
    </section>
    <section className="workspace-panel"><div className="workspace-panel-heading"><div><b>إجراءات سريعة</b><span>الخطوات التالية المقترحة حسب حالة الحساب الحالية.</span></div><Users size={16} /></div><div className="workspace-next"><Link href={`${demoBasePath}/profile`} className="button button-outline">تحديث الملف</Link><Link href={`${demoBasePath}/team`} className="button button-outline">إدارة الفريق</Link><Link href={`${demoBasePath}/reports`} className="button button-outline">فتح التقارير</Link><Link href={`${demoBasePath}/notifications`} className="button button-outline">الإشعارات (3)<Bell size={14} /></Link></div></section>
  </WorkspaceShell>;
}
