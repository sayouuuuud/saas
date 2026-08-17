#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
mkdir -p "$TMP_DIR/scripts" "$TMP_DIR/bin"
cp "$ROOT_DIR/scripts/final-window-verification.sh" "$TMP_DIR/scripts/final-window-verification.sh"
printf '{\n  "started_at_epoch": 1,\n  "required_duration_seconds": 43200,\n  "required_completion_epoch": 1,\n  "status": "active"\n}\n' > "$TMP_DIR/execution-window.json"
ln -s "$(type -P true)" "$TMP_DIR/bin/pnpm"
cat > "$TMP_DIR/bin/git" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  "rev-parse HEAD") printf 'test-revision\n' ;;
  "branch --show-current") printf 'main\n' ;;
  "status --porcelain") ;;
  *) printf 'unexpected git args: %s\n' "$*" >&2; exit 1 ;;
esac
EOF
chmod +x "$TMP_DIR/bin/git"
PATH="$TMP_DIR/bin:$PATH" bash "$TMP_DIR/scripts/final-window-verification.sh"
test "$(sed -n 's/.*"status": "\([^"]*\)".*/\1/p' "$TMP_DIR/execution-window.json")" = "window_complete"
grep -q '^tested_git_revision=test-revision$' "$TMP_DIR/final-window-verification.log"
grep -q '^tested_git_branch=main$' "$TMP_DIR/final-window-verification.log"
grep -q '^observed_elapsed_seconds=' "$TMP_DIR/final-window-verification.log"
grep -q '^duration_gate=true$' "$TMP_DIR/final-window-verification.log"
grep -q '^repository_clean=true$' "$TMP_DIR/final-window-verification.log"
grep -q '^repository_clean_after_tests=true$' "$TMP_DIR/final-window-verification.log"
grep -q '^canonical_production_smoke=passed$' "$TMP_DIR/final-window-verification.log"
grep -q '^execution_window_status=window_complete$' "$TMP_DIR/final-window-verification.log"
grep -q '^final_verification_status=passed$' "$TMP_DIR/final-window-verification.log"
printf 'Final-window status smoke test passed\n'
