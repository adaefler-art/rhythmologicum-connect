-- Migration: Add RBAC policies for content page sections
-- Grants and policies to allow admin/clinician to manage sections via user sessions

-- Ensure table exists (for environments that missed the create migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'content_page_sections'
  ) THEN
    CREATE TABLE public.content_page_sections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      content_page_id uuid NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
      title text NOT NULL,
      body_markdown text NOT NULL,
      order_index integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_content_page_sections_page_id ON public.content_page_sections (content_page_id);
    CREATE INDEX idx_content_page_sections_order ON public.content_page_sections (content_page_id, order_index);

    ALTER TABLE public.content_page_sections ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'content_page_sections'
        AND policyname = 'allow_all_read_sections'
    ) THEN
      CREATE POLICY "allow_all_read_sections" ON public.content_page_sections
        FOR SELECT
        USING (true);
    END IF;
  END IF;
END $$;

-- Apply RBAC only when table is present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'content_page_sections'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_page_sections TO authenticated;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'content_page_sections'
        AND policyname = 'allow_admin_clinician_insert_sections'
    ) THEN
      -- For INSERT, only WITH CHECK is allowed; USING is ignored/forbidden
      CREATE POLICY "allow_admin_clinician_insert_sections" ON public.content_page_sections
        FOR INSERT TO authenticated
        WITH CHECK (has_role('admin') OR has_role('clinician'));
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'content_page_sections'
        AND policyname = 'allow_admin_clinician_update_sections'
    ) THEN
      CREATE POLICY "allow_admin_clinician_update_sections" ON public.content_page_sections
        FOR UPDATE TO authenticated
        USING (has_role('admin') OR has_role('clinician'))
        WITH CHECK (has_role('admin') OR has_role('clinician'));
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'content_page_sections'
        AND policyname = 'allow_admin_clinician_delete_sections'
    ) THEN
      CREATE POLICY "allow_admin_clinician_delete_sections" ON public.content_page_sections
        FOR DELETE TO authenticated
        USING (has_role('admin') OR has_role('clinician'));
    END IF;
  ELSE
    RAISE NOTICE 'content_page_sections table missing; skipped RBAC grants/policies';
  END IF;
END $$;
