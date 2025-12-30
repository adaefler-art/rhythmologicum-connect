-- Migration: V0.5 Core Schema - JSONB Fields & Multi-Funnel Support
-- Description: Implements v0.5 core data model with JSONB for variable content,
--              supports multi-funnel, versioning, document extraction, processing results,
--              reports/sections, tasks/notifications, and audit logging.
-- Date: 2025-12-30
-- Issue: V05-I01.1

-- =============================================================================
-- SECTION 1: ENUMS & TYPES
-- =============================================================================

-- Role enum (includes nurse per requirements)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('patient', 'clinician', 'nurse', 'admin');
    END IF;
END $$ LANGUAGE plpgsql;

-- Assessment state enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_state') THEN
        CREATE TYPE public.assessment_state AS ENUM ('draft', 'in_progress', 'completed', 'archived');
    END IF;
END $$ LANGUAGE plpgsql;

-- Report status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE public.report_status AS ENUM ('pending', 'generating', 'completed', 'failed');
    END IF;
END $$ LANGUAGE plpgsql;

-- Task status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
    END IF;
END $$ LANGUAGE plpgsql;

-- Document parsing status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parsing_status') THEN
        CREATE TYPE public.parsing_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'partial');
    END IF;
END $$ LANGUAGE plpgsql;

-- Notification status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE public.notification_status AS ENUM ('scheduled', 'sent', 'failed', 'cancelled');
    END IF;
END $$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 2: IDENTITY & ACCESS (RLS-ready for multi-tenant)
-- =============================================================================

-- Organizations table (tenant support)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

COMMENT ON TABLE public.organizations IS 'V0.5: Organizations for multi-tenant support';
COMMENT ON COLUMN public.organizations.settings IS 'Organization-specific configuration (JSONB)';

-- User profiles (extended)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    organization_id UUID REFERENCES public.organizations(id),
    display_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

COMMENT ON TABLE public.user_profiles IS 'V0.5: Extended user profile information';

-- Add FK to auth.users if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_namespace n
        JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'user_profiles_user_id_fkey'
              AND table_schema = 'public'
              AND table_name = 'user_profiles'
        ) THEN
            ALTER TABLE public.user_profiles
                ADD CONSTRAINT user_profiles_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$ LANGUAGE plpgsql;

-- User organization membership
CREATE TABLE IF NOT EXISTS public.user_org_membership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'patient',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    UNIQUE(user_id, organization_id)
);

COMMENT ON TABLE public.user_org_membership IS 'V0.5: User-organization associations with roles';

-- Add FK to auth.users if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_namespace n
        JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'user_org_membership_user_id_fkey'
              AND table_schema = 'public'
              AND table_name = 'user_org_membership'
        ) THEN
            ALTER TABLE public.user_org_membership
                ADD CONSTRAINT user_org_membership_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 3: FUNNELS / VERSIONS / SESSIONS
-- =============================================================================

-- Funnels catalog (master funnel definitions)
CREATE TABLE IF NOT EXISTS public.funnels_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    pillar_id TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

COMMENT ON TABLE public.funnels_catalog IS 'V0.5: Master catalog of available funnels';
COMMENT ON COLUMN public.funnels_catalog.pillar_id IS 'Reference to health pillar (e.g., "stress", "sleep", "nutrition")';

-- Funnel versions (versioned configurations with JSONB)
CREATE TABLE IF NOT EXISTS public.funnel_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES public.funnels_catalog(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    questionnaire_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
    algorithm_bundle_version TEXT,
    prompt_version TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    rollout_percent INTEGER DEFAULT 100 CHECK (rollout_percent >= 0 AND rollout_percent <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    UNIQUE(funnel_id, version)
);

COMMENT ON TABLE public.funnel_versions IS 'V0.5: Versioned funnel configurations with JSONB for dynamic content';
COMMENT ON COLUMN public.funnel_versions.questionnaire_config IS 'JSONB: Questions, steps, validation rules';
COMMENT ON COLUMN public.funnel_versions.content_manifest IS 'JSONB: Content pages, media, flow structure';
COMMENT ON COLUMN public.funnel_versions.algorithm_bundle_version IS 'Version of scoring/analysis algorithms';
COMMENT ON COLUMN public.funnel_versions.prompt_version IS 'Version of AI prompts for report generation';
COMMENT ON COLUMN public.funnel_versions.rollout_percent IS 'Percentage of users receiving this version (A/B testing)';

-- Patient funnels (patient-specific funnel instances)
CREATE TABLE IF NOT EXISTS public.patient_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    funnel_id UUID NOT NULL REFERENCES public.funnels_catalog(id),
    active_version_id UUID REFERENCES public.funnel_versions(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

COMMENT ON TABLE public.patient_funnels IS 'V0.5: Patient-specific funnel instances tracking progress';

-- =============================================================================
-- SECTION 4: ASSESSMENTS / ANSWERS / STATE (Extended)
-- =============================================================================

-- Add state column to assessments if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'assessments'
          AND column_name = 'state'
    ) THEN
        ALTER TABLE public.assessments
            ADD COLUMN state public.assessment_state DEFAULT 'in_progress';
    END IF;
END $$ LANGUAGE plpgsql;

-- Add current_step_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'assessments'
          AND column_name = 'current_step_id'
    ) THEN
        ALTER TABLE public.assessments
            ADD COLUMN current_step_id UUID REFERENCES public.funnel_steps(id);
    END IF;
