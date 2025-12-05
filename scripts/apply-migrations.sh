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
shopt -s nullglob
for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "-> applying $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
shopt -u nullglob

echo "All migrations applied."
