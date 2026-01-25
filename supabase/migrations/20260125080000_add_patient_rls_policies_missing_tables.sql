-- Migration: Add Patient RLS Policies for Missing Tables
-- Purpose: Fix R-DB-009 violations by adding patient-oriented RLS policies
--          to tables that have patient_id but no patient access policies
-- Date: 2026-01-25
-- Issue: E72.ALIGN.P0.DBSEC.001 (R-DB-009 enforcement)
--
-- Tables affected:
-- - pilot_flow_events: Add patient read access for own events
-- - pre_screening_calls: Add patient read access for own screening calls  
-- - tasks: Add explicit patient policy (currently mixed in staff policy)

-- =============================================================================
-- PILOT_FLOW_EVENTS: Patient Read Access
-- =============================================================================

-- Patients can view their own pilot flow events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'pilot_flow_events'
          AND policyname = 'Patients can view own flow events'
    ) THEN
        CREATE POLICY "Patients can view own flow events"
            ON public.pilot_flow_events
            FOR SELECT
            TO authenticated
            USING (
                patient_id IS NOT NULL 
                AND patient_id = public.get_my_patient_profile_id()
            );
    END IF;
END $$;

COMMENT ON POLICY "Patients can view own flow events" ON public.pilot_flow_events IS 
    'E72.R-DB-009: Patients can view pilot flow events related to their own care';

-- =============================================================================
-- PRE_SCREENING_CALLS: Patient Read Access
-- =============================================================================

-- Patients can view their own pre-screening call records
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'pre_screening_calls'
          AND policyname = 'Patients can view own screening calls'
    ) THEN
        CREATE POLICY "Patients can view own screening calls"
            ON public.pre_screening_calls
            FOR SELECT
            TO authenticated
            USING (
                patient_id = public.get_my_patient_profile_id()
            );
    END IF;
END $$;

COMMENT ON POLICY "Patients can view own screening calls" ON public.pre_screening_calls IS 
    'E72.R-DB-009: Patients can view their own pre-screening call records';

-- =============================================================================
-- TASKS: Explicit Patient Read Policy
-- =============================================================================

-- Note: tasks table already has patient access via tasks_select_staff_org policy,
-- but R-DB-009 verification requires an explicit policy with "patient" in the name.
-- This policy provides redundant but explicit patient self-access for audit compliance.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'tasks'
          AND policyname = 'Patients can view own tasks'
    ) THEN
        CREATE POLICY "Patients can view own tasks"
            ON public.tasks
            FOR SELECT
            TO authenticated
            USING (
                patient_id IS NOT NULL
                AND patient_id = public.get_my_patient_profile_id()
            );
    END IF;
END $$;

COMMENT ON POLICY "Patients can view own tasks" ON public.tasks IS 
    'E72.R-DB-009: Patients can view tasks assigned to them (explicit policy for RLS verification compliance)';
