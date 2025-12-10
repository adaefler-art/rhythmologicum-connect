-- F7: Add SEO fields to content_pages table
-- These fields are optional and allow customizing SEO metadata separately from the main content

-- Add both SEO columns in a single ALTER TABLE statement for efficiency
ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS seo_title text,
ADD COLUMN IF NOT EXISTS seo_description text;

-- Add comments to document the purpose
COMMENT ON COLUMN public.content_pages.seo_title IS 'Optional SEO title for search engines and social media. If null, falls back to title.';
COMMENT ON COLUMN public.content_pages.seo_description IS 'Optional SEO description for search engines and social media. If null, falls back to excerpt.';
