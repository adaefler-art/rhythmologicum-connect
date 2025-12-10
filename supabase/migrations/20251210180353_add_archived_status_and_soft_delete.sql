-- F4: Add archived status support and optional soft-delete
-- Extends content_pages workflow with draft, published, and archived states
-- Adds deleted_at for soft-delete functionality

-- Update status column to allow 'archived' value
-- Note: PostgreSQL allows text columns to accept any value, but we document the expected values
COMMENT ON COLUMN public.content_pages.status IS 'Content status: draft, published, or archived';

-- Add deleted_at column for soft-delete support
ALTER TABLE public.content_pages 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add index for efficient queries filtering out deleted content
CREATE INDEX IF NOT EXISTS idx_content_pages_deleted_at 
ON public.content_pages (deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Add comment for deleted_at column
COMMENT ON COLUMN public.content_pages.deleted_at IS 'Soft-delete timestamp. When set, content is considered deleted but remains in database';

-- Update the status index to be partial for better performance (exclude archived/deleted)
DROP INDEX IF EXISTS public.content_pages_status_idx;
CREATE INDEX content_pages_status_idx ON public.content_pages (status) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.content_pages IS 'Content pages with status workflow (draft/published/archived) and soft-delete support';
