-- E76.3: Diagnosis Runs API - Schema and RLS Policies
-- Creates tables for diagnosis runs with state machine (queued → running → succeeded|failed)
-- Auth: Only assigned clinician/admin can access runs for their patients

-- ============================================================================
-- TYPES
-- ============================================================================

-- Diagnosis run status enum (state machine: queued → running → succeeded|failed)
DO $$ BEGIN
  CREATE TYPE diagnosis_run_status AS ENUM ('queued', 'running', 'succeeded', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Main diagnosis runs table
CREATE TABLE IF NOT EXISTS public.diagnosis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  clinician_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- State machine
  status diagnosis_run_status NOT NULL DEFAULT 'queued',
  
  -- Input configuration (JSON)
  input_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Output data (JSON) - populated when succeeded
  output_data JSONB,
  
  -- Error information (JSON) - populated when failed
  error_info JSONB,
  
  -- Metadata
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT diagnosis_runs_status_timestamps_check 
    CHECK (
      (status = 'queued' AND started_at IS NULL AND completed_at IS NULL) OR
      (status = 'running' AND started_at IS NOT NULL AND completed_at IS NULL) OR
      (status IN ('succeeded', 'failed') AND started_at IS NOT NULL AND completed_at IS NOT NULL)
    )
);

-- Optional composite FK if patient_profiles has organization_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_profiles'
      AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.diagnosis_runs
      ADD CONSTRAINT diagnosis_runs_patient_org_fk
      FOREIGN KEY (patient_id, organization_id)
      REFERENCES public.patient_profiles(id, organization_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Diagnosis run artifacts (many-to-many relationship between runs and artifacts)
CREATE TABLE IF NOT EXISTS public.diagnosis_run_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.diagnosis_runs(id) ON DELETE CASCADE,
  artifact_id UUID NOT NULL REFERENCES public.diagnosis_artifacts(id) ON DELETE CASCADE,
  
  -- Order/sequence within the run
  sequence_order INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one artifact per run (but artifact can be in multiple runs)
  CONSTRAINT diagnosis_run_artifacts_unique UNIQUE (run_id, artifact_id)
);

-- Diagnosis artifacts table (reusable artifacts across runs)
CREATE TABLE IF NOT EXISTS public.diagnosis_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Artifact metadata
  artifact_type VARCHAR(100) NOT NULL, -- e.g., 'ecg_analysis', 'risk_assessment', 'report_pdf'
  artifact_name VARCHAR(255) NOT NULL,
  
  -- Artifact data (JSON or reference to storage)
  artifact_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Storage reference (if artifact is stored in external storage like S3)
  storage_path TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Diagnosis runs indexes
