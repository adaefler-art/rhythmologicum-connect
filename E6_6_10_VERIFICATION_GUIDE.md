# E6.6.10 — Verification Guide

## Quick Verification

Run these commands to verify E6.6.10 implementation:

```bash
# 1. Run triage contract tests (AC2)
npm test -- lib/api/contracts/patient/__tests__/triage.test.ts

# Expected output:
# ✓ Test Suites: 1 passed, 1 total
# ✓ Tests:       37 passed, 37 total

# 2. Verify endpoint catalog (AC1)
npm run api:catalog:verify

# Expected output:
# ✅ Endpoint wiring gate passed
# ✅ Endpoint catalog verified successfully

# 3. Run all tests to ensure no regressions
npm test

# Expected output:
# ✓ Test Suites: 125 passed, 125 total
# ✓ Tests:       1985 passed, 1985 total
```

## Acceptance Criteria Verification

### AC1: `npm run dev:endpoints:verify` green

**Note**: The actual script is `npm run api:catalog:verify`

```bash
npm run api:catalog:verify
```

**Expected Result**: ✅ Green output with no errors
```
✅ Endpoint wiring gate passed
✅ Endpoint catalog verified successfully
```

**Verification Points**:
- [x] Catalog generation successful
- [x] No git differences detected
- [x] `/api/patient/triage` listed in catalog
- [x] Endpoint marked as allowed orphan
- [x] Access role: `patient`
- [x] Methods: `POST`

### AC2: Jest contract tests pass

```bash
npm test -- lib/api/contracts/patient/__tests__/triage.test.ts
```

**Expected Result**: ✅ All 37 tests passing

**Test Coverage**:
- [x] Request Contract (7 tests)
  - Min/max length validation
  - Optional fields (locale, patientContext)
  - Boundary value testing
- [x] Response Contract (7 tests)
  - All tier values validated
  - All nextAction values validated
  - Invalid values rejected
  - Version enforcement
- [x] Rationale Bounds (4 tests)
  - Max 280 characters
  - Max 3 bullet points
  - Oversize rejection
- [x] RedFlags Allowlist (4 tests)
  - Valid flags accepted
  - Unknown flags rejected
  - Empty array accepted
- [x] Helper Functions (6 tests)
  - Validate/safe validate request
  - Validate/safe validate result
- [x] Edge Cases (4 tests)
  - Unicode support
  - Special characters
  - Empty/undefined optionals
- [x] Envelope Consistency (3 tests)
  - Version marker (`v1`)
  - Mandatory fields
  - Optional correlationId

### AC3: No unhandled errors / consistent envelope

**Manual Verification**:

1. **Check test output for unhandled errors**:
```bash
npm test 2>&1 | grep -i "unhandled\|uncaught\|error" | grep -v "✓\|expect"
```
Expected: No output (no unhandled errors)

2. **Verify envelope consistency in contract tests**:
```bash
npm test -- lib/api/contracts/patient/__tests__/triage.test.ts --verbose
```
Look for:
- ✅ "Response Envelope Consistency" test suite passes
- ✅ Version marker enforced
- ✅ Mandatory fields validated
- ✅ Optional correlationId supported

3. **Check response format**:
All responses follow this structure:
```typescript
{
  success: boolean,
  data?: TriageResultV1,
  error?: { code: string, message: string },
  requestId?: string  // correlationId
}
```

## Detailed Test Breakdown

### Request Validation Tests

```bash
# Test: Minimal valid request
npm test -- --testNamePattern="should validate minimal valid triage request"

# Test: Request with optional locale
npm test -- --testNamePattern="should validate request with optional locale"

# Test: Min/max length boundaries
npm test -- --testNamePattern="should accept request at exactly"
```

### Response Validation Tests

```bash
# Test: Complete triage result
npm test -- --testNamePattern="should validate complete triage result"

# Test: All tier values
npm test -- --testNamePattern="should validate all tier values"

# Test: All nextAction values
npm test -- --testNamePattern="should validate all nextAction values"
```

### Bounds and Allowlist Tests

```bash
# Test: Rationale max length
npm test -- --testNamePattern="should accept rationale at max length"

# Test: Bullet list limits
npm test -- --testNamePattern="should reject bullet list exceeding max bullets"

# Test: RedFlags allowlist
npm test -- --testNamePattern="should accept all allowlisted red flags"
```

## Endpoint Catalog Verification

### Check Catalog Entry

```bash
# View catalog entry for /api/patient/triage
grep -A 10 '"/api/patient/triage"' docs/api/endpoint-catalog.json
```

**Expected Output**:
```json
{
  "path": "/api/patient/triage",
  "methods": ["POST"],
  "file": "app/api/patient/triage/route.ts",
  "intent": null,
  "accessRole": "patient",
  "usedByCount": 0,
  "usedBy": [],
  "isOrphan": true,
  "isAllowedOrphan": true
}
```

**Verification Points**:
- [x] Path: `/api/patient/triage`
- [x] Methods: `["POST"]`
- [x] Access role: `"patient"`
- [x] Allowed orphan: `true` (intentionally not called by UI yet)

### Check Markdown Catalog

```bash
# View markdown catalog entry
grep "/api/patient/triage" docs/api/ENDPOINT_CATALOG.md
```

**Expected Output**:
```
| /api/patient/triage | POST | patient |  | 0 | app/api/patient/triage/route.ts |
```

## Regression Testing

