-- E6.2.4: Idempotency Keys for Mobile Offline/Retry Readiness
-- 
-- Creates infrastructure to support idempotent write operations.
-- Mobile clients can safely retry requests by providing an idempotency key.
-- Double submits with the same key return the same cached response without side effects.

-- Create idempotency_keys table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    
    -- Idempotency key provided by client (UUID format recommended)
    idempotency_key text NOT NULL,
    
    -- User who initiated the request (for security and isolation)
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Endpoint path to scope idempotency keys per endpoint
    endpoint_path text NOT NULL,
    
    -- HTTP method (POST, PUT, etc.)
    http_method text NOT NULL DEFAULT 'POST',
    
    -- Cached response status code
    response_status integer NOT NULL,
    
    -- Cached response body (JSON)
    response_body jsonb NOT NULL,
    
    -- Request payload hash for conflict detection (SHA-256)
    -- If same key is used with different payload, it's a conflict
    request_hash text,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + interval '24 hours') NOT NULL
);

-- Unique constraint: one key per user per endpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_keys_unique 
    ON public.idempotency_keys(user_id, endpoint_path, idempotency_key);

-- Index for cleanup of expired keys
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at 
    ON public.idempotency_keys(expires_at);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup 
    ON public.idempotency_keys(user_id, idempotency_key);

-- Comments
COMMENT ON TABLE public.idempotency_keys IS 'E6.2.4: Stores idempotency keys and cached responses for retry-safe write operations';
COMMENT ON COLUMN public.idempotency_keys.idempotency_key IS 'Client-provided idempotency key (UUID recommended)';
COMMENT ON COLUMN public.idempotency_keys.user_id IS 'User who initiated the request for security isolation';
COMMENT ON COLUMN public.idempotency_keys.endpoint_path IS 'Endpoint path to scope keys (e.g., /api/funnels/stress/assessments)';
COMMENT ON COLUMN public.idempotency_keys.response_status IS 'Cached HTTP status code from original request';
COMMENT ON COLUMN public.idempotency_keys.response_body IS 'Cached response body from original request';
COMMENT ON COLUMN public.idempotency_keys.request_hash IS 'SHA-256 hash of request payload for conflict detection';
COMMENT ON COLUMN public.idempotency_keys.expires_at IS 'Expiration timestamp (default 24 hours from creation)';

-- Row Level Security (RLS)
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Policies (guarded for idempotency)
DO $$
BEGIN
    -- Policy: Users can only see their own idempotency keys
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'idempotency_keys'
          AND policyname = 'idempotency_keys_select_own'
    ) THEN
        CREATE POLICY idempotency_keys_select_own
            ON public.idempotency_keys
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    -- Policy: Users can only insert their own idempotency keys
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'idempotency_keys'
          AND policyname = 'idempotency_keys_insert_own'
    ) THEN
        CREATE POLICY idempotency_keys_insert_own
            ON public.idempotency_keys
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Policy: Clinicians and admins can view all idempotency keys (for debugging)
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'idempotency_keys'
          AND policyname = 'idempotency_keys_select_clinician'
    ) THEN
        CREATE POLICY idempotency_keys_select_clinician
            ON public.idempotency_keys
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE auth.users.id = auth.uid()
                      AND (
                        auth.users.raw_app_meta_data->>'role' = 'clinician'
                        OR auth.users.raw_app_meta_data->>'role' = 'admin'
                      )
                )
            );
    END IF;
END;
$$;

-- Function: Clean up expired idempotency keys
-- This should be called periodically (e.g., via cron job or scheduled function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency_keys()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.idempotency_keys
    WHERE expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_idempotency_keys() IS 'E6.2.4: Deletes expired idempotency keys (should be run periodically)';

-- Grant permissions
GRANT SELECT, INSERT ON public.idempotency_keys TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_idempotency_keys() TO service_role;
