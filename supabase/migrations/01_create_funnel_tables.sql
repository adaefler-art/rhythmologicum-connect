
-- 1. FUNNELS
create table public.funnels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  is_active boolean not null default true,
  default_theme text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. FUNNEL STEPS
create table public.funnel_steps (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnels(id) on delete cascade,
  order_index int not null,
  title text not null,
  description text,
  type text not null, -- e.g. form, info, summary
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.funnel_steps (funnel_id);
create index on public.funnel_steps (order_index);

-- 3. QUESTIONS (Zentrale Fragenbank)
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  help_text text,
  question_type text not null,
  min_value int,
  max_value int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. FUNNEL STEP QUESTIONS (Join)
create table public.funnel_step_questions (
  id uuid primary key default gen_random_uuid(),
  funnel_step_id uuid not null references public.funnel_steps(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  order_index int not null,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.funnel_step_questions (funnel_step_id);
create index on public.funnel_step_questions (question_id);
create index on public.funnel_step_questions (order_index);