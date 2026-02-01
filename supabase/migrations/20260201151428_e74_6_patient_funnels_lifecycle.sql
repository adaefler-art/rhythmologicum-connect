-- E74.6: Patient Funnels Lifecycle + Org Scoping
-- 
-- This migration adds clinician permissions for patient_funnels management:
-- 1. RLS policies for staff INSERT/UPDATE on patient_funnels
-- 2. Trigger for audit logging on patient_funnels changes
-- 3. Helper function for validating funnel assignments
--
-- Security: Only staff in same org as patient can manage patient_funnels

-- ============================================================================
-- 1. RLS Policies for Staff Management
-- ============================================================================

-- Staff can insert patient funnels for patients in their org
-- This allows clinicians to assign funnels to patients
CREATE POLICY "Staff can insert org patient funnels" 
ON "public"."patient_funnels" 
FOR INSERT 
WITH CHECK (
  -- Check if patient is in same org as current user
  EXISTS (
    SELECT 1
    FROM "public"."patient_profiles" "pp"
    JOIN "public"."user_org_membership" "uom1" ON ("pp"."user_id" = "uom1"."user_id")
    WHERE "pp"."id" = "patient_funnels"."patient_id"
    AND EXISTS (
      SELECT 1
      FROM "public"."user_org_membership" "uom2"
      WHERE "uom2"."user_id" = "auth"."uid"()
      AND "uom2"."organization_id" = "uom1"."organization_id"
      AND "uom2"."is_active" = true
      AND ("uom2"."role" = 'clinician'::"public"."user_role" 
           OR "uom2"."role" = 'nurse'::"public"."user_role"
           OR "uom2"."role" = 'admin'::"public"."user_role")
    )
  )
  -- OR patient is directly assigned to current user
  OR EXISTS (
    SELECT 1
    FROM "public"."patient_profiles" "pp"
    WHERE "pp"."id" = "patient_funnels"."patient_id"
    AND "public"."is_assigned_to_patient"("pp"."user_id")
  )
);

-- Staff can update patient funnels for patients in their org
-- This allows clinicians to change status, version, etc.
CREATE POLICY "Staff can update org patient funnels" 
ON "public"."patient_funnels" 
FOR UPDATE 
USING (
  -- Check if patient is in same org as current user
  EXISTS (
    SELECT 1
    FROM "public"."patient_profiles" "pp"
    JOIN "public"."user_org_membership" "uom1" ON ("pp"."user_id" = "uom1"."user_id")
    WHERE "pp"."id" = "patient_funnels"."patient_id"
    AND EXISTS (
      SELECT 1
      FROM "public"."user_org_membership" "uom2"
      WHERE "uom2"."user_id" = "auth"."uid"()
      AND "uom2"."organization_id" = "uom1"."organization_id"
      AND "uom2"."is_active" = true
      AND ("uom2"."role" = 'clinician'::"public"."user_role" 
           OR "uom2"."role" = 'nurse'::"public"."user_role"
           OR "uom2"."role" = 'admin'::"public"."user_role")
    )
  )
  -- OR patient is directly assigned to current user
  OR EXISTS (
    SELECT 1
    FROM "public"."patient_profiles" "pp"
    WHERE "pp"."id" = "patient_funnels"."patient_id"
    AND "public"."is_assigned_to_patient"("pp"."user_id")
  )
)
WITH CHECK (
  -- Same check for the new row
  EXISTS (
    SELECT 1
    FROM "public"."patient_profiles" "pp"
    JOIN "public"."user_org_membership" "uom1" ON ("pp"."user_id" = "uom1"."user_id")
    WHERE "pp"."id" = "patient_funnels"."patient_id"
    AND EXISTS (
      SELECT 1
      FROM "public"."user_org_membership" "uom2"
      WHERE "uom2"."user_id" = "auth"."uid"()
      AND "uom2"."organization_id" = "uom1"."organization_id"
      AND "uom2"."is_active" = true
      AND ("uom2"."role" = 'clinician'::"public"."user_role" 
           OR "uom2"."role" = 'nurse'::"public"."user_role"
           OR "uom2"."role" = 'admin'::"public"."user_role")
    )
  )
  OR EXISTS (
    SELECT 1
    FROM "public"."patient_profiles" "pp"
    WHERE "pp"."id" = "patient_funnels"."patient_id"
    AND "public"."is_assigned_to_patient"("pp"."user_id")
  )
);

-- ============================================================================
-- 2. Audit Logging Trigger
-- ============================================================================

-- Function to log patient_funnels changes to audit_log
CREATE OR REPLACE FUNCTION "public"."audit_patient_funnels_changes"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger
DROP TRIGGER IF EXISTS "audit_patient_funnels_changes_trigger" ON "public"."patient_funnels";

CREATE TRIGGER "audit_patient_funnels_changes_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "public"."patient_funnels"
FOR EACH ROW
EXECUTE FUNCTION "public"."audit_patient_funnels_changes"();

-- ============================================================================
-- 3. Updated_at Trigger
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_patient_funnels_updated_at"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS "update_patient_funnels_updated_at_trigger" ON "public"."patient_funnels";

CREATE TRIGGER "update_patient_funnels_updated_at_trigger"
BEFORE UPDATE ON "public"."patient_funnels"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_patient_funnels_updated_at"();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Staff can insert org patient funnels" ON "public"."patient_funnels" 
IS 'E74.6: Staff can assign funnels to patients in their organization';

COMMENT ON POLICY "Staff can update org patient funnels" ON "public"."patient_funnels" 
IS 'E74.6: Staff can update funnel status/version for patients in their organization';

COMMENT ON FUNCTION "public"."audit_patient_funnels_changes"() 
IS 'E74.6: Audit logging for patient_funnels lifecycle changes';

COMMENT ON FUNCTION "public"."update_patient_funnels_updated_at"() 
IS 'E74.6: Auto-update updated_at timestamp on patient_funnels changes';
