#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_FILE"' EXIT
EMAIL="security-$(date +%s%N)@example.com"

status() { curl -sS -o /tmp/saas-security-response.json -w '%{http_code}' -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' "$@"; }
status -X POST -d '{"email":"bad","password":"short"}' "$BASE_URL/api/auth/login" | grep -qx '400'
status -X POST -d "{\"name\":\"Security QA\",\"email\":\"$EMAIL\",\"password\":\"secure-password-123\"}" "$BASE_URL/api/auth/register" | grep -qx '201'
status -X POST "$BASE_URL/api/auth/logout" | grep -qx '200'
status "$BASE_URL/api/auth/me" | grep -qx '401'
status -X POST -d '{"type":"subscription.active","payload":{}}' -H 'x-billing-event-id: security-invalid-signature' -H 'x-billing-signature: invalid' "$BASE_URL/api/checkout/webhook" | grep -qx '401'
printf 'Security smoke test passed\n'
