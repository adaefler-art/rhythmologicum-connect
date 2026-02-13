


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'V0.5 RLS policies implemented: tenant-isolated access with patient/clinician/nurse/admin roles';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."assertiveness_level" AS ENUM (
    'conservative',
    'balanced',
    'direct'
);


ALTER TYPE "public"."assertiveness_level" OWNER TO "postgres";


COMMENT ON TYPE "public"."assertiveness_level" IS 'Issue 5: Assertiveness level for medical statements';



CREATE TYPE "public"."assessment_state" AS ENUM (
    'draft',
    'in_progress',
    'completed',
    'archived'
);


ALTER TYPE "public"."assessment_state" OWNER TO "postgres";


CREATE TYPE "public"."assessment_status" AS ENUM (
    'in_progress',
    'completed'
);


ALTER TYPE "public"."assessment_status" OWNER TO "postgres";


CREATE TYPE "public"."audience_type" AS ENUM (
    'patient',
    'clinician'
);


ALTER TYPE "public"."audience_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."audience_type" IS 'Issue 5: Target audience for consult note';



CREATE TYPE "public"."consultation_type" AS ENUM (
    'first',
    'follow_up'
);


ALTER TYPE "public"."consultation_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."consultation_type" IS 'Issue 5: Type of medical consultation (first visit or follow-up)';



CREATE TYPE "public"."diagnosis_run_status" AS ENUM (
    'queued',
    'running',
    'completed',
    'failed'
);


ALTER TYPE "public"."diagnosis_run_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."diagnosis_run_status" IS 'E76.4: Status lifecycle for diagnosis runs';



CREATE TYPE "public"."funnel_version_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."funnel_version_status" OWNER TO "postgres";


CREATE TYPE "public"."intake_status" AS ENUM (
    'draft',
    'active',
    'superseded',
    'archived'
);


ALTER TYPE "public"."intake_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."intake_status" IS 'Issue 10: Status of clinical intake record';



CREATE TYPE "public"."notification_status" AS ENUM (
    'scheduled',
    'sent',
    'failed',
    'cancelled',
    'PENDING',
    'SENT',
    'DELIVERED',
    'READ',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE "public"."notification_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."notification_status" IS 'V05-I05.9: Notification delivery status';



CREATE TYPE "public"."onboarding_status_enum" AS ENUM (
    'not_started',
    'in_progress',
    'completed'
);


ALTER TYPE "public"."onboarding_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."parsing_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'partial'
);


ALTER TYPE "public"."parsing_status" OWNER TO "postgres";


CREATE TYPE "public"."pilot_event_type" AS ENUM (
    'TRIAGE_SUBMITTED',
    'TRIAGE_ROUTED',
    'FUNNEL_STARTED',
    'FUNNEL_RESUMED',
    'FUNNEL_COMPLETED',
    'WORKUP_STARTED',
    'WORKUP_NEEDS_MORE_DATA',
    'WORKUP_READY_FOR_REVIEW',
    'ESCALATION_OFFER_SHOWN',
    'ESCALATION_OFFER_CLICKED'
);


ALTER TYPE "public"."pilot_event_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."pilot_event_type" IS 'E6.4.8: Event types for pilot flow state transitions';



CREATE TYPE "public"."processing_stage" AS ENUM (
    'pending',
    'risk',
    'ranking',
    'content',
    'validation',
    'review',
    'pdf',
    'delivery',
    'completed',
    'failed',
    'report_generated'
);


ALTER TYPE "public"."processing_stage" OWNER TO "postgres";


COMMENT ON TYPE "public"."processing_stage" IS 'V05-I05.1: Processing pipeline stages (deterministic order)';



CREATE TYPE "public"."processing_status" AS ENUM (
    'queued',
    'in_progress',
    'completed',
    'failed'
);


ALTER TYPE "public"."processing_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."processing_status" IS 'V05-I05.1: Overall processing job status';



CREATE TYPE "public"."report_status" AS ENUM (
    'pending',
    'generating',
    'completed',
    'failed'
);


ALTER TYPE "public"."report_status" OWNER TO "postgres";


CREATE TYPE "public"."review_status" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CHANGES_REQUESTED'
);


ALTER TYPE "public"."review_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."review_status" IS 'V05-I05.7: Medical review decision status';



CREATE TYPE "public"."safety_action" AS ENUM (
    'PASS',
    'FLAG',
    'BLOCK',
    'UNKNOWN'
);


ALTER TYPE "public"."safety_action" OWNER TO "postgres";


COMMENT ON TYPE "public"."safety_action" IS 'V05-I05.6: Safety check recommended action';



CREATE TYPE "public"."shipment_status" AS ENUM (
    'ordered',
    'shipped',
    'in_transit',
    'delivered',
    'returned',
    'cancelled'
);


ALTER TYPE "public"."shipment_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."shipment_status" IS 'V05-I08.3: Device shipment lifecycle status';



CREATE TYPE "public"."support_case_category" AS ENUM (
    'technical',
    'medical',
    'administrative',
    'billing',
    'general',
    'other'
);


ALTER TYPE "public"."support_case_category" OWNER TO "postgres";


COMMENT ON TYPE "public"."support_case_category" IS 'V05-I08.4: Category of a support case';



CREATE TYPE "public"."support_case_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."support_case_priority" OWNER TO "postgres";


COMMENT ON TYPE "public"."support_case_priority" IS 'V05-I08.4: Priority level of a support case';



CREATE TYPE "public"."support_case_status" AS ENUM (
    'open',
    'in_progress',
    'escalated',
    'resolved',
    'closed'
);


ALTER TYPE "public"."support_case_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."support_case_status" IS 'V05-I08.4: Status of a support case';



CREATE TYPE "public"."task_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."triage_action_type" AS ENUM (
    'acknowledge',
    'snooze',
    'close',
    'reopen',
    'manual_flag',
    'clear_manual_flag',
    'add_note'
);


ALTER TYPE "public"."triage_action_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."triage_action_type" IS 'E78.4: Types of HITL actions that can be taken on triage cases';



CREATE TYPE "public"."uncertainty_profile" AS ENUM (
    'off',
    'qualitative',
    'mixed'
);


ALTER TYPE "public"."uncertainty_profile" OWNER TO "postgres";


COMMENT ON TYPE "public"."uncertainty_profile" IS 'Issue 5: Uncertainty mode for consult note generation';



