# Inbox Logic v1 — Deterministic Specification

**Version:** 1.0  
**Status:** Canonical  
**Last Updated:** 2026-02-05  
**Epic:** E78.1

## Purpose

This document provides a deterministic, implementation-ready specification for the Inbox/Triage system. It prevents client-side interpretation by defining precise rules for case states, attention items, and next actions based on database fields.

## 1. Case Model Definition

### 1.1 Case Identity

A **Case** is uniquely identified by:

```
Case = patient_id × funnel_id × episode
```

Where:
- `patient_id`: UUID from `patient_profiles.id`
- `funnel_id`: UUID from `funnels_catalog.id` (via `assessments.funnel_id`)
- `episode`: UUID representing a single assessment instance (`assessments.id`)

**Note:** In this v1 specification, `episode` is synonymous with `assessment_id`. A case represents one patient's journey through one funnel instance.

### 1.2 Case Attributes

Each case has the following computed attributes derived from database state:

| Attribute | Type | Source |
|-----------|------|--------|
| `case_id` | UUID | `assessments.id` (episode) |
| `patient_id` | UUID | `assessments.patient_id` |
| `funnel_id` | UUID | `assessments.funnel_id` |
| `case_state` | CaseState | Computed (see Section 2) |
| `attention_items` | AttentionItem[] | Computed (see Section 3) |
| `attention_level` | AttentionLevel | Computed (see Section 3.2) |
| `next_action` | NextAction | Computed (see Section 4) |
| `priority_score` | Integer | Computed (see Section 5) |
| `sla_deadline` | Timestamp | Computed (see Section 6) |
| `sla_status` | SLAStatus | Computed (see Section 6) |

## 2. Case States

### 2.1 State Enum

```typescript
type CaseState = 
  | 'needs_input'       // Patient action required
  | 'in_progress'       // Assessment in progress, no intervention needed
  | 'ready_for_review'  // Assessment complete, awaiting clinician review
  | 'resolved'          // Case closed/completed
  | 'snoozed'           // Temporarily hidden from active queue
```

### 2.2 State Determination Rules

Case state is **deterministically** computed from database fields:

#### Rule R-E78.1-001: `needs_input` State
**Condition:**
```sql
assessments.status = 'in_progress'
AND assessments.workup_status = 'needs_more_data'
AND assessments.completed_at IS NULL
```

**Semantic:** Patient has started but assessment requires more data input.

---

#### Rule R-E78.1-002: `in_progress` State
**Condition:**
```sql
assessments.status = 'in_progress'
AND assessments.workup_status IS NULL
AND assessments.completed_at IS NULL
AND NOT EXISTS (
  SELECT 1 FROM processing_jobs pj 
  WHERE pj.assessment_id = assessments.id 
  AND pj.status = 'failed'
)
```

**Semantic:** Assessment is actively being completed by patient, no issues detected.

---

#### Rule R-E78.1-003: `ready_for_review` State
**Condition:**
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

**Semantic:** Assessment completed, ready for clinician review, no decision made yet.

**Alternative Condition (no workup_status):**
```sql
assessments.status = 'completed'
AND EXISTS (
  SELECT 1 FROM processing_jobs pj
  WHERE pj.assessment_id = assessments.id
  AND pj.status = 'completed'
  AND pj.stage = 'report_generated'
)
AND NOT EXISTS (
  SELECT 1 FROM review_records rr
  JOIN processing_jobs pj ON pj.id = rr.job_id
  WHERE pj.assessment_id = assessments.id
  AND rr.status IN ('APPROVED', 'REJECTED')
)
```

---

#### Rule R-E78.1-004: `resolved` State
**Condition (Option A - Review Approved):**
```sql
assessments.status = 'completed'
AND EXISTS (
  SELECT 1 FROM review_records rr
  JOIN processing_jobs pj ON pj.id = rr.job_id
  WHERE pj.assessment_id = assessments.id
  AND rr.status = 'APPROVED'
)
```

