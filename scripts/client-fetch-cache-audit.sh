#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

violations=$(grep -RIn --include='*.tsx' --include='*.ts' -E 'fetch\(' app components \
  | grep -Ev "cache: ['\"]no-store['\"]" || true)

if [[ -n "$violations" ]]; then
  printf 'Client fetch cache-policy audit failed; every app/component fetch must declare cache: no-store:\n%s\n' "$violations" >&2
  exit 1
fi

printf 'Client fetch cache-policy audit passed: every app/component fetch declares no-store\n'
