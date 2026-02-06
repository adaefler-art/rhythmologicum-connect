#!/bin/bash
# Globals Size Check - Design Guardrail Script
# 
# Ensures globals.css stays lean and focused
# Rules enforced: R-GLOB-01
#
# Usage: ./tools/design-guardrails/globals-size-check.sh
# Exit code: Always 0 (warning only)

set -euo pipefail

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "🔍 Design Guardrails: Globals Size Check"
echo "================================================"
echo ""

GLOBALS_FILE="apps/rhythm-studio-ui/app/globals.css"
THRESHOLD=200

if [ ! -f "$GLOBALS_FILE" ]; then
  echo -e "${GREEN}✓ R-GLOB-01: globals.css not found (OK)${NC}"
  exit 0
fi

LINE_COUNT=$(wc -l < "$GLOBALS_FILE")

echo "Checking R-GLOB-01: globals.css line count..."
if [ "$LINE_COUNT" -gt "$THRESHOLD" ]; then
  echo -e "${YELLOW}⚠ R-GLOB-01: violates R-GLOB-01 - globals.css is ${LINE_COUNT} lines (threshold: ${THRESHOLD})${NC}"
  echo "Consider simplifying to semantic tokens only (see docs/mobile/styles/globals.css)"
else
  echo -e "${GREEN}✓ R-GLOB-01: globals.css line count OK (${LINE_COUNT} lines)${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ PASSED: Check complete (warnings only)${NC}"
exit 0
