-- F2: Add category and priority columns to content_pages table
-- Migration to support additional metadata for content management

-- Add category column (replaces layout as a more semantic field name)
ALTER TABLE public.content_pages 
ADD COLUMN IF NOT EXISTS category text;

-- Add priority column for content ordering
ALTER TABLE public.content_pages 
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0 NOT NULL;

-- Create index on priority for efficient sorting
CREATE INDEX IF NOT EXISTS idx_content_pages_priority ON public.content_pages (priority);

-- Add comment for documentation
COMMENT ON COLUMN public.content_pages.category IS 'Content category/type (e.g., info, tutorial, faq)';
COMMENT ON COLUMN public.content_pages.priority IS 'Display priority for ordering content (higher = more important)';