END $$ LANGUAGE plpgsql;

-- Assessment events (audit trail for assessments)
CREATE TABLE IF NOT EXISTS public.assessment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.assessment_events IS 'V0.5: Event log for assessment lifecycle tracking';
COMMENT ON COLUMN public.assessment_events.event_type IS 'Event types: started, step_completed, paused, resumed, completed, etc.';
COMMENT ON COLUMN public.assessment_events.payload IS 'JSONB: Event-specific data (step_id, answers, etc.)';

-- =============================================================================
-- SECTION 5: DOCUMENTS / EXTRACTION
-- =============================================================================

-- Documents table (uploaded documents with extraction)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    doc_type TEXT,
    parsing_status public.parsing_status NOT NULL DEFAULT 'pending',
    extracted_data JSONB DEFAULT '{}'::jsonb,
    confidence JSONB DEFAULT '{}'::jsonb,
    confirmed_data JSONB DEFAULT '{}'::jsonb,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

COMMENT ON TABLE public.documents IS 'V0.5: Document storage with AI extraction results';
COMMENT ON COLUMN public.documents.storage_path IS 'Path to file in storage bucket';
COMMENT ON COLUMN public.documents.doc_type IS 'Document type (e.g., lab_report, prescription, medical_history)';
COMMENT ON COLUMN public.documents.extracted_data IS 'JSONB: AI-extracted structured data from document';
COMMENT ON COLUMN public.documents.confidence IS 'JSONB: Confidence scores per extracted field';
COMMENT ON COLUMN public.documents.confirmed_data IS 'JSONB: User-confirmed/corrected data';

-- =============================================================================
-- SECTION 6: CALCULATED RESULTS / RANKING
-- =============================================================================

-- Calculated results (algorithm outputs)
CREATE TABLE IF NOT EXISTS public.calculated_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    algorithm_version TEXT NOT NULL,
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_models JSONB DEFAULT '{}'::jsonb,
    priority_ranking JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.calculated_results IS 'V0.5: Algorithm-calculated results with JSONB for flexible scoring';
COMMENT ON COLUMN public.calculated_results.algorithm_version IS 'Version of algorithm used for calculations';
COMMENT ON COLUMN public.calculated_results.scores IS 'JSONB: Calculated scores (e.g., stress_score, resilience_score)';
COMMENT ON COLUMN public.calculated_results.risk_models IS 'JSONB: Risk assessment outputs';
COMMENT ON COLUMN public.calculated_results.priority_ranking IS 'JSONB: Priority/urgency calculations';

-- Unique constraint: one result per assessment + algorithm version
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'calculated_results_assessment_version_unique'
          AND table_schema = 'public'
          AND table_name = 'calculated_results'
    ) THEN
        ALTER TABLE public.calculated_results
            ADD CONSTRAINT calculated_results_assessment_version_unique
            UNIQUE(assessment_id, algorithm_version);
    END IF;
END $$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 7: REPORTS / SECTIONS / DELIVERY
-- =============================================================================

-- Extend reports table with v0.5 fields
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'report_version'
    ) THEN
        ALTER TABLE public.reports
            ADD COLUMN report_version TEXT DEFAULT '1.0';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'prompt_version'
    ) THEN
        ALTER TABLE public.reports
            ADD COLUMN prompt_version TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'status'
    ) THEN
        ALTER TABLE public.reports
            ADD COLUMN status public.report_status DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'safety_score'
    ) THEN
        ALTER TABLE public.reports
            ADD COLUMN safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'safety_findings'
    ) THEN
        ALTER TABLE public.reports
            ADD COLUMN safety_findings JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'html_path'
    ) THEN
        ALTER TABLE public.reports
            ADD COLUMN html_path TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'pdf_path'
    ) THEN
        ALTER TABLE public.reports
            ADD COLUMN pdf_path TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'citations_meta'
    ) THEN
        ALTER TABLE public.reports
            ADD COLUMN citations_meta JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.reports.report_version IS 'V0.5: Version of report format/structure';
