-- Migration: <feature name>
-- Description: <short summary>
-- Date: <YYYY-MM-DD>
--
-- Copy this file into supabase/migrations/<timestamp>_<description>.sql and fill in the sections below.

-- 1) Table / column changes --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.example_table (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Constraints with guards -------------------------------------------------
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
              AND table_name = 'example_table'
              AND constraint_name = 'example_table_user_id_fkey'
        ) THEN
            ALTER TABLE public.example_table
                ADD CONSTRAINT example_table_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END
$$ LANGUAGE plpgsql;

-- 3) Indexes -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_example_table_user_id ON public.example_table(user_id);

-- 4) RLS + policies -----------------------------------------------------------
ALTER TABLE public.example_table ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'example_table'
          AND policyname = 'Users can view own rows'
    ) THEN
        CREATE POLICY "Users can view own rows"
            ON public.example_table
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
          AND tablename = 'example_table'
          AND policyname = 'Users can insert own rows'
    ) THEN
        CREATE POLICY "Users can insert own rows"
            ON public.example_table
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$ LANGUAGE plpgsql;

-- 5) Comments / grants -------------------------------------------------------
COMMENT ON TABLE public.example_table IS 'Replace with a helpful description.';

-- End of template ------------------------------------------------------------
