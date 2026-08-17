#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"
SERVER_PID=""
cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill -TERM -- -"$SERVER_PID" 2>/dev/null || kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$ROOT_DIR/tsconfig.tsbuildinfo"
  git checkout -- next-env.d.ts 2>/dev/null || true
}
trap cleanup EXIT

# Keep the matrix reproducible after a clean checkout; callers can still override this.
export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"
export PAYMENT_PROVIDER="${PAYMENT_PROVIDER:-mock}"
pnpm db:validate
DATABASE_URL='postgresql://centralia:centralia@localhost:5432/centralia' pnpm db:validate:postgres
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm db:migrate
pnpm db:seed
setsid env NODE_ENV=development pnpm dev > /tmp/centralia-regression-server.log 2>&1 &
SERVER_PID=$!
for _ in $(seq 1 30); do
  if curl -fsS http://localhost:3000/ >/dev/null 2>&1; then break; fi
  sleep 1
done
if ! curl -fsS http://localhost:3000/ >/dev/null 2>&1; then
  cat /tmp/centralia-regression-server.log >&2
  exit 1
fi
pnpm test:api
pnpm test:public-pages
pnpm test:plans-degraded
pnpm test:security
pnpm test:auth
pnpm test:edge
pnpm test:tenant
pnpm test:subscription
pnpm test:subscription-page
pnpm test:account-pages
pnpm test:client-fetch-cache
pnpm test:admin-pages
pnpm test:admin-error-boundary
pnpm test:production-config
pnpm test:final-window-status
pnpm test:auth-boundaries
pnpm test:lms-independence
pnpm test:collection-bounds
pnpm audit --prod

echo "Centralia full regression matrix passed"
