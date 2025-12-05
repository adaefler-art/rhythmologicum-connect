#!/usr/bin/env bash
# Verifies that applying migrations to a fresh Postgres results in schema identical to schema/schema.sql
# Intended to run in CI where a Postgres test instance is available and psql/pg_dump installed.
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL must be set"
  exit 1
fi

# Apply migrations
./scripts/apply-migrations.sh

# Generate schema dump from the DB
./scripts/generate-schema.sh

# Compare the generated schema to the committed one
TMP_GEN="$(mktemp)"
pg_dump --schema-only --no-owner --no-privileges --dbname="$DATABASE_URL" > "$TMP_GEN"
sed -E '/^SET search_path/d' "$TMP_GEN" | sed -E '/^-- Dumped by pg_dump/d' | sed '/^$/N;/^\n$/D' > "${TMP_GEN}.norm"

# Compare normalized dump with committed file
if ! diff -u schema/schema.sql "${TMP_GEN}.norm"; then
  echo "ERROR: Schema mismatch! The applied migrations produce a different schema than schema/schema.sql."
  echo "Please run './scripts/generate-schema.sh' locally after running migrations, review, and commit the updated schema/schema.sql."
  rm -f "$TMP_GEN" "${TMP_GEN}.norm"
  exit 2
fi

rm -f "$TMP_GEN" "${TMP_GEN}.norm"
echo "OK: schema/schema.sql matches migrations result."
