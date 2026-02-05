# E78.2 Rules vs Checks Matrix

**Epic:** E78.2 — SSOT Aggregation v1: triage_cases_v1  
**Version:** 1.0  
**Date:** 2026-02-05  
**Status:** Complete

## Overview

This document provides complete bidirectional mapping between implementation rules and verification checks for the `triage_cases_v1` database view. Every rule has a corresponding check, and every check references a rule ID.

## 1. Rules → Checks Mapping

| Rule ID | Rule Description | Check ID | Check Function | Error Code |
|---------|------------------|----------|----------------|------------|
| R-E78.2-001 | View `triage_cases_v1` must exist and be queryable | E78.2-001 | `checkViewExists()` | E78.2-001 |
| R-E78.2-002 | All required columns must be present | E78.2-002 | `checkRequiredColumns()` | E78.2-002 |
| R-E78.2-003 | No direct risk/score fields exposed (guardrail) | E78.2-003 | `checkForbiddenColumns()` | E78.2-003 |
| R-E78.2-004 | View must produce deterministic output | E78.2-004 | `checkDeterminism()` | E78.2-004 |
| R-E78.2-005 | Query performance must be acceptable (<5s) | E78.2-005 | `checkPerformance()` | E78.2-005 |
| R-E78.2-006 | `case_state` values must be valid enum | E78.2-006 | `checkCaseStateValues()` | E78.2-006 |
| R-E78.2-007 | `attention_items` must be valid array structure | E78.2-007 | `checkAttentionItemsStructure()` | E78.2-007 |
| R-E78.2-008 | `attention_level` values must be valid enum | E78.2-008 | `checkAttentionLevelValues()` | E78.2-008 |
| R-E78.2-009 | `next_action` values must be valid enum | E78.2-009 | `checkNextActionValues()` | E78.2-009 |
| R-E78.2-010 | `priority_score` must be in range 0-1000 | E78.2-010 | `checkPriorityScoreRange()` | E78.2-010 |
| R-E78.2-011 | `is_active` must be boolean type | E78.2-011 | `checkIsActiveType()` | E78.2-011 |
| R-E78.2-012 | Required indexes must exist on base tables | E78.2-012 | `checkIndexExistence()` | E78.2-012 |
| R-E78.2-013 | JOINs must produce correct relationships | E78.2-013 | `checkJoinLogic()` | E78.2-013 |
| R-E78.2-014 | Must not depend on `patient_state` JSON field | E78.2-014 | `checkPatientStateUsage()` | E78.2-014 |

## 2. Checks → Rules Mapping

| Check ID | Check Function | Rule ID | Rule Description |
|----------|----------------|---------|------------------|
| E78.2-001 | `checkViewExists()` | R-E78.2-001 | View must exist and be queryable |
| E78.2-002 | `checkRequiredColumns()` | R-E78.2-002 | All required columns present |
| E78.2-003 | `checkForbiddenColumns()` | R-E78.2-003 | No direct risk/score fields |
| E78.2-004 | `checkDeterminism()` | R-E78.2-004 | Deterministic output |
| E78.2-005 | `checkPerformance()` | R-E78.2-005 | Query performance acceptable |
| E78.2-006 | `checkCaseStateValues()` | R-E78.2-006 | Valid case_state enum |
| E78.2-007 | `checkAttentionItemsStructure()` | R-E78.2-007 | Valid attention_items array |
| E78.2-008 | `checkAttentionLevelValues()` | R-E78.2-008 | Valid attention_level enum |
| E78.2-009 | `checkNextActionValues()` | R-E78.2-009 | Valid next_action enum |
| E78.2-010 | `checkPriorityScoreRange()` | R-E78.2-010 | Priority score in 0-1000 range |
| E78.2-011 | `checkIsActiveType()` | R-E78.2-011 | is_active is boolean |
| E78.2-012 | `checkIndexExistence()` | R-E78.2-012 | Required indexes exist |
| E78.2-013 | `checkJoinLogic()` | R-E78.2-013 | JOINs produce correct relationships |
| E78.2-014 | `checkPatientStateUsage()` | R-E78.2-014 | No patient_state dependency |

## 3. Rule Categories

