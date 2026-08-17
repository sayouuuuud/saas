#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WINDOW_FILE="$ROOT_DIR/execution-window.json"
REPORT_FILE="$ROOT_DIR/final-window-verification.log"
REQUIRED_EPOCH="$(sed -n 's/.*"required_completion_epoch": \([0-9]*\).*/\1/p' "$WINDOW_FILE")"
while [ "$(date -u +%s)" -lt "$REQUIRED_EPOCH" ]; do
  sleep 60
done
{
  printf 'final_verification_started_at=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  printf 'system_epoch=%s\n' "$(date -u +%s)"
  printf 'required_epoch=%s\n' "$REQUIRED_EPOCH"
  cd "$ROOT_DIR"
  pnpm db:validate
  DATABASE_URL='postgresql://centralia:centralia@localhost:5432/centralia' pnpm db:validate:postgres
  pnpm lint
  pnpm exec tsc --noEmit
  pnpm build
  pnpm test:api
  pnpm test:security
  pnpm test:auth
  pnpm test:edge
  pnpm test:tenant
  pnpm test:subscription
  pnpm test:production-config
  pnpm test:final-window-status
  pnpm test:auth-boundaries
  pnpm test:lms-independence
  pnpm test:collection-bounds
  pnpm audit --prod
  WINDOW_TMP="${WINDOW_FILE}.tmp"
  sed 's/"status": "active"/"status": "window_complete"/' "$WINDOW_FILE" > "$WINDOW_TMP"
  mv "$WINDOW_TMP" "$WINDOW_FILE"
  printf 'execution_window_status=window_complete\n'
  printf 'final_verification_status=passed\n'
  printf 'final_verification_finished_at=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
} > "$REPORT_FILE" 2>&1
