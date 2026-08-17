#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if NODE_ENV=production DATABASE_URL='file:./dev.db' SESSION_SECRET='short' BILLING_WEBHOOK_SECRET='short' APP_URL='http://localhost:3000' PAYMENT_PROVIDER='stripe' node "$ROOT_DIR/scripts/verify-production-config.mjs" >/tmp/saas-production-config-invalid.log 2>&1; then
  echo 'Expected invalid production configuration to fail' >&2
  exit 1
fi
grep -q 'PostgreSQL' /tmp/saas-production-config-invalid.log

NODE_ENV=production \
DATABASE_URL='postgresql://centralia:secret@example.com:5432/centralia?sslmode=require' \
SESSION_SECRET='01234567890123456789012345678901' \
BILLING_WEBHOOK_SECRET='12345678901234567890123456789012' \
APP_URL='https://saas.example.com' \
PAYMENT_PROVIDER='stripe' \
STRIPE_SECRET_KEY='sk_test_placeholder_for_smoke' \
STRIPE_WEBHOOK_SECRET='whsec_placeholder_for_smoke' \
node "$ROOT_DIR/scripts/verify-production-config.mjs" >/tmp/saas-production-config-valid.log
grep -q 'check passed' /tmp/saas-production-config-valid.log

echo 'Production configuration smoke test passed'
