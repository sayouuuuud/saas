# منصة مركزية SaaS

منصة SaaS عربية مستقلة عن أنظمة LMS، مبنية باستخدام **Next.js 16.3** و**Prisma 6** و**SQLite للتطوير المحلي**، مع نشر إنتاجي على Vercel. تحتفظ المنصة ببيانات المستخدمين ومساحات العمل والاشتراكات والفوترة والدعم وروابط التكامل فقط؛ ولا تنشئ اتصالًا بقاعدة بيانات LMS خارجية.

## التشغيل المحلي

يتطلب المشروع Node.js 22 أو أحدث و`pnpm`. بعد تثبيت الاعتماديات، انسخ `.env.example` إلى `.env.local` واضبط `DATABASE_URL` و`BILLING_WEBHOOK_SECRET` وقيم المصادقة المطلوبة للتطوير.

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

يفتح خادم التطوير على `http://localhost:3000`. يمكن تشغيل بوابة الإنتاج محليًا بعد البناء باستخدام `pnpm build && pnpm start`.

## أوامر الجودة وقاعدة البيانات

| الأمر | الغرض |
|---|---|
| `pnpm lint` | فحص ESLint للمشروع كاملًا |
| `pnpm build` | إنشاء نسخة Next.js إنتاجية والتحقق من تجميع المسارات |
| `pnpm db:validate` | التحقق من صحة Prisma schema |
| `pnpm db:migrate` | تطبيق migrations المحلية |
| `pnpm db:seed` | إنشاء خطط Starter وGrowth وAcademy |
| `pnpm test:api` | اختبار تدفق API الأساسي |
| `pnpm test:security` | اختبار المصادقة وWebhook ورفض عناوين LMS الخاصة |
| `pnpm test:auth` | اختبار تحقق البريد واستعادة كلمة المرور وإبطال الجلسات |
| `pnpm test:edge` | اختبار payloads غير الصالحة وتكرار التسجيل ومدخلات checkout |
| `pnpm test:tenant` | اختبار عزل مساحات العمل ومنع الوصول المتقاطع |
| `pnpm test:subscription` | اختبار إلغاء الاشتراك وإعادة تفعيله وسلوك العمليات المتكررة وتغيير الباقة |
| `pnpm audit --prod` | فحص ثغرات اعتماديات الإنتاج |

## المصادقة وعزل البيانات

تستخدم المنصة جلسات Cookie آمنة مع رموز جلسات مجزأة بـ SHA-256، وكلمات مرور مجزأة بـ bcrypt، ورموز تحقق واستعادة مجزأة ولا تُخزن بصورتها الخام. كل endpoint مصادق يربط الاستعلامات بـ `workspaceId` أو بمالك المورد، كما تُرفض عمليات الموارد غير التابعة لمساحة العمل الحالية.

تُعالج Webhooks الفوترة بتوقيع HMAC ومعرّف حدث idempotent، بينما تُفحص روابط LMS باستخدام HTTPS وDNS ورفض عناوين loopback/private/link-local وIPv4-mapped IPv6 قبل أي طلب وصول.

## مسارات الواجهة

| المسار | الوظيفة |
|---|---|
| `/` | الصفحة التسويقية الرئيسية RTL |
| `/login` | تسجيل الدخول وإنشاء الحساب |
| `/dashboard` | لوحة المستخدم والمقاييس وروابط LMS |
| `/billing` | الاشتراك والفواتير والدفع التجريبي |
| `/support` | إنشاء تذاكر الدعم وإدارتها |
| `/admin` | إدارة محمية للمستخدمين ذوي `isStaff` |
| `/verify-email` | تحقق البريد الإلكتروني |
| `/forgot-password` و`/reset-password` | استعادة كلمة المرور وإعادة ضبطها |
| `/app/[slug]` | مساحات العمل المحمية |
| `/[slug]` و`/use-cases/[slug]` و`/resources/[slug]` | الصفحات التسويقية والموارد |

## مرجع API

تستخدم جميع الطلبات JSON عند وجود body، وتعيد الأخطاء بصيغة JSON مع status HTTP دال. باستثناء المسارات العامة الموضحة، تتطلب المسارات جلسة Cookie صالحة، وتُطبق مسارات الموارد على مساحة العمل الحالية فقط.

