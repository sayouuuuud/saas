#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

landing=$(curl -fsSL --max-time 10 "${BASE_URL}/")
grep -Fq 'href="/contact"' <<<"$landing"
grep -Fq 'href="/resources/status"' <<<"$landing"
grep -Fq 'href="/privacy"' <<<"$landing"
grep -Fq 'href="/terms"' <<<"$landing"
grep -Fq 'href="/refund-policy"' <<<"$landing"

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
assert_page "/demo" "عرض عملي" "اطلب عرضًا | مركزية" "اطلب عرضًا عمليًا لمنصة مركزية لإدارة حساب SaaS والاشتراك والفوترة وروابط المنصة التعليمية."
assert_page "/contact" "نحن هنا للمساعدة" "تواصل معنا | مركزية" "تواصل مع فريق مركزية بشأن الحساب والاشتراك والفوترة ورابط المنصة والدعم."

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
grep -Fq "/demo</loc>" <<<"$sitemap"
grep -Fq "/contact</loc>" <<<"$sitemap"

printf 'Public pages smoke test passed for /features, /how-it-works, /pricing, /demo, /contact, robots.txt, and sitemap.xml\n'
