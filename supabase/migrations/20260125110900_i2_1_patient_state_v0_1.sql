-- Migration: I2.1 - Canonical Patient State v0.1
-- Description: Create patient_state table for persistent state management
-- across Dialog/Insights/Dashboard with versioning support
-- Author: Copilot (Issue I2.1)
-- Date: 2026-01-25

-- ============================================================================
-- Table: patient_state
-- ============================================================================
-- Purpose: Store versioned patient state for UI consistency across sessions
-- Versioning: patient_state_version field tracks schema evolution
-- RLS: Patient owns their state; clinicians can view all
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.patient_state (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    
    -- Versioning
    patient_state_version text NOT NULL DEFAULT '0.1',
    
    -- Assessment State
    assessment jsonb NOT NULL DEFAULT jsonb_build_object(
        'lastAssessmentId', null,
        'status', 'not_started',
        'progress', 0,
        'completedAt', null
    ),
    
    -- Results State
    results jsonb NOT NULL DEFAULT jsonb_build_object(
        'summaryCards', '[]'::jsonb,
        'recommendedActions', '[]'::jsonb,
        'lastGeneratedAt', null
    ),
    
    -- Dialog State
    dialog jsonb NOT NULL DEFAULT jsonb_build_object(
        'lastContext', 'dashboard',
        'messageCount', 0,
        'lastMessageAt', null
    ),
    
    -- Activity State
    activity jsonb NOT NULL DEFAULT jsonb_build_object(
        'recentActivity', '[]'::jsonb
    ),
    
    -- Metrics State
    metrics jsonb NOT NULL DEFAULT jsonb_build_object(
        'healthScore', jsonb_build_object(
            'current', null,
            'delta', null
        ),
        'keyMetrics', jsonb_build_object(
            'HR', '[]'::jsonb,
            'BP', '[]'::jsonb,
            'Sleep', '[]'::jsonb,
            'Weight', '[]'::jsonb
        )
    ),
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT patient_state_patient_id_unique UNIQUE (patient_id)
);

-- Index for fast patient lookups
CREATE INDEX IF NOT EXISTS idx_patient_state_patient_id 
    ON public.patient_state(patient_id);

-- Index for version queries (helpful for migrations)
CREATE INDEX IF NOT EXISTS idx_patient_state_version 
    ON public.patient_state(patient_state_version);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE public.patient_state ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can SELECT their own state
CREATE POLICY "patient_state_select_own" 
    ON public.patient_state
    FOR SELECT
    TO authenticated
    USING (
        patient_id IN (
            SELECT id FROM public.patient_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Patients can INSERT their own state (first-time initialization)
CREATE POLICY "patient_state_insert_own" 
    ON public.patient_state
    FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id IN (
            SELECT id FROM public.patient_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Patients can UPDATE their own state
CREATE POLICY "patient_state_update_own" 
    ON public.patient_state
    FOR UPDATE
    TO authenticated
    USING (
        patient_id IN (
            SELECT id FROM public.patient_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Clinicians can SELECT all patient states
CREATE POLICY "patient_state_select_clinician" 
    ON public.patient_state
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.metadata->>'role' IN ('clinician', 'admin')
        )
    );

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_patient_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patient_state_updated_at
    BEFORE UPDATE ON public.patient_state
    FOR EACH ROW
    EXECUTE FUNCTION public.update_patient_state_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.patient_state IS 
    'I2.1: Canonical patient state v0.1 - persistent state for Dialog/Insights/Dashboard';

COMMENT ON COLUMN public.patient_state.patient_state_version IS 
    'Schema version for state evolution tracking (current: 0.1)';

COMMENT ON COLUMN public.patient_state.assessment IS 
    'Assessment progress: lastAssessmentId, status, progress (0-1), completedAt';

COMMENT ON COLUMN public.patient_state.results IS 
    'Results summary: summaryCards (3-5), recommendedActions (ids), lastGeneratedAt';

COMMENT ON COLUMN public.patient_state.dialog IS 
    'Dialog context: lastContext (dashboard/results), messageCount, lastMessageAt';

COMMENT ON COLUMN public.patient_state.activity IS 
    'Recent activity: array of {type, label, timestamp}';

COMMENT ON COLUMN public.patient_state.metrics IS 
    'Health metrics: healthScore (current+delta), keyMetrics (HR/BP/Sleep/Weight series)';
