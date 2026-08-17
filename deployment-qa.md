# Deployment QA

The Vercel project `saas` is linked to `sayouuuuud/saas` in team `itz4kairo-5176's projects` with project ID `prj_gkITRxYVuxcZvsutoPniiwm6EmSH` and framework `nextjs`.

The first full-stack deployment (`dpl_GXS4CgKPTUMX26BFyC8LuoEKJbDD`) failed because Vercel's frozen pnpm install detected an overrides mismatch. The fix moved the `hono` override from the obsolete package-level `pnpm` field into `pnpm-workspace.yaml`, regenerated `pnpm-lock.yaml`, and was pushed in commit `3ab1908`.

The corrected production deployment (`dpl_J8kXGLzUP18B39YwhK4kRQhPhnYC`) reached `READY` at the deployment URL `https://saas-9gcnx6mz5-itz4kairo-5176s-projects.vercel.app/`. The project domains include `https://saas-gold-seven-80.vercel.app`, `https://saas-itz4kairo-5176s-projects.vercel.app`, and `https://saas-git-main-itz4kairo-5176s-projects.vercel.app`.

A production URL fetch returned HTTP 302 to Vercel SSO, indicating deployment protection is enabled. The deployment itself is ready; application-level smoke tests were run locally because the protected production URL requires an authenticated or temporary shareable access path.

The subsequent application commit `adf876de903c207d8af525b7a7e51e098cad3a24` (`Complete SaaS product surfaces and auth security flows`) also reached `READY` as `dpl_G1SmME45ftmYAaLYFJdsNMSUNFqH`. A live fetch of `https://saas-cakvbtu5z-itz4kairo-5176s-projects.vercel.app/` returned HTTP 200 with `content-type: text/html`, `lang="ar"`, and `dir="rtl"`. The documentation-only follow-up commit is `32db101`.

Security-fix verification on 2026-08-17:

- Updated `@prisma/client` and `prisma` from 6.16.2 to 6.19.3 within Prisma major 6, updated PostCSS to 8.5.26, and added a workspace override forcing `nanoid` to patched 3.3.18.
- `pnpm audit --prod` now reports **No known vulnerabilities found**.
- `pnpm lint` and `pnpm build` both pass; the build generates all 33 application routes.
- Changes committed and pushed as `3e2a5a2` (`security: remove vulnerable dependency chain and patch transitive advisories`).
- Vercel production deployment `dpl_54jHacHnovSTFWMwCmxfFZba2o7c` for commit `3e2a5a2c294593130f7c6940727909525e60a7e3` is `READY`.
- Canonical domain `https://saas-gold-seven-80.vercel.app/` returns HTTP 200, `content-type: text/html`, `lang="ar"`, and `dir="rtl"`.

Production security-header verification for commit `b2a9447`:

- Vercel deployment `dpl_9qPnPz6oimgK4greuhArxEX43VmT` reached `READY` and aliases the canonical production domains.
- The canonical URL returned HTTP 200 and emitted all six configured headers: CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS.
- The new edge-case suite passed for duplicate registration, malformed JSON, unknown checkout plan, logout, and unauthenticated workspace access.

Performance verification for commit `7dd8cf9`:

- Added and applied migration `20260817094331_add_query_indexes`, indexing payment-to-invoice history, payment-method workspace lookup, and support-message ticket chronology.
- Prisma validation, migration status, all four smoke suites, lint, build, and `pnpm audit --prod` passed after the migration.
- Vercel deployment `dpl_32ebRoC8Q61FTQRifSKJDfYJoufE` reached `READY` and aliases the canonical production domains.
- Final canonical smoke check returned HTTP 200, six security headers, and the Arabic/RTL markers.

Session and runtime verification for commit `88ac057`:

- Removed the unused eager `lmsLinks` relation from `getCurrentUser()` session hydration to reduce per-request database payloads without changing route contracts.
- Lint, production build, API, security, authentication, and edge-case smoke suites all passed after the optimization.
- Vercel deployment `dpl_DtZHeStTUmrQEDn5VUDj9rmLR1xv` reached `READY` for commit `88ac057e4e13b78dd90d36d6cbf775f792946107`.
- Vercel reported no grouped runtime errors for the SaaS project in the selected 24-hour production window.

Public surface verification:

- The canonical production domain returned HTTP 200 with `dir="rtl"` for the landing page, authentication pages, billing, support, legal pages, use-case pages, and resource pages.
- The required real-time window remains active in `execution-window.json`; at 2026-08-17T09:53:13Z the measured elapsed duration was 3,970 seconds and the required completion epoch remained 1786999623 (2026-08-17T20:47:03Z).

Regression and tenant-isolation verification for commit `056907d` and the follow-up QA additions:

- After removing eager LMS-link loading from generic sessions, `/api/auth/me` was corrected to fetch the minimal five-link projection explicitly, preserving the dashboard's connected-link state while keeping other session queries lean.
- The API smoke suite now asserts that an existing `Demo Academy` link is present in the authenticated user payload; the full API, security, authentication, edge-case, and tenant-isolation suites passed.
- The tenant-isolation suite confirmed that a second workspace receives HTTP 404 when attempting to delete or check the first workspace's LMS link.
- Direct canonical production smoke verification continued to return HTTP 200 with six security headers and Arabic RTL markers after the fix was pushed.

Webhook robustness and regression coverage:

- The billing webhook now catches malformed or non-object JSON after signature verification, marks the event as rejected with `invalid_json`, and returns HTTP 400 instead of throwing an unhandled exception.
- `security-smoke.sh` now signs and exercises malformed JSON, and the complete local suite passed: lint, production build, API smoke, security smoke, authentication security, edge cases, and tenant isolation.
- The tenant-isolation test continues to confirm that cross-workspace LMS-link delete and check requests return HTTP 404.

Final local verification timestamp: 2026-08-17T10:10:00Z (recorded during the active real-time execution window).


The canonical Vercel domain was rechecked after the webhook-hardening push at approximately 2026-08-17T10:11:49Z. It returned HTTP 200, one CSP header, six configured security-header matches, and an Arabic RTL marker.


Accessibility refinement verification:

The dashboard, login, and billing surfaces now use explicit non-submit button types for interactive controls and Arabic `aria-label` values for icon-only actions such as sidebar, notification, settings, and payment controls. After these changes, lint, production build, API smoke, security smoke, authentication security, edge-case, and tenant-isolation suites all passed at 2026-08-17T11:17:50Z.


Shared authentication-form hardening:

