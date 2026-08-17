import PublicInfoPage from "@/components/public-info-page";

export const metadata = {
  title: "الأسعار | مركزية",
  description: "خطط SaaS شفافة لإدارة الحساب والاشتراك والفوترة والدعم وروابط LMS الاختيارية.",
};

const plans = [
  { name: "Starter", price: "19", description: "للمدرس الفردي الذي يريد أساسًا واضحًا.", bullets: ["مدرس واحد ومساحة عمل واحدة", "رابط LMS واحد", "فواتير واشتراك واضح", "دعم عبر التذاكر"] },
  { name: "Growth", price: "39", description: "للفرق الصغيرة التي تحتاج تنظيمًا أوسع.", bullets: ["حتى 5 أعضاء في الفريق", "فحص دوري لرابط LMS", "تقارير SaaS أوسع", "أولوية في متابعة الدعم"] },
  { name: "Academy", price: "79", description: "للأكاديميات والفرق ذات التشغيل المتقدم.", bullets: ["أعضاء ومساحات أكثر", "لوحة تحكم متقدمة", "تقارير تبنٍّ واستخدام", "دعم ذي أولوية"] },
];

export default function PricingPage() {
  return (
    <PublicInfoPage
      eyebrow="أسعار واضحة"
      title="اختر مساحة SaaS تناسب مرحلتك"
      description="هذه الخطط تخص إدارة الحساب والاشتراك والفوترة والدعم وروابط LMS فقط. لا تدفع مقابل تخزين فيديو أو طلاب أو موارد LMS لا يقيسها SaaS بمصدر موثق."
      ctaLabel="أنشئ حسابك"
      sections={plans.map((plan) => ({
        eyebrow: `${plan.name} / SaaS`,
        title: `${plan.price} دولار شهريًا`,
        body: plan.description,
        bullets: plan.bullets,
      }))}
    />
  );
}