CREATE TYPE "public"."user_role" AS ENUM (
    'patient',
    'clinician',
    'nurse',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."validation_status" AS ENUM (
    'pass',
    'flag',
    'fail'
);


ALTER TYPE "public"."validation_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."validation_status" IS 'V05-I05.5: Medical validation overall status';



CREATE TYPE "public"."workup_status" AS ENUM (
    'needs_more_data',
    'ready_for_review'
);


ALTER TYPE "public"."workup_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."workup_status" IS 'E6.4.4: Workup status for assessments - indicates if more data is needed or if ready for clinician review';



CREATE OR REPLACE FUNCTION "public"."anamnesis_entry_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (
            actor_user_id,
            entity_type,
            entity_id,
            action,
            org_id,
            source,
            metadata
        ) VALUES (
            COALESCE(NEW.created_by, auth.uid()),
            'anamnesis_entry',
            NEW.id,
            'created',
            NEW.organization_id,
            'api',
            jsonb_build_object(
                'patient_id', NEW.patient_id,
                'entry_type', NEW.entry_type,
                'title', NEW.title
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (
            actor_user_id,
            entity_type,
            entity_id,
            action,
            diff,
            org_id,
            source,
            metadata
        ) VALUES (
            COALESCE(NEW.updated_by, auth.uid()),
            'anamnesis_entry',
            NEW.id,
            'updated',
            jsonb_build_object(
                'before', jsonb_build_object('title', OLD.title, 'content', OLD.content),
                'after', jsonb_build_object('title', NEW.title, 'content', NEW.content)
            ),
            NEW.organization_id,
            'api',
            jsonb_build_object(
                'patient_id', NEW.patient_id,
                'entry_type', NEW.entry_type
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (
            actor_user_id,
            entity_type,
            entity_id,
            action,
            org_id,
            source,
            metadata
        ) VALUES (
            auth.uid(),
            'anamnesis_entry',
            OLD.id,
            'deleted',
            OLD.organization_id,
            'api',
            jsonb_build_object(
                'patient_id', OLD.patient_id,
                'entry_type', OLD.entry_type,
                'title', OLD.title
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."anamnesis_entry_audit_log"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."anamnesis_entry_audit_log"() IS 'E75.1: Auto-log anamnesis_entry changes to audit_log table';



CREATE OR REPLACE FUNCTION "public"."anamnesis_entry_create_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_version_number INTEGER;
    v_previous_content JSONB;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM public.anamnesis_entry_versions
    WHERE entry_id = NEW.id;

    -- Get previous content for diff calculation
    IF TG_OP = 'UPDATE' THEN
        SELECT content INTO v_previous_content
        FROM public.anamnesis_entry_versions
        WHERE entry_id = NEW.id
        ORDER BY version_number DESC
        LIMIT 1;

        -- If no previous version, use OLD content
        IF v_previous_content IS NULL THEN
            v_previous_content := OLD.content;
        END IF;
    ELSE
        v_previous_content := NULL;
    END IF;

    -- Insert version record
    INSERT INTO public.anamnesis_entry_versions (
        entry_id,
        version_number,
        title,
        content,
        entry_type,
        tags,
        changed_by,
        changed_at,
        diff
    ) VALUES (
        NEW.id,
        v_version_number,
        NEW.title,
        NEW.content,
        NEW.entry_type,
        NEW.tags,
        COALESCE(NEW.updated_by, NEW.created_by, auth.uid()),
        NOW(),
        CASE
            WHEN v_previous_content IS NOT NULL THEN
                jsonb_build_object(
                    'from', v_previous_content,
                    'to', NEW.content
                )
            ELSE NULL
        END
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."anamnesis_entry_create_version"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."anamnesis_entry_create_version"() IS 'E75.1: Auto-create immutable version record on anamnesis_entry insert/update';



CREATE OR REPLACE FUNCTION "public"."audit_kpi_thresholds"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, changed_by
    ) VALUES (
      'kpi_thresholds',
      OLD.id,
      TG_OP,
      to_jsonb(OLD),
      OLD.updated_by
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, new_values, changed_by
    ) VALUES (
      'kpi_thresholds',
      NEW.id,
      TG_OP,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.updated_by
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, new_values, changed_by
    ) VALUES (
      'kpi_thresholds',
      NEW.id,
      TG_OP,
      to_jsonb(NEW),
      NEW.created_by
    );
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."audit_kpi_thresholds"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_notification_templates"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, changed_by
    ) VALUES (
      'notification_templates',
      OLD.id,
      TG_OP,
      to_jsonb(OLD),
      OLD.updated_by
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, new_values, changed_by
    ) VALUES (
      'notification_templates',
      NEW.id,
      TG_OP,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.updated_by
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, new_values, changed_by
    ) VALUES (
      'notification_templates',
      NEW.id,
      TG_OP,
      to_jsonb(NEW),
      NEW.created_by
    );
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."audit_notification_templates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_patient_funnels_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_diff JSONB;
  v_action TEXT;
  v_org_id UUID;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'assigned';
    v_diff := jsonb_build_object(
      'funnel_id', NEW.funnel_id,
      'active_version_id', NEW.active_version_id,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Build diff object with only changed fields
    v_diff := '{}'::jsonb;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_diff := v_diff || jsonb_build_object(
        'status', jsonb_build_object('old', OLD.status, 'new', NEW.status)
      );
      v_action := 'status_changed';
    END IF;
    
    IF OLD.active_version_id IS DISTINCT FROM NEW.active_version_id THEN
      v_diff := v_diff || jsonb_build_object(
        'active_version_id', jsonb_build_object('old', OLD.active_version_id, 'new', NEW.active_version_id)
      );
      v_action := COALESCE(v_action, 'version_changed');
    END IF;
    
    IF OLD.completed_at IS DISTINCT FROM NEW.completed_at THEN
      v_diff := v_diff || jsonb_build_object(
        'completed_at', jsonb_build_object('old', OLD.completed_at, 'new', NEW.completed_at)
      );
      v_action := COALESCE(v_action, 'completed');
    END IF;
    
    -- Default action if no specific change detected
    IF v_action IS NULL THEN
      v_action := 'updated';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_diff := jsonb_build_object(
      'funnel_id', OLD.funnel_id,
      'status', OLD.status
    );
  END IF;

  -- Get org_id from patient profile
  SELECT uom.organization_id INTO v_org_id
  FROM "public"."patient_profiles" pp
  JOIN "public"."user_org_membership" uom ON pp.user_id = uom.user_id
  WHERE pp.id = COALESCE(NEW.patient_id, OLD.patient_id)
  AND uom.is_active = true
  LIMIT 1;

  -- Insert audit log entry
  INSERT INTO "public"."audit_log" (
    actor_user_id,
    actor_role,
    entity_type,
    entity_id,
    action,
    diff,
    org_id,
    source,
    metadata
  ) VALUES (
    auth.uid(),
    (SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()),
    'patient_funnel',
    COALESCE(NEW.id, OLD.id),
    v_action,
    v_diff,
    v_org_id,
    'api',
    jsonb_build_object(
      'patient_id', COALESCE(NEW.patient_id, OLD.patient_id),
      'funnel_id', COALESCE(NEW.funnel_id, OLD.funnel_id)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_patient_funnels_changes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."audit_patient_funnels_changes"() IS 'E74.6: Audit logging for patient_funnels lifecycle changes';



CREATE OR REPLACE FUNCTION "public"."audit_reassessment_rules"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, changed_by
    ) VALUES (
      'reassessment_rules',
      OLD.id,
      TG_OP,
      to_jsonb(OLD),
      OLD.updated_by
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, new_values, changed_by
    ) VALUES (
      'reassessment_rules',
      NEW.id,
      TG_OP,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.updated_by
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, new_values, changed_by
    ) VALUES (
      'reassessment_rules',
      NEW.id,
      TG_OP,
      to_jsonb(NEW),
      NEW.created_by
    );
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."audit_reassessment_rules"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_staff_see_patient_profile"("staff_user_id" "uuid", "patient_profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  patient_user_id uuid;
BEGIN
  IF staff_user_id IS NULL OR patient_profile_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT user_id
    INTO patient_user_id
    FROM public.patient_profiles
   WHERE id = patient_profile_id;

  IF patient_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
      FROM public.user_org_membership uom_patient
      JOIN public.user_org_membership uom_staff
        ON uom_staff.organization_id = uom_patient.organization_id
       AND uom_staff.user_id = staff_user_id
       AND uom_staff.is_active = true
       AND uom_staff.role IN (
         'admin'::public.user_role,
         'clinician'::public.user_role,
         'nurse'::public.user_role
       )
     WHERE uom_patient.user_id = patient_user_id
       AND uom_patient.is_active = true
  );
END;
$$;


ALTER FUNCTION "public"."can_staff_see_patient_profile"("staff_user_id" "uuid", "patient_profile_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_staff_see_patient_profile"("staff_user_id" "uuid", "patient_profile_id" "uuid") IS 'V0.5: Returns true if staff shares an active organization membership with the patient profile owner';



CREATE OR REPLACE FUNCTION "public"."cancel_account_deletion"("target_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
  was_pending BOOLEAN;
BEGIN
  -- Check if deletion was pending
  SELECT (raw_user_meta_data->>'account_status') = 'deletion_pending'
  INTO was_pending
  FROM auth.users
  WHERE id = target_user_id;
  
  IF NOT was_pending THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'No pending deletion request found'
    );
  END IF;
  
  -- Clear deletion metadata and restore active status
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'deletion_cancelled_at', NOW()::TEXT,
    'account_status', 'active'
  ) - 'deletion_requested_at' - 'deletion_scheduled_for' - 'deletion_reason'
  WHERE id = target_user_id;
  
  result := jsonb_build_object(
    'success', TRUE,
    'user_id', target_user_id,
    'cancelled_at', NOW(),
    'account_status', 'active'
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."cancel_account_deletion"("target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cancel_account_deletion"("target_user_id" "uuid") IS 'V05-I10.2: Cancels pending account deletion request and restores active status.';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_idempotency_keys"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.idempotency_keys
    WHERE expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_idempotency_keys"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_expired_idempotency_keys"() IS 'E6.2.4: Deletes expired idempotency keys (should be run periodically)';



CREATE OR REPLACE FUNCTION "public"."compute_inputs_hash"("p_inputs" "jsonb") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    v_canonical_json TEXT;
BEGIN
    -- Normalize JSONB to canonical form and compute SHA256
    -- Sort keys to ensure consistent hash for same inputs
    v_canonical_json := p_inputs::TEXT;
    RETURN encode(digest(v_canonical_json, 'sha256'), 'hex');
END;
$$;


ALTER FUNCTION "public"."compute_inputs_hash"("p_inputs" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."compute_inputs_hash"("p_inputs" "jsonb") IS 'V05-I01.3: Compute SHA256 hash of normalized inputs for equivalence detection';



CREATE OR REPLACE FUNCTION "public"."compute_safety_evaluation_key_hash"("p_sections_id" "uuid", "p_prompt_version" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN encode(
        digest(
            p_sections_id::TEXT || '|' || p_prompt_version,
            'sha256'
        ),
        'hex'
    );
END;
$$;


ALTER FUNCTION "public"."compute_safety_evaluation_key_hash"("p_sections_id" "uuid", "p_prompt_version" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."compute_safety_evaluation_key_hash"("p_sections_id" "uuid", "p_prompt_version" "text") IS 'V05-I05.6: Compute hash for idempotent safety evaluations';



CREATE OR REPLACE FUNCTION "public"."compute_sampling_hash"("p_job_id" "uuid", "p_salt" "text" DEFAULT 'v05-i05-7-default-salt'::"text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    -- SHA-256 hash of job_id + salt
    RETURN encode(
        digest(p_job_id::text || p_salt, 'sha256'),
        'hex'
    );
END;
$$;


ALTER FUNCTION "public"."compute_sampling_hash"("p_job_id" "uuid", "p_salt" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."compute_sampling_hash"("p_job_id" "uuid", "p_salt" "text") IS 'V05-I05.7: Compute deterministic sampling hash from job_id + salt';



CREATE OR REPLACE FUNCTION "public"."create_consult_note_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."create_consult_note_version"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_consult_note_version"() IS 'Issue 5: Automatically creates version snapshot when consult note content is modified';



CREATE OR REPLACE FUNCTION "public"."create_draft_from_version"("p_source_version_id" "uuid", "p_user_id" "uuid", "p_version_label" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."create_draft_from_version"("p_source_version_id" "uuid", "p_user_id" "uuid", "p_version_label" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_draft_from_version"("p_source_version_id" "uuid", "p_user_id" "uuid", "p_version_label" "text") IS 'E74.3: Create a draft version from a published version for editing';



CREATE OR REPLACE FUNCTION "public"."create_shipment_status_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Only create event if status actually changed
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.shipment_events (
            shipment_id,
            created_by_user_id,
            event_type,
            event_status,
            event_description,
            event_at
        ) VALUES (
            NEW.id,
            auth.uid(),
            'status_changed',
            NEW.status,
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_shipment_status_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"("org_id" "uuid") RETURNS "public"."user_role"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    user_role public.user_role;
BEGIN
    SELECT role
    INTO user_role
    FROM public.user_org_membership
    WHERE user_id = auth.uid() 
      AND organization_id = org_id
      AND is_active = true
    LIMIT 1;
    
    RETURN user_role;
END;
$$;


ALTER FUNCTION "public"."current_user_role"("org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."current_user_role"("org_id" "uuid") IS 'V0.5: Returns user role in specified organization';



CREATE OR REPLACE FUNCTION "public"."diagnosis_artifacts_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_action TEXT;
  v_metadata JSONB := '{}'::jsonb;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_metadata := jsonb_build_object(
      'artifact_type', NEW.artifact_type,
      'schema_version', NEW.schema_version,
      'risk_level', NEW.risk_level,
      'confidence_score', NEW.confidence_score,
      'run_id', NEW.run_id,
      'patient_id', NEW.patient_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_metadata := jsonb_build_object(
      'artifact_type', NEW.artifact_type,
      'risk_level', NEW.risk_level
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_metadata := jsonb_build_object(
      'artifact_type', OLD.artifact_type,
      'patient_id', OLD.patient_id
    );
  END IF;

  -- Insert audit log entry
  INSERT INTO public.audit_log (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    source,
    metadata,
    org_id
  ) VALUES (
    COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.created_by ELSE NEW.created_by END,
      auth.uid()
    ),
    'diagnosis_artifact',
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    v_action,
    'system',  -- System-driven creation by worker
    v_metadata,
    NULL  -- No org_id on diagnosis_artifacts
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."diagnosis_artifacts_audit_log"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."diagnosis_artifacts_audit_log"() IS 'E76.7: Audit trigger for diagnosis_artifacts lifecycle events (created, updated, deleted)';



CREATE OR REPLACE FUNCTION "public"."diagnosis_runs_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_action TEXT;
  v_diff JSONB := '{}'::jsonb;
  v_metadata JSONB := '{}'::jsonb;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_metadata := jsonb_build_object(
      'status', NEW.status,
      'inputs_hash', NEW.inputs_hash,
      'patient_id', NEW.patient_id,
      'clinician_id', NEW.clinician_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status transitions
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action := 'status_changed';
      v_diff := jsonb_build_object(
        'before', jsonb_build_object('status', OLD.status),
        'after', jsonb_build_object('status', NEW.status)
      );
      v_metadata := jsonb_build_object(
        'status_from', OLD.status,
        'status_to', NEW.status,
        'processing_time_ms', NEW.processing_time_ms,
        'error_code', NEW.error_code
      );
    ELSIF OLD.error_code IS NULL AND NEW.error_code IS NOT NULL THEN
      v_action := 'failed';
      v_metadata := jsonb_build_object(
        'error_code', NEW.error_code,
        'retry_count', NEW.retry_count
      );
    ELSE
      -- Generic update (started_at, completed_at changes)
      v_action := 'updated';
      v_metadata := jsonb_build_object(
        'status', NEW.status,
        'processing_time_ms', NEW.processing_time_ms
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_metadata := jsonb_build_object(
      'status', OLD.status,
      'patient_id', OLD.patient_id
    );
  END IF;

  -- Insert audit log entry
  INSERT INTO public.audit_log (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    source,
    diff,
    metadata,
    org_id
  ) VALUES (
    COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.clinician_id ELSE NEW.clinician_id END,
      auth.uid()
    ),
    'diagnosis_run',
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    v_action,
    'system',  -- System-driven updates by worker
    v_diff,
    v_metadata,
    NULL  -- No org_id on diagnosis_runs (could be added in future)
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."diagnosis_runs_audit_log"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."diagnosis_runs_audit_log"() IS 'E76.7: Audit trigger for diagnosis_runs lifecycle events (created, status_changed, failed, deleted)';



CREATE OR REPLACE FUNCTION "public"."diagnostics_pillars_sot"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  result jsonb;
  pillars_info jsonb;
  catalog_info jsonb;
  versions_info jsonb;
BEGIN
  -- Check pillars table
  SELECT jsonb_build_object(
    'exists', EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'pillars'),
    'relkind', COALESCE((SELECT c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'pillars'), ''),
    'relrowsecurity', COALESCE((SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'pillars'), false),
    'policyCount', COALESCE((SELECT COUNT(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pillars'), 0),
    'rowCount', COALESCE((SELECT COUNT(*)::int FROM public.pillars), 0)
  ) INTO pillars_info;

  -- Check funnels_catalog table
  SELECT jsonb_build_object(
    'exists', EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnels_catalog'),
    'relkind', COALESCE((SELECT c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnels_catalog'), ''),
    'relrowsecurity', COALESCE((SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnels_catalog'), false),
    'policyCount', COALESCE((SELECT COUNT(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'funnels_catalog'), 0),
    'rowCount', COALESCE((SELECT COUNT(*)::int FROM public.funnels_catalog), 0),
    'stressFunnelExists', EXISTS(SELECT 1 FROM public.funnels_catalog WHERE slug = 'stress-assessment')
  ) INTO catalog_info;

  -- Check funnel_versions table
  SELECT jsonb_build_object(
    'exists', EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnel_versions'),
    'relkind', COALESCE((SELECT c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnel_versions'), ''),
    'relrowsecurity', COALESCE((SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'funnel_versions'), false),
    'policyCount', COALESCE((SELECT COUNT(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'funnel_versions'), 0),
    'rowCount', COALESCE((SELECT COUNT(*)::int FROM public.funnel_versions), 0)
  ) INTO versions_info;

  -- Combine results
  result := jsonb_build_object(
    'pillars', pillars_info,
    'funnels_catalog', catalog_info,
    'funnel_versions', versions_info
  );

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."diagnostics_pillars_sot"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."diagnostics_pillars_sot"() IS 'Diagnostic function for pillars/catalog source-of-truth audit. Returns table metadata and row counts. Used by /api/admin/diagnostics/pillars-sot endpoint.';



CREATE OR REPLACE FUNCTION "public"."enforce_clinician_patient_same_org"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If membership table is missing for some reason, skip enforcement
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'user_org_membership'
    ) THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.user_org_membership
        WHERE user_id = NEW.clinician_user_id
          AND organization_id = NEW.organization_id
          AND is_active = true
          AND role IN ('clinician', 'nurse', 'admin')
    ) THEN
        RAISE EXCEPTION 'Clinician user % is not an active member of org %', NEW.clinician_user_id, NEW.organization_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.user_org_membership
        WHERE user_id = NEW.patient_user_id
          AND organization_id = NEW.organization_id
          AND is_active = true
          AND role = 'patient'
    ) THEN
        RAISE EXCEPTION 'Patient user % is not an active member of org %', NEW.patient_user_id, NEW.organization_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_clinician_patient_same_org"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_account_deletion"("target_user_id" "uuid", "executed_by" "text" DEFAULT 'system'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
  deleted_count INT := 0;
  anonymized_count INT := 0;
  patient_profile_id UUID;
BEGIN
  -- Verify deletion is scheduled
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = target_user_id
    AND (raw_user_meta_data->>'account_status') = 'deletion_pending'
  ) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Account is not pending deletion'
    );
  END IF;
  
  -- Start transaction (implicit in function)
  BEGIN
    -- Get patient_profile_id before deletion for audit trail
    SELECT id INTO patient_profile_id
    FROM public.patient_profiles
    WHERE user_id = target_user_id;
    
    -- 1. Anonymize audit logs (keep structure, remove direct user reference)
    -- We keep the entity_id references but anonymize the actor
    UPDATE public.audit_log
    SET 
      actor_user_id = NULL,
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'anonymized_user_id', target_user_id::TEXT,
        'anonymized_at', NOW()::TEXT
      )
    WHERE actor_user_id = target_user_id;
    
    GET DIAGNOSTICS anonymized_count = ROW_COUNT;
    
    -- 2. Delete patient profile (CASCADE will handle related records)
    -- This will cascade to:
    -- - assessments
    -- - assessment_answers
    -- - patient_funnels
    -- - tasks
    -- - device_shipments
    -- - pre_screening_calls
    -- And other tables with ON DELETE CASCADE
    DELETE FROM public.patient_profiles WHERE user_id = target_user_id;
    
    -- 3. Delete user from auth.users (final step)
    -- Note: Some tables reference auth.users with ON DELETE SET NULL or CASCADE
    DELETE FROM auth.users WHERE id = target_user_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Build result
    result := jsonb_build_object(
      'success', TRUE,
      'user_id', target_user_id,
      'patient_profile_id', patient_profile_id,
      'deleted_count', deleted_count,
      'anonymized_count', anonymized_count,
      'executed_by', executed_by,
      'deleted_at', NOW()
    );
    
    RETURN result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Account deletion failed: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION "public"."execute_account_deletion"("target_user_id" "uuid", "executed_by" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."execute_account_deletion"("target_user_id" "uuid", "executed_by" "text") IS 'V05-I10.2: Executes account deletion with proper anonymization of audit logs and cascade deletion of user data. SECURITY DEFINER - requires proper authorization checks in calling code.';



CREATE OR REPLACE FUNCTION "public"."generate_report_version"("p_funnel_version" "text", "p_algorithm_version" "text", "p_prompt_version" "text", "p_inputs_hash_prefix" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN CONCAT(
        COALESCE(p_funnel_version, 'unknown'),
        '-',
        COALESCE(p_algorithm_version, 'v1'),
        '-',
        COALESCE(p_prompt_version, '1.0'),
        '-',
        COALESCE(p_inputs_hash_prefix, '00000000')
    );
END;
$$;


ALTER FUNCTION "public"."generate_report_version"("p_funnel_version" "text", "p_algorithm_version" "text", "p_prompt_version" "text", "p_inputs_hash_prefix" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_report_version"("p_funnel_version" "text", "p_algorithm_version" "text", "p_prompt_version" "text", "p_inputs_hash_prefix" "text") IS 'V05-I01.3: Generate deterministic report version from component versions and inputs hash prefix. Inputs hash includes: assessment_id, funnel_version_id, algorithm_version, prompt_version, confirmed data/doc IDs';



CREATE OR REPLACE FUNCTION "public"."get_design_tokens"("org_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result jsonb;
    category_name text;
BEGIN
    -- Initialize empty object
    result := '{}'::jsonb;
    
    -- Get all token categories
    FOR category_name IN 
        SELECT DISTINCT token_category 
        FROM public.design_tokens 
        WHERE is_active = true
    LOOP
        -- Build category object with overrides
        result := jsonb_set(
            result,
            ARRAY[category_name],
            COALESCE(
                (
                    SELECT jsonb_object_agg(token_key, token_value)
                    FROM public.design_tokens
                    WHERE token_category = category_name
                    AND is_active = true
                    AND (organization_id = org_id OR (org_id IS NULL AND organization_id IS NULL))
                ),
                '{}'::jsonb
            )
        );
    END LOOP;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_design_tokens"("org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_design_tokens"("org_id" "uuid") IS 'V05-I09.2: Returns merged design tokens for the specified organization. NULL org_id returns global defaults.';



CREATE OR REPLACE FUNCTION "public"."get_my_patient_profile_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  profile_id uuid;
BEGIN
  SELECT id INTO profile_id
  FROM public.patient_profiles
  WHERE user_id = auth.uid();
  
  RETURN profile_id;
END;
$$;


ALTER FUNCTION "public"."get_my_patient_profile_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_my_patient_profile_id"() IS 'Returns the patient_profile.id for the current authenticated user';



CREATE OR REPLACE FUNCTION "public"."get_triage_sla_days"("p_funnel_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_overdue_days INTEGER;
  v_default_days INTEGER := 7; -- Hardcoded fallback
BEGIN
  -- Try to get funnel-specific setting
  SELECT overdue_days
  INTO v_overdue_days
  FROM public.funnel_triage_settings
  WHERE funnel_id = p_funnel_id;
  
  -- If found, return it
  IF FOUND THEN
    RETURN v_overdue_days;
  END IF;
  
  -- Fall back to default
  -- Note: Environment variable fallback is handled in application layer
  -- This function returns the hardcoded default if no DB setting exists
  RETURN v_default_days;
END;
$$;


ALTER FUNCTION "public"."get_triage_sla_days"("p_funnel_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_triage_sla_days"("p_funnel_id" "uuid") IS 'E78.6: Get SLA days for a funnel. Returns funnel-specific value from funnel_triage_settings if exists, otherwise returns default (7 days). Application layer should handle TRIAGE_SLA_DAYS_DEFAULT env var.';



CREATE OR REPLACE FUNCTION "public"."get_user_org_ids"() RETURNS "uuid"[]
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    org_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(organization_id)
    INTO org_ids
    FROM public.user_org_membership
    WHERE user_id = auth.uid() AND is_active = true;
    
    RETURN COALESCE(org_ids, ARRAY[]::UUID[]);
END;
$$;


ALTER FUNCTION "public"."get_user_org_ids"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_org_ids"() IS 'V0.5: Returns array of organization IDs the current user belongs to';



CREATE OR REPLACE FUNCTION "public"."has_any_role"("check_role" "public"."user_role") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_org_membership
        WHERE user_id = auth.uid() 
          AND role = check_role
          AND is_active = true
    );
END;
$$;


ALTER FUNCTION "public"."has_any_role"("check_role" "public"."user_role") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_any_role"("check_role" "public"."user_role") IS 'V0.5: Checks if user has specified role in any organization';



CREATE OR REPLACE FUNCTION "public"."has_role"("check_role" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT (raw_app_meta_data->>'role' = check_role)
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."has_role"("check_role" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_role"("check_role" "text") IS 'Check if the current user has a specific role. Usage: SELECT has_role(''clinician'');';



CREATE OR REPLACE FUNCTION "public"."increment_reminder_count_atomic"("p_shipment_id" "uuid", "p_reminder_timestamp" timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_rows_affected INTEGER;
BEGIN
    -- Atomically update reminder tracking
    -- Only succeeds if reminder wasn't sent in last 7 days
    UPDATE public.device_shipments
    SET 
        last_reminder_at = p_reminder_timestamp,
        reminder_count = COALESCE(reminder_count, 0) + 1
    WHERE 
        id = p_shipment_id
        AND (
            last_reminder_at IS NULL 
            OR last_reminder_at < (p_reminder_timestamp - INTERVAL '7 days')
        );
    
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    
    -- Return true if update succeeded (reminder should be sent)
    -- Return false if no rows updated (reminder was already sent)
    RETURN v_rows_affected > 0;
END;
$$;


ALTER FUNCTION "public"."increment_reminder_count_atomic"("p_shipment_id" "uuid", "p_reminder_timestamp" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_assigned_to_patient"("patient_uid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.clinician_patient_assignments
        WHERE clinician_user_id = auth.uid()
          AND patient_user_id = patient_uid
    );
END;
$$;


ALTER FUNCTION "public"."is_assigned_to_patient"("patient_uid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_assigned_to_patient"("patient_uid" "uuid") IS 'V0.5: Checks if current user is assigned to specified patient';



CREATE OR REPLACE FUNCTION "public"."is_clinician"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (raw_app_meta_data->>'role' IN ('clinician', 'admin', 'nurse')),
      false
    )
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_clinician"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_clinician"() IS 'Returns true if the current authenticated user has the clinician, admin, or nurse role. Queries app_metadata directly instead of relying on JWT claims.';



CREATE OR REPLACE FUNCTION "public"."is_member_of_org"("org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_org_membership
        WHERE user_id = auth.uid() 
          AND organization_id = org_id
          AND is_active = true
    );
END;
$$;


ALTER FUNCTION "public"."is_member_of_org"("org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_member_of_org"("org_id" "uuid") IS 'V0.5: Checks if current user is member of specified organization';



CREATE OR REPLACE FUNCTION "public"."is_pilot_eligible"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  user_pilot_flag BOOLEAN;
  org_pilot_flag BOOLEAN;
BEGIN
  -- Check user's pilot flag in user_profiles.metadata
  SELECT COALESCE((metadata->>'pilot_enabled')::boolean, false)
  INTO user_pilot_flag
  FROM public.user_profiles
  WHERE user_profiles.user_id = is_pilot_eligible.user_id
  LIMIT 1;
  
  IF user_pilot_flag THEN
    RETURN true;
  END IF;
  
  -- Check if any of user's organizations has pilot enabled
  SELECT EXISTS (
    SELECT 1
    FROM public.user_org_membership uom
    JOIN public.organizations o ON o.id = uom.organization_id
    WHERE uom.user_id = is_pilot_eligible.user_id
      AND uom.is_active = true
      AND COALESCE((o.settings->>'pilot_enabled')::boolean, false) = true
  )
  INTO org_pilot_flag;
  
  RETURN org_pilot_flag;
END;
$$;


ALTER FUNCTION "public"."is_pilot_eligible"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_pilot_eligible"("user_id" "uuid") IS 'E6.4.1: Returns true if user is eligible for pilot features (checks user and org pilot flags)';



CREATE OR REPLACE FUNCTION "public"."log_rls_violation"("table_name" "text", "operation" "text", "attempted_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Log to PostgreSQL logs (visible in Supabase logs)
  RAISE WARNING 'RLS_VIOLATION: user=% table=% operation=% id=% timestamp=%',
    auth.uid(),
    table_name,
    operation,
    attempted_id,
    NOW();
END;
$$;


ALTER FUNCTION "public"."log_rls_violation"("table_name" "text", "operation" "text", "attempted_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_rls_violation"("table_name" "text", "operation" "text", "attempted_id" "uuid") IS 'Logs RLS policy violations for security monitoring';



CREATE OR REPLACE FUNCTION "public"."meta_check_required_objects"("required_objects" "text"[]) RETURNS TABLE("missing_count" integer, "missing_sample" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  missing_total int;
  missing_sample_local text[];
begin
  perform set_config('statement_timeout', '1500', true);

  select count(*)::int
  into missing_total
  from unnest(required_objects) v(x)
  where to_regclass(v.x) is null;

  select array_agg(x)
  into missing_sample_local
  from (
    select v.x
    from unnest(required_objects) v(x)
    where to_regclass(v.x) is null
    limit 3
  ) as sample;

  missing_count := coalesce(missing_total, 0);
  missing_sample := coalesce(missing_sample_local, '{}'::text[]);
  return next;
end;
$$;


ALTER FUNCTION "public"."meta_check_required_objects"("required_objects" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_published_version_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'Cannot delete published funnel version. Archive it first.';
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."prevent_published_version_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."publish_draft_version"("p_draft_id" "uuid", "p_user_id" "uuid", "p_set_as_default" boolean DEFAULT true, "p_change_summary" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."publish_draft_version"("p_draft_id" "uuid", "p_user_id" "uuid", "p_set_as_default" boolean, "p_change_summary" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."publish_draft_version"("p_draft_id" "uuid", "p_user_id" "uuid", "p_set_as_default" boolean, "p_change_summary" "text") IS 'E74.3: Atomically publish a draft version with audit logging';



CREATE OR REPLACE FUNCTION "public"."request_account_deletion"("target_user_id" "uuid", "deletion_reason" "text" DEFAULT NULL::"text", "retention_days" integer DEFAULT 30) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  scheduled_deletion TIMESTAMPTZ;
  result JSONB;
BEGIN
  -- Calculate deletion date (30 days from now by default)
  scheduled_deletion := NOW() + (retention_days || ' days')::INTERVAL;
  
  -- Update user metadata to track deletion request
  -- Using raw_user_meta_data for user-controlled lifecycle data
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'deletion_requested_at', NOW()::TEXT,
    'deletion_scheduled_for', scheduled_deletion::TEXT,
    'deletion_reason', deletion_reason,
    'account_status', 'deletion_pending'
  )
  WHERE id = target_user_id;
  
  -- Build response
  result := jsonb_build_object(
    'success', TRUE,
    'user_id', target_user_id,
    'deletion_requested_at', NOW(),
    'deletion_scheduled_for', scheduled_deletion,
    'retention_period_days', retention_days,
    'can_cancel_until', scheduled_deletion
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."request_account_deletion"("target_user_id" "uuid", "deletion_reason" "text", "retention_days" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."request_account_deletion"("target_user_id" "uuid", "deletion_reason" "text", "retention_days" integer) IS 'V05-I10.2: Records account deletion request with retention period. Updates user metadata to track deletion lifecycle.';



CREATE OR REPLACE FUNCTION "public"."rls_audit_assessment_access"("staff_user_id" "uuid", "assessment_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  patient_profile_id uuid;
  patient_user_id uuid;
  patient_active_memberships uuid[] := '{}'::uuid[];
  staff_active_memberships uuid[] := '{}'::uuid[];
  staff_active_memberships_role uuid[] := '{}'::uuid[];
  org_overlap_count integer := 0;
  staff_role_ok boolean := false;
  policy_allows boolean := false;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if auth.uid() != staff_user_id and not public.has_any_role('admin'::public.user_role) then
    raise exception 'FORBIDDEN';
  end if;

  select a.patient_id, pp.user_id
    into patient_profile_id, patient_user_id
    from public.assessments a
    join public.patient_profiles pp on pp.id = a.patient_id
   where a.id = assessment_id;

  if patient_user_id is not null then
    select coalesce(array_agg(uom.organization_id order by uom.organization_id), '{}'::uuid[])
      into patient_active_memberships
      from public.user_org_membership uom
     where uom.user_id = patient_user_id
       and uom.is_active = true;
  end if;

  select coalesce(array_agg(uom.organization_id order by uom.organization_id), '{}'::uuid[])
    into staff_active_memberships
    from public.user_org_membership uom
   where uom.user_id = staff_user_id
     and uom.is_active = true;

  select coalesce(array_agg(uom.organization_id order by uom.organization_id), '{}'::uuid[])
    into staff_active_memberships_role
    from public.user_org_membership uom
   where uom.user_id = staff_user_id
     and uom.is_active = true
     and uom.role in (
       'admin'::public.user_role,
       'clinician'::public.user_role,
       'nurse'::public.user_role
     );

  staff_role_ok := coalesce(array_length(staff_active_memberships_role, 1), 0) > 0;

  if patient_user_id is not null then
    select count(*)
      into org_overlap_count
      from public.user_org_membership uom_patient
      join public.user_org_membership uom_staff
        on uom_staff.organization_id = uom_patient.organization_id
       and uom_staff.user_id = staff_user_id
       and uom_staff.is_active = true
       and uom_staff.role in (
         'admin'::public.user_role,
         'clinician'::public.user_role,
         'nurse'::public.user_role
       )
     where uom_patient.user_id = patient_user_id
       and uom_patient.is_active = true;
  end if;

  select exists (
    select 1
      from public.patient_profiles pp
      join public.user_org_membership uom_patient
        on uom_patient.user_id = pp.user_id
       and uom_patient.is_active = true
      join public.user_org_membership uom_staff
        on uom_staff.organization_id = uom_patient.organization_id
       and uom_staff.user_id = staff_user_id
       and uom_staff.is_active = true
       and uom_staff.role in (
         'admin'::public.user_role,
         'clinician'::public.user_role,
         'nurse'::public.user_role
       )
     where pp.id = patient_profile_id
  ) into policy_allows;

  return jsonb_build_object(
    'patient_profile_id', patient_profile_id,
    'patient_user_id', patient_user_id,
    'staff_user_id', staff_user_id,
    'patient_active_memberships', patient_active_memberships,
    'staff_active_memberships', staff_active_memberships,
    'org_overlap_count', org_overlap_count,
    'staff_role_ok', staff_role_ok,
    'policy_allows', policy_allows
  );
end;
$$;


ALTER FUNCTION "public"."rls_audit_assessment_access"("staff_user_id" "uuid", "assessment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_role"("user_email" "text", "user_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(user_role)
  )
  WHERE email = user_email;
END;
$$;


ALTER FUNCTION "public"."set_user_role"("user_email" "text", "user_role" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_user_role"("user_email" "text", "user_role" "text") IS 'Sets the role for a user in their app_metadata. Usage: SELECT set_user_role(''email@example.com'', ''clinician'');';



CREATE OR REPLACE FUNCTION "public"."should_sample_job"("p_job_id" "uuid", "p_sampling_percentage" integer DEFAULT 10, "p_salt" "text" DEFAULT 'v05-i05-7-default-salt'::"text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    v_hash TEXT;
    v_hash_int BIGINT;
    v_modulo INTEGER;
BEGIN
    -- Input validation
    IF p_sampling_percentage < 0 OR p_sampling_percentage > 100 THEN
        RAISE EXCEPTION 'Sampling percentage must be between 0 and 100';
    END IF;
    
    -- Edge case: 0% sampling
    IF p_sampling_percentage = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Edge case: 100% sampling
    IF p_sampling_percentage = 100 THEN
        RETURN TRUE;
    END IF;
    
    -- Compute deterministic hash
    v_hash := compute_sampling_hash(p_job_id, p_salt);
    
    -- Convert first 16 hex chars to integer (64-bit)
    -- Take modulo 100 to get 0-99 range
    v_hash_int := ('x' || substring(v_hash, 1, 16))::bit(64)::bigint;
    v_modulo := (v_hash_int % 100)::integer;
    
    -- Include if modulo < percentage
    -- e.g., 10% → include if modulo < 10 (0-9 out of 0-99)
    RETURN v_modulo < p_sampling_percentage;
END;
$$;


ALTER FUNCTION "public"."should_sample_job"("p_job_id" "uuid", "p_sampling_percentage" integer, "p_salt" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."should_sample_job"("p_job_id" "uuid", "p_sampling_percentage" integer, "p_salt" "text") IS 'V05-I05.7: Deterministic sampling decision based on hash modulo';



CREATE OR REPLACE FUNCTION "public"."update_anamnesis_entries_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_anamnesis_entries_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_clinical_intake_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_clinical_intake_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_consult_note_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_consult_note_timestamp"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_consult_note_timestamp"() IS 'Issue 5: Automatically updates updated_at timestamp on consult note modifications';



CREATE OR REPLACE FUNCTION "public"."update_device_shipments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_device_shipments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_diagnosis_runs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_diagnosis_runs_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_diagnosis_runs_updated_at"() IS 'E76.4: Auto-updates updated_at timestamp on diagnosis_runs';



CREATE OR REPLACE FUNCTION "public"."update_medical_validation_results_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$;


ALTER FUNCTION "public"."update_medical_validation_results_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_navigation_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_navigation_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notifications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_operational_settings_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_operational_settings_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_patient_funnels_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_patient_funnels_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_patient_funnels_updated_at"() IS 'E74.6: Auto-update updated_at timestamp on patient_funnels changes';



CREATE OR REPLACE FUNCTION "public"."update_patient_state_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_patient_state_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pre_screening_calls_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_pre_screening_calls_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_processing_jobs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_processing_jobs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_report_sections_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_report_sections_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reports_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reports_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_review_records_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_review_records_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_safety_check_results_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_safety_check_results_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_support_cases_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_support_cases_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."amy_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "amy_chat_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."amy_chat_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."amy_chat_messages" IS 'E73.8: AMY chat conversation history. Stores user and assistant messages for chat persistence. No control features - read-only chat.';



COMMENT ON COLUMN "public"."amy_chat_messages"."role" IS 'Message role: user (patient message), assistant (AMY response), system (context)';



COMMENT ON COLUMN "public"."amy_chat_messages"."metadata" IS 'Optional metadata: correlationId, model version, etc.';



CREATE TABLE IF NOT EXISTS "public"."anamnesis_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "entry_type" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "is_archived" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "anamnesis_entries_entry_type_check" CHECK (("entry_type" = ANY (ARRAY['medical_history'::"text", 'symptoms'::"text", 'medications'::"text", 'allergies'::"text", 'family_history'::"text", 'lifestyle'::"text", 'funnel_summary'::"text", 'intake'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."anamnesis_entries" OWNER TO "postgres";


COMMENT ON TABLE "public"."anamnesis_entries" IS 'E75.1: Medical anamnesis (history) entries with versioning support. RLS enforced for patient/clinician/admin access.';



COMMENT ON COLUMN "public"."anamnesis_entries"."patient_id" IS 'Patient this entry belongs to (references patient_profiles)';



COMMENT ON COLUMN "public"."anamnesis_entries"."organization_id" IS 'Organization context for multi-tenant isolation';



COMMENT ON COLUMN "public"."anamnesis_entries"."title" IS 'Brief title/summary of the anamnesis entry';



COMMENT ON COLUMN "public"."anamnesis_entries"."content" IS 'JSONB: Structured entry content (fields, values, metadata)';



COMMENT ON COLUMN "public"."anamnesis_entries"."entry_type" IS 'Category of anamnesis entry';



COMMENT ON COLUMN "public"."anamnesis_entries"."tags" IS 'Searchable tags for categorization';



COMMENT ON COLUMN "public"."anamnesis_entries"."updated_at" IS 'Timestamp of latest version (auto-updated by trigger)';



COMMENT ON CONSTRAINT "anamnesis_entries_entry_type_check" ON "public"."anamnesis_entries" IS 'E79.1: Valid entry types including intake for patient intake entries';



CREATE TABLE IF NOT EXISTS "public"."anamnesis_entry_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "title" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "entry_type" "text",
    "tags" "text"[],
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "change_reason" "text",
    "diff" "jsonb"
);


ALTER TABLE "public"."anamnesis_entry_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."anamnesis_entry_versions" IS 'E75.1: Immutable version history for anamnesis_entries. No updates allowed after insert.';



COMMENT ON COLUMN "public"."anamnesis_entry_versions"."version_number" IS 'Sequential version number (1, 2, 3, ...)';



COMMENT ON COLUMN "public"."anamnesis_entry_versions"."changed_by" IS 'User who made this change';



COMMENT ON COLUMN "public"."anamnesis_entry_versions"."change_reason" IS 'Optional reason for the change';



COMMENT ON COLUMN "public"."anamnesis_entry_versions"."diff" IS 'JSONB: Differences from previous version';



CREATE TABLE IF NOT EXISTS "public"."assessment_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "question_id" "text" NOT NULL,
    "answer_value" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "answer_data" "jsonb"
);


ALTER TABLE "public"."assessment_answers" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessment_answers" IS 'Assessment answers with RLS: patients see own data, clinicians see all';



COMMENT ON COLUMN "public"."assessment_answers"."answer_data" IS 'V0.5+: Stores answer value as JSONB to support multiple types (string, number, boolean). For Legacy funnels, answer_value INTEGER is used.';



CREATE TABLE IF NOT EXISTS "public"."assessment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."assessment_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessment_events" IS 'V0.5: Event log for assessment lifecycle tracking';



COMMENT ON COLUMN "public"."assessment_events"."event_type" IS 'Event types: started, step_completed, paused, resumed, completed, etc.';



COMMENT ON COLUMN "public"."assessment_events"."payload" IS 'JSONB: Event-specific data (step_id, answers, etc.)';



CREATE TABLE IF NOT EXISTS "public"."assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "funnel" "text" NOT NULL,
    "funnel_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "status" "public"."assessment_status" DEFAULT 'in_progress'::"public"."assessment_status" NOT NULL,
    "state" "public"."assessment_state" DEFAULT 'in_progress'::"public"."assessment_state",
    "current_step_id" "uuid",
    "workup_status" "public"."workup_status",
    "missing_data_fields" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."assessments" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessments" IS 'Patient assessments with RLS: patients see own data, clinicians see all';



COMMENT ON COLUMN "public"."assessments"."funnel_id" IS 'Foreign key to funnels table. Should always be set; legacy assessments use funnel (text) field for slug.';



COMMENT ON COLUMN "public"."assessments"."status" IS 'Lifecycle status of the assessment: in_progress or completed';



COMMENT ON COLUMN "public"."assessments"."workup_status" IS 'E6.4.4: Workup status - NULL for in-progress, needs_more_data or ready_for_review for completed assessments';



COMMENT ON COLUMN "public"."assessments"."missing_data_fields" IS 'E6.4.4: Array of missing data field identifiers (e.g., ["sleep_quality", "stress_triggers"])';



CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_user_id" "uuid",
    "actor_role" "public"."user_role",
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "diff" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    "source" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "audit_log_source_check" CHECK (("source" = ANY (ARRAY['api'::"text", 'job'::"text", 'admin-ui'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_log" IS 'V0.5: Comprehensive audit trail for all decision-relevant system changes. Extended with org_id, source, and metadata for V05-I01.4.';



COMMENT ON COLUMN "public"."audit_log"."actor_user_id" IS 'User who performed the action (NULL for system actions)';



COMMENT ON COLUMN "public"."audit_log"."entity_type" IS 'Type of entity modified (e.g., assessment, report, funnel)';



COMMENT ON COLUMN "public"."audit_log"."entity_id" IS 'UUID of the modified entity';



COMMENT ON COLUMN "public"."audit_log"."action" IS 'Action performed (created, updated, deleted, etc.)';



COMMENT ON COLUMN "public"."audit_log"."diff" IS 'JSONB: Before/after differences for updates';



COMMENT ON COLUMN "public"."audit_log"."org_id" IS 'V0.5: Organization context for multi-tenant audit isolation';



COMMENT ON COLUMN "public"."audit_log"."source" IS 'V0.5: Source of the action (api, job, admin-ui, system)';



COMMENT ON COLUMN "public"."audit_log"."metadata" IS 'V0.5: Additional context (request_id, algorithm_version, prompt_version, report_version, correlation_ids, etc.)';



CREATE TABLE IF NOT EXISTS "public"."calculated_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "algorithm_version" "text" NOT NULL,
    "scores" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "risk_models" "jsonb" DEFAULT '{}'::"jsonb",
    "priority_ranking" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "funnel_version_id" "uuid",
    "computed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inputs_hash" "text"
);


ALTER TABLE "public"."calculated_results" OWNER TO "postgres";


COMMENT ON TABLE "public"."calculated_results" IS 'V0.5: Algorithm-calculated results with JSONB for flexible scoring';



COMMENT ON COLUMN "public"."calculated_results"."algorithm_version" IS 'Version of algorithm used for calculations';



COMMENT ON COLUMN "public"."calculated_results"."scores" IS 'JSONB: Calculated scores (e.g., stress_score, resilience_score)';



COMMENT ON COLUMN "public"."calculated_results"."risk_models" IS 'JSONB: Risk assessment outputs';



COMMENT ON COLUMN "public"."calculated_results"."priority_ranking" IS 'JSONB: Priority/urgency calculations';



COMMENT ON COLUMN "public"."calculated_results"."funnel_version_id" IS 'V05-I01.3: Reference to funnel version for reproducibility';



COMMENT ON COLUMN "public"."calculated_results"."computed_at" IS 'V05-I01.3: When results were computed';



COMMENT ON COLUMN "public"."calculated_results"."inputs_hash" IS 'V05-I01.3: SHA256 hash of normalized inputs for detecting equivalent runs';



CREATE TABLE IF NOT EXISTS "public"."clinical_intakes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "patient_id" "uuid",
    "organization_id" "uuid",
    "chat_session_id" "uuid",
    "status" "public"."intake_status" DEFAULT 'draft'::"public"."intake_status" NOT NULL,
    "version_number" integer DEFAULT 1 NOT NULL,
    "structured_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "clinical_summary" "text",
    "trigger_reason" "text",
    "last_updated_from_messages" "uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "policy_override" "jsonb",
    CONSTRAINT "clinical_intakes_structured_data_not_empty" CHECK (("structured_data" <> '{}'::"jsonb")),
    CONSTRAINT "clinical_intakes_version_positive" CHECK (("version_number" > 0))
);


ALTER TABLE "public"."clinical_intakes" OWNER TO "postgres";


COMMENT ON TABLE "public"."clinical_intakes" IS 'Issue 10: Clinical intake synthesis from patient conversations. Stores both structured data (STRUCTURED_INTAKE) and physician-readable summary (CLINICAL_SUMMARY).';



COMMENT ON COLUMN "public"."clinical_intakes"."user_id" IS 'User (patient) this intake belongs to';



COMMENT ON COLUMN "public"."clinical_intakes"."patient_id" IS 'Optional patient profile reference';



COMMENT ON COLUMN "public"."clinical_intakes"."chat_session_id" IS 'Reference to first message in conversation that triggered this intake';



COMMENT ON COLUMN "public"."clinical_intakes"."structured_data" IS 'STRUCTURED_INTAKE: machine-readable JSONB with standardized clinical fields';



COMMENT ON COLUMN "public"."clinical_intakes"."clinical_summary" IS 'CLINICAL_SUMMARY: physician-readable narrative summary';



COMMENT ON COLUMN "public"."clinical_intakes"."trigger_reason" IS 'Reason for intake update: new_medical_info, clarification, thematic_block_complete, time_based';



COMMENT ON COLUMN "public"."clinical_intakes"."last_updated_from_messages" IS 'Array of message IDs that triggered this update';


COMMENT ON COLUMN "public"."clinical_intakes"."policy_override" IS 'Clinician policy override metadata (override_level/action, reason, created_by, created_at).';



CREATE TABLE IF NOT EXISTS "public"."clinician_patient_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "clinician_user_id" "uuid" NOT NULL,
    "patient_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."clinician_patient_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."clinician_patient_assignments" IS 'V0.5: Clinician-patient assignments within same organization. Both users must be members of specified org.';



CREATE TABLE IF NOT EXISTS "public"."consult_note_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "consult_note_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "content" "jsonb" NOT NULL,
    "rendered_markdown" "text",
    "change_summary" "text",
    "diff" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "consult_note_versions_version_positive" CHECK (("version_number" > 0))
);


ALTER TABLE "public"."consult_note_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."consult_note_versions" IS 'Issue 5: Immutable version history for consult notes. Tracks all edits with diffs.';



COMMENT ON COLUMN "public"."consult_note_versions"."diff" IS 'Issue 5: JSON diff of changes from previous version';



CREATE TABLE IF NOT EXISTS "public"."consult_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "chat_session_id" "uuid",
    "consultation_type" "public"."consultation_type" DEFAULT 'first'::"public"."consultation_type" NOT NULL,
    "source" "text" DEFAULT 'Patient self-report via PAT'::"text" NOT NULL,
    "guideline_version" "text",
    "uncertainty_profile" "public"."uncertainty_profile" DEFAULT 'qualitative'::"public"."uncertainty_profile" NOT NULL,
    "assertiveness" "public"."assertiveness_level" DEFAULT 'conservative'::"public"."assertiveness_level" NOT NULL,
    "audience" "public"."audience_type" DEFAULT 'patient'::"public"."audience_type" NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "rendered_markdown" "text",
    "version_number" integer DEFAULT 1 NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "consult_notes_content_not_empty" CHECK (("content" <> '{}'::"jsonb")),
    CONSTRAINT "consult_notes_version_positive" CHECK (("version_number" > 0))
);


ALTER TABLE "public"."consult_notes" OWNER TO "postgres";


COMMENT ON TABLE "public"."consult_notes" IS 'Issue 5: Medical consultation notes with strict 12-section structure. Versioned, immutable records.';



COMMENT ON COLUMN "public"."consult_notes"."chat_session_id" IS 'Issue 5: Optional reference to first message in amy_chat_messages conversation';



COMMENT ON COLUMN "public"."consult_notes"."content" IS 'Issue 5: Structured JSONB with 12 mandatory sections: chiefComplaint, hpi, redFlagsScreening, medicalHistory, medications, objectiveData, problemList, preliminaryAssessment, missingData, nextSteps, handoffSummary';



COMMENT ON COLUMN "public"."consult_notes"."rendered_markdown" IS 'Issue 5: Pre-rendered Markdown for display (generated from content JSONB)';



COMMENT ON COLUMN "public"."consult_notes"."version_number" IS 'Issue 5: Version number (increments on each edit, never modified in-place)';



CREATE TABLE IF NOT EXISTS "public"."content_page_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_page_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body_markdown" "text" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."content_page_sections" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_page_sections" IS 'F3: Sections for multi-part content pages';



COMMENT ON COLUMN "public"."content_page_sections"."order_index" IS 'Determines display order of sections (lower = earlier)';



CREATE TABLE IF NOT EXISTS "public"."content_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "excerpt" "text",
    "body_markdown" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "layout" "text" DEFAULT 'default'::"text",
    "funnel_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category" "text",
    "priority" integer DEFAULT 0 NOT NULL,
    "deleted_at" timestamp with time zone,
    "seo_title" "text",
    "seo_description" "text",
    "flow_step" "text",
    "order_index" integer
);


ALTER TABLE "public"."content_pages" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_pages" IS 'Content pages with status workflow (draft/published/archived) and soft-delete support';



COMMENT ON COLUMN "public"."content_pages"."status" IS 'Content status: draft, published, or archived';



COMMENT ON COLUMN "public"."content_pages"."category" IS 'Content category/type (e.g., info, tutorial, faq)';



COMMENT ON COLUMN "public"."content_pages"."priority" IS 'Display priority for ordering content (higher = more important)';



COMMENT ON COLUMN "public"."content_pages"."deleted_at" IS 'Soft-delete timestamp. When set, content is considered deleted but remains in database';



COMMENT ON COLUMN "public"."content_pages"."seo_title" IS 'Optional SEO title for search engines and social media. If null, falls back to title.';



COMMENT ON COLUMN "public"."content_pages"."seo_description" IS 'Optional SEO description for search engines and social media. If null, falls back to excerpt.';



COMMENT ON COLUMN "public"."content_pages"."flow_step" IS 'Identifies which step in the funnel flow this content page belongs to (e.g., "intro", "pre-assessment", "post-assessment"). NULL if not part of a specific flow step.';



COMMENT ON COLUMN "public"."content_pages"."order_index" IS 'Determines the display order of content pages within a flow step. Lower numbers appear first. NULL if ordering is not relevant.';



CREATE TABLE IF NOT EXISTS "public"."design_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "token_category" "text" NOT NULL,
    "token_key" "text" NOT NULL,
    "token_value" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "created_by" "uuid",
    CONSTRAINT "design_tokens_category_check" CHECK (("token_category" = ANY (ARRAY['spacing'::"text", 'typography'::"text", 'radii'::"text", 'shadows'::"text", 'motion'::"text", 'colors'::"text", 'componentTokens'::"text", 'layout'::"text"])))
);


ALTER TABLE "public"."design_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."design_tokens" IS 'V05-I09.2: Organization-specific design token overrides. Allows tenant/clinic-level customization of the design system.';



COMMENT ON COLUMN "public"."design_tokens"."organization_id" IS 'Organization that owns this token override. NULL means global default.';



COMMENT ON COLUMN "public"."design_tokens"."token_category" IS 'Token category: spacing, typography, radii, shadows, motion, colors, componentTokens, layout';



COMMENT ON COLUMN "public"."design_tokens"."token_key" IS 'Token key within the category (e.g., "md" for spacing.md)';



COMMENT ON COLUMN "public"."design_tokens"."token_value" IS 'JSONB token value. Structure depends on token category.';



COMMENT ON COLUMN "public"."design_tokens"."is_active" IS 'Whether this token override is active';



CREATE TABLE IF NOT EXISTS "public"."device_shipments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "task_id" "uuid",
    "organization_id" "uuid" NOT NULL,
    "created_by_user_id" "uuid",
    "device_type" "text" NOT NULL,
    "device_serial_number" "text",
    "tracking_number" "text",
    "carrier" "text",
    "shipping_address" "text",
    "status" "public"."shipment_status" DEFAULT 'ordered'::"public"."shipment_status" NOT NULL,
    "ordered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "shipped_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "expected_delivery_at" timestamp with time zone,
    "return_requested_at" timestamp with time zone,
    "returned_at" timestamp with time zone,
    "return_tracking_number" "text",
    "return_carrier" "text",
    "return_reason" "text",
    "reminder_sent_at" timestamp with time zone,
    "last_reminder_at" timestamp with time zone,
    "reminder_count" integer DEFAULT 0 NOT NULL,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."device_shipments" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_shipments" IS 'V05-I08.3: Device shipment tracking with status, return tracking, and reminder management';



COMMENT ON COLUMN "public"."device_shipments"."organization_id" IS 'Organization for multi-tenant isolation. Set server-side.';



COMMENT ON COLUMN "public"."device_shipments"."tracking_number" IS 'Carrier tracking number for outbound shipment';



COMMENT ON COLUMN "public"."device_shipments"."return_tracking_number" IS 'Carrier tracking number for return shipment';



COMMENT ON COLUMN "public"."device_shipments"."reminder_count" IS 'Number of reminders sent for this shipment';



COMMENT ON COLUMN "public"."device_shipments"."metadata" IS 'Additional shipment data (JSONB)';



CREATE TABLE IF NOT EXISTS "public"."diagnosis_artifacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "artifact_type" "text" DEFAULT 'diagnosis_json'::"text" NOT NULL,
    "artifact_data" "jsonb" NOT NULL,
    "schema_version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "risk_level" "text",
    "confidence_score" real,
    "primary_findings" "text"[],
    "recommendations_count" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "result_source" "text",
    "llm_used" boolean,
    "llm_provider" "text",
    "llm_model" "text",
    "llm_prompt_version" "text",
    "llm_request_id" "text",
    "llm_latency_ms" integer,
    "llm_tokens_in" integer,
    "llm_tokens_out" integer,
    "llm_tokens_total" integer,
    "llm_error" "text",
    "llm_raw_response" "text",
    CONSTRAINT "diagnosis_artifacts_artifact_type_check" CHECK (("artifact_type" = ANY (ARRAY['diagnosis_json'::"text", 'context_pack'::"text", 'mcp_response'::"text"]))),
    CONSTRAINT "diagnosis_artifacts_confidence_score_check" CHECK (((("confidence_score" >= (0.0)::double precision) AND ("confidence_score" <= (1.0)::double precision)) OR ("confidence_score" IS NULL))),
    CONSTRAINT "diagnosis_artifacts_risk_level_check" CHECK ((("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])) OR ("risk_level" IS NULL)))
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



COMMENT ON COLUMN "public"."diagnosis_artifacts"."result_source" IS 'LLM provenance result source (llm|fallback|cached|rule_based)';



COMMENT ON COLUMN "public"."diagnosis_artifacts"."llm_used" IS 'Whether a structured LLM output was successfully parsed';



COMMENT ON COLUMN "public"."diagnosis_artifacts"."llm_provider" IS 'LLM provider identifier (e.g., anthropic, openai)';



COMMENT ON COLUMN "public"."diagnosis_artifacts"."llm_model" IS 'LLM model name used for the run';



COMMENT ON COLUMN "public"."diagnosis_artifacts"."llm_prompt_version" IS 'Prompt version used for the LLM call';



COMMENT ON COLUMN "public"."diagnosis_artifacts"."llm_request_id" IS 'Provider request or response id for the LLM call';



COMMENT ON COLUMN "public"."diagnosis_artifacts"."llm_latency_ms" IS 'Measured latency of the LLM call in milliseconds';



COMMENT ON COLUMN "public"."diagnosis_artifacts"."llm_tokens_in" IS 'Input tokens for the LLM call';



COMMENT ON COLUMN "public"."diagnosis_artifacts"."llm_tokens_out" IS 'Output tokens for the LLM call';



COMMENT ON COLUMN "public"."diagnosis_artifacts"."llm_tokens_total" IS 'Total tokens for the LLM call';



COMMENT ON COLUMN "public"."diagnosis_artifacts"."llm_error" IS 'LLM error or fallback reason if structured output failed';



COMMENT ON COLUMN "public"."diagnosis_artifacts"."llm_raw_response" IS 'Optional raw LLM response (truncated)';



CREATE TABLE IF NOT EXISTS "public"."diagnosis_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinician_id" "uuid" NOT NULL,
    "status" "public"."diagnosis_run_status" DEFAULT 'queued'::"public"."diagnosis_run_status" NOT NULL,
    "inputs_hash" "text" NOT NULL,
    "context_pack_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_code" "text",
    "error_message" "text",
    "error_details" "jsonb",
    "mcp_run_id" "text",
    "processing_time_ms" integer,
    "retry_count" integer DEFAULT 0 NOT NULL,
    "max_retries" integer DEFAULT 3 NOT NULL,
    "inputs_meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "diagnosis_runs_inputs_meta_is_object" CHECK (("jsonb_typeof"("inputs_meta") = 'object'::"text")),
    CONSTRAINT "diagnosis_runs_max_retries_check" CHECK ((("max_retries" >= 1) AND ("max_retries" <= 10))),
    CONSTRAINT "diagnosis_runs_retry_count_check" CHECK ((("retry_count" >= 0) AND ("retry_count" <= 10)))
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



COMMENT ON COLUMN "public"."diagnosis_runs"."inputs_meta" IS 'E76.8: Metadata about context pack inputs (patient_id, anamnesis_ids, funnel_run_ids, demographics, measures) - enables audit trail and idempotency verification';



CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid",
    "storage_path" "text" NOT NULL,
    "doc_type" "text",
    "parsing_status" "public"."parsing_status" DEFAULT 'pending'::"public"."parsing_status" NOT NULL,
    "extracted_data" "jsonb" DEFAULT '{}'::"jsonb",
    "confidence" "jsonb" DEFAULT '{}'::"jsonb",
    "confirmed_data" "jsonb" DEFAULT '{}'::"jsonb",
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "extractor_version" "text",
    "input_hash" "text",
    "extracted_json" "jsonb" DEFAULT '{}'::"jsonb",
    "confidence_json" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


COMMENT ON TABLE "public"."documents" IS 'V0.5: Document storage with AI extraction results';



COMMENT ON COLUMN "public"."documents"."storage_path" IS 'Path to file in storage bucket';



COMMENT ON COLUMN "public"."documents"."doc_type" IS 'Document type (e.g., lab_report, prescription, medical_history)';



COMMENT ON COLUMN "public"."documents"."extracted_data" IS 'JSONB: AI-extracted structured data from document';



COMMENT ON COLUMN "public"."documents"."confidence" IS 'JSONB: Confidence scores per extracted field';



COMMENT ON COLUMN "public"."documents"."confirmed_data" IS 'JSONB: User-confirmed/corrected data';



COMMENT ON COLUMN "public"."documents"."extractor_version" IS 'V05-I04.2: Version identifier for the extraction algorithm (e.g., "v1.0.0")';



COMMENT ON COLUMN "public"."documents"."input_hash" IS 'V05-I04.2: SHA-256 hash of extraction inputs for idempotent behavior';



COMMENT ON COLUMN "public"."documents"."extracted_json" IS 'V05-I04.2: AI-extracted structured data (e.g., lab values, medications)';



COMMENT ON COLUMN "public"."documents"."confidence_json" IS 'V05-I04.2: Per-field confidence scores + PHI-safe evidence pointers';



CREATE TABLE IF NOT EXISTS "public"."funnel_publish_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "version_id" "uuid" NOT NULL,
    "previous_version_id" "uuid",
    "published_by" "uuid",
    "published_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "diff" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "change_summary" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."funnel_publish_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."funnel_publish_history" IS 'E74.3: Audit trail for funnel version publishing with diffs';



COMMENT ON COLUMN "public"."funnel_publish_history"."diff" IS 'E74.3: JSONB diff between previous and new version';



COMMENT ON COLUMN "public"."funnel_publish_history"."change_summary" IS 'E74.3: Human-readable summary of changes';



COMMENT ON COLUMN "public"."funnel_publish_history"."metadata" IS 'E74.3: Additional metadata (validation results, etc.)';



CREATE TABLE IF NOT EXISTS "public"."funnel_question_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "funnel_step_id" "uuid" NOT NULL,
    "rule_type" "text" NOT NULL,
    "rule_payload" "jsonb" NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_rule_type" CHECK (("rule_type" = ANY (ARRAY['conditional_required'::"text", 'conditional_visible'::"text"])))
);


ALTER TABLE "public"."funnel_question_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."funnel_question_rules" IS 'B4: Stores conditional validation rules for dynamic funnel questions';



COMMENT ON COLUMN "public"."funnel_question_rules"."rule_type" IS 'Type of rule: conditional_required or conditional_visible';



COMMENT ON COLUMN "public"."funnel_question_rules"."rule_payload" IS 'JSONB structure defining conditions and logic. Example: {"type": "conditional_required", "conditions": [{"question_id": "q1", "operator": "in", "values": [1, 2]}], "logic": "AND"}';



COMMENT ON COLUMN "public"."funnel_question_rules"."priority" IS 'Higher priority rules are evaluated first (default: 0)';



COMMENT ON COLUMN "public"."funnel_question_rules"."is_active" IS 'Allows disabling rules without deleting them';



CREATE TABLE IF NOT EXISTS "public"."funnel_step_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_step_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "is_required" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."funnel_step_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funnel_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content_page_id" "uuid",
    CONSTRAINT "funnel_steps_content_page_consistency" CHECK (((("type" = 'content_page'::"text") AND ("content_page_id" IS NOT NULL)) OR (("type" <> 'content_page'::"text") AND ("content_page_id" IS NULL))))
);


ALTER TABLE "public"."funnel_steps" OWNER TO "postgres";


COMMENT ON COLUMN "public"."funnel_steps"."content_page_id" IS 'References a content page when step type is "content_page". Must be NULL for other step types.';



CREATE TABLE IF NOT EXISTS "public"."funnel_triage_settings" (
    "funnel_id" "uuid" NOT NULL,
    "overdue_days" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "funnel_triage_settings_overdue_days_check" CHECK (("overdue_days" > 0))
);


ALTER TABLE "public"."funnel_triage_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."funnel_triage_settings" IS 'E78.6: Per-funnel triage SLA configuration. Defines custom overdue_days threshold for specific funnels. Falls back to TRIAGE_SLA_DAYS_DEFAULT env var or 7 days default.';



COMMENT ON COLUMN "public"."funnel_triage_settings"."funnel_id" IS 'Foreign key to funnels_catalog. One setting per funnel.';



COMMENT ON COLUMN "public"."funnel_triage_settings"."overdue_days" IS 'Number of days before a triage case for this funnel is marked as overdue. Must be positive.';



COMMENT ON COLUMN "public"."funnel_triage_settings"."created_by" IS 'User who created this configuration (typically a clinician or admin).';



COMMENT ON COLUMN "public"."funnel_triage_settings"."updated_by" IS 'User who last updated this configuration.';



CREATE TABLE IF NOT EXISTS "public"."funnel_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "version" "text" NOT NULL,
    "questionnaire_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "content_manifest" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "algorithm_bundle_version" "text" DEFAULT 'v1.0.0'::"text" NOT NULL,
    "prompt_version" "text" DEFAULT '1.0'::"text" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "rollout_percent" integer DEFAULT 100,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "status" "public"."funnel_version_status" DEFAULT 'published'::"public"."funnel_version_status" NOT NULL,
    "parent_version_id" "uuid",
    "validation_errors" "jsonb" DEFAULT '[]'::"jsonb",
    "last_validated_at" timestamp with time zone,
    "published_at" timestamp with time zone,
    "published_by" "uuid",
    CONSTRAINT "check_algorithm_bundle_version_not_empty" CHECK (("length"(TRIM(BOTH FROM "algorithm_bundle_version")) > 0)),
    CONSTRAINT "check_prompt_version_not_empty" CHECK (("length"(TRIM(BOTH FROM "prompt_version")) > 0)),
    CONSTRAINT "funnel_versions_rollout_percent_check" CHECK ((("rollout_percent" >= 0) AND ("rollout_percent" <= 100)))
);


ALTER TABLE "public"."funnel_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."funnel_versions" IS 'V0.5: Versioned funnel configurations with JSONB for dynamic content. E74.3: Extended with draft/publish workflow.';



COMMENT ON COLUMN "public"."funnel_versions"."questionnaire_config" IS 'JSONB: Questions, steps, validation rules';



COMMENT ON COLUMN "public"."funnel_versions"."content_manifest" IS 'JSONB: Content pages, media, flow structure';



COMMENT ON COLUMN "public"."funnel_versions"."algorithm_bundle_version" IS 'V05-I02.2: Required version pointer to algorithm bundle';



COMMENT ON COLUMN "public"."funnel_versions"."prompt_version" IS 'V05-I02.2: Required version for content/report generation prompts';



COMMENT ON COLUMN "public"."funnel_versions"."rollout_percent" IS 'Percentage of users receiving this version (A/B testing)';



COMMENT ON COLUMN "public"."funnel_versions"."status" IS 'E74.3: Version status - draft (editable), published (active for patients), archived (deprecated)';



COMMENT ON COLUMN "public"."funnel_versions"."parent_version_id" IS 'E74.3: Reference to parent version if this is a draft or derived version';



COMMENT ON COLUMN "public"."funnel_versions"."validation_errors" IS 'E74.3: Array of validation errors from last validation check';



COMMENT ON COLUMN "public"."funnel_versions"."last_validated_at" IS 'E74.3: Timestamp of last validation check';



COMMENT ON COLUMN "public"."funnel_versions"."published_at" IS 'E74.3: Timestamp when version was published';



COMMENT ON COLUMN "public"."funnel_versions"."published_by" IS 'E74.3: User who published this version';



CREATE TABLE IF NOT EXISTS "public"."funnels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "default_theme" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."funnels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funnels_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "pillar_id" "text",
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "org_id" "uuid",
    "est_duration_min" integer,
    "outcomes" "jsonb" DEFAULT '[]'::"jsonb",
    "default_version_id" "uuid",
    "published" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."funnels_catalog" OWNER TO "postgres";


COMMENT ON TABLE "public"."funnels_catalog" IS 'V0.5: Master catalog of available funnels';



COMMENT ON COLUMN "public"."funnels_catalog"."pillar_id" IS 'Reference to health pillar (e.g., "stress", "sleep", "nutrition")';



COMMENT ON COLUMN "public"."funnels_catalog"."org_id" IS 'Organization scope (NULL for system-wide funnels)';



COMMENT ON COLUMN "public"."funnels_catalog"."est_duration_min" IS 'Estimated duration in minutes';



COMMENT ON COLUMN "public"."funnels_catalog"."outcomes" IS 'JSONB array of expected outcomes/tags';



COMMENT ON COLUMN "public"."funnels_catalog"."default_version_id" IS 'Default version for new assessments';



CREATE TABLE IF NOT EXISTS "public"."idempotency_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idempotency_key" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint_path" "text" NOT NULL,
    "http_method" "text" DEFAULT 'POST'::"text" NOT NULL,
    "response_status" integer NOT NULL,
    "response_body" "jsonb" NOT NULL,
    "request_hash" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval) NOT NULL
);


ALTER TABLE "public"."idempotency_keys" OWNER TO "postgres";


COMMENT ON TABLE "public"."idempotency_keys" IS 'E6.2.4: Stores idempotency keys and cached responses for retry-safe write operations';



COMMENT ON COLUMN "public"."idempotency_keys"."idempotency_key" IS 'Client-provided idempotency key (UUID recommended)';



COMMENT ON COLUMN "public"."idempotency_keys"."user_id" IS 'User who initiated the request for security isolation';



COMMENT ON COLUMN "public"."idempotency_keys"."endpoint_path" IS 'Endpoint path to scope keys (e.g., /api/funnels/stress/assessments)';



COMMENT ON COLUMN "public"."idempotency_keys"."response_status" IS 'Cached HTTP status code from original request';



COMMENT ON COLUMN "public"."idempotency_keys"."response_body" IS 'Cached response body from original request';



COMMENT ON COLUMN "public"."idempotency_keys"."request_hash" IS 'SHA-256 hash of request payload for conflict detection';



COMMENT ON COLUMN "public"."idempotency_keys"."expires_at" IS 'Expiration timestamp (default 24 hours from creation)';



CREATE TABLE IF NOT EXISTS "public"."kpi_thresholds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kpi_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "metric_type" "text" NOT NULL,
    "warning_threshold" numeric,
    "critical_threshold" numeric,
    "target_threshold" numeric,
    "unit" "text",
    "evaluation_period_days" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "notify_on_breach" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "kpi_thresholds_metric_type_check" CHECK (("metric_type" = ANY (ARRAY['percentage'::"text", 'count'::"text", 'duration'::"text", 'score'::"text"])))
);


ALTER TABLE "public"."kpi_thresholds" OWNER TO "postgres";


COMMENT ON TABLE "public"."kpi_thresholds" IS 'V05-I09.4: Key Performance Indicator thresholds for monitoring and alerting';



COMMENT ON COLUMN "public"."kpi_thresholds"."kpi_key" IS 'Unique identifier for KPI (e.g., "assessment_completion_rate", "avg_response_time")';



COMMENT ON COLUMN "public"."kpi_thresholds"."warning_threshold" IS 'Threshold that triggers warning alerts';



COMMENT ON COLUMN "public"."kpi_thresholds"."critical_threshold" IS 'Threshold that triggers critical alerts';



COMMENT ON COLUMN "public"."kpi_thresholds"."target_threshold" IS 'Desired target value for the KPI';



COMMENT ON COLUMN "public"."kpi_thresholds"."evaluation_period_days" IS 'Number of days over which to evaluate the KPI (NULL = real-time)';



CREATE TABLE IF NOT EXISTS "public"."medical_validation_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "sections_id" "uuid",
    "validation_version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "engine_version" "text" NOT NULL,
    "overall_status" "public"."validation_status" NOT NULL,
    "overall_passed" boolean NOT NULL,
    "validation_data" "jsonb" NOT NULL,
    "flags_raised_count" integer DEFAULT 0 NOT NULL,
    "critical_flags_count" integer DEFAULT 0 NOT NULL,
    "warning_flags_count" integer DEFAULT 0 NOT NULL,
    "info_flags_count" integer DEFAULT 0 NOT NULL,
    "rules_evaluated_count" integer DEFAULT 0 NOT NULL,
    "validation_time_ms" integer DEFAULT 0 NOT NULL,
    "validated_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ruleset_hash" "text" NOT NULL
);


ALTER TABLE "public"."medical_validation_results" OWNER TO "postgres";


COMMENT ON TABLE "public"."medical_validation_results" IS 'V05-I05.5: Medical Validation Layer 1 results - rules-based contraindication/plausibility checks';



COMMENT ON COLUMN "public"."medical_validation_results"."id" IS 'Validation result unique identifier';



COMMENT ON COLUMN "public"."medical_validation_results"."job_id" IS 'Processing job reference (unique per job)';



COMMENT ON COLUMN "public"."medical_validation_results"."sections_id" IS 'Report sections reference (optional)';



COMMENT ON COLUMN "public"."medical_validation_results"."validation_version" IS 'Validation schema version (v1)';



COMMENT ON COLUMN "public"."medical_validation_results"."engine_version" IS 'Validation engine/rules version used';



COMMENT ON COLUMN "public"."medical_validation_results"."overall_status" IS 'Overall validation status (pass/flag/fail)';



COMMENT ON COLUMN "public"."medical_validation_results"."overall_passed" IS 'True if no critical flags (allows progression)';



COMMENT ON COLUMN "public"."medical_validation_results"."validation_data" IS 'Complete validation result (flags, section results, metadata)';



COMMENT ON COLUMN "public"."medical_validation_results"."flags_raised_count" IS 'Total number of flags raised';



COMMENT ON COLUMN "public"."medical_validation_results"."critical_flags_count" IS 'Number of critical flags (blocks progression)';



COMMENT ON COLUMN "public"."medical_validation_results"."warning_flags_count" IS 'Number of warning flags';



COMMENT ON COLUMN "public"."medical_validation_results"."info_flags_count" IS 'Number of info flags';



COMMENT ON COLUMN "public"."medical_validation_results"."rules_evaluated_count" IS 'Number of rules evaluated';



COMMENT ON COLUMN "public"."medical_validation_results"."validation_time_ms" IS 'Validation execution time in milliseconds';



COMMENT ON COLUMN "public"."medical_validation_results"."ruleset_hash" IS 'Deterministic SHA-256 hash of active ruleset (first 32 hex chars)';



CREATE TABLE IF NOT EXISTS "public"."navigation_item_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" NOT NULL,
    "navigation_item_id" "uuid" NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "custom_label" "text",
    "custom_icon" "text",
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "navigation_item_configs_order_check" CHECK (("order_index" >= 0)),
    CONSTRAINT "navigation_item_configs_role_check" CHECK (("role" = ANY (ARRAY['patient'::"text", 'clinician'::"text", 'admin'::"text", 'nurse'::"text"])))
);


ALTER TABLE "public"."navigation_item_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."navigation_item_configs" IS 'V05-I09.1: Role-specific navigation configuration overrides';



COMMENT ON COLUMN "public"."navigation_item_configs"."role" IS 'User role this config applies to';



COMMENT ON COLUMN "public"."navigation_item_configs"."is_enabled" IS 'Whether this item is shown for this role';



COMMENT ON COLUMN "public"."navigation_item_configs"."custom_label" IS 'Optional custom label override';



COMMENT ON COLUMN "public"."navigation_item_configs"."custom_icon" IS 'Optional custom icon override';



COMMENT ON COLUMN "public"."navigation_item_configs"."order_index" IS 'Display order for this role (0-based)';



CREATE TABLE IF NOT EXISTS "public"."navigation_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "route" "text" NOT NULL,
    "default_label" "text" NOT NULL,
    "default_icon" "text",
    "default_order" integer NOT NULL,
    "is_system" boolean DEFAULT true NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "navigation_items_default_order_check" CHECK (("default_order" >= 0)),
    CONSTRAINT "navigation_items_route_check" CHECK (("route" ~ '^/[a-z0-9/_-]*$'::"text"))
);


ALTER TABLE "public"."navigation_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."navigation_items" IS 'V05-I09.1: Defines available navigation items in the application';



COMMENT ON COLUMN "public"."navigation_items"."route" IS 'URL route path (e.g., /clinician, /admin/content)';



COMMENT ON COLUMN "public"."navigation_items"."default_label" IS 'Default label shown in navigation';



COMMENT ON COLUMN "public"."navigation_items"."default_icon" IS 'Icon identifier (lucide-react icon name)';



COMMENT ON COLUMN "public"."navigation_items"."default_order" IS 'Default display order (0-based)';



COMMENT ON COLUMN "public"."navigation_items"."is_system" IS 'System items cannot be deleted, only disabled';



CREATE TABLE IF NOT EXISTS "public"."notification_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "channel" "text" NOT NULL,
    "subject_template" "text",
    "body_template" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "is_system" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "notification_templates_channel_check" CHECK (("channel" = ANY (ARRAY['in_app'::"text", 'email'::"text", 'sms'::"text"])))
);


ALTER TABLE "public"."notification_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_templates" IS 'V05-I09.4: Reusable notification templates for system communications';



COMMENT ON COLUMN "public"."notification_templates"."template_key" IS 'Unique identifier for template (e.g., "report_ready", "followup_reminder")';



COMMENT ON COLUMN "public"."notification_templates"."variables" IS 'JSON array of variable names used in template (e.g., ["patient_name", "report_url"])';



COMMENT ON COLUMN "public"."notification_templates"."is_system" IS 'System templates cannot be deleted, only deactivated';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "channel" "text" NOT NULL,
    "template_key" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "scheduled_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sent_at" timestamp with time zone,
    "status" "public"."notification_status" DEFAULT 'scheduled'::"public"."notification_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "job_id" "uuid",
    "assessment_id" "uuid",
    "notification_type" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "subject" "text",
    "message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "consent_verified" boolean DEFAULT false,
    "consent_version" "text",
    "follow_up_at" timestamp with time zone,
    "follow_up_completed" boolean DEFAULT false,
    "expires_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "error_message" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'V05-I05.9: Notification delivery system (in-app + email infrastructure)';



COMMENT ON COLUMN "public"."notifications"."id" IS 'Notification unique identifier';



COMMENT ON COLUMN "public"."notifications"."user_id" IS 'Recipient user ID';



COMMENT ON COLUMN "public"."notifications"."channel" IS 'Delivery channel (in_app, email, sms)';



COMMENT ON COLUMN "public"."notifications"."template_key" IS 'Template identifier for content generation';



COMMENT ON COLUMN "public"."notifications"."payload" IS 'JSONB: Template variables and notification data';



COMMENT ON COLUMN "public"."notifications"."status" IS 'Delivery status (PENDING → SENT → DELIVERED → READ)';



COMMENT ON COLUMN "public"."notifications"."job_id" IS 'Related processing job (optional)';



COMMENT ON COLUMN "public"."notifications"."assessment_id" IS 'Related assessment (optional)';



COMMENT ON COLUMN "public"."notifications"."notification_type" IS 'Type: REPORT_READY, REVIEW_REQUESTED, ACTION_REQUIRED, etc.';



COMMENT ON COLUMN "public"."notifications"."priority" IS 'Priority level (low, medium, high, urgent)';



COMMENT ON COLUMN "public"."notifications"."subject" IS 'PHI-free notification subject';



COMMENT ON COLUMN "public"."notifications"."message" IS 'PHI-free notification message body';



COMMENT ON COLUMN "public"."notifications"."metadata" IS 'PHI-free metadata (links, actions, etc.)';



COMMENT ON COLUMN "public"."notifications"."consent_verified" IS 'Was user consent verified before sending?';



COMMENT ON COLUMN "public"."notifications"."consent_version" IS 'Version of consent that was verified';



COMMENT ON COLUMN "public"."notifications"."follow_up_at" IS 'When to trigger follow-up action (NULL if no follow-up)';



COMMENT ON COLUMN "public"."notifications"."follow_up_completed" IS 'Has follow-up been completed?';



COMMENT ON COLUMN "public"."notifications"."expires_at" IS 'When notification expires (optional)';



CREATE TABLE IF NOT EXISTS "public"."operational_settings_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "operation" "text" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "change_reason" "text",
    CONSTRAINT "operational_settings_audit_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."operational_settings_audit" OWNER TO "postgres";


COMMENT ON TABLE "public"."operational_settings_audit" IS 'V05-I09.4: Audit trail for all operational settings changes';



COMMENT ON COLUMN "public"."operational_settings_audit"."table_name" IS 'Name of the table that was modified';



COMMENT ON COLUMN "public"."operational_settings_audit"."old_values" IS 'JSONB snapshot of values before change';



COMMENT ON COLUMN "public"."operational_settings_audit"."new_values" IS 'JSONB snapshot of values after change';



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."organizations" IS 'V0.5: Organizations for multi-tenant support';



COMMENT ON COLUMN "public"."organizations"."settings" IS 'Organization-specific configuration (JSONB). E6.4.1: Can include pilot_enabled boolean for pilot eligibility.';



CREATE TABLE IF NOT EXISTS "public"."patient_funnels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "active_version_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "patient_funnels_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'completed'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."patient_funnels" OWNER TO "postgres";


COMMENT ON TABLE "public"."patient_funnels" IS 'V0.5: Patient-specific funnel instances tracking progress';



CREATE TABLE IF NOT EXISTS "public"."patient_measures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "stress_score" integer,
    "sleep_score" integer,
    "risk_level" "text" DEFAULT 'pending'::"text" NOT NULL,
    "report_id" "uuid",
    CONSTRAINT "patient_measures_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'moderate'::"text", 'high'::"text", 'pending'::"text"]))),
    CONSTRAINT "patient_measures_sleep_score_range" CHECK ((("sleep_score" IS NULL) OR (("sleep_score" >= 0) AND ("sleep_score" <= 100)))),
    CONSTRAINT "patient_measures_stress_score_range" CHECK ((("stress_score" IS NULL) OR (("stress_score" >= 0) AND ("stress_score" <= 100))))
);


ALTER TABLE "public"."patient_measures" OWNER TO "postgres";


COMMENT ON TABLE "public"."patient_measures" IS 'Patient measures with RLS: patients see own data, clinicians see all';



COMMENT ON COLUMN "public"."patient_measures"."id" IS 'Primary key - unique measurement identifier';



COMMENT ON COLUMN "public"."patient_measures"."patient_id" IS 'Patient identifier for this measurement';



COMMENT ON COLUMN "public"."patient_measures"."created_at" IS 'Timestamp when the measurement was first created';



CREATE TABLE IF NOT EXISTS "public"."patient_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "full_name" "text",
    "birth_year" integer,
    "sex" "text",
    "onboarding_status" "public"."onboarding_status_enum" DEFAULT 'not_started'::"public"."onboarding_status_enum" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "preferred_name" "text"
);


ALTER TABLE "public"."patient_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."patient_profiles" IS 'Patient profile data with RLS: patients see own data, clinicians see all';



COMMENT ON COLUMN "public"."patient_profiles"."onboarding_status" IS 'E6.4.2: Tracks patient onboarding progress (not_started, in_progress, completed)';



CREATE TABLE IF NOT EXISTS "public"."patient_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "patient_state_version" "text" DEFAULT '0.1'::"text" NOT NULL,
    "state_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_state" OWNER TO "postgres";


COMMENT ON TABLE "public"."patient_state" IS 'I2.1: Canonical patient state with versioning. Stores assessment progress, results summary, dialog context, activity, and metrics. RLS: patients see own state only.';



COMMENT ON COLUMN "public"."patient_state"."patient_state_version" IS 'Version of patient state schema (e.g., "0.1")';



COMMENT ON COLUMN "public"."patient_state"."state_data" IS 'JSONB containing assessment, results, dialog, activity, and metrics data';



CREATE OR REPLACE VIEW "public"."pending_account_deletions" AS
 SELECT "id" AS "user_id",
    "email",
    (("raw_user_meta_data" ->> 'deletion_requested_at'::"text"))::timestamp with time zone AS "deletion_requested_at",
    (("raw_user_meta_data" ->> 'deletion_scheduled_for'::"text"))::timestamp with time zone AS "deletion_scheduled_for",
    ("raw_user_meta_data" ->> 'deletion_reason'::"text") AS "deletion_reason",
    ("raw_user_meta_data" ->> 'account_status'::"text") AS "account_status",
    EXTRACT(day FROM ((("raw_user_meta_data" ->> 'deletion_scheduled_for'::"text"))::timestamp with time zone - "now"())) AS "days_remaining"
   FROM "auth"."users" "u"
  WHERE ((("raw_user_meta_data" ->> 'account_status'::"text") = 'deletion_pending'::"text") AND ((("raw_user_meta_data" ->> 'deletion_scheduled_for'::"text"))::timestamp with time zone > "now"()))
  ORDER BY (("raw_user_meta_data" ->> 'deletion_scheduled_for'::"text"))::timestamp with time zone;


ALTER VIEW "public"."pending_account_deletions" OWNER TO "postgres";


COMMENT ON VIEW "public"."pending_account_deletions" IS 'V05-I10.2: View of accounts pending deletion. For admin/system use only.';



CREATE TABLE IF NOT EXISTS "public"."pillars" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pillars" OWNER TO "postgres";


COMMENT ON TABLE "public"."pillars" IS 'Taxonomic pillars for organizing funnels into categories';



COMMENT ON COLUMN "public"."pillars"."key" IS 'Unique key for programmatic reference (e.g., stress, sleep, resilience)';



COMMENT ON COLUMN "public"."pillars"."sort_order" IS 'Display order for pillars (lower numbers first)';



CREATE TABLE IF NOT EXISTS "public"."pilot_flow_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    "patient_id" "uuid",
    "actor_role" "public"."user_role",
    "correlation_id" "text" NOT NULL,
    "event_type" "public"."pilot_event_type" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "from_state" "text",
    "to_state" "text",
    "payload_json" "jsonb" DEFAULT '{}'::"jsonb",
    "payload_hash" "text",
    CONSTRAINT "pilot_flow_events_correlation_id_length" CHECK (("length"("correlation_id") <= 64)),
    CONSTRAINT "pilot_flow_events_payload_size" CHECK (("pg_column_size"("payload_json") <= 2048))
);


ALTER TABLE "public"."pilot_flow_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."pilot_flow_events" IS 'E6.4.8: Append-only event log for pilot flow state transitions. PHI-safe telemetry for debugging and audit purposes.';



COMMENT ON COLUMN "public"."pilot_flow_events"."correlation_id" IS 'Unique correlation ID for tracing requests across flows (max 64 chars)';



COMMENT ON COLUMN "public"."pilot_flow_events"."event_type" IS 'Type of state transition event (triage, funnel, workup, escalation)';



COMMENT ON COLUMN "public"."pilot_flow_events"."entity_type" IS 'Type of entity (e.g., "triage", "funnel", "workup", "assessment")';



COMMENT ON COLUMN "public"."pilot_flow_events"."entity_id" IS 'UUID or identifier of the entity';



COMMENT ON COLUMN "public"."pilot_flow_events"."from_state" IS 'Previous state before transition (nullable for initial events)';



COMMENT ON COLUMN "public"."pilot_flow_events"."to_state" IS 'New state after transition (nullable for final events)';



COMMENT ON COLUMN "public"."pilot_flow_events"."payload_json" IS 'PHI-safe metadata: allowlist keys only (nextAction, tier, redFlag booleans, counts, stable identifiers). Max size: 2KB. Include payloadVersion field for schema evolution.';



COMMENT ON COLUMN "public"."pilot_flow_events"."payload_hash" IS 'Optional deterministic hash of payload for integrity verification';



CREATE TABLE IF NOT EXISTS "public"."pre_screening_calls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinician_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "is_suitable" boolean NOT NULL,
    "suitability_notes" "text",
    "red_flags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "red_flags_notes" "text",
    "recommended_tier" "text",
    "tier_notes" "text",
    "general_notes" "text",
    "call_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pre_screening_calls_recommended_tier_check" CHECK (("recommended_tier" = ANY (ARRAY['tier_1'::"text", 'tier_2'::"text", 'tier_3'::"text"])))
);


ALTER TABLE "public"."pre_screening_calls" OWNER TO "postgres";


COMMENT ON TABLE "public"."pre_screening_calls" IS 'V05-I08.2: Pre-screening call records for initial patient contact';



COMMENT ON COLUMN "public"."pre_screening_calls"."is_suitable" IS 'Whether patient is suitable for the program';



COMMENT ON COLUMN "public"."pre_screening_calls"."red_flags" IS 'JSON array of identified red flags';



COMMENT ON COLUMN "public"."pre_screening_calls"."recommended_tier" IS 'Recommended program tier (tier_1, tier_2, tier_3)';



CREATE TABLE IF NOT EXISTS "public"."priority_rankings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "risk_bundle_id" "uuid" NOT NULL,
    "ranking_version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "algorithm_version" "text" NOT NULL,
    "registry_version" "text" NOT NULL,
    "program_tier" "text",
    "ranked_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ranking_data" "jsonb" NOT NULL
);


ALTER TABLE "public"."priority_rankings" OWNER TO "postgres";


COMMENT ON TABLE "public"."priority_rankings" IS 'V05-I05.3: Deterministic priority rankings (Impact x Feasibility) tied to processing jobs';



COMMENT ON COLUMN "public"."priority_rankings"."ranking_version" IS 'Priority ranking schema version (e.g., v1)';



COMMENT ON COLUMN "public"."priority_rankings"."algorithm_version" IS 'Ranking algorithm version (e.g., 1.0.0)';



COMMENT ON COLUMN "public"."priority_rankings"."registry_version" IS 'Intervention registry version or deterministic hash';



COMMENT ON COLUMN "public"."priority_rankings"."program_tier" IS 'Optional program tier constraint for filtering interventions';



COMMENT ON COLUMN "public"."priority_rankings"."ranking_data" IS 'Complete PriorityRankingV1 JSON structure';



CREATE TABLE IF NOT EXISTS "public"."processing_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "correlation_id" "text" NOT NULL,
    "status" "public"."processing_status" DEFAULT 'queued'::"public"."processing_status" NOT NULL,
    "stage" "public"."processing_stage" DEFAULT 'pending'::"public"."processing_stage" NOT NULL,
    "attempt" integer DEFAULT 1 NOT NULL,
    "max_attempts" integer DEFAULT 3 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "errors" "jsonb" DEFAULT '[]'::"jsonb",
    "schema_version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "pdf_path" "text",
    "pdf_metadata" "jsonb",
    "pdf_generated_at" timestamp with time zone,
    "delivery_status" "text" DEFAULT 'NOT_READY'::"text" NOT NULL,
    "delivery_timestamp" timestamp with time zone,
    "delivery_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "delivery_attempt" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "processing_jobs_attempt_check" CHECK ((("attempt" >= 1) AND ("attempt" <= 10))),
    CONSTRAINT "processing_jobs_delivery_attempt_check" CHECK ((("delivery_attempt" >= 0) AND ("delivery_attempt" <= 5))),
    CONSTRAINT "processing_jobs_delivery_status_check" CHECK (("delivery_status" = ANY (ARRAY['NOT_READY'::"text", 'READY'::"text", 'DELIVERED'::"text", 'FAILED'::"text"]))),
    CONSTRAINT "processing_jobs_max_attempts_check" CHECK ((("max_attempts" >= 1) AND ("max_attempts" <= 10)))
);


ALTER TABLE "public"."processing_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."processing_jobs" IS 'V05-I05.1: Processing orchestrator jobs - tracks assessment processing pipeline';



COMMENT ON COLUMN "public"."processing_jobs"."id" IS 'Job unique identifier';



COMMENT ON COLUMN "public"."processing_jobs"."assessment_id" IS 'Assessment being processed (soft reference, no FK)';



COMMENT ON COLUMN "public"."processing_jobs"."correlation_id" IS 'Idempotency key for preventing duplicate jobs (combined with schema_version)';



COMMENT ON COLUMN "public"."processing_jobs"."status" IS 'Overall job status (queued, in_progress, completed, failed)';



COMMENT ON COLUMN "public"."processing_jobs"."stage" IS 'Current processing stage (deterministic progression)';



COMMENT ON COLUMN "public"."processing_jobs"."attempt" IS 'Current attempt number (1-indexed)';



COMMENT ON COLUMN "public"."processing_jobs"."max_attempts" IS 'Maximum retry attempts allowed';



COMMENT ON COLUMN "public"."processing_jobs"."errors" IS 'PHI-free redacted error log (JSONB array)';



COMMENT ON COLUMN "public"."processing_jobs"."schema_version" IS 'Contract version for schema evolution';



COMMENT ON COLUMN "public"."processing_jobs"."pdf_path" IS 'V05-I05.8: PHI-free storage path for generated PDF (format: reports/{job_id_hash}/{timestamp}.pdf)';



COMMENT ON COLUMN "public"."processing_jobs"."pdf_metadata" IS 'V05-I05.8: PDF generation metadata (fileSize, generatedAt, version, hash) - PHI-free';



COMMENT ON COLUMN "public"."processing_jobs"."pdf_generated_at" IS 'V05-I05.8: Timestamp when PDF was generated (for cache/cleanup tracking)';



COMMENT ON COLUMN "public"."processing_jobs"."delivery_status" IS 'V05-I05.9: Delivery state (NOT_READY, READY, DELIVERED, FAILED)';



COMMENT ON COLUMN "public"."processing_jobs"."delivery_timestamp" IS 'V05-I05.9: When delivery was completed (NULL if not delivered)';



COMMENT ON COLUMN "public"."processing_jobs"."delivery_metadata" IS 'V05-I05.9: PHI-free delivery metadata (notification IDs, errors)';



COMMENT ON COLUMN "public"."processing_jobs"."delivery_attempt" IS 'V05-I05.9: Delivery retry attempt counter (0-5)';



CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "help_text" "text",
    "question_type" "text" NOT NULL,
    "min_value" integer,
    "max_value" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reassessment_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_name" "text" NOT NULL,
    "description" "text",
    "funnel_id" "uuid",
    "trigger_condition" "jsonb" NOT NULL,
    "schedule_interval_days" integer,
    "schedule_cron" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "reassessment_rules_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "reassessment_rules_schedule_interval_days_check" CHECK (("schedule_interval_days" > 0)),
    CONSTRAINT "schedule_check" CHECK (((("schedule_interval_days" IS NOT NULL) AND ("schedule_cron" IS NULL)) OR (("schedule_interval_days" IS NULL) AND ("schedule_cron" IS NOT NULL))))
);


ALTER TABLE "public"."reassessment_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."reassessment_rules" IS 'V05-I09.4: Rules for scheduling patient re-assessments based on conditions';



COMMENT ON COLUMN "public"."reassessment_rules"."trigger_condition" IS 'JSONB object defining when rule triggers (e.g., {"risk_level": "high", "days_since_last": 30})';



COMMENT ON COLUMN "public"."reassessment_rules"."schedule_interval_days" IS 'Simple interval in days (mutually exclusive with schedule_cron)';



COMMENT ON COLUMN "public"."reassessment_rules"."schedule_cron" IS 'Cron expression for complex scheduling (mutually exclusive with schedule_interval_days)';



CREATE TABLE IF NOT EXISTS "public"."report_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "risk_bundle_id" "uuid" NOT NULL,
    "ranking_id" "uuid",
    "sections_version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "program_tier" "text",
    "sections_data" "jsonb" NOT NULL,
    "generation_time_ms" integer,
    "llm_call_count" integer DEFAULT 0,
    "fallback_count" integer DEFAULT 0,
    "generated_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "prompt_bundle_version" "text",
    "content_version" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."report_sections" OWNER TO "postgres";


COMMENT ON TABLE "public"."report_sections" IS 'V05-I05.4: Stores modular, versioned report sections generated from risk bundles and rankings. Includes prompt version tracking for reproducibility.';



COMMENT ON COLUMN "public"."report_sections"."job_id" IS 'Reference to processing_jobs table. One report sections bundle per job.';



COMMENT ON COLUMN "public"."report_sections"."sections_version" IS 'Schema version for the sections data structure (e.g., v1). Enables schema evolution.';



COMMENT ON COLUMN "public"."report_sections"."sections_data" IS 'Complete JSONB structure containing all sections with metadata, prompt versions, and generation details. Schema: ReportSectionsV1.';



COMMENT ON COLUMN "public"."report_sections"."generation_time_ms" IS 'Total time taken to generate all sections in milliseconds.';



COMMENT ON COLUMN "public"."report_sections"."llm_call_count" IS 'Number of LLM API calls made during generation (0 for template-only).';



COMMENT ON COLUMN "public"."report_sections"."fallback_count" IS 'Number of times fallback/template generation was used instead of LLM.';



COMMENT ON COLUMN "public"."report_sections"."prompt_bundle_version" IS 'Composite version string of all prompts used in generation (e.g., "overview-v1.0.0,recommendations-v1.0.0"). Enables audit trail.';



COMMENT ON COLUMN "public"."report_sections"."content_version" IS 'Monotonic version number for this job. Increments when re-run with different prompt versions. Enables version evolution tracking.';



CREATE TABLE IF NOT EXISTS "public"."report_sections_legacy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "section_key" "text" NOT NULL,
    "prompt_version" "text",
    "content" "text" NOT NULL,
    "citations_meta" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."report_sections_legacy" OWNER TO "postgres";


COMMENT ON TABLE "public"."report_sections_legacy" IS 'V0.5: Sectioned reports for modular content generation';



COMMENT ON COLUMN "public"."report_sections_legacy"."section_key" IS 'Section identifier (e.g., summary, risk_analysis, recommendations)';



COMMENT ON COLUMN "public"."report_sections_legacy"."citations_meta" IS 'JSONB: Section-specific citation metadata';



CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "score_numeric" integer,
    "sleep_score" integer,
    "risk_level" "text",
    "report_text_short" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "report_version" "text" DEFAULT '1.0'::"text" NOT NULL,
    "prompt_version" "text" DEFAULT '1.0'::"text" NOT NULL,
    "status" "public"."report_status" DEFAULT 'pending'::"public"."report_status",
    "safety_score" integer,
    "safety_findings" "jsonb" DEFAULT '{}'::"jsonb",
    "html_path" "text",
    "pdf_path" "text",
    "citations_meta" "jsonb" DEFAULT '{}'::"jsonb",
    "algorithm_version" "text",
    "funnel_version_id" "uuid",
    CONSTRAINT "reports_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'moderate'::"text", 'high'::"text"]))),
    CONSTRAINT "reports_safety_score_check" CHECK ((("safety_score" >= 0) AND ("safety_score" <= 100)))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."reports" IS 'Assessment reports with RLS: patients see own data, clinicians see all';



COMMENT ON COLUMN "public"."reports"."id" IS 'Primary key - unique report identifier';



COMMENT ON COLUMN "public"."reports"."assessment_id" IS 'Foreign key to assessments table';



COMMENT ON COLUMN "public"."reports"."score_numeric" IS 'Stress score (0-100)';



COMMENT ON COLUMN "public"."reports"."sleep_score" IS 'Sleep score (0-100)';



COMMENT ON COLUMN "public"."reports"."risk_level" IS 'Stress risk level: low, moderate, or high';



COMMENT ON COLUMN "public"."reports"."report_text_short" IS 'Short interpretation text generated by AMY';



COMMENT ON COLUMN "public"."reports"."created_at" IS 'Timestamp when the report was created';



COMMENT ON COLUMN "public"."reports"."updated_at" IS 'Timestamp when the report was last updated';



COMMENT ON COLUMN "public"."reports"."report_version" IS 'V0.5: Version of report format/structure';



COMMENT ON COLUMN "public"."reports"."prompt_version" IS 'V0.5: Version of AI prompt used for generation';



COMMENT ON COLUMN "public"."reports"."status" IS 'V0.5: Report generation status';



COMMENT ON COLUMN "public"."reports"."safety_score" IS 'V0.5: Safety/quality score (0-100)';



COMMENT ON COLUMN "public"."reports"."safety_findings" IS 'V0.5: JSONB - Safety analysis results';



COMMENT ON COLUMN "public"."reports"."citations_meta" IS 'V0.5: JSONB - Citation metadata and references';



COMMENT ON COLUMN "public"."reports"."algorithm_version" IS 'V05-I01.3: Version of algorithm used for scoring';



COMMENT ON COLUMN "public"."reports"."funnel_version_id" IS 'V05-I01.3: Reference to funnel version for reproducibility';



CREATE TABLE IF NOT EXISTS "public"."review_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "review_iteration" integer DEFAULT 1 NOT NULL,
    "status" "public"."review_status" DEFAULT 'PENDING'::"public"."review_status" NOT NULL,
    "queue_reasons" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_sampled" boolean DEFAULT false NOT NULL,
    "sampling_hash" "text",
    "sampling_config_version" "text",
    "validation_result_id" "uuid",
    "safety_check_id" "uuid",
    "reviewer_user_id" "uuid",
    "reviewer_role" "text",
    "decision_reason_code" "text",
    "decision_notes" "text",
    "decided_at" timestamp with time zone,
    "audit_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "review_records_decision_notes_length" CHECK ((("decision_notes" IS NULL) OR ("length"("decision_notes") <= 500))),
    CONSTRAINT "review_records_review_iteration_check" CHECK (("review_iteration" >= 1)),
    CONSTRAINT "review_records_reviewer_required" CHECK (((("status" = 'PENDING'::"public"."review_status") AND ("reviewer_user_id" IS NULL)) OR (("status" <> 'PENDING'::"public"."review_status") AND ("reviewer_user_id" IS NOT NULL))))
);


ALTER TABLE "public"."review_records" OWNER TO "postgres";


COMMENT ON TABLE "public"."review_records" IS 'V05-I05.7: Medical review queue records with approve/reject workflow';



COMMENT ON COLUMN "public"."review_records"."id" IS 'Review record unique identifier';



COMMENT ON COLUMN "public"."review_records"."job_id" IS 'Processing job being reviewed';



COMMENT ON COLUMN "public"."review_records"."review_iteration" IS 'Review iteration (allows re-review after changes)';



COMMENT ON COLUMN "public"."review_records"."status" IS 'Review decision status (PENDING, APPROVED, REJECTED, CHANGES_REQUESTED)';



COMMENT ON COLUMN "public"."review_records"."queue_reasons" IS 'Reason codes for queue inclusion (e.g., VALIDATION_FAIL, SAFETY_BLOCK, SAMPLED)';



COMMENT ON COLUMN "public"."review_records"."is_sampled" IS 'Whether this job was included via sampling';



COMMENT ON COLUMN "public"."review_records"."sampling_hash" IS 'Deterministic hash used for sampling decision';



COMMENT ON COLUMN "public"."review_records"."sampling_config_version" IS 'Version of sampling configuration used';



COMMENT ON COLUMN "public"."review_records"."validation_result_id" IS 'Reference to medical_validation_results (optional)';



COMMENT ON COLUMN "public"."review_records"."safety_check_id" IS 'Reference to safety_check_results (optional)';



COMMENT ON COLUMN "public"."review_records"."reviewer_user_id" IS 'User ID of reviewer (no PHI, just reference)';



COMMENT ON COLUMN "public"."review_records"."reviewer_role" IS 'Role of reviewer at decision time';



COMMENT ON COLUMN "public"."review_records"."decision_reason_code" IS 'Coded reason for decision (no PHI)';



COMMENT ON COLUMN "public"."review_records"."decision_notes" IS 'Optional redacted notes (max 500 chars, no PHI)';



COMMENT ON COLUMN "public"."review_records"."decided_at" IS 'Timestamp of decision';



COMMENT ON COLUMN "public"."review_records"."audit_metadata" IS 'PHI-free audit metadata (JSONB)';



CREATE TABLE IF NOT EXISTS "public"."risk_bundles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "risk_bundle_version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "algorithm_version" "text" NOT NULL,
    "funnel_version" "text",
    "calculated_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bundle_data" "jsonb" NOT NULL
);


ALTER TABLE "public"."risk_bundles" OWNER TO "postgres";


COMMENT ON TABLE "public"."risk_bundles" IS 'V05-I05.2: Deterministic risk calculation bundles tied to processing jobs';



COMMENT ON COLUMN "public"."risk_bundles"."risk_bundle_version" IS 'Risk bundle schema version (e.g., v1)';



COMMENT ON COLUMN "public"."risk_bundles"."algorithm_version" IS 'Algorithm version from funnel manifest';



COMMENT ON COLUMN "public"."risk_bundles"."bundle_data" IS 'Complete RiskBundleV1 JSON structure';



CREATE TABLE IF NOT EXISTS "public"."rls_test_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "test_name" "text" NOT NULL,
    "test_user" "text" NOT NULL,
    "expected_result" "text" NOT NULL,
    "actual_result" "text",
    "passed" boolean,
    "tested_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);


ALTER TABLE "public"."rls_test_results" OWNER TO "postgres";


COMMENT ON TABLE "public"."rls_test_results" IS 'Optional table for documenting manual RLS test results';



CREATE TABLE IF NOT EXISTS "public"."safety_check_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "sections_id" "uuid" NOT NULL,
    "safety_version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "prompt_version" "text" NOT NULL,
    "model_provider" "text" NOT NULL,
    "model_name" "text",
    "model_temperature" numeric(3,2),
    "model_max_tokens" integer,
    "overall_action" "public"."safety_action" NOT NULL,
    "safety_score" integer NOT NULL,
    "overall_severity" "text" NOT NULL,
    "check_data" "jsonb" NOT NULL,
    "findings_count" integer DEFAULT 0 NOT NULL,
    "critical_findings_count" integer DEFAULT 0 NOT NULL,
    "high_findings_count" integer DEFAULT 0 NOT NULL,
    "medium_findings_count" integer DEFAULT 0 NOT NULL,
    "low_findings_count" integer DEFAULT 0 NOT NULL,
    "evaluation_time_ms" integer DEFAULT 0 NOT NULL,
    "llm_call_count" integer DEFAULT 0 NOT NULL,
    "prompt_tokens" integer,
    "completion_tokens" integer,
    "total_tokens" integer,
    "fallback_used" boolean DEFAULT false NOT NULL,
    "evaluation_key_hash" "text",
    "evaluated_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "safety_check_results_safety_score_check" CHECK ((("safety_score" >= 0) AND ("safety_score" <= 100)))
);


ALTER TABLE "public"."safety_check_results" OWNER TO "postgres";


COMMENT ON TABLE "public"."safety_check_results" IS 'V05-I05.6: Medical Validation Layer 2 results - AI-powered safety assessments';



COMMENT ON COLUMN "public"."safety_check_results"."id" IS 'Safety check result unique identifier';



COMMENT ON COLUMN "public"."safety_check_results"."job_id" IS 'Processing job reference (unique per job)';



COMMENT ON COLUMN "public"."safety_check_results"."sections_id" IS 'Report sections reference';



COMMENT ON COLUMN "public"."safety_check_results"."safety_version" IS 'Safety check schema version (v1)';



COMMENT ON COLUMN "public"."safety_check_results"."prompt_version" IS 'Prompt version used for evaluation';



COMMENT ON COLUMN "public"."safety_check_results"."overall_action" IS 'Recommended action (PASS/FLAG/BLOCK/UNKNOWN)';



COMMENT ON COLUMN "public"."safety_check_results"."safety_score" IS 'Overall safety score (0-100, higher = safer)';



COMMENT ON COLUMN "public"."safety_check_results"."overall_severity" IS 'Overall severity level';



COMMENT ON COLUMN "public"."safety_check_results"."check_data" IS 'Complete safety check result (findings, reasoning, metadata)';



COMMENT ON COLUMN "public"."safety_check_results"."evaluation_key_hash" IS 'Hash for idempotent evaluation (sectionsId + promptVersion)';



CREATE TABLE IF NOT EXISTS "public"."shipment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "created_by_user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_status" "public"."shipment_status",
    "event_description" "text",
    "location" "text",
    "carrier" "text",
    "tracking_number" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "event_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shipment_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."shipment_events" IS 'V05-I08.3: Event log for shipment lifecycle tracking';



COMMENT ON COLUMN "public"."shipment_events"."event_type" IS 'Event type (status_changed, tracking_updated, reminder_sent, note_added, etc.)';



COMMENT ON COLUMN "public"."shipment_events"."event_status" IS 'Shipment status at time of event (nullable for non-status events)';



CREATE TABLE IF NOT EXISTS "public"."support_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "created_by_user_id" "uuid",
    "assigned_to_user_id" "uuid",
    "escalated_task_id" "uuid",
    "category" "public"."support_case_category" DEFAULT 'general'::"public"."support_case_category" NOT NULL,
    "priority" "public"."support_case_priority" DEFAULT 'medium'::"public"."support_case_priority" NOT NULL,
    "status" "public"."support_case_status" DEFAULT 'open'::"public"."support_case_status" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text",
    "notes" "text",
    "resolution_notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "escalated_at" timestamp with time zone,
    "escalated_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "closed_at" timestamp with time zone
);


ALTER TABLE "public"."support_cases" OWNER TO "postgres";


COMMENT ON TABLE "public"."support_cases" IS 'V05-I08.4: Support cases for patient support documentation and escalation workflow';



COMMENT ON COLUMN "public"."support_cases"."patient_id" IS 'Patient this support case is about';



COMMENT ON COLUMN "public"."support_cases"."organization_id" IS 'Organization context for multi-tenant isolation';



COMMENT ON COLUMN "public"."support_cases"."created_by_user_id" IS 'User who created this support case (patient or staff)';



COMMENT ON COLUMN "public"."support_cases"."assigned_to_user_id" IS 'User assigned to handle this support case';



COMMENT ON COLUMN "public"."support_cases"."escalated_task_id" IS 'Task ID if this case was escalated to clinician';



COMMENT ON COLUMN "public"."support_cases"."subject" IS 'Brief summary of the support case';



COMMENT ON COLUMN "public"."support_cases"."description" IS 'Detailed description of the issue or request';



COMMENT ON COLUMN "public"."support_cases"."notes" IS 'Internal notes about the case (staff only)';



COMMENT ON COLUMN "public"."support_cases"."resolution_notes" IS 'Notes about how the case was resolved';



COMMENT ON COLUMN "public"."support_cases"."metadata" IS 'Additional metadata (JSONB)';



COMMENT ON COLUMN "public"."support_cases"."escalated_at" IS 'When this case was escalated to a clinician';



COMMENT ON COLUMN "public"."support_cases"."escalated_by_user_id" IS 'User who escalated this case';



CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "assessment_id" "uuid",
    "created_by_role" "public"."user_role",
    "assigned_to_role" "public"."user_role",
    "task_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "public"."task_status" DEFAULT 'pending'::"public"."task_status" NOT NULL,
    "due_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "organization_id" "uuid",
    "assigned_to_user_id" "uuid"
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON TABLE "public"."tasks" IS 'V0.5: Task management with role-based assignment';



COMMENT ON COLUMN "public"."tasks"."task_type" IS 'Task type (e.g., review_assessment, schedule_followup, contact_patient)';



COMMENT ON COLUMN "public"."tasks"."payload" IS 'JSONB: Task-specific data and parameters';



COMMENT ON COLUMN "public"."tasks"."organization_id" IS 'V05-I07.4: Organization for multi-tenant isolation. Set server-side, not client-trusted.';



COMMENT ON COLUMN "public"."tasks"."assigned_to_user_id" IS 'V05-I08.1: User-level task assignment. Nurses can only see tasks assigned to them (RLS enforced). Clinicians/admins see all org tasks.';



CREATE TABLE IF NOT EXISTS "public"."triage_case_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "funnel_id" "uuid",
    "action_type" "public"."triage_action_type" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "triage_case_actions_payload_not_null" CHECK (("payload" IS NOT NULL))
);


ALTER TABLE "public"."triage_case_actions" OWNER TO "postgres";


COMMENT ON TABLE "public"."triage_case_actions" IS 'E78.4: Records HITL interventions on triage cases. Actions are append-only and never deleted by auto-jobs.';



COMMENT ON COLUMN "public"."triage_case_actions"."id" IS 'Unique identifier for the action';



COMMENT ON COLUMN "public"."triage_case_actions"."created_at" IS 'Timestamp when the action was performed';



COMMENT ON COLUMN "public"."triage_case_actions"."created_by" IS 'Clinician/admin who performed the action';



COMMENT ON COLUMN "public"."triage_case_actions"."patient_id" IS 'Patient ID associated with the case';



COMMENT ON COLUMN "public"."triage_case_actions"."assessment_id" IS 'Assessment ID (case_id) being acted upon';



COMMENT ON COLUMN "public"."triage_case_actions"."funnel_id" IS 'Funnel ID associated with the case (denormalized for performance)';



COMMENT ON COLUMN "public"."triage_case_actions"."action_type" IS 'Type of action: acknowledge | snooze | close | reopen | manual_flag | clear_manual_flag | add_note';



COMMENT ON COLUMN "public"."triage_case_actions"."payload" IS 'Action-specific metadata (e.g., snoozed_until, note, severity)';



CREATE OR REPLACE VIEW "public"."triage_cases_v1" AS
 WITH "latest_jobs" AS (
         SELECT DISTINCT ON ("processing_jobs"."assessment_id") "processing_jobs"."assessment_id",
            "processing_jobs"."id" AS "job_id",
            "processing_jobs"."status" AS "job_status",
            "processing_jobs"."stage" AS "job_stage",
            "processing_jobs"."attempt",
            "processing_jobs"."max_attempts",
            "processing_jobs"."delivery_status",
            "processing_jobs"."created_at" AS "job_created_at"
           FROM "public"."processing_jobs"
          ORDER BY "processing_jobs"."assessment_id", "processing_jobs"."created_at" DESC
        ), "latest_reviews" AS (
         SELECT DISTINCT ON ("pj"."assessment_id") "pj"."assessment_id",
            "rr"."status" AS "review_status",
            "rr"."decided_at"
           FROM ("public"."review_records" "rr"
             JOIN "public"."processing_jobs" "pj" ON (("pj"."id" = "rr"."job_id")))
          ORDER BY "pj"."assessment_id", "rr"."created_at" DESC
        ), "latest_snooze" AS (
         SELECT DISTINCT ON ("triage_case_actions"."assessment_id") "triage_case_actions"."assessment_id",
            ("triage_case_actions"."payload" ->> 'snoozed_until'::"text") AS "snoozed_until_str",
            "triage_case_actions"."created_at" AS "snooze_created_at"
           FROM "public"."triage_case_actions"
          WHERE ("triage_case_actions"."action_type" = 'snooze'::"public"."triage_action_type")
          ORDER BY "triage_case_actions"."assessment_id", "triage_case_actions"."created_at" DESC
        ), "latest_close_reopen" AS (
         SELECT DISTINCT ON ("triage_case_actions"."assessment_id") "triage_case_actions"."assessment_id",
            "triage_case_actions"."action_type",
            "triage_case_actions"."created_at" AS "close_reopen_at"
           FROM "public"."triage_case_actions"
          WHERE ("triage_case_actions"."action_type" = ANY (ARRAY['close'::"public"."triage_action_type", 'reopen'::"public"."triage_action_type"]))
          ORDER BY "triage_case_actions"."assessment_id", "triage_case_actions"."created_at" DESC
        ), "latest_manual_flag" AS (
         SELECT DISTINCT ON ("triage_case_actions"."assessment_id") "triage_case_actions"."assessment_id",
            "triage_case_actions"."action_type",
            ("triage_case_actions"."payload" ->> 'severity'::"text") AS "flag_severity",
            ("triage_case_actions"."payload" ->> 'reason'::"text") AS "flag_reason",
            "triage_case_actions"."created_at" AS "flag_created_at"
           FROM "public"."triage_case_actions"
          WHERE ("triage_case_actions"."action_type" = ANY (ARRAY['manual_flag'::"public"."triage_action_type", 'clear_manual_flag'::"public"."triage_action_type"]))
          ORDER BY "triage_case_actions"."assessment_id", "triage_case_actions"."created_at" DESC
        ), "latest_acknowledge" AS (
         SELECT DISTINCT ON ("triage_case_actions"."assessment_id") "triage_case_actions"."assessment_id",
            "triage_case_actions"."created_at" AS "acknowledged_at"
           FROM "public"."triage_case_actions"
          WHERE ("triage_case_actions"."action_type" = 'acknowledge'::"public"."triage_action_type")
          ORDER BY "triage_case_actions"."assessment_id", "triage_case_actions"."created_at" DESC
        ), "funnel_sla_config" AS (
         SELECT "a_1"."id" AS "assessment_id",
            "a_1"."funnel_id",
            COALESCE("fts"."overdue_days", 7) AS "sla_days"
           FROM ("public"."assessments" "a_1"
             LEFT JOIN "public"."funnel_triage_settings" "fts" ON (("fts"."funnel_id" = "a_1"."funnel_id")))
        ), "attention_computation" AS (
         SELECT "a_1"."id" AS "assessment_id",
            "array_remove"(ARRAY[
                CASE
                    WHEN ((EXISTS ( SELECT 1
                       FROM "public"."reports" "r"
                      WHERE (("r"."assessment_id" = "a_1"."id") AND ("r"."risk_level" = 'high'::"text")))) OR (EXISTS ( SELECT 1
                       FROM ("public"."risk_bundles" "rb"
                         JOIN "latest_jobs" "lj_1" ON (("lj_1"."job_id" = "rb"."job_id")))
                      WHERE (("lj_1"."assessment_id" = "a_1"."id") AND (("rb"."bundle_data" ->> 'overall_risk_level'::"text") = 'critical'::"text")))) OR (EXISTS ( SELECT 1
                       FROM ("public"."safety_check_results" "scr"
                         JOIN "latest_jobs" "lj_1" ON (("lj_1"."job_id" = "scr"."job_id")))
                      WHERE (("lj_1"."assessment_id" = "a_1"."id") AND ("scr"."overall_action" = 'BLOCK'::"public"."safety_action"))))) THEN 'critical_flag'::"text"
                    ELSE NULL::"text"
                END,
                CASE
                    WHEN (("a_1"."status" = 'in_progress'::"public"."assessment_status") AND ("a_1"."started_at" < ("now"() - (("fsc_1"."sla_days" || ' days'::"text"))::interval)) AND ("a_1"."completed_at" IS NULL)) THEN 'overdue'::"text"
                    ELSE NULL::"text"
                END,
                CASE
                    WHEN (("a_1"."status" = 'completed'::"public"."assessment_status") AND ("a_1"."completed_at" < ("now"() - '2 days'::interval)) AND (NOT (EXISTS ( SELECT 1
                       FROM "latest_reviews" "lr_1"
                      WHERE (("lr_1"."assessment_id" = "a_1"."id") AND ("lr_1"."review_status" = ANY (ARRAY['APPROVED'::"public"."review_status", 'REJECTED'::"public"."review_status"]))))))) THEN 'overdue'::"text"
                    ELSE NULL::"text"
                END,
                CASE
                    WHEN ((EXISTS ( SELECT 1
                       FROM "latest_jobs" "lj_1"
                      WHERE (("lj_1"."assessment_id" = "a_1"."id") AND ("lj_1"."job_status" = 'failed'::"public"."processing_status") AND ("lj_1"."attempt" >= "lj_1"."max_attempts")))) OR (("a_1"."status" = 'in_progress'::"public"."assessment_status") AND ("a_1"."started_at" < ("now"() - ((("fsc_1"."sla_days" * 2) || ' days'::"text"))::interval)) AND ("a_1"."completed_at" IS NULL))) THEN 'stuck'::"text"
                    ELSE NULL::"text"
                END,
                CASE
                    WHEN (("a_1"."status" = 'completed'::"public"."assessment_status") AND ("a_1"."workup_status" = 'ready_for_review'::"public"."workup_status") AND (NOT (EXISTS ( SELECT 1
                       FROM "latest_reviews" "lr_1"
                      WHERE (("lr_1"."assessment_id" = "a_1"."id") AND ("lr_1"."review_status" = ANY (ARRAY['APPROVED'::"public"."review_status", 'REJECTED'::"public"."review_status"]))))))) THEN 'review_ready'::"text"
                    ELSE NULL::"text"
                END,
                CASE
                    WHEN ("lmf_1"."action_type" = 'manual_flag'::"public"."triage_action_type") THEN 'manual_flag'::"text"
                    ELSE NULL::"text"
                END,
                CASE
                    WHEN (("a_1"."workup_status" = 'needs_more_data'::"public"."workup_status") AND ("a_1"."status" = 'in_progress'::"public"."assessment_status")) THEN 'missing_data'::"text"
                    ELSE NULL::"text"
                END], NULL::"text") AS "attention_items_array"
           FROM (("public"."assessments" "a_1"
             LEFT JOIN "funnel_sla_config" "fsc_1" ON (("fsc_1"."assessment_id" = "a_1"."id")))
             LEFT JOIN "latest_manual_flag" "lmf_1" ON (("lmf_1"."assessment_id" = "a_1"."id")))
        )
 SELECT "a"."id" AS "case_id",
    "a"."patient_id",
    "a"."funnel_id",
        CASE
            WHEN ("lcr"."action_type" = 'close'::"public"."triage_action_type") THEN 'resolved'::"text"
            WHEN (("ls"."snoozed_until_str" IS NOT NULL) AND (("ls"."snoozed_until_str")::timestamp with time zone > "now"())) THEN 'snoozed'::"text"
            WHEN (("a"."status" = 'in_progress'::"public"."assessment_status") AND ("a"."workup_status" = 'needs_more_data'::"public"."workup_status") AND ("a"."completed_at" IS NULL)) THEN 'needs_input'::"text"
            WHEN (("a"."status" = 'in_progress'::"public"."assessment_status") AND ("a"."workup_status" IS NULL) AND ("a"."completed_at" IS NULL) AND (NOT (EXISTS ( SELECT 1
               FROM "latest_jobs" "lj_1"
              WHERE (("lj_1"."assessment_id" = "a"."id") AND ("lj_1"."job_status" = 'failed'::"public"."processing_status")))))) THEN 'in_progress'::"text"
            WHEN (("a"."status" = 'completed'::"public"."assessment_status") AND ("a"."workup_status" = 'ready_for_review'::"public"."workup_status") AND (NOT (EXISTS ( SELECT 1
               FROM "latest_reviews" "lr_1"
              WHERE (("lr_1"."assessment_id" = "a"."id") AND ("lr_1"."review_status" = ANY (ARRAY['APPROVED'::"public"."review_status", 'REJECTED'::"public"."review_status"]))))))) THEN 'ready_for_review'::"text"
            WHEN (("a"."status" = 'completed'::"public"."assessment_status") AND ((EXISTS ( SELECT 1
               FROM "latest_reviews" "lr_1"
              WHERE (("lr_1"."assessment_id" = "a"."id") AND ("lr_1"."review_status" = 'APPROVED'::"public"."review_status")))) OR (EXISTS ( SELECT 1
               FROM "latest_jobs" "lj_1"
              WHERE (("lj_1"."assessment_id" = "a"."id") AND ("lj_1"."delivery_status" = 'DELIVERED'::"text")))))) THEN 'resolved'::"text"
            ELSE 'in_progress'::"text"
        END AS "case_state",
    "ac"."attention_items_array" AS "attention_items",
        CASE
            WHEN ('critical_flag'::"text" = ANY ("ac"."attention_items_array")) THEN 'critical'::"text"
            WHEN (('overdue'::"text" = ANY ("ac"."attention_items_array")) OR ('stuck'::"text" = ANY ("ac"."attention_items_array"))) THEN 'warn'::"text"
            WHEN ('manual_flag'::"text" = ANY ("ac"."attention_items_array")) THEN 'warn'::"text"
            WHEN ("array_length"("ac"."attention_items_array", 1) > 0) THEN 'info'::"text"
            ELSE 'none'::"text"
        END AS "attention_level",
        CASE
            WHEN (("a"."status" = 'in_progress'::"public"."assessment_status") AND ("a"."workup_status" = 'needs_more_data'::"public"."workup_status")) THEN 'patient_provide_data'::"text"
            WHEN (("a"."status" = 'completed'::"public"."assessment_status") AND ("a"."workup_status" = 'ready_for_review'::"public"."workup_status")) THEN 'clinician_review'::"text"
            WHEN ("a"."status" = 'completed'::"public"."assessment_status") THEN 'none'::"text"
            ELSE 'patient_continue'::"text"
        END AS "next_action",
    "a"."started_at" AS "assigned_at",
    GREATEST("a"."started_at", COALESCE("lj"."job_created_at", "a"."started_at"), COALESCE("lr"."decided_at", "a"."started_at")) AS "last_activity_at",
    "a"."started_at" AS "updated_at",
    "a"."completed_at",
        CASE
            WHEN ("lcr"."action_type" = 'close'::"public"."triage_action_type") THEN false
            WHEN (("a"."status" = 'completed'::"public"."assessment_status") AND ((EXISTS ( SELECT 1
               FROM "latest_reviews" "lr2"
              WHERE (("lr2"."assessment_id" = "a"."id") AND ("lr2"."review_status" = 'APPROVED'::"public"."review_status")))) OR (EXISTS ( SELECT 1
               FROM "latest_jobs" "lj2"
              WHERE (("lj2"."assessment_id" = "a"."id") AND ("lj2"."delivery_status" = 'DELIVERED'::"text")))))) THEN false
            WHEN (("ls"."snoozed_until_str" IS NOT NULL) AND (("ls"."snoozed_until_str")::timestamp with time zone > "now"())) THEN false
            ELSE true
        END AS "is_active",
    ("ls"."snoozed_until_str")::timestamp with time zone AS "snoozed_until",
        CASE
            WHEN ("lcr"."action_type" = 'close'::"public"."triage_action_type") THEN true
            ELSE false
        END AS "is_manually_closed",
        CASE
            WHEN ("lmf"."action_type" = 'manual_flag'::"public"."triage_action_type") THEN true
            ELSE false
        END AS "has_manual_flag",
    "lmf"."flag_severity" AS "manual_flag_severity",
    "lmf"."flag_reason" AS "manual_flag_reason",
    "la"."acknowledged_at",
    "fsc"."sla_days",
    ("a"."started_at" + (("fsc"."sla_days" || ' days'::"text"))::interval) AS "due_at",
    "a"."funnel_id" AS "funnel_id_enrichment"
   FROM (((((((("public"."assessments" "a"
     LEFT JOIN "latest_jobs" "lj" ON (("lj"."assessment_id" = "a"."id")))
     LEFT JOIN "latest_reviews" "lr" ON (("lr"."assessment_id" = "a"."id")))
     LEFT JOIN "latest_snooze" "ls" ON (("ls"."assessment_id" = "a"."id")))
     LEFT JOIN "latest_close_reopen" "lcr" ON (("lcr"."assessment_id" = "a"."id")))
     LEFT JOIN "latest_manual_flag" "lmf" ON (("lmf"."assessment_id" = "a"."id")))
     LEFT JOIN "latest_acknowledge" "la" ON (("la"."assessment_id" = "a"."id")))
     LEFT JOIN "funnel_sla_config" "fsc" ON (("fsc"."assessment_id" = "a"."id")))
     JOIN "attention_computation" "ac" ON (("ac"."assessment_id" = "a"."id")));


ALTER VIEW "public"."triage_cases_v1" OWNER TO "postgres";


COMMENT ON VIEW "public"."triage_cases_v1" IS 'E78.5: Enhanced SSOT aggregation view for triage inbox with HITL action integration and E78.6 configurable SLA. Provides deterministic case states with effective state computation from manual interventions. Includes snoozed_until, is_manually_closed, manual_flag details, acknowledged_at, and configurable SLA (due_at, sla_days).';



CREATE TABLE IF NOT EXISTS "public"."triage_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "correlation_id" "text" NOT NULL,
    "tier" "text" NOT NULL,
    "next_action" "text" NOT NULL,
    "red_flags" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "input_hash" "text" NOT NULL,
    "rules_version" "text" NOT NULL,
    "rationale" "text",
    CONSTRAINT "triage_sessions_correlation_id_length" CHECK (("length"("correlation_id") <= 64)),
    CONSTRAINT "triage_sessions_input_hash_check" CHECK (("length"("input_hash") = 64)),
    CONSTRAINT "triage_sessions_next_action_check" CHECK (("next_action" = ANY (ARRAY['SHOW_CONTENT'::"text", 'START_FUNNEL_A'::"text", 'START_FUNNEL_B'::"text", 'RESUME_FUNNEL'::"text", 'SHOW_ESCALATION'::"text"]))),
    CONSTRAINT "triage_sessions_rationale_length" CHECK ((("rationale" IS NULL) OR ("length"("rationale") <= 280))),
    CONSTRAINT "triage_sessions_tier_check" CHECK (("tier" = ANY (ARRAY['INFO'::"text", 'ASSESSMENT'::"text", 'ESCALATE'::"text"])))
);


ALTER TABLE "public"."triage_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."triage_sessions" IS 'E6.6.6: Triage session persistence for pilot debugging. PHI-safe: NO raw inputText stored, only SHA-256 hash. Stores triage decision metadata for observability.';



COMMENT ON COLUMN "public"."triage_sessions"."patient_id" IS 'Patient who submitted the triage request';



COMMENT ON COLUMN "public"."triage_sessions"."correlation_id" IS 'Correlation ID for request tracing (max 64 chars)';



COMMENT ON COLUMN "public"."triage_sessions"."tier" IS 'Triage tier decision: INFO, ASSESSMENT, or ESCALATE';



COMMENT ON COLUMN "public"."triage_sessions"."next_action" IS 'Next action routing: SHOW_CONTENT, START_FUNNEL_A, START_FUNNEL_B, RESUME_FUNNEL, or SHOW_ESCALATION';



COMMENT ON COLUMN "public"."triage_sessions"."red_flags" IS 'Array of detected red flags from allowlist: report_risk_level, workup_check, answer_pattern';



COMMENT ON COLUMN "public"."triage_sessions"."input_hash" IS 'SHA-256 hash of normalized input text (64 hex chars). NO raw text stored for PHI safety.';



COMMENT ON COLUMN "public"."triage_sessions"."rules_version" IS 'Version of triage ruleset used (e.g., "1.0.0")';



COMMENT ON COLUMN "public"."triage_sessions"."rationale" IS 'Optional bounded routing rationale (max 280 chars, no PHI)';



CREATE TABLE IF NOT EXISTS "public"."user_consents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "consent_version" "text" NOT NULL,
    "consented_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "text",
    "user_agent" "text"
);


ALTER TABLE "public"."user_consents" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_consents" IS 'Versioned consent records for Nutzungsbedingungen approvals.';



CREATE TABLE IF NOT EXISTS "public"."user_org_membership" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'patient'::"public"."user_role" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."user_org_membership" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_org_membership" IS 'V0.5: User-organization associations with roles';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "display_name" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_profiles" IS 'V0.5: Extended user profile information';



COMMENT ON COLUMN "public"."user_profiles"."metadata" IS 'E6.4.1: Can include pilot_enabled boolean for pilot eligibility. Also used for other user-specific metadata.';



ALTER TABLE ONLY "public"."amy_chat_messages"
    ADD CONSTRAINT "amy_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."anamnesis_entries"
    ADD CONSTRAINT "anamnesis_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."anamnesis_entry_versions"
    ADD CONSTRAINT "anamnesis_entry_versions_entry_id_version_number_key" UNIQUE ("entry_id", "version_number");



ALTER TABLE ONLY "public"."anamnesis_entry_versions"
    ADD CONSTRAINT "anamnesis_entry_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_answers"
    ADD CONSTRAINT "assessment_answers_assessment_question_unique" UNIQUE ("assessment_id", "question_id");



COMMENT ON CONSTRAINT "assessment_answers_assessment_question_unique" ON "public"."assessment_answers" IS 'Ensures each question has exactly one answer per assessment. Used for save-on-tap upsert logic in mobile funnel.';



ALTER TABLE ONLY "public"."assessment_answers"
    ADD CONSTRAINT "assessment_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_events"
    ADD CONSTRAINT "assessment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calculated_results"
    ADD CONSTRAINT "calculated_results_assessment_version_unique" UNIQUE ("assessment_id", "algorithm_version");



ALTER TABLE ONLY "public"."calculated_results"
    ADD CONSTRAINT "calculated_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinical_intakes"
    ADD CONSTRAINT "clinical_intakes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinician_patient_assignments"
    ADD CONSTRAINT "clinician_patient_assignments_organization_id_clinician_use_key" UNIQUE ("organization_id", "clinician_user_id", "patient_user_id");



ALTER TABLE ONLY "public"."clinician_patient_assignments"
    ADD CONSTRAINT "clinician_patient_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consult_note_versions"
    ADD CONSTRAINT "consult_note_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consult_note_versions"
    ADD CONSTRAINT "consult_note_versions_unique_version" UNIQUE ("consult_note_id", "version_number");



ALTER TABLE ONLY "public"."consult_notes"
    ADD CONSTRAINT "consult_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_page_sections"
    ADD CONSTRAINT "content_page_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_pages"
    ADD CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_pages"
    ADD CONSTRAINT "content_pages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."design_tokens"
    ADD CONSTRAINT "design_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."design_tokens"
    ADD CONSTRAINT "design_tokens_unique_org_category_key" UNIQUE ("organization_id", "token_category", "token_key");



ALTER TABLE ONLY "public"."device_shipments"
    ADD CONSTRAINT "device_shipments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diagnosis_artifacts"
    ADD CONSTRAINT "diagnosis_artifacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diagnosis_runs"
    ADD CONSTRAINT "diagnosis_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_publish_history"
    ADD CONSTRAINT "funnel_publish_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_question_rules"
    ADD CONSTRAINT "funnel_question_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_step_questions"
    ADD CONSTRAINT "funnel_step_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_steps"
    ADD CONSTRAINT "funnel_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_triage_settings"
    ADD CONSTRAINT "funnel_triage_settings_pkey" PRIMARY KEY ("funnel_id");



ALTER TABLE ONLY "public"."funnel_versions"
    ADD CONSTRAINT "funnel_versions_funnel_id_version_key" UNIQUE ("funnel_id", "version");



ALTER TABLE ONLY "public"."funnel_versions"
    ADD CONSTRAINT "funnel_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnels_catalog"
    ADD CONSTRAINT "funnels_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnels_catalog"
    ADD CONSTRAINT "funnels_catalog_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."funnels"
    ADD CONSTRAINT "funnels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnels"
    ADD CONSTRAINT "funnels_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_thresholds"
    ADD CONSTRAINT "kpi_thresholds_kpi_key_key" UNIQUE ("kpi_key");



ALTER TABLE ONLY "public"."kpi_thresholds"
    ADD CONSTRAINT "kpi_thresholds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_validation_results"
    ADD CONSTRAINT "medical_validation_results_job_version_hash_unique" UNIQUE ("job_id", "validation_version", "ruleset_hash");



ALTER TABLE ONLY "public"."medical_validation_results"
    ADD CONSTRAINT "medical_validation_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."navigation_item_configs"
    ADD CONSTRAINT "navigation_item_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."navigation_item_configs"
    ADD CONSTRAINT "navigation_item_configs_unique" UNIQUE ("role", "navigation_item_id");



ALTER TABLE ONLY "public"."navigation_items"
    ADD CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."navigation_items"
    ADD CONSTRAINT "navigation_items_route_key" UNIQUE ("route");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_template_key_key" UNIQUE ("template_key");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_idempotency_key" UNIQUE ("user_id", "job_id", "notification_type", "channel");



COMMENT ON CONSTRAINT "notifications_idempotency_key" ON "public"."notifications" IS 'V05-I05.9: Idempotency constraint - prevents duplicate notifications for same user+job+type+channel';



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."operational_settings_audit"
    ADD CONSTRAINT "operational_settings_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."patient_funnels"
    ADD CONSTRAINT "patient_funnels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_measures"
    ADD CONSTRAINT "patient_measures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_profiles"
    ADD CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_state"
    ADD CONSTRAINT "patient_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_state"
    ADD CONSTRAINT "patient_state_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."pillars"
    ADD CONSTRAINT "pillars_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."pillars"
    ADD CONSTRAINT "pillars_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_flow_events"
    ADD CONSTRAINT "pilot_flow_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pre_screening_calls"
    ADD CONSTRAINT "pre_screening_calls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."priority_rankings"
    ADD CONSTRAINT "priority_rankings_job_version_unique" UNIQUE ("job_id", "ranking_version", "registry_version");



ALTER TABLE ONLY "public"."priority_rankings"
    ADD CONSTRAINT "priority_rankings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."processing_jobs"
    ADD CONSTRAINT "processing_jobs_assessment_correlation_version_unique" UNIQUE ("assessment_id", "correlation_id", "schema_version");



ALTER TABLE ONLY "public"."processing_jobs"
    ADD CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reassessment_rules"
    ADD CONSTRAINT "reassessment_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reassessment_rules"
    ADD CONSTRAINT "reassessment_rules_rule_name_key" UNIQUE ("rule_name");



ALTER TABLE ONLY "public"."report_sections_legacy"
    ADD CONSTRAINT "report_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_sections"
    ADD CONSTRAINT "report_sections_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_sections_legacy"
    ADD CONSTRAINT "report_sections_report_key_unique" UNIQUE ("report_id", "section_key");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_assessment_version_unique" UNIQUE ("assessment_id", "report_version");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_records"
    ADD CONSTRAINT "review_records_job_iteration_unique" UNIQUE ("job_id", "review_iteration");



ALTER TABLE ONLY "public"."review_records"
    ADD CONSTRAINT "review_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."risk_bundles"
    ADD CONSTRAINT "risk_bundles_job_id_unique" UNIQUE ("job_id");



ALTER TABLE ONLY "public"."risk_bundles"
    ADD CONSTRAINT "risk_bundles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rls_test_results"
    ADD CONSTRAINT "rls_test_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."safety_check_results"
    ADD CONSTRAINT "safety_check_results_evaluation_key_unique" UNIQUE ("evaluation_key_hash");



ALTER TABLE ONLY "public"."safety_check_results"
    ADD CONSTRAINT "safety_check_results_job_id_unique" UNIQUE ("job_id");



ALTER TABLE ONLY "public"."safety_check_results"
    ADD CONSTRAINT "safety_check_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_events"
    ADD CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_cases"
    ADD CONSTRAINT "support_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."triage_case_actions"
    ADD CONSTRAINT "triage_case_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."triage_sessions"
    ADD CONSTRAINT "triage_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_profiles"
    ADD CONSTRAINT "unique_user_profile" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_consent_version_key" UNIQUE ("user_id", "consent_version");



ALTER TABLE ONLY "public"."user_org_membership"
    ADD CONSTRAINT "user_org_membership_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_org_membership"
    ADD CONSTRAINT "user_org_membership_user_id_organization_id_key" UNIQUE ("user_id", "organization_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



CREATE INDEX "amy_chat_messages_user_id_created_at_idx" ON "public"."amy_chat_messages" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "assessments_funnel_id_idx" ON "public"."assessments" USING "btree" ("funnel_id");



CREATE INDEX "clinical_intakes_chat_session_id_idx" ON "public"."clinical_intakes" USING "btree" ("chat_session_id") WHERE ("chat_session_id" IS NOT NULL);



CREATE INDEX "clinical_intakes_created_at_idx" ON "public"."clinical_intakes" USING "btree" ("created_at" DESC);



CREATE INDEX "clinical_intakes_organization_id_idx" ON "public"."clinical_intakes" USING "btree" ("organization_id") WHERE ("organization_id" IS NOT NULL);



CREATE INDEX "clinical_intakes_patient_id_idx" ON "public"."clinical_intakes" USING "btree" ("patient_id") WHERE ("patient_id" IS NOT NULL);



CREATE INDEX "clinical_intakes_status_idx" ON "public"."clinical_intakes" USING "btree" ("status");



CREATE INDEX "clinical_intakes_user_id_idx" ON "public"."clinical_intakes" USING "btree" ("user_id");



CREATE INDEX "clinical_intakes_user_status_idx" ON "public"."clinical_intakes" USING "btree" ("user_id", "status");



CREATE INDEX "consult_note_versions_consult_note_id_idx" ON "public"."consult_note_versions" USING "btree" ("consult_note_id");



CREATE INDEX "consult_note_versions_created_at_idx" ON "public"."consult_note_versions" USING "btree" ("created_at" DESC);



CREATE INDEX "consult_notes_chat_session_id_idx" ON "public"."consult_notes" USING "btree" ("chat_session_id") WHERE ("chat_session_id" IS NOT NULL);



CREATE INDEX "consult_notes_created_at_idx" ON "public"."consult_notes" USING "btree" ("created_at" DESC);



CREATE INDEX "consult_notes_organization_id_idx" ON "public"."consult_notes" USING "btree" ("organization_id");



CREATE INDEX "consult_notes_patient_id_idx" ON "public"."consult_notes" USING "btree" ("patient_id");



CREATE INDEX "content_pages_slug_idx" ON "public"."content_pages" USING "btree" ("slug");



CREATE INDEX "content_pages_status_idx" ON "public"."content_pages" USING "btree" ("status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "funnel_step_questions_funnel_step_id_idx" ON "public"."funnel_step_questions" USING "btree" ("funnel_step_id");



CREATE INDEX "funnel_step_questions_order_index_idx" ON "public"."funnel_step_questions" USING "btree" ("order_index");



CREATE INDEX "funnel_step_questions_question_id_idx" ON "public"."funnel_step_questions" USING "btree" ("question_id");



CREATE INDEX "funnel_steps_content_page_id_idx" ON "public"."funnel_steps" USING "btree" ("content_page_id") WHERE ("content_page_id" IS NOT NULL);



CREATE INDEX "funnel_steps_funnel_id_idx" ON "public"."funnel_steps" USING "btree" ("funnel_id");



CREATE INDEX "funnel_steps_order_index_idx" ON "public"."funnel_steps" USING "btree" ("order_index");



CREATE INDEX "funnels_catalog_published_idx" ON "public"."funnels_catalog" USING "btree" ("published");



CREATE INDEX "idx_anamnesis_entries_entry_type" ON "public"."anamnesis_entries" USING "btree" ("entry_type") WHERE ("entry_type" IS NOT NULL);



CREATE INDEX "idx_anamnesis_entries_funnel_summary_lookup" ON "public"."anamnesis_entries" USING "btree" ("patient_id", (("content" ->> 'assessment_id'::"text"))) WHERE (("entry_type" = 'funnel_summary'::"text") AND ("is_archived" = false));



COMMENT ON INDEX "public"."idx_anamnesis_entries_funnel_summary_lookup" IS 'E75.5: Optimize funnel summary lookups for idempotency checks';



CREATE INDEX "idx_anamnesis_entries_org_id" ON "public"."anamnesis_entries" USING "btree" ("organization_id");



CREATE INDEX "idx_anamnesis_entries_patient_updated" ON "public"."anamnesis_entries" USING "btree" ("patient_id", "updated_at" DESC);



COMMENT ON INDEX "public"."idx_anamnesis_entries_patient_updated" IS 'E75.1: Optimize patient entry queries (latest first)';



CREATE INDEX "idx_anamnesis_entries_tags" ON "public"."anamnesis_entries" USING "gin" ("tags");



CREATE INDEX "idx_anamnesis_entry_versions_changed_at" ON "public"."anamnesis_entry_versions" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_anamnesis_entry_versions_entry_version" ON "public"."anamnesis_entry_versions" USING "btree" ("entry_id", "version_number" DESC);



COMMENT ON INDEX "public"."idx_anamnesis_entry_versions_entry_version" IS 'E75.1: Optimize version history queries (latest first)';



CREATE INDEX "idx_assessment_answers_data" ON "public"."assessment_answers" USING "gin" ("answer_data") WHERE ("answer_data" IS NOT NULL);



CREATE INDEX "idx_assessment_answers_lookup" ON "public"."assessment_answers" USING "btree" ("assessment_id", "question_id");



CREATE INDEX "idx_assessment_answers_question_id" ON "public"."assessment_answers" USING "btree" ("question_id");



COMMENT ON INDEX "public"."idx_assessment_answers_question_id" IS 'B3: Optimizes question_id lookups for navigation state calculations';



CREATE INDEX "idx_assessment_events_assessment_id" ON "public"."assessment_events" USING "btree" ("assessment_id");



CREATE INDEX "idx_assessment_events_created_at" ON "public"."assessment_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_assessment_events_event_type" ON "public"."assessment_events" USING "btree" ("event_type");



CREATE UNIQUE INDEX "idx_assessments_one_in_progress_per_patient_funnel" ON "public"."assessments" USING "btree" ("patient_id", "funnel") WHERE ("completed_at" IS NULL);



COMMENT ON INDEX "public"."idx_assessments_one_in_progress_per_patient_funnel" IS 'E74.7-R-001: Enforces exactly one in-progress assessment per patient+funnel combination. Prevents duplicate runs.';



CREATE INDEX "idx_assessments_patient_funnel" ON "public"."assessments" USING "btree" ("patient_id", "funnel_id");



CREATE INDEX "idx_assessments_patient_in_progress" ON "public"."assessments" USING "btree" ("patient_id", "completed_at", "started_at" DESC) WHERE ("completed_at" IS NULL);



COMMENT ON INDEX "public"."idx_assessments_patient_in_progress" IS 'E6.4.2 + E74.7-R-002: Optimizes query for finding in-progress assessments by patient. Used for resume/create logic.';



CREATE INDEX "idx_assessments_patient_status" ON "public"."assessments" USING "btree" ("patient_id", "status");



CREATE INDEX "idx_assessments_status" ON "public"."assessments" USING "btree" ("status");



CREATE INDEX "idx_assessments_status_started_at" ON "public"."assessments" USING "btree" ("status", "started_at" DESC);



CREATE INDEX "idx_assessments_workup_status" ON "public"."assessments" USING "btree" ("workup_status") WHERE ("workup_status" IS NOT NULL);



COMMENT ON INDEX "public"."idx_assessments_workup_status" IS 'E6.4.4: Index for filtering assessments by workup status';



CREATE INDEX "idx_audit_log_actor_user_id" ON "public"."audit_log" USING "btree" ("actor_user_id");



CREATE INDEX "idx_audit_log_created_at" ON "public"."audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_log_entity_type_id" ON "public"."audit_log" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_log_org_entity_created" ON "public"."audit_log" USING "btree" ("org_id", "entity_type", "created_at" DESC) WHERE ("org_id" IS NOT NULL);



CREATE INDEX "idx_audit_log_org_id" ON "public"."audit_log" USING "btree" ("org_id") WHERE ("org_id" IS NOT NULL);



CREATE INDEX "idx_audit_log_source" ON "public"."audit_log" USING "btree" ("source") WHERE ("source" IS NOT NULL);



CREATE INDEX "idx_calculated_results_assessment_id" ON "public"."calculated_results" USING "btree" ("assessment_id");



CREATE INDEX "idx_calculated_results_created_at" ON "public"."calculated_results" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_calculated_results_funnel_version" ON "public"."calculated_results" USING "btree" ("funnel_version_id") WHERE ("funnel_version_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_calculated_results_funnel_version" IS 'V05-I01.3: Optimize funnel version queries';



CREATE INDEX "idx_clinician_patient_assignments_clinician" ON "public"."clinician_patient_assignments" USING "btree" ("clinician_user_id");



CREATE INDEX "idx_clinician_patient_assignments_org" ON "public"."clinician_patient_assignments" USING "btree" ("organization_id");



CREATE INDEX "idx_clinician_patient_assignments_patient" ON "public"."clinician_patient_assignments" USING "btree" ("patient_user_id");



CREATE INDEX "idx_content_page_sections_order" ON "public"."content_page_sections" USING "btree" ("content_page_id", "order_index");



CREATE INDEX "idx_content_page_sections_page_id" ON "public"."content_page_sections" USING "btree" ("content_page_id");



CREATE INDEX "idx_content_pages_deleted_at" ON "public"."content_pages" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_content_pages_flow_step" ON "public"."content_pages" USING "btree" ("flow_step") WHERE ("flow_step" IS NOT NULL);



CREATE INDEX "idx_content_pages_funnel_flow" ON "public"."content_pages" USING "btree" ("funnel_id", "flow_step") WHERE (("funnel_id" IS NOT NULL) AND ("flow_step" IS NOT NULL));



CREATE INDEX "idx_content_pages_order_index" ON "public"."content_pages" USING "btree" ("order_index") WHERE ("order_index" IS NOT NULL);



CREATE INDEX "idx_content_pages_priority" ON "public"."content_pages" USING "btree" ("priority");



CREATE INDEX "idx_design_tokens_active" ON "public"."design_tokens" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_design_tokens_category" ON "public"."design_tokens" USING "btree" ("token_category");



CREATE INDEX "idx_design_tokens_organization" ON "public"."design_tokens" USING "btree" ("organization_id");



CREATE INDEX "idx_device_shipments_created_at_desc" ON "public"."device_shipments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_device_shipments_org_created" ON "public"."device_shipments" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_device_shipments_org_status" ON "public"."device_shipments" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_device_shipments_organization_id" ON "public"."device_shipments" USING "btree" ("organization_id");



CREATE INDEX "idx_device_shipments_patient_id" ON "public"."device_shipments" USING "btree" ("patient_id");



CREATE INDEX "idx_device_shipments_reminder_query" ON "public"."device_shipments" USING "btree" ("organization_id", "status", "expected_delivery_at") WHERE (("expected_delivery_at" IS NOT NULL) AND ("status" <> ALL (ARRAY['delivered'::"public"."shipment_status", 'returned'::"public"."shipment_status", 'cancelled'::"public"."shipment_status"])));



CREATE INDEX "idx_device_shipments_status" ON "public"."device_shipments" USING "btree" ("status");



CREATE INDEX "idx_device_shipments_task_id" ON "public"."device_shipments" USING "btree" ("task_id") WHERE ("task_id" IS NOT NULL);



CREATE INDEX "idx_device_shipments_tracking_number" ON "public"."device_shipments" USING "btree" ("tracking_number") WHERE ("tracking_number" IS NOT NULL);



CREATE INDEX "idx_diagnosis_artifacts_created_at" ON "public"."diagnosis_artifacts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_diagnosis_artifacts_patient_id" ON "public"."diagnosis_artifacts" USING "btree" ("patient_id");



CREATE INDEX "idx_diagnosis_artifacts_risk_level" ON "public"."diagnosis_artifacts" USING "btree" ("risk_level");



CREATE INDEX "idx_diagnosis_artifacts_run_id" ON "public"."diagnosis_artifacts" USING "btree" ("run_id");



CREATE INDEX "idx_diagnosis_runs_clinician_id" ON "public"."diagnosis_runs" USING "btree" ("clinician_id");



CREATE INDEX "idx_diagnosis_runs_created_at" ON "public"."diagnosis_runs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_diagnosis_runs_inputs_hash" ON "public"."diagnosis_runs" USING "btree" ("inputs_hash");



CREATE INDEX "idx_diagnosis_runs_inputs_meta" ON "public"."diagnosis_runs" USING "gin" ("inputs_meta");



CREATE INDEX "idx_diagnosis_runs_patient_id" ON "public"."diagnosis_runs" USING "btree" ("patient_id");



CREATE INDEX "idx_diagnosis_runs_status" ON "public"."diagnosis_runs" USING "btree" ("status");



CREATE INDEX "idx_documents_assessment_id" ON "public"."documents" USING "btree" ("assessment_id");



CREATE UNIQUE INDEX "idx_documents_extraction_idempotency" ON "public"."documents" USING "btree" ("id", "extractor_version", "input_hash") WHERE (("extractor_version" IS NOT NULL) AND ("input_hash" IS NOT NULL));



COMMENT ON INDEX "public"."idx_documents_extraction_idempotency" IS 'V05-I04.2: Ensures idempotent extraction - same document + version + inputs = one result';



CREATE INDEX "idx_documents_extractor_version" ON "public"."documents" USING "btree" ("extractor_version") WHERE ("extractor_version" IS NOT NULL);



CREATE INDEX "idx_documents_input_hash" ON "public"."documents" USING "btree" ("input_hash") WHERE ("input_hash" IS NOT NULL);



CREATE INDEX "idx_documents_parsing_status" ON "public"."documents" USING "btree" ("parsing_status");



CREATE INDEX "idx_funnel_publish_history_funnel_id" ON "public"."funnel_publish_history" USING "btree" ("funnel_id");



CREATE INDEX "idx_funnel_publish_history_published_at" ON "public"."funnel_publish_history" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_funnel_publish_history_published_by" ON "public"."funnel_publish_history" USING "btree" ("published_by");



CREATE INDEX "idx_funnel_publish_history_version_id" ON "public"."funnel_publish_history" USING "btree" ("version_id");



CREATE INDEX "idx_funnel_question_rules_active" ON "public"."funnel_question_rules" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_funnel_question_rules_funnel_step_id" ON "public"."funnel_question_rules" USING "btree" ("funnel_step_id");



CREATE INDEX "idx_funnel_question_rules_question_id" ON "public"."funnel_question_rules" USING "btree" ("question_id");



CREATE INDEX "idx_funnel_question_rules_type" ON "public"."funnel_question_rules" USING "btree" ("rule_type");



CREATE INDEX "idx_funnel_step_questions_with_order" ON "public"."funnel_step_questions" USING "btree" ("funnel_step_id", "order_index", "is_required");



COMMENT ON INDEX "public"."idx_funnel_step_questions_with_order" IS 'B3: Optimizes step question queries with required flag for validation';



CREATE INDEX "idx_funnel_steps_funnel_order" ON "public"."funnel_steps" USING "btree" ("funnel_id", "order_index");



COMMENT ON INDEX "public"."idx_funnel_steps_funnel_order" IS 'B3: Optimizes funnel step ordering queries for next/previous navigation';



CREATE INDEX "idx_funnel_versions_funnel_id" ON "public"."funnel_versions" USING "btree" ("funnel_id");



CREATE INDEX "idx_funnel_versions_is_default" ON "public"."funnel_versions" USING "btree" ("is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_funnels_catalog_is_active" ON "public"."funnels_catalog" USING "btree" ("is_active");



CREATE INDEX "idx_funnels_catalog_org_id" ON "public"."funnels_catalog" USING "btree" ("org_id");



CREATE INDEX "idx_funnels_catalog_slug" ON "public"."funnels_catalog" USING "btree" ("slug");



CREATE INDEX "idx_idempotency_keys_expires_at" ON "public"."idempotency_keys" USING "btree" ("expires_at");



CREATE INDEX "idx_idempotency_keys_lookup" ON "public"."idempotency_keys" USING "btree" ("user_id", "idempotency_key");



CREATE UNIQUE INDEX "idx_idempotency_keys_unique" ON "public"."idempotency_keys" USING "btree" ("user_id", "endpoint_path", "idempotency_key");



CREATE INDEX "idx_kpi_thresholds_active" ON "public"."kpi_thresholds" USING "btree" ("is_active");



CREATE INDEX "idx_kpi_thresholds_key" ON "public"."kpi_thresholds" USING "btree" ("kpi_key");



CREATE INDEX "idx_kpi_thresholds_metric_type" ON "public"."kpi_thresholds" USING "btree" ("metric_type");



CREATE INDEX "idx_medical_validation_results_job_id_lookup" ON "public"."medical_validation_results" USING "btree" ("job_id", "validated_at" DESC);



COMMENT ON INDEX "public"."idx_medical_validation_results_job_id_lookup" IS 'Non-unique index for querying latest validation by job_id';



CREATE INDEX "idx_medical_validation_results_overall_passed" ON "public"."medical_validation_results" USING "btree" ("overall_passed") WHERE ("overall_passed" = false);



CREATE INDEX "idx_medical_validation_results_overall_status" ON "public"."medical_validation_results" USING "btree" ("overall_status");



CREATE INDEX "idx_medical_validation_results_sections_id" ON "public"."medical_validation_results" USING "btree" ("sections_id") WHERE ("sections_id" IS NOT NULL);



CREATE INDEX "idx_medical_validation_results_status_validated" ON "public"."medical_validation_results" USING "btree" ("overall_status", "validated_at" DESC);



CREATE INDEX "idx_medical_validation_results_validated_at" ON "public"."medical_validation_results" USING "btree" ("validated_at" DESC);



CREATE INDEX "idx_navigation_item_configs_role" ON "public"."navigation_item_configs" USING "btree" ("role");



COMMENT ON INDEX "public"."idx_navigation_item_configs_role" IS 'V05-I09.1: Optimizes role-based navigation lookups';



CREATE INDEX "idx_navigation_item_configs_role_order" ON "public"."navigation_item_configs" USING "btree" ("role", "order_index");



COMMENT ON INDEX "public"."idx_navigation_item_configs_role_order" IS 'V05-I09.1: Optimizes ordered navigation retrieval';



CREATE INDEX "idx_navigation_items_default_order" ON "public"."navigation_items" USING "btree" ("default_order");



CREATE INDEX "idx_notification_templates_active" ON "public"."notification_templates" USING "btree" ("is_active");



CREATE INDEX "idx_notification_templates_channel" ON "public"."notification_templates" USING "btree" ("channel");



CREATE INDEX "idx_notification_templates_key" ON "public"."notification_templates" USING "btree" ("template_key");



CREATE INDEX "idx_notifications_follow_up" ON "public"."notifications" USING "btree" ("follow_up_at") WHERE (("follow_up_at" IS NOT NULL) AND ("follow_up_completed" = false));



COMMENT ON INDEX "public"."idx_notifications_follow_up" IS 'V05-I05.9: Find notifications needing follow-up';



CREATE INDEX "idx_notifications_idempotency" ON "public"."notifications" USING "btree" ("user_id", "job_id", "notification_type", "channel") WHERE ("job_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_notifications_idempotency" IS 'V05-I05.9: Fast idempotency lookup for notification creation';



CREATE INDEX "idx_notifications_job_id" ON "public"."notifications" USING "btree" ("job_id") WHERE ("job_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_notifications_job_id" IS 'V05-I05.9: Find notifications for a specific job';



CREATE INDEX "idx_notifications_pending" ON "public"."notifications" USING "btree" ("status", "created_at");



COMMENT ON INDEX "public"."idx_notifications_pending" IS 'V05-I05.9: Find pending notifications to process';



CREATE INDEX "idx_notifications_scheduled_at" ON "public"."notifications" USING "btree" ("scheduled_at");



CREATE INDEX "idx_notifications_status" ON "public"."notifications" USING "btree" ("status");



CREATE INDEX "idx_notifications_user_created" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_notifications_user_created" IS 'V05-I05.9: Fast lookup of user notifications by recency';



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_operational_audit_changed_at" ON "public"."operational_settings_audit" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_operational_audit_changed_by" ON "public"."operational_settings_audit" USING "btree" ("changed_by");



CREATE INDEX "idx_operational_audit_record" ON "public"."operational_settings_audit" USING "btree" ("record_id");



CREATE INDEX "idx_operational_audit_table" ON "public"."operational_settings_audit" USING "btree" ("table_name");



CREATE INDEX "idx_organizations_is_active" ON "public"."organizations" USING "btree" ("is_active");



CREATE INDEX "idx_organizations_slug" ON "public"."organizations" USING "btree" ("slug");



CREATE INDEX "idx_patient_funnels_funnel_id" ON "public"."patient_funnels" USING "btree" ("funnel_id");



CREATE INDEX "idx_patient_funnels_patient_id" ON "public"."patient_funnels" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_funnels_status" ON "public"."patient_funnels" USING "btree" ("status");



CREATE INDEX "idx_patient_measures_patient_id" ON "public"."patient_measures" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_measures_report_id" ON "public"."patient_measures" USING "btree" ("report_id");



CREATE INDEX "idx_pilot_flow_events_correlation_id" ON "public"."pilot_flow_events" USING "btree" ("correlation_id", "created_at" DESC);



CREATE INDEX "idx_pilot_flow_events_created_at" ON "public"."pilot_flow_events" USING "btree" ("created_at" DESC, "id");



CREATE INDEX "idx_pilot_flow_events_entity" ON "public"."pilot_flow_events" USING "btree" ("entity_type", "entity_id", "created_at" DESC);



CREATE INDEX "idx_pilot_flow_events_patient_id" ON "public"."pilot_flow_events" USING "btree" ("patient_id", "created_at" DESC) WHERE ("patient_id" IS NOT NULL);



CREATE INDEX "idx_pre_screening_calls_call_date" ON "public"."pre_screening_calls" USING "btree" ("call_date" DESC);



CREATE INDEX "idx_pre_screening_calls_clinician_id" ON "public"."pre_screening_calls" USING "btree" ("clinician_id");



CREATE INDEX "idx_pre_screening_calls_organization_id" ON "public"."pre_screening_calls" USING "btree" ("organization_id");



CREATE INDEX "idx_pre_screening_calls_patient_id" ON "public"."pre_screening_calls" USING "btree" ("patient_id");



CREATE INDEX "idx_priority_rankings_job_id" ON "public"."priority_rankings" USING "btree" ("job_id");



CREATE INDEX "idx_priority_rankings_program_tier" ON "public"."priority_rankings" USING "btree" ("program_tier") WHERE ("program_tier" IS NOT NULL);



CREATE INDEX "idx_priority_rankings_ranked_at" ON "public"."priority_rankings" USING "btree" ("ranked_at" DESC);



CREATE INDEX "idx_priority_rankings_risk_bundle_id" ON "public"."priority_rankings" USING "btree" ("risk_bundle_id");



CREATE INDEX "idx_processing_jobs_assessment_created" ON "public"."processing_jobs" USING "btree" ("assessment_id", "created_at" DESC);



CREATE INDEX "idx_processing_jobs_assessment_id" ON "public"."processing_jobs" USING "btree" ("assessment_id");



CREATE INDEX "idx_processing_jobs_correlation_id" ON "public"."processing_jobs" USING "btree" ("correlation_id");



CREATE INDEX "idx_processing_jobs_created_at" ON "public"."processing_jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_processing_jobs_delivery_status" ON "public"."processing_jobs" USING "btree" ("delivery_status") WHERE ("delivery_status" = ANY (ARRAY['READY'::"text", 'DELIVERED'::"text"]));



COMMENT ON INDEX "public"."idx_processing_jobs_delivery_status" IS 'V05-I05.9: Fast lookup of jobs by delivery status';



CREATE INDEX "idx_processing_jobs_delivery_timestamp" ON "public"."processing_jobs" USING "btree" ("delivery_timestamp" DESC) WHERE ("delivery_timestamp" IS NOT NULL);



COMMENT ON INDEX "public"."idx_processing_jobs_delivery_timestamp" IS 'V05-I05.9: Find recently delivered jobs';



CREATE INDEX "idx_processing_jobs_pdf_generated" ON "public"."processing_jobs" USING "btree" ("pdf_generated_at" DESC) WHERE ("pdf_generated_at" IS NOT NULL);



CREATE INDEX "idx_processing_jobs_pdf_path" ON "public"."processing_jobs" USING "btree" ("pdf_path") WHERE ("pdf_path" IS NOT NULL);



CREATE INDEX "idx_processing_jobs_ready_for_delivery" ON "public"."processing_jobs" USING "btree" ("status", "stage", "delivery_status") WHERE (("status" = 'completed'::"public"."processing_status") AND ("stage" = 'completed'::"public"."processing_stage") AND ("delivery_status" = 'NOT_READY'::"text"));



COMMENT ON INDEX "public"."idx_processing_jobs_ready_for_delivery" IS 'V05-I05.9: Find completed jobs ready for delivery';



CREATE INDEX "idx_processing_jobs_stage" ON "public"."processing_jobs" USING "btree" ("stage");



CREATE INDEX "idx_processing_jobs_status" ON "public"."processing_jobs" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['queued'::"public"."processing_status", 'in_progress'::"public"."processing_status"]));



CREATE INDEX "idx_processing_jobs_status_created" ON "public"."processing_jobs" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_reassessment_rules_active" ON "public"."reassessment_rules" USING "btree" ("is_active");



CREATE INDEX "idx_reassessment_rules_funnel" ON "public"."reassessment_rules" USING "btree" ("funnel_id");



CREATE INDEX "idx_reassessment_rules_priority" ON "public"."reassessment_rules" USING "btree" ("priority");



CREATE INDEX "idx_report_sections_generated_at" ON "public"."report_sections" USING "btree" ("generated_at" DESC);



CREATE UNIQUE INDEX "idx_report_sections_job_content_version" ON "public"."report_sections" USING "btree" ("job_id", "content_version");



CREATE INDEX "idx_report_sections_job_id_lookup" ON "public"."report_sections" USING "btree" ("job_id");



CREATE INDEX "idx_report_sections_program_tier" ON "public"."report_sections" USING "btree" ("program_tier") WHERE ("program_tier" IS NOT NULL);



CREATE INDEX "idx_report_sections_ranking_id" ON "public"."report_sections" USING "btree" ("ranking_id") WHERE ("ranking_id" IS NOT NULL);



CREATE INDEX "idx_report_sections_report_id" ON "public"."report_sections_legacy" USING "btree" ("report_id");



CREATE INDEX "idx_report_sections_risk_bundle_id" ON "public"."report_sections" USING "btree" ("risk_bundle_id");



CREATE INDEX "idx_report_sections_section_key" ON "public"."report_sections_legacy" USING "btree" ("section_key");



CREATE INDEX "idx_reports_algorithm_version" ON "public"."reports" USING "btree" ("algorithm_version") WHERE ("algorithm_version" IS NOT NULL);



COMMENT ON INDEX "public"."idx_reports_algorithm_version" IS 'V05-I01.3: Optimize algorithm version queries';



CREATE INDEX "idx_reports_assessment_id" ON "public"."reports" USING "btree" ("assessment_id");



CREATE INDEX "idx_reports_created_at" ON "public"."reports" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reports_funnel_version" ON "public"."reports" USING "btree" ("funnel_version_id") WHERE ("funnel_version_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_reports_funnel_version" IS 'V05-I01.3: Optimize funnel version queries';



CREATE INDEX "idx_review_records_created_at" ON "public"."review_records" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_review_records_decided_at" ON "public"."review_records" USING "btree" ("decided_at" DESC) WHERE ("decided_at" IS NOT NULL);



CREATE INDEX "idx_review_records_is_sampled" ON "public"."review_records" USING "btree" ("is_sampled") WHERE ("is_sampled" = true);



CREATE INDEX "idx_review_records_job_id" ON "public"."review_records" USING "btree" ("job_id");



CREATE INDEX "idx_review_records_reviewer" ON "public"."review_records" USING "btree" ("reviewer_user_id", "decided_at" DESC) WHERE ("reviewer_user_id" IS NOT NULL);



CREATE INDEX "idx_review_records_safety_check_id" ON "public"."review_records" USING "btree" ("safety_check_id") WHERE ("safety_check_id" IS NOT NULL);



CREATE INDEX "idx_review_records_status" ON "public"."review_records" USING "btree" ("status");



CREATE INDEX "idx_review_records_status_created" ON "public"."review_records" USING "btree" ("status", "created_at" DESC) WHERE ("status" = 'PENDING'::"public"."review_status");



CREATE INDEX "idx_review_records_validation_result_id" ON "public"."review_records" USING "btree" ("validation_result_id") WHERE ("validation_result_id" IS NOT NULL);



CREATE INDEX "idx_risk_bundles_assessment_id" ON "public"."risk_bundles" USING "btree" ("assessment_id");



CREATE INDEX "idx_risk_bundles_calculated_at" ON "public"."risk_bundles" USING "btree" ("calculated_at" DESC);



CREATE INDEX "idx_risk_bundles_job_id" ON "public"."risk_bundles" USING "btree" ("job_id");



CREATE INDEX "idx_safety_check_results_action_evaluated" ON "public"."safety_check_results" USING "btree" ("overall_action", "evaluated_at" DESC);



CREATE INDEX "idx_safety_check_results_evaluated_at" ON "public"."safety_check_results" USING "btree" ("evaluated_at" DESC);



CREATE UNIQUE INDEX "idx_safety_check_results_evaluation_key" ON "public"."safety_check_results" USING "btree" ("evaluation_key_hash") WHERE ("evaluation_key_hash" IS NOT NULL);



CREATE UNIQUE INDEX "idx_safety_check_results_job_id" ON "public"."safety_check_results" USING "btree" ("job_id");



CREATE INDEX "idx_safety_check_results_overall_action" ON "public"."safety_check_results" USING "btree" ("overall_action");



CREATE INDEX "idx_safety_check_results_safety_score" ON "public"."safety_check_results" USING "btree" ("safety_score");



CREATE INDEX "idx_safety_check_results_sections_id" ON "public"."safety_check_results" USING "btree" ("sections_id");



CREATE INDEX "idx_shipment_events_event_at_desc" ON "public"."shipment_events" USING "btree" ("event_at" DESC);



CREATE INDEX "idx_shipment_events_shipment_id" ON "public"."shipment_events" USING "btree" ("shipment_id");



CREATE INDEX "idx_support_cases_assigned_status_created" ON "public"."support_cases" USING "btree" ("assigned_to_user_id", "status", "created_at" DESC) WHERE ("assigned_to_user_id" IS NOT NULL);



CREATE INDEX "idx_support_cases_assigned_to_user_id" ON "public"."support_cases" USING "btree" ("assigned_to_user_id") WHERE ("assigned_to_user_id" IS NOT NULL);



CREATE INDEX "idx_support_cases_category" ON "public"."support_cases" USING "btree" ("category");



CREATE INDEX "idx_support_cases_created_by_user_id" ON "public"."support_cases" USING "btree" ("created_by_user_id");



CREATE INDEX "idx_support_cases_escalated_task_id" ON "public"."support_cases" USING "btree" ("escalated_task_id") WHERE ("escalated_task_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_support_cases_escalated_task_unique" ON "public"."support_cases" USING "btree" ("escalated_task_id") WHERE ("escalated_task_id" IS NOT NULL);



CREATE INDEX "idx_support_cases_org_priority_created" ON "public"."support_cases" USING "btree" ("organization_id", "priority", "created_at" DESC);



CREATE INDEX "idx_support_cases_org_status_created" ON "public"."support_cases" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "idx_support_cases_organization_id" ON "public"."support_cases" USING "btree" ("organization_id");



CREATE INDEX "idx_support_cases_patient_id" ON "public"."support_cases" USING "btree" ("patient_id");



CREATE INDEX "idx_support_cases_priority" ON "public"."support_cases" USING "btree" ("priority");



CREATE INDEX "idx_support_cases_status" ON "public"."support_cases" USING "btree" ("status");



CREATE INDEX "idx_tasks_assessment_id" ON "public"."tasks" USING "btree" ("assessment_id");



CREATE INDEX "idx_tasks_assigned_to_role_status_due" ON "public"."tasks" USING "btree" ("assigned_to_role", "status", "due_at");



CREATE INDEX "idx_tasks_patient_id" ON "public"."tasks" USING "btree" ("patient_id");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_triage_case_actions_assessment_action" ON "public"."triage_case_actions" USING "btree" ("assessment_id", "action_type", "created_at" DESC);



CREATE INDEX "idx_triage_case_actions_assessment_id" ON "public"."triage_case_actions" USING "btree" ("assessment_id");



CREATE INDEX "idx_triage_case_actions_created_at" ON "public"."triage_case_actions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_triage_case_actions_created_by" ON "public"."triage_case_actions" USING "btree" ("created_by", "created_at" DESC);



CREATE INDEX "idx_triage_case_actions_patient_id" ON "public"."triage_case_actions" USING "btree" ("patient_id");



CREATE INDEX "idx_triage_sessions_correlation_id" ON "public"."triage_sessions" USING "btree" ("correlation_id");



CREATE INDEX "idx_triage_sessions_created_at" ON "public"."triage_sessions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_triage_sessions_input_hash" ON "public"."triage_sessions" USING "btree" ("input_hash");



CREATE INDEX "idx_triage_sessions_patient_id_created_at" ON "public"."triage_sessions" USING "btree" ("patient_id", "created_at" DESC);



CREATE INDEX "idx_user_consents_consented_at" ON "public"."user_consents" USING "btree" ("consented_at" DESC);



CREATE INDEX "idx_user_consents_user_id" ON "public"."user_consents" USING "btree" ("user_id");



CREATE INDEX "idx_user_org_membership_organization_id" ON "public"."user_org_membership" USING "btree" ("organization_id");



CREATE INDEX "idx_user_org_membership_role" ON "public"."user_org_membership" USING "btree" ("role");



CREATE INDEX "idx_user_org_membership_user_id" ON "public"."user_org_membership" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_organization_id" ON "public"."user_profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



COMMENT ON INDEX "public"."medical_validation_results_job_version_hash_unique" IS 'Composite uniqueness: allows versioned reruns with different rulesets';



CREATE INDEX "patient_state_user_id_idx" ON "public"."patient_state" USING "btree" ("user_id");



CREATE INDEX "tasks_assigned_to_user_id_idx" ON "public"."tasks" USING "btree" ("assigned_to_user_id") WHERE ("assigned_to_user_id" IS NOT NULL);



CREATE INDEX "tasks_assigned_user_status_idx" ON "public"."tasks" USING "btree" ("assigned_to_user_id", "status", "created_at" DESC) WHERE ("assigned_to_user_id" IS NOT NULL);



CREATE INDEX "tasks_org_status_created_idx" ON "public"."tasks" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "tasks_organization_id_idx" ON "public"."tasks" USING "btree" ("organization_id");



CREATE UNIQUE INDEX "uq_diagnosis_artifacts_run_type" ON "public"."diagnosis_artifacts" USING "btree" ("run_id", "artifact_type");



CREATE OR REPLACE TRIGGER "audit_kpi_thresholds_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."kpi_thresholds" FOR EACH ROW EXECUTE FUNCTION "public"."audit_kpi_thresholds"();



CREATE OR REPLACE TRIGGER "audit_notification_templates_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."notification_templates" FOR EACH ROW EXECUTE FUNCTION "public"."audit_notification_templates"();



CREATE OR REPLACE TRIGGER "audit_patient_funnels_changes_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."patient_funnels" FOR EACH ROW EXECUTE FUNCTION "public"."audit_patient_funnels_changes"();



CREATE OR REPLACE TRIGGER "audit_reassessment_rules_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."reassessment_rules" FOR EACH ROW EXECUTE FUNCTION "public"."audit_reassessment_rules"();



CREATE OR REPLACE TRIGGER "clinical_intakes_update_timestamp" BEFORE UPDATE ON "public"."clinical_intakes" FOR EACH ROW EXECUTE FUNCTION "public"."update_clinical_intake_timestamp"();



CREATE OR REPLACE TRIGGER "consult_notes_auto_version" AFTER UPDATE ON "public"."consult_notes" FOR EACH ROW WHEN (("old"."content" IS DISTINCT FROM "new"."content")) EXECUTE FUNCTION "public"."create_consult_note_version"();



CREATE OR REPLACE TRIGGER "consult_notes_update_timestamp" BEFORE UPDATE ON "public"."consult_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_consult_note_timestamp"();



CREATE OR REPLACE TRIGGER "navigation_item_configs_updated_at" BEFORE UPDATE ON "public"."navigation_item_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_navigation_updated_at"();



CREATE OR REPLACE TRIGGER "navigation_items_updated_at" BEFORE UPDATE ON "public"."navigation_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_navigation_updated_at"();



CREATE OR REPLACE TRIGGER "pre_screening_calls_updated_at" BEFORE UPDATE ON "public"."pre_screening_calls" FOR EACH ROW EXECUTE FUNCTION "public"."update_pre_screening_calls_updated_at"();



CREATE OR REPLACE TRIGGER "prevent_published_version_delete_trigger" BEFORE DELETE ON "public"."funnel_versions" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_published_version_delete"();



CREATE OR REPLACE TRIGGER "report_sections_updated_at" BEFORE UPDATE ON "public"."report_sections" FOR EACH ROW EXECUTE FUNCTION "public"."update_report_sections_updated_at"();



CREATE OR REPLACE TRIGGER "trg_enforce_clinician_patient_same_org" BEFORE INSERT OR UPDATE ON "public"."clinician_patient_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_clinician_patient_same_org"();



CREATE OR REPLACE TRIGGER "trg_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_notifications_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_anamnesis_entries_updated_at" BEFORE UPDATE ON "public"."anamnesis_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_anamnesis_entries_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_anamnesis_entry_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."anamnesis_entries" FOR EACH ROW EXECUTE FUNCTION "public"."anamnesis_entry_audit_log"();



CREATE OR REPLACE TRIGGER "trigger_anamnesis_entry_versioning" AFTER INSERT OR UPDATE ON "public"."anamnesis_entries" FOR EACH ROW EXECUTE FUNCTION "public"."anamnesis_entry_create_version"();



CREATE OR REPLACE TRIGGER "trigger_device_shipments_updated_at" BEFORE UPDATE ON "public"."device_shipments" FOR EACH ROW EXECUTE FUNCTION "public"."update_device_shipments_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_diagnosis_artifacts_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."diagnosis_artifacts" FOR EACH ROW EXECUTE FUNCTION "public"."diagnosis_artifacts_audit_log"();



COMMENT ON TRIGGER "trigger_diagnosis_artifacts_audit" ON "public"."diagnosis_artifacts" IS 'E76.7: Auto-logs all diagnosis artifact lifecycle events to audit_log';



CREATE OR REPLACE TRIGGER "trigger_diagnosis_runs_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."diagnosis_runs" FOR EACH ROW EXECUTE FUNCTION "public"."diagnosis_runs_audit_log"();



COMMENT ON TRIGGER "trigger_diagnosis_runs_audit" ON "public"."diagnosis_runs" IS 'E76.7: Auto-logs all diagnosis run lifecycle events to audit_log';



CREATE OR REPLACE TRIGGER "trigger_diagnosis_runs_updated_at" BEFORE UPDATE ON "public"."diagnosis_runs" FOR EACH ROW EXECUTE FUNCTION "public"."update_diagnosis_runs_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_medical_validation_results_updated_at" BEFORE UPDATE ON "public"."medical_validation_results" FOR EACH ROW EXECUTE FUNCTION "public"."update_medical_validation_results_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_processing_jobs_updated_at" BEFORE UPDATE ON "public"."processing_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_processing_jobs_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_reports_updated_at" BEFORE UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_reports_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_shipment_status_event" AFTER UPDATE ON "public"."device_shipments" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."create_shipment_status_event"();



CREATE OR REPLACE TRIGGER "trigger_support_cases_updated_at" BEFORE UPDATE ON "public"."support_cases" FOR EACH ROW EXECUTE FUNCTION "public"."update_support_cases_updated_at"();



CREATE OR REPLACE TRIGGER "update_kpi_thresholds_timestamp" BEFORE UPDATE ON "public"."kpi_thresholds" FOR EACH ROW EXECUTE FUNCTION "public"."update_operational_settings_timestamp"();



CREATE OR REPLACE TRIGGER "update_notification_templates_timestamp" BEFORE UPDATE ON "public"."notification_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_operational_settings_timestamp"();



CREATE OR REPLACE TRIGGER "update_patient_funnels_updated_at_trigger" BEFORE UPDATE ON "public"."patient_funnels" FOR EACH ROW EXECUTE FUNCTION "public"."update_patient_funnels_updated_at"();



CREATE OR REPLACE TRIGGER "update_patient_state_updated_at_trigger" BEFORE UPDATE ON "public"."patient_state" FOR EACH ROW EXECUTE FUNCTION "public"."update_patient_state_updated_at"();



CREATE OR REPLACE TRIGGER "update_reassessment_rules_timestamp" BEFORE UPDATE ON "public"."reassessment_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_operational_settings_timestamp"();



CREATE OR REPLACE TRIGGER "update_review_records_updated_at" BEFORE UPDATE ON "public"."review_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_review_records_updated_at"();



CREATE OR REPLACE TRIGGER "update_safety_check_results_updated_at" BEFORE UPDATE ON "public"."safety_check_results" FOR EACH ROW EXECUTE FUNCTION "public"."update_safety_check_results_updated_at"();



ALTER TABLE ONLY "public"."amy_chat_messages"
    ADD CONSTRAINT "amy_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."anamnesis_entries"
    ADD CONSTRAINT "anamnesis_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."anamnesis_entries"
    ADD CONSTRAINT "anamnesis_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."anamnesis_entries"
    ADD CONSTRAINT "anamnesis_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."anamnesis_entries"
    ADD CONSTRAINT "anamnesis_entries_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."anamnesis_entry_versions"
    ADD CONSTRAINT "anamnesis_entry_versions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."anamnesis_entry_versions"
    ADD CONSTRAINT "anamnesis_entry_versions_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."anamnesis_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_answers"
    ADD CONSTRAINT "assessment_answers_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_events"
    ADD CONSTRAINT "assessment_events_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_current_step_id_fkey" FOREIGN KEY ("current_step_id") REFERENCES "public"."funnel_steps"("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."calculated_results"
    ADD CONSTRAINT "calculated_results_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calculated_results"
    ADD CONSTRAINT "calculated_results_funnel_version_id_fkey" FOREIGN KEY ("funnel_version_id") REFERENCES "public"."funnel_versions"("id");



ALTER TABLE ONLY "public"."clinical_intakes"
    ADD CONSTRAINT "clinical_intakes_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "public"."amy_chat_messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clinical_intakes"
    ADD CONSTRAINT "clinical_intakes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clinical_intakes"
    ADD CONSTRAINT "clinical_intakes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinical_intakes"
    ADD CONSTRAINT "clinical_intakes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinical_intakes"
    ADD CONSTRAINT "clinical_intakes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clinical_intakes"
    ADD CONSTRAINT "clinical_intakes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinician_patient_assignments"
    ADD CONSTRAINT "clinician_patient_assignments_clinician_fkey" FOREIGN KEY ("clinician_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinician_patient_assignments"
    ADD CONSTRAINT "clinician_patient_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clinician_patient_assignments"
    ADD CONSTRAINT "clinician_patient_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinician_patient_assignments"
    ADD CONSTRAINT "clinician_patient_assignments_patient_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consult_note_versions"
    ADD CONSTRAINT "consult_note_versions_consult_note_id_fkey" FOREIGN KEY ("consult_note_id") REFERENCES "public"."consult_notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consult_note_versions"
    ADD CONSTRAINT "consult_note_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."consult_notes"
    ADD CONSTRAINT "consult_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."consult_notes"
    ADD CONSTRAINT "consult_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consult_notes"
    ADD CONSTRAINT "consult_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consult_notes"
    ADD CONSTRAINT "consult_notes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_page_sections"
    ADD CONSTRAINT "content_page_sections_content_page_id_fkey" FOREIGN KEY ("content_page_id") REFERENCES "public"."content_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_pages"
    ADD CONSTRAINT "content_pages_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id");



ALTER TABLE ONLY "public"."design_tokens"
    ADD CONSTRAINT "design_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."design_tokens"
    ADD CONSTRAINT "design_tokens_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_shipments"
    ADD CONSTRAINT "device_shipments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."device_shipments"
    ADD CONSTRAINT "device_shipments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_shipments"
    ADD CONSTRAINT "device_shipments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_shipments"
    ADD CONSTRAINT "device_shipments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."diagnosis_artifacts"
    ADD CONSTRAINT "diagnosis_artifacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diagnosis_artifacts"
    ADD CONSTRAINT "diagnosis_artifacts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diagnosis_artifacts"
    ADD CONSTRAINT "diagnosis_artifacts_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."diagnosis_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diagnosis_runs"
    ADD CONSTRAINT "diagnosis_runs_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diagnosis_runs"
    ADD CONSTRAINT "diagnosis_runs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_measures"
    ADD CONSTRAINT "fk_patient_measures_patient" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profiles"("id");



ALTER TABLE ONLY "public"."patient_measures"
    ADD CONSTRAINT "fk_patient_measures_report" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "fk_patient_measures_report" ON "public"."patient_measures" IS 'Cascade deletes when parent report is deleted to maintain referential integrity';



ALTER TABLE ONLY "public"."funnel_publish_history"
    ADD CONSTRAINT "funnel_publish_history_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels_catalog"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_publish_history"
    ADD CONSTRAINT "funnel_publish_history_previous_version_id_fkey" FOREIGN KEY ("previous_version_id") REFERENCES "public"."funnel_versions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnel_publish_history"
    ADD CONSTRAINT "funnel_publish_history_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnel_publish_history"
    ADD CONSTRAINT "funnel_publish_history_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."funnel_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_question_rules"
    ADD CONSTRAINT "funnel_question_rules_funnel_step_id_fkey" FOREIGN KEY ("funnel_step_id") REFERENCES "public"."funnel_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_question_rules"
    ADD CONSTRAINT "funnel_question_rules_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_step_questions"
    ADD CONSTRAINT "funnel_step_questions_funnel_step_id_fkey" FOREIGN KEY ("funnel_step_id") REFERENCES "public"."funnel_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_step_questions"
    ADD CONSTRAINT "funnel_step_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_steps"
    ADD CONSTRAINT "funnel_steps_content_page_id_fkey" FOREIGN KEY ("content_page_id") REFERENCES "public"."content_pages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnel_steps"
    ADD CONSTRAINT "funnel_steps_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_triage_settings"
    ADD CONSTRAINT "funnel_triage_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnel_triage_settings"
    ADD CONSTRAINT "funnel_triage_settings_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels_catalog"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_triage_settings"
    ADD CONSTRAINT "funnel_triage_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnel_versions"
    ADD CONSTRAINT "funnel_versions_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels_catalog"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_versions"
    ADD CONSTRAINT "funnel_versions_parent_version_id_fkey" FOREIGN KEY ("parent_version_id") REFERENCES "public"."funnel_versions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnel_versions"
    ADD CONSTRAINT "funnel_versions_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnels_catalog"
    ADD CONSTRAINT "funnels_catalog_default_version_id_fkey" FOREIGN KEY ("default_version_id") REFERENCES "public"."funnel_versions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kpi_thresholds"
    ADD CONSTRAINT "kpi_thresholds_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kpi_thresholds"
    ADD CONSTRAINT "kpi_thresholds_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."navigation_item_configs"
    ADD CONSTRAINT "navigation_item_configs_navigation_item_id_fkey" FOREIGN KEY ("navigation_item_id") REFERENCES "public"."navigation_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."operational_settings_audit"
    ADD CONSTRAINT "operational_settings_audit_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."patient_funnels"
    ADD CONSTRAINT "patient_funnels_active_version_id_fkey" FOREIGN KEY ("active_version_id") REFERENCES "public"."funnel_versions"("id");



ALTER TABLE ONLY "public"."patient_funnels"
    ADD CONSTRAINT "patient_funnels_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels_catalog"("id");



ALTER TABLE ONLY "public"."patient_funnels"
    ADD CONSTRAINT "patient_funnels_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_profiles"
    ADD CONSTRAINT "patient_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_state"
    ADD CONSTRAINT "patient_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pre_screening_calls"
    ADD CONSTRAINT "pre_screening_calls_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pre_screening_calls"
    ADD CONSTRAINT "pre_screening_calls_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pre_screening_calls"
    ADD CONSTRAINT "pre_screening_calls_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."priority_rankings"
    ADD CONSTRAINT "priority_rankings_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."processing_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."priority_rankings"
    ADD CONSTRAINT "priority_rankings_risk_bundle_id_fkey" FOREIGN KEY ("risk_bundle_id") REFERENCES "public"."risk_bundles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reassessment_rules"
    ADD CONSTRAINT "reassessment_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."reassessment_rules"
    ADD CONSTRAINT "reassessment_rules_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels_catalog"("id");



ALTER TABLE ONLY "public"."reassessment_rules"
    ADD CONSTRAINT "reassessment_rules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."report_sections_legacy"
    ADD CONSTRAINT "report_sections_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_funnel_version_id_fkey" FOREIGN KEY ("funnel_version_id") REFERENCES "public"."funnel_versions"("id");



ALTER TABLE ONLY "public"."risk_bundles"
    ADD CONSTRAINT "risk_bundles_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."risk_bundles"
    ADD CONSTRAINT "risk_bundles_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."processing_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipment_events"
    ADD CONSTRAINT "shipment_events_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shipment_events"
    ADD CONSTRAINT "shipment_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."device_shipments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."triage_case_actions"
    ADD CONSTRAINT "triage_case_actions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."triage_case_actions"
    ADD CONSTRAINT "triage_case_actions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."triage_case_actions"
    ADD CONSTRAINT "triage_case_actions_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels_catalog"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."triage_case_actions"
    ADD CONSTRAINT "triage_case_actions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."triage_sessions"
    ADD CONSTRAINT "triage_sessions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_org_membership"
    ADD CONSTRAINT "user_org_membership_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_org_membership"
    ADD CONSTRAINT "user_org_membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can create consult notes in org" ON "public"."consult_notes" FOR INSERT WITH CHECK (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can manage funnel versions" ON "public"."funnel_versions" USING ("public"."has_any_role"('admin'::"public"."user_role")) WITH CHECK ("public"."has_any_role"('admin'::"public"."user_role"));



CREATE POLICY "Admins can manage funnels" ON "public"."funnels_catalog" USING ("public"."has_any_role"('admin'::"public"."user_role")) WITH CHECK ("public"."has_any_role"('admin'::"public"."user_role"));



CREATE POLICY "Admins can manage org anamnesis entries" ON "public"."anamnesis_entries" USING (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role")) WITH CHECK (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can manage org assignments" ON "public"."clinician_patient_assignments" USING (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role")) WITH CHECK (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can manage org memberships" ON "public"."user_org_membership" USING (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role")) WITH CHECK (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can update org consult notes" ON "public"."consult_notes" FOR UPDATE USING (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can update own org settings" ON "public"."organizations" FOR UPDATE USING (("public"."current_user_role"("id") = 'admin'::"public"."user_role")) WITH CHECK (("public"."current_user_role"("id") = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can view org anamnesis entries" ON "public"."anamnesis_entries" FOR SELECT USING (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can view org assignments" ON "public"."clinician_patient_assignments" FOR SELECT USING (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can view org audit logs" ON "public"."audit_log" FOR SELECT USING ("public"."has_any_role"('admin'::"public"."user_role"));



CREATE POLICY "Admins can view org consult note versions" ON "public"."consult_note_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."consult_notes" "cn"
  WHERE (("cn"."id" = "consult_note_versions"."consult_note_id") AND ("public"."current_user_role"("cn"."organization_id") = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view org consult notes" ON "public"."consult_notes" FOR SELECT USING (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role"));



CREATE POLICY "Admins can view org entry versions" ON "public"."anamnesis_entry_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."anamnesis_entries" "ae"
  WHERE (("ae"."id" = "anamnesis_entry_versions"."entry_id") AND ("public"."current_user_role"("ae"."organization_id") = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view org intakes" ON "public"."clinical_intakes" FOR SELECT USING ((("organization_id" IS NOT NULL) AND ("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role")));



CREATE POLICY "Admins can view org memberships" ON "public"."user_org_membership" FOR SELECT USING (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role"));



CREATE POLICY "Allow authenticated users to read active funnels" ON "public"."funnels" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Allow authenticated users to read funnel_step_questions" ON "public"."funnel_step_questions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read funnel_steps" ON "public"."funnel_steps" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read funnels" ON "public"."funnels" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Allow authenticated users to read questions" ON "public"."questions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view active funnels" ON "public"."funnels_catalog" FOR SELECT USING ((("is_active" = true) OR "public"."has_any_role"('admin'::"public"."user_role")));



CREATE POLICY "Authenticated users can view funnel versions" ON "public"."funnel_versions" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."funnels_catalog"
  WHERE (("funnels_catalog"."id" = "funnel_versions"."funnel_id") AND ("funnels_catalog"."is_active" = true)))) OR "public"."has_any_role"('admin'::"public"."user_role")));



CREATE POLICY "Authenticated users can view pillars" ON "public"."pillars" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Clinician/admin can read all funnels" ON "public"."funnels" FOR SELECT TO "authenticated" USING (("public"."has_role"('clinician'::"text") OR "public"."has_role"('admin'::"text")));



CREATE POLICY "Clinician/admin can update funnel_step_questions" ON "public"."funnel_step_questions" FOR UPDATE TO "authenticated" USING (("public"."has_role"('clinician'::"text") OR "public"."has_role"('admin'::"text"))) WITH CHECK (("public"."has_role"('clinician'::"text") OR "public"."has_role"('admin'::"text")));



CREATE POLICY "Clinician/admin can update funnel_steps" ON "public"."funnel_steps" FOR UPDATE TO "authenticated" USING (("public"."has_role"('clinician'::"text") OR "public"."has_role"('admin'::"text"))) WITH CHECK (("public"."has_role"('clinician'::"text") OR "public"."has_role"('admin'::"text")));



CREATE POLICY "Clinician/admin can update funnels" ON "public"."funnels" FOR UPDATE TO "authenticated" USING (("public"."has_role"('clinician'::"text") OR "public"."has_role"('admin'::"text"))) WITH CHECK (("public"."has_role"('clinician'::"text") OR "public"."has_role"('admin'::"text")));



CREATE POLICY "Clinicians and admins can manage funnel_step_questions" ON "public"."funnel_step_questions" FOR UPDATE TO "authenticated" USING (("public"."has_any_role"('admin'::"public"."user_role") OR "public"."has_any_role"('clinician'::"public"."user_role"))) WITH CHECK (("public"."has_any_role"('admin'::"public"."user_role") OR "public"."has_any_role"('clinician'::"public"."user_role")));



CREATE POLICY "Clinicians and admins can manage funnel_steps" ON "public"."funnel_steps" FOR UPDATE TO "authenticated" USING (("public"."has_any_role"('admin'::"public"."user_role") OR "public"."has_any_role"('clinician'::"public"."user_role"))) WITH CHECK (("public"."has_any_role"('admin'::"public"."user_role") OR "public"."has_any_role"('clinician'::"public"."user_role")));



CREATE POLICY "Clinicians and admins can manage funnels" ON "public"."funnels" FOR UPDATE TO "authenticated" USING (("public"."has_any_role"('admin'::"public"."user_role") OR "public"."has_any_role"('clinician'::"public"."user_role"))) WITH CHECK (("public"."has_any_role"('admin'::"public"."user_role") OR "public"."has_any_role"('clinician'::"public"."user_role")));



CREATE POLICY "Clinicians and admins can read all funnels" ON "public"."funnels" FOR SELECT TO "authenticated" USING (("public"."has_any_role"('admin'::"public"."user_role") OR "public"."has_any_role"('clinician'::"public"."user_role")));



CREATE POLICY "Clinicians and admins can read all funnels (app role)" ON "public"."funnels" FOR SELECT TO "authenticated" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text")));



CREATE POLICY "Clinicians and admins can update funnel_step_questions (app rol" ON "public"."funnel_step_questions" FOR UPDATE TO "authenticated" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text"))) WITH CHECK (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text")));



CREATE POLICY "Clinicians and admins can update funnel_steps (app role)" ON "public"."funnel_steps" FOR UPDATE TO "authenticated" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text"))) WITH CHECK (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text")));



CREATE POLICY "Clinicians and admins can update funnels (app role)" ON "public"."funnels" FOR UPDATE TO "authenticated" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text"))) WITH CHECK (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text")));



CREATE POLICY "Clinicians and admins can view all funnels_catalog (app role)" ON "public"."funnels_catalog" FOR SELECT USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text")));



CREATE POLICY "Clinicians can archive consult notes" ON "public"."consult_notes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."clinician_patient_assignments" "cpa"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."user_id" = "cpa"."patient_user_id")))
  WHERE (("cpa"."clinician_user_id" = "auth"."uid"()) AND ("pp"."id" = "consult_notes"."patient_id") AND ("cpa"."organization_id" = "consult_notes"."organization_id")))));



CREATE POLICY "Clinicians can create consult notes for assigned patients" ON "public"."consult_notes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."clinician_patient_assignments" "cpa"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."user_id" = "cpa"."patient_user_id")))
  WHERE (("cpa"."clinician_user_id" = "auth"."uid"()) AND ("pp"."id" = "consult_notes"."patient_id") AND ("cpa"."organization_id" = "consult_notes"."organization_id")))));



CREATE POLICY "Clinicians can insert anamnesis entries for assigned patients" ON "public"."anamnesis_entries" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."clinician_patient_assignments" "cpa"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."user_id" = "cpa"."patient_user_id")))
  WHERE (("cpa"."clinician_user_id" = "auth"."uid"()) AND ("pp"."id" = "anamnesis_entries"."patient_id") AND ("cpa"."organization_id" = "anamnesis_entries"."organization_id")))));



CREATE POLICY "Clinicians can update anamnesis entries for assigned patients" ON "public"."anamnesis_entries" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."clinician_patient_assignments" "cpa"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."user_id" = "cpa"."patient_user_id")))
  WHERE (("cpa"."clinician_user_id" = "auth"."uid"()) AND ("pp"."id" = "anamnesis_entries"."patient_id") AND ("cpa"."organization_id" = "anamnesis_entries"."organization_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."clinician_patient_assignments" "cpa"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."user_id" = "cpa"."patient_user_id")))
  WHERE (("cpa"."clinician_user_id" = "auth"."uid"()) AND ("pp"."id" = "anamnesis_entries"."patient_id") AND ("cpa"."organization_id" = "anamnesis_entries"."organization_id")))));



CREATE POLICY "Clinicians can view all assessment answers" ON "public"."assessment_answers" FOR SELECT USING ("public"."is_clinician"());



CREATE POLICY "Clinicians can view all measures" ON "public"."patient_measures" FOR SELECT USING ("public"."is_clinician"());



CREATE POLICY "Clinicians can view all patient states" ON "public"."patient_state" FOR SELECT USING ("public"."is_clinician"());



CREATE POLICY "Clinicians can view all profiles" ON "public"."patient_profiles" FOR SELECT USING ("public"."is_clinician"());



CREATE POLICY "Clinicians can view all reports" ON "public"."reports" FOR SELECT USING ("public"."is_clinician"());



CREATE POLICY "Clinicians can view assigned patient AMY chat messages" ON "public"."amy_chat_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clinician_patient_assignments" "cpa"
  WHERE (("cpa"."clinician_user_id" = "auth"."uid"()) AND ("cpa"."patient_user_id" = "amy_chat_messages"."user_id")))));



CREATE POLICY "Clinicians can view assigned patient anamnesis entries" ON "public"."anamnesis_entries" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."clinician_patient_assignments" "cpa"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."user_id" = "cpa"."patient_user_id")))
  WHERE (("cpa"."clinician_user_id" = "auth"."uid"()) AND ("pp"."id" = "anamnesis_entries"."patient_id") AND ("cpa"."organization_id" = "anamnesis_entries"."organization_id")))));



