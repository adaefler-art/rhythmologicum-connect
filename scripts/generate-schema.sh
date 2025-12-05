#!/usr/bin/env bash
# Creates a normalized schema dump at schema/schema.sql
# Requires: pg_dump available and DATABASE_URL set
set -euo pipefail

OUT_DIR="schema"
OUT_FILE="$OUT_DIR/schema.sql"
TMP_FILE="$(mktemp)"

mkdir -p "$OUT_DIR"

# Produce schema-only dump, remove owner/privileges to make it comparable across environments
# Use options to reduce environment-dependent lines
pg_dump --schema-only --no-owner --no-privileges --dbname="$DATABASE_URL" > "$TMP_FILE"

# Optional normalization:
# - remove SEARCH_PATH lines that can differ
# - collapse multiple blank lines
# - remove comment lines with dump timestamps
sed -E '/^SET search_path/d' "$TMP_FILE" \
  | sed -E '/^-- Dumped by pg_dump/d' \
  | sed '/^$/N;/^\n$/D' \
  > "$OUT_FILE"

rm "$TMP_FILE"

echo "Wrote normalized schema to $OUT_FILE"
