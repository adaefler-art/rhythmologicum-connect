-- Create table for storing user consents
-- This table tracks user consent to the terms of use for the application

CREATE TABLE IF NOT EXISTS public.user_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_version text NOT NULL,
    consented_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address text,
    user_agent text,

    -- Ensure one consent per user per version (allow re-consent if needed)
    UNIQUE(user_id, consent_version)
);

-- Add index for quick lookups by user_id
CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);

-- Add index for checking latest consent
CREATE INDEX idx_user_consents_consented_at ON public.user_consents(consented_at DESC);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own consents
CREATE POLICY "Users can view own consents"
    ON public.user_consents
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own consents
CREATE POLICY "Users can insert own consents"
    ON public.user_consents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Comment on table