-- E76.6: Add Patient RLS Policies for Diagnosis Data
-- Migration to allow patients to read their own diagnosis runs and artifacts

-- =============================================================================
-- 1. ADD PATIENT READ ACCESS TO DIAGNOSIS_RUNS
-- =============================================================================

-- Patients can read their own diagnosis runs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diagnosis_runs'
      AND policyname = 'diagnosis_runs_patient_read'
  ) THEN
    CREATE POLICY "diagnosis_runs_patient_read" ON public.diagnosis_runs
      FOR SELECT
      USING (patient_id = auth.uid());
  END IF;
END $$;

COMMENT ON POLICY "diagnosis_runs_patient_read" ON public.diagnosis_runs IS 
  'E76.6: Patients can read their own diagnosis runs';

-- =============================================================================
-- 2. ADD PATIENT READ ACCESS TO DIAGNOSIS_ARTIFACTS
-- =============================================================================

-- Patients can read their own diagnosis artifacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diagnosis_artifacts'
      AND policyname = 'diagnosis_artifacts_patient_read'
  ) THEN
    CREATE POLICY "diagnosis_artifacts_patient_read" ON public.diagnosis_artifacts
      FOR SELECT
      USING (patient_id = auth.uid());
  END IF;
END $$;

COMMENT ON POLICY "diagnosis_artifacts_patient_read" ON public.diagnosis_artifacts IS 
  'E76.6: Patients can read their own diagnosis artifacts';
