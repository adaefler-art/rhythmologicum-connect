-- V0.4-E3: Add CONTENT_PAGE node type support to funnel engine
-- 
-- This migration enables content pages to be integrated into funnel flows
-- as first-class steps that can appear before, between, or after question blocks.

-- 1. Add content_page_id column to funnel_steps
-- This allows a step to reference a content page directly
ALTER TABLE public.funnel_steps
ADD COLUMN content_page_id UUID NULL
REFERENCES public.content_pages(id) ON DELETE SET NULL;

-- 2. Create index for content page lookups
CREATE INDEX funnel_steps_content_page_id_idx 
ON public.funnel_steps(content_page_id) 
WHERE content_page_id IS NOT NULL;

-- 3. Add CHECK constraint to ensure content_page steps have content_page_id
-- and non-content steps don't have content_page_id
ALTER TABLE public.funnel_steps
ADD CONSTRAINT funnel_steps_content_page_consistency 
CHECK (
  (type = 'content_page' AND content_page_id IS NOT NULL) OR
  (type != 'content_page' AND content_page_id IS NULL)
);

-- 4. Add comment for documentation
COMMENT ON COLUMN public.funnel_steps.content_page_id IS 
'References a content page when step type is "content_page". Must be NULL for other step types.';

-- Note: We're not removing the existing funnel_id column from content_pages
-- because it's still used for categorizing content (intro, info, result pages)
-- that appear outside the main funnel flow (e.g., on start/result pages).
