#!/usr/bin/env bash
# Script: apply SQL migrations in lexicographic order against $DATABASE_URL
# Expects: psql installed and DATABASE_URL set, migrations/ directory with *.sql files
set -euo pipefail

MIGRATIONS_DIR="${MIGRATIONS_DIR:-migrations}"

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
