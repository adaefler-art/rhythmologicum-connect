# ISSUE-09-RULES-VS-CHECKS-MATRIX

## Issue 9: Clinician Colleague Mode (Arzt ↔ PAT Rückfragen)

**Status:** ✅ Complete  
**Date:** 2026-02-09

---

## Rules ↔ Checks Matrix

| Rule ID | Rule Description | Check Implementation | Status |
|---------|-----------------|---------------------|--------|
| R-09.1 | Clinician chat endpoint must require clinician role | `checkR091()` in `scripts/ci/verify-issue-9-colleague-mode.mjs` | ✅ Implemented |
| R-09.2 | Clinician chat must use clinician_colleague conversation mode | `checkR092()` in `scripts/ci/verify-issue-9-colleague-mode.mjs` | ✅ Implemented |
| R-09.3 | Responses in clinician mode must be shorter than patient mode (max 800 tokens) | `checkR093()` in `scripts/ci/verify-issue-9-colleague-mode.mjs` | ✅ Implemented |
| R-09.4 | Clinician chat must be linked to patient record (patient_id required) | `checkR094()` in `scripts/ci/verify-issue-9-colleague-mode.mjs` | ✅ Implemented |
| R-09.5 | Chat messages must be stored with conversationMode metadata | `checkR095()` in `scripts/ci/verify-issue-9-colleague-mode.mjs` | ✅ Implemented |
| R-09.6 | Clinician must have patient assignment to access chat | `checkR096()` in `scripts/ci/verify-issue-9-colleague-mode.mjs` | ✅ Implemented |

---

## Check Details

### R-09.1: Clinician Role Requirement

**Implementation:** `checkR091()` in `scripts/ci/verify-issue-9-colleague-mode.mjs`

**What it checks:**
- Verifies `hasClinicianRole()` is called in the API endpoint
- Checks for proper 403 Forbidden response when non-clinician attempts access
- Ensures ErrorCode.FORBIDDEN is used

**File checked:**
- `apps/rhythm-studio-ui/app/api/clinician/chat/route.ts`

**Output format:**
```
[violates R-09.1] Missing hasClinicianRole() check in clinician chat endpoint
[violates R-09.1] Missing 403 Forbidden response for non-clinician access
```

---

### R-09.2: Clinician Colleague Mode Usage

**Implementation:** `checkR092()` in `scripts/ci/verify-issue-9-colleague-mode.mjs`

**What it checks:**
- Verifies `getClinicianColleaguePrompt()` is imported and used
- Checks that `conversationMode: 'clinician_colleague'` is set in metadata
- Ensures correct prompt is used for LLM calls

**File checked:**
- `apps/rhythm-studio-ui/app/api/clinician/chat/route.ts`

**Output format:**
```
[violates R-09.2] Missing getClinicianColleaguePrompt import/usage
[violates R-09.2] Missing conversationMode: clinician_colleague metadata
```

---

### R-09.3: Response Length Limitation

**Implementation:** `checkR093()` in `scripts/ci/verify-issue-9-colleague-mode.mjs`

**What it checks:**
- Verifies `MAX_TOKENS` constant is defined
- Checks that MAX_TOKENS is <= 800 for focused, structured responses
- Ensures documentation mentions shorter/focused responses

**Rationale:**
- Patient mode uses 500 tokens for conversational responses
- Clinician mode uses 800 tokens for structured, concise professional communication
- Shorter responses align with clinician workflow (hypothesis, missing data, next steps)

**File checked:**
- `apps/rhythm-studio-ui/app/api/clinician/chat/route.ts`

**Output format:**
```
[violates R-09.3] MAX_TOKENS too high (1200), should be <= 800 for focused responses
[violates R-09.3] Missing documentation about shorter/focused responses
```

---

### R-09.4: Patient Record Linkage

**Implementation:** `checkR094()` in `scripts/ci/verify-issue-9-colleague-mode.mjs`

**What it checks:**
- Verifies `patient_id` field is present in request handling
- Checks for validation that `patient_id` is required
- Ensures conversation stays case-bound

**File checked:**
- `apps/rhythm-studio-ui/app/api/clinician/chat/route.ts`

**Output format:**
```
[violates R-09.4] Missing patient_id field in request handling
[violates R-09.4] Missing validation for required patient_id field
```

---

### R-09.5: Conversation Mode Metadata

**Implementation:** `checkR095()` in `scripts/ci/verify-issue-9-colleague-mode.mjs`

**What it checks:**
- Verifies `saveMessage()` function exists
- Checks that `conversationMode: 'clinician_colleague'` is set
- Ensures `clinicianUserId` is tracked for audit trail

**Purpose:**
- Enables filtering messages by conversation mode
- Allows separation of patient-facing vs clinician-facing conversations
- Provides audit trail of which clinician asked which questions

**File checked:**
- `apps/rhythm-studio-ui/app/api/clinician/chat/route.ts`

**Output format:**
```
[violates R-09.5] conversationMode not set in message metadata
[violates R-09.5] Missing clinicianUserId tracking in message metadata
```

---

### R-09.6: Patient Assignment Verification

**Implementation:** `checkR096()` in `scripts/ci/verify-issue-9-colleague-mode.mjs`

