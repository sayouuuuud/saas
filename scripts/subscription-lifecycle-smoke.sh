#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_FILE"' EXIT
EMAIL="subscription-qa-$(date +%s%N)@example.com"
TEST_CLIENT="subscription-lifecycle-smoke-$(date +%s%N)"
EVENT_ID="subscription-lifecycle-webhook-$(date +%s%N)"
json_request() { curl -sS -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H "x-test-client: $TEST_CLIENT" "$@"; }
status_request() { curl -sS -o /tmp/saas-subscription-smoke-response.json -w '%{http_code}' -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H "x-test-client: $TEST_CLIENT" "$@"; }

json_request -X POST -d "{\"name\":\"Subscription QA\",\"email\":\"$EMAIL\",\"password\":\"correct-horse-123\"}" "$BASE_URL/api/auth/register" | grep -q 'Subscription QA'
checkout="$(json_request -X POST -d '{"planCode":"growth","billingCycle":"MONTHLY"}' "$BASE_URL/api/checkout/session")"
printf '%s' "$checkout" | grep -q 'ACTIVE'
onboarding_body="$(curl -fsS --max-time 10 -b "$COOKIE_FILE" -c "$COOKIE_FILE" "$BASE_URL/onboarding?checkout=success")"
grep -q 'اكتمل الإعداد الأولي' <<<"$onboarding_body"
grep -q 'حالة الاشتراك' <<<"$onboarding_body"
grep -q 'ثلاث خطوات للبدء' <<<"$onboarding_body"

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

WEBHOOK_SECRET="${BILLING_WEBHOOK_SECRET:-}"
if [ -z "$WEBHOOK_SECRET" ] && [ -f .env.local ]; then WEBHOOK_SECRET="$(sed -n 's/^BILLING_WEBHOOK_SECRET="\(.*\)"$/\1/p' .env.local)"; fi
if [ -n "$WEBHOOK_SECRET" ] && command -v openssl >/dev/null 2>&1; then
  ME="$(json_request "$BASE_URL/api/auth/me")"
  WORKSPACE_ID="$(printf '%s' "$ME" | sed -n 's/.*"workspace":{"id":"\([^"]*\)".*/\1/p')"
  INVOICES="$(json_request "$BASE_URL/api/invoices")"
  INVOICE_ID="$(printf '%s' "$INVOICES" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
  test -n "$WORKSPACE_ID"
  test -n "$INVOICE_ID"
  BODY="{\"type\":\"payment.succeeded\",\"workspaceId\":\"$WORKSPACE_ID\",\"invoiceId\":\"$INVOICE_ID\"}"
  SIGNATURE="$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $NF}')"
  WEBHOOK_RESPONSE="$(json_request -X POST --data "$BODY" -H "x-billing-event-id: $EVENT_ID" -H "x-billing-signature: $SIGNATURE" "$BASE_URL/api/checkout/webhook")"
  printf '%s' "$WEBHOOK_RESPONSE" | grep -q '"ok":true'
  DUPLICATE_RESPONSE="$(json_request -X POST --data "$BODY" -H "x-billing-event-id: $EVENT_ID" -H "x-billing-signature: $SIGNATURE" "$BASE_URL/api/checkout/webhook")"
  printf '%s' "$DUPLICATE_RESPONSE" | grep -q '"duplicate":true'
  MISMATCH_BODY="{\"type\":\"payment.succeeded\",\"workspaceId\":\"$WORKSPACE_ID\"}"
  MISMATCH_SIGNATURE="$(printf '%s' "$MISMATCH_BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $NF}')"
  MISMATCH_STATUS="$(status_request -X POST --data "$MISMATCH_BODY" -H "x-billing-event-id: $EVENT_ID" -H "x-billing-signature: $MISMATCH_SIGNATURE" "$BASE_URL/api/checkout/webhook")"
  test "$MISMATCH_STATUS" = "409"
  subscription="$(json_request "$BASE_URL/api/subscription")"
  printf '%s' "$subscription" | grep -q '"cancelAtPeriodEnd":false'
fi

printf 'Subscription lifecycle smoke test passed for %s, including authenticated checkout-to-onboarding flow\n' "$EMAIL"
