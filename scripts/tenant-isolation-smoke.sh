#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_A="$(mktemp)"
COOKIE_B="$(mktemp)"
trap 'rm -f "$COOKIE_A" "$COOKIE_B"' EXIT
EMAIL_A="tenant-a-$(date +%s%N)@example.com"
EMAIL_B="tenant-b-$(date +%s%N)@example.com"
json_request() { curl -sS -b "$1" -c "$1" -H 'content-type: application/json' "${@:2}"; }
status_request() { curl -sS -o /tmp/saas-tenant-response.json -w '%{http_code}' -b "$1" -c "$1" -H 'content-type: application/json' "${@:2}"; }

json_request "$COOKIE_A" -X POST -d "{\"name\":\"Tenant A\",\"email\":\"$EMAIL_A\",\"password\":\"secure-password-123\"}" "$BASE_URL/api/auth/register" >/tmp/saas-tenant-a.json
link="$(json_request "$COOKIE_A" -X POST -d '{"displayName":"Tenant A LMS","publicUrl":"https://example.com"}' "$BASE_URL/api/lms-link")"
LINK_ID="$(printf '%s' "$link" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
test -n "$LINK_ID"
json_request "$COOKIE_A" -X POST "$BASE_URL/api/auth/logout" >/dev/null
json_request "$COOKIE_B" -X POST -d "{\"name\":\"Tenant B\",\"email\":\"$EMAIL_B\",\"password\":\"secure-password-123\"}" "$BASE_URL/api/auth/register" >/tmp/saas-tenant-b.json

test "$(status_request "$COOKIE_B" -X DELETE "$BASE_URL/api/lms-link/$LINK_ID")" = "404"
test "$(status_request "$COOKIE_B" -X POST "$BASE_URL/api/lms-link/$LINK_ID/check")" = "404"
printf 'Tenant-isolation smoke test passed for link %s\n' "$LINK_ID"

