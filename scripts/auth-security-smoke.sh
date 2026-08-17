#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="auth-$(date +%s%N)@example.com"
TEST_CLIENT="auth-security-smoke-$(date +%s%N)"
COOKIES="$(mktemp)"
trap 'rm -f "$COOKIES"' EXIT
[ "$(curl -s -o /dev/null -w '%{http_code}' -H "x-test-client: $TEST_CLIENT" -H 'Content-Type: application/json' --data '{not-json' "$BASE_URL/api/auth/verify")" = "400" ]
[ "$(curl -s -o /dev/null -w '%{http_code}' -H "x-test-client: $TEST_CLIENT" -H 'Content-Type: application/json' --data '{not-json' "$BASE_URL/api/auth/reset-password")" = "400" ]
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
login1="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -c "$COOKIES" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"NewStrongPass123!\"}" "$BASE_URL/api/auth/login")"
printf '%s' "$login1" | grep -q '"user"'
two_factor_status="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -b "$COOKIES" "$BASE_URL/api/auth/2fa")"
printf '%s' "$two_factor_status" | grep -q '"enabled":false'
two_factor_start="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -b "$COOKIES" -H 'Content-Type: application/json' -d '{"action":"start"}' "$BASE_URL/api/auth/2fa")"
printf '%s' "$two_factor_start" | grep -q 'otpauthUri'
printf '%s' "$two_factor_start" | grep -q 'secret'
two_factor_secret="$(printf '%s' "$two_factor_start" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).secret||""))')"
[ -n "$two_factor_secret" ] || { echo "missing TOTP secret" >&2; exit 1; }
two_factor_code="$(node scripts/totp-code.mjs "$two_factor_secret")"
enable_two_factor="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -b "$COOKIES" -H 'Content-Type: application/json' -d "{\"action\":\"enable\",\"code\":\"$two_factor_code\"}" "$BASE_URL/api/auth/2fa")"
printf '%s' "$enable_two_factor" | grep -q '"enabled":true'
reports_before="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -b "$COOKIES" "$BASE_URL/api/reports")"
before_count="$(printf '%s' "$reports_before" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(Number(JSON.parse(s).summary.auditEventCount||0)))')"
[ "$before_count" -ge 6 ] || { echo "registration, verification, password-reset, or login audit events missing" >&2; exit 1; }
printf '%s' "$(curl -fsS -H "x-test-client: $TEST_CLIENT" -b "$COOKIES" -X POST "$BASE_URL/api/auth/logout")" | grep -q '"ok":true'
login2_challenge="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -c "$COOKIES" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"NewStrongPass123!\"}" "$BASE_URL/api/auth/login")"
printf '%s' "$login2_challenge" | grep -q '"twoFactorRequired":true'
challenge_token="$(printf '%s' "$login2_challenge" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).challengeToken||""))')"
[ -n "$challenge_token" ] || { echo "missing 2FA challenge token" >&2; exit 1; }
challenge_code="$(node scripts/totp-code.mjs "$two_factor_secret")"
login2="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -c "$COOKIES" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"NewStrongPass123!\",\"challengeToken\":\"$challenge_token\",\"code\":\"$challenge_code\"}" "$BASE_URL/api/auth/login")"
printf '%s' "$login2" | grep -q '"user"'
reports_after="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -b "$COOKIES" "$BASE_URL/api/reports")"
after_count="$(printf '%s' "$reports_after" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(Number(JSON.parse(s).summary.auditEventCount||0)))')"
[ "$after_count" -ge $((before_count + 2)) ] || { echo "logout/login audit events missing" >&2; exit 1; }
sessions="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -b "$COOKIES" "$BASE_URL/api/auth/logout-all")"
printf '%s' "$sessions" | grep -q 'activeSessions'
revoked="$(curl -fsS -H "x-test-client: $TEST_CLIENT" -b "$COOKIES" -c "$COOKIES" -X POST "$BASE_URL/api/auth/logout-all")"
printf '%s' "$revoked" | grep -q 'revoked'
[ "$(curl -s -o /dev/null -w '%{http_code}' -H "x-test-client: $TEST_CLIENT" -b "$COOKIES" "$BASE_URL/api/auth/me")" = "401" ]
printf 'Auth security smoke passed for %s\n' "$EMAIL"
