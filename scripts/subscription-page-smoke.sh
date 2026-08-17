#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
PAGE_HEADERS="${TMPDIR:-/tmp}/centralia-subscription-page-headers-$$"
API_HEADERS="${TMPDIR:-/tmp}/centralia-subscription-api-headers-$$"
PAGE_BODY="${TMPDIR:-/tmp}/centralia-subscription-page-body-$$"
API_BODY="${TMPDIR:-/tmp}/centralia-subscription-api-body-$$"
cleanup() { rm -f "$PAGE_HEADERS" "$API_HEADERS" "$PAGE_BODY" "$API_BODY"; }
trap cleanup EXIT

curl -fsS --max-time 10 -D "$PAGE_HEADERS" -o "$PAGE_BODY" "$BASE_URL/app/subscription"
grep -q '^HTTP/1.1 200' "$PAGE_HEADERS"
grep -q 'الاشتراك،' "$PAGE_BODY"
grep -q 'بيانات SaaS' "$PAGE_BODY"

status=$(curl -sS --max-time 10 -D "$API_HEADERS" -o "$API_BODY" -w '%{http_code}' "$BASE_URL/api/subscription")
test "$status" = "401"
grep -Eiq '^cache-control:.*no-store' "$API_HEADERS"
grep -q 'يجب تسجيل الدخول' "$API_BODY"

printf 'Subscription page smoke test passed for /app/subscription and protected /api/subscription\n'
