#!/usr/bin/env bash
# Issue 5: Consult Note v1 — Handoff Summary Length Check
# Validates that handoff summary does not exceed 10 lines
# Rule: R-CN-08

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "========================================================="
echo "Issue 5: R-CN-08 — Handoff Summary Length Check (Max 10)"
echo "========================================================="
echo ""

VIOLATIONS=0

# Check validation constant
VALIDATION_FILE="$PROJECT_ROOT/lib/validation/consultNote.ts"

if [ ! -f "$VALIDATION_FILE" ]; then
  echo "❌ violates R-CN-08: Validation file not found"
  exit 1
fi

echo "✓ Checking MAX_HANDOFF_LINES constant..."

if ! grep -q "MAX_HANDOFF_LINES = 10" "$VALIDATION_FILE"; then
  echo "  ❌ violates R-CN-08: MAX_HANDOFF_LINES not set to 10"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  ✓ MAX_HANDOFF_LINES correctly set to 10"
fi

# Check validation function enforces the limit
echo ""
echo "✓ Checking handoff summary validation..."

if ! grep -q "validateHandoffSummary" "$VALIDATION_FILE"; then
  echo "  ❌ violates R-CN-08: Handoff summary validation function not found"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  ✓ Handoff summary validation function exists"
  
  # Check that it compares against MAX_HANDOFF_LINES
  if ! grep -q "lineCount > MAX_HANDOFF_LINES" "$VALIDATION_FILE"; then
    echo "  ❌ violates R-CN-08: Validation does not check against MAX_HANDOFF_LINES"
    VIOLATIONS=$((VIOLATIONS + 1))
  else
    echo "  ✓ Validation checks line count against limit"
  fi
  
  # Check that it returns an error (not just warning)
  if ! grep -A 10 "validateHandoffSummary" "$VALIDATION_FILE" | grep -q "errors.push"; then
    echo "  ⚠️  Warning: Handoff summary validation may not return hard error"
  else
    echo "  ✓ Validation returns error for violations"
  fi
fi

# Check LLM prompt mentions the limit
PROMPT_FILE="$PROJECT_ROOT/lib/llm/prompts.ts"

echo ""
echo "✓ Checking LLM prompt mentions 10-line limit..."

if ! grep -q "MAXIMAL 10 ZEILEN" "$PROMPT_FILE"; then
  echo "  ⚠️  Warning: Prompt does not explicitly state 'MAXIMAL 10 ZEILEN'"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  ✓ Prompt explicitly states 10-line limit"
fi

# Check helper function validates handoff summary
HELPER_FILE="$PROJECT_ROOT/lib/consultNote/helpers.ts"

if [ -f "$HELPER_FILE" ]; then
  echo ""
  echo "✓ Checking helper functions..."
  
  if grep -q "isHandoffSummaryValid" "$HELPER_FILE"; then
    echo "  ✓ Helper function for handoff validation exists"
  fi
fi

echo ""
echo "========================================================="
if [ $VIOLATIONS -eq 0 ]; then
  echo "✅ R-CN-08 PASSED: Handoff summary 10-line limit enforced"
  exit 0
else
  echo "❌ R-CN-08 FAILED: $VIOLATIONS violation(s) found"
  exit 1
fi