CREATE POLICY "Clinicians can view assigned patient consult note versions" ON "public"."consult_note_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."consult_notes" "cn"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."id" = "cn"."patient_id")))
     JOIN "public"."clinician_patient_assignments" "cpa" ON (("cpa"."patient_user_id" = "pp"."user_id")))
  WHERE (("cn"."id" = "consult_note_versions"."consult_note_id") AND ("cpa"."clinician_user_id" = "auth"."uid"()) AND ("cpa"."organization_id" = "cn"."organization_id")))));



CREATE POLICY "Clinicians can view assigned patient consult notes" ON "public"."consult_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."clinician_patient_assignments" "cpa"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."user_id" = "cpa"."patient_user_id")))
  WHERE (("cpa"."clinician_user_id" = "auth"."uid"()) AND ("pp"."id" = "consult_notes"."patient_id") AND ("cpa"."organization_id" = "consult_notes"."organization_id")))));



CREATE POLICY "Clinicians can view assigned patient intakes" ON "public"."clinical_intakes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clinician_patient_assignments" "cpa"
  WHERE (("cpa"."clinician_user_id" = "auth"."uid"()) AND ("cpa"."patient_user_id" = "clinical_intakes"."user_id")))));



CREATE POLICY "Clinicians can view own assignments" ON "public"."clinician_patient_assignments" FOR SELECT USING (("clinician_user_id" = "auth"."uid"()));



