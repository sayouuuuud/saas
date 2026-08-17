import Link from "next/link";
import { CircleCheck, ExternalLink, ShieldCheck } from "lucide-react";
import WorkspaceShell from "@/components/workspace-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const copy: Record<string, { title: string; intro: string; heading: string; body: string; bullets: string[] }> = {
  overview: { title: "نظرة عامة", intro: "صورة سريعة عن حسابك ومساحة عملك.", heading: "ابدأ من الحالة الحالية", body: "كل ما يظهر هنا من SaaS نفسه؛ لا توجد أرقام تعليمية مخمّنة.", bullets: ["راجع الاشتراك والفاتورة", "أضف رابط المنصة عند الحاجة", "افتح تذكرة دعم"] },
  profile: { title: "ملفي", intro: "بيانات هويتك داخل SaaS.", heading: "ملف الحساب", body: "يمكن تحديث الاسم والبريد من API الحساب مع تسجيل الحدث في التدقيق.", bullets: ["الاسم والبريد", "حالة التحقق", "تاريخ إنشاء الحساب"] },
  lms: { title: "رابط المنصة", intro: "إدارة رابط LMS الموجود لديك.", heading: "Link-only", body: "نخزن الرابط ونفحص إمكانية الوصول إليه بأمان. لا ننشئ منصة ولا نقرأ قاعدة بياناتها.", bullets: ["HTTPS فقط", "منع private IP وlocalhost", "طلب تكامل بموافقة"] },
  subscription: { title: "الاشتراك", intro: "الباقة، الحالة، ودورة الفوترة.", heading: "تحكم في اشتراك SaaS", body: "تغيير الباقة والإلغاء وإعادة التفعيل مسارات مستقلة مع أحداث وتدقيق.", bullets: ["شهري أو سنوي", "إلغاء عند نهاية الفترة", "لا حذف لبيانات الحساب"] },
  billing: { title: "الفوترة", intro: "الفواتير ووسيلة الدفع.", heading: "سجل مالي واضح", body: "تظهر الفواتير من قاعدة SaaS، ولا يتم تفعيل دفع حقيقي من دون مزود مضبوط.", bullets: ["رقم وحالة الفاتورة", "عملة ومبلغ", "مصدر دفع محدد"] },
  usage: { title: "الاستخدام", intro: "مؤشرات SaaS التي يمكن قياسها فعليًا.", heading: "لا أرقام بلا مصدر", body: "نعرض نشاط الفريق والتذاكر وفحوص الروابط والتدقيق. الطلاب والفيديوهات والتخزين غير متاحة دون API رسمي.", bullets: ["مصدر كل metric", "وقت آخر تحديث", "Exact أو unavailable"] },
  reports: { title: "التقارير", intro: "تقارير تشغيلية خاصة بـ SaaS.", heading: "تقارير يمكن الوثوق بها", body: "ملخص الاشتراك والفواتير والتذاكر والروابط وسجل التدقيق، دون ادعاء تقارير تعليمية.", bullets: ["ملخص الحساب", "الفواتير", "البيانات غير المتاحة معلّمة"] },
  team: { title: "الفريق", intro: "أعضاء مساحة العمل وصلاحياتهم.", heading: "صلاحيات واضحة", body: "العضويات والأدوار محددة في SaaS ولا تعتمد على إخفاء عناصر الواجهة فقط.", bullets: ["Owner", "Billing manager", "Viewer وAnalyst"] },
  support: { title: "الدعم", intro: "تذاكر ورسائل ومتابعة.", heading: "نحن هنا للمساعدة", body: "استخدم مركز الدعم الحالي لفتح تذكرة أو متابعة تذكرة موجودة.", bullets: ["فئات واضحة", "أولوية وحالة", "سجل رسائل"] },
  notifications: { title: "الإشعارات", intro: "تنبيهات الحساب والفوترة والدعم.", heading: "اعرف ما يستحق انتباهك", body: "الإشعارات داخل SaaS تشمل الدفع والتجديد والحساب وفحص الرابط والدعم.", bullets: ["دفع وتجديد", "فحص الرابط", "دعم وسياسات"] },
  security: { title: "الأمان", intro: "الجلسات، الخصوصية، والأحداث الحساسة.", heading: "أمان قابل للمراجعة", body: "الجلسات Cookies محمية، كلمات المرور مجزأة، والعمليات الحساسة تسجل في AuditLog.", bullets: ["إبطال الجلسة", "حماية SSRF", "عزل مساحة العمل"] },
  settings: { title: "الإعدادات", intro: "اللغة والمنطقة والطلبات الحساسة.", heading: "إعدادات مساحة العمل", body: "يمكن إدارة اسم مساحة العمل الآن، وتُضاف عمليات التصدير والحذف ضمن تدفقات تحقق ومراجعة قبل الإنتاج.", bullets: ["اسم مساحة العمل", "اللغة والمنطقة", "طلبات تصدير أو حذف موثقة"] },
};

export default async function AppWorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = copy[slug] || copy.overview;
  const user = await getCurrentUser();
  if (!user) return <main className="auth-required"><ShieldCheck size={30} /><h1>سجّل الدخول أولًا</h1><p>هذه مساحة SaaS محمية ولا تعتمد على إخفاء الأزرار فقط.</p><Link href="/login" className="button button-dark">تسجيل الدخول</Link></main>;
  if (!user.workspace) return <main className="auth-required"><ShieldCheck size={30} /><h1>لا توجد مساحة عمل</h1><p>لا يمكن عرض مؤشرات مساحة عمل قبل إسناد الحساب إلى مساحة SaaS مصرح بها.</p><Link href="/dashboard" className="button button-dark">العودة للوحة التحكم</Link></main>;
  const counts = await Promise.all([prisma.invoice.count({ where: { workspaceId: user.workspace.id } }), prisma.supportTicket.count({ where: { workspaceId: user.workspace.id } }), prisma.lmsLink.count({ where: { workspaceId: user.workspace.id } })]);
  return <WorkspaceShell active={slug} title={data.title} intro={data.intro}><section className="workspace-card-grid"><article className="workspace-panel workspace-panel-accent"><span className="section-eyebrow"><span className="eyebrow-dot" />{data.heading}</span><h2>{data.heading}</h2><p>{data.body}</p><ul className="workspace-bullets">{data.bullets.map((bullet) => <li key={bullet}><CircleCheck size={15} />{bullet}</li>)}</ul></article><article className="workspace-panel"><div className="workspace-panel-heading"><b>مؤشرات مساحة العمل</b><ExternalLink size={16} /></div><div className="workspace-stat-list"><div><span>الفواتير</span><strong>{counts[0]}</strong></div><div><span>التذاكر</span><strong>{counts[1]}</strong></div><div><span>روابط LMS</span><strong>{counts[2]}</strong></div></div><p className="safe-note"><ShieldCheck size={15} /> مؤشرات SaaS فقط — لا قراءة لمحتوى المنصة.</p></article></section><section className="workspace-next"><Link href="/billing" className="button button-dark">فتح الفوترة</Link><Link href="/support" className="button button-outline">فتح الدعم</Link><Link href="/dashboard" className="text-link">لوحة التحكم الحالية ↩</Link></section></WorkspaceShell>;
}
