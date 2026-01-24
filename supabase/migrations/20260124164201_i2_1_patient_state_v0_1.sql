-- I2.1: Canonical Patient State v0.1
-- Creates patient_state table for minimal, versioned patient state persistence
-- Supports Dialog/Insights with deterministic reload capability

-- Create patient_state table
CREATE TABLE IF NOT EXISTS "public"."patient_state" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "patient_state_version" text NOT NULL DEFAULT '0.1',
    
    -- Assessment state
    "assessment_last_assessment_id" uuid,
    "assessment_status" text NOT NULL DEFAULT 'not_started',
    "assessment_progress" numeric(3,2) NOT NULL DEFAULT 0 CHECK (assessment_progress >= 0 AND assessment_progress <= 1),
    "assessment_completed_at" timestamp with time zone,
    
    -- Results state
    "results_summary_cards" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "results_recommended_actions" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "results_last_generated_at" timestamp with time zone,
    
    -- Dialog state
    "dialog_last_context" text,
    "dialog_message_count" integer NOT NULL DEFAULT 0,
    "dialog_last_message_at" timestamp with time zone,
    
    -- Activity state
    "activity_recent" jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    -- Metrics state
    "metrics_health_score_current" numeric(5,2),
    "metrics_health_score_delta" numeric(5,2),
    "metrics_key_metrics" jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    -- Metadata
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Ensure one state per user
    CONSTRAINT "patient_state_user_id_unique" UNIQUE ("user_id")
);

-- Add index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS "idx_patient_state_user_id" ON "public"."patient_state" ("user_id");

-- Add index on updated_at for cache invalidation
CREATE INDEX IF NOT EXISTS "idx_patient_state_updated_at" ON "public"."patient_state" ("updated_at");

-- Enable RLS
ALTER TABLE "public"."patient_state" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own state
CREATE POLICY "patient_state_select_policy" ON "public"."patient_state"
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own state
CREATE POLICY "patient_state_insert_policy" ON "public"."patient_state"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own state
CREATE POLICY "patient_state_update_policy" ON "public"."patient_state"
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own state
CREATE POLICY "patient_state_delete_policy" ON "public"."patient_state"
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patient_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_patient_state_updated_at
    BEFORE UPDATE ON "public"."patient_state"
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_state_updated_at();

-- Set table owner
ALTER TABLE "public"."patient_state" OWNER TO "postgres";

-- Add helpful comment
COMMENT ON TABLE "public"."patient_state" IS 'I2.1: Canonical Patient State v0.1 - Minimal, versioned patient state for Dialog/Insights/Dashboard';
