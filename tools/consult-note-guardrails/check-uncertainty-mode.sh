#!/usr/bin/env bash
# Issue 5: Consult Note v1 — Uncertainty Mode Validator
# Validates uncertainty profile configuration is properly implemented
# Rules: R-CN-02, R-CN-07

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "============================================================"
echo "Issue 5: R-CN-02, R-CN-07 — Uncertainty Mode Validator"
echo "============================================================"
echo ""

VIOLATIONS=0

# Check TypeScript enum types
TYPE_FILE="$PROJECT_ROOT/lib/types/consultNote.ts"

if [ ! -f "$TYPE_FILE" ]; then
  echo "❌ violates R-CN-02: Type file not found"
  exit 1
fi

echo "✓ Checking uncertainty profile types..."

REQUIRED_TYPES=(
  "UncertaintyProfile"
  "AssertivenessLevel"
  "AudienceType"
)

for type_name in "${REQUIRED_TYPES[@]}"; do
  if ! grep -q "export type $type_name" "$TYPE_FILE"; then
    echo "  ❌ violates R-CN-02: Missing type $type_name"
    VIOLATIONS=$((VIOLATIONS + 1))
  else
    echo "  ✓ Type $type_name defined"
  fi
done

# Check database schema has enum types
MIGRATION_FILE="$PROJECT_ROOT/supabase/migrations/20260208220000_issue_5_consult_notes_v1.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo ""
  echo "❌ violates R-CN-02: Migration file not found"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo ""
  echo "✓ Checking database enum types..."
  
  if ! grep -q "CREATE TYPE.*uncertainty_profile" "$MIGRATION_FILE"; then
    echo "  ❌ violates R-CN-02: uncertainty_profile enum not created"
    VIOLATIONS=$((VIOLATIONS + 1))
  else
    echo "  ✓ uncertainty_profile enum created"
  fi
  
  if ! grep -q "CREATE TYPE.*assertiveness_level" "$MIGRATION_FILE"; then
    echo "  ❌ violates R-CN-02: assertiveness_level enum not created"
    VIOLATIONS=$((VIOLATIONS + 1))
  else
    echo "  ✓ assertiveness_level enum created"
  fi
  
  if ! grep -q "CREATE TYPE.*audience_type" "$MIGRATION_FILE"; then
    echo "  ❌ violates R-CN-02: audience_type enum not created"
    VIOLATIONS=$((VIOLATIONS + 1))
  else
    echo "  ✓ audience_type enum created"
  fi
fi

# Check LLM prompt has uncertainty instructions
PROMPT_FILE="$PROJECT_ROOT/lib/llm/prompts.ts"

echo ""
echo "✓ Checking LLM prompt uncertainty handling..."

if ! grep -q "getUncertaintyInstructions" "$PROMPT_FILE"; then
  echo "  ❌ violates R-CN-07: Uncertainty instructions function not found"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  ✓ Uncertainty instructions function exists"
fi

# Check that prompt differentiates between patient and clinician modes
if ! grep -q "audience.*patient.*clinician" "$PROMPT_FILE"; then
  echo "  ⚠️  Warning: Prompt may not differentiate patient/clinician audiences"
fi

# Check preliminary assessment section forbids definitive statements
if grep -q "Arbeits-Hypothesen als Optionen" "$PROMPT_FILE"; then
  echo "  ✓ Prompt emphasizes hypotheses as options (not definitive)"
else
  echo "  ⚠️  Warning: Prompt may not emphasize 'hypotheses as options'"
fi

# Check validation enforces uncertainty mode documentation
VALIDATION_FILE="$PROJECT_ROOT/lib/validation/consultNote.ts"

echo ""
echo "✓ Checking validation enforces uncertainty documentation..."

if [ -f "$VALIDATION_FILE" ]; then
  if grep -q "uncertaintyProfile" "$VALIDATION_FILE"; then
    echo "  ✓ Validation checks uncertainty profile"
  else
    echo "  ⚠️  Warning: Validation may not check uncertainty profile"
  fi
fi

# Check header section includes uncertainty profile
if ! grep -q "uncertaintyProfile.*UncertaintyProfile" "$TYPE_FILE"; then
  echo "  ❌ violates R-CN-02: Header missing uncertainty profile field"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  ✓ Header includes uncertainty profile field"
fi

echo ""
echo "============================================================"
if [ $VIOLATIONS -eq 0 ]; then
  echo "✅ R-CN-02, R-CN-07 PASSED: Uncertainty modes properly configured"
  exit 0
else
  echo "❌ R-CN-02, R-CN-07 FAILED: $VIOLATIONS violation(s) found"
  exit 1
fi
