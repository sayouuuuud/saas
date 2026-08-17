#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
for route in /admin /admin/teachers /admin/plans /admin/subscriptions /admin/billing /admin/lms-links; do
  body="${TMPDIR:-/tmp}/centralia-admin-page-$$-${route//\//_}"
  status=$(curl -sS --max-time 10 -o "$body" -w '%{http_code}' "$BASE_URL$route")
  test "$status" = "200"
  grep -q 'محمية\|محمي' "$body"
  rm -f "$body"
done
printf 'Admin pages smoke test passed for /admin, teachers, plans, subscriptions, billing, and lms-links with unauthenticated guard\n'
