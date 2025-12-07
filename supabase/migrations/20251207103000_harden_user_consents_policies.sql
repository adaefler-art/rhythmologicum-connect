-- Migration: Harden user_consents policies
-- Description: Make consent policies re-runnable and add documentation comment
-- Date: 2025-12-07

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_consents'
          AND policyname = 'Users can view own consents'
    ) THEN
        DROP POLICY "Users can view own consents" ON public.user_consents;
    END IF;
END
$$ LANGUAGE plpgsql;

CREATE POLICY "Users can view own consents"
    ON public.user_consents
    FOR SELECT
    USING (auth.uid() = user_id);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_consents'
          AND policyname = 'Users can insert own consents'
    ) THEN
        DROP POLICY "Users can insert own consents" ON public.user_consents;
    END IF;
END
$$ LANGUAGE plpgsql;

CREATE POLICY "Users can insert own consents"
    ON public.user_consents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_consents IS 'Versioned consent records for Nutzungsbedingungen approvals.';
