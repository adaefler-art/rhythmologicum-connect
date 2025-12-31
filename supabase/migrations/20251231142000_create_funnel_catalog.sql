-- Migration: Create Funnel Catalog (V05-I02.1)
-- Created: 2025-12-31
-- Author: GitHub Copilot
--
-- Purpose: Implements a pillar-based funnel catalog with multi-tenant support
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
CREATE POLICY "Authenticated users can view pillars"
  ON public.pillars
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can manage pillars (for future admin UI)
-- Note: This uses a simplified check. In V0.5 multi-org, this should check has_any_role('admin')
CREATE POLICY "Admins can manage pillars"
  ON public.pillars
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- ============================================================
-- 2. FUNNEL VERSIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.funnel_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  questionnaire_config JSONB DEFAULT '{}'::jsonb,
  content_manifest JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(funnel_id, version)
);

COMMENT ON TABLE public.funnel_versions IS 'Version tracking for funnel configurations';
COMMENT ON COLUMN public.funnel_versions.version IS 'Version identifier (e.g., 1.0.0, 2.0.0)';
COMMENT ON COLUMN public.funnel_versions.is_default IS 'Whether this is the default version for new assessments';
COMMENT ON COLUMN public.funnel_versions.questionnaire_config IS 'JSONB configuration for questionnaire steps';
COMMENT ON COLUMN public.funnel_versions.content_manifest IS 'JSONB manifest of content pages and media';

CREATE INDEX IF NOT EXISTS idx_funnel_versions_funnel_id ON public.funnel_versions(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_versions_is_default ON public.funnel_versions(funnel_id, is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.funnel_versions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view active versions
CREATE POLICY "Authenticated users can view active funnel versions"
  ON public.funnel_versions
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Admins can manage versions
CREATE POLICY "Admins can manage funnel versions"
  ON public.funnel_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- ============================================================
-- 3. EXTEND FUNNELS TABLE WITH CATALOG FIELDS
-- ============================================================

-- Add pillar_id to existing funnels table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'funnels' 
      AND column_name = 'pillar_id'
  ) THEN
    ALTER TABLE public.funnels ADD COLUMN pillar_id UUID REFERENCES public.pillars(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add org_id for multi-tenant support (nullable for system-wide funnels)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'funnels' 
      AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.funnels ADD COLUMN org_id UUID;
  END IF;
END $$;

-- Add catalog-specific fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'funnels' 
      AND column_name = 'est_duration_min'
  ) THEN
    ALTER TABLE public.funnels ADD COLUMN est_duration_min INTEGER;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'funnels' 
      AND column_name = 'outcomes'
  ) THEN
    ALTER TABLE public.funnels ADD COLUMN outcomes JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'funnels' 
      AND column_name = 'default_version_id'
  ) THEN
    ALTER TABLE public.funnels ADD COLUMN default_version_id UUID REFERENCES public.funnel_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.funnels.pillar_id IS 'Pillar category this funnel belongs to';
COMMENT ON COLUMN public.funnels.org_id IS 'Organization scope (NULL for system-wide funnels)';
COMMENT ON COLUMN public.funnels.est_duration_min IS 'Estimated duration in minutes';
COMMENT ON COLUMN public.funnels.outcomes IS 'JSONB array of expected outcomes/tags';
COMMENT ON COLUMN public.funnels.default_version_id IS 'Default version for new assessments';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_funnels_pillar_id ON public.funnels(pillar_id);
CREATE INDEX IF NOT EXISTS idx_funnels_org_id ON public.funnels(org_id);
CREATE INDEX IF NOT EXISTS idx_funnels_is_active ON public.funnels(is_active) WHERE is_active = true;

-- ============================================================
-- 4. SEED INITIAL PILLARS
-- ============================================================

INSERT INTO public.pillars (key, title, description, sort_order)
VALUES
  ('stress', 'Stress & Belastung', 'Assessments zur Erfassung von Stress und psychischer Belastung', 1),
  ('resilience', 'Resilienz', 'Assessments zur Messung von Resilienz und Bewältigungsstrategien', 2),
  ('sleep', 'Schlaf', 'Assessments zur Schlafqualität und Schlafstörungen', 3)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 5. MIGRATE EXISTING STRESS FUNNEL TO CATALOG
-- ============================================================

-- Update existing stress-assessment funnel with catalog data
DO $$
DECLARE
  v_stress_pillar_id UUID;
  v_stress_funnel_id UUID;
  v_version_id UUID;
BEGIN
  -- Get stress pillar ID
  SELECT id INTO v_stress_pillar_id FROM public.pillars WHERE key = 'stress';
  
  -- Get or create stress-assessment funnel
  SELECT id INTO v_stress_funnel_id FROM public.funnels WHERE slug = 'stress-assessment';
  
  IF v_stress_funnel_id IS NULL THEN
    -- Create stress assessment funnel if it doesn't exist
    INSERT INTO public.funnels (slug, title, subtitle, description, is_active, pillar_id, est_duration_min, outcomes)
    VALUES (
      'stress-assessment',
      'Stress Assessment',
      'Erfassen Sie Ihr aktuelles Stresslevel',
      'Ein wissenschaftlich validiertes Assessment zur Messung von Stress und psychischer Belastung',
      true,
      v_stress_pillar_id,
      10,
      '["Stresslevel ermitteln", "Risikofaktoren identifizieren", "Handlungsempfehlungen erhalten"]'::jsonb
    )
    RETURNING id INTO v_stress_funnel_id;
  ELSE
    -- Update existing funnel with catalog fields
    UPDATE public.funnels
    SET 
      pillar_id = v_stress_pillar_id,
      est_duration_min = COALESCE(est_duration_min, 10),
      outcomes = COALESCE(outcomes, '["Stresslevel ermitteln", "Risikofaktoren identifizieren", "Handlungsempfehlungen erhalten"]'::jsonb)
    WHERE id = v_stress_funnel_id;
  END IF;
  
  -- Create default version if it doesn't exist
  INSERT INTO public.funnel_versions (funnel_id, version, is_default, is_active)
  VALUES (v_stress_funnel_id, '1.0.0', true, true)
  ON CONFLICT (funnel_id, version) DO NOTHING
  RETURNING id INTO v_version_id;
  
  -- If version was created, get its ID
  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id 
    FROM public.funnel_versions 
    WHERE funnel_id = v_stress_funnel_id AND version = '1.0.0';
  END IF;
  
  -- Set default version reference
  UPDATE public.funnels
  SET default_version_id = v_version_id
  WHERE id = v_stress_funnel_id AND default_version_id IS NULL;
END $$;
