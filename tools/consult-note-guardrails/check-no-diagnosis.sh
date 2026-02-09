#!/usr/bin/env bash
# Issue 5: Consult Note v1 — Diagnosis Language Detector
# Checks for forbidden diagnosis language in code and prompts
# Rule: R-CN-09

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "========================================================"
echo "Issue 5: R-CN-09 — Diagnosis Language Detector"
echo "========================================================"
echo ""

VIOLATIONS=0

# Forbidden words that indicate diagnosis language
FORBIDDEN_WORDS=(
  "you have"
  "diagnosis:"
  "diagnosed with"
  "definitive diagnosis"
  "confirmed"
  "definitively"
  "certainly is"
  "definitely"
  "it is clear that"
)

# Check validation file has forbidden words list
VALIDATION_FILE="$PROJECT_ROOT/lib/validation/consultNote.ts"

if [ ! -f "$VALIDATION_FILE" ]; then
  echo "❌ violates R-CN-09: Validation file not found"
  exit 1
fi

echo "✓ Checking forbidden words list in validation..."

if ! grep -q "DIAGNOSIS_FORBIDDEN_WORDS" "$VALIDATION_FILE"; then
  echo "  ❌ violates R-CN-09: DIAGNOSIS_FORBIDDEN_WORDS not defined"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  ✓ DIAGNOSIS_FORBIDDEN_WORDS defined"
  
  # Check that validation function uses it
  if ! grep -q "validateNoDiagnosisLanguage" "$VALIDATION_FILE"; then
    echo "  ❌ violates R-CN-09: Diagnosis language validation function not found"
    VIOLATIONS=$((VIOLATIONS + 1))
  else
    echo "  ✓ Diagnosis language validation function exists"
  fi
fi

# Check LLM prompt has NO DIAGNOSES rule
PROMPT_FILE="$PROJECT_ROOT/lib/llm/prompts.ts"

echo ""
echo "✓ Checking LLM prompt has NO DIAGNOSES rule..."

if ! grep -q "NO DIAGNOSES" "$PROMPT_FILE"; then
  echo "  ❌ violates R-CN-09: Prompt missing 'NO DIAGNOSES' instruction"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  ✓ Prompt includes 'NO DIAGNOSES' instruction"
fi

if ! grep -q "NIEMALS.*Diagnose" "$PROMPT_FILE"; then
  echo "  ⚠️  Warning: Prompt may not emphasize 'NIEMALS Diagnose' strongly enough"
fi

# Check that prompt explicitly forbids diagnosis language (but allow it in prohibition statements)
if grep "Du hast.*Krankheit" "$PROMPT_FILE" | grep -v "NIEMALS\|NO\|nicht\|avoid\|forbidden"; then
  echo "  ❌ violates R-CN-09: Prompt contains forbidden example language outside prohibition context"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Scan API endpoint code for accidental diagnosis language
echo ""
echo "✓ Scanning API code for diagnosis language..."

API_DIR="$PROJECT_ROOT/apps/rhythm-studio-ui/app/api/clinician/consult-notes"

if [ -d "$API_DIR" ]; then
  # Check for diagnosis-like strings in API code comments/strings
  if grep -r -i "diagnosis.*confirmed\|definitive diagnosis" "$API_DIR" 2>/dev/null | grep -v "NO.*DIAGNOS" | grep -v "forbid"; then
    echo "  ⚠️  Warning: Found diagnosis-like language in API code"
  else
    echo "  ✓ No diagnosis language found in API code"
  fi
fi

# Check that examples in documentation avoid diagnosis language
DOCS_PATTERN="$PROJECT_ROOT/docs/*consult*.md"

if ls $DOCS_PATTERN 2>/dev/null | head -1 > /dev/null; then
  echo ""
  echo "✓ Checking documentation examples..."
  
  for doc in $DOCS_PATTERN; do
    if [ -f "$doc" ]; then
      if grep -i "diagnosis:.*confirmed\|patient has.*disease" "$doc" | grep -v "MUST NOT\|forbidden\|avoid"; then
        echo "  ⚠️  Warning: Documentation may contain diagnosis language examples"
      fi
    fi
  done
fi

echo ""
echo "========================================================"
if [ $VIOLATIONS -eq 0 ]; then
  echo "✅ R-CN-09 PASSED: No diagnosis language detector in place"
  exit 0
else
  echo "❌ R-CN-09 FAILED: $VIOLATIONS violation(s) found"
  exit 1
fi
