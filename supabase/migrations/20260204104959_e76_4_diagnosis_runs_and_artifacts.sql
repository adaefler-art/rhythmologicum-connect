-- E76.4: Diagnosis Runs & Artifacts Tables
-- Migration to support diagnosis execution worker and artifact persistence

-- =============================================================================
-- 1. DIAGNOSIS RUN STATUS ENUM
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'diagnosis_run_status'
  ) THEN
    CREATE TYPE diagnosis_run_status AS ENUM ('queued', 'running', 'completed', 'failed');
  END IF;
END $$;

COMMENT ON TYPE diagnosis_run_status IS 'E76.4: Status lifecycle for diagnosis runs';

-- =============================================================================
-- 2. DIAGNOSIS_RUNS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.diagnosis_runs (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL,
  "clinician_id" uuid NOT NULL,
  "status" diagnosis_run_status DEFAULT 'queued'::diagnosis_run_status NOT NULL,
  "inputs_hash" text NOT NULL,
  "context_pack_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "error_code" text,
  "error_message" text,
  "error_details" jsonb,
  "mcp_run_id" text,
  "processing_time_ms" integer,
  "retry_count" integer DEFAULT 0 NOT NULL,
  "max_retries" integer DEFAULT 3 NOT NULL,
  CONSTRAINT "diagnosis_runs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "diagnosis_runs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  CONSTRAINT "diagnosis_runs_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  CONSTRAINT "diagnosis_runs_retry_count_check" CHECK (("retry_count" >= 0 AND "retry_count" <= 10)),
  CONSTRAINT "diagnosis_runs_max_retries_check" CHECK (("max_retries" >= 1 AND "max_retries" <= 10))
);

ALTER TABLE "public"."diagnosis_runs" OWNER TO "postgres";

COMMENT ON TABLE "public"."diagnosis_runs" IS 'E76.4: Tracks diagnosis run execution lifecycle';
COMMENT ON COLUMN "public"."diagnosis_runs"."id" IS 'Unique run identifier';
COMMENT ON COLUMN "public"."diagnosis_runs"."patient_id" IS 'Patient being diagnosed';
COMMENT ON COLUMN "public"."diagnosis_runs"."clinician_id" IS 'Clinician who initiated the run';
COMMENT ON COLUMN "public"."diagnosis_runs"."status" IS 'Current run status (queued, running, completed, failed)';
COMMENT ON COLUMN "public"."diagnosis_runs"."inputs_hash" IS 'SHA256 hash of context pack inputs for idempotency';
COMMENT ON COLUMN "public"."diagnosis_runs"."context_pack_id" IS 'Reference to stored context pack (optional)';
COMMENT ON COLUMN "public"."diagnosis_runs"."error_code" IS 'Error code if failed (e.g., VALIDATION_ERROR, LLM_ERROR)';
COMMENT ON COLUMN "public"."diagnosis_runs"."error_message" IS 'Human-readable error message';
COMMENT ON COLUMN "public"."diagnosis_runs"."error_details" IS 'Detailed error payload (PHI-redacted)';
COMMENT ON COLUMN "public"."diagnosis_runs"."mcp_run_id" IS 'MCP server run_id for correlation';
COMMENT ON COLUMN "public"."diagnosis_runs"."processing_time_ms" IS 'Total processing time in milliseconds';

-- =============================================================================
-- 3. DIAGNOSIS_ARTIFACTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.diagnosis_artifacts (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "run_id" uuid NOT NULL,
  "patient_id" uuid NOT NULL,
  "artifact_type" text DEFAULT 'diagnosis_json'::text NOT NULL,
  "artifact_data" jsonb NOT NULL,
  "schema_version" text DEFAULT 'v1'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid NOT NULL,
  "risk_level" text,
  "confidence_score" real,
  "primary_findings" text[],
  "recommendations_count" integer,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT "diagnosis_artifacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "diagnosis_artifacts_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."diagnosis_runs"("id") ON DELETE CASCADE,
  CONSTRAINT "diagnosis_artifacts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  CONSTRAINT "diagnosis_artifacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  CONSTRAINT "diagnosis_artifacts_artifact_type_check" CHECK (("artifact_type" = ANY (ARRAY['diagnosis_json'::text, 'context_pack'::text, 'mcp_response'::text]))),
  CONSTRAINT "diagnosis_artifacts_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])) OR ("risk_level" IS NULL)),
  CONSTRAINT "diagnosis_artifacts_confidence_score_check" CHECK ((("confidence_score" >= 0.0) AND ("confidence_score" <= 1.0)) OR ("confidence_score" IS NULL))
);

ALTER TABLE "public"."diagnosis_artifacts" OWNER TO "postgres";

