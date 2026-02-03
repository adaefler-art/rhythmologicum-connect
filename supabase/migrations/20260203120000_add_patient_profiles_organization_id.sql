-- Migration: E76.3 Pre-req — Add organization_id to patient_profiles
-- Description: Adds optional organization_id to patient_profiles to support diagnosis_runs FK.
-- Date: 2026-02-03

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_profiles'
      AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.patient_profiles
      ADD COLUMN organization_id uuid;
  END IF;
END $$;

-- Optional FK to organizations (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'patient_profiles'
        AND constraint_name = 'patient_profiles_organization_id_fkey'
    ) THEN
      ALTER TABLE public.patient_profiles
        ADD CONSTRAINT patient_profiles_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patient_profiles_organization_id
  ON public.patient_profiles(organization_id);