**What it checks:**
- Verifies query to `clinician_patient_assignments` table
- Checks for proper `.eq('clinician_user_id')` and `.eq('patient_user_id')` conditions
- Ensures 403 response when clinician doesn't have access to patient

**Security rationale:**
- Prevents unauthorized access to patient data
- Enforces organizational boundaries
- Complies with HIPAA/GDPR requirements for access control

**File checked:**
- `apps/rhythm-studio-ui/app/api/clinician/chat/route.ts`

**Output format:**
```
[violates R-09.6] Missing clinician_patient_assignments access check
[violates R-09.6] Missing proper assignment verification query
[violates R-09.6] Missing access denied error response
```

---

## Running the Checks

### Execute all checks:
```bash
node scripts/ci/verify-issue-9-colleague-mode.mjs
```

### Expected output (success):
```
🔍 Issue 9: Running Clinician Colleague Mode Guardrails...

✅ Checks performed: 6
   Rules: R-09.1, R-09.2, R-09.3, R-09.4, R-09.5, R-09.6

✅ All validations passed!
✅ Rule-Check matrix is complete
```

### Expected output (failure):
```
🔍 Issue 9: Running Clinician Colleague Mode Guardrails...

✅ Checks performed: 6
   Rules: R-09.1, R-09.2, R-09.3, R-09.4, R-09.5, R-09.6

❌ Found 2 violation(s):

   [violates R-09.2] Missing getClinicianColleaguePrompt import/usage
   File: apps/rhythm-studio-ui/app/api/clinician/chat/route.ts

   [violates R-09.5] conversationMode not set in message metadata
   File: apps/rhythm-studio-ui/app/api/clinician/chat/route.ts
```

---

## Matrix Verification

The script automatically verifies bidirectional traceability:

- **Rules without checks:** Lists any rule IDs that don't have implementing checks
- **Checks without rules:** Lists any checks that don't reference a defined rule

This ensures every rule is validated and every check serves a documented requirement.

---

## Integration with CI/CD

Add to `.github/workflows/` or `package.json` scripts:

```json
{
  "scripts": {
    "verify:issue-9": "node scripts/ci/verify-issue-9-colleague-mode.mjs"
  }
}
```

Or in GitHub Actions:

```yaml
- name: Validate Issue 9 (Clinician Colleague Mode)
  run: node scripts/ci/verify-issue-9-colleague-mode.mjs
```

Exit code:
- `0` = All checks passed
- `1` = One or more violations found

---

## Files Involved

| Component | File Path | Rules |
|-----------|-----------|-------|
| API Endpoint | `apps/rhythm-studio-ui/app/api/clinician/chat/route.ts` | All (R-09.1 - R-09.6) |
| LLM Prompts | `lib/llm/prompts.ts` | R-09.2 |
| Database Schema | `schema/schema.sql` (amy_chat_messages) | R-09.5 |
| RLS Policies | `schema/schema.sql` (RLS on amy_chat_messages) | R-09.6 |

---

## Diff Report

### Rules without Check
*(None)*

### Checks without Rule
*(None)*

### Scope Mismatch
*(None)*

---

## Maintenance

When adding new rules:
1. Add rule to `RULES` object in `scripts/ci/verify-issue-9-colleague-mode.mjs`
2. Implement check function `checkR09X()`
3. Add check function call in `runChecks()`
4. Update this matrix document
5. Run `node scripts/ci/verify-issue-9-colleague-mode.mjs` to verify

When modifying existing checks:
1. Update check function implementation
2. Update this matrix document if behavior changes
3. Re-run validation to ensure no regressions

---

## Acceptance Criteria Mapping

| Acceptance Criterion | Rules | Implementation |
|---------------------|-------|----------------|
| Arzt kann Rückfragen stellen | R-09.1, R-09.4, R-09.6 | POST /api/clinician/chat endpoint with auth + assignment checks |
| Antworten unterscheiden sich klar vom Patient Mode | R-09.2, R-09.3, R-09.5 | Different prompt, shorter responses, separate conversation mode |
| Gespräch bleibt am Fall gebunden | R-09.4 | patient_id required, linked to consult notes and anamnesis |
| Nutzung desselben Patient Records + Consult Note | R-09.4 | getPatientContext() fetches consult notes and anamnesis |
| Kürzere, strukturierte Antworten | R-09.3 | MAX_TOKENS = 800, focused on hypotheses/missing data/next steps |
| Fokus auf Hypothesen, Missing Data, Next Steps | R-09.2 | getClinicianColleaguePrompt() system prompt |

---

## Security Considerations

1. **Authentication:** All requests require valid authentication (R-09.1)
2. **Authorization:** Clinician role required (R-09.1)
3. **Access Control:** Verified via clinician_patient_assignments (R-09.6)
4. **Audit Trail:** clinicianUserId tracked in metadata (R-09.5)
5. **Data Isolation:** RLS policies enforce row-level security
6. **Input Validation:** Message length limits, required fields (R-09.4)

---

## Future Enhancements

Potential additions to the guardrails:

- **R-09.7:** Rate limiting per clinician (prevent API abuse)
- **R-09.8:** Logging of all clinician questions for compliance audit
- **R-09.9:** Maximum conversation length (prevent endless loops)
- **R-09.10:** Response time SLA monitoring (< 5 seconds)