The verification, forgot-password, and reset-password flows now provide browser autocomplete hints, explicit submit semantics, accessible live status and alert roles, and a user-safe network failure message. The complete lint, build, API, security, authentication, edge-case, and tenant-isolation suite passed at 2026-08-17T11:20:56Z.


Support-page accessibility hardening:

The support flow now uses explicit button types, names form controls, exposes success and error feedback to assistive technology, and labels ticket/filter controls. Lint, production build, API, security, authentication, edge-case, and tenant-isolation smoke tests all passed at 2026-08-17T11:21:58Z.


Landing-page accessibility hardening:

The high-traffic landing page now exposes mobile-menu state and controls, gives pricing-cycle buttons explicit pressed semantics, labels the preview action, and adds keyboard-friendly FAQ accordion relationships. Lint, production build, API, security, authentication, edge-case, and tenant-isolation smoke tests all passed at 2026-08-17T11:22:53Z.


Profile API input hardening:

The authenticated profile PATCH endpoint now rejects malformed JSON and non-object payloads deterministically with HTTP 400 instead of falling through to a generic server error. The edge-case smoke suite now covers this regression and passed at 2026-08-17T11:24:05Z; the preceding full lint/build/API/security/auth/edge/tenant suite also passed.


Live verification after profile hardening:

The canonical Vercel domain returned HTTP 200 with Arabic RTL markers and the configured CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy headers at 2026-08-17T11:24:31Z. The repository working tree was clean after the pushed commit.


Workspace API input hardening:

The workspace rename endpoint now rejects malformed JSON and non-object payloads with HTTP 400, and the edge-case smoke test covers both profile and workspace malformed PATCH requests. The expanded edge test, lint, and production build passed at 2026-08-17T11:25:14Z.


Support-ticket action validation:

Ticket close/reopen/message actions now use a bounded Zod schema that rejects unsupported actions, malformed payloads, and oversized messages before database mutation. API smoke coverage now asserts an unsupported action returns HTTP 400. After correcting the smoke test to extract the top-level ticket ID, the full lint, production build, API, security, authentication, edge-case, and tenant-isolation suite passed at 2026-08-17T11:27:21Z.


SSRF hardening:

LMS URL safety now normalizes IP addresses and rejects IPv4-mapped IPv6 private addresses, IPv6 unspecified/loopback addresses, and existing private/link-local ranges. Security smoke coverage now explicitly rejects an HTTPS localhost LMS URL. Security, lint, production build, API, authentication, edge-case, and tenant-isolation tests passed at 2026-08-17T11:28:52Z.


Integrity and dependency audit:

At 2026-08-17T11:29:15Z, Prisma validation passed, all three local migrations were applied with the database schema up to date, and `pnpm audit --prod` reported no known vulnerabilities.


Performance footprint audit:

At 2026-08-17T11:30:08Z, the deploy-relevant `.next/server` output measured 15 MB and `.next/static` measured 820 KB. The larger 604 MB aggregate `.next` size was dominated by local Turbopack development/cache artifacts (`.next/dev` and `.next/cache`), not production runtime assets. The largest client JavaScript chunk was approximately 229 KB before compression; no code change was required from this audit.


Latest production deployment verification:

Vercel reported deployment `dpl_5dtoLm7iZAr1SkAZLcxi13CBsWW3` for commit `87e98d6` as READY and production-targeted. The deployment-specific URL is protected by Vercel Authentication and therefore redirects unauthenticated requests to Vercel SSO; this is platform protection, not an application response. The canonical production alias was independently checked at 2026-08-17T11:31:48Z and returned HTTP 200 with the Centralia Arabic RTL marker plus CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict referrer policy headers.


Production observability:

The Vercel grouped runtime-error query for the SaaS project returned no runtime errors in the selected 24-hour window at 2026-08-17T11:34:16Z.


Authentication abuse-resistance hardening:

Added a bounded route-scoped burst limiter for login, registration, password recovery, password reset, and email verification. Production requests use the platform client address; explicit test identities are honored only outside production to keep local smoke suites deterministic. The security suite now proves login returns HTTP 429 after the configured threshold, and the complete lint, production build, API, authentication, edge-case, and tenant-isolation suites passed at 2026-08-17T11:38:04Z.


Deployment propagation note:

At 2026-08-17T11:39:28Z, GitHub reported the Vercel status for commit `ce58cd5` as `failure` with target `upgradeToPro=build-rate-limit`. No new deployment was listed for the commit. This is an external Vercel build-quota/platform limitation, distinct from the passing local lint/build/smoke suite and the still-healthy previous canonical READY deployment. The latest commit must not be described as live until Vercel accepts a new build or an alternative deployment path is explicitly used.

Subscription lifecycle hardening verification:

At 2026-08-17T11:45:25Z, cancellation, reactivation, and plan-change routes were hardened. Subscription mutations now require OWNER or BILLING_MANAGER membership, execute state changes and audit/event records atomically, reject terminal `CANCELLED` transitions with HTTP 409, reject inactive plans, and return idempotent `unchanged` responses for repeated cancel/reactivate requests. The new `scripts/subscription-lifecycle-smoke.sh` passed, as did the complete API, security, authentication, edge-case, and tenant-isolation smoke matrix, `pnpm lint`, and `pnpm build`.

Vercel status for the pushed follow-up commit `db7f3e6` was checked at 2026-08-17T11:45:59Z and again returned `failure` with `upgradeToPro=build-rate-limit`; no new production deployment was accepted. The canonical live result therefore remains the previously verified READY deployment, while `db7f3e6` is verified locally and present on GitHub but not claimed as live.

Checkout consistency hardening:

At 2026-08-17T11:46:44Z, the mock checkout mutation was aligned with the subscription lifecycle policy: only OWNER and BILLING_MANAGER members may manage billing, request fields are bounded, terminal subscriptions can only be reactivated through an explicit checkout, and invoice/payment identifiers use UUIDs rather than millisecond timestamps to avoid collision under concurrent requests. Lint, production build, and all six smoke suites passed after the change.

Webhook audit and test determinism follow-up:

At 2026-08-17T11:49:33Z, successful payment webhooks were extended to write a transactional `PAYMENT` audit record containing the provider event and invoice metadata. During retesting, the security smoke suite was corrected to generate a unique per-run test client identity, and the lifecycle suite was corrected to generate a unique webhook event ID; this prevents stale in-memory limiter buckets and prior event payloads from contaminating later local runs. The security and subscription lifecycle suites both passed after the fixes.

Session query optimization:

At 2026-08-17T11:51:35Z, generic session hydration was reduced to the user and workspace identity projection (`id`, `name`) only. `/api/auth/me` now retrieves the plan/subscription presentation fields and the five LMS-link summaries in parallel, preserving its response contract while avoiding unnecessary relation payloads on every authenticated request. Lint, production build, API, security, authentication, edge-case, tenant-isolation, and subscription lifecycle suites all passed.

Usage-history aggregation optimization:

At 2026-08-17T11:53:25Z, `/api/usage/history` was changed from fetching every 30-day audit row and grouping in JavaScript to a workspace-scoped SQLite `GROUP BY DATE(createdAt)` query that returns only daily aggregates. The existing composite `AuditLog(workspaceId, createdAt)` index remains aligned with the filter. Lint, production build, and the complete API, security, authentication, edge-case, tenant-isolation, and subscription lifecycle suites passed.

Support-ticket list performance:

At 2026-08-17T11:54:31Z, `GET /api/tickets` was bounded to a default maximum of 25 and an absolute maximum of 50 records, with scalar field projection, message count, and only the latest message metadata. The detail endpoint remains responsible for the complete non-internal conversation. This prevents a growing workspace from loading every ticket and every message into a single list response. Lint, production build, and all six smoke suites passed.

Smoke-test repeatability hardening:

At 2026-08-17T11:56:38Z, the API, authentication, edge-case, and subscription smoke suites were updated to generate unique per-run test client identities, matching the earlier security-suite fix. This prevents local in-memory auth rate-limit buckets from causing false failures during repeated verification while preserving the security suite’s intentional same-identity burst test. The complete six-suite matrix passed after the changes.

Billing UX resilience:

At 2026-08-17T11:57:44Z, the billing page gained cancellable loading-state handling, explicit fetch-error feedback, disabled actions while data is unavailable, an accessible loading state for invoices, and a preserved empty-invoice state. The plan and invoice requests now validate response status before updating the UI. Lint, production build, and all six smoke suites passed.

Support UX resilience:

At 2026-08-17T11:58:35Z, the support page now loads its ticket list through the bounded endpoint, exposes a cancellable loading state, reports non-OK or malformed responses as an alert, and preserves an explicit empty state when no tickets exist. The ticket submission flow remains independently guarded by its existing busy and error states. Lint, production build, and all six smoke suites passed.

Latest deployment distinction:

At 2026-08-17T11:58:51Z, commit `af359ae` was pushed to GitHub and remained locally verified. GitHub reported the Vercel check as `failure` with target `upgradeToPro=build-rate-limit`; no new live deployment was verified for this commit. The canonical previous READY deployment remains separately verified and must not be attributed to `af359ae`.

تمييز حالة النشر الأخيرة:

في `2026-08-17T11:58:51Z` تم رفع commit `af359ae` إلى GitHub مع نجاح التحقق المحلي. سجّل GitHub فشل فحص Vercel بسبب `upgradeToPro=build-rate-limit`، ولذلك لم يتم التحقق من نشر حي جديد لهذا commit. يبقى deployment السابق READY متحققًا بصورة منفصلة ولا يجوز نسبه إلى `af359ae`.

Support UX resilience:

At 2026-08-17T11:58:35Z, the support page gained cancellable loading, explicit network-error feedback, response validation, and an accessible empty-ticket state. Lint, production build, and all six smoke suites passed before commit `af359ae` was pushed.

تحسينات تجربة الدعم:

في `2026-08-17T11:58:35Z` أضيفت حالات تحميل قابلة للإلغاء، ورسالة خطأ شبكة واضحة، والتحقق من الاستجابة، وحالة فارغة ميسّرة للتذاكر. نجحت lint وproduction build ومصفوفة الاختبارات الست كاملة قبل رفع commit `af359ae`.
Authorization and admin query hardening:

At 2026-08-17T12:03:56Z, the staff-only admin page retained its server-side `isStaff` guard while reducing audit-log relation loading to only the rendered email and workspace-name fields. The authenticated workspace route now rejects users without an assigned workspace instead of rendering a misleading zero-count tenant view. Lint, production build, and all six smoke suites passed; the tenant-isolation suite continued to pass.

تصلب الصلاحيات واستعلام الإدارة:

في `2026-08-17T12:03:56Z` حافظت لوحة الإدارة المخصصة للموظفين على حارس `isStaff` من جهة الخادم، مع تقليل تحميل علاقات AuditLog إلى حقول البريد واسم مساحة العمل المعروضة فقط. كما يرفض مسار مساحة العمل الحسابات التي لا تملك مساحة عمل مسندة بدل عرض مؤشرات صفرية مضللة. نجحت lint وproduction build ومصفوفة الاختبارات الست كاملة، واستمر نجاح اختبار عزل المستأجرين.
LMS integration-request idempotency:

At 2026-08-17T12:05:46Z, the SaaS-only LMS-link request endpoint began returning `already_recorded` for repeated requests for the same workspace link, while preserving the initial `202 recorded` response and avoiding duplicate IntegrationRequest audit events. The lookup remains workspace-scoped and selects only the link identity. The API smoke suite now asserts both first-request and repeat-request behavior. Lint, production build, and all six smoke suites passed.

عدم تكرار طلبات تكامل LMS:

في `2026-08-17T12:05:46Z` بدأ مسار طلب التكامل الخاص برابط LMS داخل SaaS بإرجاع `already_recorded` عند تكرار الطلب لنفس الرابط داخل مساحة العمل، مع الحفاظ على استجابة الطلب الأول `202 recorded` ومنع تكرار أحداث IntegrationRequest في سجل التدقيق. بقي البحث معزولًا بمساحة العمل ويحدد فقط هوية الرابط. يختبر API smoke الآن سلوك الطلب الأول والتكرار، ونجحت lint وproduction build ومصفوفة الاختبارات الست كاملة.
Vercel production verification:

At 2026-08-17T12:07:07Z, Vercel deployment `dpl_HTTVcBSfA1vi8AqkJKirv1PiaeGa` was verified as `READY` for production commit `8dc45ed80af10f3099c4e5de54ea0a14cc4b3ed2` (`fix: make integration requests idempotent`). The deployment became ready at epoch `1786968386529`, is aliased to `saas-gold-seven-80.vercel.app`, and is distinct from the earlier build-rate-limit failures. The canonical domain continued to return HTTP 200 with the expected security headers.

التحقق من نشر Vercel:

