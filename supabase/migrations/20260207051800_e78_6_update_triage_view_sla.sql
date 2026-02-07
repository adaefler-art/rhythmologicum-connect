-- Migration: E78.6 — Update triage_cases_v1 to use configurable SLA
-- Date: 2026-02-07
-- Purpose: Replace hardcoded '7 days' with configurable SLA from funnel_triage_settings or default

-- Drop the existing view
DROP VIEW IF EXISTS public.triage_cases_v1;

-- Recreate the view with configurable SLA
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
  
  -- E78.6: Get SLA configuration per funnel (v1.1)
  funnel_sla_config AS (
    SELECT
      a.id AS assessment_id,
      a.funnel_id,
      COALESCE(
        fts.overdue_days,  -- Funnel-specific setting (highest priority)
        7                   -- Default fallback (7 days)
      ) AS sla_days
    FROM assessments a
    LEFT JOIN funnel_triage_settings fts ON fts.funnel_id = a.funnel_id
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
        
        -- R-E78.1-007 + E78.6: overdue (in-progress) - using configurable SLA
        CASE WHEN (
          a.status = 'in_progress'
          AND a.started_at < (NOW() - (fsc.sla_days || ' days')::INTERVAL)
          AND a.completed_at IS NULL
        ) THEN 'overdue'::text END,
        
        -- R-E78.1-007: overdue (completed but not reviewed) - still 2 days for review
        CASE WHEN (
          a.status = 'completed'
          AND a.completed_at < (NOW() - INTERVAL '2 days')
          AND NOT EXISTS (
            SELECT 1 FROM latest_reviews lr
            WHERE lr.assessment_id = a.id
            AND lr.review_status IN ('APPROVED', 'REJECTED')
          )
        ) THEN 'overdue'::text END,
        
        -- R-E78.1-008 + E78.6: stuck - using 2x SLA for stuck threshold
        CASE WHEN (
          EXISTS (
            SELECT 1 FROM latest_jobs lj
            WHERE lj.assessment_id = a.id
            AND lj.job_status = 'failed'
            AND lj.attempt >= lj.max_attempts
          )
          OR (
            a.status = 'in_progress'
            AND a.started_at < (NOW() - (fsc.sla_days * 2 || ' days')::INTERVAL)
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
            AND lr.review_status IN ('APPROVED', 'REJECTED')
          )
        ) THEN 'review_ready'::text END,
        
        -- R-E78.5-009: manual_flag (from HITL actions)
        CASE WHEN (
          lmf.action_type = 'manual_flag'
        ) THEN 'manual_flag'::text END,
        
        -- R-E78.1-011: missing_data
        CASE WHEN (
          a.workup_status = 'needs_more_data'
          AND a.status = 'in_progress'
        ) THEN 'missing_data'::text END
      ], NULL) AS attention_items_array
    FROM assessments a
    LEFT JOIN funnel_sla_config fsc ON fsc.assessment_id = a.id
    LEFT JOIN latest_manual_flag lmf ON lmf.assessment_id = a.id
  )

-- Main query
SELECT
  -- Case Identity (Section 1)
  a.id AS case_id,
  a.patient_id,
  a.funnel_id,
  
  -- Case State (Section 2) - with R-E78.5-005 effective state integration
  CASE
    -- R-E78.5-005: Manual close overrides auto-resolution
    WHEN lcr.action_type = 'close' THEN 'resolved'::text
    
    -- R-E78.5-006: Snoozed state (active snooze)
    WHEN (
      ls.snoozed_until_str IS NOT NULL
      AND (ls.snoozed_until_str::TIMESTAMPTZ) > NOW()
    ) THEN 'snoozed'::text
    
    -- R-E78.1-001: needs_input
    WHEN (
      a.status = 'in_progress'
      AND a.workup_status = 'needs_more_data'
      AND a.completed_at IS NULL
    ) THEN 'needs_input'::text
    
    -- R-E78.1-002: in_progress
    WHEN (
      a.status = 'in_progress'
      AND a.workup_status IS NULL
      AND a.completed_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM latest_jobs lj 
        WHERE lj.assessment_id = a.id 
        AND lj.job_status = 'failed'
      )
    ) THEN 'in_progress'::text
    
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
    
    -- R-E78.1-004: resolved (review approved OR delivery completed)
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
    
    ELSE 'in_progress'::text
  END AS case_state,
  
  -- Attention Items (Section 3)
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
  
  -- Next Action (Section 4)
  CASE
    WHEN a.status = 'in_progress' AND a.workup_status = 'needs_more_data' 
      THEN 'patient_provide_data'::text
    WHEN a.status = 'completed' AND a.workup_status = 'ready_for_review'
      THEN 'clinician_review'::text
    WHEN a.status = 'completed'
      THEN 'none'::text
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
          SELECT 1 FROM latest_reviews lr2
          WHERE lr2.assessment_id = a.id
          AND lr2.review_status = 'APPROVED'
        )
        OR EXISTS (
          SELECT 1 FROM latest_jobs lj2
          WHERE lj2.assessment_id = a.id
          AND lj2.delivery_status = 'DELIVERED'
        )
      )
    ) THEN false
    -- Snoozed cases are not active in inbox
    WHEN (
      ls.snoozed_until_str IS NOT NULL
      AND (ls.snoozed_until_str::TIMESTAMPTZ) > NOW()
    ) THEN false
    ELSE true
  END AS is_active,
  
  -- R-E78.5-008: HITL action metadata
  ls.snoozed_until_str::TIMESTAMPTZ AS snoozed_until,
  CASE WHEN lcr.action_type = 'close' THEN true ELSE false END AS is_manually_closed,
  CASE WHEN lmf.action_type = 'manual_flag' THEN true ELSE false END AS has_manual_flag,
  lmf.flag_severity AS manual_flag_severity,
  lmf.flag_reason AS manual_flag_reason,
  la.acknowledged_at,
  
  -- E78.6: SLA configuration and due date
  fsc.sla_days,
  (a.started_at + (fsc.sla_days || ' days')::INTERVAL) AS due_at,
  
  -- Enrichment (optional)
  a.funnel_id AS funnel_id_enrichment
FROM assessments a
LEFT JOIN latest_jobs lj ON lj.assessment_id = a.id
LEFT JOIN latest_reviews lr ON lr.assessment_id = a.id
LEFT JOIN latest_snooze ls ON ls.assessment_id = a.id
LEFT JOIN latest_close_reopen lcr ON lcr.assessment_id = a.id
LEFT JOIN latest_manual_flag lmf ON lmf.assessment_id = a.id
LEFT JOIN latest_acknowledge la ON la.assessment_id = a.id
LEFT JOIN funnel_sla_config fsc ON fsc.assessment_id = a.id
JOIN attention_computation ac ON ac.assessment_id = a.id;

-- Update comment
COMMENT ON VIEW public.triage_cases_v1 IS 'E78.5: Enhanced SSOT aggregation view for triage inbox with HITL action integration and E78.6 configurable SLA. Provides deterministic case states with effective state computation from manual interventions. Includes snoozed_until, is_manually_closed, manual_flag details, acknowledged_at, and configurable SLA (due_at, sla_days).';

-- Restore grants
GRANT ALL ON TABLE public.triage_cases_v1 TO anon;
GRANT ALL ON TABLE public.triage_cases_v1 TO authenticated;
GRANT ALL ON TABLE public.triage_cases_v1 TO service_role;