### View Structure (4 rules)
- **R-E78.2-001:** View exists and queryable
- **R-E78.2-002:** Required columns present
- **R-E78.2-012:** Required indexes exist
- **R-E78.2-013:** JOINs are correct

### Guardrails (3 rules)
- **R-E78.2-003:** No direct risk/score fields
- **R-E78.2-004:** Deterministic output
- **R-E78.2-014:** No patient_state dependency

### Data Validation (5 rules)
- **R-E78.2-006:** Valid case_state values
- **R-E78.2-007:** Valid attention_items structure
- **R-E78.2-008:** Valid attention_level values
- **R-E78.2-009:** Valid next_action values
- **R-E78.2-010:** Valid priority_score range
- **R-E78.2-011:** Valid is_active type

### Performance (1 rule)
- **R-E78.2-005:** Query performance acceptable

## 4. Error Code Reference

All verification errors follow this format:

```
❌ violates R-E78.2-XXX (E78.2-XXX): [description]
```

### Error Code Mapping

| Error Code | Rule ID | Category | Severity |
|------------|---------|----------|----------|
| E78.2-001 | R-E78.2-001 | View Structure | Critical |
| E78.2-002 | R-E78.2-002 | View Structure | Critical |
| E78.2-003 | R-E78.2-003 | Guardrails | Critical |
| E78.2-004 | R-E78.2-004 | Guardrails | High |
| E78.2-005 | R-E78.2-005 | Performance | Medium |
| E78.2-006 | R-E78.2-006 | Data Validation | High |
| E78.2-007 | R-E78.2-007 | Data Validation | High |
| E78.2-008 | R-E78.2-008 | Data Validation | High |
| E78.2-009 | R-E78.2-009 | Data Validation | High |
| E78.2-010 | R-E78.2-010 | Data Validation | Medium |
| E78.2-011 | R-E78.2-011 | Data Validation | Medium |
| E78.2-012 | R-E78.2-012 | View Structure | Medium |
| E78.2-013 | R-E78.2-013 | View Structure | High |
| E78.2-014 | R-E78.2-014 | Guardrails | High |

## 5. Rule Details

### R-E78.2-001: View Existence
**Description:** The `triage_cases_v1` view must exist in the database and be queryable by authenticated users with appropriate RLS policies.

**Rationale:** Without the view, the entire SSOT aggregation feature is non-functional.

**Check Implementation:**
```javascript
const { data, error } = await supabase
  .from('triage_cases_v1')
  .select('case_id')
  .limit(1)

if (error) {
  fail('E78.2-001', `View does not exist: ${error.message}`)
}
```

**Pass Criteria:** Query succeeds without error.

---

### R-E78.2-002: Required Columns
**Description:** The view must expose all required columns as defined in the E78.1 specification.

**Required Columns:**
- `case_id` (UUID)
- `patient_id` (UUID)
- `funnel_id` (UUID)
- `funnel_slug` (text)
- `patient_display` (text)
- `case_state` (enum)
- `attention_items` (array)
- `attention_level` (enum)
- `next_action` (enum)
- `assigned_at` (timestamp)
- `last_activity_at` (timestamp)
- `updated_at` (timestamp)
- `completed_at` (timestamp, nullable)
- `is_active` (boolean)
- `snoozed_until` (timestamp, nullable)

**Check Implementation:** Query view and verify all columns are present in the result set.

**Pass Criteria:** All 15 required columns are present.

---

### R-E78.2-003: No Direct Risk/Score Fields
**Description:** The view must NOT expose direct risk/score fields that tempt UI developers to display raw scores instead of using derived attention levels.

**Forbidden Columns:**
- `risk_level`
- `score_numeric`
- `stress_score`
- `sleep_score`

**Rationale:** Prevents client-side interpretation and ensures UI uses the SSOT contract (attention_level, attention_items) instead of raw scores.

**Check Implementation:** Query view and verify forbidden columns are not present.

**Pass Criteria:** None of the forbidden columns are exposed.

---

### R-E78.2-004: Deterministic Output
**Description:** The view must produce deterministic output for the same input data. No use of NOW(), RANDOM(), or unstable ordering without ORDER BY.

**Exception:** `last_activity_at` may change when new activity occurs, but for the same database state, output must be identical.

**Check Implementation:** Query view twice with identical parameters and compare results.

**Pass Criteria:** Results are identical.

---