**Condition (Option B - Delivery Completed):**
```sql
assessments.status = 'completed'
AND EXISTS (
  SELECT 1 FROM processing_jobs pj
  WHERE pj.assessment_id = assessments.id
  AND pj.delivery_status = 'DELIVERED'
)
```

**Semantic:** Case has been reviewed and approved OR report has been delivered to patient.

**Definition Clarification:** A case is considered "resolved" when either:
1. A clinician has reviewed and approved the assessment (review-based resolution), OR
2. The final report has been delivered to the patient (delivery-based resolution)

Both conditions represent completion of the workflow, but from different perspectives.

---

#### Rule R-E78.1-005: `snoozed` State
**Condition:**
```sql
-- Future enhancement: requires snooze table/field
-- For v1, this state is reserved for future use
FALSE
```

**Semantic:** Reserved for future manual snooze functionality. Not implemented in v1.

---

### 2.3 State Priority

If multiple state conditions match (due to data inconsistency), apply this priority order:
1. `resolved` (highest priority - terminal state)
2. `ready_for_review`
3. `needs_input`
4. `in_progress`
5. `snoozed` (lowest priority - not implemented in v1)

## 3. Attention Items

### 3.1 Attention Item Enum

```typescript
type AttentionItem =
  | 'critical_flag'    // Critical risk level or safety issue
  | 'overdue'          // SLA deadline exceeded
  | 'stuck'            // Processing error or patient abandoned
  | 'review_ready'     // Waiting for clinician review
  | 'manual_flag'      // Manually flagged by clinician
  | 'missing_data'     // Required data fields missing
```

### 3.2 Attention Level Enum

```typescript
type AttentionLevel =
  | 'none'      // No attention required
  | 'info'      // Informational, low priority
  | 'warn'      // Warning, moderate priority
  | 'critical'  // Critical, immediate action required
```

### 3.3 Attention Item Determination Rules

A case can have **multiple** attention items simultaneously. Each item has specific trigger conditions:

#### Rule R-E78.1-006: `critical_flag` Item
**Condition:**
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

**Semantic:** High-risk assessment or safety block detected.

---

#### Rule R-E78.1-007: `overdue` Item
**Condition:**
```sql
assessments.status = 'in_progress'
AND assessments.started_at < (NOW() - INTERVAL '7 days')  -- Default SLA
AND assessments.completed_at IS NULL
```

**Attention Level:** `warn`

**Semantic:** Assessment in progress for longer than SLA deadline.

**Alternative for completed but not reviewed:**
```sql
assessments.status = 'completed'
AND assessments.completed_at < (NOW() - INTERVAL '2 days')  -- Review SLA
AND NOT EXISTS (
  SELECT 1 FROM review_records rr
  JOIN processing_jobs pj ON pj.id = rr.job_id
  WHERE pj.assessment_id = assessments.id
  AND rr.status IN ('APPROVED', 'REJECTED')
)
```

**Attention Level:** `warn`

---

#### Rule R-E78.1-008: `stuck` Item
**Condition:**
```sql
EXISTS (
  SELECT 1 FROM processing_jobs pj
  WHERE pj.assessment_id = assessments.id
  AND pj.status = 'failed'
  AND pj.attempt >= pj.max_attempts
)
OR (
  assessments.status = 'in_progress'
  AND assessments.started_at < (NOW() - INTERVAL '14 days')  -- 2x SLA
  AND assessments.completed_at IS NULL
)
```

**Attention Level:** `warn`

**Semantic:** Processing job has failed permanently OR patient has abandoned assessment.

---

#### Rule R-E78.1-009: `review_ready` Item
**Condition:**
```sql
assessments.status = 'completed'
AND assessments.workup_status = 'ready_for_review'
AND NOT EXISTS (
  SELECT 1 FROM review_records rr
  JOIN processing_jobs pj ON pj.id = rr.job_id
  WHERE pj.assessment_id = assessments.id
  AND rr.status != 'PENDING'
)
```

**Attention Level:** `info`

**Semantic:** Assessment is completed and ready for clinician review.

---

#### Rule R-E78.1-010: `manual_flag` Item
**Condition:**
```sql
-- Future enhancement: requires manual_flags table
-- For v1, this item is reserved for future use
FALSE
```

