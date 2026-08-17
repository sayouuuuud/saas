import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleCheck, ShieldCheck } from "lucide-react";

export type PublicSection = { title: string; body: string; bullets?: readonly string[] };

type Props = {
  eyebrow: string;
  title: string;
  accent: string;
  intro: string;
  sections?: readonly PublicSection[];
  ctaLabel?: string;
  ctaHref?: string;
};

export function Brand() {
  return <Link href="/" className="brand" aria-label="مركزية، الصفحة الرئيسية"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link>;
}

export default function PublicPage({ eyebrow, title, accent, intro, sections = [], ctaLabel = "ابدأ تجربتك الآن", ctaHref = "/register" }: Props) {
  return <main className="public-shell">
    <header className="public-header section-container"><Brand /><nav className="public-nav"><Link href="/features">المزايا</Link><Link href="/pricing">الأسعار</Link><Link href="/how-it-works">كيف تعمل</Link><Link href="/resources/faq">الأسئلة الشائعة</Link></nav><div className="public-actions"><Link href="/login" className="login-link">تسجيل الدخول</Link><Link href={ctaHref} className="button button-dark">ابدأ الآن <ArrowLeft size={15} /></Link></div></header>
    <section className="public-hero section-container"><div className="section-eyebrow"><span className="eyebrow-dot" />{eyebrow}</div><h1>{title}<br /><em>{accent}</em></h1><p>{intro}</p><div className="hero-actions"><Link href={ctaHref} className="button button-dark button-large">{ctaLabel} <ArrowLeft size={17} /></Link><Link href="/contact" className="text-link">تحدث معنا <ArrowLeft size={15} /></Link></div></section>
    {sections.length > 0 && <section className="public-sections section-container">{sections.map((section) => <article className="public-section-card" key={section.title}><div className="feature-icon peach"><CircleCheck size={19} /></div><h2>{section.title}</h2><p>{section.body}</p>{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}><Check size={15} />{bullet}</li>)}</ul>}</article>)}</section>}
    <section className="public-trust section-container"><div><ShieldCheck size={19} /><span><b>حدود واضحة</b><small>نحفظ SaaS ونترك LMS مستقلًا.</small></span></div><div><CircleCheck size={19} /><span><b>بيانات صادقة</b><small>كل رقم له مصدر ووقت تحديث.</small></span></div><Link href={ctaHref} className="button button-outline">{ctaLabel} <ArrowRight size={15} /></Link></section>
    <footer className="public-footer section-container"><Brand /><span>© 2026 مركزية. إدارة SaaS بوضوح.</span><div><Link href="/privacy">الخصوصية</Link><Link href="/terms">الشروط</Link><Link href="/contact">الدعم</Link></div></footer>
  </main>;
}
