#!/bin/bash
# E75.7 Documentation Verification Script
# Verifies that all anamnesis documentation exists and is properly aligned

# Note: Not using set -e to allow all checks to run even if some fail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCS_DIR="$REPO_ROOT/docs/anamnesis"

echo "📚 Anamnesis Documentation Verification (E75.7)"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

function info() {
  echo "ℹ️  $1"
}

# =============================================================================
# R-E75.7-1: SCHEMA_V1.md exists and documents entry types, required fields
# =============================================================================

info "Checking R-E75.7-1: SCHEMA_V1.md..."
SCHEMA_DOC="$DOCS_DIR/SCHEMA_V1.md"

if [ ! -f "$SCHEMA_DOC" ]; then
  fail "R-E75.7-1" "SCHEMA_V1.md not found at $SCHEMA_DOC"
else
  # Check for entry types section
  if grep -q "## Entry Types" "$SCHEMA_DOC" && \
     grep -q "medical_history" "$SCHEMA_DOC" && \
     grep -q "medications" "$SCHEMA_DOC" && \
     grep -q "allergies" "$SCHEMA_DOC"; then
    pass "SCHEMA_V1.md documents entry types (R-E75.7-1)"
  else
    fail "R-E75.7-1" "SCHEMA_V1.md missing entry types section"
  fi
  
  # Check for required fields section
  if grep -qi "required fields" "$SCHEMA_DOC" && \
     grep -q "patient_id" "$SCHEMA_DOC" && \
     grep -q "organization_id" "$SCHEMA_DOC" && \
     grep -q "title" "$SCHEMA_DOC"; then
    pass "SCHEMA_V1.md documents required fields (R-E75.7-1)"
  else
    fail "R-E75.7-1" "SCHEMA_V1.md missing required fields documentation"
  fi
fi

echo ""

# =============================================================================
# R-E75.7-2: API_V1.md exists and documents endpoints, status codes
# =============================================================================

info "Checking R-E75.7-2: API_V1.md..."
API_DOC="$DOCS_DIR/API_V1.md"

if [ ! -f "$API_DOC" ]; then
  fail "R-E75.7-2" "API_V1.md not found at $API_DOC"
else
  # Check for patient endpoints
  if grep -q "GET /api/patient/anamnesis" "$API_DOC" && \
     grep -q "POST /api/patient/anamnesis" "$API_DOC"; then
    pass "API_V1.md documents patient endpoints (R-E75.7-2)"
  else
    fail "R-E75.7-2" "API_V1.md missing patient endpoints"
  fi
  
  # Check for studio endpoints
  if grep -q "GET /api/studio/patients" "$API_DOC" && \
     grep -q "POST /api/studio/anamnesis" "$API_DOC"; then
    pass "API_V1.md documents studio endpoints (R-E75.7-2)"
  else
    fail "R-E75.7-2" "API_V1.md missing studio endpoints"
  fi
  
  # Check for status codes
  if grep -q "200" "$API_DOC" && \
     grep -q "201" "$API_DOC" && \
     grep -q "401" "$API_DOC" && \
     grep -q "403" "$API_DOC" && \
     grep -q "404" "$API_DOC" && \
     grep -q "409" "$API_DOC"; then
    pass "API_V1.md documents status codes (R-E75.7-2)"
  else
    fail "R-E75.7-2" "API_V1.md missing status code documentation"
  fi
fi

echo ""

# =============================================================================
# R-E75.7-3: SECURITY_MODEL.md exists and documents RLS, assignments
# =============================================================================

info "Checking R-E75.7-3: SECURITY_MODEL.md..."
SECURITY_DOC="$DOCS_DIR/SECURITY_MODEL.md"

if [ ! -f "$SECURITY_DOC" ]; then
  fail "R-E75.7-3" "SECURITY_MODEL.md not found at $SECURITY_DOC"
else
  # Check for RLS policies section
  if grep -q "Row Level Security" "$SECURITY_DOC" && \
     grep -q "RLS Policies" "$SECURITY_DOC"; then
    pass "SECURITY_MODEL.md documents RLS policies (R-E75.7-3)"
  else
    fail "R-E75.7-3" "SECURITY_MODEL.md missing RLS policies section"
  fi
  
  # Check for assignment documentation
  if grep -q "clinician_patient_assignments" "$SECURITY_DOC" && \
     grep -q "Assignment" "$SECURITY_DOC"; then
    pass "SECURITY_MODEL.md documents assignments (R-E75.7-3)"
  else
    fail "R-E75.7-3" "SECURITY_MODEL.md missing assignment documentation"
  fi
  
  # Check for all 11 policy rules
  POLICY_COUNT=$(grep -c "R-E75.1-[1-9]" "$SECURITY_DOC" || true)
  if [ "$POLICY_COUNT" -ge 11 ]; then
    pass "SECURITY_MODEL.md documents all RLS policy rules (R-E75.7-3)"
  else
    fail "R-E75.7-3" "SECURITY_MODEL.md only documents $POLICY_COUNT/11 RLS policy rules"
  fi
fi

echo ""

# =============================================================================
# R-E75.7-4: RLS smoke script exists and runs green
# =============================================================================

info "Checking R-E75.7-4: RLS smoke script..."
RLS_SMOKE_SCRIPT="$REPO_ROOT/scripts/ci/verify-rls-smoke.sh"

if [ ! -f "$RLS_SMOKE_SCRIPT" ]; then
  fail "R-E75.7-4" "RLS smoke script not found at $RLS_SMOKE_SCRIPT"
elif [ ! -x "$RLS_SMOKE_SCRIPT" ]; then
  fail "R-E75.7-4" "RLS smoke script is not executable"
