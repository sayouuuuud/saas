import PublicPage from "@/components/public-page";

const content = {
  blog: { eyebrow: "المجلة", title: "أفكار عملية", accent: "لإدارة SaaS.", intro: "مقالات قصيرة عن وضوح الاشتراكات، حدود التكامل، وحماية بيانات الحساب.", sections: [{ title: "كيف تقرأ فاتورتك", body: "ابدأ من الحالة والفترة والمبلغ ومصدر الدفع، ولا تخلط بين فاتورة SaaS وأي فاتورة من LMS.", bullets: ["رقم الفاتورة", "الفترة الحالية", "حالة الدفع"] }] },
  guides: { eyebrow: "الأدلة", title: "خطوات واضحة", accent: "دون تعقيد.", intro: "أدلة تساعدك على إنشاء مساحة العمل، إضافة رابط آمن، وفتح تذكرة دعم.", sections: [{ title: "دليل إضافة رابط", body: "استخدم HTTPS ورابطًا تملكه، ثم راقب حالة الوصول دون اعتبار الفحص ضمانًا لصحة النظام الخارجي.", bullets: ["HTTPS فقط", "رفض الشبكات الداخلية", "سجل آخر فحص"] }] },
  faq: { eyebrow: "الأسئلة الشائعة", title: "إجابات قبل", accent: "أن تبدأ.", intro: "هل مركزية LMS؟ لا. هل تقرأ قاعدة بياناته؟ لا. هي SaaS مستقل لإدارة الحساب والاشتراك والدعم والرابط.", sections: [{ title: "هل تنشئون منصة تعليمية؟", body: "لا. نحفظ رابط المنصة القائمة فقط ولا ننشئ قاعدة بيانات أو Storage أو حاويات لها.", bullets: ["Link-only افتراضيًا", "تكامل لاحق بموافقة", "لا نسخ للمحتوى"] }, { title: "هل الأرقام التعليمية متاحة؟", body: "تظهر فقط عند وجود مصدر رسمي موثق. وإلا نعرضها كغير متاحة بدل اختراعها.", bullets: ["مصدر واضح", "وقت آخر تحديث", "Exact أو Estimated"] }] },
  status: { eyebrow: "حالة الخدمة", title: "اعرف ما يعمل", accent: "بوضوح.", intro: "هذه الصفحة تعرض حالة خدمات SaaS. فحص رابط LMS يوضح الوصول إلى الرابط فقط ولا يساوي صحة كل مكون خارجي.", sections: [{ title: "SaaS Core", body: "الحساب، المساحات، الباقات، الفوترة، التذاكر، وسجل التدقيق تعمل ضمن نطاق مركزية.", bullets: ["مصادقة", "فواتير", "دعم"] }, { title: "LMS Link Check", body: "خدمة اختيارية لفحص الوصول إلى رابط مسجل مع قيود SSRF ووقت انتظار محدود.", bullets: ["Reachable أو Unreachable", "لا فحص داخلي", "لا قراءة للمحتوى"] }] },
} as const;

export default async function ResourcePage({ params }: { params: Promise<{ slug: keyof typeof content }> }) {
  const { slug } = await params;
  return <PublicPage {...(content[slug] || content.faq)} />;
}