في `2026-08-17T12:07:07Z` تم التحقق من أن deployment `dpl_HTTVcBSfA1vi8AqkJKirv1PiaeGa` بحالة `READY` للإنتاج على commit `8dc45ed80af10f3099c4e5de54ea0a14cc4b3ed2` (`fix: make integration requests idempotent`). أصبح النشر جاهزًا عند epoch `1786968386529`، وهو مرتبط بالنطاق `saas-gold-seven-80.vercel.app`، ومنفصل عن حالات فشل build-rate-limit السابقة. استمر النطاق canonical في إرجاع HTTP 200 مع ترويسات الأمان المتوقعة.
AuditLog query coverage:

At 2026-08-17T12:08:12Z, the SaaS Prisma schema gained a composite AuditLog index on `(workspaceId, entity, entityId, createdAt)` to support workspace-scoped idempotency and administrative chronology queries without touching any LMS database. `prisma validate` and `prisma db push --skip-generate` completed successfully, followed by lint, production build, all six smoke suites, and `pnpm audit --prod`; no known production vulnerabilities were reported.

تغطية استعلامات AuditLog:

في `2026-08-17T12:08:12Z` أضيف إلى مخطط Prisma الخاص بـ SaaS فهرس مركب على AuditLog بالحقول `(workspaceId, entity, entityId, createdAt)` لدعم idempotency المعزول بمساحة العمل واستعلامات التسلسل الإداري دون لمس أي قاعدة LMS. نجح `prisma validate` و`prisma db push --skip-generate`، ثم lint وproduction build ومصفوفة الاختبارات الست كاملة و`pnpm audit --prod` الذي أبلغ بعدم وجود ثغرات إنتاج معروفة.
Page authorization smoke coverage:

At 2026-08-17T12:09:08Z, the security smoke suite was extended to verify that unauthenticated requests to `/admin` receive the protected staff-page response and that unauthenticated requests to `/app/overview` receive the login-required response, rather than tenant metrics. Lint, production build, and all six smoke suites passed after the added assertions.

تغطية اختبار صلاحيات الصفحات:

في `2026-08-17T12:09:08Z` تم توسيع security smoke للتحقق من أن الطلبات غير الموثقة إلى `/admin` تستقبل استجابة صفحة الموظفين المحمية، وأن الطلبات غير الموثقة إلى `/app/overview` تستقبل استجابة ضرورة تسجيل الدخول بدل مؤشرات المستأجر. نجحت lint وproduction build ومصفوفة الاختبارات الست كاملة بعد إضافة هذه التأكيدات.

Documentation consistency:

At 2026-08-17T12:10:17Z, README.md was updated to document idempotent LMS integration-request responses and the rule that Vercel deployment claims require a matching deployment ID, commit SHA, and `READY` state. `git diff --check`, lint, and production build passed after the documentation update.

اتساق التوثيق:

في 2026-08-17T12:10:17Z تم تحديث README.md لتوثيق استجابات طلبات تكامل LMS المتكررة كعمليات idempotent، ولتأكيد أن إعلان نشر Vercel يتطلب تطابق deployment ID وcommit SHA وحالة `READY`. نجح `git diff --check` وlint وproduction build بعد تحديث التوثيق.
Cross-workspace request isolation:

At 2026-08-17T12:12:09Z, tenant-isolation smoke coverage was extended to assert that a second workspace receives HTTP 404 when attempting `POST /api/lms-link/[id]/request-integration` for another workspace's link. Lint, production build, and all six smoke suites passed.

عزل طلبات التكامل بين المساحات:

في `2026-08-17T12:12:09Z` تم توسيع اختبار عزل المستأجر ليتحقق من أن مساحة عمل ثانية تستقبل HTTP 404 عند محاولة `POST /api/lms-link/[id]/request-integration` على رابط يخص مساحة أخرى. نجحت lint وproduction build ومصفوفة الاختبارات الست كاملة.
Malformed authentication-body coverage:

At 2026-08-17T12:13:15Z, auth-security smoke coverage was extended to assert HTTP 400 for malformed JSON sent to email verification and password-reset endpoints. Lint, production build, and all six smoke suites passed, confirming the recovery handlers reject malformed payloads without uncaught exceptions.

تغطية payloads المصادقة غير الصالحة:

في `2026-08-17T12:13:15Z` تم توسيع auth-security smoke للتحقق من إرجاع HTTP 400 عند إرسال JSON غير صالح إلى مساري تحقق البريد وإعادة ضبط كلمة المرور. نجحت lint وproduction build ومصفوفة الاختبارات الست كاملة، بما يؤكد رفض payloads غير الصالحة دون استثناءات غير معالجة.
Dashboard UX resilience:

At 2026-08-17T12:16:29Z, the authenticated dashboard gained cancellable `/api/auth/me` loading, explicit loading feedback, and an accessible network-error state with retry action. Placeholder workspace content is now gated until the identity payload is available. Lint, production build, and all six smoke suites passed.

مرونة تجربة لوحة التحكم:

في `2026-08-17T12:16:29Z` أضيفت إلى لوحة التحكم المصادق عليها عملية تحميل قابلة للإلغاء لـ `/api/auth/me`، ورسالة تحميل واضحة، وحالة خطأ شبكية قابلة للوصول مع إجراء إعادة المحاولة. لم تعد بيانات مساحة العمل الوهمية تظهر قبل وصول payload الهوية. نجحت lint وproduction build ومصفوفة الاختبارات الست كاملة.
Authenticated workspace resilience:

At 2026-08-17T12:17:47Z, `/app/[slug]` gained App Router loading and error boundaries. Slow database reads now show an explicit Arabic loading state, while rendering failures expose a recoverable retry action and do not present unverified workspace metrics. Lint, production build, and all six smoke suites passed.

مرونة مساحة العمل المصادق عليها:

في `2026-08-17T12:17:47Z` أضيفت إلى `/app/[slug]` حالتا تحميل وخطأ على مستوى App Router. تعرض قراءات قاعدة البيانات البطيئة حالة تحميل عربية واضحة، بينما تعرض أخطاء العرض إجراء إعادة محاولة ولا تقدم مؤشرات مساحة عمل غير مؤكدة. نجحت lint وproduction build ومصفوفة الاختبارات الست كاملة.
Reports semantics and projection:

At 2026-08-17T12:18:52Z, `/api/reports` now returns the total invoice count independently from the bounded twelve-item recent-invoice list, avoiding a misleading capped count. The subscription query selects only status and plan name rather than the full plan row. Lint, production build, and all six smoke suites passed.

دلالات التقارير وتقليل الإسقاط:

في `2026-08-17T12:18:52Z` أصبح `/api/reports` يعيد العدد الإجمالي للفواتير مستقلًا عن قائمة آخر 12 فاتورة، لمنع عرض عدد محدود باعتباره إجماليًا. كما أصبح استعلام الاشتراك يحدد الحالة واسم الباقة فقط بدل الصف الكامل. نجحت lint وproduction build ومصفوفة الاختبارات الست كاملة.
Reports contract coverage:

