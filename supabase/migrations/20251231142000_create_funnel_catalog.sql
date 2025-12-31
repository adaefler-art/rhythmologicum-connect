-- Migration: Create Funnel Catalog (V05-I02.1)
-- Created: 2025-12-31
-- Author: GitHub Copilot
--
-- Purpose: Implements a pillar-based funnel catalog with multi-tenant support.
--
-- IMPORTANT:
-- The V0.5 core schema already creates `public.funnels_catalog` and `public.funnel_versions`.
-- This migration must integrate with those tables (add missing columns + seed data)
-- instead of attempting to recreate them.
-- 
-- Tables:
-- 1. pillars - Taxonomy for organizing funnels by category
-- 2. funnels_catalog - Catalog of available funnels (extends existing funnels table concept)
-- 3. funnel_versions - Version tracking for funnels
--
-- This migration extends the existing funnels infrastructure to support:
-- - Taxonomic organization via pillars
-- - Multi-tenant org scoping
-- - Version management
-- - Catalog browsing

-- ============================================================
-- 1. PILLARS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pillars IS 'Taxonomic pillars for organizing funnels into categories';
COMMENT ON COLUMN public.pillars.key IS 'Unique key for programmatic reference (e.g., stress, sleep, resilience)';
COMMENT ON COLUMN public.pillars.sort_order IS 'Display order for pillars (lower numbers first)';

-- Enable RLS
ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;

-- Pillars are read-only for all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view pillars" ON public.pillars;
CREATE POLICY "Authenticated users can view pillars"
  ON public.pillars
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 2. EXTEND FUNNELS_CATALOG (V0.5 CORE) WITH APP-SPECIFIC FIELDS
-- ============================================================

-- NOTE: `public.funnels_catalog` is created in 20251230211228_v05_core_schema_jsonb_fields.sql

-- Add org_id for multi-tenant support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'funnels_catalog'
      AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.funnels_catalog ADD COLUMN org_id UUID;
  END IF;
END $$ LANGUAGE plpgsql;

-- Add est_duration_min
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'funnels_catalog'
      AND column_name = 'est_duration_min'
  ) THEN
    ALTER TABLE public.funnels_catalog ADD COLUMN est_duration_min INTEGER;
  END IF;
END $$ LANGUAGE plpgsql;

-- Add outcomes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'funnels_catalog'
      AND column_name = 'outcomes'
  ) THEN
    ALTER TABLE public.funnels_catalog ADD COLUMN outcomes JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$ LANGUAGE plpgsql;

-- Add default_version_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'funnels_catalog'
      AND column_name = 'default_version_id'
  ) THEN
    ALTER TABLE public.funnels_catalog
      ADD COLUMN default_version_id UUID REFERENCES public.funnel_versions(id) ON DELETE SET NULL;
  END IF;
END $$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.funnels_catalog.org_id IS 'Organization scope (NULL for system-wide funnels)';
COMMENT ON COLUMN public.funnels_catalog.est_duration_min IS 'Estimated duration in minutes';
COMMENT ON COLUMN public.funnels_catalog.outcomes IS 'JSONB array of expected outcomes/tags';
COMMENT ON COLUMN public.funnels_catalog.default_version_id IS 'Default version for new assessments';

CREATE INDEX IF NOT EXISTS idx_funnels_catalog_org_id ON public.funnels_catalog(org_id);
CREATE INDEX IF NOT EXISTS idx_funnels_catalog_is_active ON public.funnels_catalog(is_active) WHERE is_active = true;

-- ============================================================
-- 3. SEED CANONICAL 7 PILLARS
-- ============================================================

INSERT INTO public.pillars (key, title, description, sort_order)
VALUES
  ('nutrition', 'Ernährung', 'Assessments zur Ernährung und gesunden Essgewohnheiten', 1),
  ('movement', 'Bewegung', 'Assessments zu körperlicher Aktivität und Fitness', 2),
  ('sleep', 'Schlaf', 'Assessments zur Schlafqualität und Schlafhygiene', 3),
  ('mental-health', 'Mentale Gesundheit & Stressmanagement', 'Assessments zu Stress, Resilienz und mentaler Balance', 4),
  ('social', 'Soziale Verbindungen', 'Assessments zu sozialen Beziehungen und Gemeinschaft', 5),
  ('meaning', 'Sinn & Lebensqualität', 'Assessments zu Lebenszweck und persönlicher Erfüllung', 6),
  ('prevention', 'Prävention & Gesundheitsvorsorge', 'Assessments zur Vorsorge und Krankheitsprävention', 7)
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 4. ENSURE STRESS FUNNEL EXISTS IN FUNNELS_CATALOG
-- ============================================================

-- Update existing stress-assessment funnel with catalog data
DO $$
DECLARE
  v_stress_funnel_id UUID;
  v_version_id UUID;
BEGIN
  -- Get or create stress-assessment funnel in funnels_catalog
  SELECT id INTO v_stress_funnel_id FROM public.funnels_catalog WHERE slug = 'stress-assessment';
  
  IF v_stress_funnel_id IS NULL THEN
    -- Create stress assessment funnel if it doesn't exist
    INSERT INTO public.funnels_catalog (slug, title, pillar_id, description, is_active, est_duration_min, outcomes)
    VALUES (
      'stress-assessment',
      'Stress Assessment',
      'mental-health',
      'Ein wissenschaftlich validiertes Assessment zur Messung von Stress und psychischer Belastung',
      true,
      10,
      '["Stresslevel ermitteln", "Risikofaktoren identifizieren", "Handlungsempfehlungen erhalten"]'::jsonb
    )
    RETURNING id INTO v_stress_funnel_id;
  ELSE
    -- Update existing funnel with catalog fields
    UPDATE public.funnels_catalog
    SET 
      pillar_id = COALESCE(pillar_id, 'mental-health'),
      est_duration_min = COALESCE(est_duration_min, 10),
      outcomes = COALESCE(outcomes, '["Stresslevel ermitteln", "Risikofaktoren identifizieren", "Handlungsempfehlungen erhalten"]'::jsonb)
    WHERE id = v_stress_funnel_id;
  END IF;
  
  -- Create or update default version (V0.5 core schema has no is_active column)
  INSERT INTO public.funnel_versions (funnel_id, version, is_default, rollout_percent)
  VALUES (v_stress_funnel_id, '1.0.0', true, 100)
  ON CONFLICT (funnel_id, version) DO UPDATE SET
    is_default = true,
    rollout_percent = 100
  RETURNING id INTO v_version_id;
  
  -- If version was created, get its ID
  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id 
    FROM public.funnel_versions 
    WHERE funnel_id = v_stress_funnel_id AND version = '1.0.0';
  END IF;
  
  -- Set default version reference
  UPDATE public.funnels_catalog
  SET default_version_id = v_version_id
  WHERE id = v_stress_funnel_id AND (default_version_id IS NULL OR default_version_id <> v_version_id);
END $$;
