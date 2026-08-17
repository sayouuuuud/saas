#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_FILE"' EXIT
EMAIL="security-$(date +%s%N)@example.com"

status() { curl -sS -o /tmp/saas-security-response.json -w '%{http_code}' -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' "$@"; }
status -X POST -d '{"email":"bad","password":"short"}' "$BASE_URL/api/auth/login" | grep -qx '400'
status -X POST -d "{\"name\":\"Security QA\",\"email\":\"$EMAIL\",\"password\":\"secure-password-123\"}" "$BASE_URL/api/auth/register" | grep -qx '201'
status -X POST -d '{"displayName":"Private HTTPS","publicUrl":"https://localhost"}' "$BASE_URL/api/lms-link" | grep -qx '400'
status -X POST "$BASE_URL/api/auth/logout" | grep -qx '200'
status "$BASE_URL/api/auth/me" | grep -qx '401'
status -X POST -d '{"type":"subscription.active","payload":{}}' -H 'x-billing-event-id: security-invalid-signature' -H 'x-billing-signature: invalid' "$BASE_URL/api/checkout/webhook" | grep -qx '401'
WEBHOOK_SECRET="${BILLING_WEBHOOK_SECRET:-}"
if [ -z "$WEBHOOK_SECRET" ] && [ -f .env.local ]; then WEBHOOK_SECRET="$(sed -n 's/^BILLING_WEBHOOK_SECRET="\(.*\)"$/\1/p' .env.local)"; fi
if [ -n "$WEBHOOK_SECRET" ] && command -v openssl >/dev/null 2>&1; then
  BODY='{not-json'
  SIGNATURE="$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $NF}')"
  status -X POST --data "$BODY" -H 'x-billing-event-id: security-malformed-json' -H "x-billing-signature: $SIGNATURE" "$BASE_URL/api/checkout/webhook" | grep -qx '400'
fi
printf 'Security smoke test passed\n'
