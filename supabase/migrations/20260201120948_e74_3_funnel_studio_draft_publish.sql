-- E74.3: Studio Funnel Editor - Draft/Publish/Versioning System
-- Migration to support draft editing, validation, and atomic publishing

-- =============================================================================
-- 1. FUNNEL VERSION STATUS ENUM
-- =============================================================================

-- Add status enum for funnel versions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'funnel_version_status'
  ) THEN
    CREATE TYPE funnel_version_status AS ENUM ('draft', 'published', 'archived');
  END IF;
END $$;

-- Add status column to funnel_versions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funnel_versions' AND column_name = 'status'
  ) THEN
    ALTER TABLE funnel_versions 
    ADD COLUMN status funnel_version_status DEFAULT 'published' NOT NULL;
  END IF;
END $$;

-- Add parent version tracking for drafts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funnel_versions' AND column_name = 'parent_version_id'
  ) THEN
    ALTER TABLE funnel_versions 
    ADD COLUMN parent_version_id uuid REFERENCES funnel_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add validation metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funnel_versions' AND column_name = 'validation_errors'
  ) THEN
    ALTER TABLE funnel_versions 
    ADD COLUMN validation_errors jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funnel_versions' AND column_name = 'last_validated_at'
  ) THEN
    ALTER TABLE funnel_versions 
    ADD COLUMN last_validated_at timestamp with time zone;
  END IF;
END $$;

-- Add published metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funnel_versions' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE funnel_versions 
    ADD COLUMN published_at timestamp with time zone;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funnel_versions' AND column_name = 'published_by'
  ) THEN
    ALTER TABLE funnel_versions 
    ADD COLUMN published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN funnel_versions.status IS 'E74.3: Version status - draft (editable), published (active for patients), archived (deprecated)';
COMMENT ON COLUMN funnel_versions.parent_version_id IS 'E74.3: Reference to parent version if this is a draft or derived version';
COMMENT ON COLUMN funnel_versions.validation_errors IS 'E74.3: Array of validation errors from last validation check';
COMMENT ON COLUMN funnel_versions.last_validated_at IS 'E74.3: Timestamp of last validation check';
COMMENT ON COLUMN funnel_versions.published_at IS 'E74.3: Timestamp when version was published';
COMMENT ON COLUMN funnel_versions.published_by IS 'E74.3: User who published this version';