Ensure no existing tests were broken:

```bash
# Run full test suite
npm test

# Expected: All 1985 tests pass
# Test Suites: 125 passed, 125 total
# Tests:       1985 passed, 1985 total
```

**Critical Test Suites**:
- [x] `lib/api/contracts/triage/__tests__/index.test.ts` (core contract tests)
- [x] `app/api/patient/triage/__tests__/route.test.ts` (endpoint tests)
- [x] `lib/api/contracts/patient/__tests__/triage.test.ts` (NEW - patient contract tests)
- [x] All other existing test suites

## Manual API Testing (Optional)

### Prerequisites
1. Start dev server: `npm run dev`
2. Get authentication cookie (login as pilot user)
3. Use PowerShell or curl

### Test 1: Valid Request

```powershell
# PowerShell
$body = @{ inputText = "I feel stressed and cannot sleep well" } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -Headers @{ Cookie = $cookie } `
  -SkipHttpErrorCheck
$response.StatusCode  # Expected: 200
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

```bash
# curl
curl -X POST http://localhost:3000/api/patient/triage \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"inputText": "I feel stressed and cannot sleep well"}'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "tier": "ASSESSMENT",
    "nextAction": "START_FUNNEL_A",
    "redFlags": [],
    "rationale": "...",
    "version": "v1",
    "correlationId": "..."
  },
  "requestId": "..."
}
```

### Test 2: Unauthenticated Request

```powershell
# PowerShell (no cookie)
$body = @{ inputText = "I feel stressed" } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -SkipHttpErrorCheck
$response.StatusCode  # Expected: 401
```

**Expected Response**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "requestId": "..."
}
```

### Test 3: Invalid Input (Too Short)

```powershell
# PowerShell
$body = @{ inputText = "short" } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -Headers @{ Cookie = $cookie } `
  -SkipHttpErrorCheck
$response.StatusCode  # Expected: 400
```

**Expected Response**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Request validation failed. Input must be 10-800 characters."
  },
  "requestId": "..."
}
```

### Test 4: Oversized Input

```powershell
# PowerShell
$longText = "x" * 900  # 900 characters
$body = @{ inputText = $longText } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -Headers @{ Cookie = $cookie } `
  -SkipHttpErrorCheck
$response.StatusCode  # Expected: 400 (moderately oversized)
```

```powershell
# Very large input
$veryLongText = "x" * 1700  # 1700 characters
$body = @{ inputText = $veryLongText } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -Headers @{ Cookie = $cookie } `
  -SkipHttpErrorCheck
$response.StatusCode  # Expected: 413 (payload too large)
```

## Common Issues and Troubleshooting

### Issue: Tests fail with "Cannot find module"
**Solution**: Ensure dependencies are installed
```bash
npm install
```

### Issue: Endpoint catalog verification fails
**Solution**: Regenerate catalog
```bash
npm run api:catalog
npm run api:catalog:verify
```

### Issue: Git diff detected in catalog
**Solution**: The catalog needs to be regenerated. This is expected if new endpoints were added. Run:
```bash
npm run api:catalog
git add docs/api
git commit -m "Update endpoint catalog"
```

### Issue: Some tests fail after changes
**Solution**: Check if contract schema was modified. Ensure all validators still match schema:
```bash
npm test -- lib/api/contracts/triage/__tests__/index.test.ts
npm test -- app/api/patient/triage/__tests__/route.test.ts
```

## Success Criteria Summary

All checks must pass:

- [x] ✅ AC1: `npm run api:catalog:verify` returns green
- [x] ✅ AC2: All 37 contract tests pass
- [x] ✅ AC3: No unhandled errors, consistent envelope
- [x] ✅ All 1985 tests in suite pass
- [x] ✅ Endpoint documented in catalog
- [x] ✅ No git differences in catalog after regeneration
- [x] ✅ TypeScript compilation successful
- [x] ✅ No linting errors

## Files to Review

### New Files
- `lib/api/contracts/patient/__tests__/triage.test.ts` - 37 contract tests
- `E6_6_10_IMPLEMENTATION_SUMMARY.md` - Implementation documentation
- `E6_6_10_VERIFICATION_GUIDE.md` - This file

### Existing Files (No Changes)
- `docs/api/endpoint-catalog.json` - Verified up-to-date
- `docs/api/ENDPOINT_CATALOG.md` - Verified up-to-date
- `app/api/patient/triage/route.ts` - Endpoint implementation
- `lib/api/contracts/triage/index.ts` - Contract schemas

## Next Steps After Verification

Once all acceptance criteria are verified:

1. ✅ Merge PR to main branch
2. ✅ Deploy to staging environment
3. ✅ Run manual API tests in staging
4. ✅ Verify endpoint catalog in deployed environment
5. ✅ Monitor telemetry for triage events
6. 🔜 (Optional) Migrate AMYComposer to use `/api/patient/triage` instead of `/api/amy/triage`

## Related Documentation

- `E6_6_4_IMPLEMENTATION_SUMMARY.md` - Patient triage endpoint implementation
- `E6_6_4_VERIFICATION_GUIDE.md` - Manual API testing guide
- `E6_6_2_IMPLEMENTATION_SUMMARY.md` - Triage contracts specification
- `E6_6_3_IMPLEMENTATION_SUMMARY.md` - Triage engine implementation
- `docs/api/ENDPOINT_CATALOG.md` - Full endpoint catalog
