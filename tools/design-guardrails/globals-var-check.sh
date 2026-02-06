#!/bin/bash
# Globals CSS Variables Check - Design Guardrail Script
# 
# Prevents explosion of CSS variables in :root
# Rules enforced: R-GLOB-02
#
# Usage: ./tools/design-guardrails/globals-var-check.sh
# Exit code: Always 0 (warning only)

set -euo pipefail

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "🔍 Design Guardrails: Globals CSS Variables Check"
echo "================================================"
echo ""

GLOBALS_FILE="apps/rhythm-studio-ui/app/globals.css"
THRESHOLD=20

if [ ! -f "$GLOBALS_FILE" ]; then
  echo -e "${GREEN}✓ R-GLOB-02: globals.css not found (OK)${NC}"
  exit 0
fi

# Count CSS variables in :root block (lines starting with -- in :root context)
VAR_COUNT=$(awk '/:root\s*{/,/^}/ { if ($0 ~ /^\s*--[a-zA-Z]/) count++ } END { print count+0 }' "$GLOBALS_FILE")

echo "Checking R-GLOB-02: CSS variable count in :root..."
if [ "$VAR_COUNT" -gt "$THRESHOLD" ]; then
  echo -e "${YELLOW}⚠ R-GLOB-02: violates R-GLOB-02 - Found ${VAR_COUNT} CSS variables in :root (threshold: ${THRESHOLD})${NC}"
  echo "Consider using semantic tokens only (background, foreground, card, border, input, muted, radius)"
else
  echo -e "${GREEN}✓ R-GLOB-02: CSS variable count OK (${VAR_COUNT} variables)${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ PASSED: Check complete (warnings only)${NC}"
exit 0
