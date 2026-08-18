import Link from "next/link";

export const metadata = {
  title: "حساب تجريبي | مركزية",
  description: "عرض تجريبي للوحة حساب مركزية ببيانات وهمية للقراءة فقط دون تسجيل دخول.",
};

const sections = [
  { slug: "overview", label: "نظرة عامة", note: "ملخص الحساب" },
  { slug: "subscription", label: "الاشتراك", note: "الخطة والفوترة" },
  { slug: "usage", label: "الاستخدام", note: "مؤشرات SaaS" },
  { slug: "team", label: "الفريق", note: "الأعضاء والدعوات" },
  { slug: "support", label: "الدعم", note: "التذاكر" },
  { slug: "security", label: "الأمان", note: "حالة الحساب" },
];

export default function DemoAccountPage() {
  return (
    <main className="demo-account-shell">
      <div className="section-container">
        <div className="demo-account-topbar">
          <Link href="/" className="brand" aria-label="العودة إلى مركزية">
            <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
            مركزية
          </Link>
          <div className="demo-account-actions">
            <span className="demo-badge">وضع العرض · قراءة فقط</span>
            <Link href="/register" className="button button-dark">إنشاء حساب حقيقي</Link>
          </div>
        </div>

        <div className="demo-disclaimer" role="note">
          <strong>هذه بيانات تجريبية غير حساسة.</strong>
          <span>لا توجد جلسة دخول، ولا يتم استدعاء APIs خاصة، وكل إجراءات الدفع والتعديل معطلة في هذا العرض.</span>
        </div>

        <div className="demo-account-layout">
          <aside className="demo-sidebar" aria-label="تنقل العرض التجريبي">
            <div className="demo-workspace">
              <span className="demo-avatar">م</span>
              <span><b>أكاديمية المدار</b><small>حساب مدرس تجريبي</small></span>
            </div>
            <span className="demo-nav-label">الحساب</span>
            {sections.map((section) => (
              <Link key={section.slug} href={`/demo/account/${section.slug}`} className={`demo-nav-link ${section.slug === "overview" ? "active" : ""}`}>
                <span>{section.label}</span><small>{section.note}</small>
              </Link>
            ))}
            <div className="demo-sidebar-footer">
              <span className="demo-avatar muted">م</span>
              <span><b>مستخدم العرض</b><small>demo@example.com</small></span>
            </div>
          </aside>

          <section className="demo-account-main">
            <div className="demo-heading-row">
              <div><span className="section-eyebrow"><span className="eyebrow-dot" /> حساب SaaS تجريبي</span><h1>أهلًا بك في <em>لوحة التحكم</em></h1><p>استكشف شكل الحساب، الاشتراك، الاستخدام، الفريق، الدعم، والأمان قبل إنشاء حسابك.</p></div>
              <span className="demo-status">● لا توجد جلسة حقيقية</span>
            </div>

            <div className="demo-metric-grid">
              <article className="demo-metric-card"><span>الخطة الحالية</span><strong>Growth</strong><small>شهري · تجريبي</small></article>
              <article className="demo-metric-card"><span>حالة الاشتراك</span><strong className="demo-green">نشط تجريبيًا</strong><small>لا توجد عملية دفع</small></article>
              <article className="demo-metric-card"><span>أعضاء الفريق</span><strong>4</strong><small>من أصل 10 في العرض</small></article>
              <article className="demo-metric-card"><span>تذاكر الدعم</span><strong>2</strong><small>تجريبية للعرض فقط</small></article>
            </div>

            <div className="demo-panel-grid">
              <article className="demo-panel demo-panel-wide"><div className="demo-panel-heading"><div><b>نشاط SaaS خلال 30 يومًا</b><small>بيانات وهمية للشرح فقط</small></div><span className="demo-chip">عرض</span></div><div className="demo-bars" aria-label="رسم توضيحي للنشاط"><i style={{ height: "35%" }} /><i style={{ height: "52%" }} /><i style={{ height: "44%" }} /><i style={{ height: "70%" }} /><i style={{ height: "62%" }} /><i style={{ height: "82%" }} /><i style={{ height: "66%" }} /><i style={{ height: "91%" }} /><i style={{ height: "76%" }} /><i style={{ height: "98%" }} /></div><div className="demo-axis"><span>منذ 30 يومًا</span><span>اليوم</span></div></article>
              <article className="demo-panel"><div className="demo-panel-heading"><div><b>رابط LMS</b><small>Link-only</small></div><span className="demo-dot-status">● محفوظ</span></div><div className="demo-link-card"><strong>academy.example.com</strong><span>آخر فحص: منذ ساعتين</span><Link href="/demo/account/overview">عرض الحالة ←</Link></div></article>
            </div>

            <div className="demo-quick-actions"><span>استكشف أقسام العرض</span>{sections.slice(1, 5).map((section) => <Link key={section.slug} href={`/demo/account/${section.slug}`} className="button button-outline">{section.label}</Link>)}</div>

            <div className="demo-readonly-note"><strong>ماذا يحدث عند إنشاء حساب حقيقي؟</strong><span>تحصل على مساحة عمل خاصة، جلسة آمنة، APIs محمية، وفوترة مرتبطة بمزود الدفع عند تفعيله. هذا العرض لا يخلط بين تجربة المنتج وبيانات العملاء.</span><Link href="/register" className="text-link">ابدأ التسجيل ←</Link></div>
          </section>
        </div>
      </div>
    </main>
  );
}
