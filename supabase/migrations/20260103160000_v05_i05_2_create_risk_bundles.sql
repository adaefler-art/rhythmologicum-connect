/**
 * V05-I05.2: Create risk_bundles table
 * 
 * Stores deterministic risk calculation bundles for assessments.
 * Each bundle is tied to a processing job and is versioned.
 */

-- Create risk_bundles table
CREATE TABLE IF NOT EXISTS public.risk_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  job_id UUID NOT NULL REFERENCES public.processing_jobs(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  
  -- Version tracking
  risk_bundle_version TEXT NOT NULL DEFAULT 'v1',
  algorithm_version TEXT NOT NULL,
  funnel_version TEXT,
  
  -- Timestamps
  calculated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Bundle data (JSONB for complete risk bundle)
  bundle_data JSONB NOT NULL,
  
  -- Constraints
  CONSTRAINT risk_bundles_job_id_unique UNIQUE (job_id)
);

-- Add comments
COMMENT ON TABLE public.risk_bundles IS 'V05-I05.2: Deterministic risk calculation bundles tied to processing jobs';
COMMENT ON COLUMN public.risk_bundles.bundle_data IS 'Complete RiskBundleV1 JSON structure';
COMMENT ON COLUMN public.risk_bundles.algorithm_version IS 'Algorithm version from funnel manifest';
COMMENT ON COLUMN public.risk_bundles.risk_bundle_version IS 'Risk bundle schema version (e.g., v1)';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_risk_bundles_job_id ON public.risk_bundles(job_id);
CREATE INDEX IF NOT EXISTS idx_risk_bundles_assessment_id ON public.risk_bundles(assessment_id);
CREATE INDEX IF NOT EXISTS idx_risk_bundles_calculated_at ON public.risk_bundles(calculated_at DESC);

-- RLS Policies
ALTER TABLE public.risk_bundles ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can read their own risk bundles (via assessment ownership)
CREATE POLICY risk_bundles_patient_read ON public.risk_bundles
  FOR SELECT
  TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM public.assessments WHERE patient_id = auth.uid()
    )
  );

-- Policy: Clinicians can read all risk bundles
CREATE POLICY risk_bundles_clinician_read ON public.risk_bundles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' IN ('clinician', 'admin')
    )
  );

-- Policy: System can write (service role only, for processing jobs)
-- Note: Application code uses service role to write risk bundles
-- No INSERT/UPDATE/DELETE policies for regular users

-- Grant permissions
GRANT SELECT ON public.risk_bundles TO authenticated;
GRANT ALL ON public.risk_bundles TO service_role;
