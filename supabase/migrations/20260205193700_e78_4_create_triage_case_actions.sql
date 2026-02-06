-- Migration: E78.4 — HITL Actions v1: triage_case_actions table
-- Description: Creates table for tracking human-in-the-loop interventions on triage cases
-- Date: 2026-02-05
-- Epic: E78.4
-- Issue: E78.4 — HITL Actions v1: triage_case_actions (DB) + Endpoints

-- Purpose: HITL can intervene in v1 without auto-jobs overwriting their actions.
-- Manual flags, snooze states, and other interventions are recorded here.

-- Create enum for action types (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'triage_action_type'
  ) THEN
    CREATE TYPE public.triage_action_type AS ENUM (
      'acknowledge',
      'snooze',
      'close',
      'reopen',
      'manual_flag',
      'clear_manual_flag',
      'add_note'
    );
  END IF;
END $$;

COMMENT ON TYPE public.triage_action_type IS 'E78.4: Types of HITL actions that can be taken on triage cases';

-- Create the triage_case_actions table
CREATE TABLE IF NOT EXISTS public.triage_case_actions (
  -- Primary identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Actor (who performed the action)
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Target case references
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES public.funnels_catalog(id) ON DELETE SET NULL,
  
  -- Action details
  action_type public.triage_action_type NOT NULL,
  
  -- Flexible payload for action-specific data
  -- Examples:
  --   snooze: { "snoozed_until": "2026-02-10T12:00:00Z" }
  --   manual_flag: { "severity": "critical", "reason": "patient escalation" }
  --   add_note: { "note": "Follow up next week" }
  payload JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT triage_case_actions_payload_not_null CHECK (payload IS NOT NULL)
);

-- Comments
COMMENT ON TABLE public.triage_case_actions IS 'E78.4: Records HITL interventions on triage cases. Actions are append-only and never deleted by auto-jobs.';

COMMENT ON COLUMN public.triage_case_actions.id IS 'Unique identifier for the action';
COMMENT ON COLUMN public.triage_case_actions.created_at IS 'Timestamp when the action was performed';
COMMENT ON COLUMN public.triage_case_actions.created_by IS 'Clinician/admin who performed the action';
COMMENT ON COLUMN public.triage_case_actions.patient_id IS 'Patient ID associated with the case';
COMMENT ON COLUMN public.triage_case_actions.assessment_id IS 'Assessment ID (case_id) being acted upon';
COMMENT ON COLUMN public.triage_case_actions.funnel_id IS 'Funnel ID associated with the case (denormalized for performance)';
COMMENT ON COLUMN public.triage_case_actions.action_type IS 'Type of action: acknowledge | snooze | close | reopen | manual_flag | clear_manual_flag | add_note';
COMMENT ON COLUMN public.triage_case_actions.payload IS 'Action-specific metadata (e.g., snoozed_until, note, severity)';

-- Indexes for performance
-- R-E78.4-001: Index on assessment_id for fast case lookup
CREATE INDEX IF NOT EXISTS idx_triage_case_actions_assessment_id 
  ON public.triage_case_actions(assessment_id);

-- R-E78.4-002: Index on patient_id for patient-scoped queries
CREATE INDEX IF NOT EXISTS idx_triage_case_actions_patient_id 
  ON public.triage_case_actions(patient_id);

-- R-E78.4-003: Index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_triage_case_actions_created_at 
  ON public.triage_case_actions(created_at DESC);

-- R-E78.4-004: Composite index for assessment + action_type queries
CREATE INDEX IF NOT EXISTS idx_triage_case_actions_assessment_action 
  ON public.triage_case_actions(assessment_id, action_type, created_at DESC);

-- R-E78.4-005: Index on created_by for clinician activity tracking
CREATE INDEX IF NOT EXISTS idx_triage_case_actions_created_by 
  ON public.triage_case_actions(created_by, created_at DESC);

-- RLS Policies
-- Enable RLS on the table
ALTER TABLE public.triage_case_actions ENABLE ROW LEVEL SECURITY;

-- R-E78.4-006: Clinicians can read actions for patients in their org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'triage_case_actions'
      AND policyname = 'triage_case_actions_read_clinician'
  ) THEN
    CREATE POLICY triage_case_actions_read_clinician
      ON public.triage_case_actions
      FOR SELECT
      USING (
        -- User must be clinician or admin
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND (
            raw_app_meta_data->>'role' = 'clinician' 
            OR raw_app_meta_data->>'role' = 'admin'
          )
        )
        -- Patient must be in the same org (via org_memberships)
        AND EXISTS (
          SELECT 1 FROM org_memberships om1
          WHERE om1.user_id = patient_id
          AND EXISTS (
            SELECT 1 FROM org_memberships om2
            WHERE om2.user_id = auth.uid()
            AND om2.org_id = om1.org_id
          )
        )
      );
  END IF;
END $$;

-- R-E78.4-007: Clinicians can insert actions for patients in their org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'triage_case_actions'
      AND policyname = 'triage_case_actions_insert_clinician'
  ) THEN
    CREATE POLICY triage_case_actions_insert_clinician
      ON public.triage_case_actions
      FOR INSERT
      WITH CHECK (
        -- User must be clinician or admin
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND (
            raw_app_meta_data->>'role' = 'clinician' 
            OR raw_app_meta_data->>'role' = 'admin'
          )
        )
        -- created_by must match auth.uid()
        AND created_by = auth.uid()
        -- Patient must be in the same org
        AND EXISTS (
          SELECT 1 FROM org_memberships om1
          WHERE om1.user_id = patient_id
          AND EXISTS (
            SELECT 1 FROM org_memberships om2
            WHERE om2.user_id = auth.uid()
            AND om2.org_id = om1.org_id
          )
        )
      );
  END IF;
END $$;

-- R-E78.4-008: No updates or deletes allowed (append-only log)
-- This is enforced by not creating UPDATE or DELETE policies
-- RLS will deny all updates and deletes by default

-- End of migration
