#!/usr/bin/env bash
# Guard rail that prevents accidental edits to existing Supabase migrations.
# By default the script inspects staged changes. In CI you can provide
#   --base-ref origin/main
# to compare against the merge base.
set -euo pipefail

ALLOW_OVERRIDE=${ALLOW_MIGRATION_EDITS:-0}
if [[ "$ALLOW_OVERRIDE" == "1" ]]; then
  echo "ALLOW_MIGRATION_EDITS=1 set – skipping migration immutability check"
  exit 0
fi

MODE="staged"
BASE_REF=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-ref)
      MODE="base"
      BASE_REF=${2:-}
      shift 2
      ;;
    --help|-h)
      cat <<'EOF'
Usage: check-migrations.sh [--base-ref <git-ref>]

Without arguments the script evaluates staged migration changes and fails
if an existing file was modified. When --base-ref is provided, the script
compares the working tree against the given ref (useful in CI).
Set ALLOW_MIGRATION_EDITS=1 to bypass the guard for exceptional cases.
EOF
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
 done

if [[ "$MODE" == "base" ]]; then
  BASE_REF=${BASE_REF:-origin/main}
  if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
    echo "Base ref '$BASE_REF' not found. Run 'git fetch origin main' or pass an existing ref." >&2
    exit 1
  fi
  DIFF_OUTPUT=$(git diff --name-status "${BASE_REF}...HEAD" -- supabase/migrations/*.sql || true)
else
  DIFF_OUTPUT=$(git diff --cached --name-status -- supabase/migrations/*.sql || true)
fi

if [[ -z "${DIFF_OUTPUT//[[:space:]]/}" ]]; then
  echo "No migration changes detected."
  exit 0
fi

mapfile -t LINES <<<"$DIFF_OUTPUT"
VIOLATIONS=()

for entry in "${LINES[@]}"; do
  [[ -z "$entry" ]] && continue
  status=${entry%%$'\t'*}
  file=${entry#*$'\t'}
  # git can emit status like 'A' or 'R100'; treat everything that does not start with A as a violation
  if [[ $status != A* ]]; then
    VIOLATIONS+=("$file")
  fi
 done

if ((${#VIOLATIONS[@]} > 0)); then
  echo "\nERROR: Existing migration files were modified:"
  for file in "${VIOLATIONS[@]}"; do
    echo "  - $file"
  done
  cat <<'EOM'

Create a new timestamped migration instead of editing old ones.
If the change is intentional (e.g., hotfix) rerun with ALLOW_MIGRATION_EDITS=1.
EOM
  exit 2
fi

echo "OK: All migration changes are additions."