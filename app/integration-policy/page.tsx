import PublicInfoPage from "@/components/public-info-page";

export const metadata = {
  title: "سياسة التكامل | مركزية",
  description: "حدود تكامل مركزية مع الخدمات الخارجية وشرط API contract الرسمي قبل أي تكامل LMS أو SSO.",
};

export default function IntegrationPolicyPage() {
  return (
    <PublicInfoPage
      eyebrow="سياسة التكامل"
      title="تكاملات موثقة،"
      description="تتعامل مركزية مع SaaS الخاص بها أولًا. لا نعلن تكاملًا مع LMS أو SSO ولا نقرأ نظامًا خارجيًا دون عقد API رسمي يحدد النطاق والصلاحيات ومصدر الحقيقة."
      ctaLabel="تحدث مع الفريق"
      ctaHref="/contact"
      sections={[
        {
          eyebrow: "01 / SaaS Core",
          title: "التكاملات الأساسية داخل المنصة",
          body: "الحساب ومساحة العمل والباقات والاشتراك والفوترة والدعم وروابط المنصة تعمل ضمن حدود Centralia، مع audit وrate limits وtenant isolation.",
          bullets: ["Session و2FA وStaff roles", "اشتراك وفوترة عبر adapter", "Audit evidence لكل تغيير حساس"],
        },
        {
          eyebrow: "02 / الدفع والبريد",
          title: "مزود الخدمة هو مصدر الحقيقة",
          body: "لا يُفعّل الدفع التجاري أو إرسال البريد الحقيقي إلا بعد ضبط credentials وwebhook secret وسياسة retry ومراجعة المخرجات. الوضع المحلي mock لا يمثل اتصال الإنتاج.",
          bullets: ["Webhook signature verification", "Idempotency وإعادة المحاولة", "حالة unavailable بدل اختلاق نجاح"],
        },
        {
          eyebrow: "03 / LMS وSSO",
          title: "لا تكامل بلا API contract",
          body: "لا تنفذ مركزية تكامل LMS أو SSO من خلال تخمين endpoints أو نسخ قاعدة بيانات. يلزم عقد رسمي يحدد المصادقة والعمليات والنماذج والصلاحيات والمزامنة والإلغاء والتعامل مع البيانات القديمة.",
          bullets: ["Endpoints وschemas رسمية", "نطاقات وصلاحيات واضحة", "مصدر حقيقة وعتبة freshness", "خطة فشل وrollback"],
        },
        {
          eyebrow: "04 / حالات التشغيل",
          title: "حالة صادقة وقابلة للمراجعة",
          body: "عندما لا يكون مزود خارجي مهيأ أو لا توجد بيانات كافية، تعرض الواجهة unknown أو unavailable أو link-only بدل ادعاء أن الخدمة متصلة أو أن الأرقام دقيقة.",
          bullets: ["Last checked وfreshness", "لا أرقام تعليمية مخمّنة", "تسجيل أخطاء التشغيل بأمان"],
        },
      ]}
    />
  );
}
