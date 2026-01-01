-- Test Fixture: Allowed (Canonical) Schema Operations
-- Purpose: Verify linter allows operations on canonical objects
-- Expected: Exit code 0 (all checks passed)

-- Test 1: CREATE TABLE with canonical table
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Test 2: CREATE TYPE with canonical enum
CREATE TYPE public.user_role AS ENUM ('patient', 'clinician', 'nurse', 'admin');

-- Test 3: ALTER TABLE with canonical table
ALTER TABLE public.funnels_catalog ADD COLUMN test_column TEXT;

-- Test 4: Multiple canonical operations
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY,
    assessment_id UUID NOT NULL
);

ALTER TABLE public.patient_profiles ADD COLUMN metadata JSONB;