CREATE POLICY "Clinicians can view versions for assigned patients" ON "public"."anamnesis_entry_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."anamnesis_entries" "ae"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."id" = "ae"."patient_id")))
     JOIN "public"."clinician_patient_assignments" "cpa" ON ((("cpa"."patient_user_id" = "pp"."user_id") AND ("cpa"."organization_id" = "ae"."organization_id"))))
  WHERE (("ae"."id" = "anamnesis_entry_versions"."entry_id") AND ("cpa"."clinician_user_id" = "auth"."uid"())))));



CREATE POLICY "Patients can insert own anamnesis entries" ON "public"."anamnesis_entries" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."patient_profiles" "pp"
  WHERE (("pp"."id" = "anamnesis_entries"."patient_id") AND ("pp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Patients can insert own assessment answers" ON "public"."assessment_answers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."assessments"
  WHERE (("assessments"."id" = "assessment_answers"."assessment_id") AND ("assessments"."patient_id" = "public"."get_my_patient_profile_id"())))));



CREATE POLICY "Patients can insert own assessments" ON "public"."assessments" FOR INSERT WITH CHECK (("patient_id" = "public"."get_my_patient_profile_id"()));



CREATE POLICY "Patients can insert own funnels" ON "public"."patient_funnels" FOR INSERT WITH CHECK (("patient_id" = "public"."get_my_patient_profile_id"()));



