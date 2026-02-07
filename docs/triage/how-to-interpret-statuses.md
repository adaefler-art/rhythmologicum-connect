# How to Interpret Statuses — Technical Reference

**Version:** 1.0  
**Last Updated:** 2026-02-07  
**Epic:** E78.9

## Table of Contents

1. [Overview](#overview)
2. [Case States](#case-states)
3. [Attention Items](#attention-items)
4. [Attention Levels](#attention-levels)
5. [Next Actions](#next-actions)
6. [State Transitions](#state-transitions)
7. [Deterministic Logic](#deterministic-logic)
8. [Troubleshooting Status Issues](#troubleshooting-status-issues)

## Overview

This document provides a detailed technical reference for understanding and interpreting all statuses in the Triage Inbox system. It is intended for developers, system administrators, and advanced users who need to understand the underlying logic.

### Key Principles

1. **Deterministic** — Same database state always produces same status
2. **Database-driven** — All logic is in PostgreSQL view (`triage_cases_v1`)
3. **Rule-based** — Each status has explicit conditions defined in spec
4. **No client-side interpretation** — UI displays what database computes

## Case States

### State Enum

```typescript
type CaseState = 
  | 'needs_input'       
  | 'in_progress'       
  | 'ready_for_review'  
  | 'resolved'          
  | 'snoozed'           
```

### Detailed State Logic

#### `needs_input`

**Rule:** R-E78.1-001

**SQL Condition:**
```sql
assessments.status = 'in_progress'
AND assessments.workup_status = 'needs_more_data'
AND assessments.completed_at IS NULL
```

**Meaning:** Patient started assessment but system identified missing required data.

**Typical Causes:**
- Incomplete questionnaire responses
- Missing required documents
- Failed validation checks

**Expected Duration:** Until patient provides data (no fixed SLA)

**Transitions To:**
- `in_progress` — when patient provides data
- `stuck` — if patient doesn't respond for 14+ days

---

#### `in_progress`

**Rule:** R-E78.1-002

**SQL Condition:**
```sql
assessments.status = 'in_progress'
AND assessments.completed_at IS NULL
AND NOT (workup_status = 'needs_more_data')
```

**Meaning:** Patient is actively working on the assessment.

**Typical Duration:** 1-7 days (SLA: 7 days by default)

**Attention Items:**
- `overdue` — if started > 7 days ago
- `stuck` — if started > 14 days ago

**Transitions To:**
- `needs_input` — if missing data detected
- `ready_for_review` — when patient completes
- `stuck` — if abandoned by patient

---

#### `ready_for_review`

**Rule:** R-E78.1-003

**SQL Condition (Primary):**
```sql
assessments.status = 'completed'
AND assessments.workup_status = 'ready_for_review'
AND NOT EXISTS (
  SELECT 1 FROM review_records rr
  JOIN processing_jobs pj ON pj.id = rr.job_id
  WHERE pj.assessment_id = assessments.id
  AND rr.status IN ('APPROVED', 'REJECTED')
)
```

**Alternative Condition (No workup_status):**
```sql
assessments.status = 'completed'
AND EXISTS (
  SELECT 1 FROM processing_jobs pj
  WHERE pj.assessment_id = assessments.id
  AND pj.status = 'completed'
  AND pj.stage = 'report_generated'
)
AND NOT EXISTS (
  SELECT 1 FROM review_records rr ... [same as above]
)
```

**Meaning:** Assessment completed, report generated, awaiting clinician review.

**Typical Duration:** 0-2 days (Review SLA: 2 days)

**Attention Items:**
- `review_ready` — always present
- `critical_flag` — if high risk detected
- `overdue` — if completed > 2 days ago

**Transitions To:**
- `resolved` — when clinician approves or report delivered

---

#### `resolved`

**Rule:** R-E78.1-004

**SQL Condition (Option A - Review Approved):**
```sql
assessments.status = 'completed'
AND EXISTS (
  SELECT 1 FROM review_records rr
  JOIN processing_jobs pj ON pj.id = rr.job_id
  WHERE pj.assessment_id = assessments.id
  AND rr.status = 'APPROVED'
)
```

**SQL Condition (Option B - Delivery Completed):**
```sql
assessments.status = 'completed'
AND EXISTS (
  SELECT 1 FROM processing_jobs pj
  WHERE pj.assessment_id = assessments.id
  AND pj.delivery_status = 'DELIVERED'
)
```

**Meaning:** Case is closed. Either clinician approved review OR report was delivered to patient.

**Terminal State:** No further transitions (case is complete)

**Note:** Resolved cases are hidden from active inbox by default.

---

#### `snoozed`

**Rule:** R-E78.1-005

**SQL Condition:**
```sql
-- Reserved for future use in v1
-- Will require snooze table/field
FALSE
```

**Meaning:** Case temporarily hidden until specified date.

**Status:** Not implemented in v1. Reserved for future enhancement.

**Planned Logic:**
```sql
-- Future implementation
EXISTS (
  SELECT 1 FROM case_snooze_log
  WHERE assessment_id = assessments.id
  AND snoozed_until > NOW()
)
```

---

### State Priority

If multiple conditions match (data inconsistency), states are prioritized:

1. **resolved** (highest - terminal)
2. **ready_for_review**
3. **needs_input**
4. **in_progress**
5. **snoozed** (lowest - not implemented)

## Attention Items

### Item Enum

```typescript
type AttentionItem =
  | 'critical_flag'    
  | 'overdue'          
  | 'stuck'            
  | 'review_ready'     
  | 'manual_flag'      // Not in v1
  | 'missing_data'     
```

### Detailed Item Logic

#### `critical_flag`

**Rule:** R-E78.1-006

**SQL Condition:**
```sql
EXISTS (
  SELECT 1 FROM reports r
  WHERE r.assessment_id = assessments.id
  AND r.risk_level = 'high'
)
OR EXISTS (
  SELECT 1 FROM risk_bundles rb
  JOIN processing_jobs pj ON pj.id = rb.job_id
  WHERE pj.assessment_id = assessments.id
  AND rb.bundle_data->>'overall_risk_level' = 'critical'
)
OR EXISTS (
  SELECT 1 FROM safety_check_results scr
  JOIN processing_jobs pj ON pj.id = scr.job_id
  WHERE pj.assessment_id = assessments.id
  AND scr.overall_action = 'BLOCK'
)
```

**Attention Level:** `critical`

**Meaning:** High-risk patient or safety concern detected.

**Sources:**
1. Report risk level = 'high'
2. Risk bundle = 'critical'
3. Safety check = 'BLOCK'

**Action Required:** Immediate clinician review

---

#### `overdue`

**Rule:** R-E78.1-007

**SQL Condition (In Progress):**
```sql
assessments.status = 'in_progress'
AND assessments.started_at < (NOW() - INTERVAL '7 days')
AND assessments.completed_at IS NULL
```

**SQL Condition (Awaiting Review):**
```sql
assessments.status = 'completed'
AND assessments.completed_at < (NOW() - INTERVAL '2 days')
AND NOT EXISTS (
  SELECT 1 FROM review_records rr
  WHERE rr.assessment_id = assessments.id
  AND rr.status IN ('APPROVED', 'REJECTED')
)
```

**Attention Level:** `warn`

**Meaning:** SLA deadline exceeded.

**Default SLA Thresholds:**
- In progress: 7 days
- Review: 2 days
- Critical review: 4 hours

**Action Required:** Review case, contact patient if necessary

---

#### `stuck`

**Rule:** R-E78.1-008

**SQL Condition:**
```sql
EXISTS (
  SELECT 1 FROM processing_jobs pj
  WHERE pj.assessment_id = assessments.id
  AND pj.status = 'failed'
  AND pj.attempt >= pj.max_attempts
)
OR (
  assessments.status = 'in_progress'
  AND assessments.started_at < (NOW() - INTERVAL '14 days')
  AND assessments.completed_at IS NULL
)
```

**Attention Level:** `warn`

**Meaning:** Processing permanently failed OR patient abandoned assessment.

**Causes:**
1. Processing job failed after max retries
2. Patient hasn't completed in 14+ days (2x SLA)

**Action Required:** Admin investigation or patient contact

---

#### `review_ready`

**Rule:** R-E78.1-009

**SQL Condition:**
```sql
assessments.status = 'completed'
AND assessments.workup_status = 'ready_for_review'
AND NOT EXISTS (
  SELECT 1 FROM review_records rr
  WHERE rr.assessment_id = assessments.id
  AND rr.status != 'PENDING'
)
```

**Attention Level:** `info`

**Meaning:** Assessment completed and ready for clinician review.

**Action Required:** Review when time permits (within 2 days)

---

#### `missing_data`

**Rule:** R-E78.1-011

**SQL Condition:**
```sql
assessments.status = 'in_progress'
AND assessments.missing_data_fields IS NOT NULL
AND jsonb_array_length(assessments.missing_data_fields) > 0
```

**Attention Level:** `info`

**Meaning:** Specific data fields identified as missing.

**Action Required:** Monitor; may trigger `needs_input` state

---

#### `manual_flag`

**Rule:** R-E78.1-010

**Status:** Not implemented in v1. Reserved for future use.

**Planned Logic:**
```sql
EXISTS (
  SELECT 1 FROM manual_case_flags
  WHERE assessment_id = assessments.id
  AND flag_cleared_at IS NULL
)
```

**Attention Level:** `warn` (when implemented)

---

## Attention Levels

### Level Enum

```typescript
type AttentionLevel = 'none' | 'info' | 'warn' | 'critical'
```

### Computation Logic

Attention level is the **maximum** severity among all active attention items:

```typescript
function computeAttentionLevel(attentionItems: AttentionItem[]): AttentionLevel {
  if (attentionItems.length === 0) return 'none'
  
  const itemLevels = {
    critical_flag: 'critical',
    overdue: 'warn',
    stuck: 'warn',
    review_ready: 'info',
    manual_flag: 'warn',
    missing_data: 'info',
  }
  
  const levels = attentionItems.map(item => itemLevels[item])
  
  if (levels.includes('critical')) return 'critical'
  if (levels.includes('warn')) return 'warn'
  if (levels.includes('info')) return 'info'
  return 'none'
}
```

### SQL Implementation

```sql
CASE
  WHEN 'critical_flag' = ANY(attention_items) THEN 'critical'
  WHEN 'overdue' = ANY(attention_items) OR 'stuck' = ANY(attention_items) THEN 'warn'
  WHEN array_length(attention_items, 1) > 0 THEN 'info'
  ELSE 'none'
END AS attention_level
```

## Next Actions

### Action Enum

```typescript
type NextAction =
  | 'patient_continue'
  | 'patient_provide_data'
  | 'clinician_review'
  | 'clinician_contact'
  | 'system_retry'
  | 'admin_investigate'
  | 'none'
```

### Action Determination Logic

Next action is computed based on case state and attention items, with priority order:

**Priority Order (highest to lowest):**
1. `clinician_review` (with critical_flag) — R-E78.1-016
2. `admin_investigate` — R-E78.1-019
3. `clinician_review` — R-E78.1-015
4. `clinician_contact` — R-E78.1-014
5. `system_retry` — R-E78.1-018
6. `patient_provide_data` — R-E78.1-012
7. `patient_continue` — R-E78.1-013
8. `none` — R-E78.1-017

### Detailed Action Rules

See [Inbox Logic Spec](./inbox-v1.md) Section 4.2 for complete SQL conditions for each action.

## State Transitions

### Typical Flow

```
[created]
   ↓
in_progress
   ↓ (may transition to needs_input if data missing)
needs_input
   ↓ (patient provides data)
in_progress
   ↓ (patient completes)
ready_for_review
   ↓ (clinician approves OR report delivered)
resolved [terminal]
```

### Alternative Flows

**Stuck Path:**
```
in_progress
   ↓ (14+ days, no completion)
in_progress + stuck
   ↓ (admin/clinician intervention)
[resolved or restarted]
```

**Processing Failure Path:**
```
ready_for_review
   ↓ (processing job fails)
in_progress + stuck
   ↓ (admin retries)
ready_for_review
```

## Deterministic Logic

### Key Guarantees

1. **Same input → Same output** — Given identical database state, view always produces identical results
2. **No randomness** — No random IDs, timestamps computed deterministically
3. **No side effects** — Reading view doesn't modify data
4. **Idempotent** — Query same assessment multiple times, get same result

### Testing Determinism

```sql
-- Query 1
SELECT case_state, attention_items, priority_score
FROM triage_cases_v1
WHERE case_id = '{uuid}';

-- Wait 1 second

-- Query 2 (should be identical)
SELECT case_state, attention_items, priority_score
FROM triage_cases_v1
WHERE case_id = '{uuid}';
```

Both queries must return **identical** results.

**Exception:** `last_activity_at` may change if new records inserted between queries.

## Troubleshooting Status Issues

### Case shows wrong state

**Check:**
1. Verify `assessments.status` and `assessments.workup_status` fields
2. Check for review records in `review_records` table
3. Look for processing jobs in `processing_jobs` table
4. Review view definition in migration `20260205152500_e78_2_create_triage_cases_v1.sql`

**Fix:**
- Update underlying data in `assessments`, `processing_jobs`, or `review_records`
- View will automatically reflect changes

---

### Attention items missing

**Check:**
1. Query underlying tables directly (reports, risk_bundles, safety_check_results)
2. Verify foreign key relationships (processing_jobs → assessment_id)
3. Check time calculations (NOW() - started_at)

**Fix:**
- Insert missing records
- Correct timestamps if needed

---

### Priority score seems wrong

**Check:**
1. Verify attention level computation
2. Check case state
3. Confirm started_at timestamp is correct
4. Review priority formula in view

**Formula:**
```sql
(
  -- Attention level (0-500)
  CASE WHEN 'critical_flag' = ANY(...) THEN 500 ... END +
  
  -- Case state (0-200)
  CASE WHEN status = 'completed' AND ... THEN 200 ... END +
  
  -- Age (0-100, 2 pts/day)
  LEAST(EXTRACT(EPOCH FROM (NOW() - started_at)) / 86400 * 2, 100) +
  
  -- Specific items (0-200)
  CASE WHEN 'critical_flag' = ANY(...) THEN 200 ... END
) AS priority_score
```

---

### Case not appearing in inbox

**Check:**
1. `is_active` field — must be `true` for default view
2. `snoozed_until` — must be NULL or past
3. RLS policies — verify user has access
4. Assessment status — must be `in_progress` or `completed`

**Fix:**
- Update `assessments.status`
- Check clinician org membership
- Verify RLS policies

---

## See Also

- [How to Triage](./how-to-triage.md) — User guide
- [How to Configure SLA](./how-to-configure-sla.md) — SLA setup
- [Inbox Logic Spec](./inbox-v1.md) — Complete technical spec
- [Database Schema](/schema/schema.sql) — Full schema

---

**Last Updated:** 2026-02-07  
**Version:** 1.0  
**Related Epic:** E78.9
