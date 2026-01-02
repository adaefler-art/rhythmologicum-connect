-- Migration: Create Diagnostics Function for Pillars SOT Audit
-- Created: 2026-01-02
-- Purpose: Provides a secure, production-ready way to query system metadata
--
-- This function is SECURITY DEFINER to allow reading pg_* system catalogs
-- without exposing direct access to those tables.

CREATE OR REPLACE FUNCTION public.diagnostics_pillars_sot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  result jsonb;
  pillars_info jsonb;
  catalog_info jsonb;
  versions_info jsonb;
BEGIN
  -- Check pillars table
  SELECT jsonb_build_object(
    'exists', EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'pillars'),
    'relkind', COALESCE((SELECT c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'pillars'), ''),
    'relrowsecurity', COALESCE((SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'pillars'), false),
    'policyCount', COALESCE((SELECT COUNT(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pillars'), 0),
    'rowCount', COALESCE((SELECT COUNT(*)::int FROM public.pillars), 0)
  ) INTO pillars_info;

  -- Check funnels_catalog table
  SELECT jsonb_build_object(
    'exists', EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnels_catalog'),
    'relkind', COALESCE((SELECT c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnels_catalog'), ''),
    'relrowsecurity', COALESCE((SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnels_catalog'), false),
    'policyCount', COALESCE((SELECT COUNT(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'funnels_catalog'), 0),
    'rowCount', COALESCE((SELECT COUNT(*)::int FROM public.funnels_catalog), 0),
    'stressFunnelExists', EXISTS(SELECT 1 FROM public.funnels_catalog WHERE slug = 'stress-assessment')
  ) INTO catalog_info;

  -- Check funnel_versions table
  SELECT jsonb_build_object(
    'exists', EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnel_versions'),
    'relkind', COALESCE((SELECT c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnel_versions'), ''),
    'relrowsecurity', COALESCE((SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnel_versions'), false),
    'policyCount', COALESCE((SELECT COUNT(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'funnel_versions'), 0),
    'rowCount', COALESCE((SELECT COUNT(*)::int FROM public.funnel_versions), 0)
  ) INTO versions_info;

  -- Combine results
  result := jsonb_build_object(
    'pillars', pillars_info,
    'funnels_catalog', catalog_info,
    'funnel_versions', versions_info
  );

  RETURN result;
END;
$$;

-- Grant execute to authenticated users (API will enforce admin/clinician check)
GRANT EXECUTE ON FUNCTION public.diagnostics_pillars_sot() TO authenticated;

COMMENT ON FUNCTION public.diagnostics_pillars_sot() IS 'Diagnostic function for pillars/catalog source-of-truth audit. Returns table metadata and row counts. Used by /api/admin/diagnostics/pillars-sot endpoint.';
