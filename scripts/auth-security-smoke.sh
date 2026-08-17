#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="auth-$(date +%s%N)@example.com"
TEST_CLIENT="auth-security-smoke-$(date +%s%N)"
COOKIES="$(mktemp)"
trap 'rm -f "$COOKIES"' EXIT
register="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -c "$COOKIES" -H 'Content-Type: application/json' -d "{\"name\":\"Auth QA\",\"email\":\"$EMAIL\",\"password\":\"StrongPass123!\"}" "$BASE_URL/api/auth/register")"
token="$(printf '%s' "$register" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).verificationToken||""))')"
[ -n "$token" ] || { echo "missing local verification token" >&2; exit 1; }
verify="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -H 'Content-Type: application/json' -d "{\"token\":\"$token\"}" "$BASE_URL/api/auth/verify")"
printf '%s' "$verify" | grep -q '"verified":true'
forgot="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\"}" "$BASE_URL/api/auth/forgot-password")"
reset_token="$(printf '%s' "$forgot" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).resetToken||""))')"
[ -n "$reset_token" ] || { echo "missing local reset token" >&2; exit 1; }
reset="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -H 'Content-Type: application/json' -d "{\"token\":\"$reset_token\",\"password\":\"NewStrongPass123!\"}" "$BASE_URL/api/auth/reset-password")"
printf '%s' "$reset" | grep -q '"reset":true'
[ "$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIES" "$BASE_URL/api/auth/me")" = "401" ]
printf 'Auth security smoke passed for %s\n' "$EMAIL"
