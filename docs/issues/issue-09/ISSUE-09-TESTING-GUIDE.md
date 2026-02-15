# ISSUE-09-TESTING-GUIDE

## Testing Guide for Issue 9: Clinician Colleague Mode

**Version:** 1.0  
**Date:** 2026-02-09

---

## Overview

This guide provides comprehensive testing procedures for the Clinician Colleague Mode feature. Testing covers:

1. Automated guardrail validation
2. API endpoint testing
3. Security and access control validation
4. Integration with existing features
5. Performance and error handling

---

## Prerequisites

### Required Setup

1. **Running Application:**
   ```bash
   npm run dev:studio
   ```

2. **Database:**
   - Supabase instance running
   - `amy_chat_messages` table exists
   - `clinician_patient_assignments` table populated

3. **Test Users:**
   - At least one clinician user with role
   - At least one patient user
   - Clinician-patient assignment created

4. **Test Data:**
   - Patient profile created
   - Optional: Consult note created for patient
   - Optional: Anamnesis entries for patient

---

## 1. Automated Guardrail Validation

### Run Verification Script

```bash
npm run verify:issue-9
```

### Expected Output

```
🔍 Issue 9: Running Clinician Colleague Mode Guardrails...

✅ Checks performed: 6
   Rules: R-09.1, R-09.2, R-09.3, R-09.4, R-09.5, R-09.6

✅ All validations passed!
✅ Rule-Check matrix is complete
```

### What This Validates

- ✅ R-09.1: Clinician role requirement
- ✅ R-09.2: Clinician colleague mode usage
- ✅ R-09.3: Response length limitations
- ✅ R-09.4: Patient record linkage
- ✅ R-09.5: Conversation mode metadata
- ✅ R-09.6: Patient assignment verification

### Troubleshooting

If checks fail:
1. Review the violation message
2. Check the referenced file
3. Fix the issue
4. Re-run verification

---

## 2. API Endpoint Testing

### 2.1 POST /api/clinician/chat

#### Test 1: Successful Request

**Request:**
```bash
curl -X POST http://localhost:3000/api/clinician/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=<YOUR_TOKEN>" \
  -d '{
    "message": "Welche weiteren Befunde brauchen wir für die Differenzialdiagnose?",
    "patient_id": "550e8400-e29b-41d4-a716-446655440000",
    "consult_note_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "reply": "Basierend auf der Consult Note würde ich folgende Befunde empfehlen:\n\nHOCH PRIORITÄT:\n- ...",
    "messageId": "550e8400-e29b-41d4-a716-446655440002"
  }
}
```

**Validation:**
- ✅ Status code: 200
- ✅ Response contains `success: true`
- ✅ Reply is a non-empty string
- ✅ Reply is structured and concise (not conversational)
- ✅ messageId is a valid UUID

#### Test 2: Missing patient_id

**Request:**
```bash
curl -X POST http://localhost:3000/api/clinician/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=<YOUR_TOKEN>" \
  -d '{
    "message": "Test message"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Missing required fields: message, patient_id"
  }
}
```

**Validation:**
- ✅ Status code: 400
- ✅ Error code: VALIDATION_FAILED

#### Test 3: Empty message

**Request:**
```bash
curl -X POST http://localhost:3000/api/clinician/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=<YOUR_TOKEN>" \
  -d '{
    "message": "   ",
    "patient_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Message cannot be empty"
  }
}
```

**Validation:**
- ✅ Status code: 400

#### Test 4: Message too long

**Request:**
```bash
# Generate a message > 2000 characters
MESSAGE=$(python3 -c "print('A' * 2001)")

curl -X POST http://localhost:3000/api/clinician/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=<YOUR_TOKEN>" \
  -d "{
    \"message\": \"$MESSAGE\",
    \"patient_id\": \"550e8400-e29b-41d4-a716-446655440000\"
  }"
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Message must not exceed 2000 characters"
  }
}
```

