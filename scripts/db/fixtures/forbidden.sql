-- Test Fixture: Forbidden (Non-Canonical) Schema Operations
-- Purpose: Verify linter blocks operations on non-canonical objects
-- Expected: Exit code 1 (non-canonical objects detected)

-- Line 6: Non-canonical table creation (should fail)
CREATE TABLE public.fantasy_table (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL
);

-- Line 12: Non-canonical enum creation (should fail)
CREATE TYPE public.fake_status AS ENUM ('active', 'inactive');

-- Line 15: ALTER TABLE on non-canonical table (should fail)
ALTER TABLE public.non_existent_table ADD COLUMN x TEXT;

-- Line 18: Multiple violations
CREATE TABLE public.another_fake_table (
    id UUID PRIMARY KEY
);

ALTER TABLE public.yet_another_fake ADD COLUMN y INTEGER;
