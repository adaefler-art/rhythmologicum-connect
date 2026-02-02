-- Migration: E75.1 — Anamnese Tables v1 + RLS/Access Model
-- Description: Creates anamnesis_entries and anamnesis_entry_versions tables
--              with comprehensive RLS policies for patient/clinician/admin access
-- Date: 2026-02-02
-- Issue: E75.1

-- =============================================================================
-- SECTION 1: CREATE anamnesis_entries TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.anamnesis_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    entry_type TEXT CHECK (entry_type IN ('medical_history', 'symptoms', 'medications', 'allergies', 'family_history', 'lifestyle', 'other')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE public.anamnesis_entries IS 'E75.1: Medical anamnesis (history) entries with versioning support. RLS enforced for patient/clinician/admin access.';
COMMENT ON COLUMN public.anamnesis_entries.patient_id IS 'Patient this entry belongs to (references patient_profiles)';
COMMENT ON COLUMN public.anamnesis_entries.organization_id IS 'Organization context for multi-tenant isolation';
COMMENT ON COLUMN public.anamnesis_entries.title IS 'Brief title/summary of the anamnesis entry';
COMMENT ON COLUMN public.anamnesis_entries.content IS 'JSONB: Structured entry content (fields, values, metadata)';
COMMENT ON COLUMN public.anamnesis_entries.entry_type IS 'Category of anamnesis entry';
COMMENT ON COLUMN public.anamnesis_entries.tags IS 'Searchable tags for categorization';
COMMENT ON COLUMN public.anamnesis_entries.updated_at IS 'Timestamp of latest version (auto-updated by trigger)';

-- =============================================================================
-- SECTION 2: CREATE anamnesis_entry_versions TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.anamnesis_entry_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES public.anamnesis_entries(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    entry_type TEXT,
    tags TEXT[],
    changed_by UUID,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    change_reason TEXT,
    diff JSONB,
    UNIQUE(entry_id, version_number)
);

COMMENT ON TABLE public.anamnesis_entry_versions IS 'E75.1: Immutable version history for anamnesis_entries. No updates allowed after insert.';
COMMENT ON COLUMN public.anamnesis_entry_versions.version_number IS 'Sequential version number (1, 2, 3, ...)';
COMMENT ON COLUMN public.anamnesis_entry_versions.changed_by IS 'User who made this change';
COMMENT ON COLUMN public.anamnesis_entry_versions.change_reason IS 'Optional reason for the change';
COMMENT ON COLUMN public.anamnesis_entry_versions.diff IS 'JSONB: Differences from previous version';

-- =============================================================================
-- SECTION 3: FOREIGN KEY CONSTRAINTS WITH GUARDS
-- =============================================================================

-- Foreign key to patient_profiles
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'patient_profiles'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_schema = 'public'
              AND table_name = 'anamnesis_entries'
              AND constraint_name = 'anamnesis_entries_patient_id_fkey'
        ) THEN
            ALTER TABLE public.anamnesis_entries
                ADD CONSTRAINT anamnesis_entries_patient_id_fkey
                FOREIGN KEY (patient_id) REFERENCES public.patient_profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$ LANGUAGE plpgsql;

-- Foreign keys to auth.users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_namespace n
        JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_schema = 'public'
              AND table_name = 'anamnesis_entries'
              AND constraint_name = 'anamnesis_entries_created_by_fkey'
        ) THEN
            ALTER TABLE public.anamnesis_entries
                ADD CONSTRAINT anamnesis_entries_created_by_fkey
                FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_schema = 'public'
              AND table_name = 'anamnesis_entries'
              AND constraint_name = 'anamnesis_entries_updated_by_fkey'
        ) THEN
            ALTER TABLE public.anamnesis_entries
                ADD CONSTRAINT anamnesis_entries_updated_by_fkey
                FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_schema = 'public'
              AND table_name = 'anamnesis_entry_versions'
              AND constraint_name = 'anamnesis_entry_versions_changed_by_fkey'
        ) THEN
            ALTER TABLE public.anamnesis_entry_versions
                ADD CONSTRAINT anamnesis_entry_versions_changed_by_fkey
                FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 4: INDEXES
-- =============================================================================

