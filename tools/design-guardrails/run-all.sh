#!/bin/bash
# Run All Design Guardrail Checks
#
# Usage: ./tools/design-guardrails/run-all.sh
# Exit code: 1 if any blocking violation found, 0 otherwise

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Running All Design Guardrails"
echo "========================================"
echo ""

EXIT_CODE=0

# Run component drift check
echo ">>> Running component-drift-check.sh..."
if ! "$SCRIPT_DIR/component-drift-check.sh"; then
  EXIT_CODE=1
fi
echo ""

# Run globals size check
echo ">>> Running globals-size-check.sh..."
"$SCRIPT_DIR/globals-size-check.sh" || true
echo ""

# Run globals var check
echo ">>> Running globals-var-check.sh..."
"$SCRIPT_DIR/globals-var-check.sh" || true
echo ""

# Run PR size check
echo ">>> Running pr-size-check.sh..."
if ! "$SCRIPT_DIR/pr-size-check.sh"; then
  EXIT_CODE=1
fi
echo ""

echo "========================================"
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All guardrail checks passed"
else
  echo "❌ Some guardrail checks failed"
fi

exit $EXIT_CODE
