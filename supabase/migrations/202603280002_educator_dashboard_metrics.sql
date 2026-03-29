create or replace function public.get_educator_dashboard_metrics(owner_id_input uuid)
returns table (
  total_courses bigint,
  total_published_courses bigint,
  total_video_projects bigint,
  total_certificate_templates bigint,
  total_certificates_issued bigint,
  total_draft_items bigint,
  storage_bytes bigint
)
language sql
security definer
set search_path = ''
as $$
  with owned_courses as (
    select status
    from public.courses
    where owner_id = owner_id_input
  ),
  owned_videos as (
    select status
    from public.video_projects
    where owner_user_id = owner_id_input
  ),
  owned_templates as (
    select id, status
    from public.certificate_templates
    where owner_user_id = owner_id_input
  )
  select
    (select count(*) from owned_courses) as total_courses,
    (select count(*) from owned_courses where status = 'published') as total_published_courses,
    (select count(*) from owned_videos) as total_video_projects,
    (select count(*) from owned_templates) as total_certificate_templates,
    (
      select count(*)
      from public.certificate_issues ci
      join owned_templates ot on ot.id = ci.certificate_template_id
    ) as total_certificates_issued,
    (
      (select count(*) from owned_courses where status = 'draft')
      + (select count(*) from owned_videos where status = 'draft')
      + (select count(*) from owned_templates where status = 'draft')
    ) as total_draft_items,
    coalesce((
      select sum(size_bytes)::bigint
      from public.media_library
      where owner_user_id = owner_id_input
    ), 0) as storage_bytes;
$$;

grant execute on function public.get_educator_dashboard_metrics(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
