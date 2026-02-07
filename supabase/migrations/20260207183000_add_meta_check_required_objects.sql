-- Adds a fast required-objects probe for schema readiness checks.
create or replace function public.meta_check_required_objects(required_objects text[])
returns table(missing_count int)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('statement_timeout', '1500ms', true);
  return query
  select count(*)::int
  from unnest(required_objects) v(x)
  where to_regclass(v.x) is null;
end;
$$;

grant execute on function public.meta_check_required_objects(text[]) to anon;
grant execute on function public.meta_check_required_objects(text[]) to authenticated;
grant execute on function public.meta_check_required_objects(text[]) to service_role;
