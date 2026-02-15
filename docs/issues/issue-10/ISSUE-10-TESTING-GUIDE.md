# Issue 10 — Clinical Intake Synthesis: Testing Guide

## Overview

This document describes the testing strategy and test cases for the Clinical Intake Synthesis feature (Issue 10).

## Test Files

### Unit Tests

**Location:** `lib/clinicalIntake/__tests__/validation.test.ts`

**Coverage:**
- Quality validation functions
- All 7 rule checks (R-I10-1.1 through R-I10-4.2)
- Edge cases and error conditions

**Running Tests:**
```bash
npm test lib/clinicalIntake/__tests__/validation.test.ts
```

## Test Cases

### Validation Tests

#### ✅ Valid Intake Test
- **Rule:** All rules
- **Input:** Complete, valid intake with proper structure
- **Expected:** `isValid: true`, no errors

#### ❌ Colloquial Language Test (R-I10-1.1)
- **Rule:** R-I10-1.1
- **Input:** Summary with "super", "okay", "alles gut"
- **Expected:** Error, `isValid: false`

#### ❌ Short Summary Test (R-I10-1.2)
- **Rule:** R-I10-1.2
- **Input:** Summary with < 50 characters
- **Expected:** Error, `isValid: false`

#### ❌ Empty Structured Data Test (R-I10-2.1)
- **Rule:** R-I10-2.1
- **Input:** Empty/minimal structured data
- **Expected:** Error, `isValid: false`

#### ❌ Invalid Array Data Test (R-I10-2.2)
- **Rule:** R-I10-2.2
- **Input:** Array field with non-string values
- **Expected:** Error, `isValid: false`

#### ⚠️ Chat Language Test (R-I10-3.1)
- **Rule:** R-I10-3.1
- **Input:** Summary with "Patient sagt", "im Chat"
- **Expected:** Warning (not error)

#### ⚠️ Vague Red Flags Test (R-I10-4.1)
- **Rule:** R-I10-4.1
- **Input:** Red flags < 10 characters
- **Expected:** Warning

#### ℹ️ Uncertainty Tracking Test (R-I10-4.2)
- **Rule:** R-I10-4.2
- **Input:** Intake with uncertainties array
- **Expected:** Info message with count

## Integration Tests

### API Endpoint Tests (Manual Testing)

#### Generate Intake Endpoint

**Test Case 1: Successful Generation**
```bash
POST /api/clinical-intake/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "triggerReason": "manual"
}

Expected Response: 200 OK
{
  "success": true,
  "data": {
    "intake": { ... },
    "isNew": true
  }
}
```

**Test Case 2: Insufficient Messages**
```bash
POST /api/clinical-intake/generate
# User with < 3 messages

Expected Response: 400 Bad Request
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "Need at least 3 messages for intake generation"
  }
}
```

**Test Case 3: Unauthorized Access**
```bash
POST /api/clinical-intake/generate
# No auth token

Expected Response: 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### Get Latest Intake Endpoint

**Test Case 1: User Has Intake**
```bash
GET /api/clinical-intake/latest
Authorization: Bearer <token>

Expected Response: 200 OK
{
  "success": true,
  "data": {
    "intake": { ... }
  }
}
```

**Test Case 2: User Has No Intake**
```bash
GET /api/clinical-intake/latest
Authorization: Bearer <token>

Expected Response: 200 OK
{
  "success": true,
  "data": {
    "intake": null
  }
}
```

### Database Tests

#### RLS Policy Tests

**Patient Access:**
- ✅ Patient can SELECT their own intakes
- ✅ Patient can INSERT their own intakes
- ✅ Patient can UPDATE their own draft intakes
- ❌ Patient cannot SELECT other patients' intakes
- ❌ Patient cannot UPDATE active/superseded intakes

**Clinician Access:**
- ✅ Clinician can SELECT assigned patients' intakes
- ❌ Clinician cannot SELECT unassigned patients' intakes
- ❌ Clinician cannot INSERT/UPDATE patient intakes (future: may change)

**Admin Access:**
- ✅ Admin can SELECT intakes in their organization
- ❌ Admin cannot SELECT intakes in other organizations

## CI/CD Verification

### Automated Checks

**Command:** `npm run verify:issue-10`

**Checks:**
1. Migration file exists
2. Database table created
3. Enum types defined
4. RLS policies enabled
5. Types exported correctly
6. API endpoints exist and export handlers
7. Prompt defined with required content
8. Validation functions implemented
9. All 7 rules have checks
10. Documentation exists

**Expected Result:** All checks pass ✅

## Manual Testing Workflow

### Prerequisites
1. Running Supabase instance
2. Database migrations applied
3. Authenticated test user
4. Sample chat messages in `amy_chat_messages`

### Test Workflow

#### 1. Setup Test Data
```sql
-- Insert test messages
INSERT INTO amy_chat_messages (user_id, role, content)
VALUES
  ('user-uuid', 'user', 'Ich habe seit heute morgen Kopfschmerzen.'),
  ('user-uuid', 'assistant', 'Können Sie die Kopfschmerzen genauer beschreiben?'),
  ('user-uuid', 'user', 'Frontal, pochend, seit 2 Stunden.');