**Attention Level:** `warn` (when implemented)

**Semantic:** Reserved for future manual flagging functionality.

---

#### Rule R-E78.1-011: `missing_data` Item
**Condition:**
```sql
assessments.status = 'in_progress'
AND assessments.missing_data_fields IS NOT NULL
AND jsonb_array_length(assessments.missing_data_fields) > 0
```

**Attention Level:** `info`

**Semantic:** Assessment has identified missing data fields.

---

### 3.4 Overall Attention Level Computation

The overall `attention_level` for a case is the **highest** level among all active attention items:

```typescript
function computeAttentionLevel(attentionItems: AttentionItem[]): AttentionLevel {
  if (attentionItems.length === 0) return 'none'
  
  const levels = attentionItems.map(item => {
    switch (item) {
      case 'critical_flag': return 'critical'
      case 'overdue': return 'warn'
      case 'stuck': return 'warn'
      case 'review_ready': return 'info'
      case 'manual_flag': return 'warn'
      case 'missing_data': return 'info'
    }
  })
  
  if (levels.includes('critical')) return 'critical'
  if (levels.includes('warn')) return 'warn'
  if (levels.includes('info')) return 'info'
  return 'none'
}
```

## 4. Next Actions

### 4.1 Next Action Enum

```typescript
type NextAction =
  | 'patient_continue'       // Patient should continue assessment
  | 'patient_provide_data'   // Patient should provide missing data
  | 'clinician_review'       // Clinician should review results
  | 'clinician_contact'      // Clinician should contact patient
  | 'system_retry'           // System should retry failed job
  | 'admin_investigate'      // Admin should investigate stuck case
  | 'none'                   // No action required (resolved)
```

### 4.2 Next Action Determination Rules

Next action is computed based on case state and attention items:

#### Rule R-E78.1-012: Next Action for `needs_input`
**Condition:**
```sql
case_state = 'needs_input'
```

**Next Action:** `patient_provide_data`

**Target Route:** `/patient/assessments/{assessment_id}`

---

#### Rule R-E78.1-013: Next Action for `in_progress`
**Condition:**
```sql
case_state = 'in_progress'
AND NOT ('stuck' IN attention_items)
```

**Next Action:** `patient_continue`

**Target Route:** `/patient/assessments/{assessment_id}`

---

#### Rule R-E78.1-014: Next Action for `in_progress` + `stuck`
**Condition:**
```sql
case_state = 'in_progress'
AND 'stuck' IN attention_items
```

**Next Action:** `clinician_contact`

**Target Route:** `/clinician/patient/{patient_id}`

---

#### Rule R-E78.1-015: Next Action for `ready_for_review`
**Condition:**
```sql
case_state = 'ready_for_review'
```

**Next Action:** `clinician_review`

**Target Route:** `/clinician/triage/{assessment_id}/review`

---

#### Rule R-E78.1-016: Next Action for `ready_for_review` + `critical_flag`
**Condition:**
```sql
case_state = 'ready_for_review'
AND 'critical_flag' IN attention_items
```

**Next Action:** `clinician_review`

**Target Route:** `/clinician/triage/{assessment_id}/review?priority=critical`

---

#### Rule R-E78.1-017: Next Action for `resolved`
**Condition:**
```sql
case_state = 'resolved'
```

**Next Action:** `none`

**Target Route:** N/A (case is closed)

---

#### Rule R-E78.1-018: Next Action for Processing Failure
**Condition:**
```sql
EXISTS (
  SELECT 1 FROM processing_jobs pj
  WHERE pj.assessment_id = assessments.id
  AND pj.status = 'failed'
  AND pj.attempt < pj.max_attempts
)
```

**Next Action:** `system_retry`

**Target Route:** `/api/admin/processing/retry/{job_id}` (admin only)

---

#### Rule R-E78.1-019: Next Action for Permanent Failure
**Condition:**
```sql
'stuck' IN attention_items
AND EXISTS (
  SELECT 1 FROM processing_jobs pj
  WHERE pj.assessment_id = assessments.id
  AND pj.status = 'failed'
  AND pj.attempt >= pj.max_attempts
)
```

