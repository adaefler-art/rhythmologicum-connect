-- Migration: E78.5 — Auto + HITL Merge: Effective Case Berechnung
-- Description: Integrates HITL actions into triage_cases_v1 view for effective state computation
-- Date: 2026-02-07
-- Epic: E78.5
-- Issue: E78.5 — Auto + HITL Merge: "Effective Case" Berechnung (snooze/close/manual) + Audit Hooks

-- Purpose: Compute effective state from HITL actions without destroying base assessment data.
-- HITL actions (snooze, close, reopen, manual_flag, acknowledge) are merged into the view
-- to provide the "effective" state that clinicians see in the inbox.

-- R-E78.5-001: snoozed_until is derived from latest 'snooze' action
-- R-E78.5-002: is_closed is derived from latest 'close'/'reopen' action
-- R-E78.5-003: manual_flag is derived from latest 'manual_flag'/'clear_manual_flag' action
-- R-E78.5-004: acknowledged_at is derived from latest 'acknowledge' action
-- R-E78.5-005: Effective state affects display/inbox status, not raw assessment data
-- R-E78.5-006: Auto-items continue to be calculated normally
-- R-E78.5-007: Closed cases filtered out when activeOnly=true
-- R-E78.5-008: Snoozed cases (snoozed_until > now) filtered out when activeOnly=true
-- R-E78.5-009: Manual flag appears as attention item
-- R-E78.5-010: All HITL actions are recorded in triage_case_actions (audit log)

-- Drop and recreate the view
DROP VIEW IF EXISTS public.triage_cases_v1;

-- Create the enhanced triage_cases_v1 view with HITL integration
CREATE OR REPLACE VIEW public.triage_cases_v1 AS
WITH 
  -- Get the most recent processing job per assessment
  latest_jobs AS (
    SELECT DISTINCT ON (assessment_id)
      assessment_id,
      id AS job_id,
      status AS job_status,
      stage AS job_stage,
      attempt,
      max_attempts,
      delivery_status,
      created_at AS job_created_at
    FROM processing_jobs
    ORDER BY assessment_id, created_at DESC
  ),
  
  -- Get the most recent review record per assessment
  latest_reviews AS (
    SELECT DISTINCT ON (pj.assessment_id)
      pj.assessment_id,
      rr.status AS review_status,
      rr.decided_at
    FROM review_records rr
    JOIN processing_jobs pj ON pj.id = rr.job_id
    ORDER BY pj.assessment_id, rr.created_at DESC
  ),
  
  -- R-E78.5-001: Get latest snooze action per assessment
  latest_snooze AS (
    SELECT DISTINCT ON (assessment_id)
      assessment_id,
      payload->>'snoozed_until' AS snoozed_until_str,
      created_at AS snooze_created_at
    FROM triage_case_actions
    WHERE action_type = 'snooze'
    ORDER BY assessment_id, created_at DESC
  ),
  
  -- R-E78.5-002: Get latest close/reopen action per assessment
  latest_close_reopen AS (
    SELECT DISTINCT ON (assessment_id)
      assessment_id,
      action_type,
      created_at AS close_reopen_at
    FROM triage_case_actions
    WHERE action_type IN ('close', 'reopen')
    ORDER BY assessment_id, created_at DESC
  ),
  
  -- R-E78.5-003: Get latest manual_flag/clear action per assessment
  latest_manual_flag AS (
    SELECT DISTINCT ON (assessment_id)
      assessment_id,
      action_type,
      payload->>'severity' AS flag_severity,
      payload->>'reason' AS flag_reason,
      created_at AS flag_created_at
    FROM triage_case_actions
    WHERE action_type IN ('manual_flag', 'clear_manual_flag')
    ORDER BY assessment_id, created_at DESC
  ),
  
  -- R-E78.5-004: Get latest acknowledge action per assessment
  latest_acknowledge AS (
    SELECT DISTINCT ON (assessment_id)
      assessment_id,
      created_at AS acknowledged_at
    FROM triage_case_actions
    WHERE action_type = 'acknowledge'
    ORDER BY assessment_id, created_at DESC
  ),
  
  -- Compute attention items for each assessment (with manual_flag integration)
  attention_computation AS (
    SELECT
      a.id AS assessment_id,
      
      -- Build attention items array (Rule R-E78.1-006 to R-E78.1-011 + R-E78.5-009)
      ARRAY_REMOVE(ARRAY[
        -- R-E78.1-006: critical_flag
        CASE WHEN (
          EXISTS (
            SELECT 1 FROM reports r 
            WHERE r.assessment_id = a.id 
            AND r.risk_level = 'high'
          )
          OR EXISTS (
            SELECT 1 FROM risk_bundles rb 
            JOIN latest_jobs lj ON lj.job_id = rb.job_id 
            WHERE lj.assessment_id = a.id 
            AND rb.bundle_data->>'overall_risk_level' = 'critical'
          )
          OR EXISTS (
            SELECT 1 FROM safety_check_results scr 
            JOIN latest_jobs lj ON lj.job_id = scr.job_id 
            WHERE lj.assessment_id = a.id 
            AND scr.overall_action = 'BLOCK'
          )
        ) THEN 'critical_flag'::text END,
        
        -- R-E78.1-007: overdue (in-progress)
        CASE WHEN (
          a.status = 'in_progress'
          AND a.started_at < (NOW() - INTERVAL '7 days')
          AND a.completed_at IS NULL
        ) THEN 'overdue'::text END,
        
        -- R-E78.1-007: overdue (completed but not reviewed)
        CASE WHEN (
          a.status = 'completed'
          AND a.completed_at < (NOW() - INTERVAL '2 days')
          AND NOT EXISTS (
            SELECT 1 FROM latest_reviews lr
            WHERE lr.assessment_id = a.id
            AND lr.review_status IN ('APPROVED', 'REJECTED')
          )
        ) THEN 'overdue'::text END,
        
        -- R-E78.1-008: stuck
        CASE WHEN (
          EXISTS (
            SELECT 1 FROM latest_jobs lj
            WHERE lj.assessment_id = a.id
            AND lj.job_status = 'failed'
            AND lj.attempt >= lj.max_attempts
          )
          OR (
            a.status = 'in_progress'
            AND a.started_at < (NOW() - INTERVAL '14 days')
            AND a.completed_at IS NULL
          )
        ) THEN 'stuck'::text END,
        
        -- R-E78.1-009: review_ready
        CASE WHEN (
          a.status = 'completed'
          AND a.workup_status = 'ready_for_review'
          AND NOT EXISTS (
            SELECT 1 FROM latest_reviews lr
            WHERE lr.assessment_id = a.id
            AND lr.review_status != 'PENDING'
          )
        ) THEN 'review_ready'::text END,
        
        -- R-E78.5-009: manual_flag (from HITL actions)
        CASE WHEN (
          EXISTS (
            SELECT 1 FROM latest_manual_flag lmf
            WHERE lmf.assessment_id = a.id
            AND lmf.action_type = 'manual_flag'
          )
        ) THEN 'manual_flag'::text END,
        
        -- R-E78.1-011: missing_data
        CASE WHEN (
          a.status = 'in_progress'
          AND a.missing_data_fields IS NOT NULL
          AND jsonb_array_length(a.missing_data_fields) > 0
        ) THEN 'missing_data'::text END
        
      ], NULL) AS attention_items_array
      
    FROM assessments a
    LEFT JOIN latest_jobs lj ON lj.assessment_id = a.id
  )
  
