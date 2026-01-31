alter table public.funnels_catalog
add column if not exists published boolean not null default false;

create index if not exists funnels_catalog_published_idx
on public.funnels_catalog(published);

-- Optional seed for testing
-- update public.funnels_catalog
-- set published = true
-- where slug = 'cardiovascular-age';
