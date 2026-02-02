# End-to-End Manual Test Script

**Version:** 1.0  
**Status:** Production  
**Last Updated:** 2026-02-01  
**Purpose:** Manual testing guide for E74 Funnel Definition and Publishing workflow

## Overview

This document provides a step-by-step manual test script for validating the complete funnel definition, validation, publishing, and assessment lifecycle in Rhythmologicum Connect.

Use this script to:
- Verify new developer environment setup
- Validate after major deployments
- Reproduce and diagnose issues
- Ensure end-to-end functionality

**Estimated Time:** 30-45 minutes

---

## Prerequisites

### 1. Environment Setup

- [ ] Local development environment running (`npm run dev`)
- [ ] Supabase connection configured
- [ ] Test user accounts created:
  - Admin/Clinician user (for Studio access)
  - Patient user (for assessment flow)

### 2. Environment Variables

```bash
# Check required environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Both should be set and valid.

### 3. Database State

```bash
# Verify migrations are applied
npm run db:migrate

# Verify E74 migrations are present
psql $DATABASE_URL -c "SELECT * FROM funnel_versions LIMIT 1;"
```

---

## Test Scenarios

## Scenario 1: Validate Existing Funnel Definitions

**Goal:** Verify all existing funnel definitions pass E74.1 validation

### Steps

1. **Run CI Validation Script**
   ```bash
   npm run verify:funnel-definitions
   ```

2. **Expected Output**
   ```
   🔍 Verifying funnel definitions against E74.1 canonical schema v1...
   
   Loading funnel versions from database...
   Found 4 funnel versions to validate
   
   Validating stress-assessment-a (version: default)...
   ✅ Valid
   
   Validating stress-assessment-b (version: default)...
   ✅ Valid
   
   Validating legacy-funnel-v1 (version: archived)...
   ✅ Valid
   
   Validating legacy-funnel-v2 (version: archived)...
   ✅ Valid
   
   Summary:
   - Total versions: 4
   - Valid: 4
   - Invalid: 0
   
   ✅ All funnel definitions are valid
   Exit code: 0
   ```

3. **Acceptance Criteria**
   - [ ] Script exits with code 0
   - [ ] All funnel versions marked as valid
   - [ ] No validation errors reported

4. **If Failures Occur**
   - Note the error codes (e.g., `DEF_DUPLICATE_QUESTION_ID`)
   - Map to rule ID (e.g., R-E74-007)
   - Fix issues in database or migration
   - Re-run script

---

## Scenario 2: Create and Validate a Draft

**Goal:** Create a draft funnel version and validate it using E74.1 validators

### Steps

1. **Login as Admin/Clinician**
   - Navigate to: `http://localhost:3000/clinician/login`
   - Login with admin/clinician credentials

2. **Navigate to Studio**
   - Go to: `http://localhost:3000/clinician/funnels`
   - Select an existing funnel (e.g., "Stress Assessment A")

3. **Create Draft**
   - Click "Create Draft" button
   - Confirm draft creation

4. **Expected Response**
   ```json
   {
     "success": true,
     "data": {
       "draft": {
         "id": "uuid-here",
         "status": "draft",
         "is_default": false,
         "parent_version_id": "uuid-parent",
         "validation_errors": null
       }
     }
   }
   ```

5. **Verify Draft in Database**
   ```bash
   psql $DATABASE_URL -c "
   SELECT id, status, is_default, validation_errors 
   FROM funnel_versions 
   WHERE status = 'draft' 
   ORDER BY created_at DESC 
   LIMIT 1;
   "
   ```

6. **Acceptance Criteria**
   - [ ] Draft created with `status = "draft"`
   - [ ] Draft has `is_default = false`
   - [ ] Draft has `parent_version_id` pointing to source version
   - [ ] Draft appears in Studio UI

---

## Scenario 3: Edit and Validate Draft

**Goal:** Edit a draft and run validation

### Steps

1. **Edit Draft** (via Studio UI or API)
   - Add a new question to a step
   - Example change:
     ```json
     {
       "id": "q-new",
       "key": "new_question",
       "type": "text",
       "label": "What is your primary concern?",
       "required": true
     }
     ```

2. **Save Draft**
   - Click "Save Draft" in Studio
   - Verify save success

3. **Run Validation**
   - Click "Validate" button
   - Or POST to: `/api/admin/studio/funnels/{slug}/drafts/{draftId}/validate`

4. **Expected Response (Valid)**
   ```json
   {
     "success": true,
     "data": {
       "valid": true,
       "errors": [],
       "validated_at": "2026-02-01T10:00:00Z"
     }
   }
   ```