CREATE POLICY "Patients can insert own profile" ON "public"."patient_profiles" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Patients can insert own state" ON "public"."patient_state" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Patients can update own anamnesis entries" ON "public"."anamnesis_entries" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."patient_profiles" "pp"
  WHERE (("pp"."id" = "anamnesis_entries"."patient_id") AND ("pp"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."patient_profiles" "pp"
  WHERE (("pp"."id" = "anamnesis_entries"."patient_id") AND ("pp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Patients can update own assessment answers" ON "public"."assessment_answers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."assessments"
  WHERE (("assessments"."id" = "assessment_answers"."assessment_id") AND ("assessments"."patient_id" = "public"."get_my_patient_profile_id"())))));



CREATE POLICY "Patients can update own assessments" ON "public"."assessments" FOR UPDATE USING (("patient_id" = "public"."get_my_patient_profile_id"())) WITH CHECK (("patient_id" = "public"."get_my_patient_profile_id"()));



CREATE POLICY "Patients can update own funnels" ON "public"."patient_funnels" FOR UPDATE USING (("patient_id" = "public"."get_my_patient_profile_id"())) WITH CHECK (("patient_id" = "public"."get_my_patient_profile_id"()));



CREATE POLICY "Patients can update own profile" ON "public"."patient_profiles" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Patients can update own state" ON "public"."patient_state" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Patients can upload own documents" ON "public"."documents" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."assessments"
  WHERE (("assessments"."id" = "documents"."assessment_id") AND ("assessments"."patient_id" = "public"."get_my_patient_profile_id"())))));