-- Index for patient lookups with latest entries first
CREATE INDEX IF NOT EXISTS idx_anamnesis_entries_patient_updated 
    ON public.anamnesis_entries(patient_id, updated_at DESC);

-- Index for organization-scoped queries
CREATE INDEX IF NOT EXISTS idx_anamnesis_entries_org_id 
    ON public.anamnesis_entries(organization_id);

-- Index for version lookups with latest version first
CREATE INDEX IF NOT EXISTS idx_anamnesis_entry_versions_entry_version 
    ON public.anamnesis_entry_versions(entry_id, version_number DESC);

-- Index for finding specific version
CREATE INDEX IF NOT EXISTS idx_anamnesis_entry_versions_changed_at 
    ON public.anamnesis_entry_versions(changed_at DESC);

-- Index for entry type filtering
CREATE INDEX IF NOT EXISTS idx_anamnesis_entries_entry_type 
    ON public.anamnesis_entries(entry_type) 
    WHERE entry_type IS NOT NULL;

-- GIN index for tag searches
CREATE INDEX IF NOT EXISTS idx_anamnesis_entries_tags 
    ON public.anamnesis_entries USING GIN(tags);

COMMENT ON INDEX public.idx_anamnesis_entries_patient_updated IS 'E75.1: Optimize patient entry queries (latest first)';
COMMENT ON INDEX public.idx_anamnesis_entry_versions_entry_version IS 'E75.1: Optimize version history queries (latest first)';

-- =============================================================================
-- SECTION 5: VERSIONING TRIGGER
-- =============================================================================

-- Trigger function: Create version on insert/update
CREATE OR REPLACE FUNCTION public.anamnesis_entry_create_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_version_number INTEGER;
    v_previous_content JSONB;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM public.anamnesis_entry_versions
    WHERE entry_id = NEW.id;

    -- Get previous content for diff calculation
    IF TG_OP = 'UPDATE' THEN
        SELECT content INTO v_previous_content
        FROM public.anamnesis_entry_versions
        WHERE entry_id = NEW.id
        ORDER BY version_number DESC
        LIMIT 1;
        
        -- If no previous version, use OLD content
        IF v_previous_content IS NULL THEN
            v_previous_content := OLD.content;
        END IF;
    ELSE
        v_previous_content := NULL;
    END IF;

    -- Insert version record
    INSERT INTO public.anamnesis_entry_versions (
        entry_id,
        version_number,
        title,
        content,
        entry_type,
        tags,
        changed_by,
        changed_at,
        diff
    ) VALUES (
        NEW.id,
        v_version_number,
        NEW.title,
        NEW.content,
        NEW.entry_type,
        NEW.tags,
        COALESCE(NEW.updated_by, NEW.created_by, auth.uid()),
        NOW(),
        CASE 
            WHEN v_previous_content IS NOT NULL THEN
                jsonb_build_object(
                    'from', v_previous_content,
                    'to', NEW.content
                )
            ELSE NULL
        END
    );

    -- Update entry timestamp
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.anamnesis_entry_create_version IS 'E75.1: Auto-create immutable version record on anamnesis_entry insert/update';

-- Attach trigger to anamnesis_entries
DROP TRIGGER IF EXISTS trigger_anamnesis_entry_versioning ON public.anamnesis_entries;

CREATE TRIGGER trigger_anamnesis_entry_versioning
    BEFORE INSERT OR UPDATE ON public.anamnesis_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.anamnesis_entry_create_version();

-- =============================================================================
-- SECTION 6: AUDIT LOG TRIGGER
-- =============================================================================

