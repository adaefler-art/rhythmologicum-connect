-- Migration: Add Content Flow Mapping Support
-- Description: Extend content_pages table to support mapping into funnels with flow steps
-- Date: 2025-12-12
-- Parent Epic: #208

-- Add flow_step column to content_pages
-- This allows content pages to be associated with a specific step in a funnel flow
ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS flow_step TEXT NULL;

-- Add order_index column to content_pages
-- This allows ordering of content within a specific flow step
ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS order_index INTEGER NULL;

-- Add index on flow_step for efficient lookups
CREATE INDEX IF NOT EXISTS idx_content_pages_flow_step 
ON public.content_pages(flow_step) 
WHERE flow_step IS NOT NULL;

-- Add composite index for funnel_id and flow_step for efficient filtering
CREATE INDEX IF NOT EXISTS idx_content_pages_funnel_flow 
ON public.content_pages(funnel_id, flow_step) 
WHERE funnel_id IS NOT NULL AND flow_step IS NOT NULL;

-- Add index on order_index for sorting within a flow step
CREATE INDEX IF NOT EXISTS idx_content_pages_order_index 
ON public.content_pages(order_index) 
WHERE order_index IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.content_pages.flow_step IS 
'Identifies which step in the funnel flow this content page belongs to (e.g., "intro", "pre-assessment", "post-assessment"). NULL if not part of a specific flow step.';

COMMENT ON COLUMN public.content_pages.order_index IS 
'Determines the display order of content pages within a flow step. Lower numbers appear first. NULL if ordering is not relevant.';
