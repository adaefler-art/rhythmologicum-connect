-- Migration: Add missing UPDATE RLS policy for assessment_answers
-- Date: 2026-01-17

BEGIN;

CREATE POLICY "Patients can update own assessment answers"
  ON public.assessment_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = assessment_answers.assessment_id
        AND assessments.patient_id = public.get_my_patient_profile_id()
    )
  );

COMMIT;
