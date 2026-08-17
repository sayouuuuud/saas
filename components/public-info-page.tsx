import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

export type PublicInfoSection = {
  eyebrow: string;
  title: string;
  body: string;
  bullets?: string[];
};

export default function PublicInfoPage({
  eyebrow,
  title,
  description,
  sections,
  ctaLabel = "ابدأ الآن",
  ctaHref = "/register",
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: PublicInfoSection[];
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <main className="site-shell public-info-page" dir="rtl">
      <header className="site-header section-container">
        <Link href="/" className="brand" aria-label="مركزية، الصفحة الرئيسية">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>مركزية</span>
        </Link>
        <nav className="main-nav public-info-nav" aria-label="التنقل العام">
          <Link href="/features">المزايا</Link>
          <Link href="/how-it-works">كيف تعمل</Link>
          <Link href="/pricing">الأسعار</Link>
          <Link href="/login">تسجيل الدخول</Link>
        </nav>
        <Link href={ctaHref} className="button button-dark header-cta">{ctaLabel} <ArrowLeft size={16} /></Link>
      </header>

      <section className="section-container public-info-hero" aria-labelledby="public-info-title">
        <div className="section-eyebrow"><span className="eyebrow-dot" />{eyebrow}</div>
        <h1 id="public-info-title">{title}</h1>
        <p>{description}</p>
        <div className="hero-actions">
          <Link href={ctaHref} className="button button-dark button-large">{ctaLabel} <ArrowLeft size={18} /></Link>
          <Link href="/" className="text-link">العودة للرئيسية</Link>
        </div>
      </section>

      <section className="section-container public-info-grid" aria-label="تفاصيل الصفحة">
        {sections.map((section) => (
          <article className="feature-card public-info-card" key={section.title}>
            <div className="feature-icon peach"><CheckCircle2 size={20} aria-hidden="true" /></div>
            <div className="card-label">{section.eyebrow}</div>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            {section.bullets?.length ? (
              <ul>
                {section.bullets.map((bullet) => <li key={bullet}><CheckCircle2 size={15} aria-hidden="true" />{bullet}</li>)}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      <aside className="section-container public-info-boundary" aria-label="حدود المنتج">
        <ShieldCheck size={21} aria-hidden="true" />
        <p><strong>حدود واضحة:</strong> مركزية تدير حساب SaaS والاشتراك والفوترة والدعم وروابط المنصة فقط. لا ننشئ LMS، ولا ننسخ محتواه، ولا نقرأ قاعدة بياناته مباشرة.</p>
      </aside>
    </main>
  );
}
