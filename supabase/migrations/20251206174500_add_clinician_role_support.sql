-- Migration: Add clinician role support
-- This migration adds documentation and helper functions for managing clinician roles
-- 
-- To create a clinician user:
-- 1. Create a user via Supabase Auth (email/password)
-- 2. Run the following SQL to add the clinician role:
--    UPDATE auth.users 
--    SET raw_app_meta_data = jsonb_set(
--      COALESCE(raw_app_meta_data, '{}'::jsonb),
--      '{role}',
--      '"clinician"'
--    )
--    WHERE email = 'doctor@example.com';
--
-- Or use the helper function below:
--    SELECT set_user_role('doctor@example.com', 'clinician');

-- Helper function to set user role
CREATE OR REPLACE FUNCTION public.set_user_role(user_email TEXT, user_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(user_role)
  )
  WHERE email = user_email;
END;
$$;

-- Helper function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(check_role TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT (raw_app_meta_data->>'role' = check_role)
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.set_user_role(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.set_user_role IS 'Sets the role for a user in their app_metadata. Usage: SELECT set_user_role(''email@example.com'', ''clinician'');';
COMMENT ON FUNCTION public.has_role IS 'Check if the current user has a specific role. Usage: SELECT has_role(''clinician'');';
