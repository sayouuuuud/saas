#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_FILE"' EXIT
EMAIL="qa-$(date +%s%N)@example.com"
json_request() { curl -sS -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H 'x-test-client: api-smoke' "$@"; }
status_request() { curl -sS -o /tmp/saas-smoke-response.json -w '%{http_code}' -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H 'x-test-client: api-smoke' "$@"; }

register="$(json_request -X POST -d "{\"name\":\"QA Teacher\",\"email\":\"$EMAIL\",\"password\":\"correct-horse-123\"}" "$BASE_URL/api/auth/register")"
test "$(printf '%s' "$register" | grep -c 'QA Teacher')" -eq 1
me="$(json_request "$BASE_URL/api/auth/me")"
test "$(printf '%s' "$me" | grep -c 'Starter')" -eq 1
bad_status="$(status_request -X POST -d '{"displayName":"Internal","publicUrl":"http://127.0.0.1:8080"}' "$BASE_URL/api/lms-link")"
test "$bad_status" = "400"
good="$(json_request -X POST -d '{"displayName":"Demo Academy","publicUrl":"https://example.com"}' "$BASE_URL/api/lms-link")"
LINK_ID="$(printf '%s' "$good" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
test -n "$LINK_ID"
me_with_link="$(json_request "$BASE_URL/api/auth/me")"
test "$(printf '%s' "$me_with_link" | grep -c 'Demo Academy')" -ge 1
check="$(json_request -X POST "$BASE_URL/api/lms-link/$LINK_ID/check")"
test "$(printf '%s' "$check" | grep -c 'check')" -ge 1
ticket="$(json_request -X POST -d '{"category":"GENERAL","subject":"Smoke test","description":"Reproducible support API smoke test","priority":"normal"}' "$BASE_URL/api/tickets")"
test "$(printf '%s' "$ticket" | grep -c 'SUP-')" -ge 1
TICKET_ID="$(printf '%s' "$ticket" | sed -n 's/.*"ticket":{"id":"\([^"]*\)".*/\1/p')"
test -n "$TICKET_ID"
bad_ticket_action="$(status_request -X POST -d '{"action":"archive"}' "$BASE_URL/api/tickets/$TICKET_ID")"
test "$bad_ticket_action" = "400"
checkout="$(json_request -X POST -d '{"planCode":"growth","billingCycle":"MONTHLY"}' "$BASE_URL/api/checkout/session")"
test "$(printf '%s' "$checkout" | grep -c 'ACTIVE')" -ge 1
invoices="$(json_request "$BASE_URL/api/invoices")"
test "$(printf '%s' "$invoices" | grep -c 'PAID')" -ge 1
printf 'API smoke test passed for %s\n' "$EMAIL"
