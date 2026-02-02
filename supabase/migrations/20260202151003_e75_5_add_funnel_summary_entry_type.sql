-- Migration: E75.5 — Add funnel_summary entry type
-- Description: Adds 'funnel_summary' to anamnesis_entries.entry_type enum
--              for system-generated assessment summaries
-- Date: 2026-02-02
-- Issue: E75.5

-- =============================================================================
-- SECTION 1: ALTER entry_type CHECK CONSTRAINT
-- =============================================================================

-- Drop existing constraint
ALTER TABLE public.anamnesis_entries 
  DROP CONSTRAINT IF EXISTS anamnesis_entries_entry_type_check;

-- Add new constraint with 'funnel_summary' option
ALTER TABLE public.anamnesis_entries
  ADD CONSTRAINT anamnesis_entries_entry_type_check 
  CHECK (entry_type IN (
    'medical_history', 
    'symptoms', 
    'medications', 
    'allergies', 
    'family_history', 
    'lifestyle', 
    'funnel_summary',
    'other'
  ));

COMMENT ON CONSTRAINT anamnesis_entries_entry_type_check ON public.anamnesis_entries 
  IS 'E75.5: Valid entry types including funnel_summary for system-generated assessment summaries';

-- =============================================================================
-- SECTION 2: ADD INDEX FOR FUNNEL SUMMARY LOOKUPS
-- =============================================================================

-- Index for finding existing summaries by patient + assessment
-- Supports idempotency check: one summary per (patient, assessment)
CREATE INDEX IF NOT EXISTS idx_anamnesis_entries_funnel_summary_lookup
  ON public.anamnesis_entries(patient_id, (content->>'assessment_id'))
  WHERE entry_type = 'funnel_summary' AND is_archived = false;

COMMENT ON INDEX public.idx_anamnesis_entries_funnel_summary_lookup 
  IS 'E75.5: Optimize funnel summary lookups for idempotency checks';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
