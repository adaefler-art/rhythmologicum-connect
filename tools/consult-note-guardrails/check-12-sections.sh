#!/usr/bin/env bash
# Issue 5: Consult Note v1 — 12-Section Validation Check
# Validates that consult note content has all 12 required sections
# Rule: R-CN-01

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "================================================"
echo "Issue 5: R-CN-01 — 12-Section Validation Check"
echo "================================================"
echo ""

VIOLATIONS=0

# Check TypeScript type definition has all 12 sections
TYPE_FILE="$PROJECT_ROOT/lib/types/consultNote.ts"

if [ ! -f "$TYPE_FILE" ]; then
  echo "❌ violates R-CN-01: TypeScript type file not found"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "✓ Checking TypeScript type definition..."
  
  REQUIRED_SECTIONS=(
    "header"
    "chiefComplaint"
    "hpi"
    "redFlagsScreening"
    "medicalHistory"
    "medications"
    "objectiveData"
    "problemList"
    "preliminaryAssessment"
    "missingData"
    "nextSteps"
    "handoffSummary"
  )
  
  MISSING_SECTIONS=()
  
  for section in "${REQUIRED_SECTIONS[@]}"; do
    if ! grep -q "^  $section:" "$TYPE_FILE"; then
      MISSING_SECTIONS+=("$section")
    fi
  done
  
  if [ ${#MISSING_SECTIONS[@]} -ne 0 ]; then
    echo "  ❌ violates R-CN-01: Missing sections in type definition:"
    for section in "${MISSING_SECTIONS[@]}"; do
      echo "    - $section"
    done
    VIOLATIONS=$((VIOLATIONS + 1))
  else
    echo "  ✓ All 12 sections present in type definition"
  fi
fi

# Check validation function validates all sections
VALIDATION_FILE="$PROJECT_ROOT/lib/validation/consultNote.ts"

if [ ! -f "$VALIDATION_FILE" ]; then
  echo "❌ violates R-CN-01: Validation file not found"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo ""
  echo "✓ Checking validation function..."
  
  if ! grep -q "validateSectionPresence" "$VALIDATION_FILE"; then
    echo "  ❌ violates R-CN-01: Section presence validation function not found"
    VIOLATIONS=$((VIOLATIONS + 1))
  else
    echo "  ✓ Section presence validation function exists"
  fi
fi

# Check LLM prompt specifies all 12 sections
PROMPT_FILE="$PROJECT_ROOT/lib/llm/prompts.ts"

if [ ! -f "$PROMPT_FILE" ]; then
  echo "❌ violates R-CN-01: Prompt file not found"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo ""
  echo "✓ Checking LLM prompt mentions all sections..."
  
  if ! grep -q "12 SECTIONS" "$PROMPT_FILE"; then
    echo "  ⚠️  Warning: Prompt does not explicitly mention '12 SECTIONS'"
  fi
  
  # Check that output format includes all sections
  if ! grep -q "\"handoffSummary\"" "$PROMPT_FILE"; then
    echo "  ❌ violates R-CN-01: Prompt missing handoffSummary in output format"
    VIOLATIONS=$((VIOLATIONS + 1))
  else
    echo "  ✓ Prompt includes all sections in output format"
  fi
fi

echo ""
echo "================================================"
if [ $VIOLATIONS -eq 0 ]; then
  echo "✅ R-CN-01 PASSED: All 12 sections properly defined"
  exit 0
else
  echo "❌ R-CN-01 FAILED: $VIOLATIONS violation(s) found"
  exit 1
fi