CREATE INDEX IF NOT EXISTS idx_diagnosis_runs_patient_status 
  ON public.diagnosis_runs(patient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diagnosis_runs_clinician_status 
  ON public.diagnosis_runs(clinician_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diagnosis_runs_org_status 
  ON public.diagnosis_runs(organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diagnosis_runs_created_at 
  ON public.diagnosis_runs(created_at DESC);

-- Diagnosis run artifacts indexes
CREATE INDEX IF NOT EXISTS idx_diagnosis_run_artifacts_run_id 
  ON public.diagnosis_run_artifacts(run_id, sequence_order);

CREATE INDEX IF NOT EXISTS idx_diagnosis_run_artifacts_artifact_id 
  ON public.diagnosis_run_artifacts(artifact_id);

-- Diagnosis artifacts indexes
CREATE INDEX IF NOT EXISTS idx_diagnosis_artifacts_org_type 
  ON public.diagnosis_artifacts(organization_id, artifact_type);

CREATE INDEX IF NOT EXISTS idx_diagnosis_artifacts_created_at 
  ON public.diagnosis_artifacts(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp on diagnosis_runs
CREATE OR REPLACE FUNCTION public.diagnosis_runs_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS trigger_diagnosis_runs_updated_at ON public.diagnosis_runs;
  CREATE TRIGGER trigger_diagnosis_runs_updated_at
    BEFORE UPDATE ON public.diagnosis_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.diagnosis_runs_set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Auto-update updated_at timestamp on diagnosis_artifacts
CREATE OR REPLACE FUNCTION public.diagnosis_artifacts_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS trigger_diagnosis_artifacts_updated_at ON public.diagnosis_artifacts;
  CREATE TRIGGER trigger_diagnosis_artifacts_updated_at
    BEFORE UPDATE ON public.diagnosis_artifacts
    FOR EACH ROW
    EXECUTE FUNCTION public.diagnosis_artifacts_set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.diagnosis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_run_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_artifacts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: diagnosis_runs
-- ============================================================================

-- Clinicians can view runs for assigned patients in same organization
DO $$ BEGIN
  CREATE POLICY "Clinicians can view runs for assigned patients"
    ON public.diagnosis_runs
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.clinician_patient_assignments cpa
        JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
        WHERE cpa.clinician_user_id = auth.uid()
          AND pp.id = diagnosis_runs.patient_id
          AND cpa.organization_id = diagnosis_runs.organization_id
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Clinicians can insert runs for assigned patients
DO $$ BEGIN
  CREATE POLICY "Clinicians can create runs for assigned patients"
    ON public.diagnosis_runs
    FOR INSERT
    WITH CHECK (
      clinician_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.clinician_patient_assignments cpa
        JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
        WHERE cpa.clinician_user_id = auth.uid()
          AND pp.id = diagnosis_runs.patient_id
          AND cpa.organization_id = diagnosis_runs.organization_id
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Clinicians can update runs they created for assigned patients
DO $$ BEGIN
  CREATE POLICY "Clinicians can update own runs for assigned patients"
    ON public.diagnosis_runs
    FOR UPDATE
    USING (
      clinician_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.clinician_patient_assignments cpa
        JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
        WHERE cpa.clinician_user_id = auth.uid()
          AND pp.id = diagnosis_runs.patient_id
          AND cpa.organization_id = diagnosis_runs.organization_id
      )
    )
    WITH CHECK (
      clinician_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.clinician_patient_assignments cpa
        JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
        WHERE cpa.clinician_user_id = auth.uid()
          AND pp.id = diagnosis_runs.patient_id
          AND cpa.organization_id = diagnosis_runs.organization_id
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admins can view runs in their organization
DO $$ BEGIN
  CREATE POLICY "Admins can view org diagnosis runs"
    ON public.diagnosis_runs
    FOR SELECT
    USING (
      public.current_user_role(organization_id) = 'admin'::public.user_role
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admins can manage runs in their organization
DO $$ BEGIN
  CREATE POLICY "Admins can manage org diagnosis runs"
    ON public.diagnosis_runs
    FOR ALL
    USING (
      public.current_user_role(organization_id) = 'admin'::public.user_role
    )
    WITH CHECK (
      public.current_user_role(organization_id) = 'admin'::public.user_role
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- RLS POLICIES: diagnosis_run_artifacts
-- ============================================================================

-- Clinicians can view run artifacts if they can view the run
DO $$ BEGIN
  CREATE POLICY "Clinicians can view run artifacts for assigned patients"
    ON public.diagnosis_run_artifacts
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.diagnosis_runs dr
        JOIN public.clinician_patient_assignments cpa ON cpa.clinician_user_id = auth.uid()
        JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
        WHERE dr.id = diagnosis_run_artifacts.run_id
          AND pp.id = dr.patient_id
          AND cpa.organization_id = dr.organization_id
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Clinicians can insert run artifacts for runs they created
DO $$ BEGIN
  CREATE POLICY "Clinicians can create run artifacts for own runs"
    ON public.diagnosis_run_artifacts
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.diagnosis_runs dr
        WHERE dr.id = diagnosis_run_artifacts.run_id
          AND dr.clinician_user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admins can view run artifacts in their organization
DO $$ BEGIN
  CREATE POLICY "Admins can view org run artifacts"
    ON public.diagnosis_run_artifacts
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.diagnosis_runs dr
        WHERE dr.id = diagnosis_run_artifacts.run_id
          AND public.current_user_role(dr.organization_id) = 'admin'::public.user_role
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admins can manage run artifacts in their organization
DO $$ BEGIN
  CREATE POLICY "Admins can manage org run artifacts"
    ON public.diagnosis_run_artifacts
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.diagnosis_runs dr
        WHERE dr.id = diagnosis_run_artifacts.run_id
          AND public.current_user_role(dr.organization_id) = 'admin'::public.user_role
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.diagnosis_runs dr
        WHERE dr.id = diagnosis_run_artifacts.run_id
          AND public.current_user_role(dr.organization_id) = 'admin'::public.user_role
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- RLS POLICIES: diagnosis_artifacts
-- ============================================================================

-- Clinicians can view artifacts in their organization
DO $$ BEGIN
  CREATE POLICY "Clinicians can view org diagnosis artifacts"
    ON public.diagnosis_artifacts
    FOR SELECT
    USING (
      public.current_user_role(organization_id) IN ('clinician'::public.user_role, 'admin'::public.user_role)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admins can manage artifacts in their organization
DO $$ BEGIN
  CREATE POLICY "Admins can manage org diagnosis artifacts"
    ON public.diagnosis_artifacts
    FOR ALL
    USING (
      public.current_user_role(organization_id) = 'admin'::public.user_role
    )
    WITH CHECK (
      public.current_user_role(organization_id) = 'admin'::public.user_role
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.diagnosis_runs IS 'E76.3: Diagnosis runs with state machine (queued → running → succeeded|failed)';
COMMENT ON TABLE public.diagnosis_run_artifacts IS 'E76.3: Many-to-many relationship between diagnosis runs and artifacts';
COMMENT ON TABLE public.diagnosis_artifacts IS 'E76.3: Reusable diagnosis artifacts (ECG analysis, reports, etc.)';
COMMENT ON TYPE diagnosis_run_status IS 'E76.3: State machine for diagnosis runs: queued → running → succeeded|failed';
