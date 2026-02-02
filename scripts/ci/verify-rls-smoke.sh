#!/bin/bash
# RLS Smoke Test Script for Anamnesis Tables
# Epic: E75.7 — Contract + Docs + Check Alignment
# Purpose: Minimal smoke test to verify RLS policies are active and functioning

# Note: Not using set -e to allow all checks to run even if some fail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔒 Anamnesis RLS Smoke Test"
echo "============================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

function pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((PASS_COUNT++))
}

function fail() {
  echo -e "${RED}❌ FAIL (violates $1)${NC}: $2"
  ((FAIL_COUNT++))
}

function warn() {
  echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

function info() {
  echo "ℹ️  $1"
}

# Check if test SQL script exists
TEST_SQL="$REPO_ROOT/test/e75-1-anamnesis-rls-tests.sql"

if [ ! -f "$TEST_SQL" ]; then
  fail "R-E75.7-1" "RLS test script not found: $TEST_SQL"
  exit 1
fi

info "Found RLS test script: $TEST_SQL"
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
  warn "Supabase CLI not found - skipping database tests"
  warn "Install: npm install -g supabase"
  echo ""
  info "Running static checks only..."
  echo ""
else
  info "Supabase CLI found"
  echo ""
  
  # Check if Supabase is running
  if supabase status &> /dev/null; then
    info "Supabase is running - executing RLS tests"
    echo ""
    
    # Run the RLS test script
    if supabase db execute < "$TEST_SQL" 2>&1 | tee /tmp/rls-test-output.txt; then
      # Check output for failures
      if grep -q "FAIL" /tmp/rls-test-output.txt; then
        fail "R-E75.7-2" "RLS tests reported failures (see output above)"
      else
        pass "RLS tests executed successfully (R-E75.7-2)"
      fi
    else
      fail "R-E75.7-2" "RLS test script failed to execute"
    fi
    echo ""
  else
    warn "Supabase is not running - skipping database tests"
    warn "Start with: supabase start"
    echo ""
  fi
fi

# Static checks - verify migration file exists and contains required policies
info "Running static checks on migration file..."
echo ""

MIGRATION_FILE="$REPO_ROOT/supabase/migrations/20260202074325_e75_1_create_anamnesis_tables.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  fail "R-E75.7-3" "Migration file not found: $MIGRATION_FILE"
else
  info "Found migration file: $MIGRATION_FILE"
  
  # Check for RLS enablement
  if grep -q "ALTER TABLE.*anamnesis_entries.*ENABLE ROW LEVEL SECURITY" "$MIGRATION_FILE"; then
    pass "Migration enables RLS on anamnesis_entries (R-E75.7-3)"
  else
    fail "R-E75.7-3" "Migration does not enable RLS on anamnesis_entries"
  fi
  
  if grep -q "ALTER TABLE.*anamnesis_entry_versions.*ENABLE ROW LEVEL SECURITY" "$MIGRATION_FILE"; then
    pass "Migration enables RLS on anamnesis_entry_versions (R-E75.7-3)"
  else
    fail "R-E75.7-3" "Migration does not enable RLS on anamnesis_entry_versions"
  fi
  
  # Count policies (should be 11 total)
  POLICY_COUNT=$(grep -c "CREATE POLICY" "$MIGRATION_FILE" || true)
  if [ "$POLICY_COUNT" -eq 11 ]; then
    pass "Migration contains 11 RLS policies (R-E75.7-4)"
  else
    fail "R-E75.7-4" "Expected 11 RLS policies, found $POLICY_COUNT"
  fi
  
  # Check for patient policies (R-E75.1-1, R-E75.1-2, R-E75.1-3)
  if grep -q "Patients can view own anamnesis entries" "$MIGRATION_FILE"; then
    pass "Patient SELECT policy exists (R-E75.1-1)"
  else
    fail "R-E75.1-1" "Patient SELECT policy not found"
  fi
  
  if grep -q "Patients can insert own anamnesis entries" "$MIGRATION_FILE"; then
    pass "Patient INSERT policy exists (R-E75.1-2)"
  else
    fail "R-E75.1-2" "Patient INSERT policy not found"
  fi
  
  if grep -q "Patients can update own anamnesis entries" "$MIGRATION_FILE"; then
    pass "Patient UPDATE policy exists (R-E75.1-3)"
  else
    fail "R-E75.1-3" "Patient UPDATE policy not found"
  fi
  
  # Check for clinician policies (R-E75.1-4, R-E75.1-5, R-E75.1-6)
  if grep -q "Clinicians can view assigned patient anamnesis entries" "$MIGRATION_FILE"; then
    pass "Clinician SELECT policy exists (R-E75.1-4)"
  else
    fail "R-E75.1-4" "Clinician SELECT policy not found"
  fi
  
  if grep -q "Clinicians can insert anamnesis entries for assigned patients" "$MIGRATION_FILE"; then
    pass "Clinician INSERT policy exists (R-E75.1-5)"
  else
    fail "R-E75.1-5" "Clinician INSERT policy not found"
  fi
  
  if grep -q "Clinicians can update anamnesis entries for assigned patients" "$MIGRATION_FILE"; then
    pass "Clinician UPDATE policy exists (R-E75.1-6)"
  else
    fail "R-E75.1-6" "Clinician UPDATE policy not found"
  fi
  
  # Check for admin policies (R-E75.1-7, R-E75.1-8)
  if grep -q "Admins can view.*anamnesis entries" "$MIGRATION_FILE"; then
    pass "Admin SELECT policy exists (R-E75.1-7)"
  else
    fail "R-E75.1-7" "Admin SELECT policy not found"
  fi
  
  if grep -q "Admins can manage.*anamnesis entries" "$MIGRATION_FILE"; then
    pass "Admin ALL policy exists (R-E75.1-8)"
  else
    fail "R-E75.1-8" "Admin ALL policy not found"
  fi
fi

echo ""
info "Checking for version immutability (R-E75.1-16)..."
# Version table should have NO UPDATE or DELETE policies
if grep -q "anamnesis_entry_versions.*FOR UPDATE" "$MIGRATION_FILE"; then
  fail "R-E75.1-16" "Version table has UPDATE policy (should be immutable)"
else
  pass "Version table has no UPDATE policy (R-E75.1-16)"
fi

if grep -q "anamnesis_entry_versions.*FOR DELETE" "$MIGRATION_FILE"; then
  fail "R-E75.1-16" "Version table has DELETE policy (should be immutable)"
else
  pass "Version table has no DELETE policy (R-E75.1-16)"
fi

echo ""
echo "============================"
echo "📊 Test Summary"
echo "============================"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ All RLS smoke tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
  exit 1
fi
