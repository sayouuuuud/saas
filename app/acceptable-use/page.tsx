import type { Metadata } from 'next'
import PublicInfoPage from '@/components/public-info-page'

export const metadata: Metadata = { title: 'الاستخدام المقبول | مركزية', description: 'قواعد الاستخدام المقبول لمنصة مركزية SaaS.' }

export default function AcceptableUsePage() {
  return <PublicInfoPage eyebrow="الاستخدام المقبول" title="ابنِ مساحة عمل موثوقة." description="تساعد هذه القواعد على إبقاء مركزية آمنة وقابلة للاعتماد لكل مساحة عمل وحساب." sections={[{ eyebrow: 'ممنوع', title: 'لا إساءة ولا تحايل', body: 'يُمنع استخدام الخدمة للوصول غير المصرح به، انتحال الهوية، تعطيل الخدمة، تجاوز حدود الحساب، أو اختبار أنظمة خارجية دون تفويض.' }, { eyebrow: 'المحتوى', title: 'احترم حقوق الآخرين', body: 'يجب أن تملك الحق في أي وصف أو رابط أو مرفق تضيفه إلى SaaS، وألا تستخدم المنصة لتخزين أو مشاركة محتوى غير قانوني أو ضار.' }, { eyebrow: 'الاستقلال', title: 'لا وصول مباشر إلى LMS', body: 'لا يجوز تقديم بيانات دخول LMS أو أسرار قواعد البيانات إلى مركزية عبر القنوات غير المعلنة. نموذج المنتج الحالي Link-only، وأي تكامل يحتاج عقدًا رسميًا وصلاحيات محددة.' }]} />
}
