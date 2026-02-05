begin;

alter table public.assessments enable row level security;

-- Drop known/select policies that might conflict
 drop policy if exists "Clinicians can view all assessments" on public.assessments;
 drop policy if exists "Staff can view org patient assessments" on public.assessments;
 drop policy if exists "Patients can view own assessments" on public.assessments;
 drop policy if exists "Studio staff fallback can view assessments" on public.assessments;

-- Patient self access (unchanged)
create policy "Patients can view own assessments" on public.assessments
for select to authenticated
using (patient_id = public.get_my_patient_profile_id());

do $body$
declare
  has_org_tables boolean := to_regclass('public.user_org_membership') is not null;
begin
  if has_org_tables then
    raise notice 'Applied org-scoped staff policy';
    execute $policy$
      create policy "Staff can view org patient assessments" on public.assessments
      for select to authenticated
      using (
        exists (
          select 1
          from public.patient_profiles pp
          join public.user_org_membership uom_patient
            on uom_patient.user_id = pp.user_id
           and uom_patient.is_active = true
          join public.user_org_membership uom_staff
            on uom_staff.organization_id = uom_patient.organization_id
           and uom_staff.user_id = auth.uid()
           and uom_staff.is_active = true
           and uom_staff.role in (
             'admin'::public.user_role,
             'clinician'::public.user_role,
             'nurse'::public.user_role
           )
          where pp.id = assessments.patient_id
        )
      )
    $policy$;
  else
    raise notice 'Applied fallback authenticated policy (no org tables)';
    execute $policy$
      create policy "Studio staff fallback can view assessments" on public.assessments
      for select to authenticated
      using (true)
    $policy$;
  end if;
end $body$;

commit;
