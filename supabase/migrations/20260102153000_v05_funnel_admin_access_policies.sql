-- v0.5: Allow clinician/admin to manage funnels via auth client
--
-- Context:
-- - Current funnels SELECT policy only allows active funnels (is_active = true)
-- - There are no UPDATE policies on funnel config tables
--
-- This breaks clinician/admin management when the API falls back to the auth client.

-- Funnels: clinicians/admins can read all (including inactive)
drop policy if exists "Clinician/admin can read all funnels" on public.funnels;
create policy "Clinician/admin can read all funnels"
on public.funnels
for select
to authenticated
using (
  public.has_role('clinician')
  or public.has_role('admin')
);

-- Funnels: clinicians/admins can update
drop policy if exists "Clinician/admin can update funnels" on public.funnels;
create policy "Clinician/admin can update funnels"
on public.funnels
for update
to authenticated
using (
  public.has_role('clinician')
  or public.has_role('admin')
)
with check (
  public.has_role('clinician')
  or public.has_role('admin')
);

-- Funnel steps: clinicians/admins can update
drop policy if exists "Clinician/admin can update funnel_steps" on public.funnel_steps;
create policy "Clinician/admin can update funnel_steps"
on public.funnel_steps
for update
to authenticated
using (
  public.has_role('clinician')
  or public.has_role('admin')
)
with check (
  public.has_role('clinician')
  or public.has_role('admin')
);

-- Funnel step questions: clinicians/admins can update (toggle is_required / order_index)
drop policy if exists "Clinician/admin can update funnel_step_questions" on public.funnel_step_questions;
create policy "Clinician/admin can update funnel_step_questions"
on public.funnel_step_questions
for update
to authenticated
using (
  public.has_role('clinician')
  or public.has_role('admin')
)
with check (
  public.has_role('clinician')
  or public.has_role('admin')
);
