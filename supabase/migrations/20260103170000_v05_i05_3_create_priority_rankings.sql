/**
 * V05-I05.3: Create priority_rankings table
 * 
 * Stores deterministic priority rankings (Impact x Feasibility) for interventions.
 * Each ranking is tied to a processing job and risk bundle.
 */

-- Create priority_rankings table
CREATE TABLE IF NOT EXISTS public.priority_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  job_id UUID NOT NULL REFERENCES public.processing_jobs(id) ON DELETE CASCADE,
  risk_bundle_id UUID NOT NULL REFERENCES public.risk_bundles(id) ON DELETE CASCADE,
  
  -- Version tracking (all required for determinism)
  ranking_version TEXT NOT NULL DEFAULT 'v1',
  algorithm_version TEXT NOT NULL,
  registry_version TEXT NOT NULL, -- Registry hash or version
  
  -- Optional program tier constraint
  program_tier TEXT,
  
  -- Timestamps
  ranked_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ranking data (JSONB for complete priority ranking)
  ranking_data JSONB NOT NULL,
  
  -- Constraints: Support versioned reruns with different algorithm/registry versions
  CONSTRAINT priority_rankings_job_version_unique UNIQUE (job_id, ranking_version, registry_version)
);

-- Add comments
COMMENT ON TABLE public.priority_rankings IS 'V05-I05.3: Deterministic priority rankings (Impact x Feasibility) tied to processing jobs';
COMMENT ON COLUMN public.priority_rankings.ranking_data IS 'Complete PriorityRankingV1 JSON structure';
COMMENT ON COLUMN public.priority_rankings.algorithm_version IS 'Ranking algorithm version (e.g., 1.0.0)';
COMMENT ON COLUMN public.priority_rankings.ranking_version IS 'Priority ranking schema version (e.g., v1)';
COMMENT ON COLUMN public.priority_rankings.registry_version IS 'Intervention registry version or deterministic hash';
COMMENT ON COLUMN public.priority_rankings.program_tier IS 'Optional program tier constraint for filtering interventions';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_priority_rankings_job_id ON public.priority_rankings(job_id);
CREATE INDEX IF NOT EXISTS idx_priority_rankings_risk_bundle_id ON public.priority_rankings(risk_bundle_id);
CREATE INDEX IF NOT EXISTS idx_priority_rankings_ranked_at ON public.priority_rankings(ranked_at DESC);
CREATE INDEX IF NOT EXISTS idx_priority_rankings_program_tier ON public.priority_rankings(program_tier) WHERE program_tier IS NOT NULL;

-- RLS Policies
ALTER TABLE public.priority_rankings ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can read their own priority rankings (via risk bundle → assessment ownership)
CREATE POLICY priority_rankings_patient_read ON public.priority_rankings
  FOR SELECT
  TO authenticated
  USING (
    risk_bundle_id IN (
      SELECT rb.id FROM public.risk_bundles rb
      INNER JOIN public.assessments a ON rb.assessment_id = a.id
      WHERE a.patient_id = auth.uid()
    )
  );

-- Policy: Clinicians can read all priority rankings
CREATE POLICY priority_rankings_clinician_read ON public.priority_rankings
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
-- Note: Application code uses service role to write priority rankings
-- No INSERT/UPDATE/DELETE policies for regular users

-- Grant permissions
GRANT SELECT ON public.priority_rankings TO authenticated;
GRANT ALL ON public.priority_rankings TO service_role;
