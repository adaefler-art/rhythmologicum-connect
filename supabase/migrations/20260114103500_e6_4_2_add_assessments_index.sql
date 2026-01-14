-- E6.4.2: Add index for in-progress assessments query optimization
-- Description: Optimizes query performance for checking in-progress assessments
-- Date: 2026-01-14

-- Add index for in-progress assessments query
-- This index optimizes the query in /api/assessments/in-progress
-- which filters by patient_id and completed_at IS NULL, then orders by started_at
CREATE INDEX IF NOT EXISTS idx_assessments_patient_in_progress
  ON assessments(patient_id, completed_at, started_at DESC)
  WHERE completed_at IS NULL;

COMMENT ON INDEX idx_assessments_patient_in_progress IS 'E6.4.2: Optimizes query for finding in-progress assessments by patient';