5. **Verify Validation Stored in Database**
   ```bash
   psql $DATABASE_URL -c "
   SELECT id, validation_errors, last_validated_at 
   FROM funnel_versions 
   WHERE id = 'draft-id-here';
   "
   ```

6. **Acceptance Criteria**
   - [ ] Validation runs successfully
   - [ ] `validation_errors` is empty array or null
   - [ ] `last_validated_at` is updated
   - [ ] UI shows "Validation Passed" status

---

## Scenario 4: Attempt to Publish Invalid Draft

**Goal:** Verify publish gate blocks invalid drafts

### Steps

1. **Create Invalid Draft**
   - Edit draft to introduce validation error
   - Example: Duplicate question ID
     ```json
     // Step 1
     { "id": "q1", "key": "question_1", ... }
     // Step 2
     { "id": "q1", "key": "question_2", ... }  // ❌ Duplicate ID
     ```

2. **Save Invalid Draft**
   - Save changes

3. **Attempt to Publish**
   - Click "Publish" button
   - Or POST to: `/api/admin/studio/funnels/{slug}/drafts/{draftId}/publish`

4. **Expected Response (Blocked)**
   ```json
   {
     "success": false,
     "error": {
       "code": "PUBLISH_WITH_VALIDATION_ERRORS",
       "message": "Cannot publish draft with validation errors",
       "details": {
         "validationErrors": [
           {
             "code": "DEF_DUPLICATE_QUESTION_ID",
             "message": "Duplicate question ID found: q1",
             "path": ["questionnaire_config", "steps", 1, "questions", 0],
             "ruleId": "R-E74-007"
           }
         ]
       }
     }
   }
   ```

5. **Acceptance Criteria**
   - [ ] Publish is blocked
   - [ ] Error code is `PUBLISH_WITH_VALIDATION_ERRORS`
   - [ ] Error message includes "violates R-E74.3-003"
   - [ ] Validation errors are listed
   - [ ] Draft remains in "draft" status

---

## Scenario 5: Publish Valid Draft

**Goal:** Successfully publish a validated draft to production

### Steps

1. **Fix Validation Errors**
   - Correct the duplicate question ID
   - Save draft

2. **Re-validate**
   - Click "Validate" button
   - Verify validation passes

3. **Publish Draft**
   - Click "Publish" button
   - Confirm publish action
   - Or POST to: `/api/admin/studio/funnels/{slug}/drafts/{draftId}/publish`

4. **Expected Response (Success)**
   ```json
   {
     "success": true,
     "data": {
       "publishedVersion": {
         "id": "uuid-here",
         "status": "published",
         "is_default": true,
         "published_at": "2026-02-01T10:10:00Z",
         "published_by": "uuid-user"
       },
       "historyEntry": {
         "id": "uuid-history",
         "published_by": "uuid-user",
         "diff": {
           "questionnaire_config": {
             "questions_added": 1
           }
         }
       }
     }
   }
   ```

5. **Verify in Database**
   ```bash
   # Check published version
   psql $DATABASE_URL -c "
   SELECT id, status, is_default, published_at, published_by
   FROM funnel_versions 
   WHERE id = 'published-version-id';
   "
   
   # Check publish history
   psql $DATABASE_URL -c "
   SELECT * FROM funnel_publish_history 
   ORDER BY published_at DESC 
   LIMIT 1;
   "
   ```

6. **Verify Old Default Unset**
   ```bash
   psql $DATABASE_URL -c "
   SELECT COUNT(*) 
   FROM funnel_versions 
   WHERE funnel_id = 'funnel-id-here' 
     AND is_default = true;
   "
   # Should return: 1 (only the new published version)
   ```

7. **Acceptance Criteria**
   - [ ] Version status is "published"
   - [ ] Version has `is_default = true`
   - [ ] Version has `published_at` and `published_by` set
   - [ ] Previous default version has `is_default = false`
   - [ ] Publish history entry created with diff
   - [ ] Only ONE version has `is_default = true` for this funnel

---

## Scenario 6: Patient Assessment Flow (Start/Resume)

**Goal:** Verify patient can start and resume assessments

### Steps

1. **Login as Patient**
   - Navigate to: `http://localhost:3000/patient/login`
   - Login with patient credentials

2. **Start New Assessment**
   - Navigate to: `http://localhost:3000/patient/funnels/stress-assessment-a`
   - Click "Start Assessment"
   - Or POST to: `/api/funnels/stress-assessment-a/assessments`

3. **Expected Response (CREATE)**
   ```json
   {
     "success": true,
     "data": {
       "assessment": {
         "id": "assess-123",
         "patient_id": "patient-456",
         "funnel": "stress-assessment-a",
         "status": "in_progress",
         "started_at": "2026-02-01T11:00:00Z",
         "completed_at": null,
         "current_step_id": "step-1"
       },
       "currentStep": {
         "step_id": "step-1",
         "title": "General Well-being",
         "order_index": 0
       },
       "behavior": "CREATE"
     }
   }
   ```

