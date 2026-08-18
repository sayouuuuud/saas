#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_FILE"' EXIT
EMAIL="workspace-invite-$(date +%s%N)@example.com"
CLIENT="workspace-invites-smoke-$(date +%s%N)"
json_request() {
  curl -sS --max-time 10 -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H "x-test-client: $CLIENT" "$@"
}
status_request() {
  curl -sS --max-time 10 -o /tmp/centralia-workspace-invite-response.json -w '%{http_code}' -b "$COOKIE_FILE" -c "$COOKIE_FILE" -H 'content-type: application/json' -H "x-test-client: $CLIENT" "$@"
}

REGISTERED="$(json_request -X POST -d "{\"name\":\"Invite QA\",\"email\":\"$EMAIL\",\"password\":\"correct-horse-123\"}" "$BASE_URL/api/auth/register")"
printf '%s' "$REGISTERED" | grep -q 'Invite QA'

CREATED="$(json_request -X POST -d '{"email":"teammate@example.com","role":"VIEWER","expiresInDays":7}' "$BASE_URL/api/workspace/invites")"
printf '%s' "$CREATED" | grep -q 'teammate@example.com'
INVITE_ID="$(printf '%s' "$CREATED" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
INVITE_URL="$(printf '%s' "$CREATED" | sed -n 's/.*"inviteUrl":"\([^"]*\)".*/\1/p')"
test -n "$INVITE_ID"
test -n "$INVITE_URL"

LISTED="$(json_request "$BASE_URL/api/workspace/invites?limit=10&offset=0")"
printf '%s' "$LISTED" | grep -q 'teammate@example.com'
printf '%s' "$LISTED" | grep -vq 'tokenHash'

RESENT="$(json_request -X POST "$BASE_URL/api/workspace/invites/$INVITE_ID/resend")"
printf '%s' "$RESENT" | grep -q 'teammate@example.com'
REPLACEMENT_ID="$(printf '%s' "$RESENT" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
REPLACEMENT_URL="$(printf '%s' "$RESENT" | sed -n 's/.*"inviteUrl":"\([^"]*\)".*/\1/p')"
test -n "$REPLACEMENT_ID"
test "$REPLACEMENT_ID" != "$INVITE_ID"
test -n "$REPLACEMENT_URL"
test "$REPLACEMENT_URL" != "$INVITE_URL"

LISTED_AFTER_RESEND="$(json_request "$BASE_URL/api/workspace/invites?limit=10&offset=0")"
printf '%s' "$LISTED_AFTER_RESEND" | grep -q '"revokedAt"'
printf '%s' "$LISTED_AFTER_RESEND" | grep -q "$REPLACEMENT_ID"

REVOKED_STATUS="$(status_request -X POST "$BASE_URL/api/workspace/invites/$REPLACEMENT_ID")"
test "$REVOKED_STATUS" = "200"
printf '%s' "$(cat /tmp/centralia-workspace-invite-response.json)" | grep -q '"ok":true'

DUPLICATE_REVOKE="$(json_request -X POST "$BASE_URL/api/workspace/invites/$REPLACEMENT_ID")"
printf '%s' "$DUPLICATE_REVOKE" | grep -q '"alreadyRevoked":true'

printf 'Workspace invites smoke passed for %s, including creation, token-rotating resend, redacted listing, revoke, and idempotent revoke\n' "$EMAIL"
