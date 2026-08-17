#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
profile_body=$(curl -fsS --max-time 10 "$BASE_URL/app/profile")
grep -q 'مركزية' <<<"$profile_body"
grep -q 'ملفك الشخصي' <<<"$profile_body"
subscription_body=$(curl -fsS --max-time 10 "$BASE_URL/app/subscription")
grep -q 'مركزية' <<<"$subscription_body"
grep -q 'بيانات SaaS' <<<"$subscription_body"
usage_body=$(curl -fsS --max-time 10 "$BASE_URL/app/usage")
grep -q 'أرقام واضحة' <<<"$usage_body"
grep -q 'مصدرها' <<<"$usage_body"
lms_body=$(curl -fsS --max-time 10 "$BASE_URL/app/lms-connection")
grep -q 'منصتك في مكان واحد' <<<"$lms_body"
grep -q 'دون نقلها' <<<"$lms_body"
reports_body=$(curl -fsS --max-time 10 "$BASE_URL/app/reports")
grep -q 'تقريرك في SaaS' <<<"$reports_body"
grep -q 'بلا تخمين' <<<"$reports_body"

for endpoint in me subscription usage lms-link reports; do
  headers="${TMPDIR:-/tmp}/centralia-account-${endpoint}-headers-$$"
  body="${TMPDIR:-/tmp}/centralia-account-${endpoint}-body-$$"
  status=$(curl -sS --max-time 10 -D "$headers" -o "$body" -w '%{http_code}' "$BASE_URL/api/$endpoint")
  test "$status" = "401"
  grep -Eiq '^cache-control:.*no-store' "$headers"
  grep -q 'يجب تسجيل الدخول' "$body"
  rm -f "$headers" "$body"
done

printf 'Account pages smoke test passed for /app/profile, /app/subscription, /app/usage, /app/reports, /app/lms-connection, /api/me, /api/subscription, /api/usage, /api/lms-link, and /api/reports\n'
