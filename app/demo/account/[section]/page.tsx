import Link from "next/link";
import { notFound } from "next/navigation";

const sectionData: Record<string, { title: string; description: string; metrics: Array<[string, string, string]>; rows: Array<[string, string, string]> }> = {
  subscription: {
    title: "الاشتراك والفوترة",
    description: "نموذج توضيحي للخطة والفواتير. الدفع الحقيقي يحتاج مزود دفع مفعّل.",
    metrics: [["الخطة", "Growth", "شهري"], ["الحالة", "تجريبية", "لا يوجد دفع"], ["التجديد", "15 سبتمبر", "عرض فقط"]],
    rows: [["Growth · سبتمبر 2026", "120 ر.س", "مسودة تجريبية"], ["Growth · أغسطس 2026", "120 ر.س", "بيانات عرض"]],
  },
  usage: {
    title: "الاستخدام والمؤشرات",
    description: "مؤشرات SaaS تجريبية توضح كيف يمكن متابعة حدود الحساب دون اختلاق مقاييس LMS.",
    metrics: [["المستخدمون النشطون", "248", "هذا الشهر"], ["الأحداث", "1,840", "تجريبية"], ["الحد المستخدم", "42%", "من الخطة"]],
    rows: [["تسجيلات الدخول", "612", "منذ 30 يومًا"], ["عمليات مساحة العمل", "1,228", "منذ 30 يومًا"], ["مزامنة LMS", "غير متاحة", "لا يوجد API رسمي"]],
  },
  team: {
    title: "الفريق والدعوات",
    description: "مثال على توزيع الأدوار. لا يمكن تعديل الأعضاء من وضع العرض.",
    metrics: [["الأعضاء", "4", "من أصل 10"], ["الدعوات", "1", "تجريبية"], ["الدور الرئيسي", "Owner", "مساحة العرض"]],
    rows: [["مريم أحمد", "Owner", "نشط"], ["عمر علي", "Support", "نشط"], ["سارة حسن", "Analyst", "نشط"]],
  },
  support: {
    title: "الدعم والتذاكر",
    description: "تذاكر تجريبية توضح دورة الدعم، بدون إرسال رسائل أو إنشاء سجلات حقيقية.",
    metrics: [["التذاكر المفتوحة", "2", "للعرض"], ["متوسط الرد", "4 ساعات", "توضيحي"], ["SLA", "نشط", "نموذج"]],
    rows: [["كيف أضيف عضوًا؟", "مفتوحة", "دعم الحساب"], ["مراجعة الخطة", "قيد المتابعة", "الفوترة"]],
  },
  security: {
    title: "أمان الحساب",
    description: "نموذج توضيحي لحالة الأمان. لا توجد جلسة حقيقية يمكن تعديلها هنا.",
    metrics: [["2FA", "مفعّل", "في المثال"], ["الجلسات", "2", "تجريبية"], ["آخر نشاط", "منذ 8 دقائق", "بيانات عرض"]],
    rows: [["المصادقة الثنائية", "مفعّلة", "TOTP"], ["جلسات الحساب", "قراءة فقط", "لا يمكن إلغاؤها هنا"], ["بيانات الاستعادة", "غير معروضة", "للحساب الحقيقي فقط"]],
  },
};

export function generateStaticParams() {
  return Object.keys(sectionData).map((section) => ({ section }));
}

export const dynamicParams = false;

export default async function DemoAccountSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const data = sectionData[section];
  if (!data) notFound();

  return (
    <main className="demo-account-shell">
      <div className="section-container">
        <div className="demo-account-topbar">
          <Link href="/demo/account" className="brand"><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>مركزية</Link>
          <div className="demo-account-actions"><span className="demo-badge">وضع العرض · قراءة فقط</span><Link href="/register" className="button button-dark">إنشاء حساب حقيقي</Link></div>
        </div>
        <div className="demo-disclaimer" role="note"><strong>عرض آمن بلا تسجيل دخول.</strong><span>هذه الصفحة تستخدم بيانات ثابتة غير حساسة، ولا تصل إلى APIs خاصة ولا تسمح بأي تعديل.</span></div>
        <section className="demo-section-page">
          <Link href="/demo/account" className="text-link">← العودة إلى ملخص الحساب</Link>
          <span className="section-eyebrow"><span className="eyebrow-dot" /> قسم تجريبي</span>
          <h1>{data.title}</h1>
          <p className="demo-section-lede">{data.description}</p>
          <div className="demo-metric-grid">{data.metrics.map(([label, value, note]) => <article className="demo-metric-card" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div>
          <article className="demo-panel demo-table-panel"><div className="demo-panel-heading"><div><b>تفاصيل توضيحية</b><small>بيانات تجريبية للعرض فقط</small></div><span className="demo-chip">قراءة فقط</span></div><div className="demo-rows">{data.rows.map(([label, value, note]) => <div className="demo-row" key={label}><strong>{label}</strong><span>{value}</span><small>{note}</small></div>)}</div></article>
          <div className="demo-readonly-note"><strong>هل تريد تجربة الحساب الحقيقي؟</strong><span>أنشئ حسابًا مستقلًا لتظهر لك بياناتك الفعلية بعد تسجيل الدخول.</span><Link href="/register" className="button button-dark">ابدأ الآن</Link></div>
        </section>
      </div>
    </main>
  );
}
