-- Migration: Add status field to assessments table for B5 Funnel Runtime
-- Date: 2024-12-09
-- Purpose: Track assessment lifecycle (in_progress, completed)

-- Add status enum type
DO $$ BEGIN
  CREATE TYPE assessment_status AS ENUM ('in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column to assessments table with default value
-- All existing assessments will initially be set to 'in_progress'
ALTER TABLE public.assessments 
  ADD COLUMN IF NOT EXISTS status assessment_status NOT NULL DEFAULT 'in_progress';

-- Update existing assessments with completed_at to completed
-- This must happen after the column is added
UPDATE public.assessments 
SET status = 'completed' 
WHERE completed_at IS NOT NULL;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_assessments_status 
  ON public.assessments(status);

-- Create composite index for patient queries
CREATE INDEX IF NOT EXISTS idx_assessments_patient_status 
  ON public.assessments(patient_id, status);

-- Add comment for documentation
COMMENT ON COLUMN public.assessments.status IS 'Lifecycle status of the assessment: in_progress or completed';
