-- Migration: E78.2 — Triage view prerequisites (patient name columns + processing stage)
-- Description: Ensure patient_profiles name columns and processing_stage enum value exist before triage_cases_v1 view.
-- Date: 2026-02-05

-- Add patient name columns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_profiles'
      AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.patient_profiles ADD COLUMN first_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_profiles'
      AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.patient_profiles ADD COLUMN last_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_profiles'
      AND column_name = 'preferred_name'
  ) THEN
    ALTER TABLE public.patient_profiles ADD COLUMN preferred_name TEXT;
  END IF;
END $$ LANGUAGE plpgsql;

-- Add processing_stage enum value used by triage_cases_v1 view
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'processing_stage'
      AND e.enumlabel = 'report_generated'
  ) THEN
    ALTER TYPE public.processing_stage ADD VALUE 'report_generated';
  END IF;
END $$ LANGUAGE plpgsql;
