#!/bin/bash
# E73.8 Verification Script
# Purpose: Verify Strategy A compliance for AMY Chat endpoint

set -e

echo "==========================================="
echo "E73.8 AMY Chat - Strategy A Verification"
echo "==========================================="
echo ""

# Check 1: Literal callsites exist
echo "✓ Check 1: Verifying literal callsites..."
CALLSITES=$(grep -r "fetch('/api/amy/chat" apps/rhythm-patient-ui/app/patient/\(mobile\)/components/AMYChatWidget.tsx | wc -l)
if [ "$CALLSITES" -ge 1 ]; then
    echo "  ✅ Found $CALLSITES literal callsite(s)"
    grep -n "fetch('/api/amy/chat" apps/rhythm-patient-ui/app/patient/\(mobile\)/components/AMYChatWidget.tsx
else
    echo "  ❌ No literal callsites found"
    exit 1
fi
echo ""

# Check 2: Feature flag exists
echo "✓ Check 2: Verifying feature flag..."
if grep -q "AMY_CHAT_ENABLED" lib/featureFlags.ts; then
    echo "  ✅ Feature flag AMY_CHAT_ENABLED exists"
    grep "AMY_CHAT_ENABLED" lib/featureFlags.ts | head -3
else
    echo "  ❌ Feature flag not found"
    exit 1
fi
echo ""

# Check 3: Endpoint in allowlist
echo "✓ Check 3: Verifying endpoint allowlist..."
if grep -q '"/api/amy/chat"' docs/api/endpoint-allowlist.json; then
    echo "  ✅ Endpoint in allowlist"
    grep -n '"/api/amy/chat"' docs/api/endpoint-allowlist.json
else
    echo "  ❌ Endpoint not in allowlist"
    exit 1
fi
echo ""

# Check 4: API route exists
echo "✓ Check 4: Verifying API route implementation..."
if [ -f "apps/rhythm-patient-ui/app/api/amy/chat/route.ts" ]; then
    echo "  ✅ API route file exists"
    echo "  File: apps/rhythm-patient-ui/app/api/amy/chat/route.ts"
    echo "  Lines: $(wc -l < apps/rhythm-patient-ui/app/api/amy/chat/route.ts)"
else
    echo "  ❌ API route file not found"
    exit 1
fi
echo ""

# Check 5: Migration exists
echo "✓ Check 5: Verifying database migration..."
MIGRATION=$(find supabase/migrations -name "*e73_8*" -type f)
if [ -n "$MIGRATION" ]; then
    echo "  ✅ Migration file exists"
    echo "  File: $MIGRATION"
else
    echo "  ❌ Migration file not found"
    exit 1
fi
echo ""

# Check 6: Widget component exists
echo "✓ Check 6: Verifying UI widget component..."
if [ -f "apps/rhythm-patient-ui/app/patient/(mobile)/components/AMYChatWidget.tsx" ]; then
    echo "  ✅ Widget component exists"
    echo "  File: apps/rhythm-patient-ui/app/patient/(mobile)/components/AMYChatWidget.tsx"
    echo "  Lines: $(wc -l < "apps/rhythm-patient-ui/app/patient/(mobile)/components/AMYChatWidget.tsx")"
else
    echo "  ❌ Widget component not found"
    exit 1
fi
echo ""

# Check 7: System prompt includes "no actions"
echo "✓ Check 7: Verifying system prompt (no actions)..."
if grep -q "KEINE Aktionen ausführen" apps/rhythm-patient-ui/app/api/amy/chat/route.ts; then
    echo "  ✅ System prompt includes 'no actions' language"
else
    echo "  ❌ System prompt missing 'no actions' language"
    exit 1
fi
echo ""

# Check 8: Documentation exists
echo "✓ Check 8: Verifying documentation..."
DOCS_FOUND=0
if [ -f "docs/e7/E73_8_IMPLEMENTATION_SUMMARY.md" ]; then
    echo "  ✅ Implementation Summary exists"
    DOCS_FOUND=$((DOCS_FOUND + 1))
fi
if [ -f "docs/e7/E73_8_RULES_VS_CHECKS_MATRIX.md" ]; then
    echo "  ✅ Rules vs. Checks Matrix exists"
    DOCS_FOUND=$((DOCS_FOUND + 1))
fi
if [ "$DOCS_FOUND" -lt 2 ]; then
    echo "  ❌ Missing documentation files"
    exit 1
fi
echo ""

echo "==========================================="
echo "✅ All Strategy A checks passed!"
echo "==========================================="
echo ""
echo "Manual tests still required:"
echo "  - Conversation persistence across reload"
echo "  - Network monitor (no funnel/assessment calls)"
echo "  - Feature flag disable behavior"
echo "  - Cross-user access denial (RLS)"
echo ""
echo "See: docs/e7/E73_8_IMPLEMENTATION_SUMMARY.md"
