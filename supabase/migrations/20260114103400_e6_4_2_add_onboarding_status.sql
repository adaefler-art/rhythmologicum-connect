-- E6.4.2: Add onboarding_status to patient_profiles
-- Description: Adds persistent onboarding status tracking to patient profiles
-- Date: 2026-01-14

-- Create enum type for onboarding status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_status_enum') THEN
    CREATE TYPE onboarding_status_enum AS ENUM ('not_started', 'in_progress', 'completed');
  END IF;
END $$;

-- Add onboarding_status column to patient_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_profiles'
      AND column_name = 'onboarding_status'
  ) THEN
    ALTER TABLE patient_profiles
      ADD COLUMN onboarding_status onboarding_status_enum NOT NULL DEFAULT 'not_started';
  END IF;
END $$;

-- Update existing profiles that have full_name to 'completed' status
UPDATE patient_profiles
SET onboarding_status = 'completed'
WHERE full_name IS NOT NULL
  AND onboarding_status = 'not_started';

-- Add comment for documentation
COMMENT ON COLUMN patient_profiles.onboarding_status IS 'E6.4.2: Tracks patient onboarding progress (not_started, in_progress, completed)';
