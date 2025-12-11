#!/usr/bin/env bash
# Check Migration Deployment Status
# This script helps verify that migrations are properly configured and deployed

set -euo pipefail

echo "=========================================="
echo "Migration Deployment Status Check"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "supabase/migrations" ]; then
  echo -e "${RED}✗ Error: supabase/migrations directory not found${NC}"
  echo "Please run this script from the project root"
  exit 1
fi

echo "1. Checking migration files..."
echo "--------------------------------"

# Count migrations
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "Total migrations: $MIGRATION_COUNT"

# Check for critical migrations
echo ""
echo "2. Checking critical migrations..."
echo "-----------------------------------"

check_migration() {
  local filename="$1"
  local description="$2"
  
  if [ -f "supabase/migrations/$filename" ]; then
    echo -e "${GREEN}✓${NC} $description"
    return 0
  else
    echo -e "${RED}✗${NC} $description - MISSING"
    return 1
  fi
}

ALL_PRESENT=true

check_migration "20251207150000_populate_stress_questions.sql" "Populate stress questions" || ALL_PRESENT=false
check_migration "20251211065000_fix_stress_funnel_slug.sql" "Fix funnel slug" || ALL_PRESENT=false
check_migration "20251211070000_seed_stress_funnel_base_pages.sql" "Seed content pages" || ALL_PRESENT=false

echo ""
echo "3. Checking GitHub workflow..."
echo "-------------------------------"

if [ -f ".github/workflows/apply-migrations.yml" ]; then
  echo -e "${GREEN}✓${NC} apply-migrations.yml workflow exists"
else
  echo -e "${RED}✗${NC} apply-migrations.yml workflow MISSING"
  ALL_PRESENT=false
fi

echo ""
echo "4. Migration order verification..."
echo "-----------------------------------"

# List the critical migrations in order
echo "Expected order:"
echo "  1. 20251207150000_populate_stress_questions.sql (creates 'stress')"
echo "  2. 20251211065000_fix_stress_funnel_slug.sql (changes to 'stress-assessment')"
echo "  3. 20251211070000_seed_stress_funnel_base_pages.sql (expects 'stress-assessment')"
echo ""

ACTUAL_ORDER=$(ls -1 supabase/migrations/ | grep -E "(20251207150000|20251211065000|20251211070000)")
echo "Actual order:"
echo "$ACTUAL_ORDER" | nl -w2 -s'. '

echo ""
echo "5. Checking required documentation..."
echo "--------------------------------------"

if [ -f "docs/DEPLOYMENT_MIGRATIONS.md" ]; then
  echo -e "${GREEN}✓${NC} DEPLOYMENT_MIGRATIONS.md exists"
else
  echo -e "${YELLOW}⚠${NC} DEPLOYMENT_MIGRATIONS.md not found"
fi

if [ -f "docs/F11_SEED_PAGES.md" ]; then
  echo -e "${GREEN}✓${NC} F11_SEED_PAGES.md exists"
else
  echo -e "${YELLOW}⚠${NC} F11_SEED_PAGES.md not found"
fi

echo ""
echo "=========================================="
if [ "$ALL_PRESENT" = true ]; then
  echo -e "${GREEN}✓ All critical files present${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Ensure GitHub secrets are set:"
  echo "   - SUPABASE_ACCESS_TOKEN"
  echo "   - SUPABASE_PROJECT_ID"
  echo ""
  echo "2. Trigger workflow manually:"
  echo "   GitHub → Actions → Apply Supabase migrations → Run workflow"
  echo ""
  echo "3. After deployment, verify with:"
  echo "   psql \$DATABASE_URL < scripts/verify-migrations.sql"
  echo ""
else
  echo -e "${RED}✗ Some critical files are missing${NC}"
  echo "Please review the errors above"
  exit 1
fi
echo "=========================================="
