create table if not exists public.rate_limits (
  scope text not null,
  identifier text not null,
  bucket_start timestamptz not null,
  count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (scope, identifier, bucket_start)
);

create or replace function public.check_rate_limit(
  p_scope text,
  p_identifier text,
  p_bucket_start timestamptz,
  p_limit integer
)
returns table (
  allowed boolean,
  current_count integer
)
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits (scope, identifier, bucket_start, count)
  values (p_scope, p_identifier, p_bucket_start, 1)
  on conflict (scope, identifier, bucket_start)
  do update set
    count = public.rate_limits.count + 1,
    updated_at = timezone('utc', now())
  returning count into v_count;

  return query
  select v_count <= p_limit, v_count;
end;
$$;
