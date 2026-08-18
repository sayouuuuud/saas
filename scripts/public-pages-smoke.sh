#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

landing=$(curl -fsSL --max-time 10 "${BASE_URL}/")
grep -Fq 'href="/contact"' <<<"$landing"
grep -Fq 'href="/resources/status"' <<<"$landing"
grep -Fq 'href="/privacy"' <<<"$landing"
grep -Fq 'href="/terms"' <<<"$landing"
grep -Fq 'href="/refund-policy"' <<<"$landing"
grep -Fq 'href="/acceptable-use"' <<<"$landing"

assert_page() {
  local path="$1"
  local marker="$2"
  local title="$3"
  local description="$4"
  local body
  body=$(curl -fsSL --max-time 10 "${BASE_URL}${path}")
  grep -Fq "$marker" <<<"$body"
  grep -Fq "لا ننشئ LMS" <<<"$body"
  grep -Fq "<title>${title}</title>" <<<"$body"
  grep -Fq "name=\"description\" content=\"${description}\"" <<<"$body"
}

assert_page "/features" "مزايا مركزية" "المزايا | مركزية" "أدوات SaaS واضحة لإدارة الحساب والاشتراك والفوترة ورابط المنصة والدعم."
assert_page "/how-it-works" "كيف تعمل المنصة" "كيف تعمل | مركزية" "تعرّف على خطوات التسجيل والاشتراك والدفع وربط رابط LMS الاختياري داخل منصة SaaS مستقلة."
assert_page "/pricing" "أسعار واضحة" "الأسعار | مركزية" "خطط SaaS شفافة لإدارة الحساب والاشتراك والفوترة والدعم وروابط LMS الاختيارية."
assert_page "/contact" "نحن هنا للمساعدة" "تواصل معنا | مركزية" "تواصل مع فريق مركزية بشأن الحساب والاشتراك والفوترة ورابط المنصة والدعم."
assert_page "/terms" "الشروط والأحكام" "الشروط والأحكام | مركزية" "الشروط التي تحكم استخدام منصة مركزية SaaS المستقلة."
assert_page "/privacy" "الخصوصية" "الخصوصية | مركزية" "كيف تتعامل مركزية مع بيانات حساب SaaS ومساحة العمل."
assert_page "/refund-policy" "سياسة الاسترداد" "سياسة الاسترداد | مركزية" "سياسة الإلغاء والاسترداد لاشتراكات مركزية SaaS."
assert_page "/acceptable-use" "الاستخدام المقبول" "الاستخدام المقبول | مركزية" "قواعد الاستخدام المقبول لمنصة مركزية SaaS."
assert_page "/data-retention" "سياسة الاحتفاظ بالبيانات" "سياسة الاحتفاظ بالبيانات | مركزية" "كيف تحتفظ مركزية ببيانات حساب SaaS ومساحة العمل والفوترة والدعم، ومتى تبدأ مراجعة الحذف."
assert_page "/integration-policy" "سياسة التكامل" "سياسة التكامل | مركزية" "حدود تكامل مركزية مع الخدمات الخارجية وشرط API contract الرسمي قبل أي تكامل LMS أو SSO."
assert_page "/session-expired" "الجلسة انتهت" "انتهت الجلسة | مركزية" "أعد تسجيل الدخول إلى حساب مركزية لمتابعة استخدام مساحة العمل بأمان."
register_body=$(curl -fsSL --max-time 10 "${BASE_URL}/register")
grep -Fq 'أنشئ حساب مركزية' <<<"$register_body"
grep -Fq 'href="/terms"' <<<"$register_body"
grep -Fq 'href="/privacy"' <<<"$register_body"
guides_body=$(curl -fsSL --max-time 10 "${BASE_URL}/resources/guides")
grep -Fq 'دليل دعوة عضو' <<<"$guides_body"
grep -Fq 'نحفظ SaaS ونترك LMS مستقلًا.' <<<"$guides_body"
status_body=$(curl -fsSL --max-time 10 "${BASE_URL}/resources/status")
grep -Fq 'عند وجود عطل' <<<"$status_body"
grep -Fq 'نحفظ SaaS ونترك LMS مستقلًا.' <<<"$status_body"

robots_headers=$(curl -fsSI --max-time 10 "${BASE_URL}/robots.txt")
grep -Eiq 'content-type:.*text/plain' <<<"$robots_headers"
robots=$(curl -fsSL --max-time 10 "${BASE_URL}/robots.txt")
grep -Fq "Sitemap:" <<<"$robots"
grep -Fq "Disallow: /api/" <<<"$robots"

sitemap_headers=$(curl -fsSI --max-time 10 "${BASE_URL}/sitemap.xml")
grep -Eiq 'content-type:.*(application/xml|text/xml)' <<<"$sitemap_headers"
sitemap=$(curl -fsSL --max-time 10 "${BASE_URL}/sitemap.xml")
grep -Fq "/features</loc>" <<<"$sitemap"
grep -Fq "/how-it-works</loc>" <<<"$sitemap"
grep -Fq "/pricing</loc>" <<<"$sitemap"
grep -Fq "/contact</loc>" <<<"$sitemap"
grep -Fq "/terms</loc>" <<<"$sitemap"
grep -Fq "/privacy</loc>" <<<"$sitemap"
grep -Fq "/refund-policy</loc>" <<<"$sitemap"
grep -Fq "/acceptable-use</loc>" <<<"$sitemap"
grep -Fq "/data-retention</loc>" <<<"$sitemap"
grep -Fq "/integration-policy</loc>" <<<"$sitemap"
grep -Fq "/session-expired</loc>" <<<"$sitemap"

printf 'Public pages smoke test passed for product, conversion, policy, recovery, resource guidance, robots.txt, and sitemap.xml\n'
