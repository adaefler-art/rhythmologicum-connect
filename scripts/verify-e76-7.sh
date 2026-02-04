#!/usr/bin/env bash
# E76.7 Verification Script
# Verifies that all E76.7 requirements are met before merge

set -e

echo "======================================"
echo "E76.7 Verification Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Check 1: Migration file exists
echo "Check 1: Migration file exists..."
if [ -f "supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql" ]; then
    echo -e "${GREEN}✓${NC} Migration file found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Migration file not found"
    ((FAIL++))
fi

# Check 2: Test file exists
echo "Check 2: Test file exists..."
if [ -f "test/e76-7-diagnosis-rls-tests.sql" ]; then
    echo -e "${GREEN}✓${NC} Test file found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Test file not found"
    ((FAIL++))
fi

# Check 3: Audit helper exists
echo "Check 3: Audit helper exists..."
if [ -f "lib/audit/diagnosisAudit.ts" ]; then
    echo -e "${GREEN}✓${NC} Audit helper found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Audit helper not found"
    ((FAIL++))
fi

# Check 4: Rules vs Checks Matrix exists
echo "Check 4: Rules vs Checks Matrix exists..."
if [ -f "docs/e7/E76_7_RULES_VS_CHECKS_MATRIX.md" ]; then
    echo -e "${GREEN}✓${NC} Rules vs Checks Matrix found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Rules vs Checks Matrix not found"
    ((FAIL++))
fi

# Check 5: Implementation Summary exists
echo "Check 5: Implementation Summary exists..."
if [ -f "docs/e7/E76_7_IMPLEMENTATION_SUMMARY.md" ]; then
    echo -e "${GREEN}✓${NC} Implementation Summary found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Implementation Summary not found"
    ((FAIL++))
fi

# Check 6: Registry updated
echo "Check 6: Registry updated with diagnosis entity types..."
if grep -q "DIAGNOSIS_RUN" lib/contracts/registry.ts && grep -q "DIAGNOSIS_ARTIFACT" lib/contracts/registry.ts; then
    echo -e "${GREEN}✓${NC} Registry contains diagnosis entity types"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Registry missing diagnosis entity types"
    ((FAIL++))
fi

# Check 7: Migration contains DROP POLICY
echo "Check 7: Old policies removed in migration..."
if grep -q "DROP POLICY IF EXISTS \"diagnosis_runs_clinician_read\"" supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql; then
    echo -e "${GREEN}✓${NC} Old diagnosis_runs policy dropped"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Old diagnosis_runs policy not dropped"
    ((FAIL++))
fi

# Check 8: Migration contains assignment-based policy
echo "Check 8: Assignment-based policy exists..."
if grep -q "diagnosis_runs_clinician_assigned_read" supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql; then
    echo -e "${GREEN}✓${NC} Assignment-based policy found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Assignment-based policy not found"
    ((FAIL++))
fi

# Check 9: Migration contains audit triggers
echo "Check 9: Audit triggers exist..."
if grep -q "trigger_diagnosis_runs_audit" supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql && \
   grep -q "trigger_diagnosis_artifacts_audit" supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql; then
    echo -e "${GREEN}✓${NC} Both audit triggers found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Audit triggers not found"
    ((FAIL++))
fi

# Check 10: Test file has "violates R-E76.7" patterns
echo "Check 10: Tests include rule violation messages..."
if grep -q "violates R-E76.7-" test/e76-7-diagnosis-rls-tests.sql; then
    echo -e "${GREEN}✓${NC} Tests include rule violation messages"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Tests missing rule violation messages"
    ((FAIL++))
fi

# Check 11: Endpoint callsites exist
echo "Check 11: Endpoint callsites verified..."
if grep -q "'/api/patient/diagnosis/runs'" apps/rhythm-patient-ui/app/patient/\(mobile\)/diagnosis/client.tsx; then
    echo -e "${GREEN}✓${NC} Patient diagnosis runs endpoint has callsite"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Patient diagnosis runs callsite not verified (may be in different location)"
    ((WARN++))
fi

# Check 12: Audit logging integrated
echo "Check 12: Audit logging integrated into endpoint..."
if grep -q "logDiagnosisArtifactViewed" apps/rhythm-patient-ui/app/api/patient/diagnosis/artifacts/\[id\]/route.ts; then
    echo -e "${GREEN}✓${NC} Audit logging integrated"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Audit logging not integrated"
    ((FAIL++))
fi

# Check 13: Rules vs Checks Matrix contains 25 rules
echo "Check 13: Rules vs Checks Matrix has 25+ rules..."
RULE_COUNT=$(grep -c "R-E76.7-" docs/e7/E76_7_RULES_VS_CHECKS_MATRIX.md || echo "0")
if [ "$RULE_COUNT" -ge 25 ]; then
    echo -e "${GREEN}✓${NC} Found $RULE_COUNT rules (>= 25)"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Found only $RULE_COUNT rules (expected >= 25)"
    ((WARN++))
fi

# Check 14: No rules without checks
echo "Check 14: No rules without checks..."
if grep -q "Rules Without Checks.*Count.*0" docs/e7/E76_7_RULES_VS_CHECKS_MATRIX.md; then
    echo -e "${GREEN}✓${NC} No rules without checks"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Some rules may lack checks (review matrix)"
    ((WARN++))
fi

# Check 15: Implementation summary is complete
echo "Check 15: Implementation summary is complete..."
if grep -q "Definition of Done.*COMPLETE" docs/e7/E76_7_IMPLEMENTATION_SUMMARY.md; then
    echo -e "${GREEN}✓${NC} Implementation marked as complete"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Implementation may not be complete"
    ((WARN++))
fi

echo ""
echo "======================================"
echo "Verification Results"
echo "======================================"
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${RED}Failed:${NC} $FAIL"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}❌ VERIFICATION FAILED${NC}"
    echo "Please address the failed checks before merging."
    exit 1
elif [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}⚠ VERIFICATION PASSED WITH WARNINGS${NC}"
    echo "Review warnings before merging."
    exit 0
else
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo "Ready for merge!"
    exit 0
fi