CREATE POLICY "Patients can view own anamnesis entries" ON "public"."anamnesis_entries" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patient_profiles" "pp"
  WHERE (("pp"."id" = "anamnesis_entries"."patient_id") AND ("pp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Patients can view own anamnesis entry versions" ON "public"."anamnesis_entry_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."anamnesis_entries" "ae"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."id" = "ae"."patient_id")))
  WHERE (("ae"."id" = "anamnesis_entry_versions"."entry_id") AND ("pp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Patients can view own assessment answers" ON "public"."assessment_answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."assessments"
  WHERE (("assessments"."id" = "assessment_answers"."assessment_id") AND ("assessments"."patient_id" = "public"."get_my_patient_profile_id"())))));



CREATE POLICY "Patients can view own assessment events" ON "public"."assessment_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."assessments"
  WHERE (("assessments"."id" = "assessment_events"."assessment_id") AND ("assessments"."patient_id" = "public"."get_my_patient_profile_id"())))));



CREATE POLICY "Patients can view own assessments" ON "public"."assessments" FOR SELECT TO "authenticated" USING (("patient_id" = "public"."get_my_patient_profile_id"()));



CREATE POLICY "Patients can view own consult note versions" ON "public"."consult_note_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."consult_notes" "cn"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."id" = "cn"."patient_id")))
  WHERE (("cn"."id" = "consult_note_versions"."consult_note_id") AND ("pp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Patients can view own consult notes" ON "public"."consult_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patient_profiles" "pp"
  WHERE (("pp"."id" = "consult_notes"."patient_id") AND ("pp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Patients can view own documents" ON "public"."documents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."assessments"
  WHERE (("assessments"."id" = "documents"."assessment_id") AND ("assessments"."patient_id" = "public"."get_my_patient_profile_id"())))));



CREATE POLICY "Patients can view own flow events" ON "public"."pilot_flow_events" FOR SELECT TO "authenticated" USING ((("patient_id" IS NOT NULL) AND ("patient_id" = "public"."get_my_patient_profile_id"())));



COMMENT ON POLICY "Patients can view own flow events" ON "public"."pilot_flow_events" IS 'E72.R-DB-009: Patients can view pilot flow events related to their own care';



CREATE POLICY "Patients can view own funnels" ON "public"."patient_funnels" FOR SELECT USING (("patient_id" = "public"."get_my_patient_profile_id"()));



CREATE POLICY "Patients can view own measures" ON "public"."patient_measures" FOR SELECT USING (("patient_id" = "public"."get_my_patient_profile_id"()));



CREATE POLICY "Patients can view own profile" ON "public"."patient_profiles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Patients can view own report sections" ON "public"."report_sections_legacy" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."reports" "r"
     JOIN "public"."assessments" "a" ON (("r"."assessment_id" = "a"."id")))
  WHERE (("r"."id" = "report_sections_legacy"."report_id") AND ("a"."patient_id" = "public"."get_my_patient_profile_id"())))));



