#!/usr/bin/env bash
# Issue 5: Consult Note v1 — Run All Guardrails
# Master script to run all consult note validation checks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================================"
echo "Issue 5: Consult Note v1 — Running All Guardrails"
echo "================================================================"
echo ""

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

run_check() {
  local check_script="$1"
  local check_name="$2"
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Running: $check_name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if bash "$SCRIPT_DIR/$check_script"; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
}

# Run all checks
run_check "check-12-sections.sh" "12-Section Structure Validation (R-CN-01)"
run_check "check-handoff-limit.sh" "Handoff Summary Length Check (R-CN-08)"
run_check "check-no-diagnosis.sh" "Diagnosis Language Detector (R-CN-09)"
run_check "check-uncertainty-mode.sh" "Uncertainty Mode Validator (R-CN-02, R-CN-07)"

# Summary
echo ""
echo "================================================================"
echo "SUMMARY"
echo "================================================================"
echo "Total Checks:  $TOTAL_CHECKS"
echo "Passed:        $PASSED_CHECKS"
echo "Failed:        $FAILED_CHECKS"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
  echo "✅ ALL GUARDRAILS PASSED"
  echo ""
  echo "Consult Note v1 implementation meets all validation criteria."
  exit 0
else
  echo "❌ SOME GUARDRAILS FAILED"
  echo ""
  echo "Please address the violations before proceeding."
  exit 1
fi
