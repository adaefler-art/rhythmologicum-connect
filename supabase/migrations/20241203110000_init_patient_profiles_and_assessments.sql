-- Migration: Bootstrap patient core tables
-- Description: Creates patient_profiles, assessments, and assessment_answers tables which other migrations depend on
-- Date: 2024-12-03

CREATE TABLE IF NOT EXISTS patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name TEXT,
  birth_year INTEGER,
  sex TEXT
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unique_user_profile'
      AND table_schema = 'public'
      AND table_name = 'patient_profiles'
  ) THEN
    ALTER TABLE patient_profiles
      ADD CONSTRAINT unique_user_profile UNIQUE (user_id);
  END IF;
END $$ LANGUAGE plpgsql;

-- Add FK only if auth.users exists to avoid failing migrations when the auth schema is absent (e.g., CI/test DB)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_namespace n
    JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'patient_profiles_user_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'patient_profiles'
    ) THEN
      ALTER TABLE patient_profiles
        ADD CONSTRAINT patient_profiles_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  funnel TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'assessments_patient_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'assessments'
  ) THEN
    ALTER TABLE assessments
      ADD CONSTRAINT assessments_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE;
  END IF;
END $$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL,
  question_id TEXT NOT NULL,
  answer_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'assessment_answers_assessment_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'assessment_answers'
  ) THEN
    ALTER TABLE assessment_answers
      ADD CONSTRAINT assessment_answers_assessment_id_fkey
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;
  END IF;
END $$ LANGUAGE plpgsql;
