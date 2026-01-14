-- E6.4.1: Add pilot eligibility fields to organizations and user_profiles
-- 
-- This migration adds fields to support pilot eligibility checking
-- for v0.6 pilot features.

-- Add pilot_enabled flag to organizations settings (JSONB field)
-- No schema change needed - settings is already JSONB
-- Document the expected structure in comments

COMMENT ON COLUMN public.organizations.settings IS 'Organization-specific configuration (JSONB). E6.4.1: Can include pilot_enabled boolean for pilot eligibility.';

-- Add pilot_enabled flag to user_profiles metadata (JSONB field)
-- No schema change needed - metadata is already JSONB
-- Document the expected structure in comments

COMMENT ON COLUMN public.user_profiles.metadata IS 'E6.4.1: Can include pilot_enabled boolean for pilot eligibility. Also used for other user-specific metadata.';

-- Add helper function to check if user is in pilot program
-- This function checks both user and org pilot flags

CREATE OR REPLACE FUNCTION public.is_pilot_eligible(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_pilot_flag BOOLEAN;
  org_pilot_flag BOOLEAN;
BEGIN
  -- Check user's pilot flag in user_profiles.metadata
  SELECT COALESCE((metadata->>'pilot_enabled')::boolean, false)
  INTO user_pilot_flag
  FROM public.user_profiles
  WHERE user_profiles.user_id = is_pilot_eligible.user_id
  LIMIT 1;
  
  IF user_pilot_flag THEN
    RETURN true;
  END IF;
  
  -- Check if any of user's organizations has pilot enabled
  SELECT EXISTS (
    SELECT 1
    FROM public.user_org_membership uom
    JOIN public.organizations o ON o.id = uom.organization_id
    WHERE uom.user_id = is_pilot_eligible.user_id
      AND uom.is_active = true
      AND COALESCE((o.settings->>'pilot_enabled')::boolean, false) = true
  )
  INTO org_pilot_flag;
  
  RETURN org_pilot_flag;
END;
$$;

COMMENT ON FUNCTION public.is_pilot_eligible(UUID) IS 'E6.4.1: Returns true if user is eligible for pilot features (checks user and org pilot flags)';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_pilot_eligible(UUID) TO authenticated;

-- Example: Set pilot flag for a test organization
-- This is commented out - it should be set via seed data or admin UI
-- UPDATE public.organizations
-- SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{pilot_enabled}', 'true'::jsonb)
-- WHERE slug = 'test-org';

-- Example: Set pilot flag for a test user
-- This is commented out - it should be set via seed data or admin UI
-- UPDATE public.user_profiles
-- SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pilot_enabled}', 'true'::jsonb)
-- WHERE user_id = 'user-uuid-here';