**Next Action:** `admin_investigate`

**Target Route:** `/admin/diagnostics/case/{assessment_id}`

---

### 4.3 Next Action Priority

If multiple next action rules match, apply this priority:
1. `clinician_review` (with `critical_flag`)
2. `admin_investigate`
3. `clinician_review`
4. `clinician_contact`
5. `system_retry`
6. `patient_provide_data`
7. `patient_continue`
8. `none`

## 5. Prioritization and Sorting

### 5.1 Priority Score Calculation

Cases are assigned a priority score (0-1000) based on multiple factors:

```typescript
function computePriorityScore(case: Case): number {
  let score = 0
  
  // 1. Attention level contributes most to priority
  if (case.attention_level === 'critical') score += 500
  if (case.attention_level === 'warn') score += 300
  if (case.attention_level === 'info') score += 100
  
  // 2. Case state priority
  if (case.case_state === 'ready_for_review') score += 200
  if (case.case_state === 'needs_input') score += 150
  if (case.case_state === 'in_progress') score += 50
  
  // 3. Time-based urgency (age in days, capped at 100 points)
  const ageInDays = daysSince(case.started_at)
  score += Math.min(ageInDays * 2, 100)
  
  // 4. Specific attention items
  if (case.attention_items.includes('critical_flag')) score += 200
  if (case.attention_items.includes('stuck')) score += 150
  if (case.attention_items.includes('overdue')) score += 100
  
  return Math.min(score, 1000)  // Cap at 1000
}
```

### 5.2 Default Sort Order

Cases in the inbox should be sorted by:
1. `priority_score` (descending)
2. `started_at` (ascending - oldest first for same priority)

SQL Example:
```sql
ORDER BY priority_score DESC, started_at ASC
```

## 6. SLA (Service Level Agreement)

### 6.1 SLA Configuration

SLA deadlines are computed based on configurable time windows:

| SLA Type | Default Duration | Configurable | Applies To |
|----------|------------------|--------------|------------|
| Assessment Completion | 7 days | Yes (ENV) | `in_progress` assessments |
| Review Completion | 2 days | Yes (ENV) | `ready_for_review` assessments |
| Critical Review | 4 hours | Yes (ENV) | `ready_for_review` + `critical_flag` |

### 6.2 SLA Configuration Source

#### v1 (Current - E78.6)

SLA configuration uses a hybrid approach:

**Environment Variable (Default):**
```bash
# .env or deployment config
TRIAGE_SLA_DAYS_DEFAULT=7  # Default overdue threshold for all funnels
```

**Database Table (Per-Funnel Override - v1.1):**
```sql
-- Table: funnel_triage_settings
SELECT funnel_id, overdue_days FROM funnel_triage_settings;
```

**Precedence:**
1. `funnel_triage_settings.overdue_days` (if exists for funnel) - **highest priority**
2. `TRIAGE_SLA_DAYS_DEFAULT` environment variable
3. Hardcoded default (7 days) - **lowest priority**

**Implementation:**
- SQL function: `get_triage_sla_days(funnel_id)` returns the effective SLA
- TypeScript helper: `getTriageSLADaysForFunnel(funnelId)` for application code
- View integration: `triage_cases_v1` includes `sla_days` and `due_at` columns

**Future Enhancement (v2+):** Additional SLA types for review and critical review.

### 6.3 SLA Status Enum

```typescript
type SLAStatus =
  | 'on_time'      // Within SLA deadline
  | 'approaching'  // Within 80-100% of SLA window
  | 'breached'     // Past SLA deadline
```

### 6.4 SLA Deadline Calculation Rules

#### Rule R-E78.1-020: Assessment Completion SLA
**Condition:**
```sql
case_state IN ('in_progress', 'needs_input')
```

**Deadline:**
```sql
-- E78.6: Uses configurable SLA from funnel_triage_settings or TRIAGE_SLA_DAYS_DEFAULT
assessments.started_at + (sla_days || ' days')::INTERVAL

-- Where sla_days comes from:
-- COALESCE(funnel_triage_settings.overdue_days, 7)
```

