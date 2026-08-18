import Link from "next/link";
import { notFound } from "next/navigation";
import WorkspaceShell from "@/components/workspace-shell";

const demoUser = { name: "محمد", email: "teacher.demo@centralia.test", workspaceName: "أكاديمية المدار" };
const demoBasePath = "/demo/account";

type SectionData = { title: string; description: string; metrics: Array<[string, string, string]>; rows: Array<[string, string, string]> };
const sectionData: Record<string, SectionData> = {
  profile: { title: "ملفي", description: "بيانات الملف الشخصي التجريبية للقراءة فقط.", metrics: [["الاسم", "محمد أحمد", "حساب عرض"], ["البريد", "teacher.demo", "غير قابل للتعديل"], ["الدور", "Owner", "مساحة العمل"]], rows: [["الاسم الكامل", "محمد أحمد", "بيانات تجريبية"], ["مساحة العمل", "أكاديمية المدار", "بيانات العرض"], ["الحالة", "نشط تجريبيًا", "لا توجد جلسة"]] },
  lms: { title: "رابط المنصة", description: "إدارة رابط LMS المرجعي كما يظهر في الحساب، من دون قراءة محتوى LMS أو تنفيذ مزامنة.", metrics: [["الروابط", "1", "محفوظ تجريبيًا"], ["الحالة", "قابل للوصول", "آخر فحص اليوم"], ["المزامنة", "غير متاحة", "لا يوجد API رسمي"]], rows: [["المنصة الرئيسية", "academy.example.com", "قابل للوصول"], ["آخر فحص", "اليوم 10:30", "فحص عرض"], ["المحتوى", "غير مقروء", "Link-only"]] },
  subscription: { title: "الاشتراك", description: "نفس ملخص الاشتراك والفترة الحالية مع تعطيل إجراءات الدفع في وضع العرض.", metrics: [["الخطة", "Growth", "شهري"], ["الحالة", "تجريبية", "لا يوجد دفع"], ["التجديد", "15 سبتمبر", "عرض فقط"]], rows: [["الخطة الحالية", "Growth", "تجريبية"], ["دورة الفوترة", "شهرية", "بيانات عرض"], ["الإلغاء", "غير مجدول", "لا يمكن التعديل"]] },
  billing: { title: "الفوترة", description: "نسخة قراءة فقط من الفوترة والفواتير وطرق الدفع، بلا اتصال بمزود دفع.", metrics: [["الفواتير", "2", "تجريبية"], ["المدفوع", "98.00 USD", "غير حقيقي"], ["طريقة الدفع", "Visa •••• 4242", "بيانات وهمية"]], rows: [["INV-DEMO-002", "49.00 USD", "مدفوعة تجريبيًا"], ["INV-DEMO-001", "49.00 USD", "مدفوعة تجريبيًا"], ["مزود الدفع", "غير متصل", "يحتاج credentials"]] },
  usage: { title: "الاستخدام", description: "مؤشرات SaaS كما تظهر في الحساب، مع توضيح أن مقاييس LMS غير متاحة بلا API رسمي.", metrics: [["المستخدمون النشطون", "248", "هذا الشهر"], ["الأحداث", "1,840", "تجريبية"], ["الحد المستخدم", "42%", "من الخطة"]], rows: [["تسجيلات الدخول", "612", "منذ 30 يومًا"], ["عمليات مساحة العمل", "1,228", "منذ 30 يومًا"], ["مزامنة LMS", "غير متاحة", "لا يوجد API رسمي"]] },
  reports: { title: "التقارير", description: "تقارير SaaS التجريبية للعرض، مع فصل واضح عن تقارير التعليم أو محتوى LMS.", metrics: [["الإيراد الشهري", "49 USD", "تجريبي"], ["النمو", "+12%", "توضيحي"], ["الفترة", "30 يومًا", "عرض فقط"]], rows: [["الاشتراكات", "1 نشط", "بيانات عرض"], ["الفواتير المدفوعة", "2", "بيانات عرض"], ["مصدر LMS", "غير متاح", "لا يوجد API رسمي"]] },
  team: { title: "الفريق", description: "أعضاء ودعوات مساحة العمل كما تظهر في الحساب الحقيقي، بلا عمليات تعديل.", metrics: [["الأعضاء", "4", "من أصل 10"], ["الدعوات", "1", "تجريبية"], ["الدور الرئيسي", "Owner", "مساحة العرض"]], rows: [["مريم أحمد", "Owner", "نشط"], ["عمر علي", "Support", "نشط"], ["سارة حسن", "Analyst", "نشط"]] },
  support: { title: "الدعم", description: "مركز الدعم التجريبي للقراءة فقط، من دون إرسال رسائل أو إنشاء تذاكر حقيقية.", metrics: [["التذاكر المفتوحة", "2", "للعرض"], ["متوسط الرد", "4 ساعات", "توضيحي"], ["SLA", "نشط", "نموذج"]], rows: [["كيف أضيف عضوًا؟", "مفتوحة", "دعم الحساب"], ["مراجعة الخطة", "قيد المتابعة", "الفوترة"]] },
  notifications: { title: "الإشعارات", description: "قائمة إشعارات SaaS التجريبية كما تظهر داخل مساحة العمل.", metrics: [["غير المقروء", "3", "تجريبية"], ["التنبيهات", "مفعّلة", "عرض فقط"], ["البريد", "غير متصل", "مزود خارجي"]], rows: [["تجديد الاشتراك", "منذ ساعة", "تجريبي"], ["تذكرة دعم محدثة", "أمس", "تجريبي"], ["فحص الرابط", "هذا الأسبوع", "تجريبي"]] },
  security: { title: "الأمان", description: "حالة الأمان التجريبية للقراءة فقط؛ لا توجد جلسة حقيقية يمكن تعديلها.", metrics: [["2FA", "مفعّل", "في المثال"], ["الجلسات", "2", "تجريبية"], ["آخر نشاط", "منذ 8 دقائق", "بيانات عرض"]], rows: [["المصادقة الثنائية", "مفعّلة", "TOTP"], ["جلسات الحساب", "قراءة فقط", "لا يمكن إلغاؤها هنا"], ["بيانات الاستعادة", "غير معروضة", "للحساب الحقيقي فقط"]] },
  settings: { title: "الإعدادات", description: "إعدادات مساحة العمل التجريبية مع تعطيل الحفظ والحذف.", metrics: [["المنطقة الزمنية", "Africa/Cairo", "تجريبية"], ["اللغة", "العربية", "RTL"], ["الخصوصية", "مفعّلة", "عرض فقط"]], rows: [["اسم مساحة العمل", "أكاديمية المدار", "غير قابل للتعديل"], ["حذف البيانات", "غير متاح", "للحساب الحقيقي فقط"], ["الاحتفاظ", "مراجعة يدوية", "سياسة العرض"]] },
};