COMMENT ON COLUMN public.reports.prompt_version IS 'V0.5: Version of AI prompt used for generation';
COMMENT ON COLUMN public.reports.status IS 'V0.5: Report generation status';
COMMENT ON COLUMN public.reports.safety_score IS 'V0.5: Safety/quality score (0-100)';
COMMENT ON COLUMN public.reports.safety_findings IS 'V0.5: JSONB - Safety analysis results';
COMMENT ON COLUMN public.reports.citations_meta IS 'V0.5: JSONB - Citation metadata and references';

-- Unique constraint: one report per assessment + version
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reports_assessment_version_unique'
          AND table_schema = 'public'
          AND table_name = 'reports'
    ) THEN
        ALTER TABLE public.reports
            ADD CONSTRAINT reports_assessment_version_unique
            UNIQUE(assessment_id, report_version);
    END IF;
END $$ LANGUAGE plpgsql;

-- Report sections (sectioned reports)
CREATE TABLE IF NOT EXISTS public.report_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    section_key TEXT NOT NULL,
    prompt_version TEXT,
    content TEXT NOT NULL,
    citations_meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.report_sections IS 'V0.5: Sectioned reports for modular content generation';
COMMENT ON COLUMN public.report_sections.section_key IS 'Section identifier (e.g., summary, risk_analysis, recommendations)';
COMMENT ON COLUMN public.report_sections.citations_meta IS 'JSONB: Section-specific citation metadata';

-- Unique constraint: one section per report + key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'report_sections_report_key_unique'
          AND table_schema = 'public'
          AND table_name = 'report_sections'
    ) THEN
        ALTER TABLE public.report_sections
            ADD CONSTRAINT report_sections_report_key_unique
            UNIQUE(report_id, section_key);
    END IF;
END $$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 8: TASKS / NOTIFICATIONS
-- =============================================================================

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
    created_by_role public.user_role,
    assigned_to_role public.user_role,
    task_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status public.task_status NOT NULL DEFAULT 'pending',
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

COMMENT ON TABLE public.tasks IS 'V0.5: Task management with role-based assignment';
COMMENT ON COLUMN public.tasks.task_type IS 'Task type (e.g., review_assessment, schedule_followup, contact_patient)';
COMMENT ON COLUMN public.tasks.payload IS 'JSONB: Task-specific data and parameters';

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    channel TEXT NOT NULL,
    template_key TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    status public.notification_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'V0.5: Notification queue with multi-channel support';
COMMENT ON COLUMN public.notifications.channel IS 'Notification channel (email, sms, push, in_app)';
COMMENT ON COLUMN public.notifications.template_key IS 'Template identifier for content generation';
COMMENT ON COLUMN public.notifications.payload IS 'JSONB: Template variables and notification data';

-- Add FK to auth.users if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_namespace n
        JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'notifications_user_id_fkey'
              AND table_schema = 'public'
              AND table_name = 'notifications'
        ) THEN
            ALTER TABLE public.notifications
                ADD CONSTRAINT notifications_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 9: AUDIT LOG
-- =============================================================================

-- Audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID,
    actor_role public.user_role,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    diff JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS 'V0.5: Comprehensive audit trail for all system changes';
COMMENT ON COLUMN public.audit_log.actor_user_id IS 'User who performed the action (NULL for system actions)';
COMMENT ON COLUMN public.audit_log.entity_type IS 'Type of entity modified (e.g., assessment, report, funnel)';
COMMENT ON COLUMN public.audit_log.entity_id IS 'UUID of the modified entity';
COMMENT ON COLUMN public.audit_log.action IS 'Action performed (created, updated, deleted, etc.)';
COMMENT ON COLUMN public.audit_log.diff IS 'JSONB: Before/after differences for updates';

-- Add FK to auth.users if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_namespace n
        JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'audit_log_actor_user_id_fkey'
              AND table_schema = 'public'
              AND table_name = 'audit_log'
        ) THEN
            ALTER TABLE public.audit_log
                ADD CONSTRAINT audit_log_actor_user_id_fkey
                FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 10: INDEXES
-- =============================================================================

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON public.user_profiles(organization_id);