**Status:**
```sql
-- E78.6: Uses configurable SLA
CASE
  WHEN NOW() < (started_at + (sla_days || ' days')::INTERVAL)
    THEN 'on_time'
  WHEN NOW() >= (started_at + (sla_days || ' days')::INTERVAL * 0.8)
    AND NOW() < (started_at + (sla_days || ' days')::INTERVAL)
    THEN 'approaching'
  ELSE 'breached'
END
```

---

#### Rule R-E78.1-021: Review Completion SLA
**Condition:**
```sql
case_state = 'ready_for_review'
AND NOT ('critical_flag' IN attention_items)
```

**Deadline:**
```sql
assessments.completed_at + INTERVAL '{INBOX_SLA_REVIEW_DAYS} days'
```

---

#### Rule R-E78.1-022: Critical Review SLA
**Condition:**
```sql
case_state = 'ready_for_review'
AND 'critical_flag' IN attention_items
```

**Deadline:**
```sql
assessments.completed_at + INTERVAL '{INBOX_SLA_CRITICAL_HOURS} hours'
```

---

## 7. Filtering and Views

### 7.1 Default Filter: Active Cases Only

The default inbox view should show only **active** cases:

```sql
WHERE case_state IN ('needs_input', 'in_progress', 'ready_for_review')
```

**Rationale:** Exclude `resolved` and `snoozed` cases from primary view to focus clinician attention.

### 7.2 Additional Filters

Clinicians should be able to filter by:

| Filter Name | SQL Condition |
|-------------|---------------|
| Critical Only | `attention_level = 'critical'` |
| Ready for Review | `case_state = 'ready_for_review'` |
| Overdue | `'overdue' = ANY(attention_items)` |
| My Patients | `EXISTS (SELECT 1 FROM clinician_patient_assignments WHERE ...)` |
| Specific Funnel | `funnel_id = '{uuid}'` |

### 7.3 Pagination

Default page size: **20 cases per page**

## 8. Mapping Table: Source Fields to Case Attributes

This table provides a complete mapping from database fields to computed case attributes:

| Case Attribute | Primary Source Table | Primary Fields | Secondary Sources |
|----------------|---------------------|----------------|-------------------|
| `case_id` | `assessments` | `id` | - |
| `patient_id` | `assessments` | `patient_id` | - |
| `funnel_id` | `assessments` | `funnel_id` | - |
| `case_state` | `assessments` | `status`, `workup_status`, `completed_at` | `processing_jobs.status`, `review_records.status` |
| `attention_items[critical_flag]` | `reports` | `risk_level` | `risk_bundles.bundle_data`, `safety_check_results.overall_action` |
| `attention_items[overdue]` | `assessments` | `started_at`, `completed_at`, `status` | - |
| `attention_items[stuck]` | `processing_jobs` | `status`, `attempt`, `max_attempts` | `assessments.started_at` |
| `attention_items[review_ready]` | `assessments` | `status`, `workup_status` | `review_records.status` |
| `attention_items[missing_data]` | `assessments` | `missing_data_fields` | - |
| `attention_level` | Computed | - | All attention items |
| `next_action` | Computed | - | `case_state` + `attention_items` |
| `priority_score` | Computed | - | Multiple factors (see 5.1) |
| `sla_deadline` | `assessments` | `started_at` or `completed_at` | ENV config |
| `sla_status` | Computed | - | `sla_deadline` vs `NOW()` |

## 9. Implementation Notes

### 9.1 Database View Recommendation

Consider creating a PostgreSQL view for efficient case querying:

```sql
CREATE OR REPLACE VIEW v_inbox_cases AS
SELECT
  a.id AS case_id,
  a.patient_id,
  a.funnel_id,
  a.started_at,
  a.completed_at,
  -- Computed case_state (using CASE expression based on rules R-E78.1-001 to R-E78.1-005)
  -- Computed attention_items (using ARRAY aggregation based on rules R-E78.1-006 to R-E78.1-011)
  -- Computed attention_level (using CASE expression based on 3.4)
  -- Computed priority_score (using formula from 5.1)
  -- Computed sla_deadline (using formula from 6.4)
  -- Computed sla_status (using formula from 6.4)
FROM assessments a
LEFT JOIN processing_jobs pj ON pj.assessment_id = a.id
LEFT JOIN reports r ON r.assessment_id = a.id
LEFT JOIN review_records rr ON rr.job_id = pj.id
-- Additional JOINs as needed
;
```

