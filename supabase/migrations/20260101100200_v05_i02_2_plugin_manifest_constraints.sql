-- Migration: V05-I02.2 - Plugin Manifest Constraints
-- Description: Make algorithm_bundle_version and prompt_version NOT NULL with defaults
-- Date: 2026-01-01
-- Issue: V05-I02.2

-- =============================================================================
-- SECTION 1: Update funnel_versions constraints
-- =============================================================================

-- Set default values for existing NULL records
UPDATE public.funnel_versions 
SET algorithm_bundle_version = 'v1.0.0' 
WHERE algorithm_bundle_version IS NULL;

UPDATE public.funnel_versions 
SET prompt_version = '1.0' 
WHERE prompt_version IS NULL;

-- Make algorithm_bundle_version NOT NULL with default
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'funnel_versions'
          AND column_name = 'algorithm_bundle_version'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.funnel_versions
            ALTER COLUMN algorithm_bundle_version SET DEFAULT 'v1.0.0',
            ALTER COLUMN algorithm_bundle_version SET NOT NULL;
    END IF;
END $$ LANGUAGE plpgsql;

-- Make prompt_version NOT NULL with default
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'funnel_versions'
          AND column_name = 'prompt_version'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.funnel_versions
            ALTER COLUMN prompt_version SET DEFAULT '1.0',
            ALTER COLUMN prompt_version SET NOT NULL;
    END IF;
END $$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.funnel_versions.algorithm_bundle_version IS 'V05-I02.2: Required version pointer to algorithm bundle';
COMMENT ON COLUMN public.funnel_versions.prompt_version IS 'V05-I02.2: Required version for content/report generation prompts';

-- =============================================================================
-- SECTION 2: Add check constraint for version string format (optional)
-- =============================================================================

-- Add constraint to ensure version strings are non-empty
ALTER TABLE public.funnel_versions 
    DROP CONSTRAINT IF EXISTS check_algorithm_bundle_version_not_empty;

ALTER TABLE public.funnel_versions 
    ADD CONSTRAINT check_algorithm_bundle_version_not_empty 
    CHECK (LENGTH(TRIM(algorithm_bundle_version)) > 0);

ALTER TABLE public.funnel_versions 
    DROP CONSTRAINT IF EXISTS check_prompt_version_not_empty;

ALTER TABLE public.funnel_versions 
    ADD CONSTRAINT check_prompt_version_not_empty 
    CHECK (LENGTH(TRIM(prompt_version)) > 0);

-- =============================================================================
-- VERIFICATION QUERY (commented out)
-- =============================================================================

-- Uncomment to verify all constraints are in place:
/*
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'funnel_versions'
  AND column_name IN ('questionnaire_config', 'content_manifest', 'algorithm_bundle_version', 'prompt_version')
ORDER BY ordinal_position;
*/
