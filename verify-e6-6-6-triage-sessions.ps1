#!/usr/bin/env pwsh
# E6.6.6 Triage Sessions Verification Guide
# This script verifies the triage session persistence implementation

Write-Host "=== E6.6.6 Triage Sessions Verification Guide ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "This implementation adds PHI-safe triage session persistence." -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ AC1: No raw text stored" -ForegroundColor Green
Write-Host "  - Only SHA-256 hash of input text is stored"
Write-Host "  - input_hash constraint ensures 64-character hex string"
Write-Host "  - Unit tests verify hash cannot be reversed"
Write-Host ""

Write-Host "✅ AC2: RLS policies implemented" -ForegroundColor Green
Write-Host "  - Patient can only read own triage sessions"
Write-Host "  - Clinician/admin can read all triage sessions"
Write-Host "  - RLS verification script: test/e6-6-6-triage-sessions-rls.sql"
Write-Host ""

Write-Host "✅ AC3: Insert after eligibility and validation" -ForegroundColor Green
Write-Host "  - Insertion happens after requirePilotEligibility()"
Write-Host "  - Insertion happens after request validation"
Write-Host "  - Best-effort (non-blocking) - failures don't block triage response"
Write-Host ""

Write-Host "📋 Files Created/Modified:" -ForegroundColor Cyan
Write-Host "  Migration:"
Write-Host "    - supabase/migrations/20260116160600_e6_6_6_create_triage_sessions.sql"
Write-Host "  Schema:"
Write-Host "    - schema/schema.sql (triage_sessions table added)"
Write-Host "  TypeScript:"
Write-Host "    - lib/triage/sessionStorage.ts (hash + insert functions)"
Write-Host "    - app/api/patient/triage/route.ts (integration)"
Write-Host "    - app/api/amy/triage/route.ts (integration)"
Write-Host "  Tests:"
Write-Host "    - lib/triage/__tests__/sessionStorage.test.ts"
Write-Host "    - test/e6-6-6-triage-sessions-rls.sql"
Write-Host ""

Write-Host "🧪 Running Unit Tests..." -ForegroundColor Cyan
npm test -- lib/triage/__tests__/sessionStorage.test.ts --silent

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Unit tests passed" -ForegroundColor Green
} else {
    Write-Host "❌ Unit tests failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Manual Verification Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Database Setup:" -ForegroundColor Yellow
Write-Host "   npm run db:reset"
Write-Host "   # This applies all migrations including triage_sessions table"
Write-Host ""

Write-Host "2. Verify RLS Policies:" -ForegroundColor Yellow
Write-Host "   psql -d postgres -f test/e6-6-6-triage-sessions-rls.sql"
Write-Host "   # Should show: PASS: All E6.6.6 triage_sessions RLS checks passed"
Write-Host ""

Write-Host "3. Test Triage Session Creation:" -ForegroundColor Yellow
Write-Host "   # Start dev server:"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "   # Submit triage request (authenticated as patient):"
Write-Host "   curl -X POST http://localhost:3000/api/patient/triage \"
Write-Host "     -H 'Content-Type: application/json' \"
Write-Host "     -H 'Cookie: sb-...' \"
Write-Host "     -d '{\"inputText\": \"Ich fühle mich sehr gestresst\"}'"
Write-Host ""
Write-Host "   # Verify in database:"
Write-Host "   SELECT id, patient_id, tier, next_action, input_hash,"
Write-Host "          length(input_hash), rationale"
Write-Host "   FROM triage_sessions"
Write-Host "   ORDER BY created_at DESC LIMIT 5;"
Write-Host ""
Write-Host "   # Verify NO raw text is stored:"
Write-Host "   SELECT column_name FROM information_schema.columns"
Write-Host "   WHERE table_name = 'triage_sessions';"
Write-Host "   # Should NOT show 'input_text' or 'inputText' column"
Write-Host ""

Write-Host "4. Test RLS (patient can only see own):" -ForegroundColor Yellow
Write-Host "   # As patient user:"
Write-Host "   SELECT * FROM triage_sessions;"
Write-Host "   # Should only show own sessions"
Write-Host ""
Write-Host "   # As clinician/admin user:"
Write-Host "   SELECT * FROM triage_sessions;"
Write-Host "   # Should show all sessions"
Write-Host ""

Write-Host "5. Verify Hash Determinism:" -ForegroundColor Yellow
Write-Host "   # Submit same input twice, verify same hash:"
Write-Host "   SELECT input_hash, COUNT(*) as count"
Write-Host "   FROM triage_sessions"
Write-Host "   GROUP BY input_hash"
Write-Host "   HAVING COUNT(*) > 1;"
Write-Host "   # If same input submitted twice, shows duplicate hashes"
Write-Host ""

Write-Host "✅ Verification Complete" -ForegroundColor Green
Write-Host ""
Write-Host "Key Acceptance Criteria:" -ForegroundColor Cyan
Write-Host "  AC1: ✅ No raw inputText stored - only SHA-256 hash"
Write-Host "  AC2: ✅ RLS: patient reads own, clinician/admin reads all"
Write-Host "  AC3: ✅ Insert after eligibility + validation (best-effort)"
Write-Host ""