export function generateStaticParams() { return Object.keys(sectionData).map((section) => ({ section })); }
export const dynamicParams = false;

export default async function DemoAccountSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const data = sectionData[section];
  if (!data) notFound();
  return <WorkspaceShell active={section} title={data.title} intro={data.description} demoBasePath={demoBasePath} demoUser={demoUser}>
    <div className="workspace-card-grid">
      <article className="workspace-panel workspace-panel-accent"><span className="section-eyebrow"><span className="eyebrow-dot" />وضع العرض</span><h2>{data.title}</h2><p>{data.description}</p><div className="workspace-next"><Link href="/register" className="button button-dark">إنشاء حساب حقيقي</Link><span className="safe-note">قراءة فقط · لا تغييرات حقيقية</span></div></article>
      <article className="workspace-panel"><div className="workspace-panel-heading"><b>ملخص القسم</b><span>بيانات SaaS تجريبية</span></div><div className="workspace-stat-list">{data.metrics.map(([label, value, note]) => <div key={label}><span>{label}<small>{note}</small></span><strong>{value}</strong></div>)}</div></article>
    </div>
    <article className="workspace-panel"><div className="workspace-panel-heading"><div><b>تفاصيل القسم</b><span>نفس نمط قوائم مساحة العمل، مع بيانات ثابتة غير حساسة.</span></div><span className="workspace-status">قراءة فقط</span></div><div className="workspace-list">{data.rows.map(([label, value, note]) => <div className="workspace-list-row" key={label}><span>{label}<small>{note}</small></span><strong>{value}</strong></div>)}</div></article>
  </WorkspaceShell>;
}