4. **Answer Some Questions**
   - Answer questions in step 1
   - Save answers via: POST `/api/assessment-answers/save`
   - Navigate to step 2

5. **Close Browser / Simulate Disconnect**
   - Close browser tab
   - Wait 30 seconds

6. **Resume Assessment**
   - Re-open: `http://localhost:3000/patient/funnels/stress-assessment-a`
   - Or POST to: `/api/funnels/stress-assessment-a/assessments`

7. **Expected Response (RESUME)**
   ```json
   {
     "success": true,
     "data": {
       "assessment": {
         "id": "assess-123",  // Same ID as before
         "status": "in_progress",
         "current_step_id": "step-2"  // Where we left off
       },
       "currentStep": {
         "step_id": "step-2",
         "title": "Sleep & Energy",
         "order_index": 1
       },
       "behavior": "RESUME"
     }
   }
   ```

8. **Acceptance Criteria**
   - [ ] Same assessment ID returned
   - [ ] `behavior` is "RESUME"
   - [ ] `current_step_id` is step-2 (where we left off)
   - [ ] Previous answers are still saved
   - [ ] HTTP status is 200 OK (not 201 Created)

---

## Scenario 7: Force New Assessment

**Goal:** Verify forceNew parameter completes old assessment and creates new

### Steps

1. **With Existing In-Progress Assessment**
   - From Scenario 6, we have assess-123 in progress on step-2

2. **Request Force New**
   - POST to: `/api/funnels/stress-assessment-a/assessments`
   - Body: `{ "forceNew": true }`

3. **Expected Response (FORCE_NEW)**
   ```json
   {
     "success": true,
     "data": {
       "assessment": {
         "id": "assess-789",  // NEW assessment ID
         "status": "in_progress",
         "current_step_id": "step-1"  // Starting from beginning
       },
       "currentStep": {
         "step_id": "step-1",
         "title": "General Well-being",
         "order_index": 0
       },
       "behavior": "FORCE_NEW"
     }
   }
   ```

4. **Verify Old Assessment Completed**
   ```bash
   psql $DATABASE_URL -c "
   SELECT id, status, completed_at 
   FROM assessments 
   WHERE id = 'assess-123';
   "
   # Should show: status = 'completed', completed_at = NOW()
   ```

5. **Acceptance Criteria**
   - [ ] New assessment created with different ID
   - [ ] New assessment starts at step-1
   - [ ] `behavior` is "FORCE_NEW"
   - [ ] HTTP status is 201 Created
   - [ ] Old assessment has `status = "completed"`
   - [ ] Old assessment has `completed_at` set

---

## Scenario 8: Parallel Request Race Condition

**Goal:** Verify unique constraint prevents duplicate assessments

### Steps

1. **Delete All In-Progress Assessments**
   ```bash
   psql $DATABASE_URL -c "
   DELETE FROM assessments 
   WHERE patient_id = 'patient-456' 
     AND funnel = 'stress-assessment-a' 
     AND completed_at IS NULL;
   "
   ```

2. **Send Two Parallel Requests**
   - Use a tool like `curl` or Postman
   - Send two identical POST requests simultaneously:
     ```bash
     # Terminal 1
     curl -X POST http://localhost:3000/api/funnels/stress-assessment-a/assessments \
       -H "Authorization: Bearer $PATIENT_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{}' &
     
     # Terminal 2 (immediately after)
     curl -X POST http://localhost:3000/api/funnels/stress-assessment-a/assessments \
       -H "Authorization: Bearer $PATIENT_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{}'
     ```

3. **Expected Behavior**
   - Both requests complete successfully
   - Both return the SAME assessment ID
   - One returns 201 Created (CREATE)
   - Other returns 200 OK (RESUME) or 201 Created (depending on timing)

4. **Verify Database State**
   ```bash
   psql $DATABASE_URL -c "
   SELECT COUNT(*) 
   FROM assessments 
   WHERE patient_id = 'patient-456' 
     AND funnel = 'stress-assessment-a' 
     AND completed_at IS NULL;
   "
   # Should return: 1 (only ONE in-progress assessment)
   ```

5. **Acceptance Criteria**
   - [ ] Only ONE in-progress assessment exists
   - [ ] Both requests return same assessment ID
   - [ ] No database constraint violation errors
   - [ ] No duplicate assessments created

---

## Scenario 9: CI/CD Verification Scripts

**Goal:** Run all E74 verification scripts and ensure they pass

### Steps

1. **Run E74.2 Canonical v1 Verification**
   ```bash
   npm run verify:e74-2
   ```
   - [ ] Exit code: 0
   - [ ] All schema_version checks pass
   - [ ] No violations reported

