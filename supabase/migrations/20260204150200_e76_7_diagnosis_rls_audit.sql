-- E76.7: Enhanced RLS Policies + Audit Logging for Diagnosis Tables
-- Migration to implement assignment-based access control and comprehensive audit logging
-- Scope: diagnosis_runs, diagnosis_artifacts
-- Date: 2026-02-04
-- Issue: E76.7

-- =============================================================================
-- SECTION 1: UPDATE RLS POLICIES FOR ASSIGNMENT-BASED ACCESS
-- =============================================================================

-- Drop existing broad clinician read policy (too permissive)
-- Replace with assignment-based access control

DROP POLICY IF EXISTS "diagnosis_runs_clinician_read" ON public.diagnosis_runs;
DROP POLICY IF EXISTS "diagnosis_artifacts_clinician_read" ON public.diagnosis_artifacts;

-- Clinicians can ONLY read diagnosis runs for assigned patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diagnosis_runs'
      AND policyname = 'diagnosis_runs_clinician_assigned_read'
  ) THEN
    CREATE POLICY "diagnosis_runs_clinician_assigned_read" ON public.diagnosis_runs
      FOR SELECT
      USING (
        -- Allow if user is clinician/admin AND assigned to the patient
        EXISTS (
          SELECT 1 FROM auth.users u
          WHERE u.id = auth.uid()
            AND (
              (u.raw_app_meta_data->>'role' = 'clinician')
              OR (u.raw_app_meta_data->>'role' = 'admin')
            )
            AND (
              -- Admin can see all runs
              (u.raw_app_meta_data->>'role' = 'admin')
              OR
              -- Clinician must be assigned to the patient
              EXISTS (
                SELECT 1 FROM public.clinician_patient_assignments cpa
                WHERE cpa.clinician_user_id = auth.uid()
                  AND cpa.patient_user_id = diagnosis_runs.patient_id
              )
            )
        )
      );
  END IF;
END $$;

COMMENT ON POLICY "diagnosis_runs_clinician_assigned_read" ON public.diagnosis_runs IS 
  'E76.7: Clinicians can only read diagnosis runs for assigned patients. Admins can read all.';

-- Clinicians can ONLY read diagnosis artifacts for assigned patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diagnosis_artifacts'
      AND policyname = 'diagnosis_artifacts_clinician_assigned_read'
  ) THEN
    CREATE POLICY "diagnosis_artifacts_clinician_assigned_read" ON public.diagnosis_artifacts
      FOR SELECT
      USING (
        -- Allow if user is clinician/admin AND assigned to the patient
        EXISTS (
          SELECT 1 FROM auth.users u
          WHERE u.id = auth.uid()
            AND (
              (u.raw_app_meta_data->>'role' = 'clinician')
              OR (u.raw_app_meta_data->>'role' = 'admin')
            )
            AND (
              -- Admin can see all artifacts
              (u.raw_app_meta_data->>'role' = 'admin')
              OR
              -- Clinician must be assigned to the patient
              EXISTS (
                SELECT 1 FROM public.clinician_patient_assignments cpa
                WHERE cpa.clinician_user_id = auth.uid()
                  AND cpa.patient_user_id = diagnosis_artifacts.patient_id
              )
            )
        )
      );
  END IF;
END $$;

COMMENT ON POLICY "diagnosis_artifacts_clinician_assigned_read" ON public.diagnosis_artifacts IS 
  'E76.7: Clinicians can only read diagnosis artifacts for assigned patients. Admins can read all.';

-- =============================================================================
-- SECTION 2: AUDIT LOG TRIGGER FOR DIAGNOSIS_RUNS
-- =============================================================================

