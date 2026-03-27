create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'learner' check (role in ('learner', 'educator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position integer not null default 0,
  title text not null,
  detail text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  learner_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, learner_id)
);

create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  module_id uuid not null references public.course_modules (id) on delete cascade,
  progress numeric(5,2) not null default 0 check (progress >= 0 and progress <= 100),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (enrollment_id, module_id)
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  status text not null default 'published' check (status in ('draft', 'published', 'flagged', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  status text not null default 'published' check (status in ('published', 'flagged', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts (id) on delete cascade,
  comment_id uuid references public.community_comments (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  vote_type text not null default 'up' check (vote_type in ('up')),
  created_at timestamptz not null default now(),
  unique nulls not distinct (post_id, comment_id, voter_id)
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  user_id uuid references public.profiles (id) on delete set null,
  user_email text,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  task_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.enrollments enable row level security;
alter table public.course_progress enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_votes enable row level security;
alter table public.jobs enable row level security;

create policy "profiles_are_self_readable"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_are_self_writable"
on public.profiles for insert
with check (auth.uid() = id);

create policy "profiles_are_self_updatable"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "courses_are_owner_readable"
on public.courses for select
using (auth.uid() = owner_id);

create policy "courses_are_owner_writable"
on public.courses for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "modules_follow_course_owner"
on public.course_modules for all
using (
  exists (
    select 1
    from public.courses
    where public.courses.id = public.course_modules.course_id
      and public.courses.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.courses
    where public.courses.id = public.course_modules.course_id
      and public.courses.owner_id = auth.uid()
  )
);

create policy "enrollments_self_visible"
on public.enrollments for select
using (auth.uid() = learner_id);

create policy "enrollments_self_mutable"
on public.enrollments for all
using (auth.uid() = learner_id)
with check (auth.uid() = learner_id);

create policy "course_progress_self_visible"
on public.course_progress for select
using (
  exists (
    select 1
    from public.enrollments
    where public.enrollments.id = public.course_progress.enrollment_id
      and public.enrollments.learner_id = auth.uid()
  )
);

create policy "course_progress_self_mutable"
on public.course_progress for all
using (
  exists (
    select 1
    from public.enrollments
    where public.enrollments.id = public.course_progress.enrollment_id
      and public.enrollments.learner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.enrollments
    where public.enrollments.id = public.course_progress.enrollment_id
      and public.enrollments.learner_id = auth.uid()
  )
);

create policy "community_posts_are_readable"
on public.community_posts for select
using (status = 'published' or auth.uid() = author_id);

create policy "community_posts_are_author_writable"
on public.community_posts for all
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "community_comments_are_readable"
on public.community_comments for select
using (status = 'published' or auth.uid() = author_id);

create policy "community_comments_are_author_writable"
on public.community_comments for all
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "community_votes_are_self_visible"
on public.community_votes for select
using (auth.uid() = voter_id);

create policy "community_votes_are_self_writable"
on public.community_votes for all
using (auth.uid() = voter_id)
with check (auth.uid() = voter_id);

create policy "jobs_are_self_visible"
on public.jobs for select
using (user_id = auth.uid() or user_email = auth.email());

create policy "jobs_are_self_insertable"
on public.jobs for insert
with check (user_id = auth.uid() or user_email = auth.email());

create policy "jobs_are_self_updatable"
on public.jobs for update
using (user_id = auth.uid() or user_email = auth.email())
with check (user_id = auth.uid() or user_email = auth.email());
