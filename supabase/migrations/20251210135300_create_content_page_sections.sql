-- F3: Create content_page_sections table
-- Supports 0-n sections per content page with ordering

CREATE TABLE IF NOT EXISTS public.content_page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_page_id uuid NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  title text NOT NULL,
  body_markdown text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient retrieval by content_page_id and order
CREATE INDEX IF NOT EXISTS idx_content_page_sections_page_id_order 
  ON public.content_page_sections (content_page_id, order_index);

-- Unique constraint to prevent duplicate order_index within the same content_page
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_page_sections_unique_order 
  ON public.content_page_sections (content_page_id, order_index);

-- Comments
COMMENT ON TABLE public.content_page_sections IS 'Sections for content pages - supports multi-part pages with ordered sections';
COMMENT ON COLUMN public.content_page_sections.order_index IS 'Order of the section within the content page (0-indexed)';
COMMENT ON COLUMN public.content_page_sections.title IS 'Title of the section';
COMMENT ON COLUMN public.content_page_sections.body_markdown IS 'Markdown content of the section';

-- Enable Row Level Security
ALTER TABLE public.content_page_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users to read published content page sections
CREATE POLICY "Allow read access to published content page sections"
  ON public.content_page_sections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.content_pages
      WHERE content_pages.id = content_page_sections.content_page_id
      AND content_pages.status = 'published'
    )
  );

-- Allow clinicians to read all content page sections (including drafts)
CREATE POLICY "Allow clinicians to read all content page sections"
  ON public.content_page_sections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'clinician'
        OR auth.users.raw_user_meta_data->>'role' = 'clinician'
      )
    )
  );

-- Allow clinicians to insert content page sections
CREATE POLICY "Allow clinicians to insert content page sections"
  ON public.content_page_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'clinician'
        OR auth.users.raw_user_meta_data->>'role' = 'clinician'
      )
    )
  );

-- Allow clinicians to update content page sections
CREATE POLICY "Allow clinicians to update content page sections"
  ON public.content_page_sections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'clinician'
        OR auth.users.raw_user_meta_data->>'role' = 'clinician'
      )
    )
  );

-- Allow clinicians to delete content page sections
CREATE POLICY "Allow clinicians to delete content page sections"
  ON public.content_page_sections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'clinician'
        OR auth.users.raw_user_meta_data->>'role' = 'clinician'
      )
    )
  );
