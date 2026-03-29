alter table public.courses
  add column if not exists published_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table public.enrollments
  add column if not exists completed_at timestamptz;

alter table public.video_projects
  add column if not exists status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  add column if not exists export_status text not null default 'idle' check (export_status in ('idle', 'queued', 'processing', 'completed', 'failed'));

create table if not exists public.certificate_templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  layout_json jsonb not null default '{}'::jsonb,
  config_json jsonb not null default '{}'::jsonb,
  branding_logo_bucket text,
  branding_logo_path text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.courses
  add column if not exists default_certificate_template_id uuid references public.certificate_templates (id) on delete set null;

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules (id) on delete cascade,
  title text not null,
  content text not null default '',
  lesson_type text not null default 'lesson' check (lesson_type in ('lesson', 'video', 'quiz', 'resource')),
  video_project_id uuid references public.video_projects (id) on delete set null,
  certificate_template_id uuid references public.certificate_templates (id) on delete set null,
  position integer not null default 0,
  duration_seconds integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, position)
);

create table if not exists public.certificate_issues (
  id uuid primary key default gen_random_uuid(),
  certificate_template_id uuid not null references public.certificate_templates (id) on delete restrict,
  learner_id uuid not null references public.profiles (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  issued_by_user_id uuid references public.profiles (id) on delete set null,
  verification_code text not null unique,
  pdf_bucket text,
  pdf_path text,
  status text not null default 'issued' check (status in ('issued', 'reissued', 'revoked', 'failed')),
  reissued_from_issue_id uuid references public.certificate_issues (id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists certificate_issues_active_unique_idx
  on public.certificate_issues (certificate_template_id, learner_id, course_id)
  where status in ('issued', 'reissued');

create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  source_module text not null check (source_module in ('video', 'course', 'certificate', 'dashboard', 'system')),
  asset_type text not null check (asset_type in ('video', 'audio', 'image', 'subtitle', 'document', 'other')),
  file_name text not null,
  file_type text,
  size_bytes bigint not null default 0,
  storage_bucket text,
  storage_path text,
  variant text not null default 'original',
  linked_entity_type text,
  linked_entity_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists media_library_unique_storage_idx
  on public.media_library (owner_user_id, storage_bucket, storage_path, variant)
  where storage_bucket is not null and storage_path is not null;

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  module text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.video_text_overlays (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.video_projects (id) on delete cascade,
  overlay_key text not null,
  content text not null,
  font_family text not null default 'sans-serif',
  font_size integer not null default 28,
  color text not null default '#ffffff',
  background_color text,
  position text not null default 'bottom' check (position in ('top', 'center', 'bottom')),
  start_seconds integer not null default 0,
  end_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, overlay_key)
);

create table if not exists public.video_image_overlays (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.video_projects (id) on delete cascade,
  overlay_key text not null,
  label text not null default '',
  storage_path text,
  object_url text,
  position text not null default 'top-right'
    check (position in ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')),
  opacity numeric(5,2) not null default 1.0,
  start_seconds integer not null default 0,
  end_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, overlay_key)
);

create table if not exists public.video_effect_settings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.video_projects (id) on delete cascade,
  brightness integer not null default 0,
  contrast integer not null default 0,
  saturation integer not null default 0,
  blur integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_owner_status_updated_idx on public.courses (owner_id, status, updated_at desc);
create index if not exists courses_default_certificate_template_id_idx on public.courses (default_certificate_template_id);
create index if not exists enrollments_course_id_idx on public.enrollments (course_id);
create index if not exists enrollments_learner_id_idx on public.enrollments (learner_id);
create index if not exists enrollments_course_status_updated_idx on public.enrollments (course_id, status, updated_at desc);
create index if not exists course_modules_course_id_idx on public.course_modules (course_id);
create index if not exists course_lessons_module_id_idx on public.course_lessons (module_id);
create index if not exists course_lessons_video_project_id_idx on public.course_lessons (video_project_id);
create index if not exists course_lessons_certificate_template_id_idx on public.course_lessons (certificate_template_id);
create index if not exists certificate_templates_owner_status_updated_idx on public.certificate_templates (owner_user_id, status, updated_at desc);
create index if not exists certificate_issues_template_idx on public.certificate_issues (certificate_template_id);
create index if not exists certificate_issues_learner_idx on public.certificate_issues (learner_id);
create index if not exists certificate_issues_course_idx on public.certificate_issues (course_id);
create index if not exists certificate_issues_verification_code_idx on public.certificate_issues (verification_code);
create index if not exists media_library_owner_created_idx on public.media_library (owner_user_id, created_at desc);
create index if not exists media_library_owner_module_created_idx on public.media_library (owner_user_id, source_module, created_at desc);
create index if not exists activity_logs_user_module_created_idx on public.activity_logs (user_id, module, created_at desc);
create index if not exists activity_logs_entity_idx on public.activity_logs (entity_type, entity_id, created_at desc);
create index if not exists video_text_overlays_project_idx on public.video_text_overlays (project_id);
create index if not exists video_image_overlays_project_idx on public.video_image_overlays (project_id);
create index if not exists video_effect_settings_project_idx on public.video_effect_settings (project_id);
create index if not exists video_projects_owner_status_updated_idx on public.video_projects (owner_user_id, status, updated_at desc);

alter table public.course_lessons enable row level security;
alter table public.certificate_templates enable row level security;
alter table public.certificate_issues enable row level security;
alter table public.media_library enable row level security;
alter table public.activity_logs enable row level security;
alter table public.video_text_overlays enable row level security;
alter table public.video_image_overlays enable row level security;
alter table public.video_effect_settings enable row level security;

create policy "course_lessons_follow_course_owner"
on public.course_lessons for all
using (
  exists (
    select 1
    from public.course_modules
    join public.courses on public.courses.id = public.course_modules.course_id
    where public.course_modules.id = public.course_lessons.module_id
      and public.courses.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.course_modules
    join public.courses on public.courses.id = public.course_modules.course_id
    where public.course_modules.id = public.course_lessons.module_id
      and public.courses.owner_id = (select auth.uid())
  )
);

create policy "certificate_templates_follow_owner"
on public.certificate_templates for all
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy "certificate_issues_readable_for_learner_or_owner"
on public.certificate_issues for select
using (
  learner_id = (select auth.uid())
  or exists (
    select 1
    from public.certificate_templates
    where public.certificate_templates.id = public.certificate_issues.certificate_template_id
      and public.certificate_templates.owner_user_id = (select auth.uid())
  )
);

create policy "certificate_issues_writable_for_template_owner"
on public.certificate_issues for all
using (
  exists (
    select 1
    from public.certificate_templates
    where public.certificate_templates.id = public.certificate_issues.certificate_template_id
      and public.certificate_templates.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.certificate_templates
    where public.certificate_templates.id = public.certificate_issues.certificate_template_id
      and public.certificate_templates.owner_user_id = (select auth.uid())
  )
);

create policy "media_library_follow_owner"
on public.media_library for all
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy "activity_logs_follow_user"
on public.activity_logs for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "video_text_overlays_follow_project_owner"
on public.video_text_overlays for all
using (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.video_text_overlays.project_id
      and public.video_projects.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.video_text_overlays.project_id
      and public.video_projects.owner_user_id = (select auth.uid())
  )
);

create policy "video_image_overlays_follow_project_owner"
on public.video_image_overlays for all
using (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.video_image_overlays.project_id
      and public.video_projects.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.video_image_overlays.project_id
      and public.video_projects.owner_user_id = (select auth.uid())
  )
);

create policy "video_effect_settings_follow_project_owner"
on public.video_effect_settings for all
using (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.video_effect_settings.project_id
      and public.video_projects.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.video_effect_settings.project_id
      and public.video_projects.owner_user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'certificates',
    'certificates',
    false,
    52428800,
    array['application/pdf']
  ),
  (
    'branding-assets',
    'branding-assets',
    false,
    52428800,
    array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.verify_certificate_by_code(code text)
returns table (
  verification_code text,
  certificate_status text,
  issued_at timestamptz,
  certificate_title text,
  course_title text,
  learner_name text
)
language sql
security definer
set search_path = ''
as $$
  select
    ci.verification_code,
    ci.status as certificate_status,
    ci.issued_at,
    ct.title as certificate_title,
    c.title as course_title,
    p.full_name as learner_name
  from public.certificate_issues ci
  join public.certificate_templates ct on ct.id = ci.certificate_template_id
  join public.courses c on c.id = ci.course_id
  join public.profiles p on p.id = ci.learner_id
  where ci.verification_code = code
    and ci.status in ('issued', 'reissued')
  limit 1;
$$;

grant execute on function public.verify_certificate_by_code(text) to anon, authenticated, service_role;
