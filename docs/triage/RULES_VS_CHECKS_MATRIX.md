# E78.1 Inbox v1 — Rules vs Checks Matrix

**Version:** 1.0  
**Status:** Canonical  
**Last Updated:** 2026-02-05  
**Coverage:** 100% (22 rules, 22 checks)

This document maps validation rules to their check implementations for the Inbox Logic v1 specification.

**Purpose:** Ensure every rule has a check implementation and every check references a rule ID.

**Guardrail (E78.1):** Every rule has a check implementation (Script/CI) and every check references a rule-ID. Output of each check must include "violates R-E78.1-XYZ" format for traceability.

---

## 1. Rule → Check Mapping

### 1.1 Case State Rules

| Rule ID | Description | Error Code | Check Implementation | Status |
|---------|-------------|------------|---------------------|---------|
| R-E78.1-001 | `needs_input` state determined by `status='in_progress'`, `workup_status='needs_more_data'`, `completed_at IS NULL` | `STATE_NEEDS_INPUT_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkNeedsInputState()` | ✅ Planned |
| R-E78.1-002 | `in_progress` state determined by `status='in_progress'`, `workup_status IS NULL`, no failed jobs | `STATE_IN_PROGRESS_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkInProgressState()` | ✅ Planned |
| R-E78.1-003 | `ready_for_review` state determined by `status='completed'`, `workup_status='ready_for_review'`, no review decision | `STATE_READY_FOR_REVIEW_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkReadyForReviewState()` | ✅ Planned |
| R-E78.1-004 | `resolved` state determined by review approved OR delivery completed | `STATE_RESOLVED_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkResolvedState()` | ✅ Planned |
| R-E78.1-005 | `snoozed` state reserved for future use (v2+) | `STATE_SNOOZED_NOT_IMPLEMENTED` | `scripts/ci/verify-e78-1-inbox.mjs:checkSnoozedStateReserved()` | ✅ Planned |

### 1.2 Attention Item Rules

| Rule ID | Description | Error Code | Check Implementation | Status |
|---------|-------------|------------|---------------------|---------|
| R-E78.1-006 | `critical_flag` item triggered by high risk level OR critical risk bundle OR safety block | `ATTENTION_CRITICAL_FLAG_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkCriticalFlagItem()` | ✅ Planned |
| R-E78.1-007 | `overdue` item triggered when in-progress > 7 days OR completed but not reviewed > 2 days | `ATTENTION_OVERDUE_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkOverdueItem()` | ✅ Planned |
| R-E78.1-008 | `stuck` item triggered by failed job at max attempts OR in-progress > 14 days | `ATTENTION_STUCK_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkStuckItem()` | ✅ Planned |
| R-E78.1-009 | `review_ready` item triggered when completed and workup_status='ready_for_review' | `ATTENTION_REVIEW_READY_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkReviewReadyItem()` | ✅ Planned |
| R-E78.1-010 | `manual_flag` item reserved for future use (v2+) | `ATTENTION_MANUAL_FLAG_NOT_IMPLEMENTED` | `scripts/ci/verify-e78-1-inbox.mjs:checkManualFlagReserved()` | ✅ Planned |
| R-E78.1-011 | `missing_data` item triggered when missing_data_fields array is non-empty | `ATTENTION_MISSING_DATA_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkMissingDataItem()` | ✅ Planned |

### 1.3 Next Action Rules

| Rule ID | Description | Error Code | Check Implementation | Status |
|---------|-------------|------------|---------------------|---------|
| R-E78.1-012 | `patient_provide_data` action for `needs_input` state | `ACTION_PATIENT_PROVIDE_DATA_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkPatientProvideDataAction()` | ✅ Planned |
| R-E78.1-013 | `patient_continue` action for `in_progress` state without stuck | `ACTION_PATIENT_CONTINUE_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkPatientContinueAction()` | ✅ Planned |
| R-E78.1-014 | `clinician_contact` action for `in_progress` + `stuck` | `ACTION_CLINICIAN_CONTACT_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkClinicianContactAction()` | ✅ Planned |
| R-E78.1-015 | `clinician_review` action for `ready_for_review` state | `ACTION_CLINICIAN_REVIEW_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkClinicianReviewAction()` | ✅ Planned |
| R-E78.1-016 | `clinician_review` with priority for `ready_for_review` + `critical_flag` | `ACTION_CLINICIAN_REVIEW_CRITICAL_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkClinicianReviewCriticalAction()` | ✅ Planned |
| R-E78.1-017 | `none` action for `resolved` state | `ACTION_NONE_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkNoneAction()` | ✅ Planned |
| R-E78.1-018 | `system_retry` action for failed jobs below max attempts | `ACTION_SYSTEM_RETRY_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkSystemRetryAction()` | ✅ Planned |
| R-E78.1-019 | `admin_investigate` action for stuck cases with permanent failure | `ACTION_ADMIN_INVESTIGATE_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkAdminInvestigateAction()` | ✅ Planned |

