#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

check_demo_route() {
  local path="$1"
  local body
  body="$(curl -fsS "$BASE_URL$path")"
  grep -q 'demo-account-shell' <<<"$body"
  grep -q 'وضع العرض' <<<"$body" || grep -q 'قراءة فقط' <<<"$body"
}

check_demo_route "/demo/account"
for section in subscription usage team support security; do
  check_demo_route "/demo/account/$section"
done

sitemap="$(curl -fsS "$BASE_URL/sitemap.xml")"
grep -q '/demo/account' <<<"$sitemap"
grep -q '/demo/account/subscription' <<<"$sitemap"

echo "demo-mode-smoke: PASS (public read-only previews and sitemap)"