At 2026-08-17T12:19:45Z, API smoke coverage began asserting that a fresh paid checkout produces `summary.invoiceCount = 1` in `/api/reports`, independently of the recent-invoice list cap. Lint, production build, and all six smoke suites passed.

تغطية عقد التقارير:

في `2026-08-17T12:19:45Z` بدأ API smoke بالتحقق من أن checkout مدفوعًا جديدًا ينتج `summary.invoiceCount = 1` في `/api/reports` بصورة مستقلة عن حد قائمة الفواتير الأخيرة. نجحت lint وproduction build ومصفوفة الاختبارات الست كاملة.
Workspace loading visual accessibility:

At 2026-08-17T12:21:06Z, the workspace loading boundary received a visible RTL-compatible spinner and a `prefers-reduced-motion` fallback that removes continuous animation while retaining progress contrast. Lint, production build, and all six smoke suites passed.

إتاحة مؤشر تحميل مساحة العمل بصريًا:

في `2026-08-17T12:21:06Z` حصلت حالة تحميل مساحة العمل على مؤشر مرئي متوافق مع RTL، مع fallback لـ `prefers-reduced-motion` يلغي الحركة المستمرة ويحافظ على تباين حالة التقدم. نجحت lint وproduction build ومصفوفة الاختبارات الست كاملة.
Verified production deployment:

Vercel deployment `dpl_J9HFj96iYKt2g9bRZ6amGhJEspSs` reached `READY` for commit `95b0c89ccd9205d48332b68c226356470f442d76` (`style: support reduced motion in loading state`) at `2026-08-17T12:21:48.064Z`. It is production-targeted, aliased to `https://saas-gold-seven-80.vercel.app`, and uses the Next.js framework in `iad1`. The canonical health probe at `2026-08-17T12:21:54Z` returned HTTP 200 with CSP, HSTS, X-Content-Type-Options, X-Frame-Options, and Referrer-Policy headers. The required real-time execution window remains active; this deployment record does not constitute final-window completion.

نشر إنتاجي تم التحقق منه:

وصل نشر Vercel `dpl_J9HFj96iYKt2g9bRZ6amGhJEspSs` إلى `READY` للـ commit `95b0c89ccd9205d48332b68c226356470f442d76` (`style: support reduced motion in loading state`) في `2026-08-17T12:21:48.064Z`. النشر موجّه للإنتاج وله alias على `https://saas-gold-seven-80.vercel.app` ويستخدم Next.js في `iad1`. أعاد فحص النطاق canonical في `2026-08-17T12:21:54Z` HTTP 200 مع CSP وHSTS وX-Content-Type-Options وX-Frame-Options وReferrer-Policy. تبقى نافذة التشغيل الحقيقية المطلوبة نشطة؛ ولا يمثل هذا السجل اكتمال النافذة النهائية.
Production configuration release gate:

At 2026-08-17T12:25:37Z, Centralia added `pnpm verify:production` and `pnpm test:production-config`. The strict verifier rejects SQLite `DATABASE_URL` values, weak or placeholder session and webhook secrets, non-HTTPS `APP_URL`, and incomplete Stripe prerequisites; the smoke test covers both unsafe rejection and valid PostgreSQL acceptance. Lint, production build, and all six application smoke suites passed. This makes the SQLite-development/PostgreSQL-production boundary explicit and prevents treating an unsafe Vercel environment as data-production-ready.

بوابة إعداد الإنتاج:

في `2026-08-17T12:25:37Z` أضيف الأمران `pnpm verify:production` و`pnpm test:production-config`. يرفض الفحص الصارم قيم `DATABASE_URL` الخاصة بـ SQLite، والأسرار القصيرة أو الافتراضية، و`APP_URL` غير الآمن، ومتطلبات Stripe الناقصة؛ ويغطي smoke test الرفض الآمن والقبول الحتمي لإعداد PostgreSQL صالح. نجحت lint وproduction build ومصفوفة اختبارات التطبيق الست كاملة. يوضح ذلك حد SQLite للتطوير وPostgreSQL للإنتاج ويمنع اعتبار بيئة Vercel غير الآمنة جاهزة لبيانات حقيقية.
Strict gate observation:

At 2026-08-17T12:26:04Z, `pnpm verify:production` was intentionally run against the current development environment and failed with the expected release blockers: SQLite `DATABASE_URL`, placeholder or short secrets, HTTP/local `APP_URL`, and absent real Stripe credentials. This is an accurate safety result, not a product regression. The valid-configuration smoke fixture passes separately; production readiness still requires the operator to supply real PostgreSQL, HTTPS, secret, and billing environment values in Vercel, then rerun the strict gate.

ملاحظة الفحص الصارم:

في `2026-08-17T12:26:04Z` شُغّل `pnpm verify:production` عمدًا على بيئة التطوير الحالية، وفشل بالحواجز المتوقعة للإصدار: `DATABASE_URL` من SQLite، أسرار افتراضية أو قصيرة، `APP_URL` محلي عبر HTTP، وغياب بيانات Stripe الحقيقية. هذه نتيجة أمان صحيحة وليست regression في المنتج. ينجح fixture الإعداد الصالح بشكل مستقل؛ ولا تزال الجاهزية الإنتاجية تتطلب إدخال PostgreSQL وHTTPS والأسرار وبيانات الفوترة الحقيقية في Vercel ثم إعادة تشغيل الفحص الصارم.
Authentication audit hardening:

At 2026-08-17T12:29:17Z, successful password login and explicit logout now create workspace-scoped `LOGIN` and `LOGOUT` audit events. Email verification now updates the user and writes its `SECURITY_EVENT` audit row inside one transaction using the known owner workspace lookup, avoiding an unloaded relation. The auth smoke suite now exercises two login/logout cycles and checks the audit-count contract; lint, build, API, security, auth, edge, tenant-isolation, and subscription suites all passed cleanly with no lint warnings.

تصليب تدقيق المصادقة:

في `2026-08-17T12:29:17Z` أصبحت عملية تسجيل الدخول الناجحة وتسجيل الخروج الصريح تنشئان سجلي تدقيق `LOGIN` و`LOGOUT` مرتبطين بمساحة العمل. أصبحت عملية تحقق البريد تحدّث المستخدم وتكتب سجل `SECURITY_EVENT` داخل transaction واحدة باستخدام lookup لمساحة عمل المالك المعروفة، بدل الاعتماد على relation غير محمّلة. يختبر auth smoke الآن دورتين كاملتين للدخول والخروج ويتحقق من عقد عدّاد التدقيق؛ ونجحت lint وbuild واختبارات API والأمان والمصادقة وedge وعزل المستأجر والاشتراك دون تحذيرات lint.
Membership session hardening:

