-- V0.5: Ensure funnel configuration tables are readable (and manageable) under RLS
--
-- Motivation:
-- - Admin endpoints may fall back to auth client if service-role key is misconfigured.
-- - In that case, RLS must permit clinician/admin to read/manage funnel metadata.
-- - Patient runtime endpoints also require read access to active funnel definitions.

-- Enable RLS (idempotent)
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_step_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Read policies
DO $$
BEGIN
  -- Active funnels readable to authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnels'
      AND policyname = 'Allow authenticated users to read active funnels'
  ) THEN
    CREATE POLICY "Allow authenticated users to read active funnels"
      ON public.funnels
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;

  -- Funnel config tables readable to authenticated users (needed for runtime definition)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnel_steps'
      AND policyname = 'Allow authenticated users to read funnel_steps'
  ) THEN
    CREATE POLICY "Allow authenticated users to read funnel_steps"
      ON public.funnel_steps
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnel_step_questions'
      AND policyname = 'Allow authenticated users to read funnel_step_questions'
  ) THEN
    CREATE POLICY "Allow authenticated users to read funnel_step_questions"
      ON public.funnel_step_questions
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'questions'
      AND policyname = 'Allow authenticated users to read questions'
  ) THEN
    CREATE POLICY "Allow authenticated users to read questions"
      ON public.questions
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Management policies (clinician/admin only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnels'
      AND policyname = 'Clinicians and admins can manage funnels'
  ) THEN
    CREATE POLICY "Clinicians and admins can manage funnels"
      ON public.funnels
      FOR UPDATE
      TO authenticated
      USING (public.has_any_role('admin') OR public.has_any_role('clinician'))
      WITH CHECK (public.has_any_role('admin') OR public.has_any_role('clinician'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnel_steps'
      AND policyname = 'Clinicians and admins can manage funnel_steps'
  ) THEN
    CREATE POLICY "Clinicians and admins can manage funnel_steps"
      ON public.funnel_steps
      FOR UPDATE
      TO authenticated
      USING (public.has_any_role('admin') OR public.has_any_role('clinician'))
      WITH CHECK (public.has_any_role('admin') OR public.has_any_role('clinician'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnel_step_questions'
      AND policyname = 'Clinicians and admins can manage funnel_step_questions'
  ) THEN
    CREATE POLICY "Clinicians and admins can manage funnel_step_questions"
      ON public.funnel_step_questions
      FOR UPDATE
      TO authenticated
      USING (public.has_any_role('admin') OR public.has_any_role('clinician'))
      WITH CHECK (public.has_any_role('admin') OR public.has_any_role('clinician'));
  END IF;
END $$;
