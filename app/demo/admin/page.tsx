import Link from "next/link";

export const metadata = {
  title: "لوحة الأدمن التجريبية | مركزية",
  description: "عرض تجريبي للوحة تشغيل مركزية ببيانات وهمية للقراءة فقط دون تسجيل دخول.",
};

const adminSections = [
  { label: "نظرة عامة", value: "ملخص التشغيل" },
  { label: "المدرسون", value: "12 حسابًا تجريبيًا" },
  { label: "الاشتراكات", value: "9 نشطة · 2 تجريبية" },
  { label: "الدعم", value: "4 تذاكر مفتوحة" },
  { label: "السجل والتشغيل", value: "آخر تحديث منذ 8 دقائق" },
];

export default function DemoAdminPage() {
  return (
    <main className="demo-account-shell demo-admin-shell">
      <div className="section-container">
        <div className="demo-account-topbar">
          <Link href="/" className="brand" aria-label="العودة إلى مركزية">
            <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
            مركزية
          </Link>
          <div className="demo-account-actions">
            <span className="demo-badge">وضع الأدمن · قراءة فقط</span>
            <Link href="/demo/account" className="button button-outline">ديمو المدرس</Link>
            <Link href="/register" className="button button-dark">إنشاء حساب حقيقي</Link>
          </div>
        </div>

        <div className="demo-disclaimer" role="note">
          <strong>هذه لوحة تشغيل تجريبية ببيانات غير حساسة.</strong>
          <span>لا توجد جلسة Staff، ولا يتم استدعاء APIs إدارية، وكل الأرقام والتنبيهات للشرح فقط.</span>
        </div>

        <section className="demo-admin-main" aria-labelledby="demo-admin-title">
          <div className="demo-heading-row">
            <div>
              <span className="section-eyebrow"><span className="eyebrow-dot" /> مركز التحكم التجريبي</span>
              <h1 id="demo-admin-title">رؤية تشغيلية <em>في لمحة.</em></h1>
              <p>استكشف كيف يراجع فريق التشغيل حالة الحسابات والاشتراكات والدعم دون الوصول إلى بيانات عملاء حقيقية.</p>
            </div>
            <span className="demo-status">● بيئة عرض منفصلة</span>
          </div>

          <div className="demo-metric-grid demo-admin-metrics">
            <article className="demo-metric-card"><span>إجمالي المدرسين</span><strong>12</strong><small>بيانات تجريبية</small></article>
            <article className="demo-metric-card"><span>MRR تجريبي</span><strong>$1,248</strong><small>ليس إيرادًا فعليًا</small></article>
            <article className="demo-metric-card"><span>تذاكر تحتاج متابعة</span><strong className="demo-orange">4</strong><small>حالات مصطنعة للعرض</small></article>
            <article className="demo-metric-card"><span>حالة التشغيل</span><strong className="demo-green">مستقر</strong><small>آخر فحص منذ 8 دقائق</small></article>
          </div>

          <div className="demo-panel-grid demo-admin-grid">
            <article className="demo-panel demo-panel-wide">
              <div className="demo-panel-heading"><div><b>ملخص الأقسام</b><small>صلاحيات وبيانات افتراضية</small></div><span className="demo-chip">Demo</span></div>
              <div className="demo-admin-section-list">
                {adminSections.map((section) => <div key={section.label} className="demo-admin-section-row"><span>{section.label}</span><strong>{section.value}</strong><span className="demo-row-arrow">←</span></div>)}
              </div>
            </article>
            <article className="demo-panel">
              <div className="demo-panel-heading"><div><b>تنبيهات التشغيل</b><small>للعرض فقط</small></div><span className="demo-dot-status">● بلا حوادث</span></div>
              <div className="demo-alert-list"><div><strong>Webhook تجريبي</strong><span>تمت المعالجة بنجاح</span></div><div><strong>طلب حذف تجريبي</strong><span>بانتظار المراجعة</span></div><div><strong>تحديث النظام</strong><span>لا يتطلب إجراءً</span></div></div>
            </article>
          </div>

          <div className="demo-readonly-note"><strong>مهم: هذا ليس دخول Admin حقيقيًا.</strong><span>لا توجد أدوات تعديل أو حذف أو تصدير، ولا يمكن رؤية حسابات العملاء. عند استخدام الحساب الحقيقي، تُطبق StaffRole و2FA والصلاحيات server-side.</span><Link href="/demo/account" className="text-link">شاهد ديمو المدرس ←</Link></div>
        </section>
      </div>
    </main>
  );
}