At 2026-08-17T12:30:28Z, session hydration was corrected to resolve the first authorized `WorkspaceMember` when a user is not the owner of a workspace, while retaining a narrow identity-only projection. `requireWorkspaceRole` can now enforce billing, support, and workspace permissions for member users instead of incorrectly returning `WORKSPACE_NOT_FOUND`. Lint, production build, and API, security, auth, edge, tenant-isolation, and subscription smoke suites all passed.

تصليب جلسة أعضاء مساحة العمل:

في `2026-08-17T12:30:28Z` تم تصحيح hydration للجلسة بحيث يحل أول `WorkspaceMember` مصرح به عندما لا يكون المستخدم مالكًا لمساحة العمل، مع الإبقاء على projection ضيق للهوية فقط. أصبح `requireWorkspaceRole` قادرًا على تطبيق صلاحيات الفوترة والدعم ومساحة العمل على الأعضاء بدل إرجاع `WORKSPACE_NOT_FOUND` خطأً. نجحت lint وproduction build واختبارات API والأمان والمصادقة وedge وعزل المستأجر والاشتراك.
Workspace-member query index:

At 2026-08-17T12:31:31Z, an additive `WorkspaceMember(userId, createdAt)` index and SQLite migration `20260817123100_add_workspace_member_session_index` were added to support the membership-aware session lookup. `pnpm db:validate` and `pnpm db:migrate` applied successfully; lint, production build, and all API, security, auth, edge, tenant-isolation, and subscription suites passed afterward.

فهرس بحث أعضاء مساحة العمل:

في `2026-08-17T12:31:31Z` أضيف فهرس إضافي `WorkspaceMember(userId, createdAt)` مع migration SQLite رقم `20260817123100_add_workspace_member_session_index` لدعم lookup جلسة العضو. نجح `pnpm db:validate` و`pnpm db:migrate`، ثم نجحت lint وproduction build وجميع اختبارات API والأمان والمصادقة وedge وعزل المستأجر والاشتراك.
PostgreSQL production migration path:

At 2026-08-17T12:34:25Z, Centralia gained a separate validated production datamodel at `prisma/postgresql/schema.prisma` and migration history at `prisma/postgresql/migrations`, generated from the SaaS-only schema with `provider = "postgresql"`. `DATABASE_URL='postgresql://...' pnpm db:validate:postgres` passed, and the deterministic production-config smoke, lint, production build, API, security, auth, edge, tenant-isolation, and subscription suites all passed. The local SQLite schema and migrations remain unchanged for development; no LMS database or tables were introduced.

مسار PostgreSQL للإنتاج:

في `2026-08-17T12:34:25Z` أضيف datamodel منفصل ومتحقق للإنتاج في `prisma/postgresql/schema.prisma` وسجل migrations في `prisma/postgresql/migrations`، مولّدان من schema SaaS فقط مع `provider = "postgresql"`. نجح `DATABASE_URL='postgresql://...' pnpm db:validate:postgres`، كما نجح اختبار إعدادات الإنتاج وlint وproduction build واختبارات API والأمان والمصادقة وedge وعزل المستأجر والاشتراك. بقي schema وmigrations SQLite المحليان دون تغيير للتطوير، ولم تُنشأ أي جداول أو اتصالات بقاعدة LMS.
Protocol-aware Prisma build:

At 2026-08-17T12:36:42Z, the build now selects `prisma/schema.prisma` for SQLite URLs and `prisma/postgresql/schema.prisma` for PostgreSQL URLs before generating Prisma Client. Both generation modes passed, followed by the production-config smoke, lint, production build, API, security, auth, edge, tenant-isolation, and subscription suites. This prevents a PostgreSQL production deployment from silently generating a SQLite client while retaining the local development workflow.

توليد Prisma حسب البروتوكول:

في `2026-08-17T12:36:42Z` أصبح build يختار `prisma/schema.prisma` لعناوين SQLite و`prisma/postgresql/schema.prisma` لعناوين PostgreSQL قبل توليد Prisma Client. نجح نمطا التوليد، ثم نجح اختبار إعدادات الإنتاج وlint وproduction build واختبارات API والأمان والمصادقة وedge وعزل المستأجر والاشتراك. يمنع ذلك نشر PostgreSQL من توليد client خاص بـ SQLite بصمت، مع الحفاظ على مسار التطوير المحلي.
Verified Vercel production deployment:

Vercel accepted commit `8f614518afe92df9576394bb8293aff931faaa41` (`build: select prisma schema by database protocol`) as production deployment `dpl_AvMzen2npiaYVd4XqjbcNF1H7xnp`. It reached `READY` at epoch `1786970253169` (2026-08-17T12:37:33.169Z), with deployment URL `saas-53unfb0o0-itz4kairo-5176s-projects.vercel.app`, aliases including the canonical `saas-gold-seven-80.vercel.app`, region `iad1`, and no alias error. This is distinct from earlier `build-rate-limit` failures; the current commit has a verified live production build.

نشر Vercel الإنتاجي المتحقق:

قبلت Vercel commit `8f614518afe92df9576394bb8293aff931faaa41` بعنوان `build: select prisma schema by database protocol` كنشر إنتاجي رقم `dpl_AvMzen2npiaYVd4XqjbcNF1H7xnp`. وصل إلى `READY` عند epoch `1786970253169` الموافق `2026-08-17T12:37:33.169Z`، مع deployment URL وaliases تتضمن النطاق canonical `saas-gold-seven-80.vercel.app`، والمنطقة `iad1`، ودون alias error. يختلف ذلك عن محاولات `build-rate-limit` السابقة؛ فالcommit الحالي لديه build إنتاجي حي ومتحقق.
Production runtime check:

A read-only Vercel grouped-runtime-error query at 2026-08-17T12:38:34Z for the Centralia project over the previous 24 hours returned **no runtime errors**. This supports production stability for the verified READY deployment, while the separate GitHub status on the subsequent QA-only commit remains a Vercel build-rate-limit failure and does not alter the live READY deployment association.

فحص أخطاء التشغيل في الإنتاج:

أعاد استعلام Vercel للـ runtime errors، المنفذ للقراءة فقط عند `2026-08-17T12:38:34Z` على مشروع Centralia خلال آخر 24 ساعة، النتيجة **لا توجد أخطاء تشغيل**. يدعم ذلك استقرار النشر READY المتحقق، مع بقاء حالة GitHub المنفصلة للcommit التوثيقي اللاحق فشلًا بسبب build-rate-limit، دون تغيير ارتباط النشر الحي بالcommit READY السابق.
Strict compiler and accessibility hardening:

At 2026-08-17T12:49:20Z, Centralia passed `pnpm lint`, explicit `pnpm exec tsc --noEmit`, and `pnpm build` after removing `ignoreBuildErrors` from `next.config.mjs`. The dashboard LMS-link state and readonly public content types were corrected; workspace-shell landmarks, `aria-current`, status semantics, and keyboard focus behavior were improved; dashboard load failures now move focus to the retry alert. The change was committed as `4cdb580` and pushed to `sayouuuuud/saas`.

API integrity and bounded hydration:

The same cycle made ticket creation and its audit event atomic with collision-resistant ticket numbers, bounded `/api/workspace` member hydration with `memberLimit` capped at 50 and explicit `membersPagination`, and idempotent expired-session deletion. API, auth, security, and tenant-isolation smoke suites passed. The API smoke suite now asserts that an oversized workspace member request is capped at 50.

LMS mutation atomicity:

At 2026-08-17T12:51:56Z, commit `7d70390` was pushed after successful strict build and API, tenant-isolation, and edge-case smoke validation. LMS-link creation, reachability checks with check-history writes, and integration-request existence checks plus audit creation now use transaction boundaries. This prevents partial audit state and closes the concurrent integration-request idempotency window.

Authentication error mapping:

Commit `b44ab9f` added explicit `WORKSPACE_NOT_FOUND` to the shared safe authentication error mapping, returning 404 rather than misclassifying a missing workspace as an internal error. Strict lint, TypeScript, production build, security smoke, and tenant-isolation smoke all passed before push.

Final-window regression gate:

Commit `e68f35e` updated `scripts/final-window-verification.sh` to include `test:subscription` and `test:production-config` in addition to the existing database, lint, build, API, security, auth, edge, tenant, and dependency-audit checks. The verifier was restarted as PID 64081 at 2026-08-17T12:54:22Z and remains active until the system-clock completion epoch `1786999623`.

Complete regression matrix:

The full matrix passed during this execution cycle: lint, explicit TypeScript compilation, production build, API, security, auth, edge-case, tenant-isolation, subscription-lifecycle, production-configuration smoke, and `pnpm audit --prod` with no known vulnerabilities. The repository was clean after each pushed commit.

Current deployment boundary:

The latest verified READY production deployment remains `dpl_AvMzen2npiaYVd4XqjbcNF1H7xnp` for commit `8f61451`. The newer hardening commits are pushed to GitHub and verified locally, but must not be described as live until Vercel reports a READY deployment for their SHA. A current canonical-domain probe returned HTTP 200 with Arabic RTL markup and the configured CSP, HSTS, X-Content-Type-Options, X-Frame-Options, and Referrer-Policy headers.

التدقيق الصارم وتحسين الوصول:

في `2026-08-17T12:49:20Z` نجح `pnpm lint` و`pnpm exec tsc --noEmit` و`pnpm build` بعد إزالة `ignoreBuildErrors` من `next.config.mjs`. أُصلحت أنواع حالة رابط LMS والمحتوى readonly، وحُسنت landmarks و`aria-current` ودلالات الحالة والتركيز في `workspace-shell`، وأصبح فشل تحميل Dashboard ينقل التركيز إلى تنبيه إعادة المحاولة. سُجل ذلك في commit `4cdb580` ودُفع إلى GitHub.

سلامة API والتحميل المحدود:

أصبح إنشاء التذكرة وسجل التدقيق ذريًا مع أرقام تذاكر مقاومة للتصادم، وأصبح تحميل أعضاء مساحة العمل محدودًا بحد أقصى 50 مع metadata صريحة، كما أصبح حذف الجلسات المنتهية idempotent. نجحت اختبارات API وauth وsecurity وعزل المستأجر، وأصبح اختبار API يثبت سقف أعضاء مساحة العمل عند 50.

ذرية عمليات LMS:

في `2026-08-17T12:51:56Z` دُفع commit `7d70390` بعد نجاح build الصارم واختبارات API وعزل المستأجر وedge. أصبحت عمليات إنشاء الرابط وفحص الوصول وتسجيل تاريخ الفحص وطلبات التكامل ذات حدود معاملات تمنع السجلات الجزئية وتغلق نافذة التزامن في idempotency.

بوابة التحقق النهائية:

سُجل commit `e68f35e` لتوسيع `final-window-verification.sh` بإضافة اختبارات دورة الاشتراك وإعدادات الإنتاج إلى مصفوفة الاختبارات النهائية. أُعيد تشغيل verifier بالمعرّف PID 64081 عند `2026-08-17T12:54:22Z`، وما زال نشطًا حتى epoch `1786999623`.

حدود النشر الحالية:

يبقى آخر نشر إنتاجي READY متحقق هو `dpl_AvMzen2npiaYVd4XqjbcNF1H7xnp` للcommit `8f61451`. الـ commits الأحدث دُفعت إلى GitHub ونجحت محليًا، لكن لن تُوصف بأنها live قبل أن تعلن Vercel عن نشر READY للـ SHA الخاص بها. أعاد فحص النطاق canonical HTTP 200 مع RTL عربي ورؤوس CSP وHSTS وX-Content-Type-Options وX-Frame-Options وReferrer-Policy الصحيحة.

Window checkpoint:

At the checkpoint recorded at 2026-08-17T12:54:22Z, the system clock measured epoch `1786971262`, elapsed `14839` seconds from `1786956423`, with `28361` seconds remaining. The watchdog remained active and `execution-window.json` remained `status: active`; no completion claim is made before `1786999623`.

نقطة تحقق النافذة الزمنية:

عند نقطة التحقق `2026-08-17T12:54:22Z` كان epoch ساعة النظام `1786971262`، والمنقضي `14839` ثانية من `1786956423`، والمتبقي `28361` ثانية. بقي watchdog نشطًا وظل `execution-window.json` بالحالة `active`، ولا يُعلن الاكتمال قبل `1786999623`.

Latest Vercel deployment verification:

A read-only deployment inventory captured at 2026-08-17T12:57:27Z shows that Vercel accepted commit `7d703901c8ea87c642d1298e8e1d49ca2e2f020e` (`fix: make LMS mutations atomic`) as production deployment `dpl_Bbu3bi7S4JadAx76ZEwhYprFj6ZT`, state `READY`, created at 2026-08-17T12:51:54.074Z. This supersedes the earlier `8f61451` entry as the latest verified READY deployment. The offset-pagination commit `962d513` and later documentation commits were not present in that inventory at query time, so they remain pushed-and-locally-verified rather than claimed live.

