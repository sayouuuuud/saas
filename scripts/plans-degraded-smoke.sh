#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-$((41000 + ($$ % 1000)))}"
BASE_URL="http://127.0.0.1:${PORT}"
DB_PATH="${TMPDIR:-/tmp}/centralia-plans-degraded-${$}.db"
LOG_PATH="${TMPDIR:-/tmp}/centralia-plans-degraded-${$}.log"
HEADERS_PATH="${TMPDIR:-/tmp}/centralia-plans-degraded-${$}.headers"
BODY_PATH="${TMPDIR:-/tmp}/centralia-plans-degraded-${$}.body"

rm -f "$DB_PATH" "$LOG_PATH" "$HEADERS_PATH" "$BODY_PATH"
DATABASE_URL="file:${DB_PATH}" pnpm exec next start -H 127.0.0.1 -p "$PORT" >"$LOG_PATH" 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  rm -f "$DB_PATH" "$LOG_PATH" "$HEADERS_PATH" "$BODY_PATH"
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 60); do
  if curl -fsS "$BASE_URL/" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  cat "$LOG_PATH"
  exit 1
fi

curl -sS -D "$HEADERS_PATH" -o "$BODY_PATH" -H "x-test-client: plans-degraded-smoke" "$BASE_URL/api/plans"
grep -q '^HTTP/1.1 200' "$HEADERS_PATH"
grep -Eiq '^cache-control: no-store' "$HEADERS_PATH"
grep -Eiq '^retry-after: 60' "$HEADERS_PATH"
grep -Eiq '^x-centralia-degraded: plans-database-unavailable' "$HEADERS_PATH"
grep -q '"plans":\[\]' "$BODY_PATH"
grep -q '"degraded":true' "$BODY_PATH"
printf 'Plans degraded smoke test passed on port %s\n' "$PORT"
