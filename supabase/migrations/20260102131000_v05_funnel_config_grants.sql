-- V0.5: Grant table privileges + clinician/admin read access for funnel config tables
--
-- Rationale:
-- - RLS policies alone are not sufficient if SELECT/UPDATE privileges are not granted.
-- - Admin endpoints may fall back to the auth client (anon key + cookies). In that mode,
--   authenticated users need table privileges and suitable RLS policies.

-- Ensure authenticated has table privileges (RLS still applies)
GRANT SELECT ON public.funnels TO authenticated;
GRANT SELECT ON public.funnel_steps TO authenticated;
GRANT SELECT ON public.funnel_step_questions TO authenticated;
GRANT SELECT ON public.questions TO authenticated;

GRANT UPDATE ON public.funnels TO authenticated;
GRANT UPDATE ON public.funnel_steps TO authenticated;
GRANT UPDATE ON public.funnel_step_questions TO authenticated;

-- Allow clinicians/admins to read all funnels (including inactive) for management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnels'
      AND policyname = 'Clinicians and admins can read all funnels'
  ) THEN
    CREATE POLICY "Clinicians and admins can read all funnels"
      ON public.funnels
      FOR SELECT
      TO authenticated
      USING (public.has_any_role('admin') OR public.has_any_role('clinician'));
  END IF;
END $$;
