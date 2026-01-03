-- Migration: Create Documents Storage Bucket
-- Description: Creates a private storage bucket for patient documents with RLS policies
-- Date: 2026-01-03
-- Issue: V05-I04.1

-- =============================================================================
-- SECTION 1: CREATE STORAGE BUCKET
-- =============================================================================

-- Create private documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false, -- Private bucket, requires authentication
    52428800, -- 50 MB limit (50 * 1024 * 1024)
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/heic',
        'image/heif'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/heic',
        'image/heif'
    ];

-- Note: Avoid COMMENT ON TABLE storage.buckets here.
-- In hosted/CI environments, the migration role may not own Supabase-managed storage tables,
-- causing "must be owner of table" failures.

-- =============================================================================
-- SECTION 2: STORAGE RLS POLICIES
-- =============================================================================

-- Policy: Patients can upload documents to their own folders
-- Folder structure: {user_id}/{assessment_id}/{filename}
-- Strict enforcement: EXACTLY matches auth.uid() as first path component
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Patients can upload own documents'
    ) THEN
        CREATE POLICY "Patients can upload own documents"
            ON storage.objects
            FOR INSERT
            TO authenticated
            WITH CHECK (
                bucket_id = 'documents'
                AND (storage.foldername(name))[1] = auth.uid()::text
                AND name NOT LIKE '%../%'  -- Prevent parent directory traversal
                AND name NOT LIKE '../%'   -- Prevent parent directory traversal
                AND name !~ '[\x00-\x1F\x7F]'  -- Prevent control characters
            );
    END IF;
END $$;

-- Policy: Patients can read their own documents
-- Strict enforcement: EXACTLY matches auth.uid() as first path component
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Patients can read own documents'
    ) THEN
        CREATE POLICY "Patients can read own documents"
            ON storage.objects
            FOR SELECT
            TO authenticated
            USING (
                bucket_id = 'documents'
                AND (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;
END $$;

-- Policy: Staff can read org patient documents
-- Staff can read documents for patients in their organization
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Staff can read org patient documents'
    ) THEN
        CREATE POLICY "Staff can read org patient documents"
            ON storage.objects
            FOR SELECT
            TO authenticated
            USING (
                bucket_id = 'documents'
                AND EXISTS (
                    SELECT 1
                    FROM public.user_org_membership uom1
                    JOIN public.user_org_membership uom2 
                        ON uom1.organization_id = uom2.organization_id
                    WHERE uom1.user_id::text = (storage.foldername(name))[1]
                      AND uom2.user_id = auth.uid()
                      AND uom2.is_active = true
                      AND (uom2.role = 'clinician' OR uom2.role = 'nurse' OR uom2.role = 'admin')
                )
            );
    END IF;
END $$;

-- Policy: Patients can delete their own documents (optional - can be restricted if needed)
-- Strict enforcement: EXACTLY matches auth.uid() as first path component
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Patients can delete own documents'
    ) THEN
        CREATE POLICY "Patients can delete own documents"
            ON storage.objects
            FOR DELETE
            TO authenticated
            USING (
                bucket_id = 'documents'
                AND (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;
END $$;