-- User org membership indexes
CREATE INDEX IF NOT EXISTS idx_user_org_membership_user_id ON public.user_org_membership(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_membership_organization_id ON public.user_org_membership(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_org_membership_role ON public.user_org_membership(role);

-- Funnels catalog indexes
CREATE INDEX IF NOT EXISTS idx_funnels_catalog_slug ON public.funnels_catalog(slug);
CREATE INDEX IF NOT EXISTS idx_funnels_catalog_is_active ON public.funnels_catalog(is_active);

-- Funnel versions indexes
CREATE INDEX IF NOT EXISTS idx_funnel_versions_funnel_id ON public.funnel_versions(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_versions_is_default ON public.funnel_versions(is_default) WHERE is_default = true;

-- Patient funnels indexes
CREATE INDEX IF NOT EXISTS idx_patient_funnels_patient_id ON public.patient_funnels(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_funnels_funnel_id ON public.patient_funnels(funnel_id);
CREATE INDEX IF NOT EXISTS idx_patient_funnels_status ON public.patient_funnels(status);

-- Assessment events indexes
CREATE INDEX IF NOT EXISTS idx_assessment_events_assessment_id ON public.assessment_events(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_events_created_at ON public.assessment_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_events_event_type ON public.assessment_events(event_type);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_assessment_id ON public.documents(assessment_id);
CREATE INDEX IF NOT EXISTS idx_documents_parsing_status ON public.documents(parsing_status);

-- Calculated results indexes
CREATE INDEX IF NOT EXISTS idx_calculated_results_assessment_id ON public.calculated_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_calculated_results_created_at ON public.calculated_results(created_at DESC);

-- Report sections indexes
CREATE INDEX IF NOT EXISTS idx_report_sections_report_id ON public.report_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_report_sections_section_key ON public.report_sections(section_key);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_patient_id ON public.tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assessment_id ON public.tasks(assessment_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_role_status_due ON public.tasks(assigned_to_role, status, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON public.notifications(scheduled_at);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type_id ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_user_id ON public.audit_log(actor_user_id);

-- =============================================================================
-- SECTION 11: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_org_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculated_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Organizations policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'organizations'
          AND policyname = 'Authenticated users can view active organizations'
    ) THEN
        CREATE POLICY "Authenticated users can view active organizations"
            ON public.organizations FOR SELECT
            USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'organizations'
          AND policyname = 'Admins can manage organizations'
    ) THEN
        CREATE POLICY "Admins can manage organizations"
            ON public.organizations FOR ALL
            USING (public.has_role('admin'));
    END IF;
END $$ LANGUAGE plpgsql;

-- User profiles policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user_profiles'
          AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile"
            ON public.user_profiles FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user_profiles'
          AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
            ON public.user_profiles FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user_profiles'
          AND policyname = 'Clinicians can view all profiles'
    ) THEN
        CREATE POLICY "Clinicians can view all profiles"
            ON public.user_profiles FOR SELECT
            USING (public.is_clinician());
    END IF;
END $$ LANGUAGE plpgsql;

-- Funnels catalog policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'funnels_catalog'
          AND policyname = 'Authenticated users can view active funnels'
    ) THEN
        CREATE POLICY "Authenticated users can view active funnels"
            ON public.funnels_catalog FOR SELECT
            USING (is_active = true);
    END IF;
END $$ LANGUAGE plpgsql;

-- Funnel versions policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'funnel_versions'
          AND policyname = 'Authenticated users can view funnel versions'
    ) THEN
        CREATE POLICY "Authenticated users can view funnel versions"
            ON public.funnel_versions FOR SELECT
            USING (true);
    END IF;
END $$ LANGUAGE plpgsql;

-- Patient funnels policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'patient_funnels'
          AND policyname = 'Patients can view own funnels'
    ) THEN
        CREATE POLICY "Patients can view own funnels"
            ON public.patient_funnels FOR SELECT
            USING (
                patient_id IN (
                    SELECT id FROM public.patient_profiles WHERE user_id = auth.uid()
                )
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'patient_funnels'
          AND policyname = 'Clinicians can view all patient funnels'
    ) THEN
        CREATE POLICY "Clinicians can view all patient funnels"
            ON public.patient_funnels FOR SELECT
            USING (public.is_clinician());
    END IF;
END $$ LANGUAGE plpgsql;

-- Assessment events policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'assessment_events'
          AND policyname = 'Patients can view own assessment events'
    ) THEN
        CREATE POLICY "Patients can view own assessment events"
            ON public.assessment_events FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.assessments
                    WHERE assessments.id = assessment_events.assessment_id
                      AND assessments.patient_id = public.get_my_patient_profile_id()
                )
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'assessment_events'
          AND policyname = 'Clinicians can view all assessment events'
    ) THEN
        CREATE POLICY "Clinicians can view all assessment events"
            ON public.assessment_events FOR SELECT
            USING (public.is_clinician());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'assessment_events'
          AND policyname = 'Service can insert events'
    ) THEN
        CREATE POLICY "Service can insert events"
            ON public.assessment_events FOR INSERT
            WITH CHECK (true);
    END IF;