**Validation:**
- ✅ Status code: 400

---

### 2.2 GET /api/clinician/chat

#### Test 1: Successful Request

**Request:**
```bash
curl http://localhost:3000/api/clinician/chat?patient_id=550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: sb-auth-token=<YOUR_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "...",
        "role": "user",
        "content": "Welche Befunde fehlen?",
        "created_at": "2026-02-09T12:00:00Z",
        "metadata": {
          "conversationMode": "clinician_colleague",
          "clinicianUserId": "...",
          "patientId": "..."
        }
      },
      {
        "id": "...",
        "role": "assistant",
        "content": "...",
        "created_at": "2026-02-09T12:00:05Z",
        "metadata": {
          "conversationMode": "clinician_colleague",
          "model": "claude-sonnet-4-5-20250929"
        }
      }
    ]
  }
}
```

**Validation:**
- ✅ Status code: 200
- ✅ Messages array returned
- ✅ All messages have `conversationMode: 'clinician_colleague'`
- ✅ Messages ordered chronologically
- ✅ No patient mode messages mixed in

#### Test 2: Missing patient_id

**Request:**
```bash
curl http://localhost:3000/api/clinician/chat \
  -H "Cookie: sb-auth-token=<YOUR_TOKEN>"
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Missing required parameter: patient_id"
  }
}
```

**Validation:**
- ✅ Status code: 400

---

## 3. Security & Access Control Testing

### Test 1: Unauthenticated Access

**Request:**
```bash
curl -X POST http://localhost:3000/api/clinician/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test",
    "patient_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Validation:**
- ✅ Status code: 401
- ✅ No data leaked

### Test 2: Non-Clinician Access (Patient User)

**Setup:**
1. Authenticate as a patient user (not clinician role)

**Request:**
```bash
curl -X POST http://localhost:3000/api/clinician/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=<PATIENT_TOKEN>" \
  -d '{
    "message": "Test",
    "patient_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Clinician role required"
  }
}
```

**Validation:**
- ✅ Status code: 403
- ✅ Patient cannot access clinician endpoint

### Test 3: Clinician Without Patient Assignment

**Setup:**
1. Authenticate as clinician A
2. Try to access patient assigned to clinician B (not A)

**Request:**
```bash
curl -X POST http://localhost:3000/api/clinician/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=<CLINICIAN_A_TOKEN>" \
  -d '{
    "message": "Test",
    "patient_id": "<PATIENT_ASSIGNED_TO_B>"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this patient"
  }
}
```

**Validation:**
- ✅ Status code: 403
- ✅ Assignment verification enforced

### Test 4: Non-existent Patient

**Request:**
```bash
curl -X POST http://localhost:3000/api/clinician/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=<YOUR_TOKEN>" \
  -d '{
    "message": "Test",
    "patient_id": "00000000-0000-0000-0000-000000000000"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Patient profile not found"
  }
}
```

**Validation:**
- ✅ Status code: 404

---

## 4. Integration Testing

### Test 1: Patient Context Inclusion

**Setup:**
1. Create a consult note for the patient
2. Add some anamnesis entries

**Request:**
```bash
curl -X POST http://localhost:3000/api/clinician/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=<YOUR_TOKEN>" \
  -d '{
    "message": "Welche Informationen aus der Consult Note sind besonders wichtig?",
    "patient_id": "550e8400-e29b-41d4-a716-446655440000",
    "consult_note_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

**Expected Behavior:**
- ✅ LLM response references consult note content
- ✅ Response is contextual to patient case
- ✅ Missing data aligned with what's in consult note

**Manual Validation:**
1. Check server logs for context injection
2. Verify LLM receives patient context
3. Confirm response is case-specific

### Test 2: Message Persistence

**Test Flow:**
1. Send a message via POST
2. Retrieve history via GET
3. Verify message appears in history

