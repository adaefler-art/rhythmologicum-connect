-- Create table for storing user consent history
CREATE TABLE IF NOT EXISTS public.user_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_version text NOT NULL,
    consented_at timestamptz DEFAULT now() NOT NULL,
    ip_address text,
    user_agent text,
    UNIQUE(user_id, consent_version)
);

-- Indexes for frequent lookups
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consented_at ON public.user_consents(consented_at DESC);

-- Enable Row-Level Security so users only touch their own consents
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consents" ON public.user_consents;

CREATE POLICY "Users can view own consents"
    ON public.user_consents
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own consents" ON public.user_consents;

CREATE POLICY "Users can insert own consents"
    ON public.user_consents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_consents IS 'Versioned consent records for Nutzungsbedingungen approvals.'