Offset pagination contract:

At 2026-08-17T12:57:40Z, bounded offset pagination was added to `/api/workspace`, `/api/lms-link`, and `/api/invoices`. Each endpoint caps limits at 50 and offsets at 10,000, performs database-side `skip`/`take` retrieval, and returns `offset`, `hasMore`, and `nextOffset` metadata. The API smoke suite now exercises both the first page and a nonzero offset page. Lint, TypeScript, production build, tenant-isolation, subscription-lifecycle, production-config, and dependency-audit checks all passed before commit `962d513` was pushed.

أحدث تحقق من نشر Vercel:

أظهر سجل النشر للقراءة فقط عند `2026-08-17T12:57:27Z` أن Vercel قبل commit `7d703901c8ea87c642d1298e8e1d49ca2e2f020e` بعنوان `fix: make LMS mutations atomic` كنشر إنتاجي `dpl_Bbu3bi7S4JadAx76ZEwhYprFj6ZT` بالحالة `READY`، وقد أُنشئ عند `2026-08-17T12:51:54.074Z`. يحل هذا محل إدخال `8f61451` باعتباره آخر نشر READY متحقق. لم يظهر commit `962d513` ولا commits التوثيق اللاحقة في السجل وقت الاستعلام، ولذلك تبقى pushed وlocally verified دون ادعاء أنها live.

عقد pagination بالإزاحة:

في `2026-08-17T12:57:40Z` أضيفت pagination بإزاحة محدودة إلى `/api/workspace` و`/api/lms-link` و`/api/invoices`. كل endpoint يفرض سقفًا قدره 50 على limit و10,000 على offset، ويستخدم `skip` و`take` داخل قاعدة البيانات، ويعيد `offset` و`hasMore` و`nextOffset`. يختبر API smoke الصفحة الأولى وصفحة بإزاحة غير صفرية. نجحت lint وTypeScript وproduction build واختبارات عزل المستأجر ودورة الاشتراك وإعدادات الإنتاج وتدقيق الاعتماديات قبل دفع commit `962d513`.

Current window checkpoint:

At 2026-08-17T12:57:55Z, the system clock was epoch `1786971475`; the watchdog and final verifier remained active, and the required completion epoch remained `1786999623`. No final-completion claim is made before that epoch and the generated final verification log confirms a passed matrix.

نقطة النافذة الحالية:

عند `2026-08-17T12:57:55Z` كان epoch ساعة النظام `1786971475`، وبقي watchdog وfinal verifier نشطين، وظل epoch الإكمال المطلوب `1786999623`. لا يُعلن الاكتمال قبل ذلك epoch وقبل أن يؤكد final verification log نجاح المصفوفة.

Complete pre-window regression:

At 2026-08-17T12:58:55Z on commit `3a1276a`, the complete matrix passed: `pnpm db:validate`, `pnpm lint`, `pnpm build` with TypeScript validation enabled, API smoke including offset pagination, security, auth-security, edge-cases, tenant-isolation, subscription-lifecycle, production-config, and `pnpm audit --prod`. The repository remained clean; all smoke suites used per-run client identities.

التحقق الشامل قبل نهاية النافذة:

عند `2026-08-17T12:58:55Z` وعلى commit `3a1276a` نجحت المصفوفة الكاملة: `pnpm db:validate` و`pnpm lint` و`pnpm build` مع تفعيل TypeScript، واختبارات API التي تتضمن pagination بالإزاحة، والأمان، والمصادقة، والحالات الطرفية، وعزل المستأجر، ودورة الاشتراك، وإعدادات الإنتاج، و`pnpm audit --prod`. ظل المستودع نظيفًا، واستخدمت جميع smoke suites هويات منفصلة لكل تشغيل.

Window status at this checkpoint:

The measured system epoch was `1786971535`, while the required completion epoch is `1786999623`; `execution-window.json` was still `status: active`. The watchdog PID 5121 and final verifier PID 64081 were both running. The final verification log was intentionally not expected before the required epoch.

حالة النافذة عند نقطة التحقق:

كان epoch ساعة النظام المقاس `1786971535`، بينما epoch الإكمال المطلوب هو `1786999623`، وظل `execution-window.json` بالحالة `active`. بقي watchdog PID 5121 وfinal verifier PID 64081 قيد التشغيل. ولم يكن متوقعًا إنشاء final verification log قبل epoch المطلوب.

Atomic profile mutation:

At 2026-08-17T13:00:07Z, profile updates in `/api/me` were changed to update the user row and its workspace audit record inside one Prisma transaction. A concurrent unique-email conflict is now translated to HTTP 409 instead of a generic 500. Lint, strict TypeScript compilation, production build, and API smoke passed before commit `7d83ac4` was pushed.

تعديل الملف الشخصي الذري:

عند `2026-08-17T13:00:07Z` أصبحت تحديثات الملف الشخصي في `/api/me` تعدل سجل المستخدم وسجل التدقيق الخاص بمساحة العمل داخل transaction واحدة. كما أصبح تعارض البريد الإلكتروني الفريد الناتج عن التزامن يعيد HTTP 409 بدلًا من 500 عام. نجحت lint وTypeScript وproduction build وAPI smoke قبل دفع commit `7d83ac4`.

Latest production runtime health:

A read-only grouped Vercel runtime-error query at 2026-08-17T13:01:10Z for project `prj_gkITRxYVuxcZvsutoPniiwm6EmSH` over the previous 24 hours returned **No runtime errors found in the selected time range**. This is an observability result for the project window, not a substitute for deployment state; the latest deployment inventory separately identified `dpl_Bbu3bi7S4JadAx76ZEwhYprFj6ZT` for commit `7d70390` as READY.

صحة التشغيل في الإنتاج:

أعاد استعلام Vercel للـ runtime errors، المنفذ للقراءة فقط عند `2026-08-17T13:01:10Z` للمشروع `prj_gkITRxYVuxcZvsutoPniiwm6EmSH` خلال آخر 24 ساعة، النتيجة **No runtime errors found in the selected time range**. هذه نتيجة observability للنطاق الزمني وليست بديلًا عن حالة deployment؛ إذ حدد سجل النشر بشكل منفصل `dpl_Bbu3biS4JadAx76ZEwhYprFj6ZT` للـ commit `7d70390` كحالة READY.

