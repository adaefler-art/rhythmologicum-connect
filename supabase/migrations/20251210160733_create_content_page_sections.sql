-- F3: Create content_page_sections table
-- Supports 0-n sections per content page with ordering

CREATE TABLE public.content_page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_page_id uuid NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  title text NOT NULL,
  body_markdown text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient lookups by content page
CREATE INDEX idx_content_page_sections_page_id ON public.content_page_sections (content_page_id);

-- Index for ordering sections
CREATE INDEX idx_content_page_sections_order ON public.content_page_sections (content_page_id, order_index);

-- RLS policies
ALTER TABLE public.content_page_sections ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read published sections
-- (clinicians and admins will handle write operations via server-side endpoints)
CREATE POLICY "allow_all_read_sections" ON public.content_page_sections
  FOR SELECT
  USING (true);

COMMENT ON TABLE public.content_page_sections IS 'F3: Sections for multi-part content pages';
COMMENT ON COLUMN public.content_page_sections.order_index IS 'Determines display order of sections (lower = earlier)';
