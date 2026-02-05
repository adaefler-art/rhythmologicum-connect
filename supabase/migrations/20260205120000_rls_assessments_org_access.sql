begin;

drop policy if exists "Clinicians can view all assessments" on public.assessments;
drop policy if exists "Staff can view org patient assessments" on public.assessments;

do $$
declare
  has_org_tables boolean := to_regclass('public.user_org_membership') is not null;
  has_is_admin boolean := to_regprocedure('public.is_admin()') is not null;
  fallback_predicate text := 'public.is_clinician()';
begin
  if has_is_admin then
    fallback_predicate := fallback_predicate || ' OR public.is_admin()';
  end if;

  if has_org_tables then
    execute $$
      create policy "Staff can view org patient assessments" on public.assessments
      for select
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
    $$;
  else
    raise notice 'Org tables missing: applied clinician-only fallback policy';
    execute format($sql$
      create policy "Staff can view org patient assessments" on public.assessments
      for select
      using (%s)
    $sql$, fallback_predicate);
  end if;
end $$;

commit;