**Validation:**
- ✅ User message saved
- ✅ Assistant message saved
- ✅ Metadata includes `conversationMode: 'clinician_colleague'`
- ✅ Metadata includes `clinicianUserId`
- ✅ Timestamps accurate

### Test 3: Conversation Mode Isolation

**Test Flow:**
1. Patient sends message in patient mode
2. Clinician sends message in clinician mode about same patient
3. Retrieve clinician chat history
4. Verify only clinician mode messages returned

**Validation:**
- ✅ Patient mode messages excluded from clinician chat history
- ✅ Conversation modes properly isolated

---

## 5. Response Quality Testing

### Test 1: Response Length

**Setup:**
- Send various questions
- Measure response length

**Expected:**
- ✅ Responses typically 300-800 tokens
- ✅ Shorter than patient mode responses
- ✅ Concise, structured format

### Test 2: Response Structure

**Example Expected Response:**
```
Basierend auf der Anamnese:

HYPOTHESEN:
- Stress-induzierte Schlafstörung
- Mögliche autonome Dysregulation

MISSING DATA:
- Objektive Schlafmessung
- HRV-Langzeitdaten

NEXT STEPS:
- 7-Tage-Schlaftagebuch
- HRV-Monitoring über 48h
```

**Validation:**
- ✅ Structured sections (Hypothesen, Missing Data, Next Steps)
- ✅ Bullet points, not conversational
- ✅ Clinical language, not patient-friendly
- ✅ No definitive diagnoses

### Test 3: Prompt Differentiation

**Test Flow:**
1. Same question to patient mode vs clinician mode
2. Compare responses

**Expected Differences:**
- Patient mode: Conversational, empathetic, educational
- Clinician mode: Structured, concise, clinical

---

## 6. Error Handling Testing

### Test 1: Anthropic API Failure

**Setup:**
- Temporarily set invalid API key or disable Anthropic

**Expected Behavior:**
- ✅ Graceful fallback message
- ✅ Error logged
- ✅ No crash
- ✅ User receives informative error

### Test 2: Database Connection Issues

**Setup:**
- Temporarily disable database connection

**Expected Behavior:**
- ✅ Appropriate error response
- ✅ No sensitive data leaked
- ✅ Error logged for debugging

---

## 7. Performance Testing

### Test 1: Response Time

**Metrics:**
- First message (cold start): < 10 seconds
- Subsequent messages: < 5 seconds

**Test:**
```bash
time curl -X POST http://localhost:3000/api/clinician/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=<YOUR_TOKEN>" \
  -d '{
    "message": "Test",
    "patient_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Test 2: Concurrent Requests

**Test:**
- Send 10 concurrent requests from different clinicians
- Verify all succeed
- Check for race conditions

**Expected:**
- ✅ All requests succeed
- ✅ No data corruption
- ✅ Proper isolation between clinicians

---

## 8. Database Validation

### Test 1: Message Storage

**SQL Query:**
```sql
SELECT 
  id, 
  user_id, 
  role, 
  content, 
  metadata->>'conversationMode' as mode,
  metadata->>'clinicianUserId' as clinician,
  created_at
FROM amy_chat_messages
WHERE metadata->>'conversationMode' = 'clinician_colleague'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- ✅ All clinician messages have correct metadata
- ✅ `conversationMode` = 'clinician_colleague'
- ✅ `clinicianUserId` populated
- ✅ Proper foreign key references

### Test 2: RLS Policy Enforcement

**Test:**
1. Authenticate as clinician A
2. Try to query messages for patient assigned to clinician B

**SQL Query (via Supabase client):**
```sql
SELECT * FROM amy_chat_messages
WHERE user_id = '<patient_assigned_to_B_user_id>';
```

**Expected:**
- ✅ Query returns empty (RLS blocks access)
- ✅ No error (just no results)

---

## 9. Regression Testing

### Existing Features to Verify

