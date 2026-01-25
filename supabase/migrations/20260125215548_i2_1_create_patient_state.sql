-- I2.1: Canonical Patient State v0.1
-- Migration to create patient_state table for persistent, versioned patient state
-- Epic: I2 - Patient State & Dialog Enhancement

-- Create patient_state table
CREATE TABLE IF NOT EXISTS patient_state (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    patient_state_version text DEFAULT '0.1' NOT NULL,
    state_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT patient_state_pkey PRIMARY KEY (id),
    CONSTRAINT patient_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT patient_state_user_id_unique UNIQUE (user_id)
);

-- Add table owner
ALTER TABLE patient_state OWNER TO postgres;

-- Add table comment
COMMENT ON TABLE patient_state IS 'I2.1: Canonical patient state with versioning. Stores assessment progress, results summary, dialog context, activity, and metrics. RLS: patients see own state only.';

-- Add column comments
COMMENT ON COLUMN patient_state.patient_state_version IS 'Version of patient state schema (e.g., "0.1")';
COMMENT ON COLUMN patient_state.state_data IS 'JSONB containing assessment, results, dialog, activity, and metrics data';

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS patient_state_user_id_idx ON patient_state USING btree (user_id);

-- Enable RLS
ALTER TABLE patient_state ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Patients can view their own state
CREATE POLICY "Patients can view own state" 
ON patient_state 
FOR SELECT 
USING (user_id = auth.uid());

-- RLS Policy: Patients can insert their own state
CREATE POLICY "Patients can insert own state" 
ON patient_state 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- RLS Policy: Patients can update their own state
CREATE POLICY "Patients can update own state" 
ON patient_state 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- RLS Policy: Clinicians can view all patient states
CREATE POLICY "Clinicians can view all patient states" 
ON patient_state 
FOR SELECT 
USING (public.is_clinician());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_patient_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_patient_state_updated_at_trigger
    BEFORE UPDATE ON patient_state
    FOR EACH ROW
    EXECUTE FUNCTION public.update_patient_state_updated_at();