2. **Run E74.3 Guardrails Verification**
   ```bash
   npm run verify:e74-3
   ```
   - [ ] Exit code: 0
   - [ ] All 9 active rules pass (1 deferred)
   - [ ] No violations reported

3. **Run E74.6 Patient Funnels Verification**
   ```bash
   npm run verify:e74-6
   ```
   - [ ] Exit code: 0
   - [ ] RLS policies verified
   - [ ] Triggers verified
   - [ ] No violations reported

4. **Run E74.7 Idempotency Verification**
   ```bash
   npm run verify:e74-7
   ```
   - [ ] Exit code: 0
   - [ ] Unique index verified
   - [ ] API implementation verified
   - [ ] No violations reported

5. **Overall Acceptance**
   - [ ] All verification scripts pass
   - [ ] No violations with "violates R-XYZ" format
   - [ ] All error codes map to rule IDs

---

## Scenario 10: Error Code Traceability

**Goal:** Verify all validation errors include rule IDs

### Steps

1. **Create Invalid Questionnaire Config**
   ```json
   {
     "schema_version": "v0",  // ❌ Invalid version
     "steps": []              // ❌ Empty steps
   }
   ```

2. **Run Validation**
   ```bash
   node -e "
   const { validateQuestionnaireConfig, formatValidationErrors } = require('./lib/validators/funnelDefinition.ts');
   const config = { schema_version: 'v0', steps: [] };
   const result = validateQuestionnaireConfig(config);
   console.log(formatValidationErrors(result.errors));
   "
   ```

3. **Expected Output**
   ```
   [DEF_INVALID_SCHEMA_VERSION] violates R-E74-001: Schema version must be "v1", got "v0"
   [DEF_EMPTY_STEPS] violates R-E74-003: Steps array is empty
   ```

4. **Acceptance Criteria**
   - [ ] Error format includes error code in brackets
   - [ ] Error format includes "violates R-XYZ"
   - [ ] Error message is descriptive
   - [ ] Error code maps to correct rule ID in RULES_VS_CHECKS_MATRIX.md

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot connect to database"
**Solution:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify Supabase is running
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/
```

#### Issue: "Verification script fails with missing index"
**Solution:**
```bash
# Run migrations
npm run db:migrate

# Or manually apply E74 migrations
psql $DATABASE_URL -f supabase/migrations/20260201163126_e74_7_assessment_idempotency.sql
```

#### Issue: "Publish blocked with validation errors"
**Solution:**
1. Run validation: POST `/api/admin/studio/funnels/{slug}/drafts/{draftId}/validate`
2. Check `validation_errors` response
3. Fix errors based on error codes (see DEFINITION_V1.md)
4. Re-validate
5. Retry publish

#### Issue: "Duplicate assessments created"
**Solution:**
```bash
# Verify unique index exists
psql $DATABASE_URL -c "
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'assessments' 
  AND indexname LIKE '%in_progress%';
"

# If missing, run E74.7 migration
npm run db:migrate
```

---

## Success Criteria

All scenarios should pass with these outcomes:

- ✅ All CI verification scripts pass
- ✅ Funnel definitions validate successfully
- ✅ Invalid drafts are blocked from publishing
- ✅ Valid drafts publish successfully
- ✅ Publish creates audit trail with diff
- ✅ Patient assessments start correctly
- ✅ Patient assessments resume correctly
- ✅ Force new completes old assessment
- ✅ No duplicate assessments created
- ✅ All error codes include rule IDs

---

## Reporting Results

After completing the test script, document results:

**Template:**
```
E74 End-to-End Test Results
Date: YYYY-MM-DD
Tester: [Name]
Environment: [local/staging/production]

Scenario 1: Validate Existing Funnel Definitions
Status: [PASS/FAIL]
Notes: [Any observations]

Scenario 2: Create and Validate a Draft
Status: [PASS/FAIL]
Notes: [Any observations]

[... continue for all scenarios ...]

Overall Status: [PASS/FAIL]
Issues Found: [List any issues]
```

---

## Related Documentation

- **Funnel Definition Schema:** `/docs/funnels/DEFINITION_V1.md`
- **Start/Resume Semantics:** `/docs/funnels/START_RESUME_SEMANTICS.md`
- **Studio Publishing:** `/docs/funnels/STUDIO_PUBLISH_GATES.md`
- **Rules vs Checks Matrix:** `/docs/RULES_VS_CHECKS_MATRIX.md`

---

## Version History

- **1.0 (2026-02-01):** Initial test script
  - 10 test scenarios covering full lifecycle
  - Database verification steps
  - CI/CD integration checks
  - Troubleshooting guide
