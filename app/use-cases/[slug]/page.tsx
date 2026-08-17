import PublicPage from "@/components/public-page";

const content = {
  "individual-teacher": { eyebrow: "للمعلم المستقل", title: "إدارة أبسط،", accent: "تركيز أكبر.", intro: "مركزية تجمع حسابك، باقتك، فواتيرك، ورابط منصتك في لوحة لا تحتاج إلى شرح طويل.", sections: [{ title: "ابدأ دون فريق", body: "مساحة عمل واحدة وبيانات واضحة تساعدك على متابعة ما يخص SaaS وحدك.", bullets: ["تسجيل سريع", "اشتراك واضح", "دعم عند الحاجة"] }] },
  academy: { eyebrow: "للأكاديمية", title: "كل حساباتك", accent: "في صورة واحدة.", intro: "نظّم العضويات والفوترة والدعم مع إبقاء أنظمة التعليم التي تستخدمها مستقلة عن SaaS.", sections: [{ title: "مساحة عمل للفريق", body: "أضف أعضاء بأدوار واضحة وتابع النشاط من خلال سجلات التدقيق.", bullets: ["مالك وفريق", "صلاحيات محددة", "تقارير تشغيلية"] }] },
  "education-business": { eyebrow: "لأعمال التعليم", title: "نمو منظم،", accent: "وقرارات موثوقة.", intro: "عندما تكبر، تحتاج إلى سياسات وصلاحيات وفوترة قابلة للمراجعة لا إلى أرقام مخمّنة.", sections: [{ title: "تشغيل قابل للتوسع", body: "إدارة الباقات والدعم والروابط والضوابط في طبقة SaaS مستقلة.", bullets: ["تدقيق وأمان", "إدارة اشتراكات", "حدود تكامل صريحة"] }] },
} as const;

export default async function UseCasePage({ params }: { params: Promise<{ slug: keyof typeof content }> }) {
  const { slug } = await params;
  return <PublicPage {...(content[slug] || content["individual-teacher"])} />;
}
