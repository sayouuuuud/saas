import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleCheck, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/public-page";

const useCases = [
  { slug: "individual-teacher", eyebrow: "للمعلم المستقل", title: "إدارة أبسط، تركيز أكبر", body: "مساحة عمل واحدة تجمع حسابك وباقتك وفواتيرك ورابط منصتك دون تعقيد." },
  { slug: "academy", eyebrow: "للأكاديمية", title: "كل حساباتك في صورة واحدة", body: "نظّم العضويات والفوترة والدعم مع إبقاء أنظمة التعليم التي تستخدمها مستقلة عن SaaS." },
  { slug: "education-business", eyebrow: "لأعمال التعليم", title: "نمو منظم، قرارات موثوقة", body: "سياسات وصلاحيات وفوترة قابلة للمراجعة عند التوسع، بلا أرقام مخمّنة." },
] as const;

export const metadata = { title: "حالات الاستخدام — مركزية", description: "اكتشف كيف يستخدم المعلمون والأكاديميات وأعمال التعليم مركزية لإدارة الحساب والاشتراك والدعم." };

export default function UseCasesIndexPage() {
  return (
    <main className="public-shell">
      <header className="public-header section-container">
        <Brand />
        <nav className="public-nav">
          <Link href="/features">المزايا</Link>
          <Link href="/pricing">الأسعار</Link>
          <Link href="/how-it-works">كيف تعمل</Link>
          <Link href="/resources/faq">الأسئلة الشائعة</Link>
        </nav>
        <div className="public-actions">
          <Link href="/login" className="login-link">تسجيل الدخول</Link>
          <Link href="/register" className="button button-dark">ابدأ الآن <ArrowLeft size={15} /></Link>
        </div>
      </header>

      <section className="public-hero section-container">
        <div className="section-eyebrow"><span className="eyebrow-dot" />حالات الاستخدام</div>
        <h1>مركزية تناسب<br /><em>طريقة عملك.</em></h1>
        <p>سواء كنت معلمًا مستقلًا أو أكاديمية أو عملًا تعليميًا متوسعًا، تبقى SaaS مستقلة تمامًا عن منصة تعليمك.</p>
      </section>

      <section className="public-sections section-container">
        {useCases.map((item) => (
          <Link href={`/use-cases/${item.slug}`} className="public-section-card" key={item.slug}>
            <div className="feature-icon peach"><CircleCheck size={19} /></div>
            <span className="section-eyebrow"><span className="eyebrow-dot" />{item.eyebrow}</span>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            <span className="text-link">اطّلع على التفاصيل <ArrowLeft size={15} /></span>
          </Link>
        ))}
      </section>

      <section className="public-trust section-container">
        <div><ShieldCheck size={19} /><span><b>حدود واضحة</b><small>نحفظ SaaS ونترك LMS مستقلًا.</small></span></div>
        <div><Check size={19} /><span><b>بيانات صادقة</b><small>كل رقم له مصدر ووقت تحديث.</small></span></div>
        <Link href="/register" className="button button-outline">ابدأ تجربتك الآن <ArrowRight size={15} /></Link>
      </section>

      <footer className="public-footer section-container">
        <Brand />
        <span>© 2026 مركزية. إدارة SaaS بوضوح.</span>
        <div>
          <Link href="/privacy">الخصوصية</Link>
          <Link href="/terms">الشروط</Link>
          <Link href="/contact">الدعم</Link>
        </div>
      </footer>
    </main>
  );
}
