-- Issue 5: Consult Note v1 — Medical Consultation Note Structure + Persistence
-- Creates tables for storing structured medical consultation notes with strict 12-section format
-- Includes versioning support (no in-place edits) and uncertainty profile tracking

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

-- Consultation type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'consultation_type'
      AND t.typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.consultation_type AS ENUM (
      'first',
      'follow_up'
    );
  END IF;
END $$;

COMMENT ON TYPE public.consultation_type IS 'Issue 5: Type of medical consultation (first visit or follow-up)';

-- Uncertainty profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'uncertainty_profile'
      AND t.typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.uncertainty_profile AS ENUM (
      'off',
      'qualitative',
      'mixed'
    );
  END IF;
END $$;

COMMENT ON TYPE public.uncertainty_profile IS 'Issue 5: Uncertainty mode for consult note generation';

-- Assertiveness level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'assertiveness_level'
      AND t.typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.assertiveness_level AS ENUM (
      'conservative',
      'balanced',
      'direct'
    );
  END IF;
END $$;

COMMENT ON TYPE public.assertiveness_level IS 'Issue 5: Assertiveness level for medical statements';

-- Audience type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'audience_type'
      AND t.typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.audience_type AS ENUM (
      'patient',
      'clinician'
    );
  END IF;
END $$;

COMMENT ON TYPE public.audience_type IS 'Issue 5: Target audience for consult note';

-- ============================================================================
-- 2. CONSULT NOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.consult_notes (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Chat session reference (optional, links to amy_chat_messages conversation)
  chat_session_id UUID,
  
  -- Header metadata
  consultation_type public.consultation_type NOT NULL DEFAULT 'first',
  source TEXT NOT NULL DEFAULT 'Patient self-report via PAT',
  guideline_version TEXT,
  
  -- Uncertainty configuration
  uncertainty_profile public.uncertainty_profile NOT NULL DEFAULT 'qualitative',
  assertiveness public.assertiveness_level NOT NULL DEFAULT 'conservative',
  audience public.audience_type NOT NULL DEFAULT 'patient',
  
  -- Structured content (12 sections as JSONB)
  -- Schema: { chiefComplaint, hpi, redFlagsScreening, medicalHistory, medications, objectiveData, problemList, preliminaryAssessment, missingData, nextSteps, handoffSummary }
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Full note as rendered Markdown (for display)
  rendered_markdown TEXT,
  
  -- Versioning
  version_number INTEGER NOT NULL DEFAULT 1,
  
  -- Status
  is_archived BOOLEAN NOT NULL DEFAULT false,
  
  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT consult_notes_version_positive CHECK (version_number > 0),
  CONSTRAINT consult_notes_content_not_empty CHECK (content != '{}'::jsonb)
);

-- Indexes
CREATE INDEX IF NOT EXISTS consult_notes_patient_id_idx ON public.consult_notes(patient_id);
CREATE INDEX IF NOT EXISTS consult_notes_organization_id_idx ON public.consult_notes(organization_id);
CREATE INDEX IF NOT EXISTS consult_notes_created_at_idx ON public.consult_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS consult_notes_chat_session_id_idx ON public.consult_notes(chat_session_id) WHERE chat_session_id IS NOT NULL;

-- Comments
COMMENT ON TABLE public.consult_notes IS 'Issue 5: Medical consultation notes with strict 12-section structure. Versioned, immutable records.';
COMMENT ON COLUMN public.consult_notes.content IS 'Issue 5: Structured JSONB with 12 mandatory sections: chiefComplaint, hpi, redFlagsScreening, medicalHistory, medications, objectiveData, problemList, preliminaryAssessment, missingData, nextSteps, handoffSummary';
COMMENT ON COLUMN public.consult_notes.rendered_markdown IS 'Issue 5: Pre-rendered Markdown for display (generated from content JSONB)';
COMMENT ON COLUMN public.consult_notes.version_number IS 'Issue 5: Version number (increments on each edit, never modified in-place)';
COMMENT ON COLUMN public.consult_notes.chat_session_id IS 'Issue 5: Optional reference to first message in amy_chat_messages conversation';

