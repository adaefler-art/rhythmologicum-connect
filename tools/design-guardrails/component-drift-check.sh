#!/bin/bash
# Component Drift Check - Design Guardrail Script
# 
# Detects deviations from docs/mobile reference patterns
# Rules enforced: R-COMP-01, R-COMP-02, R-COMP-03, R-COMP-04, R-COMP-05
#
# Usage: ./tools/design-guardrails/component-drift-check.sh
# Exit code: 1 if BLOCK-level violation found, 0 otherwise

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "🔍 Design Guardrails: Component Drift Check"
echo "================================================"
echo ""

# Track violations
HAS_BLOCK_VIOLATION=0
HAS_WARN_VIOLATION=0

# R-COMP-01: Components must not import from @/lib/design-tokens (BLOCK)
echo "Checking R-COMP-01: No design-tokens imports..."
if grep -r "from.*@/lib/design-tokens" lib/ui/*.tsx 2>/dev/null; then
  echo -e "${RED}✗ R-COMP-01: violates R-COMP-01 - Found design-tokens imports in lib/ui components${NC}"
  HAS_BLOCK_VIOLATION=1
else
  echo -e "${GREEN}✓ R-COMP-01: No design-tokens imports found${NC}"
fi
echo ""

# R-COMP-02: Components should use data-slot attributes (WARN)
echo "Checking R-COMP-02: data-slot attribute usage..."
MISSING_DATA_SLOT=()
for file in lib/ui/Card.tsx lib/ui/Input.tsx lib/ui/Select.tsx lib/ui/Table.tsx lib/ui/Modal.tsx; do
  if [ -f "$file" ]; then
    if ! grep -q 'data-slot=' "$file" 2>/dev/null; then
      MISSING_DATA_SLOT+=("$file")
    fi
  fi
done

if [ ${#MISSING_DATA_SLOT[@]} -gt 0 ]; then
  echo -e "${YELLOW}⚠ R-COMP-02: violates R-COMP-02 - Missing data-slot attributes in:${NC}"
  for file in "${MISSING_DATA_SLOT[@]}"; do
    echo "    - $file"
  done
  HAS_WARN_VIOLATION=1
else
  echo -e "${GREEN}✓ R-COMP-02: All components use data-slot attributes${NC}"
fi
echo ""

# R-COMP-03: Components should prefer Tailwind classes over inline styles (WARN)
echo "Checking R-COMP-03: Tailwind vs inline styles ratio..."
for file in lib/ui/Card.tsx lib/ui/Input.tsx lib/ui/Select.tsx lib/ui/Table.tsx; do
  if [ -f "$file" ]; then
    INLINE_STYLE_COUNT=$(grep -o 'style={' "$file" | wc -l || echo 0)
    TOTAL_LINES=$(wc -l < "$file")
    INLINE_PERCENTAGE=$((INLINE_STYLE_COUNT * 100 / (TOTAL_LINES + 1)))
    
    if [ "$INLINE_PERCENTAGE" -gt 20 ]; then
      echo -e "${YELLOW}⚠ R-COMP-03: violates R-COMP-03 - $file has ${INLINE_PERCENTAGE}% inline styles (threshold: 20%)${NC}"
      HAS_WARN_VIOLATION=1
    else
      echo -e "${GREEN}✓ R-COMP-03: $file inline styles OK (${INLINE_PERCENTAGE}%)${NC}"
    fi
  fi
done
echo ""

# R-COMP-04: Card component line count (WARN)
echo "Checking R-COMP-04: Card component line count..."
REFERENCE_CARD_LINES=93
TOLERANCE=50  # percent
if [ -f "lib/ui/Card.tsx" ]; then
  CARD_LINES=$(wc -l < lib/ui/Card.tsx)
  MIN_LINES=$((REFERENCE_CARD_LINES * (100 - TOLERANCE) / 100))
  MAX_LINES=$((REFERENCE_CARD_LINES * (100 + TOLERANCE) / 100))
  
  if [ "$CARD_LINES" -lt "$MIN_LINES" ] || [ "$CARD_LINES" -gt "$MAX_LINES" ]; then
    echo -e "${YELLOW}⚠ R-COMP-04: violates R-COMP-04 - Card.tsx is ${CARD_LINES} lines (expected: ${REFERENCE_CARD_LINES} ±${TOLERANCE}% = ${MIN_LINES}-${MAX_LINES})${NC}"
    HAS_WARN_VIOLATION=1
  else
    echo -e "${GREEN}✓ R-COMP-04: Card.tsx line count OK (${CARD_LINES} lines)${NC}"
  fi
fi
echo ""

# R-COMP-05: Input component line count (WARN)
echo "Checking R-COMP-05: Input component line count..."
REFERENCE_INPUT_LINES=22
if [ -f "lib/ui/Input.tsx" ]; then
  INPUT_LINES=$(wc -l < lib/ui/Input.tsx)
  MIN_LINES=$((REFERENCE_INPUT_LINES * (100 - TOLERANCE) / 100))
  MAX_LINES=$((REFERENCE_INPUT_LINES * (100 + TOLERANCE) / 100))
  
  if [ "$INPUT_LINES" -lt "$MIN_LINES" ] || [ "$INPUT_LINES" -gt "$MAX_LINES" ]; then
    echo -e "${YELLOW}⚠ R-COMP-05: violates R-COMP-05 - Input.tsx is ${INPUT_LINES} lines (expected: ${REFERENCE_INPUT_LINES} ±${TOLERANCE}% = ${MIN_LINES}-${MAX_LINES})${NC}"
    HAS_WARN_VIOLATION=1
  else
    echo -e "${GREEN}✓ R-COMP-05: Input.tsx line count OK (${INPUT_LINES} lines)${NC}"
  fi
fi
echo ""

# Summary
echo "================================================"
if [ $HAS_BLOCK_VIOLATION -eq 1 ]; then
  echo -e "${RED}❌ BLOCKED: Found blocking violations${NC}"
  echo "Fix blocking violations before proceeding."
  exit 1
elif [ $HAS_WARN_VIOLATION -eq 1 ]; then
  echo -e "${YELLOW}⚠️  WARNINGS: Found warnings (non-blocking)${NC}"
  echo "Consider addressing warnings to maintain design consistency."
  exit 0
else
  echo -e "${GREEN}✅ PASSED: All component drift checks passed${NC}"
  exit 0
fi
