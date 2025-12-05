-- Committed canonical schema snapshot.
-- This file should be (re)generated after adding/updating migrations by running:
-- ./scripts/generate-schema.sh
-- Commit the resulting schema/schema.sql together with the new migration files.

-- Example table (replace with your actual schema)
CREATE TABLE public.users (
    id uuid NOT NULL,
    email text,
    created_at timestamp with time zone DEFAULT now()
);
