#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
mkdir -p "$TMP_DIR/scripts" "$TMP_DIR/bin"
cp "$ROOT_DIR/scripts/final-window-verification.sh" "$TMP_DIR/scripts/final-window-verification.sh"
printf '{\n  "started_at_epoch": 1,\n  "required_completion_epoch": 1,\n  "status": "active"\n}\n' > "$TMP_DIR/execution-window.json"
ln -s "$(type -P true)" "$TMP_DIR/bin/pnpm"
PATH="$TMP_DIR/bin:$PATH" bash "$TMP_DIR/scripts/final-window-verification.sh"
test "$(sed -n 's/.*"status": "\([^"]*\)".*/\1/p' "$TMP_DIR/execution-window.json")" = "window_complete"
grep -q '^execution_window_status=window_complete$' "$TMP_DIR/final-window-verification.log"
grep -q '^final_verification_status=passed$' "$TMP_DIR/final-window-verification.log"
printf 'Final-window status smoke test passed\n'
