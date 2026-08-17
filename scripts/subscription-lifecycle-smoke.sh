#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_FILE"' EXIT
EMAIL="subscription-qa-$(date +%s%N)@example.com"
json_request() { curl -sS -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H 'x-test-client: subscription-lifecycle-smoke' "$@"; }
status_request() { curl -sS -o /tmp/saas-subscription-smoke-response.json -w '%{http_code}' -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H 'x-test-client: subscription-lifecycle-smoke' "$@"; }

json_request -X POST -d "{\"name\":\"Subscription QA\",\"email\":\"$EMAIL\",\"password\":\"correct-horse-123\"}" "$BASE_URL/api/auth/register" | grep -q 'Subscription QA'
json_request -X POST -d '{"planCode":"growth","billingCycle":"MONTHLY"}' "$BASE_URL/api/checkout/session" | grep -q 'ACTIVE'

cancelled="$(json_request -X POST "$BASE_URL/api/subscription/cancel")"
printf '%s' "$cancelled" | grep -q '"cancelAtPeriodEnd":true'
printf '%s' "$cancelled" | grep -q '"unchanged":false'

cancelled_again="$(json_request -X POST "$BASE_URL/api/subscription/cancel")"
printf '%s' "$cancelled_again" | grep -q '"cancelAtPeriodEnd":true'
printf '%s' "$cancelled_again" | grep -q '"unchanged":true'

reactivated="$(json_request -X POST "$BASE_URL/api/subscription/reactivate")"
printf '%s' "$reactivated" | grep -q '"cancelAtPeriodEnd":false'
printf '%s' "$reactivated" | grep -q '"unchanged":false'

reactivated_again="$(json_request -X POST "$BASE_URL/api/subscription/reactivate")"
printf '%s' "$reactivated_again" | grep -q '"cancelAtPeriodEnd":false'
printf '%s' "$reactivated_again" | grep -q '"unchanged":true'

status="$(status_request -X POST -d '{"planCode":"does-not-exist","billingCycle":"MONTHLY"}' "$BASE_URL/api/subscription/change-plan")"
test "$status" = "404"

printf 'Subscription lifecycle smoke test passed for %s\n' "$EMAIL"