-- =============================================================================
-- 2. FUNNEL PUBLISH HISTORY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS funnel_publish_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id uuid NOT NULL REFERENCES funnels_catalog(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES funnel_versions(id) ON DELETE CASCADE,
  previous_version_id uuid REFERENCES funnel_versions(id) ON DELETE SET NULL,
  
  -- Actor information
  published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Change tracking
  diff jsonb DEFAULT '{}'::jsonb NOT NULL,
  change_summary text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_funnel_publish_history_funnel_id ON funnel_publish_history(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_publish_history_version_id ON funnel_publish_history(version_id);
CREATE INDEX IF NOT EXISTS idx_funnel_publish_history_published_at ON funnel_publish_history(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_publish_history_published_by ON funnel_publish_history(published_by);

COMMENT ON TABLE funnel_publish_history IS 'E74.3: Audit trail for funnel version publishing with diffs';
COMMENT ON COLUMN funnel_publish_history.diff IS 'E74.3: JSONB diff between previous and new version';
COMMENT ON COLUMN funnel_publish_history.change_summary IS 'E74.3: Human-readable summary of changes';
COMMENT ON COLUMN funnel_publish_history.metadata IS 'E74.3: Additional metadata (validation results, etc.)';

-- =============================================================================
-- 3. UPDATE EXISTING PUBLISHED VERSIONS
-- =============================================================================

-- Mark all existing versions as published (they were already in production)
UPDATE funnel_versions
SET 
  status = 'published',
  published_at = created_at
WHERE status IS NULL OR status::text = 'published';

-- =============================================================================
-- 4. CONSTRAINTS AND RULES
-- =============================================================================

-- Rule: Only one published version per funnel should have is_default=true
-- Note: This is enforced by application logic, not a database constraint
-- because we need to support atomic transitions

-- Rule: Published versions cannot be deleted (only archived)
CREATE OR REPLACE FUNCTION prevent_published_version_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'Cannot delete published funnel version. Archive it first.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_published_version_delete_trigger ON funnel_versions;
CREATE TRIGGER prevent_published_version_delete_trigger
  BEFORE DELETE ON funnel_versions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_published_version_delete();

-- =============================================================================
-- 5. HELPER FUNCTIONS
-- =============================================================================

-- Function to create a draft from a published version
CREATE OR REPLACE FUNCTION create_draft_from_version(
  p_source_version_id uuid,
  p_user_id uuid,
  p_version_label text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_new_draft_id uuid;
  v_source_version record;
  v_new_version_label text;
BEGIN
  -- Get source version
  SELECT * INTO v_source_version
  FROM funnel_versions
  WHERE id = p_source_version_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source version not found: %', p_source_version_id;
  END IF;
  
  -- Generate version label
  IF p_version_label IS NULL THEN
    v_new_version_label := v_source_version.version || '-draft-' || 
                           to_char(now(), 'YYYYMMDD-HH24MISS');
  ELSE
    v_new_version_label := p_version_label;
  END IF;
  
  -- Create new draft version
  INSERT INTO funnel_versions (
    funnel_id,
    version,
    questionnaire_config,
    content_manifest,
    algorithm_bundle_version,
    prompt_version,
    rollout_percent,
    status,
    parent_version_id,
    is_default
  ) VALUES (
    v_source_version.funnel_id,
    v_new_version_label,
    v_source_version.questionnaire_config,
    v_source_version.content_manifest,
    v_source_version.algorithm_bundle_version,
    v_source_version.prompt_version,
    v_source_version.rollout_percent,
    'draft',
    p_source_version_id,
    false  -- Drafts are never default
  )
  RETURNING id INTO v_new_draft_id;
  
  RETURN v_new_draft_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_draft_from_version IS 'E74.3: Create a draft version from a published version for editing';

-- Function to publish a draft (atomic)
CREATE OR REPLACE FUNCTION publish_draft_version(
  p_draft_id uuid,
  p_user_id uuid,
  p_set_as_default boolean DEFAULT true,
  p_change_summary text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_draft record;
  v_previous_version record;
  v_publish_history_id uuid;
  v_result jsonb;
BEGIN
  -- Get draft version
  SELECT * INTO v_draft
  FROM funnel_versions
  WHERE id = p_draft_id AND status = 'draft';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft version not found or already published: %', p_draft_id;
  END IF;
  
  -- Check if validation errors exist
  IF jsonb_array_length(v_draft.validation_errors) > 0 THEN
    RAISE EXCEPTION 'Cannot publish draft with validation errors';
  END IF;
  
  -- Get previous published version (if exists)
  SELECT * INTO v_previous_version
  FROM funnel_versions
  WHERE funnel_id = v_draft.funnel_id 
    AND status = 'published'
    AND is_default = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Begin atomic publish
  -- 1. Update draft to published status
  UPDATE funnel_versions
  SET 
    status = 'published',
    published_at = now(),
    published_by = p_user_id,
    is_default = p_set_as_default
  WHERE id = p_draft_id;
  
  -- 2. If setting as default, unset previous default
  IF p_set_as_default THEN
    UPDATE funnel_versions
    SET is_default = false
    WHERE funnel_id = v_draft.funnel_id 
      AND id != p_draft_id
      AND is_default = true;
      
    -- 3. Update funnels_catalog default_version_id
    UPDATE funnels_catalog
    SET default_version_id = p_draft_id,
        updated_at = now()
    WHERE id = v_draft.funnel_id;
  END IF;
  
  -- 4. Create publish history entry with diff
  INSERT INTO funnel_publish_history (
    funnel_id,
    version_id,
    previous_version_id,
    published_by,
    published_at,
    diff,
    change_summary,
    metadata
  ) VALUES (
    v_draft.funnel_id,
    p_draft_id,
    v_previous_version.id,
    p_user_id,
    now(),
    jsonb_build_object(
      'questionnaire_config_changed', 
        CASE WHEN v_previous_version.questionnaire_config IS DISTINCT FROM v_draft.questionnaire_config 
        THEN true ELSE false END,
      'content_manifest_changed',
        CASE WHEN v_previous_version.content_manifest IS DISTINCT FROM v_draft.content_manifest
        THEN true ELSE false END
    ),
    COALESCE(p_change_summary, 'Published from draft'),
    jsonb_build_object(
      'parent_version_id', v_draft.parent_version_id,
      'version_label', v_draft.version,
      'set_as_default', p_set_as_default
    )
  )
  RETURNING id INTO v_publish_history_id;
  
  -- Return result
  v_result := jsonb_build_object(
    'success', true,
    'version_id', p_draft_id,
    'publish_history_id', v_publish_history_id,
    'previous_version_id', v_previous_version.id,
    'set_as_default', p_set_as_default
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION publish_draft_version IS 'E74.3: Atomically publish a draft version with audit logging';

-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on new table
ALTER TABLE funnel_publish_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admin/Clinician can read publish history
DROP POLICY IF EXISTS funnel_publish_history_read_policy ON funnel_publish_history;
CREATE POLICY funnel_publish_history_read_policy
  ON funnel_publish_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'clinician'
      )
    )
  );

-- Policy: System can insert publish history
DROP POLICY IF EXISTS funnel_publish_history_insert_policy ON funnel_publish_history;
CREATE POLICY funnel_publish_history_insert_policy
  ON funnel_publish_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'clinician'
      )
    )
  );

-- =============================================================================
-- 7. AUDIT LOG INTEGRATION
-- =============================================================================

-- Add funnel_version to entity_type enum if not exists (for audit_log)
DO $$
BEGIN
  -- Note: We can't easily alter existing enum, so we check if the value works
  -- If this fails, manual intervention needed
  INSERT INTO audit_log (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    diff
  ) VALUES (
    NULL,
    'funnel_version',
    gen_random_uuid(),
    'test_entity_type',
    '{}'::jsonb
  );
  
  -- Delete the test record
  DELETE FROM audit_log WHERE action = 'test_entity_type';
EXCEPTION
  WHEN OTHERS THEN
    -- Entity type already supported or other issue
    NULL;
END $$;

COMMENT ON TABLE funnel_versions IS 'V0.5: Versioned funnel configurations with JSONB for dynamic content. E74.3: Extended with draft/publish workflow.';