SELECT
  -- Core identity fields
  a.id AS case_id,
  a.patient_id,
  a.funnel_id,
  f.slug AS funnel_slug,
  
  -- Patient display information (enrichment)
  pp.first_name,
  pp.last_name,
  pp.preferred_name,
  COALESCE(
    pp.preferred_name,
    CONCAT(pp.first_name, ' ', pp.last_name)
  ) AS patient_display,
  
  -- Case state computation (Rules R-E78.1-001 to R-E78.1-005)
  -- R-E78.5-005: Manual close overrides auto state
  CASE
    -- Manual close state (HITL override)
    WHEN lcr.action_type = 'close' THEN 'resolved'::text
    
    -- R-E78.1-004: resolved (highest priority - terminal state)
    WHEN (
      a.status = 'completed'
      AND (
        EXISTS (
          SELECT 1 FROM latest_reviews lr
          WHERE lr.assessment_id = a.id
          AND lr.review_status = 'APPROVED'
        )
        OR EXISTS (
          SELECT 1 FROM latest_jobs lj
          WHERE lj.assessment_id = a.id
          AND lj.delivery_status = 'DELIVERED'
        )
      )
    ) THEN 'resolved'::text
    
    -- R-E78.1-003: ready_for_review
    WHEN (
      a.status = 'completed'
      AND a.workup_status = 'ready_for_review'
      AND NOT EXISTS (
        SELECT 1 FROM latest_reviews lr
        WHERE lr.assessment_id = a.id
        AND lr.review_status IN ('APPROVED', 'REJECTED')
      )
    ) THEN 'ready_for_review'::text
    
    -- Alternative ready_for_review (no workup_status)
    WHEN (
      a.status = 'completed'
      AND EXISTS (
        SELECT 1 FROM latest_jobs lj
        WHERE lj.assessment_id = a.id
        AND lj.job_status = 'completed'
        AND lj.job_stage = 'report_generated'
      )
      AND NOT EXISTS (
        SELECT 1 FROM latest_reviews lr
        WHERE lr.assessment_id = a.id
        AND lr.review_status IN ('APPROVED', 'REJECTED')
      )
    ) THEN 'ready_for_review'::text
    
    -- R-E78.1-001: needs_input
    WHEN (
      a.status = 'in_progress'
      AND a.workup_status = 'needs_more_data'
      AND a.completed_at IS NULL
    ) THEN 'needs_input'::text
    
    -- R-E78.1-002: in_progress (default for in_progress status)
    WHEN (
      a.status = 'in_progress'
      AND a.completed_at IS NULL
    ) THEN 'in_progress'::text
    
    ELSE 'in_progress'::text
  END AS case_state,
  
  -- Attention items and level
  ac.attention_items_array AS attention_items,
  
  -- Attention level computation (Section 3.4)
  -- R-E78.5-009: Manual flag contributes to attention level
  CASE
    WHEN 'critical_flag' = ANY(ac.attention_items_array) THEN 'critical'::text
    WHEN 'overdue' = ANY(ac.attention_items_array) OR 'stuck' = ANY(ac.attention_items_array) THEN 'warn'::text
    WHEN 'manual_flag' = ANY(ac.attention_items_array) THEN 'warn'::text
    WHEN array_length(ac.attention_items_array, 1) > 0 THEN 'info'::text
    ELSE 'none'::text
  END AS attention_level,
  
  -- Next action computation (Rules R-E78.1-012 to R-E78.1-019)
  CASE
    -- R-E78.1-016: clinician_review with critical priority
    WHEN (
      a.status = 'completed'
      AND a.workup_status = 'ready_for_review'
      AND 'critical_flag' = ANY(ac.attention_items_array)
    ) THEN 'clinician_review'::text
    
    -- R-E78.1-019: admin_investigate
    WHEN (
      'stuck' = ANY(ac.attention_items_array)
      AND EXISTS (
        SELECT 1 FROM latest_jobs lj
        WHERE lj.assessment_id = a.id
        AND lj.job_status = 'failed'
        AND lj.attempt >= lj.max_attempts
      )
    ) THEN 'admin_investigate'::text
    
    -- R-E78.1-015: clinician_review
    WHEN (
      a.status = 'completed'
      AND a.workup_status = 'ready_for_review'
    ) THEN 'clinician_review'::text
    
    -- R-E78.1-014: clinician_contact
    WHEN (
      a.status = 'in_progress'
      AND 'stuck' = ANY(ac.attention_items_array)
    ) THEN 'clinician_contact'::text
    
    -- R-E78.1-018: system_retry
    WHEN (
      EXISTS (
        SELECT 1 FROM latest_jobs lj
        WHERE lj.assessment_id = a.id
        AND lj.job_status = 'failed'
        AND lj.attempt < lj.max_attempts
      )
    ) THEN 'system_retry'::text
    
    -- R-E78.1-012: patient_provide_data
    WHEN (
      a.status = 'in_progress'
      AND a.workup_status = 'needs_more_data'
    ) THEN 'patient_provide_data'::text
    
    -- R-E78.1-013: patient_continue
    WHEN (
      a.status = 'in_progress'
      AND NOT ('stuck' = ANY(ac.attention_items_array))
    ) THEN 'patient_continue'::text
    
    -- R-E78.1-017: none (resolved)
    WHEN (
      a.status = 'completed'
      AND (
        EXISTS (
          SELECT 1 FROM latest_reviews lr
          WHERE lr.assessment_id = a.id
          AND lr.review_status = 'APPROVED'
        )
        OR EXISTS (
          SELECT 1 FROM latest_jobs lj
          WHERE lj.assessment_id = a.id
          AND lj.delivery_status = 'DELIVERED'
        )
      )
    ) THEN 'none'::text
    
    ELSE 'patient_continue'::text
  END AS next_action,
  
  -- Timestamps
  a.started_at AS assigned_at,
  GREATEST(
    a.started_at,
    COALESCE(lj.job_created_at, a.started_at),
    COALESCE(lr.decided_at, a.started_at)
  ) AS last_activity_at,
  a.started_at AS updated_at,
  a.completed_at,
  
  -- R-E78.5-007: Active status (excludes resolved and manually closed)
  CASE
    -- Manually closed cases are not active
    WHEN lcr.action_type = 'close' THEN false
    -- Auto-resolved cases are not active
    WHEN (
      a.status = 'completed'
      AND (
        EXISTS (
          SELECT 1 FROM latest_reviews lr
          WHERE lr.assessment_id = a.id
          AND lr.review_status = 'APPROVED'
        )
        OR EXISTS (
          SELECT 1 FROM latest_jobs lj
          WHERE lj.assessment_id = a.id
          AND lj.delivery_status = 'DELIVERED'
        )
      )
    ) THEN false
    ELSE true
  END AS is_active,
  
  -- R-E78.5-001: Snoozed until (from HITL snooze action)
  CASE
    WHEN ls.snoozed_until_str IS NOT NULL THEN
      (ls.snoozed_until_str)::timestamptz
    ELSE NULL
  END AS snoozed_until,
  
  -- R-E78.5-002: Manual close flag (boolean for easy filtering)
  CASE
    WHEN lcr.action_type = 'close' THEN true
    ELSE false
  END AS is_manually_closed,
  
  -- R-E78.5-003: Manual flag details (for badge display)
  lmf.flag_severity AS manual_flag_severity,
  lmf.flag_reason AS manual_flag_reason,
  
  -- R-E78.5-004: Acknowledged timestamp
  la.acknowledged_at,
  
  -- Priority score computation (Section 5.1)
  -- R-E78.5-009: Manual flag adds to priority score
  (
    -- Attention level contribution (0-500 points)
    CASE
      WHEN 'critical_flag' = ANY(ac.attention_items_array) THEN 500
      WHEN 'overdue' = ANY(ac.attention_items_array) OR 'stuck' = ANY(ac.attention_items_array) THEN 300
      WHEN 'manual_flag' = ANY(ac.attention_items_array) THEN 250
      WHEN array_length(ac.attention_items_array, 1) > 0 THEN 100
      ELSE 0
    END +
    
    -- Case state priority (0-200 points)
    CASE
      WHEN a.status = 'completed' AND a.workup_status = 'ready_for_review' THEN 200
      WHEN a.status = 'in_progress' AND a.workup_status = 'needs_more_data' THEN 150
      WHEN a.status = 'in_progress' THEN 50
      ELSE 0
    END +
    
    -- Age-based urgency (0-100 points, 2 points per day)
    LEAST(
      EXTRACT(EPOCH FROM (NOW() - a.started_at))::INTEGER / 86400 * 2,
      100
    ) +
    
    -- Specific attention items (0-200 points)
    CASE WHEN 'critical_flag' = ANY(ac.attention_items_array) THEN 200 ELSE 0 END +
    CASE WHEN 'stuck' = ANY(ac.attention_items_array) THEN 150 ELSE 0 END +
    CASE WHEN 'overdue' = ANY(ac.attention_items_array) THEN 100 ELSE 0 END +
    CASE WHEN 'manual_flag' = ANY(ac.attention_items_array) THEN 75 ELSE 0 END
  )::INTEGER AS priority_score,
  
  -- Processing job summary (for enrichment)
  lj.job_id,
  lj.job_status,
  lj.job_stage,
  lj.delivery_status,
  
  -- Review summary (for enrichment)
  lr.review_status,
  lr.decided_at AS review_decided_at

FROM assessments a
LEFT JOIN latest_jobs lj ON lj.assessment_id = a.id
LEFT JOIN latest_reviews lr ON lr.assessment_id = a.id
LEFT JOIN latest_snooze ls ON ls.assessment_id = a.id
LEFT JOIN latest_close_reopen lcr ON lcr.assessment_id = a.id
LEFT JOIN latest_manual_flag lmf ON lmf.assessment_id = a.id
LEFT JOIN latest_acknowledge la ON la.assessment_id = a.id
LEFT JOIN attention_computation ac ON ac.assessment_id = a.id
LEFT JOIN patient_profiles pp ON pp.id = a.patient_id
LEFT JOIN funnels_catalog f ON f.id = a.funnel_id

-- Filter to assessments that are trackable (in_progress or completed)
WHERE a.status IN ('in_progress', 'completed');

-- Add comment
COMMENT ON VIEW public.triage_cases_v1 IS 'E78.5: Enhanced SSOT aggregation view for triage inbox with HITL action integration. Provides deterministic case states with effective state computation from manual interventions. Includes snoozed_until, is_manually_closed, manual_flag details, and acknowledged_at from triage_case_actions.';

-- End of migration
