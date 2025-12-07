#!/bin/bash
# Test RLS Migration Syntax
# This script validates the SQL migration files for syntax errors

set -e

echo "🔍 Validating RLS Migration Syntax..."
echo ""

# Check if migration files exist
MIGRATION_FILE="supabase/migrations/20251207094000_enable_comprehensive_rls.sql"
TEST_FILE="supabase/migrations/20251207094100_rls_tests.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

if [ ! -f "$TEST_FILE" ]; then
    echo "❌ Test file not found: $TEST_FILE"
    exit 1
fi

echo "✅ Migration files found"
echo ""

# Basic syntax checks
echo "📝 Running basic syntax checks..."

# Check for unclosed BEGIN/COMMIT blocks
begin_count=$(grep -c "^BEGIN;" "$MIGRATION_FILE" || echo "0")
commit_count=$(grep -c "^COMMIT;" "$MIGRATION_FILE" || echo "0")

if [ "$begin_count" -ne "$commit_count" ]; then
    echo "⚠️  Warning: BEGIN ($begin_count) and COMMIT ($commit_count) count mismatch"
else
    echo "✅ BEGIN/COMMIT blocks balanced"
fi

# Check for common SQL syntax issues
echo ""
echo "🔍 Checking for common SQL issues..."

# Check for missing semicolons at function ends
if grep -q "END\s*\$\$\s*[^;]" "$MIGRATION_FILE"; then
    echo "⚠️  Warning: Possible missing semicolons after function definitions"
else
    echo "✅ Function definitions look correct"
fi

# Check for proper policy syntax
policy_count=$(grep -c "CREATE POLICY" "$MIGRATION_FILE" || echo "0")
echo "✅ Found $policy_count CREATE POLICY statements"

# Check for proper function syntax
function_count=$(grep -c "CREATE OR REPLACE FUNCTION" "$MIGRATION_FILE" || echo "0")
echo "✅ Found $function_count CREATE OR REPLACE FUNCTION statements"

# Check for RLS enablement
rls_count=$(grep -c "ENABLE ROW LEVEL SECURITY" "$MIGRATION_FILE" || echo "0")
echo "✅ Found $rls_count ENABLE ROW LEVEL SECURITY statements"

# List all created policies
echo ""
echo "📋 RLS Policies to be created:"
grep "CREATE POLICY" "$MIGRATION_FILE" | sed 's/CREATE POLICY "/  - /' | sed 's/" ON.*//'

# List all helper functions
echo ""
echo "⚙️  Helper functions to be created:"
grep "CREATE OR REPLACE FUNCTION" "$MIGRATION_FILE" | sed 's/CREATE OR REPLACE FUNCTION /  - /' | sed 's/($//'

echo ""
echo "✅ Basic validation complete!"
echo ""
echo "⚠️  Note: Full validation requires PostgreSQL/Supabase database"
echo "   Run migrations with: supabase db reset"
echo ""