### R-E78.2-005: Performance Acceptable
**Description:** Querying the top 20 cases (sorted by priority) must complete within 5 seconds under normal load.

**Threshold:** 5000ms (5 seconds)

**Check Implementation:**
```javascript
const startTime = Date.now()
const { data } = await supabase
  .from('triage_cases_v1')
  .select('*')
  .order('priority_score', { ascending: false })
  .limit(20)
const duration = Date.now() - startTime
```

**Pass Criteria:** Duration < 5000ms

---

### R-E78.2-006: Valid case_state Values
**Description:** All `case_state` values must be one of the valid enum values defined in E78.1.

**Valid Values:**
- `needs_input`
- `in_progress`
- `ready_for_review`
- `resolved`
- `snoozed`

**Check Implementation:** Query all distinct case_state values and verify they're in the valid set.

**Pass Criteria:** No invalid values found.

---

### R-E78.2-007: Valid attention_items Structure
**Description:** `attention_items` must be an array of valid item types.

**Valid Values:**
- `critical_flag`
- `overdue`
- `stuck`
- `review_ready`
- `manual_flag`
- `missing_data`

**Check Implementation:** Query attention_items and verify each item is in the valid set.

**Pass Criteria:** All items are valid, array structure is correct.

---

### R-E78.2-008: Valid attention_level Values
**Description:** All `attention_level` values must be one of the valid enum values.

**Valid Values:**
- `none`
- `info`
- `warn`
- `critical`

**Check Implementation:** Query all distinct attention_level values.

**Pass Criteria:** No invalid values found.

---

### R-E78.2-009: Valid next_action Values
**Description:** All `next_action` values must be one of the valid enum values.

**Valid Values:**
- `patient_continue`
- `patient_provide_data`
- `clinician_review`
- `clinician_contact`
- `system_retry`
- `admin_investigate`
- `none`

**Check Implementation:** Query all distinct next_action values.

**Pass Criteria:** No invalid values found.

---

### R-E78.2-010: Priority Score Range
**Description:** `priority_score` must be an integer in the range [0, 1000].

**Check Implementation:** Query all priority_score values and verify they're in range.

**Pass Criteria:** All scores are 0 ≤ score ≤ 1000.

---

### R-E78.2-011: is_active Type
**Description:** `is_active` must be a boolean type (not string, not integer).

**Check Implementation:** Query is_active and verify type is boolean.

**Pass Criteria:** All values are boolean (true/false).

---

### R-E78.2-012: Required Indexes
**Description:** The following indexes must exist on base tables for performance:

**Required Indexes:**
- `idx_assessments_status_started_at` on `assessments(status, started_at DESC)`
- `idx_assessments_patient_funnel` on `assessments(patient_id, funnel_id)`
- `idx_processing_jobs_assessment_created` on `processing_jobs(assessment_id, created_at DESC)`
- `idx_review_records_job_id` on `review_records(job_id)`
- `idx_reports_assessment_id` on `reports(assessment_id)`
- `idx_risk_bundles_job_id` on `risk_bundles(job_id)`

**Check Implementation:** Query `pg_indexes` to verify index existence.

**Pass Criteria:** All 6 indexes exist.

---

### R-E78.2-013: JOIN Logic Correctness
**Description:** JOINs must produce correct relationships. Every case must have patient_id and funnel_id (required fields).

**Check Implementation:** Query cases and verify no null patient_id or funnel_id.

**Pass Criteria:** All cases have valid patient_id and funnel_id.

---

### R-E78.2-014: No patient_state Dependency
**Description:** The view must not depend on the `patient_state` JSONB field (as per E78.2 risk mitigation).

**Rationale:** patient_state is a flexible JSONB field that may change structure. v1 should use deterministic table fields only.

**Check Implementation:** Inspect view definition SQL for references to `patient_state`.

**Pass Criteria:** No `patient_state` field referenced in view definition.

---

## 6. Coverage Summary

| Metric | Count |
|--------|-------|
| Total Rules | 14 |
| Total Checks | 14 |
| Rules without Checks | 0 |
| Checks without Rules | 0 |
| Scope Mismatches | 0 |
| **Coverage** | **100%** ✅ |

## 7. Diff Report

### Rules without Checks
**Count:** 0 ✅

*All rules have corresponding checks.*

---

