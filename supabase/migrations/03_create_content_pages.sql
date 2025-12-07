
create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body_markdown text not null,
  status text not null default 'draft', -- draft, published
  layout text default 'default',        -- default, wide, hero
  funnel_id uuid references public.funnels(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.content_pages (slug);
create index on public.content_pages (status);