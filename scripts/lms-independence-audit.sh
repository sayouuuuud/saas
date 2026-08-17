#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

scan_dirs=(app lib prisma scripts)
forbidden='LMS_DATABASE|DATABASE_URL_LMS|LMS_DB|lmsPrisma|lmsDb|lms/prisma|@lms/database|@lms/prisma'
if grep -RInE --exclude='lms-independence-audit.sh' "$forbidden" "${scan_dirs[@]}"; then
  echo "Forbidden LMS database-client/configuration identifier found" >&2
  exit 1
fi

runtime_clients=$(grep -RIl --include='*.ts' --include='*.tsx' --include='*.mjs' 'new PrismaClient' app lib prisma 2>/dev/null || true)
unexpected_clients=$(printf '%s\n' "$runtime_clients" | grep -v '^lib/prisma.ts$' | grep -v '^$' || true)
if [[ -n "$unexpected_clients" ]]; then
  echo "Runtime PrismaClient must remain centralized in lib/prisma.ts" >&2
  printf '%s\n' "$unexpected_clients" >&2
  exit 1
fi

printf 'LMS independence audit passed: SaaS-only Prisma boundary and forbidden LMS database identifiers are absent.\n'
