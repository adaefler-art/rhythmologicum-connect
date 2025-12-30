#!/usr/bin/env bash
# Verify DB determinism: migrations apply cleanly, no drift, types are up to date
# This script is used in CI to enforce migration-first discipline
set -euo pipefail

echo "🔍 Starting DB determinism verification..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "   See: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

# 1. Reset database and apply all migrations
echo "📦 Resetting database and applying migrations..."
if ! supabase db reset --debug; then
    echo "❌ Database reset failed"
    exit 1
fi
echo "✅ Migrations applied successfully"

# 2. Check for schema drift
echo "🔍 Checking for schema drift..."
if ! supabase db diff --exit-code; then
    echo "❌ Schema drift detected!"
    echo "   This means there are manual changes in the database not captured in migrations."
    echo "   Fix: Create a migration to capture these changes."
    exit 1
fi
echo "✅ No schema drift detected"

# 3. Generate types and check if they're up to date
echo "🔧 Generating TypeScript types..."
TYPES_FILE="lib/types/supabase.ts"

# Generate types
if ! supabase gen types typescript --local > "$TYPES_FILE"; then
    echo "❌ Type generation failed"
    exit 1
fi
echo "✅ Types generated successfully"

# 4. Check if generated types match committed version
echo "🔍 Checking if types are up to date..."
if ! git diff --exit-code "$TYPES_FILE"; then
    echo "❌ Generated types differ from committed version!"
    echo "   This means the database schema changed but types weren't regenerated."
    echo "   Fix: Run 'npm run db:typegen' and commit the changes."
    exit 1
fi
echo "✅ Types are up to date"

echo ""
echo "🎉 All DB determinism checks passed!"
echo "   ✓ Migrations apply cleanly"
echo "   ✓ No schema drift"
echo "   ✓ Types are up to date"
exit 0
