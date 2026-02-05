-- Migration: E78.2 — SSOT Aggregation v1: triage_cases_v1
-- Description: Creates deterministic view for triage inbox with case states, attention items, and next actions
-- Date: 2026-02-05
-- Epic: E78.2
-- Spec: docs/triage/inbox-v1.md

-- Drop view if exists (for idempotent migrations)
DROP VIEW IF EXISTS public.triage_cases_v1;

-- Create the triage_cases_v1 view
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
  
  -- Compute attention items for each assessment
  attention_computation AS (
    SELECT
      a.id AS assessment_id,
      
      -- Build attention items array (Rule R-E78.1-006 to R-E78.1-011)
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
  CASE
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
  CASE
    WHEN 'critical_flag' = ANY(ac.attention_items_array) THEN 'critical'::text
    WHEN 'overdue' = ANY(ac.attention_items_array) OR 'stuck' = ANY(ac.attention_items_array) THEN 'warn'::text
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
  
  -- Active status (excludes resolved and snoozed)
  CASE
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
  
  -- Snoozed (reserved for v2+)
  NULL::timestamptz AS snoozed_until,
  
  -- Priority score computation (Section 5.1)
  (
    -- Attention level contribution (0-500 points)
    CASE
      WHEN 'critical_flag' = ANY(ac.attention_items_array) THEN 500
      WHEN 'overdue' = ANY(ac.attention_items_array) OR 'stuck' = ANY(ac.attention_items_array) THEN 300
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
    CASE WHEN 'overdue' = ANY(ac.attention_items_array) THEN 100 ELSE 0 END
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
LEFT JOIN attention_computation ac ON ac.assessment_id = a.id
LEFT JOIN patient_profiles pp ON pp.id = a.patient_id
LEFT JOIN funnels_catalog f ON f.id = a.funnel_id

-- Filter to assessments that are trackable (in_progress or completed)
WHERE a.status IN ('in_progress', 'completed');

-- Add comment
COMMENT ON VIEW public.triage_cases_v1 IS 'E78.2: SSOT aggregation view for triage inbox. Provides deterministic case states, attention items, and next actions based on E78.1 specification. No direct risk/score fields exposed.';

-- Create indexes on underlying tables for performance
-- (Only if they don't already exist)

CREATE INDEX IF NOT EXISTS idx_assessments_status_started_at 
  ON public.assessments(status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessments_patient_funnel 
  ON public.assessments(patient_id, funnel_id);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_assessment_created 
  ON public.processing_jobs(assessment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_records_job_id 
  ON public.review_records(job_id);

CREATE INDEX IF NOT EXISTS idx_reports_assessment_id 
  ON public.reports(assessment_id);

CREATE INDEX IF NOT EXISTS idx_risk_bundles_job_id 
  ON public.risk_bundles(job_id);

-- End of migration
