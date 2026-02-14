ALTER TABLE public.patient_profiles
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS consent_data_processing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_contact_for_followup boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS communication_preference text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patient_profiles_communication_preference_check'
  ) THEN
    ALTER TABLE public.patient_profiles
      ADD CONSTRAINT patient_profiles_communication_preference_check
      CHECK (
        communication_preference IS NULL
        OR communication_preference IN ('email', 'sms')
      );
  END IF;
END $$;
