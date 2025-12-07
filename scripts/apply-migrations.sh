#!/usr/bin/env bash
# Script: apply SQL migrations in lexicographic order against $DATABASE_URL
# Expects: psql installed and DATABASE_URL set, migrations directory with *.sql files
set -euo pipefail

DEFAULT_SUPABASE_DIR="supabase/migrations"
FALLBACK_DIR="migrations"

if [ -z "${MIGRATIONS_DIR:-}" ]; then
  if [ -d "$DEFAULT_SUPABASE_DIR" ]; then
    MIGRATIONS_DIR="$DEFAULT_SUPABASE_DIR"
  elif [ -d "$FALLBACK_DIR" ]; then
    MIGRATIONS_DIR="$FALLBACK_DIR"
  else
    echo "No migrations directory found (checked '$DEFAULT_SUPABASE_DIR' and '$FALLBACK_DIR')."
    exit 1
  fi
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migrations directory '$MIGRATIONS_DIR' not found"
  exit 1
fi

echo "Applying migrations from $MIGRATIONS_DIR to $DATABASE_URL"

# Run each .sql file in sorted order; stop on first error
for f in "$MIGRATIONS_DIR"/*.sql; do
  # Check if the glob matched any files
  if [ ! -e "$f" ]; then
    echo "No .sql files found in $MIGRATIONS_DIR"
    exit 0
  fi
  echo "-> applying $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo "All migrations applied."