```

#### 2. Generate Intake
```bash
curl -X POST http://localhost:3000/api/clinical-intake/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"triggerReason": "manual"}'
```

#### 3. Verify Generation
- Check response for `success: true`
- Verify `structured_data` has expected fields
- Verify `clinical_summary` is physician-readable
- Check no colloquial language
- Verify database record created

#### 4. Retrieve Intake
```bash
curl http://localhost:3000/api/clinical-intake/latest \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 5. Verify Retrieval
- Check response returns latest intake
- Verify all fields present
- Check timestamps are correct

## Quality Metrics

## How to Verify (SSOT + Safety 2.1)

1. Patient latest intake endpoint
  - `GET /api/patient/intake/latest`
  - Expect `success: true` and `intake` with `version_number`, `clinical_summary`, `structured_data`.

2. Clinician intake endpoints
  - `GET /api/clinical-intake/patient/[patientId]/latest`
  - `GET /api/clinical-intake/patient/[patientId]/history`
  - `GET /api/clinical-intake/patient/[patientId]/version/1`

3. Manual intake trigger (dev/preview)
  - Open patient dialog on dev or preview host.
  - Click `Generate Intake (Dev)` and confirm a new intake version appears in history.

4. Safety enforcement
  - Create a test conversation with a Level A red flag (e.g. prolonged chest pain).
  - Confirm patient chat is blocked with a Level A banner.
  - Confirm clinician intake card shows Level A badge and red flag list.

5. SSOT validation
  - Verify no intake reads/writes use `anamnesis_entries` for clinical intake data.
  - Intake UI should read from `clinical_intakes` only.

6. Safety policy + override
   - Edit policy in `config/cre/safety-policy.v1.json` and redeploy.
   - Use `PATCH /api/clinical-intake/patient/[patientId]/latest` with:
     `{"levelOverride":"B","chatActionOverride":"warn","reason":"Manual review"}`
   - Confirm Studio shows override reason + effective Level/Action.
   - Confirm patient chat uses override action (no hard stop when warn).

### Code Coverage Goals
- Validation functions: 100%
- API endpoints: 80%
- Error handling: 90%

### Quality Checks Coverage
- All 7 rules have automated checks: ✅
- All checks reference rules: ✅
- Zero drift in rules vs checks: ✅

## Known Limitations

1. **No Frontend Tests:** UI components not yet implemented
2. **Manual API Testing:** Integration tests require manual execution
3. **LLM Output Variability:** Claude responses may vary, affecting test consistency
4. **Database Dependency:** Tests require running Supabase instance

## Future Test Enhancements

1. **Automated Integration Tests**
   - API endpoint tests with test database
   - RLS policy verification tests
   - End-to-end workflow tests

2. **LLM Mocking**
   - Mock Claude API responses for consistent tests
   - Test error handling scenarios

3. **Performance Tests**
   - Load testing for intake generation
   - Concurrent request handling
   - Database query performance

4. **Frontend Tests**
   - Component rendering tests
   - User interaction tests
   - Accessibility tests

## Troubleshooting

### Tests Not Running
**Issue:** `jest: not found`
**Solution:** Ensure dependencies installed: `npm install`

### Database Connection Errors
**Issue:** `ECONNREFUSED` to Supabase
**Solution:** Ensure Supabase is running: `supabase start`

### Migration Errors
**Issue:** Table already exists
**Solution:** Reset database: `npm run db:reset`

### RLS Policy Failures
**Issue:** Row level security blocking access
**Solution:** Verify user authentication and policies in migration

## References

- `ISSUE-10-IMPLEMENTATION-SUMMARY.md` - Implementation details
- `ISSUE-10-RULES-VS-CHECKS-MATRIX.md` - Rules and checks mapping
- `lib/clinicalIntake/validation.ts` - Validation implementation
- `lib/types/clinicalIntake.ts` - Type definitions
