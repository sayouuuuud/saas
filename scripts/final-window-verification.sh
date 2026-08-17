#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WINDOW_FILE="$ROOT_DIR/execution-window-current.json"
if [[ ! -f "$WINDOW_FILE" ]]; then
  WINDOW_FILE="$ROOT_DIR/execution-window.json"
fi
REPORT_FILE="$ROOT_DIR/final-window-verification.log"
REQUIRED_EPOCH="$(sed -n 's/.*"required_completion_epoch": \([0-9]*\).*/\1/p' "$WINDOW_FILE")"
START_EPOCH="$(sed -n 's/.*"started_at_epoch": \([0-9]*\).*/\1/p' "$WINDOW_FILE")"
REQUIRED_DURATION="$(sed -n 's/.*"required_duration_seconds": \([0-9]*\).*/\1/p' "$WINDOW_FILE")"
while [ "$(date -u +%s)" -lt "$REQUIRED_EPOCH" ]; do
  sleep 60
done
{
  printf 'final_verification_started_at=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  printf 'system_epoch=%s\n' "$(date -u +%s)"
  printf 'required_epoch=%s\n' "$REQUIRED_EPOCH"
  observed_epoch="$(date -u +%s)"
  elapsed_seconds=$((observed_epoch - START_EPOCH))
  printf 'observed_elapsed_seconds=%s\n' "$elapsed_seconds"
  if (( observed_epoch < REQUIRED_EPOCH || elapsed_seconds < REQUIRED_DURATION )); then
    printf 'duration_gate=false\n'
    exit 1
  fi
  printf 'duration_gate=true\n'
  cd "$ROOT_DIR"
  printf 'tested_git_revision=%s\n' "$(git rev-parse HEAD)"
  printf 'tested_git_branch=%s\n' "$(git branch --show-current)"
  if [[ -n "$(git status --porcelain)" ]]; then
    printf 'repository_clean=false\n'
    git status --short
    exit 1
  fi
  printf 'repository_clean=true\n'
  DATABASE_URL="${DATABASE_URL:-file:./dev.db}" PAYMENT_PROVIDER="${PAYMENT_PROVIDER:-mock}" pnpm test:regression-matrix
  pnpm test:canonical-production
  if [[ -n "$(git status --porcelain)" ]]; then
    printf 'repository_clean_after_tests=false\n'
    git status --short
    exit 1
  fi
  printf 'repository_clean_after_tests=true\n'
  WINDOW_TMP="${WINDOW_FILE}.tmp"
  sed 's/"status": "active"/"status": "window_complete"/' "$WINDOW_FILE" > "$WINDOW_TMP"
  mv "$WINDOW_TMP" "$WINDOW_FILE"
  git add "$WINDOW_FILE"
  git commit -m "chore: close exact execution window"
  for push_attempt in 1 2 3; do
    if git push origin "$(git branch --show-current)"; then
      break
    fi
    if (( push_attempt == 3 )); then
      printf 'completion_push=false\n'
      exit 1
    fi
    sleep 2
  done
  printf 'completion_push=true\n'
  printf 'execution_window_status=window_complete\n'
  printf 'canonical_production_smoke=passed\n'
  printf 'completion_git_revision=%s\n' "$(git rev-parse HEAD)"
  if [[ -n "$(git status --porcelain)" ]]; then
    printf 'repository_clean_at_completion=false\n'
    git status --short
    exit 1
  fi
  printf 'repository_clean_at_completion=true\n'
  printf 'final_verification_status=passed\n'
  printf 'final_verification_finished_at=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
} > "$REPORT_FILE" 2>&1
