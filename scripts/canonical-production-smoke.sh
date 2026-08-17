#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://saas-gold-seven-80.vercel.app}"
BASE_URL="${BASE_URL%/}"

assert_status() {
  local path="$1"
  local expected="$2"
  local headers
  headers=$(mktemp)
  local status
  status=$(curl -sS --max-time 20 -D "$headers" -o /dev/null -w '%{http_code}' "$BASE_URL$path")
  if [[ "$status" != "$expected" ]]; then
    echo "canonical production status mismatch for $path: expected $expected, got $status" >&2
    cat "$headers" >&2
    rm -f "$headers"
    exit 1
  fi
  rm -f "$headers"
}

assert_content_type() {
  local path="$1"
  local expected="$2"
  local headers
  headers=$(mktemp)
  curl -sS --max-time 20 -D "$headers" -o /dev/null "$BASE_URL$path" >/dev/null
  if ! grep -Eiq "^content-type: ${expected}" "$headers"; then
    echo "canonical production content-type mismatch for $path" >&2
    cat "$headers" >&2
    rm -f "$headers"
    exit 1
  fi
  rm -f "$headers"
}

for path in / /features /how-it-works /pricing /demo /contact /terms /privacy /refund-policy /acceptable-use; do
  assert_status "$path" 200
done
assert_status /robots.txt 200
assert_status /sitemap.xml 200
assert_content_type /robots.txt 'text/plain'
assert_content_type /sitemap.xml 'application/xml'

plans_headers=$(mktemp)
plans_body=$(mktemp)
plans_status=$(curl -sS --max-time 20 -D "$plans_headers" -o "$plans_body" -w '%{http_code}' "$BASE_URL/api/plans")
if [[ "$plans_status" != "200" ]]; then
  echo "canonical production plans status mismatch: expected 200, got $plans_status" >&2
  cat "$plans_headers" >&2
  cat "$plans_body" >&2
  rm -f "$plans_headers" "$plans_body"
  exit 1
fi
grep -Eiq '^cache-control: .*no-store' "$plans_headers"
if grep -q '"degraded":true' "$plans_body"; then
  grep -Eiq '^retry-after: [0-9]+' "$plans_headers"
  grep -Eiq '^x-centralia-degraded: plans-database-unavailable' "$plans_headers"
else
  grep -q '"plans"' "$plans_body"
fi
rm -f "$plans_headers" "$plans_body"

printf 'Canonical production smoke passed for %s\n' "$BASE_URL"
