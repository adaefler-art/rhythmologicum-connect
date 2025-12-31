-- Migration: V0.5 Audit Log Extensions for Decision Events
-- Description: Extends audit_log table with org_id, source, and metadata fields
--              for comprehensive audit trail of decision-relevant events
-- Date: 2025-12-31
-- Issue: V05-I01.4

-- =============================================================================
-- SECTION 1: EXTEND AUDIT_LOG TABLE
-- =============================================================================

-- Add org_id for multi-tenant audit trails
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_log'
          AND column_name = 'org_id'
    ) THEN
        ALTER TABLE public.audit_log
            ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;
END $$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.audit_log.org_id IS 'V0.5: Organization context for multi-tenant audit isolation';

-- Add source field to track where the action originated
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_log'
          AND column_name = 'source'
    ) THEN
        ALTER TABLE public.audit_log
            ADD COLUMN source TEXT CHECK (source IN ('api', 'job', 'admin-ui', 'system'));
    END IF;
END $$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.audit_log.source IS 'V0.5: Source of the action (api, job, admin-ui, system)';

-- Add metadata for additional context (versions, correlation IDs, etc.)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_log'
          AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.audit_log
            ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.audit_log.metadata IS 'V0.5: Additional context (request_id, algorithm_version, prompt_version, report_version, correlation_ids, etc.)';

-- =============================================================================
-- SECTION 2: INDEXES FOR EFFICIENT QUERYING
-- =============================================================================

-- Index for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id 
    ON public.audit_log(org_id) 
    WHERE org_id IS NOT NULL;

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_audit_log_source 
    ON public.audit_log(source) 
    WHERE source IS NOT NULL;

-- Composite index for common query patterns (org + entity_type + created_at)
CREATE INDEX IF NOT EXISTS idx_audit_log_org_entity_created 
    ON public.audit_log(org_id, entity_type, created_at DESC) 
    WHERE org_id IS NOT NULL;

-- Composite index for entity lookups (entity_type + entity_id)
-- Note: This already exists from previous migration, but ensure it's there
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type_id 
    ON public.audit_log(entity_type, entity_id);

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
-- NOTE: Row Level Security (RLS) policies for audit_log are managed separately.
-- Existing RLS policies from migration 20251231072346 remain unchanged.
-- =============================================================================

COMMENT ON TABLE public.audit_log IS 'V0.5: Comprehensive audit trail for all decision-relevant system changes. Extended with org_id, source, and metadata for V05-I01.4.';