### Checks without Rules
**Count:** 0 ✅

*All checks reference a rule ID.*

---

### Scope Mismatches
**Count:** 0 ✅

*All check scopes match their corresponding rules.*

---

## 8. Implementation Status

| Check ID | Status | Implementation Notes |
|----------|--------|---------------------|
| E78.2-001 | ✅ Implemented | Full implementation in verify script |
| E78.2-002 | ✅ Implemented | Full implementation in verify script |
| E78.2-003 | ✅ Implemented | Full implementation in verify script |
| E78.2-004 | ✅ Implemented | Full implementation in verify script |
| E78.2-005 | ✅ Implemented | Full implementation in verify script |
| E78.2-006 | ✅ Implemented | Full implementation in verify script |
| E78.2-007 | ✅ Implemented | Full implementation in verify script |
| E78.2-008 | ✅ Implemented | Full implementation in verify script |
| E78.2-009 | ✅ Implemented | Full implementation in verify script |
| E78.2-010 | ✅ Implemented | Full implementation in verify script |
| E78.2-011 | ✅ Implemented | Full implementation in verify script |
| E78.2-012 | ⚠️  Placeholder | Requires database introspection (manual verification) |
| E78.2-013 | ✅ Implemented | Basic sanity check implemented |
| E78.2-014 | ⚠️  Placeholder | Requires view definition introspection (manual verification) |

**Implementation Rate:** 12/14 (85.7%)  
**Placeholder Checks:** 2 (E78.2-012, E78.2-014)

---

## 9. Verification Script Usage

### Run All Checks
```bash
npm run verify:e78-2
```

### Expected Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 E78.2 triage_cases_v1 View Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 View Existence Checks
✅ E78.2-001 (R-E78.2-001): View exists and is queryable

📋 Column Structure Checks
✅ E78.2-002 (R-E78.2-002): All 15 required columns present

📋 Guardrail Checks
✅ E78.2-003 (R-E78.2-003): No forbidden risk/score fields

📋 Determinism Checks
✅ E78.2-004 (R-E78.2-004): Deterministic output verified

📋 Performance Checks
✅ E78.2-005 (R-E78.2-005): Query completed in 234ms

📋 Data Validation Checks
✅ E78.2-006 (R-E78.2-006): All case_state values valid
✅ E78.2-007 (R-E78.2-007): All attention_items valid
✅ E78.2-008 (R-E78.2-008): All attention_level values valid
✅ E78.2-009 (R-E78.2-009): All next_action values valid
✅ E78.2-010 (R-E78.2-010): All priority_score in range
✅ E78.2-011 (R-E78.2-011): is_active is boolean

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Passed: 12
❌ Failed: 0
⚠️  Warnings: 2

⚠️  E78.2 verification passed with 2 warning(s)
   Some checks not yet fully implemented
```

### Exit Codes
- `0` - All checks passed (or passed with warnings)
- `1` - One or more checks failed
- `2` - Fatal error during verification

---

## 10. Maintenance Guidelines

### Adding a New Rule
1. Add rule to "Rules → Checks Mapping" table
2. Add corresponding check to "Checks → Rules Mapping" table
3. Add error code to "Error Code Reference" table
4. Update "Coverage Summary" counts
5. Implement check function in `verify-e78-2-triage-view.mjs`
6. Update "Implementation Status" table

### Adding a New Check
1. Ensure check references an existing rule ID
2. Add to both mapping tables
3. Update coverage summary
4. Add error code mapping
5. Implement in verification script

### Deprecating a Rule/Check
1. Mark as deprecated in mapping tables
2. Keep check in verification script but add deprecation warning
3. Update coverage summary
4. Document deprecation reason

---

## 11. Related Documentation

- **E78.1 Specification:** `docs/triage/inbox-v1.md`
- **E78.1 Rules Matrix:** `docs/triage/RULES_VS_CHECKS_MATRIX.md`
- **E78.2 Migration:** `supabase/migrations/20260205152500_e78_2_create_triage_cases_v1.sql`
- **Verification Script:** `scripts/ci/verify-e78-2-triage-view.mjs`
- **Schema:** `schema/schema.sql`

---

## 12. Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-02-05 | 1.0 | Copilot Agent | Initial matrix for E78.2 implementation |

---

**End of Matrix**