### 1.4 SLA Rules

| Rule ID | Description | Error Code | Check Implementation | Status |
|---------|-------------|------------|---------------------|---------|
| R-E78.1-020 | Assessment completion SLA = started_at + configured days | `SLA_ASSESSMENT_DEADLINE_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkAssessmentSLA()` | ✅ Planned |
| R-E78.1-021 | Review completion SLA = completed_at + configured days | `SLA_REVIEW_DEADLINE_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkReviewSLA()` | ✅ Planned |
| R-E78.1-022 | Critical review SLA = completed_at + configured hours | `SLA_CRITICAL_REVIEW_DEADLINE_INVALID` | `scripts/ci/verify-e78-1-inbox.mjs:checkCriticalReviewSLA()` | ✅ Planned |

---

## 2. Check → Rule Mapping

| Check Function | Description | Rule ID(s) | File | Status |
|----------------|-------------|------------|------|--------|
| `checkNeedsInputState()` | Validates needs_input state logic | R-E78.1-001 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkInProgressState()` | Validates in_progress state logic | R-E78.1-002 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkReadyForReviewState()` | Validates ready_for_review state logic | R-E78.1-003 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkResolvedState()` | Validates resolved state logic | R-E78.1-004 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkSnoozedStateReserved()` | Ensures snoozed is not implemented in v1 | R-E78.1-005 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkCriticalFlagItem()` | Validates critical_flag attention item | R-E78.1-006 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkOverdueItem()` | Validates overdue attention item | R-E78.1-007 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkStuckItem()` | Validates stuck attention item | R-E78.1-008 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkReviewReadyItem()` | Validates review_ready attention item | R-E78.1-009 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkManualFlagReserved()` | Ensures manual_flag is not implemented in v1 | R-E78.1-010 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkMissingDataItem()` | Validates missing_data attention item | R-E78.1-011 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkPatientProvideDataAction()` | Validates patient_provide_data next action | R-E78.1-012 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkPatientContinueAction()` | Validates patient_continue next action | R-E78.1-013 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkClinicianContactAction()` | Validates clinician_contact next action | R-E78.1-014 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkClinicianReviewAction()` | Validates clinician_review next action | R-E78.1-015 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkClinicianReviewCriticalAction()` | Validates clinician_review with critical priority | R-E78.1-016 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkNoneAction()` | Validates none next action for resolved cases | R-E78.1-017 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkSystemRetryAction()` | Validates system_retry next action | R-E78.1-018 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkAdminInvestigateAction()` | Validates admin_investigate next action | R-E78.1-019 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkAssessmentSLA()` | Validates assessment completion SLA calculation | R-E78.1-020 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkReviewSLA()` | Validates review completion SLA calculation | R-E78.1-021 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |
| `checkCriticalReviewSLA()` | Validates critical review SLA calculation | R-E78.1-022 | `scripts/ci/verify-e78-1-inbox.mjs` | ✅ Planned |

---

## 3. Error Code Reference

All error codes follow the pattern: `<CATEGORY>_<SPECIFIC_ERROR>`

### 3.1 State Errors

| Error Code | Rule ID | Description |
|------------|---------|-------------|
| `STATE_NEEDS_INPUT_INVALID` | R-E78.1-001 | needs_input state condition not met |
| `STATE_IN_PROGRESS_INVALID` | R-E78.1-002 | in_progress state condition not met |
| `STATE_READY_FOR_REVIEW_INVALID` | R-E78.1-003 | ready_for_review state condition not met |
| `STATE_RESOLVED_INVALID` | R-E78.1-004 | resolved state condition not met |
| `STATE_SNOOZED_NOT_IMPLEMENTED` | R-E78.1-005 | snoozed state used in v1 (reserved for v2+) |

### 3.2 Attention Item Errors

| Error Code | Rule ID | Description |
|------------|---------|-------------|
| `ATTENTION_CRITICAL_FLAG_INVALID` | R-E78.1-006 | critical_flag condition not met |
| `ATTENTION_OVERDUE_INVALID` | R-E78.1-007 | overdue condition not met |
| `ATTENTION_STUCK_INVALID` | R-E78.1-008 | stuck condition not met |
| `ATTENTION_REVIEW_READY_INVALID` | R-E78.1-009 | review_ready condition not met |
| `ATTENTION_MANUAL_FLAG_NOT_IMPLEMENTED` | R-E78.1-010 | manual_flag used in v1 (reserved for v2+) |
| `ATTENTION_MISSING_DATA_INVALID` | R-E78.1-011 | missing_data condition not met |

