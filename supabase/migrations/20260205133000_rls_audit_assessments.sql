begin;

create or replace function public.rls_audit_assessment_access(
  staff_user_id uuid,
  assessment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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

grant execute on function public.rls_audit_assessment_access(uuid, uuid) to authenticated;

commit;