CREATE POLICY "Patients can view own reports" ON "public"."reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."assessments"
  WHERE (("assessments"."id" = "reports"."assessment_id") AND ("assessments"."patient_id" = "public"."get_my_patient_profile_id"())))));



CREATE POLICY "Patients can view own results" ON "public"."calculated_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."assessments"
  WHERE (("assessments"."id" = "calculated_results"."assessment_id") AND ("assessments"."patient_id" = "public"."get_my_patient_profile_id"())))));



CREATE POLICY "Patients can view own screening calls" ON "public"."pre_screening_calls" FOR SELECT TO "authenticated" USING (("patient_id" = "public"."get_my_patient_profile_id"()));



COMMENT ON POLICY "Patients can view own screening calls" ON "public"."pre_screening_calls" IS 'E72.R-DB-009: Patients can view their own pre-screening call records';



CREATE POLICY "Patients can view own state" ON "public"."patient_state" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Patients can view own tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING ((("patient_id" IS NOT NULL) AND ("patient_id" = "public"."get_my_patient_profile_id"())));



COMMENT ON POLICY "Patients can view own tasks" ON "public"."tasks" IS 'E72.R-DB-009: Patients can view tasks assigned to them (explicit policy for RLS verification compliance)';



CREATE POLICY "Service can insert consult note versions" ON "public"."consult_note_versions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert measures" ON "public"."patient_measures" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert reports" ON "public"."reports" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can update measures" ON "public"."patient_measures" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Service can update reports" ON "public"."reports" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Staff can insert org patient funnels" ON "public"."patient_funnels" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."patient_profiles" "pp"
     JOIN "public"."user_org_membership" "uom1" ON (("pp"."user_id" = "uom1"."user_id")))
  WHERE (("pp"."id" = "patient_funnels"."patient_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_org_membership" "uom2"
          WHERE (("uom2"."user_id" = "auth"."uid"()) AND ("uom2"."organization_id" = "uom1"."organization_id") AND ("uom2"."is_active" = true) AND (("uom2"."role" = 'clinician'::"public"."user_role") OR ("uom2"."role" = 'nurse'::"public"."user_role") OR ("uom2"."role" = 'admin'::"public"."user_role")))))))) OR (EXISTS ( SELECT 1
   FROM "public"."patient_profiles" "pp"
  WHERE (("pp"."id" = "patient_funnels"."patient_id") AND "public"."is_assigned_to_patient"("pp"."user_id"))))));



COMMENT ON POLICY "Staff can insert org patient funnels" ON "public"."patient_funnels" IS 'E74.6: Staff can assign funnels to patients in their organization';



CREATE POLICY "Staff can update org patient funnels" ON "public"."patient_funnels" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM ("public"."patient_profiles" "pp"
     JOIN "public"."user_org_membership" "uom1" ON (("pp"."user_id" = "uom1"."user_id")))
  WHERE (("pp"."id" = "patient_funnels"."patient_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_org_membership" "uom2"
          WHERE (("uom2"."user_id" = "auth"."uid"()) AND ("uom2"."organization_id" = "uom1"."organization_id") AND ("uom2"."is_active" = true) AND (("uom2"."role" = 'clinician'::"public"."user_role") OR ("uom2"."role" = 'nurse'::"public"."user_role") OR ("uom2"."role" = 'admin'::"public"."user_role")))))))) OR (EXISTS ( SELECT 1
   FROM "public"."patient_profiles" "pp"
  WHERE (("pp"."id" = "patient_funnels"."patient_id") AND "public"."is_assigned_to_patient"("pp"."user_id")))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."patient_profiles" "pp"
     JOIN "public"."user_org_membership" "uom1" ON (("pp"."user_id" = "uom1"."user_id")))
  WHERE (("pp"."id" = "patient_funnels"."patient_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_org_membership" "uom2"
          WHERE (("uom2"."user_id" = "auth"."uid"()) AND ("uom2"."organization_id" = "uom1"."organization_id") AND ("uom2"."is_active" = true) AND (("uom2"."role" = 'clinician'::"public"."user_role") OR ("uom2"."role" = 'nurse'::"public"."user_role") OR ("uom2"."role" = 'admin'::"public"."user_role")))))))) OR (EXISTS ( SELECT 1
   FROM "public"."patient_profiles" "pp"
  WHERE (("pp"."id" = "patient_funnels"."patient_id") AND "public"."is_assigned_to_patient"("pp"."user_id"))))));



COMMENT ON POLICY "Staff can update org patient funnels" ON "public"."patient_funnels" IS 'E74.6: Staff can update funnel status/version for patients in their organization';



CREATE POLICY "Staff can view org assessment answers" ON "public"."assessment_answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."assessments" "a"
     JOIN "public"."patient_profiles" "pp" ON (("a"."patient_id" = "pp"."id")))
     JOIN "public"."user_org_membership" "uom1" ON (("pp"."user_id" = "uom1"."user_id")))
  WHERE (("a"."id" = "assessment_answers"."assessment_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_org_membership" "uom2"
          WHERE (("uom2"."user_id" = "auth"."uid"()) AND ("uom2"."organization_id" = "uom1"."organization_id") AND ("uom2"."is_active" = true) AND (("uom2"."role" = 'clinician'::"public"."user_role") OR ("uom2"."role" = 'nurse'::"public"."user_role")))))))));



CREATE POLICY "Staff can view org assessment events" ON "public"."assessment_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."assessments" "a"
     JOIN "public"."patient_profiles" "pp" ON (("a"."patient_id" = "pp"."id")))
     JOIN "public"."user_org_membership" "uom1" ON (("pp"."user_id" = "uom1"."user_id")))
  WHERE (("a"."id" = "assessment_events"."assessment_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_org_membership" "uom2"
          WHERE (("uom2"."user_id" = "auth"."uid"()) AND ("uom2"."organization_id" = "uom1"."organization_id") AND ("uom2"."is_active" = true) AND (("uom2"."role" = 'clinician'::"public"."user_role") OR ("uom2"."role" = 'nurse'::"public"."user_role")))))))));



CREATE POLICY "Staff can view org documents" ON "public"."documents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."assessments" "a"
     JOIN "public"."patient_profiles" "pp" ON (("a"."patient_id" = "pp"."id")))
     JOIN "public"."user_org_membership" "uom1" ON (("pp"."user_id" = "uom1"."user_id")))
  WHERE (("a"."id" = "documents"."assessment_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_org_membership" "uom2"
          WHERE (("uom2"."user_id" = "auth"."uid"()) AND ("uom2"."organization_id" = "uom1"."organization_id") AND ("uom2"."is_active" = true) AND (("uom2"."role" = 'clinician'::"public"."user_role") OR ("uom2"."role" = 'nurse'::"public"."user_role")))))))));



CREATE POLICY "Staff can view org or assigned patients" ON "public"."patient_profiles" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom1"
  WHERE (("uom1"."user_id" = "auth"."uid"()) AND ("uom1"."is_active" = true) AND (("uom1"."role" = 'clinician'::"public"."user_role") OR ("uom1"."role" = 'nurse'::"public"."user_role")) AND (EXISTS ( SELECT 1
           FROM "public"."user_org_membership" "uom2"
          WHERE (("uom2"."user_id" = "patient_profiles"."user_id") AND ("uom2"."organization_id" = "uom1"."organization_id") AND ("uom2"."is_active" = true))))))) OR "public"."is_assigned_to_patient"("user_id")));



CREATE POLICY "Staff can view org patient assessments" ON "public"."assessments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."patient_profiles" "pp"
     JOIN "public"."user_org_membership" "uom_patient" ON ((("uom_patient"."user_id" = "pp"."user_id") AND ("uom_patient"."is_active" = true))))
     JOIN "public"."user_org_membership" "uom_staff" ON ((("uom_staff"."organization_id" = "uom_patient"."organization_id") AND ("uom_staff"."user_id" = "auth"."uid"()) AND ("uom_staff"."is_active" = true) AND ("uom_staff"."role" = ANY (ARRAY['admin'::"public"."user_role", 'clinician'::"public"."user_role", 'nurse'::"public"."user_role"])))))
  WHERE ("pp"."id" = "assessments"."patient_id"))));



CREATE POLICY "Staff can view org patient funnels" ON "public"."patient_funnels" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM ("public"."patient_profiles" "pp"
     JOIN "public"."user_org_membership" "uom1" ON (("pp"."user_id" = "uom1"."user_id")))
  WHERE (("pp"."id" = "patient_funnels"."patient_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_org_membership" "uom2"
          WHERE (("uom2"."user_id" = "auth"."uid"()) AND ("uom2"."organization_id" = "uom1"."organization_id") AND ("uom2"."is_active" = true) AND (("uom2"."role" = 'clinician'::"public"."user_role") OR ("uom2"."role" = 'nurse'::"public"."user_role")))))))) OR (EXISTS ( SELECT 1
   FROM "public"."patient_profiles" "pp"
  WHERE (("pp"."id" = "patient_funnels"."patient_id") AND "public"."is_assigned_to_patient"("pp"."user_id"))))));



CREATE POLICY "Staff can view org profiles" ON "public"."user_profiles" FOR SELECT USING ((("organization_id" = ANY ("public"."get_user_org_ids"())) AND ("public"."has_any_role"('clinician'::"public"."user_role") OR "public"."has_any_role"('nurse'::"public"."user_role") OR "public"."has_any_role"('admin'::"public"."user_role"))));



CREATE POLICY "Staff can view org report sections" ON "public"."report_sections_legacy" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((("public"."reports" "r"
     JOIN "public"."assessments" "a" ON (("r"."assessment_id" = "a"."id")))
     JOIN "public"."patient_profiles" "pp" ON (("a"."patient_id" = "pp"."id")))
     JOIN "public"."user_org_membership" "uom1" ON (("pp"."user_id" = "uom1"."user_id")))
  WHERE (("r"."id" = "report_sections_legacy"."report_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_org_membership" "uom2"
          WHERE (("uom2"."user_id" = "auth"."uid"()) AND ("uom2"."organization_id" = "uom1"."organization_id") AND ("uom2"."is_active" = true) AND (("uom2"."role" = 'clinician'::"public"."user_role") OR ("uom2"."role" = 'nurse'::"public"."user_role")))))))));



CREATE POLICY "Staff can view org reports" ON "public"."reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."assessments" "a"
     JOIN "public"."patient_profiles" "pp" ON (("a"."patient_id" = "pp"."id")))
     JOIN "public"."user_org_membership" "uom1" ON (("pp"."user_id" = "uom1"."user_id")))
  WHERE (("a"."id" = "reports"."assessment_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_org_membership" "uom2"
          WHERE (("uom2"."user_id" = "auth"."uid"()) AND ("uom2"."organization_id" = "uom1"."organization_id") AND ("uom2"."is_active" = true) AND (("uom2"."role" = 'clinician'::"public"."user_role") OR ("uom2"."role" = 'nurse'::"public"."user_role")))))))));



CREATE POLICY "Staff can view org results" ON "public"."calculated_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."assessments" "a"
     JOIN "public"."patient_profiles" "pp" ON (("a"."patient_id" = "pp"."id")))
     JOIN "public"."user_org_membership" "uom1" ON (("pp"."user_id" = "uom1"."user_id")))
  WHERE (("a"."id" = "calculated_results"."assessment_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_org_membership" "uom2"
          WHERE (("uom2"."user_id" = "auth"."uid"()) AND ("uom2"."organization_id" = "uom1"."organization_id") AND ("uom2"."is_active" = true) AND (("uom2"."role" = 'clinician'::"public"."user_role") OR ("uom2"."role" = 'nurse'::"public"."user_role")))))))));



CREATE POLICY "Staff can view patient profiles by org" ON "public"."patient_profiles" FOR SELECT TO "authenticated" USING ("public"."can_staff_see_patient_profile"("auth"."uid"(), "id"));



CREATE POLICY "Users can insert own consents" ON "public"."user_consents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own consents" ON "public"."user_consents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own memberships" ON "public"."user_org_membership" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own organizations" ON "public"."organizations" FOR SELECT USING (("id" = ANY ("public"."get_user_org_ids"())));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "allow_admin_clinician_delete_sections" ON "public"."content_page_sections" FOR DELETE TO "authenticated" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text")));



CREATE POLICY "allow_admin_clinician_insert_sections" ON "public"."content_page_sections" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text")));



CREATE POLICY "allow_admin_clinician_update_sections" ON "public"."content_page_sections" FOR UPDATE TO "authenticated" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text"))) WITH CHECK (("public"."has_role"('admin'::"text") OR "public"."has_role"('clinician'::"text")));



CREATE POLICY "allow_all_read_sections" ON "public"."content_page_sections" FOR SELECT USING (true);



ALTER TABLE "public"."amy_chat_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "amy_chat_messages_patient_insert" ON "public"."amy_chat_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "amy_chat_messages_patient_select" ON "public"."amy_chat_messages" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."anamnesis_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."anamnesis_entry_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calculated_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clinical_intakes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clinical_intakes_patient_insert" ON "public"."clinical_intakes" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (("organization_id" IS NULL) OR "public"."is_member_of_org"("organization_id")) AND (("patient_id" IS NULL) OR ("patient_id" = "public"."get_my_patient_profile_id"()))));



CREATE POLICY "clinical_intakes_patient_select" ON "public"."clinical_intakes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "clinical_intakes_patient_update" ON "public"."clinical_intakes" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND ("status" = 'draft'::"public"."intake_status"))) WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'draft'::"public"."intake_status") AND (("organization_id" IS NULL) OR "public"."is_member_of_org"("organization_id")) AND (("patient_id" IS NULL) OR ("patient_id" = "public"."get_my_patient_profile_id"()))));



ALTER TABLE "public"."clinician_patient_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consult_note_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consult_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_page_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."design_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "design_tokens_admin_delete" ON "public"."design_tokens" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text"))))));



CREATE POLICY "design_tokens_admin_insert" ON "public"."design_tokens" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text"))))));



CREATE POLICY "design_tokens_admin_update" ON "public"."design_tokens" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text"))))));



CREATE POLICY "design_tokens_select_authenticated" ON "public"."design_tokens" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."device_shipments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_shipments_delete_admin" ON "public"."device_shipments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom"
  WHERE (("uom"."user_id" = "auth"."uid"()) AND ("uom"."is_active" = true) AND ("uom"."organization_id" = "device_shipments"."organization_id") AND ("uom"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "device_shipments_insert_staff" ON "public"."device_shipments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom"
  WHERE (("uom"."user_id" = "auth"."uid"()) AND ("uom"."is_active" = true) AND ("uom"."organization_id" = "device_shipments"."organization_id") AND ("uom"."role" = ANY (ARRAY['clinician'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "device_shipments_select_own_patient" ON "public"."device_shipments" FOR SELECT TO "authenticated" USING (("patient_id" IN ( SELECT "patient_profiles"."id"
   FROM "public"."patient_profiles"
  WHERE ("patient_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "device_shipments_select_staff_org" ON "public"."device_shipments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom"
  WHERE (("uom"."user_id" = "auth"."uid"()) AND ("uom"."is_active" = true) AND ("uom"."organization_id" = "device_shipments"."organization_id") AND ("uom"."role" = ANY (ARRAY['clinician'::"public"."user_role", 'nurse'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "device_shipments_update_staff_org" ON "public"."device_shipments" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom"
  WHERE (("uom"."user_id" = "auth"."uid"()) AND ("uom"."is_active" = true) AND ("uom"."organization_id" = "device_shipments"."organization_id") AND ("uom"."role" = ANY (ARRAY['clinician'::"public"."user_role", 'nurse'::"public"."user_role", 'admin'::"public"."user_role"]))))));



ALTER TABLE "public"."diagnosis_artifacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diagnosis_artifacts_clinician_assigned_read" ON "public"."diagnosis_artifacts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ((("u"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text") OR (("u"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")) AND ((("u"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text") OR (EXISTS ( SELECT 1
           FROM "public"."clinician_patient_assignments" "cpa"
          WHERE (("cpa"."clinician_user_id" = "auth"."uid"()) AND ("cpa"."patient_user_id" = "diagnosis_artifacts"."patient_id")))))))));



COMMENT ON POLICY "diagnosis_artifacts_clinician_assigned_read" ON "public"."diagnosis_artifacts" IS 'E76.7: Clinicians can only read diagnosis artifacts for assigned patients. Admins can read all.';



CREATE POLICY "diagnosis_artifacts_patient_read" ON "public"."diagnosis_artifacts" FOR SELECT USING (("patient_id" = "auth"."uid"()));



COMMENT ON POLICY "diagnosis_artifacts_patient_read" ON "public"."diagnosis_artifacts" IS 'E76.6: Patients can read their own diagnosis artifacts';



CREATE POLICY "diagnosis_artifacts_system_insert" ON "public"."diagnosis_artifacts" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."diagnosis_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diagnosis_runs_clinician_assigned_read" ON "public"."diagnosis_runs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ((("u"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text") OR (("u"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")) AND ((("u"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text") OR (EXISTS ( SELECT 1
           FROM "public"."clinician_patient_assignments" "cpa"
          WHERE (("cpa"."clinician_user_id" = "auth"."uid"()) AND ("cpa"."patient_user_id" = "diagnosis_runs"."patient_id")))))))));



COMMENT ON POLICY "diagnosis_runs_clinician_assigned_read" ON "public"."diagnosis_runs" IS 'E76.7: Clinicians can only read diagnosis runs for assigned patients. Admins can read all.';



CREATE POLICY "diagnosis_runs_clinician_insert" ON "public"."diagnosis_runs" FOR INSERT WITH CHECK ((("clinician_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")))))));