-- ============================================================================
-- 3. CONSULT NOTE VERSIONS TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.consult_note_versions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to main note
  consult_note_id UUID NOT NULL REFERENCES public.consult_notes(id) ON DELETE CASCADE,
  
  -- Version info
  version_number INTEGER NOT NULL,
  
  -- Snapshot of content at this version
  content JSONB NOT NULL,
  rendered_markdown TEXT,
  
  -- What changed
  change_summary TEXT,
  diff JSONB,
  
  -- Who and when
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT consult_note_versions_version_positive CHECK (version_number > 0),
  CONSTRAINT consult_note_versions_unique_version UNIQUE (consult_note_id, version_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS consult_note_versions_consult_note_id_idx ON public.consult_note_versions(consult_note_id);
CREATE INDEX IF NOT EXISTS consult_note_versions_created_at_idx ON public.consult_note_versions(created_at DESC);

-- Comments
COMMENT ON TABLE public.consult_note_versions IS 'Issue 5: Immutable version history for consult notes. Tracks all edits with diffs.';
COMMENT ON COLUMN public.consult_note_versions.diff IS 'Issue 5: JSON diff of changes from previous version';

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.consult_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consult_note_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Consult Notes: SELECT Policies
-- ============================================================

-- Patients can view their own consult notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consult_notes'
      AND policyname = 'Patients can view own consult notes'
  ) THEN
    CREATE POLICY "Patients can view own consult notes"
      ON public.consult_notes
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.patient_profiles pp
          WHERE pp.id = consult_notes.patient_id
            AND pp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Clinicians can view consult notes for assigned patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consult_notes'
      AND policyname = 'Clinicians can view assigned patient consult notes'
  ) THEN
    CREATE POLICY "Clinicians can view assigned patient consult notes"
      ON public.consult_notes
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.clinician_patient_assignments cpa
          JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
          WHERE cpa.clinician_user_id = auth.uid()
            AND pp.id = consult_notes.patient_id
            AND cpa.organization_id = consult_notes.organization_id
        )
      );
  END IF;
END $$;

-- Admins can view all consult notes in their organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consult_notes'
      AND policyname = 'Admins can view org consult notes'
  ) THEN
    CREATE POLICY "Admins can view org consult notes"
      ON public.consult_notes
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.organizations o
          WHERE o.id = consult_notes.organization_id
            AND o.admin_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================
-- Consult Notes: INSERT Policies
-- ============================================================

-- Only clinicians can create consult notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consult_notes'
      AND policyname = 'Clinicians can create consult notes for assigned patients'
  ) THEN
    CREATE POLICY "Clinicians can create consult notes for assigned patients"
      ON public.consult_notes
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.clinician_patient_assignments cpa
          JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
          WHERE cpa.clinician_user_id = auth.uid()
            AND pp.id = consult_notes.patient_id
            AND cpa.organization_id = consult_notes.organization_id
        )
      );
  END IF;
END $$;

-- Admins can create consult notes in their organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consult_notes'
      AND policyname = 'Admins can create consult notes in org'
  ) THEN
    CREATE POLICY "Admins can create consult notes in org"
      ON public.consult_notes
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organizations o
          WHERE o.id = consult_notes.organization_id
            AND o.admin_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================
-- Consult Notes: UPDATE Policies (Limited - prefer versioning)
-- ============================================================

-- Clinicians can update (archive) consult notes for assigned patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consult_notes'
      AND policyname = 'Clinicians can archive consult notes'
  ) THEN
    CREATE POLICY "Clinicians can archive consult notes"
      ON public.consult_notes
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.clinician_patient_assignments cpa
          JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
          WHERE cpa.clinician_user_id = auth.uid()
            AND pp.id = consult_notes.patient_id
            AND cpa.organization_id = consult_notes.organization_id
        )
      );
  END IF;
END $$;

