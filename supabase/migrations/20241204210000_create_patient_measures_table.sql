-- Migration: Create patient_measures table for tracking completed assessments
-- Description: This table tracks each completed measurement/assessment to ensure idempotent saves
-- Date: 2024-12-04

-- Create patient_measures table
CREATE TABLE IF NOT EXISTS patient_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL UNIQUE REFERENCES assessments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  measurement_type TEXT NOT NULL DEFAULT 'stress',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'failed')),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on patient_id for faster queries by patient
CREATE INDEX IF NOT EXISTS idx_patient_measures_patient_id ON patient_measures(patient_id);

-- Create index on completed_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_patient_measures_completed_at ON patient_measures(completed_at DESC);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patient_measures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_patient_measures_updated_at
  BEFORE UPDATE ON patient_measures
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_measures_updated_at();

-- Add comments to table
COMMENT ON TABLE patient_measures IS 'Tracks completed patient measurements/assessments with idempotent logic';
COMMENT ON COLUMN patient_measures.id IS 'Primary key - unique measurement identifier';
COMMENT ON COLUMN patient_measures.assessment_id IS 'Foreign key to assessments table (UNIQUE to prevent duplicates)';
COMMENT ON COLUMN patient_measures.patient_id IS 'Patient identifier for this measurement';
COMMENT ON COLUMN patient_measures.measurement_type IS 'Type of measurement (stress, sleep, etc.)';
COMMENT ON COLUMN patient_measures.status IS 'Status: completed, in_progress, or failed';
COMMENT ON COLUMN patient_measures.completed_at IS 'Timestamp when the measurement was completed';
COMMENT ON COLUMN patient_measures.created_at IS 'Timestamp when the measurement was first created';
COMMENT ON COLUMN patient_measures.updated_at IS 'Timestamp when the measurement was last updated';
