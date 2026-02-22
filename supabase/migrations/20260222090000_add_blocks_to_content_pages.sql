-- CMS E1-05: Persist structured content blocks on content_pages
-- Adds optional JSONB blocks payload for block-first rendering and CMS sync

ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS blocks jsonb;

COMMENT ON COLUMN public.content_pages.blocks IS 'Optional structured CMS blocks payload (JSONB) used for block-first content rendering.';

-- Optional helper index for querying by block type in future admin/reporting queries
CREATE INDEX IF NOT EXISTS idx_content_pages_blocks_gin
ON public.content_pages
USING gin (blocks);
