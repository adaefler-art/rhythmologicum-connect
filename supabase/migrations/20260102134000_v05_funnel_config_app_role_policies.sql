-- V0.5: Funnel config RLS using app_metadata roles
--
-- Why:
-- - This project’s primary role source is auth.users.raw_app_meta_data.role (see public.has_role()).
-- - Earlier policies used public.has_any_role() which depends on user_org_membership and may be empty.
-- - Result: clinicians/admins could be blocked by RLS even though auth metadata role is correct.

-- Read all funnels for clinicians/admins (including inactive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnels'
      AND policyname = 'Clinicians and admins can read all funnels (app role)'
  ) THEN
    CREATE POLICY "Clinicians and admins can read all funnels (app role)"
      ON public.funnels
      FOR SELECT
      TO authenticated
      USING (public.has_role('admin') OR public.has_role('clinician'));
  END IF;
END $$;

-- Manage funnel config for clinicians/admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnels'
      AND policyname = 'Clinicians and admins can update funnels (app role)'
  ) THEN
    CREATE POLICY "Clinicians and admins can update funnels (app role)"
      ON public.funnels
      FOR UPDATE
      TO authenticated
      USING (public.has_role('admin') OR public.has_role('clinician'))
      WITH CHECK (public.has_role('admin') OR public.has_role('clinician'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnel_steps'
      AND policyname = 'Clinicians and admins can update funnel_steps (app role)'
  ) THEN
    CREATE POLICY "Clinicians and admins can update funnel_steps (app role)"
      ON public.funnel_steps
      FOR UPDATE
      TO authenticated
      USING (public.has_role('admin') OR public.has_role('clinician'))
      WITH CHECK (public.has_role('admin') OR public.has_role('clinician'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnel_step_questions'
      AND policyname = 'Clinicians and admins can update funnel_step_questions (app role)'
  ) THEN
    CREATE POLICY "Clinicians and admins can update funnel_step_questions (app role)"
      ON public.funnel_step_questions
      FOR UPDATE
      TO authenticated
      USING (public.has_role('admin') OR public.has_role('clinician'))
      WITH CHECK (public.has_role('admin') OR public.has_role('clinician'));
  END IF;
END $$;

-- Optional: let clinician/admin view all catalog entries (not only active)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnels_catalog'
      AND policyname = 'Clinicians and admins can view all funnels_catalog (app role)'
  ) THEN
    CREATE POLICY "Clinicians and admins can view all funnels_catalog (app role)"
      ON public.funnels_catalog
      FOR SELECT
      USING (public.has_role('admin') OR public.has_role('clinician'));
  END IF;
END $$;