else
  pass "RLS smoke script exists and is executable (R-E75.7-4)"
  
  # Try to run the script (will skip DB tests if Supabase not running)
  info "Running RLS smoke script..."
  if "$RLS_SMOKE_SCRIPT"; then
    pass "RLS smoke script runs green (R-E75.7-4)"
  else
    fail "R-E75.7-4" "RLS smoke script failed (see output above)"
  fi
fi

echo ""

# =============================================================================
# R-E75.7-5: RULES_VS_CHECKS_MATRIX.md exists
# =============================================================================

info "Checking R-E75.7-5: RULES_VS_CHECKS_MATRIX.md..."
MATRIX_DOC="$DOCS_DIR/RULES_VS_CHECKS_MATRIX.md"

if [ ! -f "$MATRIX_DOC" ]; then
  fail "R-E75.7-5" "RULES_VS_CHECKS_MATRIX.md not found at $MATRIX_DOC"
else
  pass "RULES_VS_CHECKS_MATRIX.md exists (R-E75.7-5)"
  
  # Check for diff report section
  if grep -q "## Diff Report" "$MATRIX_DOC"; then
    pass "Matrix includes diff report (R-E75.7-5)"
  else
    fail "R-E75.7-5" "Matrix missing diff report section"
  fi
  
  # Check for rules without checks section
  if grep -q "Rules Without Checks" "$MATRIX_DOC"; then
    pass "Matrix includes rules-without-checks report (R-E75.7-5)"
  else
    fail "R-E75.7-5" "Matrix missing rules-without-checks section"
  fi
  
  # Check for checks without rules section
  if grep -q "Checks Without Rules" "$MATRIX_DOC"; then
    pass "Matrix includes checks-without-rules report (R-E75.7-5)"
  else
    fail "R-E75.7-5" "Matrix missing checks-without-rules section"
  fi
fi

echo ""

# =============================================================================
# R-E75.7-6: Every rule has a check implementation
# =============================================================================

info "Checking R-E75.7-6: Rule coverage..."

if [ -f "$MATRIX_DOC" ]; then
  # Extract rules without checks count from matrix
  RULES_WITHOUT_CHECKS=$(grep -A 2 "Rules Without Checks" "$MATRIX_DOC" | grep "Count:" | grep -oE '[0-9]+' || echo "unknown")
  
  if [ "$RULES_WITHOUT_CHECKS" = "0" ]; then
    pass "All rules have check implementations (R-E75.7-6)"
  elif [ "$RULES_WITHOUT_CHECKS" = "unknown" ]; then
    fail "R-E75.7-6" "Could not determine rules without checks count from matrix"
  else
    fail "R-E75.7-6" "$RULES_WITHOUT_CHECKS rules found without check implementations"
  fi
fi

echo ""

# =============================================================================
# R-E75.7-7: Every check references a rule ID
# =============================================================================

info "Checking R-E75.7-7: Check references..."

if [ -f "$MATRIX_DOC" ]; then
  # Extract checks without rules count from matrix
  CHECKS_WITHOUT_RULES=$(grep -A 2 "Checks Without Rules" "$MATRIX_DOC" | grep "Count:" | grep -oE '[0-9]+' || echo "unknown")
  
  if [ "$CHECKS_WITHOUT_RULES" = "0" ]; then
    pass "All checks reference rule IDs (R-E75.7-7)"
  elif [ "$CHECKS_WITHOUT_RULES" = "unknown" ]; then
    fail "R-E75.7-7" "Could not determine checks without rules count from matrix"
  else
    fail "R-E75.7-7" "$CHECKS_WITHOUT_RULES checks found without rule ID references"
  fi
fi

echo ""

# =============================================================================
# R-E75.7-8: Check outputs include "violates R-XYZ" format
# =============================================================================

info "Checking R-E75.7-8: Violation output format..."

# Check verify-rls-smoke.sh for violation format
if [ -f "$RLS_SMOKE_SCRIPT" ]; then
  if grep -q 'violates R-E75' "$RLS_SMOKE_SCRIPT" || grep -q 'FAIL (violates' "$RLS_SMOKE_SCRIPT"; then
    pass "RLS smoke script uses violation format (R-E75.7-8)"
  else
    fail "R-E75.7-8" "RLS smoke script missing 'violates R-XXX' output format"
  fi
fi

# Check verify-e75-2-anamnesis-api.mjs for violation format
API_VERIFY="$REPO_ROOT/scripts/ci/verify-e75-2-anamnesis-api.mjs"
if [ -f "$API_VERIFY" ]; then
  if grep -q 'violates' "$API_VERIFY"; then
    pass "API verification script uses violation format (R-E75.7-8)"
  else
    fail "R-E75.7-8" "API verification script missing 'violates' output format"
  fi
fi

# Check this script for violation format
if grep -q 'FAIL (violates' "$0"; then
  pass "Documentation verification script uses violation format (R-E75.7-8)"
else
  fail "R-E75.7-8" "Documentation verification script missing violation format"
fi

echo ""

# =============================================================================
# Summary
# =============================================================================

echo "================================================"
echo "📊 Documentation Verification Summary"
echo "================================================"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ All E75.7 documentation checks passed!${NC}"
  echo ""
  echo "Documentation artifacts:"
  echo "  - docs/anamnesis/SCHEMA_V1.md"
  echo "  - docs/anamnesis/API_V1.md"
  echo "  - docs/anamnesis/SECURITY_MODEL.md"
  echo "  - docs/anamnesis/RULES_VS_CHECKS_MATRIX.md"
  echo "  - scripts/ci/verify-rls-smoke.sh"
  echo "  - scripts/ci/verify-e75-7-docs.sh"
  exit 0
else
  echo -e "${RED}❌ Some documentation checks failed.${NC}"
  echo "Please review the output above and fix the issues."
  exit 1
fi
