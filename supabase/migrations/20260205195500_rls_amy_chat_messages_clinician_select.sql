-- E78.x: Allow clinicians to read AMY chat messages for assigned patients

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'amy_chat_messages'
          AND policyname = 'Clinicians can view assigned patient AMY chat messages'
    ) THEN
        CREATE POLICY "Clinicians can view assigned patient AMY chat messages"
            ON public.amy_chat_messages
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.clinician_patient_assignments cpa
                    WHERE cpa.clinician_user_id = auth.uid()
                      AND cpa.patient_user_id = amy_chat_messages.user_id
                )
            );
    END IF;
END $$ LANGUAGE plpgsql;
