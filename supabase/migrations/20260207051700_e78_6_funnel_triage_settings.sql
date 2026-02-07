-- Migration: E78.6 — Triage SLA Configuration (v1.1)
-- Date: 2026-02-07
-- Purpose: Add funnel_triage_settings table for per-funnel SLA configuration

-- ===================================================================
-- Table: funnel_triage_settings
-- ===================================================================
-- Stores funnel-specific triage SLA configuration.
-- Allows clinicians to customize overdue thresholds per funnel.
--
-- Precedence:
-- 1. funnel_triage_settings.overdue_days (if exists)
-- 2. TRIAGE_SLA_DAYS_DEFAULT environment variable
-- 3. Hardcoded default (7 days)

CREATE TABLE IF NOT EXISTS public.funnel_triage_settings (
  -- Primary Key
  funnel_id UUID PRIMARY KEY REFERENCES public.funnels_catalog(id) ON DELETE CASCADE,
  
  -- SLA Configuration
  overdue_days INTEGER NOT NULL CHECK (overdue_days > 0),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ===================================================================
-- Comments
-- ===================================================================

COMMENT ON TABLE public.funnel_triage_settings IS 
  'E78.6: Per-funnel triage SLA configuration. Defines custom overdue_days threshold for specific funnels. Falls back to TRIAGE_SLA_DAYS_DEFAULT env var or 7 days default.';

COMMENT ON COLUMN public.funnel_triage_settings.funnel_id IS 
  'Foreign key to funnels_catalog. One setting per funnel.';

COMMENT ON COLUMN public.funnel_triage_settings.overdue_days IS 
  'Number of days before a triage case for this funnel is marked as overdue. Must be positive.';

COMMENT ON COLUMN public.funnel_triage_settings.created_by IS 
  'User who created this configuration (typically a clinician or admin).';

COMMENT ON COLUMN public.funnel_triage_settings.updated_by IS 
  'User who last updated this configuration.';

-- ===================================================================
-- Indexes
-- ===================================================================

-- Primary key index already created by PRIMARY KEY constraint
-- No additional indexes needed for this small lookup table

-- ===================================================================
-- Row Level Security (RLS)
-- ===================================================================

ALTER TABLE public.funnel_triage_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow clinicians and admins to read all settings
CREATE POLICY "funnel_triage_settings_read_staff"
  ON public.funnel_triage_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users u
      WHERE u.id = auth.uid()
        AND (
          u.raw_app_meta_data->>'role' = 'clinician'
          OR u.raw_app_meta_data->>'role' = 'admin'
        )
    )
  );

-- Policy: Allow admins to insert/update/delete settings
CREATE POLICY "funnel_triage_settings_write_admin"
  ON public.funnel_triage_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users u
      WHERE u.id = auth.uid()
        AND u.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- ===================================================================
-- Helper Function: Get SLA Days for Funnel
-- ===================================================================

CREATE OR REPLACE FUNCTION public.get_triage_sla_days(p_funnel_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_overdue_days INTEGER;
  v_default_days INTEGER := 7; -- Hardcoded fallback
BEGIN
  -- Try to get funnel-specific setting
  SELECT overdue_days
  INTO v_overdue_days
  FROM public.funnel_triage_settings
  WHERE funnel_id = p_funnel_id;
  
  -- If found, return it
  IF FOUND THEN
    RETURN v_overdue_days;
  END IF;
  
  -- Fall back to default
  -- Note: Environment variable fallback is handled in application layer
  -- This function returns the hardcoded default if no DB setting exists
  RETURN v_default_days;
END;
$$;

COMMENT ON FUNCTION public.get_triage_sla_days(UUID) IS 
  'E78.6: Get SLA days for a funnel. Returns funnel-specific value from funnel_triage_settings if exists, otherwise returns default (7 days). Application layer should handle TRIAGE_SLA_DAYS_DEFAULT env var.';

-- ===================================================================
-- Grants
-- ===================================================================

-- Grant access to authenticated users (RLS will further restrict)
GRANT SELECT ON public.funnel_triage_settings TO authenticated;
GRANT ALL ON public.funnel_triage_settings TO service_role;

-- Grant execute on helper function
GRANT EXECUTE ON FUNCTION public.get_triage_sla_days(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_triage_sla_days(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_triage_sla_days(UUID) TO service_role;