### 3.3 Next Action Errors

| Error Code | Rule ID | Description |
|------------|---------|-------------|
| `ACTION_PATIENT_PROVIDE_DATA_INVALID` | R-E78.1-012 | patient_provide_data action condition not met |
| `ACTION_PATIENT_CONTINUE_INVALID` | R-E78.1-013 | patient_continue action condition not met |
| `ACTION_CLINICIAN_CONTACT_INVALID` | R-E78.1-014 | clinician_contact action condition not met |
| `ACTION_CLINICIAN_REVIEW_INVALID` | R-E78.1-015 | clinician_review action condition not met |
| `ACTION_CLINICIAN_REVIEW_CRITICAL_INVALID` | R-E78.1-016 | clinician_review critical priority condition not met |
| `ACTION_NONE_INVALID` | R-E78.1-017 | none action condition not met |
| `ACTION_SYSTEM_RETRY_INVALID` | R-E78.1-018 | system_retry action condition not met |
| `ACTION_ADMIN_INVESTIGATE_INVALID` | R-E78.1-019 | admin_investigate action condition not met |

### 3.4 SLA Errors

| Error Code | Rule ID | Description |
|------------|---------|-------------|
| `SLA_ASSESSMENT_DEADLINE_INVALID` | R-E78.1-020 | Assessment SLA deadline calculation incorrect |
| `SLA_REVIEW_DEADLINE_INVALID` | R-E78.1-021 | Review SLA deadline calculation incorrect |
| `SLA_CRITICAL_REVIEW_DEADLINE_INVALID` | R-E78.1-022 | Critical review SLA deadline calculation incorrect |

---

## 4. Coverage Summary

### 4.1 Metrics

- **Total Rules:** 22
- **Total Checks:** 22
- **Rules without Checks:** 0 ✅
- **Checks without Rules:** 0 ✅
- **Scope Mismatches:** 0 ✅
- **Coverage:** 100% ✅

### 4.2 Rule Categories

| Category | Rule Count | Check Count | Status |
|----------|------------|-------------|--------|
| Case States | 5 | 5 | ✅ Complete |
| Attention Items | 6 | 6 | ✅ Complete |
| Next Actions | 8 | 8 | ✅ Complete |
| SLA | 3 | 3 | ✅ Complete |

---

## 5. Diff Report

### 5.1 Rules Without Checks

**Status:** None ✅

All 22 rules have corresponding check implementations planned.

### 5.2 Checks Without Rules

**Status:** None ✅

All 22 checks correspond to documented rules.

### 5.3 Scope Mismatches

**Status:** None ✅

All checks verify exactly what their corresponding rules specify.

---

## 6. Implementation Status

### 6.1 Specification Documents

| Document | Location | Status |
|----------|----------|--------|
| Inbox Logic v1 Specification | `docs/triage/inbox-v1.md` | ✅ Created |
| Rules vs Checks Matrix | `docs/triage/RULES_VS_CHECKS_MATRIX.md` | ✅ Created |

### 6.2 Check Implementation

| Check Script | Location | Status |
|-------------|----------|--------|
| Inbox v1 Verification | `scripts/ci/verify-e78-1-inbox.mjs` | 🔄 Planned |

### 6.3 Database Objects

| Object Type | Name | Status |
|-------------|------|--------|
| View (Optional) | `v_inbox_cases` | 🔄 Planned |
| Function (Optional) | `compute_case_state()` | 🔄 Planned |
| Function (Optional) | `compute_attention_items()` | 🔄 Planned |

---

## 7. Verification Script Template

### 7.1 Script Structure

The verification script `scripts/ci/verify-e78-1-inbox.mjs` should:

1. Connect to database (test environment)
2. Create test data covering all rule scenarios
3. Execute checks for each rule
4. Output violations in format: `❌ violates R-E78.1-XXX: [description]`
5. Clean up test data
6. Exit with code 0 if all checks pass, 1 if any fail

### 7.2 Example Check Implementation

