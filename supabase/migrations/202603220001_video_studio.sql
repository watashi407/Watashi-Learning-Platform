create table if not exists public.video_projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Lesson production workspace',
  binding_type text not null default 'lesson' check (binding_type in ('lesson', 'course')),
  binding_target_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists video_projects_owner_idx on public.video_projects (owner_user_id);

create table if not exists public.video_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.video_projects (id) on delete cascade,
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  original_file_name text not null,
  source_type text not null default 'uploaded' check (source_type in ('recorded', 'uploaded', 'imported')),
  status text not null default 'uploading' check (status in ('uploading', 'processing', 'ready', 'failed')),
  content_type text not null,
  byte_size bigint not null default 0,
  duration_seconds numeric(10, 2),
  storage_bucket text,
  storage_path text,
  proxy_bucket text,
  proxy_path text,
  render_bucket text,
  render_path text,
  subtitle_bucket text,
  subtitle_path text,
  thumbnail_bucket text,
  thumbnail_path text,
  upload_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists video_assets_project_idx on public.video_assets (project_id, created_at desc);
create index if not exists video_assets_owner_idx on public.video_assets (owner_user_id);

create table if not exists public.video_recording_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.video_projects (id) on delete cascade,
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  requested_sources jsonb not null default '{}'::jsonb,
  client_hints jsonb,
  created_at timestamptz not null default now()
);

create index if not exists video_recording_sessions_project_idx on public.video_recording_sessions (project_id, created_at desc);

create table if not exists public.timeline_clips (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.video_projects (id) on delete cascade,
  asset_id uuid references public.video_assets (id) on delete set null,
  clip_key text not null,
  position integer not null default 0,
  title text not null,
  summary text not null default '',
  start_seconds integer not null default 0,
  end_seconds integer not null default 0,
  tone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, clip_key)
);

create index if not exists timeline_clips_project_idx on public.timeline_clips (project_id, position);

create table if not exists public.audio_edits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.video_projects (id) on delete cascade,
  voice_boost integer not null default 72 check (voice_boost >= 0 and voice_boost <= 100),
  noise_reduction integer not null default 58 check (noise_reduction >= 0 and noise_reduction <= 100),
  music_ducking integer not null default 44 check (music_ducking >= 0 and music_ducking <= 100),
  silence_trim boolean not null default true,
  normalize_dialogue boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subtitle_tracks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.video_projects (id) on delete cascade,
  language text not null default 'en-US',
  format text not null default 'vtt' check (format in ('vtt', 'srt')),
  source text not null default 'manual' check (source in ('generated', 'manual', 'imported')),
  storage_bucket text,
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, language, format)
);

create table if not exists public.subtitle_cues (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.subtitle_tracks (id) on delete cascade,
  cue_key text not null,
  position integer not null default 0,
  start_label text not null,
  end_label text not null,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (track_id, cue_key)
);

create index if not exists subtitle_cues_track_idx on public.subtitle_cues (track_id, position);

create table if not exists public.overlays (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.video_projects (id) on delete cascade,
  overlay_key text not null,
  label text not null,
  description text not null default '',
  placement text not null default '',
  enabled boolean not null default false,
  start_seconds integer,
  end_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, overlay_key)
);

create index if not exists overlays_project_idx on public.overlays (project_id, created_at asc);

alter table public.video_projects enable row level security;
alter table public.video_assets enable row level security;
alter table public.video_recording_sessions enable row level security;
alter table public.timeline_clips enable row level security;
alter table public.audio_edits enable row level security;
alter table public.subtitle_tracks enable row level security;
alter table public.subtitle_cues enable row level security;
alter table public.overlays enable row level security;

create policy "video_projects_are_owner_visible"
on public.video_projects for select
using (auth.uid() = owner_user_id);

create policy "video_projects_are_owner_writable"
on public.video_projects for all
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "video_assets_follow_owner"
on public.video_assets for all
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "video_recording_sessions_follow_owner"
on public.video_recording_sessions for all
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "timeline_clips_follow_project_owner"
on public.timeline_clips for all
using (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.timeline_clips.project_id
      and public.video_projects.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.timeline_clips.project_id
      and public.video_projects.owner_user_id = auth.uid()
  )
);

create policy "audio_edits_follow_project_owner"
on public.audio_edits for all
using (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.audio_edits.project_id
      and public.video_projects.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.audio_edits.project_id
      and public.video_projects.owner_user_id = auth.uid()
  )
);

create policy "subtitle_tracks_follow_project_owner"
on public.subtitle_tracks for all
using (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.subtitle_tracks.project_id
      and public.video_projects.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.subtitle_tracks.project_id
      and public.video_projects.owner_user_id = auth.uid()
  )
);

create policy "subtitle_cues_follow_project_owner"
on public.subtitle_cues for all
using (
  exists (
    select 1
    from public.subtitle_tracks
    join public.video_projects on public.video_projects.id = public.subtitle_tracks.project_id
    where public.subtitle_tracks.id = public.subtitle_cues.track_id
      and public.video_projects.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.subtitle_tracks
    join public.video_projects on public.video_projects.id = public.subtitle_tracks.project_id
    where public.subtitle_tracks.id = public.subtitle_cues.track_id
      and public.video_projects.owner_user_id = auth.uid()
  )
);

create policy "overlays_follow_project_owner"
on public.overlays for all
using (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.overlays.project_id
      and public.video_projects.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.video_projects
    where public.video_projects.id = public.overlays.project_id
      and public.video_projects.owner_user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'video-raw',
    'video-raw',
    false,
    2147483648,
    array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'audio/webm', 'audio/wav']
  ),
  (
    'video-proxy',
    'video-proxy',
    false,
    2147483648,
    array['video/mp4', 'video/webm']
  ),
  (
    'video-rendered',
    'video-rendered',
    false,
    2147483648,
    array['video/mp4']
  ),
  (
    'video-subtitles',
    'video-subtitles',
    false,
    10485760,
    array['text/vtt', 'application/x-subrip', 'text/plain']
  ),
  (
    'video-thumbnails',
    'video-thumbnails',
    false,
    52428800,
    array['image/png', 'image/jpeg', 'application/json']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
