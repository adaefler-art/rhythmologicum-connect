-- Migration: Prepare auth role for local environments
-- Description: Ensures the 'authenticated' role and auth schema exist before grants
-- Date: 2025-12-07

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_roles WHERE rolname = 'authenticated'
    ) THEN
        CREATE ROLE authenticated;
    END IF;
END
$$ LANGUAGE plpgsql;

CREATE SCHEMA IF NOT EXISTS auth;