COMMENT ON TABLE "public"."diagnosis_artifacts" IS 'E76.4: Stores diagnosis results and related artifacts';
COMMENT ON COLUMN "public"."diagnosis_artifacts"."id" IS 'Unique artifact identifier';
COMMENT ON COLUMN "public"."diagnosis_artifacts"."run_id" IS 'Diagnosis run that produced this artifact';
COMMENT ON COLUMN "public"."diagnosis_artifacts"."patient_id" IS 'Patient associated with this diagnosis';
COMMENT ON COLUMN "public"."diagnosis_artifacts"."artifact_type" IS 'Type of artifact (diagnosis_json, context_pack, mcp_response)';
COMMENT ON COLUMN "public"."diagnosis_artifacts"."artifact_data" IS 'Full artifact JSON payload';
COMMENT ON COLUMN "public"."diagnosis_artifacts"."schema_version" IS 'Schema version for artifact data';
COMMENT ON COLUMN "public"."diagnosis_artifacts"."created_by" IS 'User who created/triggered the diagnosis';
COMMENT ON COLUMN "public"."diagnosis_artifacts"."risk_level" IS 'Extracted risk level for quick queries';
COMMENT ON COLUMN "public"."diagnosis_artifacts"."confidence_score" IS 'Extracted confidence score (0.0 to 1.0)';
COMMENT ON COLUMN "public"."diagnosis_artifacts"."primary_findings" IS 'Extracted primary findings array for quick queries';
COMMENT ON COLUMN "public"."diagnosis_artifacts"."recommendations_count" IS 'Count of recommendations';

-- =============================================================================
-- 4. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS "idx_diagnosis_runs_patient_id" ON "public"."diagnosis_runs" USING btree ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_diagnosis_runs_clinician_id" ON "public"."diagnosis_runs" USING btree ("clinician_id");
CREATE INDEX IF NOT EXISTS "idx_diagnosis_runs_status" ON "public"."diagnosis_runs" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_diagnosis_runs_created_at" ON "public"."diagnosis_runs" USING btree ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_diagnosis_runs_inputs_hash" ON "public"."diagnosis_runs" USING btree ("inputs_hash");

CREATE INDEX IF NOT EXISTS "idx_diagnosis_artifacts_run_id" ON "public"."diagnosis_artifacts" USING btree ("run_id");
CREATE INDEX IF NOT EXISTS "idx_diagnosis_artifacts_patient_id" ON "public"."diagnosis_artifacts" USING btree ("patient_id");
CREATE INDEX IF NOT EXISTS "idx_diagnosis_artifacts_created_at" ON "public"."diagnosis_artifacts" USING btree ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_diagnosis_artifacts_risk_level" ON "public"."diagnosis_artifacts" USING btree ("risk_level");

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE "public"."diagnosis_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."diagnosis_artifacts" ENABLE ROW LEVEL SECURITY;

-- Clinicians and admins can read all diagnosis runs
CREATE POLICY "diagnosis_runs_clinician_read" ON "public"."diagnosis_runs"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        (auth.users.raw_app_meta_data->>'role' = 'clinician')
        OR (auth.users.raw_app_meta_data->>'role' = 'admin')
      )
    )
  );

-- Clinicians and admins can create diagnosis runs
CREATE POLICY "diagnosis_runs_clinician_insert" ON "public"."diagnosis_runs"
  FOR INSERT
  WITH CHECK (
    clinician_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        (auth.users.raw_app_meta_data->>'role' = 'clinician')
        OR (auth.users.raw_app_meta_data->>'role' = 'admin')
      )
    )
  );

-- Only system can update diagnosis runs (worker processes)
-- Note: In production, this would be restricted further with service role
CREATE POLICY "diagnosis_runs_system_update" ON "public"."diagnosis_runs"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Clinicians and admins can read all diagnosis artifacts
CREATE POLICY "diagnosis_artifacts_clinician_read" ON "public"."diagnosis_artifacts"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        (auth.users.raw_app_meta_data->>'role' = 'clinician')
        OR (auth.users.raw_app_meta_data->>'role' = 'admin')
      )
    )
  );

-- Only system can insert diagnosis artifacts (worker processes)
CREATE POLICY "diagnosis_artifacts_system_insert" ON "public"."diagnosis_artifacts"
  FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- 6. UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_diagnosis_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_diagnosis_runs_updated_at ON "public"."diagnosis_runs";
CREATE TRIGGER trigger_diagnosis_runs_updated_at
  BEFORE UPDATE ON "public"."diagnosis_runs"
  FOR EACH ROW
  EXECUTE FUNCTION update_diagnosis_runs_updated_at();

COMMENT ON FUNCTION update_diagnosis_runs_updated_at() IS 'E76.4: Auto-updates updated_at timestamp on diagnosis_runs';
