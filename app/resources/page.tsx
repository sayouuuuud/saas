import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleCheck, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/public-page";

const resources = [
  { slug: "blog", eyebrow: "المجلة", title: "أفكار عملية لإدارة SaaS", body: "مقالات قصيرة عن وضوح الاشتراكات، حدود التكامل، وحماية بيانات الحساب." },
  { slug: "guides", eyebrow: "الأدلة", title: "خطوات واضحة دون تعقيد", body: "أدلة عملية لإنشاء مساحة العمل، إضافة رابط آمن، وفتح تذكرة دعم." },
  { slug: "faq", eyebrow: "الأسئلة الشائعة", title: "إجابات قبل أن تبدأ", body: "هل مركزية LMS؟ لا. إجابات مباشرة عن حدود مركزية وما تحفظه فعلًا." },
  { slug: "status", eyebrow: "حالة الخدمة", title: "اعرف ما يعمل بوضوح", body: "حالة خدمات SaaS الأساسية وخدمة فحص رابط LMS الاختيارية." },
] as const;

export const metadata = { title: "المصادر — مركزية", description: "المجلة والأدلة والأسئلة الشائعة وحالة الخدمة لمنصة مركزية." };

export default function ResourcesIndexPage() {
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
        <div className="section-eyebrow"><span className="eyebrow-dot" />المصادر</div>
        <h1>كل ما تحتاجه<br /><em>لفهم مركزية.</em></h1>
        <p>مجلة وأدلة وأسئلة شائعة وحالة خدمة، كلها بالوضوح نفسه الذي تديّر به حسابك.</p>
      </section>

      <section className="public-sections section-container">
        {resources.map((item) => (
          <Link href={`/resources/${item.slug}`} className="public-section-card" key={item.slug}>
            <div className="feature-icon peach"><CircleCheck size={19} /></div>
            <span className="section-eyebrow"><span className="eyebrow-dot" />{item.eyebrow}</span>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            <span className="text-link">اقرأ المزيد <ArrowLeft size={15} /></span>
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
