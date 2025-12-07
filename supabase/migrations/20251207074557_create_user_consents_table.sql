-- Migration: D2 Consent Data Storage
-- Description: Store user consent acceptances with versioning
-- Date: 2025-12-07
--
-- This migration creates a table for storing consent records with proper RLS policies.
-- Each user can consent to a specific version exactly once (enforced by unique constraint).

-- 1) Table creation with all columns ------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    consent_version text NOT NULL,
    consented_at timestamptz DEFAULT now() NOT NULL,
    ip_address text,
    user_agent text
);

-- 2) Constraints with guards -------------------------------------------------
-- Primary key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'user_consents'
          AND constraint_name = 'user_consents_pkey'
    ) THEN
        ALTER TABLE public.user_consents
            ADD CONSTRAINT user_consents_pkey PRIMARY KEY (id);
    END IF;
END
$$ LANGUAGE plpgsql;

-- Unique constraint: one consent per user per version
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'user_consents'
          AND constraint_name = 'user_consents_user_id_consent_version_key'
    ) THEN
        ALTER TABLE public.user_consents
            ADD CONSTRAINT user_consents_user_id_consent_version_key
            UNIQUE (user_id, consent_version);
    END IF;
END
$$ LANGUAGE plpgsql;

-- Foreign key to auth.users with CASCADE delete
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_namespace n
        JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth'
          AND c.relname = 'users'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_schema = 'public'
              AND table_name = 'user_consents'
              AND constraint_name = 'user_consents_user_id_fkey'
        ) THEN
            ALTER TABLE public.user_consents
                ADD CONSTRAINT user_consents_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END
$$ LANGUAGE plpgsql;

-- 3) Indexes -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consented_at ON public.user_consents(consented_at DESC);

-- 4) RLS + policies -----------------------------------------------------------
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_consents'
          AND policyname = 'Users can view own consents'
    ) THEN
        CREATE POLICY "Users can view own consents"
            ON public.user_consents
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_consents'
          AND policyname = 'Users can insert own consents'
    ) THEN
        CREATE POLICY "Users can insert own consents"
            ON public.user_consents
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$ LANGUAGE plpgsql;

-- Clinicians can view all consents (for audit and compliance purposes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_consents'
          AND policyname = 'Clinicians can view all consents'
    ) THEN
        CREATE POLICY "Clinicians can view all consents"
            ON public.user_consents
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                    FROM auth.users
                    WHERE id = auth.uid()
                      AND (raw_app_meta_data->>'role' = 'clinician')
                )
            );
    END IF;
END
$$ LANGUAGE plpgsql;

-- 5) Comments / grants -------------------------------------------------------
COMMENT ON TABLE public.user_consents IS 'Versioned consent records for Nutzungsbedingungen approvals. Each user can consent to a specific version exactly once.';
COMMENT ON COLUMN public.user_consents.consent_version IS 'Version string matching CONSENT_VERSION in lib/consentConfig.ts';
COMMENT ON COLUMN public.user_consents.ip_address IS 'IP address from which consent was given (for audit trail)';
COMMENT ON COLUMN public.user_consents.user_agent IS 'Browser user agent string (for audit trail)';

-- End of migration ------------------------------------------------------------
