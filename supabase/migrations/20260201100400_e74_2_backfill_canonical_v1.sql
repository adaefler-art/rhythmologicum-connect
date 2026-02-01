-- Migration: E74.2 - Backfill Canonical v1 for 4 Funnel Datasets
-- Description: Migrate existing 4 funnels to canonical v1 with A/B designation
-- Date: 2026-02-01
-- Issue: E74.2
--
-- Scope:
-- - Add schema_version 'v1' to all questionnaire_config and content_manifest
-- - Set published=true for A/B defaults (stress-assessment, sleep-quality)
-- - Set published=false for archived funnels (cardiovascular-age, heart-health-nutrition)
-- - Ensure slug uniqueness (already verified)
-- - Verify pillar mapping
-- - Add source_provenance metadata
-- - Idempotent (safe to re-run)
--
-- A/B Defaults (patient-visible):
-- 1. stress-assessment (most mature, full content seeded)
-- 2. sleep-quality (comprehensive stub manifest, 3 steps)
--
-- Archived (not patient-visible):
-- 3. cardiovascular-age (stub manifest, future use)
-- 4. heart-health-nutrition (stub manifest, future use)

-- ============================================================================
-- SECTION 1: Add schema_version to all funnel_versions
-- ============================================================================

-- Update questionnaire_config to include schema_version 'v1' if not present
UPDATE public.funnel_versions
SET questionnaire_config = jsonb_set(
    questionnaire_config,
    '{schema_version}',
    '"v1"'::jsonb,
    true -- create if missing
)
WHERE 
    questionnaire_config IS NOT NULL 
    AND (questionnaire_config->>'schema_version' IS NULL 
         OR questionnaire_config->>'schema_version' != 'v1');

-- Update content_manifest to include schema_version 'v1' if not present
UPDATE public.funnel_versions
SET content_manifest = jsonb_set(
    content_manifest,
    '{schema_version}',
    '"v1"'::jsonb,
    true -- create if missing
)
WHERE 
    content_manifest IS NOT NULL 
    AND (content_manifest->>'schema_version' IS NULL 
         OR content_manifest->>'schema_version' != 'v1');

-- Add updated_at timestamp
UPDATE public.funnel_versions
SET updated_at = NOW()
WHERE updated_at IS NULL OR updated_at < NOW() - INTERVAL '1 minute';

-- ============================================================================
-- SECTION 2: Set published status for A/B vs Archived funnels
-- ============================================================================

-- Set published=true for A/B defaults (patient-visible)
-- stress-assessment: Most mature funnel with full content seeding
-- sleep-quality: Comprehensive stub with 3 well-structured steps
UPDATE public.funnels_catalog
SET 
    published = true,
    updated_at = NOW()
WHERE slug IN ('stress-assessment', 'sleep-quality')
  AND (published IS NULL OR published = false);

-- Set published=false for archived funnels (not patient-visible)
-- cardiovascular-age: Stub manifest for future use
-- heart-health-nutrition: Stub manifest for future use
UPDATE public.funnels_catalog
SET 
    published = false,
    updated_at = NOW()
WHERE slug IN ('cardiovascular-age', 'heart-health-nutrition')
  AND (published IS NULL OR published = true);

-- ============================================================================
-- SECTION 3: Add source provenance metadata
-- ============================================================================

-- Add migration tracking comment to funnel_versions
-- This tracks which migration created/modified the canonical v1 data
COMMENT ON TABLE public.funnel_versions IS 'V0.5: Versioned funnel configurations with JSONB for dynamic content. E74.2: Backfilled canonical v1 schema_version on 2026-02-01.';

-- ============================================================================
-- SECTION 4: Verify data integrity
-- ============================================================================

