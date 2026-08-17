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
  pnpm test:regression-matrix
  pnpm test:canonical-production
  WINDOW_TMP="${WINDOW_FILE}.tmp"
  sed 's/"status": "active"/"status": "window_complete"/' "$WINDOW_FILE" > "$WINDOW_TMP"
  mv "$WINDOW_TMP" "$WINDOW_FILE"
  printf 'execution_window_status=window_complete\n'
  printf 'canonical_production_smoke=passed\n'
  printf 'final_verification_status=passed\n'
  printf 'final_verification_finished_at=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
} > "$REPORT_FILE" 2>&1
