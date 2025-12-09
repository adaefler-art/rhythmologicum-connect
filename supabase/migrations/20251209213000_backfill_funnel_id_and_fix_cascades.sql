-- Migration: Backfill funnel_id for legacy assessments and fix foreign key cascades
-- Date: 2024-12-09
-- Purpose: Fix data consistency issues with assessments.funnel_id and improve referential integrity

-- Part 1: Backfill funnel_id for legacy assessments that only have the text 'funnel' field
-- This prevents "Funnel-ID fehlt im Assessment" errors

-- First, ensure stress funnel exists in funnels table
DO $$
DECLARE
  v_stress_funnel_id uuid;
BEGIN
  -- Get or create the stress funnel
  SELECT id INTO v_stress_funnel_id
  FROM public.funnels
  WHERE slug = 'stress'
  LIMIT 1;

  -- If no stress funnel found, log a warning (but don't fail - funnel might be created elsewhere)
  IF v_stress_funnel_id IS NULL THEN
    RAISE NOTICE 'Warning: No funnel with slug "stress" found. Legacy assessments will not be backfilled.';
  ELSE
    -- Backfill assessments that have funnel='stress' but no funnel_id
    UPDATE public.assessments
    SET funnel_id = v_stress_funnel_id
    WHERE funnel = 'stress'
      AND funnel_id IS NULL;

    RAISE NOTICE 'Backfilled funnel_id for % legacy assessments', 
      (SELECT COUNT(*) FROM public.assessments WHERE funnel = 'stress' AND funnel_id = v_stress_funnel_id);
  END IF;
END $$;

-- Part 2: Clean up orphaned patient_measures records
-- Delete patient_measures that reference non-existent reports
DELETE FROM public.patient_measures
WHERE report_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.reports WHERE reports.id = patient_measures.report_id
  );

-- Part 3: Fix foreign key cascades for patient_measures -> reports
-- This prevents FK violation errors when deleting reports

-- Drop existing FK constraint if it exists
ALTER TABLE public.patient_measures
  DROP CONSTRAINT IF EXISTS fk_patient_measures_report;

-- Re-add with ON DELETE CASCADE
ALTER TABLE public.patient_measures
  ADD CONSTRAINT fk_patient_measures_report
  FOREIGN KEY (report_id)
  REFERENCES public.reports(id)
  ON DELETE CASCADE;

-- Part 4: Ensure assessments without valid funnel_id are marked for cleanup
-- For safety, we don't auto-delete assessments, but we can log them
DO $$
DECLARE
  v_orphaned_count integer;
BEGIN
  SELECT COUNT(*) INTO v_orphaned_count
  FROM public.assessments
  WHERE funnel_id IS NULL;

  IF v_orphaned_count > 0 THEN
    RAISE NOTICE 'Warning: % assessments still have NULL funnel_id after backfill. These may need manual review.', v_orphaned_count;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.assessments.funnel_id IS 'Foreign key to funnels table. Should always be set; legacy assessments use funnel (text) field for slug.';
COMMENT ON CONSTRAINT fk_patient_measures_report ON public.patient_measures IS 'Cascade deletes when parent report is deleted to maintain referential integrity';
