-- Migration: V05-I05.7 - Create Review Records Table
-- Description: Medical QA review queue for flagged jobs + sampling
--              Supports approve/reject workflow with RBAC and audit trail
-- Author: GitHub Copilot
-- Date: 2026-01-04
-- Issue: V05-I05.7

-- ============================================================
-- SECTION 1: CREATE REVIEW STATUS ENUM
-- ============================================================

-- Review status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE public.review_status AS ENUM (
            'PENDING',
            'APPROVED',
            'REJECTED',
            'CHANGES_REQUESTED'
        );
    END IF;
END $$;

COMMENT ON TYPE public.review_status IS 'V05-I05.7: Medical review decision status';

-- ============================================================
-- SECTION 2: CREATE REVIEW_RECORDS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.review_records (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Processing job reference (links to processing_jobs)
    job_id UUID NOT NULL,
    
    -- Review iteration (allows re-review after changes)
    -- Combined with job_id forms unique constraint
    review_iteration INTEGER NOT NULL DEFAULT 1 CHECK (review_iteration >= 1),
    
    -- Review status
    status public.review_status NOT NULL DEFAULT 'PENDING',
    
    -- Queue inclusion reasons (why this job is in the review queue)
    -- Array of reason codes: ['VALIDATION_FAIL', 'SAFETY_BLOCK', 'SAMPLED']
    queue_reasons TEXT[] NOT NULL DEFAULT '{}',
    
    -- Sampling metadata (only if sampled)
    is_sampled BOOLEAN NOT NULL DEFAULT FALSE,
    sampling_hash TEXT,  -- Deterministic hash used for sampling decision
    sampling_config_version TEXT,  -- Version of sampling config used
    
    -- Validation/Safety references (for quick access)
    validation_result_id UUID,  -- FK to medical_validation_results
    safety_check_id UUID,       -- FK to safety_check_results
    
    -- Review decision
    reviewer_user_id UUID,  -- Reference to auth.users (reviewer identity)
    reviewer_role TEXT,     -- Role at time of review (clinician, admin)
    decision_reason_code TEXT,  -- Coded reason (no PHI, e.g., 'APPROVED_SAFE', 'REJECTED_CONTRAINDICATION')
    decision_notes TEXT,    -- Optional redacted notes (max 500 chars, no PHI)
    decided_at TIMESTAMPTZ,
    
    -- Audit trail metadata (PHI-free)
    audit_metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT review_records_job_iteration_unique 
        UNIQUE (job_id, review_iteration),
    
    -- Decision notes max length
    CONSTRAINT review_records_decision_notes_length 
        CHECK (decision_notes IS NULL OR length(decision_notes) <= 500),
    
    -- Reviewer info required when status is not PENDING
    CONSTRAINT review_records_reviewer_required 
        CHECK (
            (status = 'PENDING' AND reviewer_user_id IS NULL) OR
            (status != 'PENDING' AND reviewer_user_id IS NOT NULL)
        )
);

-- Table and column comments
COMMENT ON TABLE public.review_records IS 'V05-I05.7: Medical review queue records with approve/reject workflow';
COMMENT ON COLUMN public.review_records.id IS 'Review record unique identifier';
COMMENT ON COLUMN public.review_records.job_id IS 'Processing job being reviewed';
COMMENT ON COLUMN public.review_records.review_iteration IS 'Review iteration (allows re-review after changes)';
COMMENT ON COLUMN public.review_records.status IS 'Review decision status (PENDING, APPROVED, REJECTED, CHANGES_REQUESTED)';
COMMENT ON COLUMN public.review_records.queue_reasons IS 'Reason codes for queue inclusion (e.g., VALIDATION_FAIL, SAFETY_BLOCK, SAMPLED)';
COMMENT ON COLUMN public.review_records.is_sampled IS 'Whether this job was included via sampling';
COMMENT ON COLUMN public.review_records.sampling_hash IS 'Deterministic hash used for sampling decision';
COMMENT ON COLUMN public.review_records.sampling_config_version IS 'Version of sampling configuration used';
COMMENT ON COLUMN public.review_records.validation_result_id IS 'Reference to medical_validation_results (optional)';
COMMENT ON COLUMN public.review_records.safety_check_id IS 'Reference to safety_check_results (optional)';
COMMENT ON COLUMN public.review_records.reviewer_user_id IS 'User ID of reviewer (no PHI, just reference)';
COMMENT ON COLUMN public.review_records.reviewer_role IS 'Role of reviewer at decision time';
COMMENT ON COLUMN public.review_records.decision_reason_code IS 'Coded reason for decision (no PHI)';
COMMENT ON COLUMN public.review_records.decision_notes IS 'Optional redacted notes (max 500 chars, no PHI)';
COMMENT ON COLUMN public.review_records.decided_at IS 'Timestamp of decision';
COMMENT ON COLUMN public.review_records.audit_metadata IS 'PHI-free audit metadata (JSONB)';

-- ============================================================
-- SECTION 3: CREATE INDEXES
-- ============================================================

