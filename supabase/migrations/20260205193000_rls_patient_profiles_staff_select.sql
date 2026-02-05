-- E78.x: Allow staff to read patient_profiles when they share org membership.

CREATE OR REPLACE FUNCTION public.can_staff_see_patient_profile(
  staff_user_id uuid,
  patient_profile_id uuid
) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
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

ALTER FUNCTION public.can_staff_see_patient_profile(uuid, uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.can_staff_see_patient_profile(uuid, uuid) IS
  'V0.5: Returns true if staff shares an active organization membership with the patient profile owner';

CREATE POLICY "Staff can view patient profiles by org"
  ON public.patient_profiles
  FOR SELECT
  TO authenticated
  USING (public.can_staff_see_patient_profile(auth.uid(), id));

GRANT ALL ON FUNCTION public.can_staff_see_patient_profile(uuid, uuid) TO anon;
GRANT ALL ON FUNCTION public.can_staff_see_patient_profile(uuid, uuid) TO authenticated;
GRANT ALL ON FUNCTION public.can_staff_see_patient_profile(uuid, uuid) TO service_role;