-- Create trigger function to log diagnosis run lifecycle events
CREATE OR REPLACE FUNCTION public.diagnosis_runs_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_diff JSONB := '{}'::jsonb;
  v_metadata JSONB := '{}'::jsonb;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_metadata := jsonb_build_object(
      'status', NEW.status,
      'inputs_hash', NEW.inputs_hash,
      'patient_id', NEW.patient_id,
      'clinician_id', NEW.clinician_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status transitions
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action := 'status_changed';
      v_diff := jsonb_build_object(
        'before', jsonb_build_object('status', OLD.status),
        'after', jsonb_build_object('status', NEW.status)
      );
      v_metadata := jsonb_build_object(
        'status_from', OLD.status,
        'status_to', NEW.status,
        'processing_time_ms', NEW.processing_time_ms,
        'error_code', NEW.error_code
      );
    ELSIF OLD.error_code IS NULL AND NEW.error_code IS NOT NULL THEN
      v_action := 'failed';
      v_metadata := jsonb_build_object(
        'error_code', NEW.error_code,
        'retry_count', NEW.retry_count
      );
    ELSE
      -- Generic update (started_at, completed_at changes)
      v_action := 'updated';
      v_metadata := jsonb_build_object(
        'status', NEW.status,
        'processing_time_ms', NEW.processing_time_ms
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_metadata := jsonb_build_object(
      'status', OLD.status,
      'patient_id', OLD.patient_id
    );
  END IF;

  -- Insert audit log entry
  INSERT INTO public.audit_log (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    source,
    diff,
    metadata,
    org_id
  ) VALUES (
    COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.clinician_id ELSE NEW.clinician_id END,
      auth.uid()
    ),
    'diagnosis_run',
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    v_action,
    'system',  -- System-driven updates by worker
    v_diff,
    v_metadata,
    NULL  -- No org_id on diagnosis_runs (could be added in future)
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.diagnosis_runs_audit_log() IS 
  'E76.7: Audit trigger for diagnosis_runs lifecycle events (created, status_changed, failed, deleted)';

-- Attach trigger to diagnosis_runs
DROP TRIGGER IF EXISTS trigger_diagnosis_runs_audit ON public.diagnosis_runs;
CREATE TRIGGER trigger_diagnosis_runs_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.diagnosis_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.diagnosis_runs_audit_log();

COMMENT ON TRIGGER trigger_diagnosis_runs_audit ON public.diagnosis_runs IS 
  'E76.7: Auto-logs all diagnosis run lifecycle events to audit_log';

-- =============================================================================
-- SECTION 3: AUDIT LOG TRIGGER FOR DIAGNOSIS_ARTIFACTS
-- =============================================================================

-- Create trigger function to log diagnosis artifact events
CREATE OR REPLACE FUNCTION public.diagnosis_artifacts_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_metadata JSONB := '{}'::jsonb;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_metadata := jsonb_build_object(
      'artifact_type', NEW.artifact_type,
      'schema_version', NEW.schema_version,
      'risk_level', NEW.risk_level,
      'confidence_score', NEW.confidence_score,
      'run_id', NEW.run_id,
      'patient_id', NEW.patient_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_metadata := jsonb_build_object(
      'artifact_type', NEW.artifact_type,
      'risk_level', NEW.risk_level
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_metadata := jsonb_build_object(
      'artifact_type', OLD.artifact_type,
      'patient_id', OLD.patient_id
    );
  END IF;

  -- Insert audit log entry
  INSERT INTO public.audit_log (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    source,
    metadata,
    org_id
  ) VALUES (
    COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.created_by ELSE NEW.created_by END,
      auth.uid()
    ),
    'diagnosis_artifact',
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    v_action,
    'system',  -- System-driven creation by worker
    v_metadata,
    NULL  -- No org_id on diagnosis_artifacts
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.diagnosis_artifacts_audit_log() IS 
  'E76.7: Audit trigger for diagnosis_artifacts lifecycle events (created, updated, deleted)';

-- Attach trigger to diagnosis_artifacts
DROP TRIGGER IF EXISTS trigger_diagnosis_artifacts_audit ON public.diagnosis_artifacts;
CREATE TRIGGER trigger_diagnosis_artifacts_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.diagnosis_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.diagnosis_artifacts_audit_log();

COMMENT ON TRIGGER trigger_diagnosis_artifacts_audit ON public.diagnosis_artifacts IS 
  'E76.7: Auto-logs all diagnosis artifact lifecycle events to audit_log';

-- =============================================================================
-- SECTION 4: ADD AUDIT ACTIONS TO REGISTRY (IF NOT EXISTS)
-- =============================================================================

-- Note: If audit actions need to be added to the registry, that would be done
-- in lib/contracts/registry.ts. The audit_log table accepts TEXT for action field.
-- Common actions: created, updated, deleted, status_changed, failed, viewed, downloaded

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
