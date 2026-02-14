DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'clinical_intake_review_status'
      AND t.typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.clinical_intake_review_status AS ENUM (
      'draft',
      'in_review',
      'approved',
      'needs_more_info',
      'rejected'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.clinical_intake_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid NOT NULL REFERENCES public.clinical_intakes(id) ON DELETE CASCADE,
  status public.clinical_intake_review_status NOT NULL DEFAULT 'draft',
  review_notes text,
  requested_items jsonb,
  reviewed_by text NOT NULL,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clinical_intake_reviews_intake_id_idx
  ON public.clinical_intake_reviews(intake_id);

CREATE INDEX IF NOT EXISTS clinical_intake_reviews_created_at_idx
  ON public.clinical_intake_reviews(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS clinical_intake_reviews_current_unique
  ON public.clinical_intake_reviews(intake_id)
  WHERE is_current = true;

ALTER TABLE public.clinical_intake_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clinical_intake_reviews'
      AND policyname = 'clinical_intake_reviews_select_clinician_or_owner'
  ) THEN
    CREATE POLICY "clinical_intake_reviews_select_clinician_or_owner"
      ON public.clinical_intake_reviews
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.clinical_intakes ci
          WHERE ci.id = clinical_intake_reviews.intake_id
            AND (
              ci.user_id = auth.uid()
              OR EXISTS (
                SELECT 1
                FROM auth.users au
                WHERE au.id = auth.uid()
                  AND (au.raw_app_meta_data->>'role' IN ('clinician', 'admin'))
              )
            )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clinical_intake_reviews'
      AND policyname = 'clinical_intake_reviews_modify_clinician_admin'
  ) THEN
    CREATE POLICY "clinical_intake_reviews_modify_clinician_admin"
      ON public.clinical_intake_reviews
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM auth.users au
          WHERE au.id = auth.uid()
            AND (au.raw_app_meta_data->>'role' IN ('clinician', 'admin'))
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM auth.users au
          WHERE au.id = auth.uid()
            AND (au.raw_app_meta_data->>'role' IN ('clinician', 'admin'))
        )
      );
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.clinical_intake_reviews TO authenticated;
GRANT ALL ON public.clinical_intake_reviews TO service_role;

CREATE OR REPLACE FUNCTION public.update_clinical_intake_review_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clinical_intake_reviews_update_timestamp ON public.clinical_intake_reviews;
CREATE TRIGGER clinical_intake_reviews_update_timestamp
  BEFORE UPDATE ON public.clinical_intake_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clinical_intake_review_timestamp();
