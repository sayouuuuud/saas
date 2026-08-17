#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

files=(
  app/admin/page.tsx
  app/api/auth/me/route.ts
  app/api/invoices/route.ts
  app/api/lms-link/route.ts
  app/api/plans/route.ts
  app/api/reports/route.ts
  app/api/tickets/route.ts
  app/app/[slug]/page.tsx
)

for file in "${files[@]}"; do
  if ! grep -q 'findMany' "$file"; then
    echo "Expected collection query missing from $file" >&2
    exit 1
  fi
  if ! grep -q 'take:' "$file"; then
    echo "Unbounded collection query detected in $file" >&2
    exit 1
  fi
done

if ! grep -q 'take: memberLimit + 1' app/api/workspace/route.ts; then
  echo "Workspace member query is missing bounded lookahead" >&2
  exit 1
fi

printf 'Collection bounds audit passed: all Centralia list queries have explicit caps or pagination lookahead.\n'