### 9.2 API Response Format

All inbox API endpoints should return cases in this format:

```typescript
interface InboxCaseResponse {
  case_id: string
  patient_id: string
  funnel_id: string
  case_state: CaseState
  attention_items: AttentionItem[]
  attention_level: AttentionLevel
  next_action: NextAction
  next_action_route: string
  priority_score: number
  sla_deadline: string | null  // ISO 8601 timestamp
  sla_status: SLAStatus
  started_at: string  // ISO 8601 timestamp
  completed_at: string | null  // ISO 8601 timestamp
  
  // Enrichment data (optional, for UI display)
  patient_name?: string
  funnel_name?: string
}
```

### 9.3 RLS Considerations

All queries must respect Row-Level Security (RLS) policies:

- Clinicians see only cases for patients in their organization or assigned to them
- Patients see only their own cases (if exposed via patient API)
- Admin roles see all cases

### 9.4 Performance Considerations

For large datasets:
- Index on `assessments(status, started_at)`
- Index on `processing_jobs(assessment_id, status)`
- Consider materialized view for expensive aggregations
- Cache SLA config in application memory

## 10. Risk Mitigation and Edge Cases

### 10.1 Semantic Conflicts

**Issue:** What if `reports.risk_level` and `risk_bundles.bundle_data->>'overall_risk_level'` disagree?

**Resolution:** Prioritize `risk_bundles` as it's the newer, more deterministic source. If both exist and differ, log a warning and use `risk_bundles`.

---

### 10.2 Missing Foreign Keys

**Issue:** `processing_jobs.assessment_id` is a soft reference (no FK constraint).

**Resolution:** Always use LEFT JOIN when querying processing_jobs. Treat missing job as "no processing initiated yet."

---

### 10.3 Multiple Processing Jobs per Assessment

**Issue:** An assessment might have multiple processing jobs (retries).

**Resolution:** Use `ORDER BY pj.created_at DESC LIMIT 1` to get the most recent job when computing attention items.

---

### 10.4 Resolved Definition Ambiguity

**Issue:** Should "resolved" mean "review approved" or "report delivered"?

**Resolution:** Per Rule R-E78.1-004, **both** conditions are valid for `resolved` state:
- Option A: Review approved (clinical workflow complete)
- Option B: Report delivered (patient delivery complete)

Use `OR` logic to capture both scenarios. This accommodates workflows where review may be skipped or where delivery is the final milestone.

---

## 11. Future Enhancements (v2+)

The following features are **not** implemented in v1 but are planned for future iterations:

1. **`snoozed` state**: Requires new table `case_snooze_log` with `snoozed_until` timestamp
2. **`manual_flag` attention item**: Requires new table `manual_case_flags`
3. **Database-backed SLA config**: Move from ENV to `inbox_config` table with per-org overrides
4. **Case notes**: Allow clinicians to add free-text notes to cases
5. **Bulk actions**: Mark multiple cases as resolved, snooze, etc.
6. **Assignment tracking**: Link cases to specific clinician assignments

---

## 12. References

- **Schema:** `/schema/schema.sql`
- **Triage System Map:** `/docs/triage_system_map.md`
- **Related Tables:**
  - `assessments` (lines 2277-2289)
  - `reports` (lines 4065-4086)
  - `review_records` (lines 4160-4182)
  - `risk_bundles` (lines 4256-4267)
  - `processing_jobs` (lines 3827-3852)
  - `patient_funnels` (lines 3542-3553)

---

## Appendix A: SQL Implementation Examples

### A.1 Complete Case Query Example

