#!/usr/bin/env bash
# Lints only NEW Supabase migration files for basic idempotency guard rails.
# Intended for CI: compare against a base ref and scan added migrations.
set -euo pipefail

BASE_REF=${1:-}
if [[ -z "$BASE_REF" ]]; then
  BASE_REF="origin/main"
fi

if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  echo "Base ref '$BASE_REF' not found. Run 'git fetch origin main' or pass an existing ref." >&2
  exit 1
fi

MERGE_BASE=$(git merge-base "$BASE_REF" HEAD)

# Only scan new migrations.
mapfile -t NEW_MIGRATIONS < <(git diff --name-status "$MERGE_BASE...HEAD" -- supabase/migrations/*.sql | awk '$1 ~ /^A/ {print $2}')

if ((${#NEW_MIGRATIONS[@]} == 0)); then
  echo "No new migrations added; idempotency lint skipped."
  exit 0
fi

echo "Scanning new migrations for idempotency patterns (merge-base: $MERGE_BASE)"

fail=0
for file in "${NEW_MIGRATIONS[@]}"; do
  [[ -f "$file" ]] || continue

  # Ignore commented lines for simple create checks.
  if grep -Pqi '^(?!\s*--)\s*create\s+table(?!\s+if\s+not\s+exists)\b' "$file" 2>/dev/null; then
    echo "ERROR: $file contains CREATE TABLE without IF NOT EXISTS"
    fail=1
  fi

  if grep -Pqi '^(?!\s*--)\s*create\s+index(?!\s+if\s+not\s+exists)\b' "$file" 2>/dev/null; then
    echo "ERROR: $file contains CREATE INDEX without IF NOT EXISTS"
    fail=1
  fi

  if grep -Pqi '^(?!\s*--)\s*create\s+type\b' "$file" 2>/dev/null; then
    if ! grep -Eqi '(duplicate_object|pg_type|information_schema\.types)' "$file"; then
      echo "ERROR: $file contains CREATE TYPE without an existence guard (pg_type check or duplicate_object handler)"
      fail=1
    fi
  fi

  if grep -Pqi '\badd\s+constraint\b' "$file" 2>/dev/null; then
    if ! grep -Eqi '(drop[[:space:]]+constraint[[:space:]]+if[[:space:]]+exists|information_schema\.table_constraints|pg_constraint)' "$file"; then
      echo "ERROR: $file adds a CONSTRAINT without a guard (DROP CONSTRAINT IF EXISTS or catalog check)"
      fail=1
    fi
  fi

  if grep -Pqi '^(?!\s*--)\s*create\s+policy\b' "$file" 2>/dev/null; then
    if ! grep -Eqi '(drop[[:space:]]+policy[[:space:]]+if[[:space:]]+exists|pg_policies)' "$file"; then
      echo "ERROR: $file creates an RLS POLICY without a guard (DROP POLICY IF EXISTS or pg_policies check)"
      fail=1
    fi
  fi

done

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo "Idempotency lint failed for one or more new migrations."
  echo "Fix by using IF NOT EXISTS, DROP ... IF EXISTS, or guarded DO $$ blocks."
  exit 2
fi

echo "OK: New migrations look rerunnable (basic lint)."
