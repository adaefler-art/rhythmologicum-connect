-- Migration: Fix V05-I02.1 Catalog Schema Issues
-- Created: 2025-12-31
-- Author: GitHub Copilot
--
-- Purpose: Correct the funnel catalog implementation to:
-- 1. Remove duplicate funnel_versions table creation (use existing from V05 core)
-- 2. Migrate from funnels to funnels_catalog
-- 3. Update pillars to canonical 7-pillar model
-- 4. Assign stress funnel to correct pillar (4 - Mental Health & Stress Management)
--
-- This migration corrects issues from 20251231142000_create_funnel_catalog.sql

-- ============================================================
-- 1. DROP DUPLICATE POLICIES AND INDEXES FROM funnel_versions
-- ============================================================
-- The funnel_versions table already exists from V05 core schema
-- We need to drop any duplicate policies/indexes we may have created

-- Drop duplicate policies if they exist
DO $$
BEGIN
    -- Check and drop duplicate SELECT policy
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'funnel_versions' 
          AND policyname = 'Authenticated users can view active funnel versions'
    ) THEN
        DROP POLICY "Authenticated users can view active funnel versions" ON public.funnel_versions;
    END IF;

    -- Check and drop duplicate ALL policy
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'funnel_versions' 
          AND policyname = 'Admins can manage funnel versions'
    ) THEN
        DROP POLICY "Admins can manage funnel versions" ON public.funnel_versions;
    END IF;
END $$;

-- ============================================================
-- 2. ADD MISSING COLUMNS TO funnels_catalog
-- ============================================================

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
END $$;

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
END $$;

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
END $$;

-- Add default_version_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'funnels_catalog' 
      AND column_name = 'default_version_id'
  ) THEN
    ALTER TABLE public.funnels_catalog ADD COLUMN default_version_id UUID REFERENCES public.funnel_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.funnels_catalog.org_id IS 'Organization scope (NULL for system-wide funnels)';
COMMENT ON COLUMN public.funnels_catalog.est_duration_min IS 'Estimated duration in minutes';
COMMENT ON COLUMN public.funnels_catalog.outcomes IS 'JSONB array of expected outcomes/tags';
COMMENT ON COLUMN public.funnels_catalog.default_version_id IS 'Default version for new assessments';

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_funnels_catalog_pillar_id ON public.funnels_catalog(pillar_id);
CREATE INDEX IF NOT EXISTS idx_funnels_catalog_org_id ON public.funnels_catalog(org_id);
CREATE INDEX IF NOT EXISTS idx_funnels_catalog_is_active ON public.funnels_catalog(is_active) WHERE is_active = true;

-- ============================================================
-- 3. UPDATE PILLARS TO CANONICAL 7-PILLAR MODEL
-- ============================================================

-- Clear any existing pillars (in case we seeded incorrect ones)
DELETE FROM public.pillars;

-- Insert canonical 7 pillars
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
-- 4. MIGRATE STRESS FUNNEL TO CORRECT PILLAR
-- ============================================================

DO $$
DECLARE
  v_mental_health_pillar_id UUID;
  v_stress_funnel_id UUID;
  v_version_id UUID;
BEGIN
  -- Get mental health pillar ID (Pillar 4)
  SELECT id INTO v_mental_health_pillar_id FROM public.pillars WHERE key = 'mental-health';
  
  -- Check if stress-assessment exists in funnels_catalog
  SELECT id INTO v_stress_funnel_id FROM public.funnels_catalog WHERE slug = 'stress-assessment';
  
  IF v_stress_funnel_id IS NULL THEN
    -- Create stress assessment funnel in funnels_catalog
    INSERT INTO public.funnels_catalog (slug, title, pillar_id, description, is_active, est_duration_min, outcomes)
    VALUES (
      'stress-assessment',
      'Stress Assessment',
      v_mental_health_pillar_id,
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
      pillar_id = v_mental_health_pillar_id,
      est_duration_min = COALESCE(est_duration_min, 10),
      outcomes = COALESCE(outcomes, '["Stresslevel ermitteln", "Risikofaktoren identifizieren", "Handlungsempfehlungen erhalten"]'::jsonb)
    WHERE id = v_stress_funnel_id;
  END IF;
  
  -- Create or update default version
  INSERT INTO public.funnel_versions (funnel_id, version, is_default, is_active)
  VALUES (v_stress_funnel_id, '1.0.0', true, true)
  ON CONFLICT (funnel_id, version) DO UPDATE SET
    is_default = true,
    is_active = true
  RETURNING id INTO v_version_id;
  
  -- Set default version reference
  UPDATE public.funnels_catalog
  SET default_version_id = v_version_id
  WHERE id = v_stress_funnel_id;
END $$;

-- ============================================================
-- 5. MIGRATE DATA FROM funnels TO funnels_catalog (if needed)
-- ============================================================

-- Note: The old 'funnels' table may have data that should be in funnels_catalog
-- This safely migrates any funnels that don't already exist in funnels_catalog

DO $$
DECLARE
  v_funnel RECORD;
  v_pillar_id UUID;
BEGIN
  -- Only run if funnels table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'funnels') THEN
    FOR v_funnel IN SELECT * FROM public.funnels LOOP
      -- Check if this funnel already exists in funnels_catalog
      IF NOT EXISTS (SELECT 1 FROM public.funnels_catalog WHERE slug = v_funnel.slug) THEN
        -- Determine pillar_id based on funnel slug/title
        -- This is a best-effort mapping
        v_pillar_id := NULL;
        IF v_funnel.slug LIKE '%stress%' THEN
          SELECT id INTO v_pillar_id FROM public.pillars WHERE key = 'mental-health';
        ELSIF v_funnel.slug LIKE '%sleep%' THEN
          SELECT id INTO v_pillar_id FROM public.pillars WHERE key = 'sleep';
        ELSIF v_funnel.slug LIKE '%nutrition%' THEN
          SELECT id INTO v_pillar_id FROM public.pillars WHERE key = 'nutrition';
        END IF;
        
        -- Insert into funnels_catalog
        INSERT INTO public.funnels_catalog (
          id,
          slug,
          title,
          pillar_id,
          description,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          v_funnel.id,
          v_funnel.slug,
          v_funnel.title,
          v_pillar_id,
          v_funnel.description,
          v_funnel.is_active,
          v_funnel.created_at,
          v_funnel.updated_at
        ) ON CONFLICT (slug) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;