```sql
WITH latest_jobs AS (
  SELECT DISTINCT ON (assessment_id)
    assessment_id,
    id,
    status,
    stage,
    attempt,
    max_attempts,
    delivery_status
  FROM processing_jobs
  ORDER BY assessment_id, created_at DESC
),
case_attention AS (
  SELECT
    a.id AS case_id,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN (
        EXISTS (SELECT 1 FROM reports r WHERE r.assessment_id = a.id AND r.risk_level = 'high')
        OR EXISTS (SELECT 1 FROM risk_bundles rb JOIN latest_jobs lj ON lj.id = rb.job_id WHERE lj.assessment_id = a.id AND rb.bundle_data->>'overall_risk_level' = 'critical')
      ) THEN 'critical_flag' END,
      
      CASE WHEN (
        a.status = 'in_progress' AND a.started_at < (NOW() - INTERVAL '7 days') AND a.completed_at IS NULL
      ) THEN 'overdue' END,
      
      CASE WHEN (
        EXISTS (SELECT 1 FROM latest_jobs lj WHERE lj.assessment_id = a.id AND lj.status = 'failed' AND lj.attempt >= lj.max_attempts)
      ) THEN 'stuck' END,
      
      CASE WHEN (
        a.status = 'completed' AND a.workup_status = 'ready_for_review'
      ) THEN 'review_ready' END,
      
      CASE WHEN (
        a.missing_data_fields IS NOT NULL AND jsonb_array_length(a.missing_data_fields) > 0
      ) THEN 'missing_data' END
    ], NULL) AS attention_items
  FROM assessments a
  LEFT JOIN latest_jobs lj ON lj.assessment_id = a.id
)
SELECT
  a.id AS case_id,
  a.patient_id,
  a.funnel_id,
  a.started_at,
  a.completed_at,
  
  -- Case state computation
  CASE
    WHEN EXISTS (SELECT 1 FROM review_records rr JOIN latest_jobs lj ON lj.id = rr.job_id WHERE lj.assessment_id = a.id AND rr.status = 'APPROVED')
      OR EXISTS (SELECT 1 FROM latest_jobs lj WHERE lj.assessment_id = a.id AND lj.delivery_status = 'DELIVERED')
      THEN 'resolved'
    WHEN a.status = 'completed' AND a.workup_status = 'ready_for_review'
      THEN 'ready_for_review'
    WHEN a.status = 'in_progress' AND a.workup_status = 'needs_more_data'
      THEN 'needs_input'
    WHEN a.status = 'in_progress'
      THEN 'in_progress'
    ELSE 'in_progress'
  END AS case_state,
  
  ca.attention_items,
  
  -- Attention level computation
  CASE
    WHEN 'critical_flag' = ANY(ca.attention_items) THEN 'critical'
    WHEN 'overdue' = ANY(ca.attention_items) OR 'stuck' = ANY(ca.attention_items) THEN 'warn'
    WHEN array_length(ca.attention_items, 1) > 0 THEN 'info'
    ELSE 'none'
  END AS attention_level,
  
  -- Priority score computation (simplified)
  (
    CASE WHEN 'critical_flag' = ANY(ca.attention_items) THEN 500 ELSE 0 END +
    CASE WHEN 'overdue' = ANY(ca.attention_items) THEN 300 ELSE 0 END +
    CASE WHEN 'stuck' = ANY(ca.attention_items) THEN 150 ELSE 0 END +
    CASE 
      WHEN a.status = 'completed' AND a.workup_status = 'ready_for_review' THEN 200
      WHEN a.status = 'in_progress' AND a.workup_status = 'needs_more_data' THEN 150
      ELSE 50
    END +
    LEAST(EXTRACT(EPOCH FROM (NOW() - a.started_at)) / 86400 * 2, 100)::INTEGER
  ) AS priority_score

FROM assessments a
LEFT JOIN latest_jobs lj ON lj.assessment_id = a.id
CROSS JOIN case_attention ca
WHERE ca.case_id = a.id
  AND a.status IN ('in_progress', 'completed')  -- Active cases only
ORDER BY priority_score DESC, a.started_at ASC;
```

---

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-02-05 | 1.0 | E78.1 | Initial specification |

---

**End of Specification**