1. **Patient Chat (E73.8):**
   - ✅ Patient mode still works
   - ✅ No interference from clinician mode
   
2. **Consult Notes (Issue 5):**
   - ✅ Consult note generation still works
   - ✅ Consult notes readable by clinician chat
   
3. **Anamnesis (E75.1):**
   - ✅ Anamnesis entries still accessible
   - ✅ Anamnesis included in patient context

---

## 10. Manual Testing Checklist

### Setup
- [ ] Application running on localhost
- [ ] Clinician user created with role
- [ ] Patient user created
- [ ] Clinician-patient assignment exists
- [ ] Test consult note created
- [ ] Test anamnesis entries created

### API Testing
- [ ] Successful POST request
- [ ] Successful GET request
- [ ] 401 without authentication
- [ ] 403 without clinician role
- [ ] 403 without patient assignment
- [ ] 400 with missing patient_id
- [ ] 400 with empty message
- [ ] 400 with message too long
- [ ] 404 with non-existent patient

### Response Quality
- [ ] Responses are structured
- [ ] Responses are concise
- [ ] Responses include hypotheses
- [ ] Responses list missing data
- [ ] Responses suggest next steps
- [ ] No definitive diagnoses

### Data Validation
- [ ] Messages stored in database
- [ ] Metadata includes conversationMode
- [ ] Metadata includes clinicianUserId
- [ ] RLS policies enforced
- [ ] Conversation modes isolated

### Integration
- [ ] Patient context included
- [ ] Consult note content referenced
- [ ] Anamnesis entries referenced
- [ ] No interference with patient mode

---

## Test Reports

### Template for Test Execution Report

```markdown
## Test Execution Report

**Date:** 2026-02-09
**Tester:** [Name]
**Environment:** [localhost / staging / production]

### Summary
- Total Tests: XX
- Passed: XX
- Failed: XX
- Skipped: XX

### Failed Tests
1. Test Name: [Name]
   - Expected: [Description]
   - Actual: [Description]
   - Root Cause: [Analysis]
   - Fix: [Action items]

### Performance Metrics
- Average response time: X.XX seconds
- Max response time: X.XX seconds
- Error rate: X.XX%

### Recommendations
- [List any issues or improvements]
```

---

## Continuous Integration

### Add to CI Pipeline

```yaml
# .github/workflows/ci.yml
- name: Verify Issue 9 (Clinician Colleague Mode)
  run: npm run verify:issue-9
```

### Pre-commit Hook

```bash
#!/bin/bash
# .githooks/pre-commit
npm run verify:issue-9
if [ $? -ne 0 ]; then
  echo "Issue 9 guardrails failed. Commit aborted."
  exit 1
fi
```

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check authentication token
   - Verify token hasn't expired
   - Ensure correct cookie header

2. **403 Forbidden (non-clinician)**
   - Verify user has clinician role
   - Check `auth.users.raw_app_meta_data.role`

3. **403 Forbidden (no assignment)**
   - Verify assignment exists in `clinician_patient_assignments`
   - Check `clinician_user_id` and `patient_user_id` match

4. **Empty response from LLM**
   - Check Anthropic API key
   - Verify API quota/limits
   - Check server logs for errors

5. **Messages not filtering by mode**
   - Verify metadata structure
   - Check `conversationMode` spelling
   - Confirm getChatHistory filter logic

---

## Conclusion

This testing guide provides comprehensive coverage of the Clinician Colleague Mode feature. All tests should pass before considering the feature production-ready.

For questions or issues, refer to:
- [ISSUE-09-IMPLEMENTATION-SUMMARY.md](./ISSUE-09-IMPLEMENTATION-SUMMARY.md)
- [ISSUE-09-RULES-VS-CHECKS-MATRIX.md](./ISSUE-09-RULES-VS-CHECKS-MATRIX.md)

---

**Last Updated:** 2026-02-09  
**Version:** 1.0
