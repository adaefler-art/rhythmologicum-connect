#!/usr/bin/env bash
# Pull schema from Supabase/Postgres and write normalized schema/schema.sql
# Usage: export SUPABASE_DB_URL=postgresql://... ; ./scripts/pull-supabase-schema.sh
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"
if [ -z \"$DB_URL\" ]; then
  echo \"SUPABASE_DB_URL or DATABASE_URL must be set\"
  exit 1
fi

OUT_DIR=\"schema\"
OUT_FILE=\"$OUT_DIR/schema.sql\"
TMP_FILE=\"$(mktemp)\"

mkdir -p \"$OUT_DIR\"

# Dump schema-only and remove owner/privileges to reduce env-dependent lines
pg_dump --schema-only --no-owner --no-privileges --dbname=\"$DB_URL\" > \"$TMP_FILE\"

# Normalize: remove search_path, dump header timestamps, collapse blank lines
sed -E '/^SET search_path/d' \"$TMP_FILE\" \
  | sed -E '/^-- Dumped by pg_dump/d' \
  | sed '/^$/N;/^\\n$/D' \
  > \"$OUT_FILE\"

rm -f \"$TMP_FILE\"

echo \"Wrote normalized schema to $OUT_FILE\"