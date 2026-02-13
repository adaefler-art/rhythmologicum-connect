-- Add policy_override for clinician safety overrides

ALTER TABLE public.clinical_intakes
ADD COLUMN IF NOT EXISTS policy_override jsonb;

COMMENT ON COLUMN public.clinical_intakes.policy_override IS
  'Clinician policy override metadata (override_level/action, reason, created_by, created_at).';