CREATE POLICY "diagnosis_runs_patient_read" ON "public"."diagnosis_runs" FOR SELECT USING (("patient_id" = "auth"."uid"()));



COMMENT ON POLICY "diagnosis_runs_patient_read" ON "public"."diagnosis_runs" IS 'E76.6: Patients can read their own diagnosis runs';



CREATE POLICY "diagnosis_runs_system_update" ON "public"."diagnosis_runs" FOR UPDATE USING (true) WITH CHECK (true);



ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnel_publish_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "funnel_publish_history_insert_policy" ON "public"."funnel_publish_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text"))))));



CREATE POLICY "funnel_publish_history_read_policy" ON "public"."funnel_publish_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text"))))));



ALTER TABLE "public"."funnel_step_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnel_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnel_triage_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "funnel_triage_settings_read_staff" ON "public"."funnel_triage_settings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ((("u"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text") OR (("u"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text"))))));



CREATE POLICY "funnel_triage_settings_write_admin" ON "public"."funnel_triage_settings" USING ((EXISTS ( SELECT 1
   FROM "auth"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND (("u"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



ALTER TABLE "public"."funnel_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnels_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."idempotency_keys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idempotency_keys_insert_own" ON "public"."idempotency_keys" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "idempotency_keys_select_clinician" ON "public"."idempotency_keys" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text"))))));



CREATE POLICY "idempotency_keys_select_own" ON "public"."idempotency_keys" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."kpi_thresholds" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kpi_thresholds_admin_modify" ON "public"."kpi_thresholds" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'clinician'::"text"]))))));



CREATE POLICY "kpi_thresholds_select_authenticated" ON "public"."kpi_thresholds" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."medical_validation_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "medical_validation_results_clinician_select" ON "public"."medical_validation_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (((("auth"."users" "u"
     JOIN "public"."clinician_patient_assignments" "cpa" ON (("cpa"."clinician_user_id" = "u"."id")))
     JOIN "public"."processing_jobs" "pj" ON (("pj"."id" = "medical_validation_results"."job_id")))
     JOIN "public"."assessments" "a" ON (("a"."id" = "pj"."assessment_id")))
     JOIN "public"."patient_profiles" "pp" ON ((("pp"."id" = "a"."patient_id") AND ("pp"."user_id" = "cpa"."patient_user_id"))))
  WHERE (("u"."id" = "auth"."uid"()) AND (("u"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text"]))))));



CREATE POLICY "medical_validation_results_patient_select" ON "public"."medical_validation_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."processing_jobs" "pj"
     JOIN "public"."assessments" "a" ON (("a"."id" = "pj"."assessment_id")))
     JOIN "public"."patient_profiles" "pp" ON (("pp"."id" = "a"."patient_id")))
  WHERE (("pj"."id" = "medical_validation_results"."job_id") AND ("pp"."user_id" = "auth"."uid"())))));



CREATE POLICY "medical_validation_results_system_insert" ON "public"."medical_validation_results" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "medical_validation_results_system_update" ON "public"."medical_validation_results" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



ALTER TABLE "public"."navigation_item_configs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "navigation_item_configs_admin_modify" ON "public"."navigation_item_configs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom"
  WHERE (("uom"."user_id" = "auth"."uid"()) AND ("uom"."is_active" = true) AND ("uom"."role" = ANY (ARRAY['admin'::"public"."user_role", 'clinician'::"public"."user_role"]))))));



CREATE POLICY "navigation_item_configs_select_authenticated" ON "public"."navigation_item_configs" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."navigation_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "navigation_items_admin_modify" ON "public"."navigation_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom"
  WHERE (("uom"."user_id" = "auth"."uid"()) AND ("uom"."is_active" = true) AND ("uom"."role" = ANY (ARRAY['admin'::"public"."user_role", 'clinician'::"public"."user_role"]))))));



CREATE POLICY "navigation_items_select_authenticated" ON "public"."navigation_items" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."notification_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notification_templates_admin_modify" ON "public"."notification_templates" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'clinician'::"text"]))))));



CREATE POLICY "notification_templates_select_authenticated" ON "public"."notification_templates" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_select_clinician" ON "public"."notifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("auth"."uid"() = "users"."id") AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text"))))));



CREATE POLICY "notifications_select_own" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notifications_update_own" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "operational_audit_select_admin" ON "public"."operational_settings_audit" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'clinician'::"text"]))))));



ALTER TABLE "public"."operational_settings_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_funnels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_measures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pillars" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pilot_flow_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pilot_flow_events_admin_read" ON "public"."pilot_flow_events" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'clinician'::"text"])));



COMMENT ON POLICY "pilot_flow_events_admin_read" ON "public"."pilot_flow_events" IS 'E6.4.8: Only admins and clinicians can read pilot flow events';



CREATE POLICY "pilot_flow_events_system_insert" ON "public"."pilot_flow_events" FOR INSERT TO "authenticated" WITH CHECK (true);



COMMENT ON POLICY "pilot_flow_events_system_insert" ON "public"."pilot_flow_events" IS 'E6.4.8: All authenticated users can insert events (system-level operation)';



ALTER TABLE "public"."pre_screening_calls" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pre_screening_calls_delete_admin" ON "public"."pre_screening_calls" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "pre_screening_calls_insert_staff" ON "public"."pre_screening_calls" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text"))))) AND ("clinician_id" = "auth"."uid"())));



CREATE POLICY "pre_screening_calls_select_staff" ON "public"."pre_screening_calls" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'nurse'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text"))))) AND (("organization_id" IS NULL) OR ("organization_id" IN ( SELECT "user_org_membership"."organization_id"
   FROM "public"."user_org_membership"
  WHERE (("user_org_membership"."user_id" = "auth"."uid"()) AND ("user_org_membership"."is_active" = true)))))));



CREATE POLICY "pre_screening_calls_update_own" ON "public"."pre_screening_calls" FOR UPDATE TO "authenticated" USING (("clinician_id" = "auth"."uid"())) WITH CHECK (("clinician_id" = "auth"."uid"()));



ALTER TABLE "public"."priority_rankings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "priority_rankings_clinician_read" ON "public"."priority_rankings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text"]))))));



CREATE POLICY "priority_rankings_patient_read" ON "public"."priority_rankings" FOR SELECT TO "authenticated" USING (("risk_bundle_id" IN ( SELECT "rb"."id"
   FROM ("public"."risk_bundles" "rb"
     JOIN "public"."assessments" "a" ON (("rb"."assessment_id" = "a"."id")))
  WHERE ("a"."patient_id" = "auth"."uid"()))));



ALTER TABLE "public"."processing_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "processing_jobs_clinician_select" ON "public"."processing_jobs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((("auth"."users" "u"
     JOIN "public"."clinician_patient_assignments" "cpa" ON (("cpa"."clinician_user_id" = "u"."id")))
     JOIN "public"."assessments" "a" ON (("a"."id" = "processing_jobs"."assessment_id")))
     JOIN "public"."patient_profiles" "pp" ON ((("pp"."id" = "a"."patient_id") AND ("pp"."user_id" = "cpa"."patient_user_id"))))
  WHERE (("u"."id" = "auth"."uid"()) AND (("u"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text"]))))));



CREATE POLICY "processing_jobs_patient_select" ON "public"."processing_jobs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."assessments" "a"
     JOIN "public"."patient_profiles" "pp" ON (("pp"."id" = "a"."patient_id")))
  WHERE (("a"."id" = "processing_jobs"."assessment_id") AND ("pp"."user_id" = "auth"."uid"())))));



CREATE POLICY "processing_jobs_system_insert" ON "public"."processing_jobs" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "processing_jobs_system_update" ON "public"."processing_jobs" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reassessment_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reassessment_rules_admin_modify" ON "public"."reassessment_rules" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'clinician'::"text"]))))));



CREATE POLICY "reassessment_rules_select_authenticated" ON "public"."reassessment_rules" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."report_sections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_sections_insert_service" ON "public"."report_sections" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



ALTER TABLE "public"."report_sections_legacy" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_sections_select_clinician" ON "public"."report_sections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text"]))))));



CREATE POLICY "report_sections_select_own" ON "public"."report_sections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."risk_bundles" "rb"
     JOIN "public"."assessments" "a" ON (("a"."id" = "rb"."assessment_id")))
  WHERE (("rb"."id" = "report_sections"."risk_bundle_id") AND ("a"."patient_id" = "auth"."uid"())))));



CREATE POLICY "report_sections_update_service" ON "public"."report_sections" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "review_records_clinician_insert" ON "public"."review_records" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text"]))))));



CREATE POLICY "review_records_clinician_read" ON "public"."review_records" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text"]))))));



CREATE POLICY "review_records_clinician_update" ON "public"."review_records" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text"]))))));



CREATE POLICY "review_records_service_all" ON "public"."review_records" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



ALTER TABLE "public"."risk_bundles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "risk_bundles_clinician_read" ON "public"."risk_bundles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text"]))))));



CREATE POLICY "risk_bundles_patient_read" ON "public"."risk_bundles" FOR SELECT TO "authenticated" USING (("assessment_id" IN ( SELECT "assessments"."id"
   FROM "public"."assessments"
  WHERE ("assessments"."patient_id" = "auth"."uid"()))));



ALTER TABLE "public"."safety_check_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "safety_check_results_insert_service" ON "public"."safety_check_results" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "safety_check_results_select_clinician" ON "public"."safety_check_results" FOR SELECT USING (((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text"])) OR (EXISTS ( SELECT 1
   FROM ("public"."processing_jobs" "pj"
     JOIN "public"."assessments" "a" ON (("a"."id" = "pj"."assessment_id")))
  WHERE (("pj"."id" = "safety_check_results"."job_id") AND (("auth"."jwt"() ->> 'role'::"text") = 'clinician'::"text"))))));



CREATE POLICY "safety_check_results_select_own" ON "public"."safety_check_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."processing_jobs" "pj"
     JOIN "public"."assessments" "a" ON (("a"."id" = "pj"."assessment_id")))
  WHERE (("pj"."id" = "safety_check_results"."job_id") AND ("a"."patient_id" = "auth"."uid"())))));



CREATE POLICY "safety_check_results_update_service" ON "public"."safety_check_results" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



ALTER TABLE "public"."shipment_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shipment_events_insert_staff" ON "public"."shipment_events" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."device_shipments" "ds"
     JOIN "public"."user_org_membership" "uom" ON (("uom"."organization_id" = "ds"."organization_id")))
  WHERE (("ds"."id" = "shipment_events"."shipment_id") AND ("uom"."user_id" = "auth"."uid"()) AND ("uom"."is_active" = true) AND ("uom"."role" = ANY (ARRAY['clinician'::"public"."user_role", 'nurse'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "shipment_events_no_delete" ON "public"."shipment_events" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "shipment_events_no_update" ON "public"."shipment_events" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "shipment_events_select_own_patient" ON "public"."shipment_events" FOR SELECT TO "authenticated" USING (("shipment_id" IN ( SELECT "device_shipments"."id"
   FROM "public"."device_shipments"
  WHERE ("device_shipments"."patient_id" IN ( SELECT "patient_profiles"."id"
           FROM "public"."patient_profiles"
          WHERE ("patient_profiles"."user_id" = "auth"."uid"()))))));



CREATE POLICY "shipment_events_select_staff_org" ON "public"."shipment_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."device_shipments" "ds"
     JOIN "public"."user_org_membership" "uom" ON (("uom"."organization_id" = "ds"."organization_id")))
  WHERE (("ds"."id" = "shipment_events"."shipment_id") AND ("uom"."user_id" = "auth"."uid"()) AND ("uom"."is_active" = true) AND ("uom"."role" = ANY (ARRAY['clinician'::"public"."user_role", 'nurse'::"public"."user_role", 'admin'::"public"."user_role"]))))));



ALTER TABLE "public"."support_cases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "support_cases_admin_delete" ON "public"."support_cases" FOR DELETE USING (((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom"
  WHERE (("uom"."user_id" = "auth"."uid"()) AND ("uom"."organization_id" = "support_cases"."organization_id") AND ("uom"."is_active" = true))))));



CREATE POLICY "support_cases_patient_insert" ON "public"."support_cases" FOR INSERT WITH CHECK (("patient_id" IN ( SELECT "patient_profiles"."id"
   FROM "public"."patient_profiles"
  WHERE ("patient_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "support_cases_patient_select" ON "public"."support_cases" FOR SELECT USING (("patient_id" IN ( SELECT "patient_profiles"."id"
   FROM "public"."patient_profiles"
  WHERE ("patient_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "support_cases_patient_update" ON "public"."support_cases" FOR UPDATE USING (("patient_id" IN ( SELECT "patient_profiles"."id"
   FROM "public"."patient_profiles"
  WHERE ("patient_profiles"."user_id" = "auth"."uid"())))) WITH CHECK (("patient_id" IN ( SELECT "patient_profiles"."id"
   FROM "public"."patient_profiles"
  WHERE ("patient_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "support_cases_staff_insert" ON "public"."support_cases" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom"
  WHERE (("uom"."user_id" = "auth"."uid"()) AND ("uom"."organization_id" = "support_cases"."organization_id") AND ("uom"."is_active" = true)))) AND (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text", 'nurse'::"text"]))));



CREATE POLICY "support_cases_staff_select" ON "public"."support_cases" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom"
  WHERE (("uom"."user_id" = "auth"."uid"()) AND ("uom"."organization_id" = "support_cases"."organization_id") AND ("uom"."is_active" = true)))) AND (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text", 'nurse'::"text"]))));



CREATE POLICY "support_cases_staff_update" ON "public"."support_cases" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom"
  WHERE (("uom"."user_id" = "auth"."uid"()) AND ("uom"."organization_id" = "support_cases"."organization_id") AND ("uom"."is_active" = true)))) AND (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text", 'nurse'::"text"])))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."user_org_membership" "uom"
  WHERE (("uom"."user_id" = "auth"."uid"()) AND ("uom"."organization_id" = "support_cases"."organization_id") AND ("uom"."is_active" = true)))) AND (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['clinician'::"text", 'admin'::"text", 'nurse'::"text"]))));



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_insert_clinician_admin" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK ((("public"."has_any_role"('clinician'::"public"."user_role") OR "public"."has_any_role"('admin'::"public"."user_role")) AND ("organization_id" = ANY ("public"."get_user_org_ids"()))));



CREATE POLICY "tasks_select_staff_org" ON "public"."tasks" FOR SELECT TO "authenticated" USING ((("public"."is_member_of_org"("organization_id") AND (("public"."current_user_role"("organization_id") = 'clinician'::"public"."user_role") OR ("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role"))) OR ("public"."is_member_of_org"("organization_id") AND ("public"."current_user_role"("organization_id") = 'nurse'::"public"."user_role") AND ("assigned_to_user_id" = "auth"."uid"())) OR ("patient_id" = "public"."get_my_patient_profile_id"())));



CREATE POLICY "tasks_update_assigned_staff" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (("public"."is_member_of_org"("organization_id") AND (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role") OR ("public"."current_user_role"("organization_id") = "assigned_to_role")))) WITH CHECK (("public"."is_member_of_org"("organization_id") AND (("public"."current_user_role"("organization_id") = 'admin'::"public"."user_role") OR ("public"."current_user_role"("organization_id") = "assigned_to_role"))));



ALTER TABLE "public"."triage_case_actions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "triage_case_actions_insert_clinician" ON "public"."triage_case_actions" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text"))))) AND ("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."clinician_patient_assignments" "cpa"
  WHERE (("cpa"."patient_user_id" = "triage_case_actions"."patient_id") AND ("cpa"."clinician_user_id" = "auth"."uid"()))))));



CREATE POLICY "triage_case_actions_read_clinician" ON "public"."triage_case_actions" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_app_meta_data" ->> 'role'::"text") = 'clinician'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text"))))) AND (EXISTS ( SELECT 1
   FROM "public"."clinician_patient_assignments" "cpa"
  WHERE (("cpa"."patient_user_id" = "triage_case_actions"."patient_id") AND ("cpa"."clinician_user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."triage_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "triage_sessions_clinician_admin_read_all" ON "public"."triage_sessions" FOR SELECT TO "authenticated" USING (("public"."has_role"('clinician'::"text") OR "public"."has_role"('admin'::"text")));



COMMENT ON POLICY "triage_sessions_clinician_admin_read_all" ON "public"."triage_sessions" IS 'E6.6.6 AC2: Clinicians and admins can read all triage sessions for pilot debugging';



CREATE POLICY "triage_sessions_insert" ON "public"."triage_sessions" FOR INSERT TO "authenticated" WITH CHECK (("patient_id" = "auth"."uid"()));



COMMENT ON POLICY "triage_sessions_insert" ON "public"."triage_sessions" IS 'E6.6.6 AC3: Authenticated users can insert triage sessions (own patient_id only)';



CREATE POLICY "triage_sessions_patient_read_own" ON "public"."triage_sessions" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



COMMENT ON POLICY "triage_sessions_patient_read_own" ON "public"."triage_sessions" IS 'E6.6.6 AC2: Patients can only read their own triage sessions';



ALTER TABLE "public"."user_consents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_org_membership" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TYPE "public"."review_status" TO "authenticated";
GRANT ALL ON TYPE "public"."review_status" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."anamnesis_entry_audit_log"() TO "anon";
GRANT ALL ON FUNCTION "public"."anamnesis_entry_audit_log"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."anamnesis_entry_audit_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."anamnesis_entry_create_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."anamnesis_entry_create_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."anamnesis_entry_create_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_kpi_thresholds"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_kpi_thresholds"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_kpi_thresholds"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_notification_templates"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_notification_templates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_notification_templates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_patient_funnels_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_patient_funnels_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_patient_funnels_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_reassessment_rules"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_reassessment_rules"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_reassessment_rules"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_staff_see_patient_profile"("staff_user_id" "uuid", "patient_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_staff_see_patient_profile"("staff_user_id" "uuid", "patient_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_staff_see_patient_profile"("staff_user_id" "uuid", "patient_profile_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."cancel_account_deletion"("target_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_account_deletion"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_account_deletion"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_account_deletion"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_idempotency_keys"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_idempotency_keys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_idempotency_keys"() TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_inputs_hash"("p_inputs" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."compute_inputs_hash"("p_inputs" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_inputs_hash"("p_inputs" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_safety_evaluation_key_hash"("p_sections_id" "uuid", "p_prompt_version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."compute_safety_evaluation_key_hash"("p_sections_id" "uuid", "p_prompt_version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_safety_evaluation_key_hash"("p_sections_id" "uuid", "p_prompt_version" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_sampling_hash"("p_job_id" "uuid", "p_salt" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."compute_sampling_hash"("p_job_id" "uuid", "p_salt" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_sampling_hash"("p_job_id" "uuid", "p_salt" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_consult_note_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_consult_note_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_consult_note_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_draft_from_version"("p_source_version_id" "uuid", "p_user_id" "uuid", "p_version_label" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_draft_from_version"("p_source_version_id" "uuid", "p_user_id" "uuid", "p_version_label" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_draft_from_version"("p_source_version_id" "uuid", "p_user_id" "uuid", "p_version_label" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_shipment_status_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_shipment_status_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_shipment_status_event"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_role"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."diagnosis_artifacts_audit_log"() TO "anon";
GRANT ALL ON FUNCTION "public"."diagnosis_artifacts_audit_log"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."diagnosis_artifacts_audit_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."diagnosis_runs_audit_log"() TO "anon";
GRANT ALL ON FUNCTION "public"."diagnosis_runs_audit_log"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."diagnosis_runs_audit_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."diagnostics_pillars_sot"() TO "anon";
GRANT ALL ON FUNCTION "public"."diagnostics_pillars_sot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."diagnostics_pillars_sot"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_clinician_patient_same_org"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_clinician_patient_same_org"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_clinician_patient_same_org"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."execute_account_deletion"("target_user_id" "uuid", "executed_by" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."execute_account_deletion"("target_user_id" "uuid", "executed_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_account_deletion"("target_user_id" "uuid", "executed_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_account_deletion"("target_user_id" "uuid", "executed_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_report_version"("p_funnel_version" "text", "p_algorithm_version" "text", "p_prompt_version" "text", "p_inputs_hash_prefix" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_report_version"("p_funnel_version" "text", "p_algorithm_version" "text", "p_prompt_version" "text", "p_inputs_hash_prefix" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_report_version"("p_funnel_version" "text", "p_algorithm_version" "text", "p_prompt_version" "text", "p_inputs_hash_prefix" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_design_tokens"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_design_tokens"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_design_tokens"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_patient_profile_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_patient_profile_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_patient_profile_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_triage_sla_days"("p_funnel_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_triage_sla_days"("p_funnel_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_triage_sla_days"("p_funnel_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_org_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_org_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_org_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_any_role"("check_role" "public"."user_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_any_role"("check_role" "public"."user_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_any_role"("check_role" "public"."user_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("check_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("check_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("check_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_reminder_count_atomic"("p_shipment_id" "uuid", "p_reminder_timestamp" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_reminder_count_atomic"("p_shipment_id" "uuid", "p_reminder_timestamp" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_reminder_count_atomic"("p_shipment_id" "uuid", "p_reminder_timestamp" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_assigned_to_patient"("patient_uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_assigned_to_patient"("patient_uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_assigned_to_patient"("patient_uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_clinician"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_clinician"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_clinician"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_member_of_org"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_member_of_org"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_member_of_org"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_pilot_eligible"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_pilot_eligible"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_pilot_eligible"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_rls_violation"("table_name" "text", "operation" "text", "attempted_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."log_rls_violation"("table_name" "text", "operation" "text", "attempted_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_rls_violation"("table_name" "text", "operation" "text", "attempted_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."meta_check_required_objects"("required_objects" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."meta_check_required_objects"("required_objects" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."meta_check_required_objects"("required_objects" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_published_version_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_published_version_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_published_version_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."publish_draft_version"("p_draft_id" "uuid", "p_user_id" "uuid", "p_set_as_default" boolean, "p_change_summary" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."publish_draft_version"("p_draft_id" "uuid", "p_user_id" "uuid", "p_set_as_default" boolean, "p_change_summary" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."publish_draft_version"("p_draft_id" "uuid", "p_user_id" "uuid", "p_set_as_default" boolean, "p_change_summary" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."request_account_deletion"("target_user_id" "uuid", "deletion_reason" "text", "retention_days" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."request_account_deletion"("target_user_id" "uuid", "deletion_reason" "text", "retention_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."request_account_deletion"("target_user_id" "uuid", "deletion_reason" "text", "retention_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_account_deletion"("target_user_id" "uuid", "deletion_reason" "text", "retention_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_audit_assessment_access"("staff_user_id" "uuid", "assessment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rls_audit_assessment_access"("staff_user_id" "uuid", "assessment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_audit_assessment_access"("staff_user_id" "uuid", "assessment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_role"("user_email" "text", "user_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_role"("user_email" "text", "user_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_role"("user_email" "text", "user_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."should_sample_job"("p_job_id" "uuid", "p_sampling_percentage" integer, "p_salt" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."should_sample_job"("p_job_id" "uuid", "p_sampling_percentage" integer, "p_salt" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."should_sample_job"("p_job_id" "uuid", "p_sampling_percentage" integer, "p_salt" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_anamnesis_entries_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_anamnesis_entries_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_anamnesis_entries_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_clinical_intake_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_clinical_intake_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_clinical_intake_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_consult_note_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_consult_note_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_consult_note_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_device_shipments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_device_shipments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_device_shipments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_diagnosis_runs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_diagnosis_runs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_diagnosis_runs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_medical_validation_results_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_medical_validation_results_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_medical_validation_results_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_navigation_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_navigation_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_navigation_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_operational_settings_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_operational_settings_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_operational_settings_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_patient_funnels_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_patient_funnels_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_patient_funnels_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_patient_state_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_patient_state_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_patient_state_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pre_screening_calls_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pre_screening_calls_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pre_screening_calls_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_processing_jobs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_processing_jobs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_processing_jobs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_report_sections_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_report_sections_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_report_sections_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_review_records_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_review_records_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_review_records_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_safety_check_results_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_safety_check_results_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_safety_check_results_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_support_cases_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_support_cases_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_support_cases_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."amy_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."amy_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."amy_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."anamnesis_entries" TO "anon";
GRANT ALL ON TABLE "public"."anamnesis_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."anamnesis_entries" TO "service_role";



GRANT ALL ON TABLE "public"."anamnesis_entry_versions" TO "anon";
GRANT ALL ON TABLE "public"."anamnesis_entry_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."anamnesis_entry_versions" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_answers" TO "anon";
GRANT ALL ON TABLE "public"."assessment_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_answers" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_events" TO "anon";
GRANT ALL ON TABLE "public"."assessment_events" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_events" TO "service_role";



GRANT ALL ON TABLE "public"."assessments" TO "anon";
GRANT ALL ON TABLE "public"."assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."calculated_results" TO "anon";
GRANT ALL ON TABLE "public"."calculated_results" TO "authenticated";
GRANT ALL ON TABLE "public"."calculated_results" TO "service_role";



GRANT ALL ON TABLE "public"."clinical_intakes" TO "anon";
GRANT ALL ON TABLE "public"."clinical_intakes" TO "authenticated";
GRANT ALL ON TABLE "public"."clinical_intakes" TO "service_role";



GRANT ALL ON TABLE "public"."clinician_patient_assignments" TO "anon";
GRANT ALL ON TABLE "public"."clinician_patient_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."clinician_patient_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."consult_note_versions" TO "anon";
GRANT ALL ON TABLE "public"."consult_note_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."consult_note_versions" TO "service_role";



GRANT ALL ON TABLE "public"."consult_notes" TO "anon";
GRANT ALL ON TABLE "public"."consult_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."consult_notes" TO "service_role";



GRANT ALL ON TABLE "public"."content_page_sections" TO "anon";
GRANT ALL ON TABLE "public"."content_page_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."content_page_sections" TO "service_role";



GRANT ALL ON TABLE "public"."content_pages" TO "anon";
GRANT ALL ON TABLE "public"."content_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."content_pages" TO "service_role";



GRANT ALL ON TABLE "public"."design_tokens" TO "anon";
GRANT ALL ON TABLE "public"."design_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."design_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."device_shipments" TO "anon";
GRANT ALL ON TABLE "public"."device_shipments" TO "authenticated";
GRANT ALL ON TABLE "public"."device_shipments" TO "service_role";



GRANT ALL ON TABLE "public"."diagnosis_artifacts" TO "anon";
GRANT ALL ON TABLE "public"."diagnosis_artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."diagnosis_artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."diagnosis_runs" TO "anon";
GRANT ALL ON TABLE "public"."diagnosis_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."diagnosis_runs" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_publish_history" TO "anon";
GRANT ALL ON TABLE "public"."funnel_publish_history" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_publish_history" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_question_rules" TO "anon";
GRANT ALL ON TABLE "public"."funnel_question_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_question_rules" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_step_questions" TO "anon";
GRANT ALL ON TABLE "public"."funnel_step_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_step_questions" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_steps" TO "anon";
GRANT ALL ON TABLE "public"."funnel_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_steps" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_triage_settings" TO "anon";
GRANT ALL ON TABLE "public"."funnel_triage_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_triage_settings" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_versions" TO "anon";
GRANT ALL ON TABLE "public"."funnel_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_versions" TO "service_role";



GRANT ALL ON TABLE "public"."funnels" TO "anon";
GRANT ALL ON TABLE "public"."funnels" TO "authenticated";
GRANT ALL ON TABLE "public"."funnels" TO "service_role";



GRANT ALL ON TABLE "public"."funnels_catalog" TO "anon";
GRANT ALL ON TABLE "public"."funnels_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."funnels_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."idempotency_keys" TO "anon";
GRANT ALL ON TABLE "public"."idempotency_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."idempotency_keys" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_thresholds" TO "anon";
GRANT ALL ON TABLE "public"."kpi_thresholds" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_thresholds" TO "service_role";



GRANT ALL ON TABLE "public"."medical_validation_results" TO "anon";
GRANT ALL ON TABLE "public"."medical_validation_results" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_validation_results" TO "service_role";



GRANT ALL ON TABLE "public"."navigation_item_configs" TO "anon";
GRANT ALL ON TABLE "public"."navigation_item_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."navigation_item_configs" TO "service_role";



GRANT ALL ON TABLE "public"."navigation_items" TO "anon";
GRANT ALL ON TABLE "public"."navigation_items" TO "authenticated";
GRANT ALL ON TABLE "public"."navigation_items" TO "service_role";



GRANT ALL ON TABLE "public"."notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT UPDATE("status") ON TABLE "public"."notifications" TO "authenticated";



GRANT UPDATE("read_at") ON TABLE "public"."notifications" TO "authenticated";



GRANT UPDATE("updated_at") ON TABLE "public"."notifications" TO "authenticated";



GRANT ALL ON TABLE "public"."operational_settings_audit" TO "anon";
GRANT ALL ON TABLE "public"."operational_settings_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."operational_settings_audit" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."patient_funnels" TO "anon";
GRANT ALL ON TABLE "public"."patient_funnels" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_funnels" TO "service_role";



GRANT ALL ON TABLE "public"."patient_measures" TO "anon";
GRANT ALL ON TABLE "public"."patient_measures" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_measures" TO "service_role";



GRANT ALL ON TABLE "public"."patient_profiles" TO "anon";
GRANT ALL ON TABLE "public"."patient_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."patient_state" TO "anon";
GRANT ALL ON TABLE "public"."patient_state" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_state" TO "service_role";



GRANT ALL ON TABLE "public"."pending_account_deletions" TO "anon";
GRANT ALL ON TABLE "public"."pending_account_deletions" TO "authenticated";
GRANT ALL ON TABLE "public"."pending_account_deletions" TO "service_role";



GRANT ALL ON TABLE "public"."pillars" TO "anon";
GRANT ALL ON TABLE "public"."pillars" TO "authenticated";
GRANT ALL ON TABLE "public"."pillars" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_flow_events" TO "anon";
GRANT ALL ON TABLE "public"."pilot_flow_events" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_flow_events" TO "service_role";



GRANT ALL ON TABLE "public"."pre_screening_calls" TO "anon";
GRANT ALL ON TABLE "public"."pre_screening_calls" TO "authenticated";
GRANT ALL ON TABLE "public"."pre_screening_calls" TO "service_role";



GRANT ALL ON TABLE "public"."priority_rankings" TO "anon";
GRANT ALL ON TABLE "public"."priority_rankings" TO "authenticated";
GRANT ALL ON TABLE "public"."priority_rankings" TO "service_role";



GRANT ALL ON TABLE "public"."processing_jobs" TO "anon";
GRANT ALL ON TABLE "public"."processing_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."processing_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."reassessment_rules" TO "anon";
GRANT ALL ON TABLE "public"."reassessment_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."reassessment_rules" TO "service_role";



GRANT ALL ON TABLE "public"."report_sections" TO "anon";
GRANT ALL ON TABLE "public"."report_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."report_sections" TO "service_role";



GRANT ALL ON TABLE "public"."report_sections_legacy" TO "anon";
GRANT ALL ON TABLE "public"."report_sections_legacy" TO "authenticated";
GRANT ALL ON TABLE "public"."report_sections_legacy" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."review_records" TO "anon";
GRANT ALL ON TABLE "public"."review_records" TO "authenticated";
GRANT ALL ON TABLE "public"."review_records" TO "service_role";



GRANT ALL ON TABLE "public"."risk_bundles" TO "anon";
GRANT ALL ON TABLE "public"."risk_bundles" TO "authenticated";
GRANT ALL ON TABLE "public"."risk_bundles" TO "service_role";



GRANT ALL ON TABLE "public"."rls_test_results" TO "anon";
GRANT ALL ON TABLE "public"."rls_test_results" TO "authenticated";
GRANT ALL ON TABLE "public"."rls_test_results" TO "service_role";



GRANT ALL ON TABLE "public"."safety_check_results" TO "anon";
GRANT ALL ON TABLE "public"."safety_check_results" TO "authenticated";
GRANT ALL ON TABLE "public"."safety_check_results" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_events" TO "anon";
GRANT ALL ON TABLE "public"."shipment_events" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_events" TO "service_role";



GRANT ALL ON TABLE "public"."support_cases" TO "anon";
GRANT ALL ON TABLE "public"."support_cases" TO "authenticated";
GRANT ALL ON TABLE "public"."support_cases" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."triage_case_actions" TO "anon";
GRANT ALL ON TABLE "public"."triage_case_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."triage_case_actions" TO "service_role";



GRANT ALL ON TABLE "public"."triage_cases_v1" TO "anon";
GRANT ALL ON TABLE "public"."triage_cases_v1" TO "authenticated";
GRANT ALL ON TABLE "public"."triage_cases_v1" TO "service_role";



GRANT ALL ON TABLE "public"."triage_sessions" TO "anon";
GRANT ALL ON TABLE "public"."triage_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."triage_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."user_consents" TO "anon";
GRANT ALL ON TABLE "public"."user_consents" TO "authenticated";
GRANT ALL ON TABLE "public"."user_consents" TO "service_role";



GRANT ALL ON TABLE "public"."user_org_membership" TO "anon";
GRANT ALL ON TABLE "public"."user_org_membership" TO "authenticated";
GRANT ALL ON TABLE "public"."user_org_membership" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