-- Trigger function: Log changes to audit_log
CREATE OR REPLACE FUNCTION public.anamnesis_entry_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (
            actor_user_id,
            entity_type,
            entity_id,
            action,
            org_id,
            source,
            metadata
        ) VALUES (
            COALESCE(NEW.created_by, auth.uid()),
            'anamnesis_entry',
            NEW.id,
            'created',
            NEW.organization_id,
            'api',
            jsonb_build_object(
                'patient_id', NEW.patient_id,
                'entry_type', NEW.entry_type,
                'title', NEW.title
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (
            actor_user_id,
            entity_type,
            entity_id,
            action,
            diff,
            org_id,
            source,
            metadata
        ) VALUES (
            COALESCE(NEW.updated_by, auth.uid()),
            'anamnesis_entry',
            NEW.id,
            'updated',
            jsonb_build_object(
                'before', jsonb_build_object('title', OLD.title, 'content', OLD.content),
                'after', jsonb_build_object('title', NEW.title, 'content', NEW.content)
            ),
            NEW.organization_id,
            'api',
            jsonb_build_object(
                'patient_id', NEW.patient_id,
                'entry_type', NEW.entry_type
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (
            actor_user_id,
            entity_type,
            entity_id,
            action,
            org_id,
            source,
            metadata
        ) VALUES (
            auth.uid(),
            'anamnesis_entry',
            OLD.id,
            'deleted',
            OLD.organization_id,
            'api',
            jsonb_build_object(
                'patient_id', OLD.patient_id,
                'entry_type', OLD.entry_type,
                'title', OLD.title
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.anamnesis_entry_audit_log IS 'E75.1: Auto-log anamnesis_entry changes to audit_log table';

-- Attach audit trigger
DROP TRIGGER IF EXISTS trigger_anamnesis_entry_audit ON public.anamnesis_entries;

CREATE TRIGGER trigger_anamnesis_entry_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.anamnesis_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.anamnesis_entry_audit_log();

-- =============================================================================
-- SECTION 7: RLS POLICIES - anamnesis_entries
-- =============================================================================

-- Enable RLS
ALTER TABLE public.anamnesis_entries ENABLE ROW LEVEL SECURITY;

-- R-E75.1-1: Patients can view own entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'anamnesis_entries'
          AND policyname = 'Patients can view own anamnesis entries'
    ) THEN
        CREATE POLICY "Patients can view own anamnesis entries"
            ON public.anamnesis_entries
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.patient_profiles pp
                    WHERE pp.id = anamnesis_entries.patient_id
                      AND pp.user_id = auth.uid()
                )
            );
    END IF;
END $$ LANGUAGE plpgsql;

-- R-E75.1-2: Patients can insert own entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'anamnesis_entries'
          AND policyname = 'Patients can insert own anamnesis entries'
    ) THEN
        CREATE POLICY "Patients can insert own anamnesis entries"
            ON public.anamnesis_entries
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.patient_profiles pp
                    WHERE pp.id = anamnesis_entries.patient_id
                      AND pp.user_id = auth.uid()
                )
            );
    END IF;
END $$ LANGUAGE plpgsql;

-- R-E75.1-3: Patients can update own entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'anamnesis_entries'
          AND policyname = 'Patients can update own anamnesis entries'
    ) THEN
        CREATE POLICY "Patients can update own anamnesis entries"
            ON public.anamnesis_entries
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.patient_profiles pp
                    WHERE pp.id = anamnesis_entries.patient_id
                      AND pp.user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.patient_profiles pp
                    WHERE pp.id = anamnesis_entries.patient_id
                      AND pp.user_id = auth.uid()
                )
            );
    END IF;
END $$ LANGUAGE plpgsql;

-- R-E75.1-4: Clinicians can view assigned patient entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'anamnesis_entries'
          AND policyname = 'Clinicians can view assigned patient anamnesis entries'
    ) THEN
        CREATE POLICY "Clinicians can view assigned patient anamnesis entries"
            ON public.anamnesis_entries
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.clinician_patient_assignments cpa
                    JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
                    WHERE cpa.clinician_user_id = auth.uid()
                      AND pp.id = anamnesis_entries.patient_id
                      AND cpa.organization_id = anamnesis_entries.organization_id
                )
            );
    END IF;
END $$ LANGUAGE plpgsql;

-- R-E75.1-5: Clinicians can insert entries for assigned patients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'anamnesis_entries'
          AND policyname = 'Clinicians can insert anamnesis entries for assigned patients'
    ) THEN
        CREATE POLICY "Clinicians can insert anamnesis entries for assigned patients"
            ON public.anamnesis_entries
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.clinician_patient_assignments cpa
                    JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
                    WHERE cpa.clinician_user_id = auth.uid()
                      AND pp.id = anamnesis_entries.patient_id
                      AND cpa.organization_id = anamnesis_entries.organization_id
                )
            );
    END IF;