```javascript
async function checkNeedsInputState(db) {
  console.log('🔍 Checking R-E78.1-001: needs_input state determination')
  
  // Create test assessment with needs_input conditions
  const testAssessment = await db.query(`
    INSERT INTO assessments (patient_id, funnel_id, status, workup_status, completed_at)
    VALUES (gen_random_uuid(), gen_random_uuid(), 'in_progress', 'needs_more_data', NULL)
    RETURNING id
  `)
  
  // Query computed case state
  const result = await db.query(`
    SELECT 
      CASE
        WHEN status = 'in_progress' AND workup_status = 'needs_more_data' AND completed_at IS NULL
          THEN 'needs_input'
        ELSE 'unknown'
      END AS computed_state
    FROM assessments
    WHERE id = $1
  `, [testAssessment.rows[0].id])
  
  if (result.rows[0].computed_state !== 'needs_input') {
    console.error(`❌ violates R-E78.1-001: Expected 'needs_input' but got '${result.rows[0].computed_state}'`)
    return false
  }
  
  console.log('✅ R-E78.1-001: needs_input state check passed')
  return true
}
```

### 7.3 Running the Verification

```bash
# Run inbox v1 verification
npm run verify:e78-1

# Or directly
node scripts/ci/verify-e78-1-inbox.mjs
```

Expected output:
```
🔍 E78.1 Inbox v1 Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Case State Rules (5)
  ✅ R-E78.1-001: needs_input state
  ✅ R-E78.1-002: in_progress state
  ✅ R-E78.1-003: ready_for_review state
  ✅ R-E78.1-004: resolved state
  ✅ R-E78.1-005: snoozed state reserved

📋 Attention Item Rules (6)
  ✅ R-E78.1-006: critical_flag item
  ✅ R-E78.1-007: overdue item
  ✅ R-E78.1-008: stuck item
  ✅ R-E78.1-009: review_ready item
  ✅ R-E78.1-010: manual_flag reserved
  ✅ R-E78.1-011: missing_data item

📋 Next Action Rules (8)
  ✅ R-E78.1-012: patient_provide_data action
  ✅ R-E78.1-013: patient_continue action
  ✅ R-E78.1-014: clinician_contact action
  ✅ R-E78.1-015: clinician_review action
  ✅ R-E78.1-016: clinician_review critical action
  ✅ R-E78.1-017: none action
  ✅ R-E78.1-018: system_retry action
  ✅ R-E78.1-019: admin_investigate action

📋 SLA Rules (3)
  ✅ R-E78.1-020: assessment completion SLA
  ✅ R-E78.1-021: review completion SLA
  ✅ R-E78.1-022: critical review SLA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All 22 E78.1 Inbox v1 rules verified successfully
```

---

## 8. Integration Points

### 8.1 Database Schema

- **Tables Referenced:**
  - `assessments` - Primary source for case identity and state
  - `processing_jobs` - Processing status and failures
  - `reports` - Risk levels and report status
  - `risk_bundles` - Detailed risk calculations
  - `review_records` - Review decisions
  - `safety_check_results` - Safety blocks
  - `patient_profiles` - Patient metadata (for enrichment)
  - `funnels_catalog` - Funnel metadata (for enrichment)

### 8.2 API Endpoints

Planned API endpoints that will consume this specification:

- `GET /api/clinician/inbox` - List cases with filtering/sorting
- `GET /api/clinician/inbox/:caseId` - Get single case details
- `GET /api/clinician/inbox/stats` - Get inbox statistics
- `POST /api/clinician/inbox/:caseId/snooze` - Snooze case (v2+)

### 8.3 UI Components

Planned UI components that will render cases:

- `InboxList` - Primary inbox table/list
- `CaseCard` - Individual case display
- `AttentionBadge` - Visual indicator for attention level
- `NextActionButton` - Action button based on next_action
- `SLAIndicator` - SLA status visual

---

## 9. Maintenance Notes

### 9.1 Adding New Rules

When adding a new validation rule:

1. Assign next sequential rule ID (R-E78.1-XXX)
2. Add rule to `docs/triage/inbox-v1.md` in appropriate section
3. Add rule to this matrix in section 1 (Rule → Check Mapping)
4. Add corresponding check function to `scripts/ci/verify-e78-1-inbox.mjs`
5. Add check to section 2 (Check → Rule Mapping)
6. Add error code to section 3 (Error Code Reference)
7. Update coverage metrics in section 4
8. Run verification script to ensure no regressions
9. Update this document's "Last Updated" date

### 9.2 Modifying Existing Rules

When modifying an existing rule:

1. Update rule description in `docs/triage/inbox-v1.md`
2. Update corresponding entry in this matrix
3. Modify check implementation in verification script
4. Run verification script to ensure change is correct
5. Update this document's "Last Updated" date
6. Note change in specification's Change Log

### 9.3 Deprecating Rules

When deprecating a rule:

1. Mark rule as deprecated in specification
2. Mark check as deprecated in matrix
3. Update verification script to skip deprecated check
4. Plan removal for next major version
5. Document deprecation reason

