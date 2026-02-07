-- Update required-objects probe to return missing samples and enforce timeout.
create or replace function public.meta_check_required_objects(required_objects text[])
returns table(missing_count int, missing_sample text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  missing_total int;
  missing_sample_local text[];
begin
  perform set_config('statement_timeout', '1500', true);

  select count(*)::int
  into missing_total
  from unnest(required_objects) v(x)
  where to_regclass(v.x) is null;

  select array_agg(x)
  into missing_sample_local
  from (
    select v.x
    from unnest(required_objects) v(x)
    where to_regclass(v.x) is null
    limit 3
  ) as sample;

  missing_count := coalesce(missing_total, 0);
  missing_sample := coalesce(missing_sample_local, '{}'::text[]);
  return next;
end;
$$;

grant execute on function public.meta_check_required_objects(text[]) to anon;
grant execute on function public.meta_check_required_objects(text[]) to authenticated;
grant execute on function public.meta_check_required_objects(text[]) to service_role;
