-- Migration: E79.1 — Add intake entry type
-- Description: Adds 'intake' to anamnesis_entries.entry_type check constraint
-- Date: 2026-02-09
-- Issue: E79.1

-- =============================================================================
-- SECTION 1: ALTER entry_type CHECK CONSTRAINT
-- =============================================================================

ALTER TABLE public.anamnesis_entries
  DROP CONSTRAINT IF EXISTS anamnesis_entries_entry_type_check;

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
    'intake',
    'other'
  ));

COMMENT ON CONSTRAINT anamnesis_entries_entry_type_check ON public.anamnesis_entries
  IS 'E79.1: Valid entry types including intake for patient intake entries';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
