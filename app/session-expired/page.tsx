import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

export const metadata = {
  title: "انتهت الجلسة | مركزية",
  description: "أعد تسجيل الدخول إلى حساب مركزية لمتابعة استخدام مساحة العمل بأمان.",
};

export default function SessionExpiredPage() {
  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-panel auth-brand-panel">
        <Link href="/" className="brand auth-brand" aria-label="مركزية، الصفحة الرئيسية"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link>
        <div className="auth-brand-copy">
          <span className="section-eyebrow"><span className="eyebrow-dot" />حماية الحساب</span>
          <h1>الجلسة انتهت،<br /><em>وحسابك بخير.</em></h1>
          <p>انتهت صلاحية جلسة الدخول أو تم إنهاؤها. سجّل الدخول من جديد، ولا تستخدم رابطًا قديمًا أو تشارك رمز جلسة مع أي شخص. لا ننشئ LMS ولا نخلط جلسة SaaS مع بيانات منصتك.</p>
        </div>
        <div className="auth-footer-note">© 2026 مركزية · بيانات SaaS منفصلة عن LMS.</div>
      </section>
      <section className="auth-panel auth-form-panel">
        <Link href="/" className="auth-back"><ArrowLeft size={15} /> العودة للرئيسية</Link>
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span className="auth-icon"><LockKeyhole size={17} /></span>
            <h2>أعد تسجيل الدخول</h2>
            <p>سيتم إنشاء جلسة جديدة، وقد يطلب منك رمز المصادقة إذا كان مفعّلًا.</p>
          </div>
          <Link href="/login" className="button button-dark button-large">الذهاب لتسجيل الدخول <ArrowLeft size={15} /></Link>
          <p className="auth-legal">إذا لم تبدأ هذه العملية بنفسك، غيّر كلمة المرور وراجع الجلسات النشطة من إعدادات الأمان بعد الدخول.</p>
        </div>
      </section>
    </main>
  );
}
