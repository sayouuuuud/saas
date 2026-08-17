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
team_body=$(curl -fsS --max-time 10 "$BASE_URL/app/team")
grep -q 'إدارة الفريق' <<<"$team_body"
grep -q 'بيانات الفريق مملوكة لـ SaaS' <<<"$team_body"
settings_body=$(curl -fsS --max-time 10 "$BASE_URL/app/settings")
grep -q 'إعدادات بسيطة' <<<"$settings_body"
grep -q 'حدود الإعدادات' <<<"$settings_body"
grep -q 'noindex' <<<"$settings_body"
security_body=$(curl -fsS --max-time 10 "$BASE_URL/app/security")
grep -q 'حسابك محمي' <<<"$security_body"
grep -q 'حدود أمنية صريحة' <<<"$security_body"
notifications_body=$(curl -fsS --max-time 10 "$BASE_URL/app/notifications")
grep -q 'تنبيهات SaaS' <<<"$notifications_body"
grep -q 'لا توجد إشعارات جديدة' <<<"$notifications_body"
onboarding_body=$(curl -fsS --max-time 10 "$BASE_URL/onboarding")
grep -q 'سجّل الدخول أولًا' <<<"$onboarding_body"
grep -q 'noindex' <<<"$onboarding_body"
admin_settings_body=$(curl -fsS --max-time 10 "$BASE_URL/admin/settings")
grep -q 'هذه المساحة محمية' <<<"$admin_settings_body"
for page in profile subscription usage reports team settings security notifications lms-connection; do
  private_body=$(curl -fsS --max-time 10 "$BASE_URL/app/$page")
  grep -q 'noindex' <<<"$private_body"
done

for page in onboarding; do
  private_body=$(curl -fsS --max-time 10 "$BASE_URL/$page")
  grep -q 'noindex' <<<"$private_body"
done

for endpoint in me subscription usage lms-link reports workspace; do
  headers="${TMPDIR:-/tmp}/centralia-account-${endpoint}-headers-$$"
  body="${TMPDIR:-/tmp}/centralia-account-${endpoint}-body-$$"
  status=$(curl -sS --max-time 10 -D "$headers" -o "$body" -w '%{http_code}' "$BASE_URL/api/$endpoint")
  test "$status" = "401"
  grep -Eiq '^cache-control:.*no-store' "$headers"
  grep -q 'يجب تسجيل الدخول' "$body"
  rm -f "$headers" "$body"
done

printf 'Account pages smoke test passed for private noindex metadata on account and onboarding pages, profile, subscription, usage, reports, team, settings, security, notifications, LMS connection, admin guard, and protected SaaS APIs\n'
