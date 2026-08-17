#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"
trap 'rm -f "$ROOT_DIR/tsconfig.tsbuildinfo"' EXIT

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

echo "Centralia full regression matrix passed"
