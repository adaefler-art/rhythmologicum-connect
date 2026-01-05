-- V05-I08.2: Create pre_screening_calls table
-- Purpose: Store pre-screening call records for initial patient contact

-- Create pre_screening_calls table
CREATE TABLE IF NOT EXISTS public.pre_screening_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  
  -- Screening results
  is_suitable BOOLEAN NOT NULL,
  suitability_notes TEXT,
  
  -- Red flags
  red_flags JSONB DEFAULT '[]'::jsonb NOT NULL,
  red_flags_notes TEXT,
  
  -- Tier recommendation
  recommended_tier TEXT CHECK (recommended_tier IN ('tier_1', 'tier_2', 'tier_3')),
  tier_notes TEXT,
  
  -- General notes
  general_notes TEXT,
  
  -- Timestamps
  call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Comments
COMMENT ON TABLE public.pre_screening_calls IS 'V05-I08.2: Pre-screening call records for initial patient contact';
COMMENT ON COLUMN public.pre_screening_calls.is_suitable IS 'Whether patient is suitable for the program';
COMMENT ON COLUMN public.pre_screening_calls.red_flags IS 'JSON array of identified red flags';
COMMENT ON COLUMN public.pre_screening_calls.recommended_tier IS 'Recommended program tier (tier_1, tier_2, tier_3)';

-- Indexes
CREATE INDEX idx_pre_screening_calls_patient_id ON public.pre_screening_calls(patient_id);
CREATE INDEX idx_pre_screening_calls_clinician_id ON public.pre_screening_calls(clinician_id);
CREATE INDEX idx_pre_screening_calls_organization_id ON public.pre_screening_calls(organization_id);
CREATE INDEX idx_pre_screening_calls_call_date ON public.pre_screening_calls(call_date DESC);

-- RLS Policies
ALTER TABLE public.pre_screening_calls ENABLE ROW LEVEL SECURITY;

-- Clinicians can view all pre-screening calls in their organization
CREATE POLICY pre_screening_calls_select_staff
  ON public.pre_screening_calls
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'clinician'
        OR auth.users.raw_app_meta_data->>'role' = 'nurse'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Only clinicians and admins can insert pre-screening calls
CREATE POLICY pre_screening_calls_insert_staff
  ON public.pre_screening_calls
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'clinician'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
    AND clinician_id = auth.uid()
  );

-- Only the creator can update their own pre-screening calls
CREATE POLICY pre_screening_calls_update_own
  ON public.pre_screening_calls
  FOR UPDATE
  TO authenticated
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

-- Only admins can delete pre-screening calls
CREATE POLICY pre_screening_calls_delete_admin
  ON public.pre_screening_calls
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_pre_screening_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pre_screening_calls_updated_at
  BEFORE UPDATE ON public.pre_screening_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_pre_screening_calls_updated_at();
