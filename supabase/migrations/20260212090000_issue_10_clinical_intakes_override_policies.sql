-- Issue 10: Allow clinician/admin safety override updates on clinical_intakes

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clinical_intakes'
      AND policyname = 'Clinicians can update patient intake safety'
  ) THEN
    CREATE POLICY "Clinicians can update patient intake safety"
      ON public.clinical_intakes
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.clinician_patient_assignments cpa
          WHERE cpa.clinician_user_id = auth.uid()
            AND cpa.patient_user_id = clinical_intakes.user_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.clinician_patient_assignments cpa
          WHERE cpa.clinician_user_id = auth.uid()
            AND cpa.patient_user_id = clinical_intakes.user_id
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clinical_intakes'
      AND policyname = 'Admins can update org intakes'
  ) THEN
    CREATE POLICY "Admins can update org intakes"
      ON public.clinical_intakes
      FOR UPDATE
      USING (
        organization_id IS NOT NULL
        AND public.current_user_role(organization_id) = 'admin'::public.user_role
      )
      WITH CHECK (
        organization_id IS NOT NULL
        AND public.current_user_role(organization_id) = 'admin'::public.user_role
      );
  END IF;
END $$;
