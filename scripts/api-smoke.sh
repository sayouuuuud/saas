#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_FILE"' EXIT
EMAIL="qa-$(date +%s%N)@example.com"
TEST_CLIENT="api-smoke-$(date +%s%N)"
json_request() { curl -sS -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H "x-test-client: $TEST_CLIENT" "$@"; }
status_request() { curl -sS -o /tmp/saas-smoke-response.json -w '%{http_code}' -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H "x-test-client: $TEST_CLIENT" "$@"; }
status_and_headers_request() { curl -sS -D /tmp/saas-smoke-headers.txt -o /tmp/saas-smoke-response.json -w '%{http_code}' -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H "x-test-client: $TEST_CLIENT" "$@"; }

register="$(json_request -X POST -d "{\"name\":\"QA Teacher\",\"email\":\"$EMAIL\",\"password\":\"correct-horse-123\"}" "$BASE_URL/api/auth/register")"
test "$(printf '%s' "$register" | grep -c 'QA Teacher')" -eq 1
me="$(json_request "$BASE_URL/api/auth/me")"
test "$(printf '%s' "$me" | grep -c 'Starter')" -eq 1
workspace="$(json_request "$BASE_URL/api/workspace?memberLimit=999&memberOffset=1")"
test "$(printf '%s' "$workspace" | grep -c '"limit":50')" -eq 1
test "$(printf '%s' "$workspace" | grep -c '"offset":1')" -eq 1
workspace_first_page="$(json_request "$BASE_URL/api/workspace?memberLimit=1&memberOffset=0")"
test "$(printf '%s' "$workspace_first_page" | grep -c '"membersPagination"')" -eq 1
test "$(printf '%s' "$workspace_first_page" | grep -c '"limit":1')" -ge 1
test "$(printf '%s' "$workspace_first_page" | grep -c '"role":"OWNER"')" -ge 1
plans_status="$(status_request "$BASE_URL/api/plans")"
test "$plans_status" = "200"
test "$(cat /tmp/saas-smoke-response.json | grep -c '"plans"')" -eq 1
bad_status="$(status_request -X POST -d '{"displayName":"Internal","publicUrl":"http://127.0.0.1:8080"}' "$BASE_URL/api/lms-link")"
test "$bad_status" = "400"
good="$(json_request -X POST -d '{"displayName":"Demo Academy","publicUrl":"https://example.com"}' "$BASE_URL/api/lms-link")"
LINK_ID="$(printf '%s' "$good" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
test -n "$LINK_ID"
me_with_link="$(json_request "$BASE_URL/api/auth/me")"
test "$(printf '%s' "$me_with_link" | grep -c 'Demo Academy')" -ge 1
lms_links="$(json_request "$BASE_URL/api/lms-link?limit=999&offset=1")"
test "$(printf '%s' "$lms_links" | grep -c '"limit":50')" -eq 1
test "$(printf '%s' "$lms_links" | grep -c '"offset":1')" -eq 1
lms_links_first_page="$(json_request "$BASE_URL/api/lms-link?limit=1&offset=0")"
test "$(printf '%s' "$lms_links_first_page" | grep -c "$LINK_ID")" -ge 1
check="$(json_request -X POST "$BASE_URL/api/lms-link/$LINK_ID/check")"
test "$(printf '%s' "$check" | grep -c 'check')" -ge 1
integration_request="$(json_request -X POST "$BASE_URL/api/lms-link/$LINK_ID/request-integration")"
test "$(printf '%s' "$integration_request" | grep -c 'recorded')" -ge 1
integration_repeat="$(json_request -X POST "$BASE_URL/api/lms-link/$LINK_ID/request-integration")"
test "$(printf '%s' "$integration_repeat" | grep -c 'already_recorded')" -eq 1
ticket="$(json_request -X POST -d '{"category":"GENERAL","subject":"Smoke test","description":"Reproducible support API smoke test","priority":"normal"}' "$BASE_URL/api/tickets")"
test "$(printf '%s' "$ticket" | grep -c 'SUP-')" -ge 1
TICKET_ID="$(printf '%s' "$ticket" | sed -n 's/.*"ticket":{"id":"\([^"]*\)".*/\1/p')"
test -n "$TICKET_ID"
bad_ticket_action="$(status_request -X POST -d '{"action":"archive"}' "$BASE_URL/api/tickets/$TICKET_ID")"
test "$bad_ticket_action" = "400"
tickets="$(json_request "$BASE_URL/api/tickets?limit=999&offset=1")"
test "$(printf '%s' "$tickets" | grep -c '"limit":50')" -eq 1
test "$(printf '%s' "$tickets" | grep -c '"offset":1')" -eq 1
tickets_first_page="$(json_request "$BASE_URL/api/tickets?limit=1&offset=0")"
test "$(printf '%s' "$tickets_first_page" | grep -c '"limit":1')" -eq 1
test "$(printf '%s' "$tickets_first_page" | grep -c '"offset":0')" -eq 1
usage_history_status="$(status_and_headers_request "$BASE_URL/api/usage/history")"
test "$usage_history_status" = "200"
grep -Eiq '^cache-control: (private, )?no-store' /tmp/saas-smoke-headers.txt
usage_history="$(cat /tmp/saas-smoke-response.json)"
test "$(printf '%s' "$usage_history" | grep -c 'saas_audit_log')" -eq 1
checkout="$(json_request -X POST -d '{"planCode":"growth","billingCycle":"MONTHLY"}' "$BASE_URL/api/checkout/session")"
test "$(printf '%s' "$checkout" | grep -c 'ACTIVE')" -ge 1
invoices="$(json_request "$BASE_URL/api/invoices?limit=999&offset=1")"
test "$(printf '%s' "$invoices" | grep -c '"limit":50')" -eq 1
test "$(printf '%s' "$invoices" | grep -c '"offset":1')" -eq 1
invoices_first_page="$(json_request "$BASE_URL/api/invoices?limit=1&offset=0")"
test "$(printf '%s' "$invoices_first_page" | grep -c 'PAID')" -ge 1
reports_status="$(status_and_headers_request "$BASE_URL/api/reports")"
test "$reports_status" = "200"
grep -Eiq '^cache-control: (private, )?no-store' /tmp/saas-smoke-headers.txt
reports="$(cat /tmp/saas-smoke-response.json)"
test "$(printf '%s' "$reports" | grep -c '"invoiceCount":1')" -eq 1
printf 'API smoke test passed for %s\n' "$EMAIL"