| الطريقة والمسار | المصادقة | الوظيفة |
|---|---:|---|
| `POST /api/auth/register` | عامة | إنشاء مستخدم ومساحة عمل وجلسة |
| `POST /api/auth/login` | عامة | تسجيل الدخول وإنشاء جلسة |
| `POST /api/auth/logout` | جلسة | إبطال الجلسة الحالية |
| `GET /api/auth/me` | جلسة | جلب المستخدم الحالي ومساحة العمل وروابط LMS المختارة |
| `POST /api/auth/verify` | عامة | تحقق رمز البريد وإبطال الرمز |
| `POST /api/auth/forgot-password` | عامة | إصدار تدفق استعادة كلمة المرور دون كشف وجود الحساب |
| `POST /api/auth/reset-password` | عامة | إعادة ضبط كلمة المرور برمز صالح |
| `GET /api/me` | جلسة | جلب الملف الشخصي |
| `PATCH /api/me` | جلسة | تحديث الملف مع رفض JSON غير الصالح |
| `GET /api/workspace` | جلسة | جلب مساحة العمل الحالية |
| `PATCH /api/workspace` | جلسة | إعادة تسمية مساحة العمل مع تحقق payload |
| `GET /api/plans` | عامة | عرض خطط SaaS المتاحة |
| `GET /api/subscription` | جلسة | عرض الاشتراك الحالي |
| `POST /api/subscription/change-plan` | جلسة | تغيير الخطة |
| `POST /api/subscription/cancel` | جلسة | إلغاء الاشتراك في نهاية الدورة |
| `POST /api/subscription/reactivate` | جلسة | إعادة تفعيل اشتراك ملغى |
| `GET /api/invoices` | جلسة | عرض فواتير مساحة العمل |
| `POST /api/checkout/session` | جلسة | إنشاء جلسة checkout لخطة صالحة |
| `POST /api/checkout/webhook` | توقيع HMAC | استقبال أحداث الفوترة مع idempotency |
| `GET /api/lms-link` | جلسة | عرض روابط LMS لمساحة العمل |
| `POST /api/lms-link` | جلسة | إضافة رابط LMS بعد فحص الأمان |
| `GET /api/lms-link/[id]` | جلسة | جلب رابط محدد ضمن مساحة العمل |
| `PATCH /api/lms-link/[id]` | جلسة | تحديث رابط محدد ضمن مساحة العمل |
| `DELETE /api/lms-link/[id]` | جلسة | حذف رابط محدد ضمن مساحة العمل |
| `POST /api/lms-link/[id]/check` | جلسة | فحص قابلية الوصول للرابط الآمن |
| `POST /api/lms-link/[id]/request-integration` | جلسة | طلب تكامل لمساحة العمل |
| `GET /api/tickets` | جلسة | عرض تذاكر الدعم مع filters |
| `POST /api/tickets` | جلسة | إنشاء تذكرة دعم |
| `GET /api/tickets/[id]` | جلسة | جلب تذكرة ضمن مساحة العمل |
| `PATCH /api/tickets/[id]` | جلسة | تنفيذ close/reopen/message بإجراء مضبوط |
| `DELETE /api/tickets/[id]` | جلسة | حذف تذكرة مسموحة ضمن مساحة العمل |
| `POST /api/tickets/[id]/messages` | جلسة | إضافة رسالة إلى تذكرة |
| `POST /api/tickets/[id]/close` | جلسة | إغلاق تذكرة بشكل صريح |
| `GET /api/usage` | جلسة | مؤشرات الاستخدام الحالية |
| `GET /api/usage/history` | جلسة | سجل الاستخدام الزمني |
| `GET /api/reports` | جلسة | تقارير مساحة العمل |

## النشر

المستودع الرسمي هو [`sayouuuuud/saas`](https://github.com/sayouuuuud/saas)، وفرع النشر هو `main`. يرتبط المستودع بمشروع Vercel، ويُنشئ كل push ناجح deployment إنتاجيًا. يجب ضبط `DATABASE_URL` على PostgreSQL في بيئة الإنتاج بدل SQLite المحلي، مع حفظ الأسرار في Vercel Environment Variables وعدم وضعها في Git.

للمراجعة اليدوية بعد النشر، تحقق من HTTP 200 على النطاق canonical، ووجود `dir="rtl"` والمحتوى العربي، ووجود CSP و`X-Content-Type-Options: nosniff` و`X-Frame-Options: DENY` و`Referrer-Policy`.

## نطاق المشروع

هذا المستودع ينفذ منصة SaaS مستقلة. نموذج `LmsLink` يخزن رابط التكامل ونتائج الفحص وطلبات التكامل داخل قاعدة SaaS، ولا يعني وجود اتصال أو قراءة أو تعديل لقاعدة بيانات LMS. أي تكامل خارجي مستقبلي يجب أن يمر عبر API آمن ومصادق ومفصول عن قاعدة SaaS.