-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_review_records_job_id 
    ON public.review_records(job_id);

CREATE INDEX IF NOT EXISTS idx_review_records_status 
    ON public.review_records(status);

-- Queue queries (pending reviews)
CREATE INDEX IF NOT EXISTS idx_review_records_status_created 
    ON public.review_records(status, created_at DESC) 
    WHERE status = 'PENDING';

-- Sampling lookups
CREATE INDEX IF NOT EXISTS idx_review_records_is_sampled 
    ON public.review_records(is_sampled) 
    WHERE is_sampled = TRUE;

-- Reviewer activity
CREATE INDEX IF NOT EXISTS idx_review_records_reviewer 
    ON public.review_records(reviewer_user_id, decided_at DESC) 
    WHERE reviewer_user_id IS NOT NULL;

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_review_records_created_at 
    ON public.review_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_records_decided_at 
    ON public.review_records(decided_at DESC) 
    WHERE decided_at IS NOT NULL;

-- Validation/Safety foreign key lookups
CREATE INDEX IF NOT EXISTS idx_review_records_validation_result_id 
    ON public.review_records(validation_result_id) 
    WHERE validation_result_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_review_records_safety_check_id 
    ON public.review_records(safety_check_id) 
    WHERE safety_check_id IS NOT NULL;

-- ============================================================
-- SECTION 4: CREATE HELPER FUNCTIONS
-- ============================================================

-- Function: Compute deterministic sampling hash
-- Uses SHA-256 hash of (job_id + salt) for stable sampling decisions
CREATE OR REPLACE FUNCTION public.compute_sampling_hash(
    p_job_id UUID,
    p_salt TEXT DEFAULT 'v05-i05-7-default-salt'
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- SHA-256 hash of job_id + salt
    RETURN encode(
        digest(p_job_id::text || p_salt, 'sha256'),
        'hex'
    );
END;
$$;

COMMENT ON FUNCTION public.compute_sampling_hash IS 'V05-I05.7: Compute deterministic sampling hash from job_id + salt';

-- Function: Check if job should be sampled
-- Deterministic: same job_id + config → same result
CREATE OR REPLACE FUNCTION public.should_sample_job(
    p_job_id UUID,
    p_sampling_percentage INTEGER DEFAULT 10,
    p_salt TEXT DEFAULT 'v05-i05-7-default-salt'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_hash TEXT;
    v_hash_int BIGINT;
    v_modulo INTEGER;
BEGIN
    -- Input validation
    IF p_sampling_percentage < 0 OR p_sampling_percentage > 100 THEN
        RAISE EXCEPTION 'Sampling percentage must be between 0 and 100';
    END IF;
    
    -- Edge case: 0% sampling
    IF p_sampling_percentage = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Edge case: 100% sampling
    IF p_sampling_percentage = 100 THEN
        RETURN TRUE;
    END IF;
    
    -- Compute deterministic hash
    v_hash := compute_sampling_hash(p_job_id, p_salt);
    
    -- Convert first 16 hex chars to integer (64-bit)
    -- Take modulo 100 to get 0-99 range
    v_hash_int := ('x' || substring(v_hash, 1, 16))::bit(64)::bigint;
    v_modulo := (v_hash_int % 100)::integer;
    
    -- Include if modulo < percentage
    -- e.g., 10% → include if modulo < 10 (0-9 out of 0-99)
    RETURN v_modulo < p_sampling_percentage;
END;
$$;

COMMENT ON FUNCTION public.should_sample_job IS 'V05-I05.7: Deterministic sampling decision based on hash modulo';

-- ============================================================
-- SECTION 5: CREATE RLS POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE public.review_records ENABLE ROW LEVEL SECURITY;

-- Policy: Clinicians and admins can read all review records
CREATE POLICY review_records_clinician_read 
    ON public.review_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'role' IN ('clinician', 'admin')
        )
    );

-- Policy: Clinicians and admins can insert review records
CREATE POLICY review_records_clinician_insert 
    ON public.review_records
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'role' IN ('clinician', 'admin')
        )
    );

-- Policy: Clinicians and admins can update review records (for approve/reject)
CREATE POLICY review_records_clinician_update 
    ON public.review_records
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'role' IN ('clinician', 'admin')
        )
    );

-- Policy: Service role can do anything (for system operations)
CREATE POLICY review_records_service_all 
    ON public.review_records
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- SECTION 6: CREATE TRIGGERS
-- ============================================================

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_review_records_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_review_records_updated_at
    BEFORE UPDATE ON public.review_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_review_records_updated_at();

-- ============================================================
-- SECTION 7: GRANT PERMISSIONS
-- ============================================================

-- Grant usage on enums
GRANT USAGE ON TYPE public.review_status TO authenticated, service_role;

-- Grant access to table
GRANT SELECT, INSERT, UPDATE ON public.review_records TO authenticated, service_role;

-- Grant access to helper functions
GRANT EXECUTE ON FUNCTION public.compute_sampling_hash TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.should_sample_job TO authenticated, service_role;
