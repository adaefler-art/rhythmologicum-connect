-- Migration: Update patient_measures schema to store stress/sleep scores per report
-- Description: Aligns patient_measures with the latest production schema
-- Date: 2024-12-09

BEGIN;

-- Remove trigger + helper that updated the deprecated updated_at column
DROP TRIGGER IF EXISTS trigger_patient_measures_updated_at ON patient_measures;
DROP FUNCTION IF EXISTS update_patient_measures_updated_at();

-- Drop obsolete indexes tied to removed columns
DROP INDEX IF EXISTS idx_patient_measures_completed_at;

-- Drop constraints that reference legacy columns
ALTER TABLE patient_measures
  DROP CONSTRAINT IF EXISTS patient_measures_assessment_id_key,
  DROP CONSTRAINT IF EXISTS patient_measures_assessment_id_fkey,
  DROP CONSTRAINT IF EXISTS patient_measures_status_check;

-- Remove legacy columns (assessment linkage handled via reports)
ALTER TABLE patient_measures
  DROP COLUMN IF EXISTS assessment_id,
  DROP COLUMN IF EXISTS measurement_type,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS completed_at,
  DROP COLUMN IF EXISTS updated_at;

-- Ensure created_at exists (older installs already have it)
ALTER TABLE patient_measures
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT NOW();

-- Add new score & linkage columns
ALTER TABLE patient_measures
  ADD COLUMN IF NOT EXISTS stress_score integer,
  ADD COLUMN IF NOT EXISTS sleep_score integer,
  ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS report_id uuid;

-- Enforce value ranges + enums
ALTER TABLE patient_measures
  DROP CONSTRAINT IF EXISTS patient_measures_stress_score_range;

ALTER TABLE patient_measures
  ADD CONSTRAINT patient_measures_stress_score_range
    CHECK (stress_score IS NULL OR (stress_score >= 0 AND stress_score <= 100));

ALTER TABLE patient_measures
  DROP CONSTRAINT IF EXISTS patient_measures_sleep_score_range;

ALTER TABLE patient_measures
  ADD CONSTRAINT patient_measures_sleep_score_range
    CHECK (sleep_score IS NULL OR (sleep_score >= 0 AND sleep_score <= 100));

-- Normalise legacy values before enforcing NOT NULL + ENUM constraint
UPDATE patient_measures
SET risk_level = 'pending'
WHERE risk_level IS NULL
  OR risk_level NOT IN ('low', 'moderate', 'high', 'pending');

ALTER TABLE patient_measures
  ALTER COLUMN risk_level SET NOT NULL;

ALTER TABLE patient_measures
  DROP CONSTRAINT IF EXISTS patient_measures_risk_level_check;

ALTER TABLE patient_measures
  ADD CONSTRAINT patient_measures_risk_level_check
    CHECK (risk_level IN ('low', 'moderate', 'high', 'pending'));

-- Recreate foreign keys for the new relationships
ALTER TABLE patient_measures
  DROP CONSTRAINT IF EXISTS fk_patient_measures_patient;

ALTER TABLE patient_measures
  ADD CONSTRAINT fk_patient_measures_patient
    FOREIGN KEY (patient_id) REFERENCES patient_profiles(id);

ALTER TABLE patient_measures
  DROP CONSTRAINT IF EXISTS fk_patient_measures_report;

ALTER TABLE patient_measures
  ADD CONSTRAINT fk_patient_measures_report
    FOREIGN KEY (report_id) REFERENCES reports(id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_patient_measures_patient_id ON patient_measures(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_measures_report_id ON patient_measures(report_id);

COMMIT;
