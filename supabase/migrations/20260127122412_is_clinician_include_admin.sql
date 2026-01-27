-- Migration: is_clinician_include_admin
-- Description: Extend is_clinician() function to also return true for admin role
-- This allows administrators to access clinician-level resources

CREATE OR REPLACE FUNCTION "public"."is_clinician"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt()->>'role' IN ('clinician', 'admin')),
      false
    )
  );
END;
$$;

COMMENT ON FUNCTION "public"."is_clinician"() IS 'Returns true if the current authenticated user has the clinician or admin role';
