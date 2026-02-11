-- Issue 10: Clinical Intake Synthesis (CRE-konform)
-- Creates table for storing structured clinical intake data generated from patient conversations

-- Create intake_status enum
CREATE TYPE public.intake_status AS ENUM (
  'draft',
  'active',
  'superseded',
  'archived'
);

COMMENT ON TYPE public.intake_status IS 'Issue 10: Status of clinical intake record';

-- Create clinical_intakes table
CREATE TABLE IF NOT EXISTS public.clinical_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  chat_session_id uuid REFERENCES public.amy_chat_messages(id) ON DELETE SET NULL,
  
  -- Status and version tracking
  status public.intake_status DEFAULT 'draft' NOT NULL,
  version_number integer DEFAULT 1 NOT NULL,
  
  -- STRUCTURED_INTAKE (machine-readable)
  structured_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- CLINICAL_SUMMARY (physician-readable)
  clinical_summary text,
  
  -- Trigger metadata
  trigger_reason text,
  last_updated_from_messages uuid[],
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Audit fields
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  CONSTRAINT clinical_intakes_version_positive CHECK (version_number > 0),
  CONSTRAINT clinical_intakes_structured_data_not_empty CHECK (structured_data <> '{}'::jsonb)
);

ALTER TABLE public.clinical_intakes OWNER TO postgres;

-- Table and column comments
COMMENT ON TABLE public.clinical_intakes IS 'Issue 10: Clinical intake synthesis from patient conversations. Stores both structured data (STRUCTURED_INTAKE) and physician-readable summary (CLINICAL_SUMMARY).';
COMMENT ON COLUMN public.clinical_intakes.user_id IS 'User (patient) this intake belongs to';
COMMENT ON COLUMN public.clinical_intakes.patient_id IS 'Optional patient profile reference';
COMMENT ON COLUMN public.clinical_intakes.chat_session_id IS 'Reference to first message in conversation that triggered this intake';
COMMENT ON COLUMN public.clinical_intakes.structured_data IS 'STRUCTURED_INTAKE: machine-readable JSONB with standardized clinical fields';
COMMENT ON COLUMN public.clinical_intakes.clinical_summary IS 'CLINICAL_SUMMARY: physician-readable narrative summary';
COMMENT ON COLUMN public.clinical_intakes.trigger_reason IS 'Reason for intake update: new_medical_info, clarification, thematic_block_complete, time_based';
COMMENT ON COLUMN public.clinical_intakes.last_updated_from_messages IS 'Array of message IDs that triggered this update';

-- Indexes for efficient queries
CREATE INDEX clinical_intakes_user_id_idx ON public.clinical_intakes(user_id);
CREATE INDEX clinical_intakes_patient_id_idx ON public.clinical_intakes(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX clinical_intakes_organization_id_idx ON public.clinical_intakes(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX clinical_intakes_chat_session_id_idx ON public.clinical_intakes(chat_session_id) WHERE chat_session_id IS NOT NULL;
CREATE INDEX clinical_intakes_status_idx ON public.clinical_intakes(status);
CREATE INDEX clinical_intakes_created_at_idx ON public.clinical_intakes(created_at DESC);
CREATE INDEX clinical_intakes_user_status_idx ON public.clinical_intakes(user_id, status);

-- Enable RLS
ALTER TABLE public.clinical_intakes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Patients can view their own intakes
CREATE POLICY "clinical_intakes_patient_select" 
  ON public.clinical_intakes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Patients can insert their own intakes
CREATE POLICY "clinical_intakes_patient_insert" 
  ON public.clinical_intakes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Patients can update their own draft intakes
CREATE POLICY "clinical_intakes_patient_update" 
  ON public.clinical_intakes 
  FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'draft');

-- Clinicians can view assigned patients' intakes
CREATE POLICY "Clinicians can view assigned patient intakes" 
  ON public.clinical_intakes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.clinician_patient_assignments cpa
      WHERE cpa.clinician_user_id = auth.uid() 
        AND cpa.patient_user_id = clinical_intakes.user_id
    )
  );

-- Admins can view intakes in their organization
CREATE POLICY "Admins can view org intakes" 
  ON public.clinical_intakes 
  FOR SELECT 
  USING (
    organization_id IS NOT NULL 
    AND public.current_user_role(organization_id) = 'admin'::public.user_role
  );

-- Grants
GRANT ALL ON TABLE public.clinical_intakes TO anon;
GRANT ALL ON TABLE public.clinical_intakes TO authenticated;
GRANT ALL ON TABLE public.clinical_intakes TO service_role;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_clinical_intake_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp updates
CREATE TRIGGER clinical_intakes_update_timestamp
  BEFORE UPDATE ON public.clinical_intakes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clinical_intake_timestamp();
