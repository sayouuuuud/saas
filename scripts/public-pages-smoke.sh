#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

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

printf 'Public pages smoke test passed for /features, /how-it-works, and /pricing\n'
