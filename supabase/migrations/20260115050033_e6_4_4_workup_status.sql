-- E6.4.4: Add workup_status to assessments table
-- This enables tracking whether an assessment needs more data or is ready for review

-- Create workup_status enum type
CREATE TYPE public.workup_status AS ENUM (
  'needs_more_data',
  'ready_for_review'
);

ALTER TYPE public.workup_status OWNER TO postgres;

COMMENT ON TYPE public.workup_status IS 'E6.4.4: Workup status for assessments - indicates if more data is needed or if ready for clinician review';

-- Add workup_status column to assessments table
ALTER TABLE public.assessments
ADD COLUMN workup_status public.workup_status DEFAULT NULL;

COMMENT ON COLUMN public.assessments.workup_status IS 'E6.4.4: Workup status - NULL for in-progress, needs_more_data or ready_for_review for completed assessments';

-- Add index for filtering by workup_status
CREATE INDEX idx_assessments_workup_status ON public.assessments(workup_status)
WHERE workup_status IS NOT NULL;

COMMENT ON INDEX public.idx_assessments_workup_status IS 'E6.4.4: Index for filtering assessments by workup status';

-- Add missing_data_fields column to track what data is missing
ALTER TABLE public.assessments
ADD COLUMN missing_data_fields jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.assessments.missing_data_fields IS 'E6.4.4: Array of missing data field identifiers (e.g., ["sleep_quality", "stress_triggers"])';
