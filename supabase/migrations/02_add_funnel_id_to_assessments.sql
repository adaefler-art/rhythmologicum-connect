-- Idempotent guard: add funnel_id only when assessments exists and column is missing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'assessments'
        AND column_name = 'funnel_id'
    ) THEN
      ALTER TABLE public.assessments
        ADD COLUMN funnel_id uuid REFERENCES public.funnels(id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'assessments'
        AND indexname = 'assessments_funnel_id_idx'
    ) THEN
      CREATE INDEX assessments_funnel_id_idx ON public.assessments (funnel_id);
    END IF;
  END IF;
END $$ LANGUAGE plpgsql;