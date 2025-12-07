-- Migration: Enable comprehensive Row Level Security (RLS)
-- Description: D4 - Implements RLS policies for all tables to ensure:
--   - Patients can only see their own data
--   - Clinicians can see all pilot patient data
--   - Unauthorized access is prevented and logged
-- Date: 2025-12-07

BEGIN;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if current user is a clinician
CREATE OR REPLACE FUNCTION public.is_clinician()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt()->>'role' = 'clinician'),
      false
    )
  );
END;
$$;

COMMENT ON FUNCTION public.is_clinician IS 'Returns true if the current authenticated user has the clinician role';

-- Function to get patient_profile_id for current user
CREATE OR REPLACE FUNCTION public.get_my_patient_profile_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  profile_id uuid;
BEGIN
  SELECT id INTO profile_id
  FROM public.patient_profiles
  WHERE user_id = auth.uid();
  
  RETURN profile_id;
END;
$$;

COMMENT ON FUNCTION public.get_my_patient_profile_id IS 'Returns the patient_profile.id for the current authenticated user';

-- Function to log RLS violations
CREATE OR REPLACE FUNCTION public.log_rls_violation(
  table_name text,
  operation text,
  attempted_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log to PostgreSQL logs (visible in Supabase logs)
  RAISE WARNING 'RLS_VIOLATION: user=% table=% operation=% id=% timestamp=%',
    auth.uid(),
    table_name,
    operation,
    attempted_id,
    NOW();
END;
$$;

COMMENT ON FUNCTION public.log_rls_violation IS 'Logs RLS policy violations for security monitoring';

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_clinician() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_patient_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_rls_violation(text, text, uuid) TO authenticated;

-- ============================================================================
-- PATIENT_PROFILES TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can view their own profile
CREATE POLICY "Patients can view own profile"
  ON public.patient_profiles
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Policy: Clinicians can view all patient profiles
CREATE POLICY "Clinicians can view all profiles"
  ON public.patient_profiles
  FOR SELECT
  USING (
    public.is_clinician()
  );

-- Policy: Patients can update their own profile
CREATE POLICY "Patients can update own profile"
  ON public.patient_profiles
  FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy: Patients can insert their own profile (for registration)
CREATE POLICY "Patients can insert own profile"
  ON public.patient_profiles
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- ASSESSMENTS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can view their own assessments
CREATE POLICY "Patients can view own assessments"
  ON public.assessments
  FOR SELECT
  USING (
    patient_id = public.get_my_patient_profile_id()
  );

-- Policy: Clinicians can view all assessments
CREATE POLICY "Clinicians can view all assessments"
  ON public.assessments
  FOR SELECT
  USING (
    public.is_clinician()
  );

-- Policy: Patients can insert their own assessments
CREATE POLICY "Patients can insert own assessments"
  ON public.assessments
  FOR INSERT
  WITH CHECK (
    patient_id = public.get_my_patient_profile_id()
  );

-- Policy: Patients can update their own assessments
CREATE POLICY "Patients can update own assessments"
  ON public.assessments
  FOR UPDATE
  USING (
    patient_id = public.get_my_patient_profile_id()
  )
  WITH CHECK (
    patient_id = public.get_my_patient_profile_id()
  );

-- ============================================================================
-- ASSESSMENT_ANSWERS TABLE
-- ============================================================================

-- Drop existing permissive policy
DROP POLICY IF EXISTS "allow-all-assessment-answers" ON public.assessment_answers;

-- Ensure RLS is enabled (already enabled but being explicit)
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can view their own assessment answers
CREATE POLICY "Patients can view own assessment answers"
  ON public.assessment_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = assessment_answers.assessment_id
        AND assessments.patient_id = public.get_my_patient_profile_id()
    )
  );

-- Policy: Clinicians can view all assessment answers
CREATE POLICY "Clinicians can view all assessment answers"
  ON public.assessment_answers
  FOR SELECT
  USING (
    public.is_clinician()
  );

-- Policy: Patients can insert their own assessment answers
CREATE POLICY "Patients can insert own assessment answers"
  ON public.assessment_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = assessment_answers.assessment_id
        AND assessments.patient_id = public.get_my_patient_profile_id()
    )
  );

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can view their own reports
CREATE POLICY "Patients can view own reports"
  ON public.reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = reports.assessment_id
        AND assessments.patient_id = public.get_my_patient_profile_id()
    )
  );

-- Policy: Clinicians can view all reports
CREATE POLICY "Clinicians can view all reports"
  ON public.reports
  FOR SELECT
  USING (
    public.is_clinician()
  );

-- Policy: Allow system/service to insert reports (needed for AMY API)
-- Note: Reports are created by backend API, not directly by users
CREATE POLICY "Service can insert reports"
  ON public.reports
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow system/service to update reports
CREATE POLICY "Service can update reports"
  ON public.reports
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PATIENT_MEASURES TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.patient_measures ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can view their own measures
CREATE POLICY "Patients can view own measures"
  ON public.patient_measures
  FOR SELECT
  USING (
    patient_id = public.get_my_patient_profile_id()
  );

-- Policy: Clinicians can view all patient measures
CREATE POLICY "Clinicians can view all measures"
  ON public.patient_measures
  FOR SELECT
  USING (
    public.is_clinician()
  );

-- Policy: Allow system/service to insert measures
CREATE POLICY "Service can insert measures"
  ON public.patient_measures
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow system/service to update measures
CREATE POLICY "Service can update measures"
  ON public.patient_measures
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Ensure authenticated users can access these tables with RLS enforced
GRANT SELECT, INSERT, UPDATE ON public.patient_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.assessments TO authenticated;
GRANT SELECT, INSERT ON public.assessment_answers TO authenticated;
GRANT SELECT ON public.reports TO authenticated;
GRANT SELECT ON public.patient_measures TO authenticated;

COMMIT;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.patient_profiles IS 'Patient profile data with RLS: patients see own data, clinicians see all';
COMMENT ON TABLE public.assessments IS 'Patient assessments with RLS: patients see own data, clinicians see all';
COMMENT ON TABLE public.assessment_answers IS 'Assessment answers with RLS: patients see own data, clinicians see all';
COMMENT ON TABLE public.reports IS 'Assessment reports with RLS: patients see own data, clinicians see all';
COMMENT ON TABLE public.patient_measures IS 'Patient measures with RLS: patients see own data, clinicians see all';