-- Admins can update consult notes in their organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consult_notes'
      AND policyname = 'Admins can update org consult notes'
  ) THEN
    CREATE POLICY "Admins can update org consult notes"
      ON public.consult_notes
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.organizations o
          WHERE o.id = consult_notes.organization_id
            AND o.admin_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================
-- Consult Note Versions: SELECT Policies
-- ============================================================

-- Patients can view version history of their own consult notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consult_note_versions'
      AND policyname = 'Patients can view own consult note versions'
  ) THEN
    CREATE POLICY "Patients can view own consult note versions"
      ON public.consult_note_versions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.consult_notes cn
          JOIN public.patient_profiles pp ON pp.id = cn.patient_id
          WHERE cn.id = consult_note_versions.consult_note_id
            AND pp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Clinicians can view version history for assigned patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consult_note_versions'
      AND policyname = 'Clinicians can view assigned patient consult note versions'
  ) THEN
    CREATE POLICY "Clinicians can view assigned patient consult note versions"
      ON public.consult_note_versions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.consult_notes cn
          JOIN public.patient_profiles pp ON pp.id = cn.patient_id
          JOIN public.clinician_patient_assignments cpa ON cpa.patient_user_id = pp.user_id
          WHERE cn.id = consult_note_versions.consult_note_id
            AND cpa.clinician_user_id = auth.uid()
            AND cpa.organization_id = cn.organization_id
        )
      );
  END IF;
END $$;

-- Admins can view all version history in their organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consult_note_versions'
      AND policyname = 'Admins can view org consult note versions'
  ) THEN
    CREATE POLICY "Admins can view org consult note versions"
      ON public.consult_note_versions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.consult_notes cn
          JOIN public.organizations o ON o.id = cn.organization_id
          WHERE cn.id = consult_note_versions.consult_note_id
            AND o.admin_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================
-- Consult Note Versions: INSERT Policies
-- ============================================================

-- Service role can insert versions (for automatic versioning trigger)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consult_note_versions'
      AND policyname = 'Service can insert consult note versions'
  ) THEN
    CREATE POLICY "Service can insert consult note versions"
      ON public.consult_note_versions
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 5. TRIGGERS FOR AUTO-VERSIONING
-- ============================================================================

-- Function to create version snapshot when consult note is updated
CREATE OR REPLACE FUNCTION public.create_consult_note_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create version if content actually changed
  IF (TG_OP = 'UPDATE' AND OLD.content IS DISTINCT FROM NEW.content) THEN
    INSERT INTO public.consult_note_versions (
      consult_note_id,
      version_number,
      content,
      rendered_markdown,
      change_summary,
      created_by,
      metadata
    ) VALUES (
      NEW.id,
      OLD.version_number,  -- Save the OLD version before increment
      OLD.content,
      OLD.rendered_markdown,
      'Content updated',
      NEW.updated_by,
      jsonb_build_object(
        'previous_version', OLD.version_number,
        'new_version', NEW.version_number,
        'updated_at', NEW.updated_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-version on updates
CREATE TRIGGER consult_notes_auto_version
  AFTER UPDATE ON public.consult_notes
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION public.create_consult_note_version();

COMMENT ON FUNCTION public.create_consult_note_version() IS 'Issue 5: Automatically creates version snapshot when consult note content is modified';

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_consult_note_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update timestamp
CREATE TRIGGER consult_notes_update_timestamp
  BEFORE UPDATE ON public.consult_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_consult_note_timestamp();

COMMENT ON FUNCTION public.update_consult_note_timestamp() IS 'Issue 5: Automatically updates updated_at timestamp on consult note modifications';

-- ============================================================================
-- 6. GRANTS
-- ============================================================================

-- Grant access to authenticated users (RLS will further restrict)
GRANT SELECT, INSERT, UPDATE ON public.consult_notes TO authenticated;
GRANT SELECT ON public.consult_note_versions TO authenticated;

-- Grant full access to service role
GRANT ALL ON public.consult_notes TO service_role;
GRANT ALL ON public.consult_note_versions TO service_role;