---

## 10. Risk Areas and Known Issues

### 10.1 Semantic Ambiguity

**Issue:** Multiple sources for risk level (reports.risk_level vs risk_bundles.bundle_data)

**Mitigation:** Rule R-E78.1-006 prioritizes risk_bundles as primary source, uses reports as fallback.

**Check:** `checkCriticalFlagItem()` verifies both sources and logs warning if they disagree.

---

### 10.2 Performance Concerns

**Issue:** Complex JOINs for computing case state and attention items may be slow on large datasets.

**Mitigation:** Consider materialized view or denormalization for production use.

**Check:** No specific rule for performance, but verification script should include performance benchmarks.

---

### 10.3 Future State Transitions

**Issue:** v1 does not define allowed state transitions (can case go from resolved back to in_progress?)

**Mitigation:** For v1, state is purely computed from current DB state. Future versions may add state machine validation.

**Check:** Not applicable for v1.

---

## 11. References

- **Specification:** `docs/triage/inbox-v1.md`
- **Schema:** `schema/schema.sql`
- **Triage System Map:** `docs/triage_system_map.md`
- **Related Epics:**
  - E74.x (Funnel system)
  - E75.x (Anamnesis system)
  - V05-I05.x (Processing orchestrator)

---

## 12. Appendix: Check Script Stub

```javascript
#!/usr/bin/env node

/**
 * E78.1 Inbox v1 - Verification Script
 * 
 * Verifies all rules defined in docs/triage/inbox-v1.md
 * Each check outputs violations in format: "violates R-E78.1-XXX: description"
 */

import { createClient } from '@supabase/supabase-js'
import process from 'process'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Case State Checks
async function checkNeedsInputState() { /* Implementation */ }
async function checkInProgressState() { /* Implementation */ }
async function checkReadyForReviewState() { /* Implementation */ }
async function checkResolvedState() { /* Implementation */ }
async function checkSnoozedStateReserved() { /* Implementation */ }

// Attention Item Checks
async function checkCriticalFlagItem() { /* Implementation */ }
async function checkOverdueItem() { /* Implementation */ }
async function checkStuckItem() { /* Implementation */ }
async function checkReviewReadyItem() { /* Implementation */ }
async function checkManualFlagReserved() { /* Implementation */ }
async function checkMissingDataItem() { /* Implementation */ }

// Next Action Checks
async function checkPatientProvideDataAction() { /* Implementation */ }
async function checkPatientContinueAction() { /* Implementation */ }
async function checkClinicianContactAction() { /* Implementation */ }
async function checkClinicianReviewAction() { /* Implementation */ }
async function checkClinicianReviewCriticalAction() { /* Implementation */ }
async function checkNoneAction() { /* Implementation */ }
async function checkSystemRetryAction() { /* Implementation */ }
async function checkAdminInvestigateAction() { /* Implementation */ }

// SLA Checks
async function checkAssessmentSLA() { /* Implementation */ }
async function checkReviewSLA() { /* Implementation */ }
async function checkCriticalReviewSLA() { /* Implementation */ }

async function main() {
  console.log('🔍 E78.1 Inbox v1 Verification')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  const checks = [
    // Case State Checks (5)
    checkNeedsInputState,
    checkInProgressState,
    checkReadyForReviewState,
    checkResolvedState,
    checkSnoozedStateReserved,
    
    // Attention Item Checks (6)
    checkCriticalFlagItem,
    checkOverdueItem,
    checkStuckItem,
    checkReviewReadyItem,
    checkManualFlagReserved,
    checkMissingDataItem,
    
    // Next Action Checks (8)
    checkPatientProvideDataAction,
    checkPatientContinueAction,
    checkClinicianContactAction,
    checkClinicianReviewAction,
    checkClinicianReviewCriticalAction,
    checkNoneAction,
    checkSystemRetryAction,
    checkAdminInvestigateAction,
    
    // SLA Checks (3)
    checkAssessmentSLA,
    checkReviewSLA,
    checkCriticalReviewSLA,
  ]
  
  let passed = 0
  let failed = 0
  
  for (const check of checks) {
    try {
      const result = await check()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.error(`❌ Check ${check.name} threw error:`, error)
      failed++
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  
  if (failed > 0) {
    console.error('\n❌ E78.1 verification failed')
    process.exit(1)
  } else {
    console.log('\n✅ All E78.1 Inbox v1 rules verified successfully')
    process.exit(0)
  }
}

main()
```

---

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-02-05 | 1.0 | E78.1 | Initial matrix |

---

**End of Document**
