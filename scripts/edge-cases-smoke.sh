#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_FILE"' EXIT
EMAIL="edge-$(date +%s%N)@example.com"
TEST_CLIENT="edge-smoke-$(date +%s%N)"

status_request() {
  curl -sS -o /tmp/saas-edge-response.json -w '%{http_code}' -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H "x-test-client: $TEST_CLIENT" "$@"
}

status_request -X POST -d "{\"name\":\"Edge QA\",\"email\":\"$EMAIL\",\"password\":\"secure-password-123\"}" "$BASE_URL/api/auth/register" | grep -qx '201'
status_request -X POST -d "{\"name\":\"Edge QA\",\"email\":\"$EMAIL\",\"password\":\"secure-password-123\"}" "$BASE_URL/api/auth/register" | grep -qx '409'
status_request -X POST --data-binary '{not-json' "$BASE_URL/api/auth/register" | grep -qx '400'
status_request -X PATCH --data-binary '{not-json' "$BASE_URL/api/me" | grep -qx '400'
status_request -X PATCH --data-binary '{not-json' "$BASE_URL/api/workspace" | grep -qx '400'
status_request -X POST -d '{"planCode":"unknown-plan","billingCycle":"MONTHLY"}' "$BASE_URL/api/checkout/session" | grep -qx '404'
status_request -X POST "$BASE_URL/api/auth/logout" | grep -qx '200'
status_request "$BASE_URL/api/workspace" | grep -qx '401'
printf 'Edge-case smoke test passed for %s\n' "$EMAIL"
