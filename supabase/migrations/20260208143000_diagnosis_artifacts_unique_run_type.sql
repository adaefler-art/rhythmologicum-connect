-- E76.10: Ensure diagnosis artifacts are idempotent per run + type

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uq_diagnosis_artifacts_run_type'
  ) THEN
    CREATE UNIQUE INDEX uq_diagnosis_artifacts_run_type
      ON public.diagnosis_artifacts (run_id, artifact_type);
  END IF;
END $$;
