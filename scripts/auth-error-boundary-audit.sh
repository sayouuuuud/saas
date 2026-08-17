#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
missing=0
while IFS= read -r route; do
  if ! grep -q 'safeAuthError' "$route" || ! grep -q 'return safeAuthError' "$route"; then
    printf 'Missing safeAuthError boundary: %s\n' "${route#"$root"/}"
    missing=1
  fi
done < <(find "$root/app/api" -type f -name 'route.ts' | sort)

if (( missing )); then
  exit 1
fi

count="$(find "$root/app/api" -type f -name 'route.ts' | wc -l | tr -d ' ')"
printf 'API safeAuthError boundary audit passed for %s routes\n' "$count"
