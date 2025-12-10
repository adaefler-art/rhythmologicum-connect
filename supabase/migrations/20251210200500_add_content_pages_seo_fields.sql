-- F7: Add SEO fields to content_pages table
-- These fields are optional and allow customizing SEO metadata separately from the main content

-- Add seo_title column (optional, overrides title for SEO)
ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS seo_title text;

-- Add seo_description column (optional, overrides excerpt for SEO)
ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS seo_description text;

-- Add comments to document the purpose
COMMENT ON COLUMN public.content_pages.seo_title IS 'Optional SEO title for search engines and social media. If null, falls back to title.';
COMMENT ON COLUMN public.content_pages.seo_description IS 'Optional SEO description for search engines and social media. If null, falls back to excerpt.';