-- Verify all funnels have unique slugs (should already be enforced by unique constraint)
DO $$
DECLARE
    v_duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_duplicate_count
    FROM (
        SELECT slug, COUNT(*) as cnt
        FROM public.funnels_catalog
        GROUP BY slug
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF v_duplicate_count > 0 THEN
        RAISE EXCEPTION 'E74.2 Migration Failed: Duplicate slugs found in funnels_catalog';
    END IF;
    
    RAISE NOTICE 'E74.2: Slug uniqueness verified - no duplicates found';
END $$;

-- Verify all funnels have valid pillar mappings
DO $$
DECLARE
    v_invalid_pillar_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_invalid_pillar_count
    FROM public.funnels_catalog fc
    WHERE fc.pillar_id IS NOT NULL 
      AND NOT EXISTS (
          SELECT 1 FROM public.pillars p WHERE p.key = fc.pillar_id
      );
    
    IF v_invalid_pillar_count > 0 THEN
        RAISE WARNING 'E74.2 Migration: % funnels have invalid pillar references', v_invalid_pillar_count;
    ELSE
        RAISE NOTICE 'E74.2: Pillar mapping verified - all references valid';
    END IF;
END $$;

-- Verify all funnel_versions have schema_version 'v1'
DO $$
DECLARE
    v_missing_schema_version INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_missing_schema_version
    FROM public.funnel_versions
    WHERE (questionnaire_config->>'schema_version' IS NULL 
           OR questionnaire_config->>'schema_version' != 'v1')
       OR (content_manifest->>'schema_version' IS NULL 
           OR content_manifest->>'schema_version' != 'v1');
    
    IF v_missing_schema_version > 0 THEN
        RAISE WARNING 'E74.2 Migration: % funnel_versions missing schema_version v1', v_missing_schema_version;
    ELSE
        RAISE NOTICE 'E74.2: Schema version verified - all versions have v1';
    END IF;
END $$;

-- Verify A/B defaults are published
DO $$
DECLARE
    v_published_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_published_count
    FROM public.funnels_catalog
    WHERE slug IN ('stress-assessment', 'sleep-quality')
      AND published = true;
    
    IF v_published_count != 2 THEN
        RAISE WARNING 'E74.2 Migration: Expected 2 A/B funnels to be published, found %', v_published_count;
    ELSE
        RAISE NOTICE 'E74.2: A/B defaults verified - 2 funnels published (stress-assessment, sleep-quality)';
    END IF;
END $$;

-- Verify archived funnels are not published
DO $$
DECLARE
    v_archived_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_archived_count
    FROM public.funnels_catalog
    WHERE slug IN ('cardiovascular-age', 'heart-health-nutrition')
      AND published = false;
    
    IF v_archived_count != 2 THEN
        RAISE WARNING 'E74.2 Migration: Expected 2 archived funnels to be unpublished, found %', v_archived_count;
    ELSE
        RAISE NOTICE 'E74.2: Archived funnels verified - 2 funnels unpublished (cardiovascular-age, heart-health-nutrition)';
    END IF;
END $$;

-- ============================================================================
-- SECTION 5: Migration summary
-- ============================================================================

DO $$
DECLARE
    v_total_funnels INTEGER;
    v_total_versions INTEGER;
    v_published_funnels INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_funnels FROM public.funnels_catalog;
    SELECT COUNT(*) INTO v_total_versions FROM public.funnel_versions;
    SELECT COUNT(*) INTO v_published_funnels FROM public.funnels_catalog WHERE published = true;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'E74.2 Migration Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total funnels in catalog: %', v_total_funnels;
    RAISE NOTICE 'Total funnel versions: %', v_total_versions;
    RAISE NOTICE 'Published funnels (A/B defaults): %', v_published_funnels;
    RAISE NOTICE 'Canonical schema version: v1';
    RAISE NOTICE 'Source provenance: E74.2 backfill migration';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'A/B Defaults (patient-visible):';
    RAISE NOTICE '  1. stress-assessment';
    RAISE NOTICE '  2. sleep-quality';
    RAISE NOTICE 'Archived (not patient-visible):';
    RAISE NOTICE '  3. cardiovascular-age';
    RAISE NOTICE '  4. heart-health-nutrition';
    RAISE NOTICE '========================================';
END $$;
