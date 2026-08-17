#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ERROR_FILE="$ROOT_DIR/app/admin/error.tsx"

[[ -f "$ERROR_FILE" ]] || { echo "admin error boundary is missing" >&2; exit 1; }
grep -q "^'use client'" "$ERROR_FILE"
grep -q 'reset: () => void' "$ERROR_FILE"
grep -q 'role="alert"' "$ERROR_FILE"
grep -q 'onClick={() => reset()}' "$ERROR_FILE"
grep -q 'لم نعرض تفاصيل داخلية' "$ERROR_FILE"
if grep -qE 'error\.(message|stack)|JSON\.stringify\(error\)' "$ERROR_FILE"; then
  echo "admin error boundary exposes internal error details" >&2
  exit 1
fi

echo "Admin error-boundary audit passed"
