#!/bin/bash
# PR Size Check - Design Guardrail Script
# 
# Prevents mega-PRs that change too many files
# Rules enforced: R-SIZE-01, R-SIZE-02
#
# Usage: ./tools/design-guardrails/pr-size-check.sh
# Environment: PR_FILES (newline-separated file list), PR_LABELS (comma-separated)
# Exit code: 1 if R-SIZE-02 violated without override, 0 otherwise

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Design Guardrails: PR Size Check"
echo "================================================"
echo ""

# Get PR files from environment or git diff
if [ -n "${PR_FILES:-}" ]; then
  FILES="$PR_FILES"
else
  # Local mode: compare with main branch
  FILES=$(git diff --name-only origin/main 2>/dev/null || git diff --name-only HEAD~1 || echo "")
fi

# Get PR labels
LABELS="${PR_LABELS:-}"

# Count total files
TOTAL_FILES=$(echo "$FILES" | grep -v '^$' | wc -l || echo 0)

# Count UI component files
UI_FILES=$(echo "$FILES" | grep -c '^lib/ui/.*\.tsx$' || echo 0)

HAS_OVERRIDE=$(echo "$LABELS" | grep -c 'size-override' || echo 0)

# R-SIZE-01: Warn if >20 UI component files changed
echo "Checking R-SIZE-01: UI component file count..."
if [ "$UI_FILES" -gt 20 ]; then
  echo -e "${YELLOW}⚠ R-SIZE-01: violates R-SIZE-01 - ${UI_FILES} UI component files changed (threshold: 20)${NC}"
  echo "Consider breaking into smaller PRs for better reviewability."
else
  echo -e "${GREEN}✓ R-SIZE-01: UI component file count OK (${UI_FILES} files)${NC}"
fi
echo ""

# R-SIZE-02: Block if >50 total files changed (unless override)
echo "Checking R-SIZE-02: Total file count..."
if [ "$TOTAL_FILES" -gt 50 ]; then
  if [ "$HAS_OVERRIDE" -eq 1 ]; then
    echo -e "${YELLOW}⚠ R-SIZE-02: ${TOTAL_FILES} files changed (threshold: 50) - OVERRIDE LABEL PRESENT${NC}"
    echo "Override granted, but please justify in PR description."
    exit 0
  else
    echo -e "${RED}✗ R-SIZE-02: violates R-SIZE-02 - ${TOTAL_FILES} files changed (threshold: 50)${NC}"
    echo "This PR is too large. Please:"
    echo "  1. Break into smaller, focused PRs, OR"
    echo "  2. Add 'size-override' label and justify in PR description"
    exit 1
  fi
else
  echo -e "${GREEN}✓ R-SIZE-02: Total file count OK (${TOTAL_FILES} files)${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ PASSED: PR size checks passed${NC}"
exit 0
