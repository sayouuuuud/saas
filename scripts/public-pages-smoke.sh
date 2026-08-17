#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

assert_page() {
  local path="$1"
  local marker="$2"
  local body
  body=$(curl -fsSL --max-time 10 "${BASE_URL}${path}")
  grep -Fq "$marker" <<<"$body"
  grep -Fq "لا ننشئ LMS" <<<"$body"
}

assert_page "/features" "مزايا مركزية"
assert_page "/how-it-works" "كيف تعمل المنصة"
assert_page "/pricing" "أسعار واضحة"

printf 'Public pages smoke test passed for /features, /how-it-works, and /pricing\n'