END $$ LANGUAGE plpgsql;

-- R-E75.1-6: Clinicians can update entries for assigned patients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'anamnesis_entries'
          AND policyname = 'Clinicians can update anamnesis entries for assigned patients'
    ) THEN
        CREATE POLICY "Clinicians can update anamnesis entries for assigned patients"
            ON public.anamnesis_entries
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.clinician_patient_assignments cpa
                    JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
                    WHERE cpa.clinician_user_id = auth.uid()
                      AND pp.id = anamnesis_entries.patient_id
                      AND cpa.organization_id = anamnesis_entries.organization_id
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.clinician_patient_assignments cpa
                    JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
                    WHERE cpa.clinician_user_id = auth.uid()
                      AND pp.id = anamnesis_entries.patient_id
                      AND cpa.organization_id = anamnesis_entries.organization_id
                )
            );
    END IF;
END $$ LANGUAGE plpgsql;

-- R-E75.1-7: Admins can view org entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'anamnesis_entries'
          AND policyname = 'Admins can view org anamnesis entries'
    ) THEN
        CREATE POLICY "Admins can view org anamnesis entries"
            ON public.anamnesis_entries
            FOR SELECT
            USING (
                public.current_user_role(organization_id) = 'admin'::public.user_role
            );
    END IF;
END $$ LANGUAGE plpgsql;

-- R-E75.1-8: Admins can manage org entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'anamnesis_entries'
          AND policyname = 'Admins can manage org anamnesis entries'
    ) THEN
        CREATE POLICY "Admins can manage org anamnesis entries"
            ON public.anamnesis_entries
            FOR ALL
            USING (
                public.current_user_role(organization_id) = 'admin'::public.user_role
            )
            WITH CHECK (
                public.current_user_role(organization_id) = 'admin'::public.user_role
            );
    END IF;
END $$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 8: RLS POLICIES - anamnesis_entry_versions
-- =============================================================================

-- Enable RLS
ALTER TABLE public.anamnesis_entry_versions ENABLE ROW LEVEL SECURITY;

-- R-E75.1-9: Patients can view own entry versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'anamnesis_entry_versions'
          AND policyname = 'Patients can view own anamnesis entry versions'
    ) THEN
        CREATE POLICY "Patients can view own anamnesis entry versions"
            ON public.anamnesis_entry_versions
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 
                    FROM public.anamnesis_entries ae
                    JOIN public.patient_profiles pp ON pp.id = ae.patient_id
                    WHERE ae.id = anamnesis_entry_versions.entry_id
                      AND pp.user_id = auth.uid()
                )
            );
    END IF;
END $$ LANGUAGE plpgsql;

-- R-E75.1-10: Clinicians can view versions for assigned patients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'anamnesis_entry_versions'
          AND policyname = 'Clinicians can view versions for assigned patients'
    ) THEN
        CREATE POLICY "Clinicians can view versions for assigned patients"
            ON public.anamnesis_entry_versions
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 
                    FROM public.anamnesis_entries ae
                    JOIN public.patient_profiles pp ON pp.id = ae.patient_id
                    JOIN public.clinician_patient_assignments cpa 
                        ON cpa.patient_user_id = pp.user_id
                        AND cpa.organization_id = ae.organization_id
                    WHERE ae.id = anamnesis_entry_versions.entry_id
                      AND cpa.clinician_user_id = auth.uid()
                )
            );
    END IF;
END $$ LANGUAGE plpgsql;

-- R-E75.1-11: Admins can view org entry versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'anamnesis_entry_versions'
          AND policyname = 'Admins can view org entry versions'
    ) THEN
        CREATE POLICY "Admins can view org entry versions"
            ON public.anamnesis_entry_versions
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 
                    FROM public.anamnesis_entries ae
                    WHERE ae.id = anamnesis_entry_versions.entry_id
                      AND public.current_user_role(ae.organization_id) = 'admin'::public.user_role
                )
            );
    END IF;
END $$ LANGUAGE plpgsql;

-- NOTE: No INSERT/UPDATE/DELETE policies for versions - handled by trigger only
-- Versions are immutable and created automatically

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