END $$ LANGUAGE plpgsql;

-- Documents policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'documents'
          AND policyname = 'Patients can view own documents'
    ) THEN
        CREATE POLICY "Patients can view own documents"
            ON public.documents FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.assessments
                    WHERE assessments.id = documents.assessment_id
                      AND assessments.patient_id = public.get_my_patient_profile_id()
                )
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'documents'
          AND policyname = 'Clinicians can view all documents'
    ) THEN
        CREATE POLICY "Clinicians can view all documents"
            ON public.documents FOR SELECT
            USING (public.is_clinician());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'documents'
          AND policyname = 'Service can manage documents'
    ) THEN
        CREATE POLICY "Service can manage documents"
            ON public.documents FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$ LANGUAGE plpgsql;

-- Calculated results policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'calculated_results'
          AND policyname = 'Patients can view own results'
    ) THEN
        CREATE POLICY "Patients can view own results"
            ON public.calculated_results FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.assessments
                    WHERE assessments.id = calculated_results.assessment_id
                      AND assessments.patient_id = public.get_my_patient_profile_id()
                )
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'calculated_results'
          AND policyname = 'Clinicians can view all results'
    ) THEN
        CREATE POLICY "Clinicians can view all results"
            ON public.calculated_results FOR SELECT
            USING (public.is_clinician());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'calculated_results'
          AND policyname = 'Service can insert results'
    ) THEN
        CREATE POLICY "Service can insert results"
            ON public.calculated_results FOR INSERT
            WITH CHECK (true);
    END IF;
END $$ LANGUAGE plpgsql;

-- Report sections policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'report_sections'
          AND policyname = 'Patients can view own report sections'
    ) THEN
        CREATE POLICY "Patients can view own report sections"
            ON public.report_sections FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.reports
                    JOIN public.assessments ON assessments.id = reports.assessment_id
                    WHERE reports.id = report_sections.report_id
                      AND assessments.patient_id = public.get_my_patient_profile_id()
                )
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'report_sections'
          AND policyname = 'Clinicians can view all report sections'
    ) THEN
        CREATE POLICY "Clinicians can view all report sections"
            ON public.report_sections FOR SELECT
            USING (public.is_clinician());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'report_sections'
          AND policyname = 'Service can manage report sections'
    ) THEN
        CREATE POLICY "Service can manage report sections"
            ON public.report_sections FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$ LANGUAGE plpgsql;

-- Tasks policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'tasks'
          AND policyname = 'Patients can view own tasks'
    ) THEN
        CREATE POLICY "Patients can view own tasks"
            ON public.tasks FOR SELECT
            USING (
                patient_id IN (
                    SELECT id FROM public.patient_profiles WHERE user_id = auth.uid()
                )
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'tasks'
          AND policyname = 'Clinicians can view all tasks'
    ) THEN
        CREATE POLICY "Clinicians can view all tasks"
            ON public.tasks FOR SELECT
            USING (public.is_clinician());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'tasks'
          AND policyname = 'Service can manage tasks'
    ) THEN
        CREATE POLICY "Service can manage tasks"
            ON public.tasks FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$ LANGUAGE plpgsql;

-- Notifications policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'notifications'
          AND policyname = 'Users can view own notifications'
    ) THEN
        CREATE POLICY "Users can view own notifications"
            ON public.notifications FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'notifications'
          AND policyname = 'Service can manage notifications'
    ) THEN
        CREATE POLICY "Service can manage notifications"
            ON public.notifications FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$ LANGUAGE plpgsql;

-- Audit log policies (read-only for admins)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'audit_log'
          AND policyname = 'Admins can view audit log'
    ) THEN
        CREATE POLICY "Admins can view audit log"
            ON public.audit_log FOR SELECT
            USING (public.has_role('admin'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'audit_log'
          AND policyname = 'Service can insert audit entries'
    ) THEN
        CREATE POLICY "Service can insert audit entries"
            ON public.audit_log FOR INSERT
            WITH CHECK (true);
    END IF;
END $$ LANGUAGE plpgsql;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
