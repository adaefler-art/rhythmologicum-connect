-- Migration: fix_is_clinician_use_app_metadata
-- Description: Fix is_clinician() to query raw_app_meta_data from auth.users instead of JWT claims
-- 
-- Root Cause: The original is_clinician() function uses auth.jwt()->>'role', but there is no
-- custom access token hook configured in Supabase to inject the role into the JWT.
-- This causes RLS policies to fail when checking clinician access.
--
-- Solution: Query auth.users.raw_app_meta_data directly, similar to how has_role() works.
-- This ensures the function works correctly without requiring JWT customization.
--
-- Related Issue: Fix Issue 04 — Assessments: Antworten werden nicht angezeigt

CREATE OR REPLACE FUNCTION "public"."is_clinician"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (raw_app_meta_data->>'role' IN ('clinician', 'admin', 'nurse')),
      false
    )
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION "public"."is_clinician"() IS 'Returns true if the current authenticated user has the clinician, admin, or nurse role. Queries app_metadata directly instead of relying on JWT claims.';
