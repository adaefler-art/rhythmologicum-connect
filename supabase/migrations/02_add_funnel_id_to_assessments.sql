alter table public.assessments
  add column funnel_id uuid references public.funnels(id);

create index on public.assessments (funnel_id);