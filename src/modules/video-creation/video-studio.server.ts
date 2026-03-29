import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import ffmpegPath from 'ffmpeg-static'
import { ensureProfileProvisioned } from '../../features/auth/auth.server'
import { createJob, updateJob } from '../../lib/backend/jobs'
import { createServiceSupabaseClient } from '../../lib/supabase/server'
import { AppError } from '../../shared/errors'
import type { AuthSession } from '../../shared/contracts/auth'
import type {
  CompleteVideoUploadInput,
  CompleteVideoUploadResult,
  CreateVideoProjectInput,
  CreateVideoUploadSessionInput,
  CreateVideoUploadSessionResult,
  DuplicateVideoProjectInput,
  JobRecord,
  LessonBindingOption,
  ProcessingJob,
  QueueVideoJobResult,
  RecordingSessionInput,
  RecordingSessionRecord,
  SaveVideoProjectInput,
  SubtitleCue,
  UploadedVideoAsset,
  VideoProjectListItem,
  VideoProjectSnapshot,
  VideoStudioBootstrap,
  VideoUploadPolicy,
} from '../../shared/contracts/video-studio'
import { hasSupabaseConfig, hasTriggerConfig, getServerEnv } from '../../server/env'
import { triggerJobTask } from '../../lib/backend/trigger'
import {
  createDefaultAudioSettings,
  createDefaultBinding,
  createDefaultExportSettings,
  createDefaultImageOverlays,
  createDefaultProjectSnapshot,
  createDefaultSegments,
  createDefaultStamps,
  createDefaultSubtitleCues,
  createDefaultTextOverlays,
  createDefaultVideoEffects,
  createFallbackBindingOptions,
  createVideoUploadPolicy,
  getConfiguredMaxFileSizeMb,
} from './defaults'
import { appendActivityLog, registerMediaItem } from '../../features/educator/educator-infra.server'

type ProjectRow = {
  id: string
  owner_user_id: string
  title: string
  binding_type: 'lesson' | 'course'
  binding_target_id: string | null
  status: 'draft' | 'published' | 'archived'
  export_status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

type AssetRow = {
  id: string
  project_id: string
  owner_user_id: string
  original_file_name: string
  source_type: 'recorded' | 'uploaded' | 'imported'
  status: 'uploading' | 'processing' | 'ready' | 'failed'
  content_type: string
  byte_size: number
  duration_seconds: number | null
  storage_bucket: string | null
  storage_path: string | null
  proxy_bucket: string | null
  proxy_path: string | null
  render_bucket: string | null
  render_path: string | null
  subtitle_bucket: string | null
  subtitle_path: string | null
  thumbnail_bucket: string | null
  thumbnail_path: string | null
  upload_metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

type SubtitleTrackRow = {
  id: string
  project_id: string
  language: string
  format: string
  source: string
  storage_bucket: string | null
  storage_path: string | null
}

type ProbeJobPayload = {
  projectId: string
  assetId: string
}

type WaveformJobPayload = {
  projectId: string
  assetId: string
}

type SubtitleJobPayload = {
  projectId: string
}

type RenderJobPayload = {
  projectId: string
}

type StorageBuckets = {
  raw: string
  proxy: string
  rendered: string
  subtitles: string
  thumbnails: string
}

type UploadSessionState = {
  uploadId: string
  projectId: string
  ownerUserId: string
  token: string
  objectPath: string
  bucketName: string
  fileName: string
  contentType: string
  contentLength: number
  sourceType: 'recorded' | 'uploaded' | 'imported'
  tusUrl?: string
}

const fallbackProjects = new Map<string, VideoProjectSnapshot>()
const fallbackBindingOptions = new Map<string, LessonBindingOption[]>()
const fallbackUploadSessions = new Map<string, UploadSessionState>()
const fallbackAssets = new Map<string, UploadedVideoAsset>()
const fallbackRecordingSessions = new Map<string, RecordingSessionRecord[]>()
const fallbackJobsByProject = new Map<string, Array<JobRecord>>()

const uploadPolicy = createVideoUploadPolicy(getConfiguredMaxFileSizeMb(getServerEnv().VITE_VIDEO_CREATION_MAX_FILE_SIZE_MB))
const videoStudioTableNames = [
  'profiles',
  'video_projects',
  'video_assets',
  'timeline_clips',
  'audio_edits',
  'subtitle_tracks',
  'subtitle_cues',
  'overlays',
  'video_text_overlays',
  'video_image_overlays',
  'video_effect_settings',
  'video_recording_sessions',
]

function shouldUseVideoStudioFallback(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {
    code?: unknown
    message?: unknown
    details?: unknown
    hint?: unknown
    cause?: unknown
  }

  const code = typeof candidate.code === 'string' ? candidate.code : ''
  const message = [
    candidate.message,
    candidate.details,
    candidate.hint,
  ]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase()

  if (code === 'PGRST205' || code === '42P01') {
    return true
  }

  if (message.includes('schema cache') && videoStudioTableNames.some((tableName) => message.includes(tableName))) {
    return true
  }

  if (message.includes('relation') && videoStudioTableNames.some((tableName) => message.includes(tableName))) {
    return true
  }

  if (candidate.cause) {
    return shouldUseVideoStudioFallback(candidate.cause)
  }

  return false
}

function getFallbackBindingOptionsForUser(userId: string) {
  const existing = fallbackBindingOptions.get(userId)
  if (existing) {
    return existing
  }

  const next = createFallbackBindingOptions()
  fallbackBindingOptions.set(userId, next)
  return next
}

function getOrCreateFallbackProject(userId: string, bindingOptions: LessonBindingOption[], input?: CreateVideoProjectInput, projectId?: string) {
  const existing = fallbackProjects.get(userId)
  if (existing) {
    const shouldUpdate = Boolean(input) || Boolean(projectId && existing.id !== projectId)
    if (!shouldUpdate) {
      return existing
    }

    const nextProject: VideoProjectSnapshot = {
      ...existing,
      id: projectId ?? existing.id,
      title: input?.title?.trim() || existing.title,
      binding: {
        type: input?.binding?.type ?? existing.binding.type,
        targetId: input?.binding?.targetId ?? existing.binding.targetId,
      },
      updatedAt: new Date().toISOString(),
    }
    fallbackProjects.set(userId, nextProject)
    return nextProject
  }

  const fallbackProject = createDefaultProjectSnapshot(userId, bindingOptions)
  const nextProject: VideoProjectSnapshot = {
    ...fallbackProject,
    id: projectId ?? fallbackProject.id,
    title: input?.title?.trim() || fallbackProject.title,
    binding: {
      type: input?.binding?.type ?? fallbackProject.binding.type,
      targetId: input?.binding?.targetId ?? fallbackProject.binding.targetId,
    },
  }
  fallbackProjects.set(userId, nextProject)
  return nextProject
}

function saveFallbackProject(userId: string, bindingOptions: LessonBindingOption[], input: SaveVideoProjectInput) {
  const currentProject = fallbackProjects.get(userId) ?? createDefaultProjectSnapshot(userId, bindingOptions)
  const nextProject: VideoProjectSnapshot = {
    ...currentProject,
    id: input.projectId,
    title: input.title,
    binding: input.binding,
    segments: input.segments,
    audioSettings: input.audioSettings,
    subtitleCues: input.subtitleCues,
    stampOverlays: input.stampOverlays,
    exportSettings: input.exportSettings,
    textOverlays: input.textOverlays,
    imageOverlays: input.imageOverlays,
    videoEffects: input.videoEffects,
    updatedAt: new Date().toISOString(),
  }
  fallbackProjects.set(userId, nextProject)
  return nextProject
}

async function ensureVideoStudioProfileProjection(user: AuthSession) {
  try {
    await ensureProfileProvisioned({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (error) {
    if (!shouldUseVideoStudioFallback(error)) {
      throw error
    }
  }
}

function getBuckets(): StorageBuckets {
  const env = getServerEnv()
  return {
    raw: env.SUPABASE_VIDEO_RAW_BUCKET ?? 'video-raw',
    proxy: env.SUPABASE_VIDEO_PROXY_BUCKET ?? 'video-proxy',
    rendered: env.SUPABASE_VIDEO_RENDERED_BUCKET ?? 'video-rendered',
    subtitles: env.SUPABASE_VIDEO_SUBTITLE_BUCKET ?? 'video-subtitles',
    thumbnails: env.SUPABASE_VIDEO_THUMBNAIL_BUCKET ?? 'video-thumbnails',
  }
}

function sanitizePathSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'asset'
}

function toObjectPath(projectId: string, assetId: string, fileName: string) {
  const extension = path.extname(fileName) || '.bin'
  const baseName = sanitizePathSegment(path.basename(fileName, extension))
  return `${projectId}/${assetId}/${baseName}${extension.toLowerCase()}`
}

function toWebVttTimestamp(label: string) {
  if (label.includes('.')) {
    return label
  }

  return `${label}.000`
}

function parseDurationFromFfmpeg(output: string) {
  const match = output.match(/Duration:\s(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/)
  if (!match) {
    return null
  }

  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}

function formatDurationLabel(durationSeconds: number) {
  const totalSeconds = Math.max(0, Math.round(durationSeconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`
  }

  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

async function runFfmpeg(args: string[], allowFailure = false) {
  if (!ffmpegPath) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Video processing tools are not available right now.')
  }

  return await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
    const child = spawn(ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', reject)
    child.on('close', (code) => {
      const exitCode = code ?? 0
      if (exitCode !== 0 && !allowFailure) {
        reject(new Error(stderr || stdout || `ffmpeg exited with code ${exitCode}`))
        return
      }

      resolve({ stdout, stderr, exitCode })
    })
  })
}

async function probeMediaFile(filePath: string) {
  const { stderr } = await runFfmpeg(['-hide_banner', '-i', filePath], true)
  const durationSeconds = parseDurationFromFfmpeg(stderr)
  if (!durationSeconds) {
    throw new Error('We could not inspect the uploaded media duration.')
  }

  return {
    durationSeconds,
  }
}

async function transcodeProxy(inputPath: string, outputPath: string) {
  await runFfmpeg([
    '-y',
    '-i',
    inputPath,
    '-vf',
    "scale='min(1280,iw)':-2",
    '-r',
    '30',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '30',
    '-b:v',
    '1500k',
    '-maxrate',
    '1800k',
    '-bufsize',
    '3000k',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    outputPath,
  ])
}

async function transcodeMaster(inputPath: string, outputPath: string) {
  await runFfmpeg([
    '-y',
    '-i',
    inputPath,
    '-vf',
    "scale='min(1920,iw)':-2",
    '-r',
    '30',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '24',
    '-b:v',
    '3500k',
    '-maxrate',
    '4200k',
    '-bufsize',
    '7000k',
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    '-movflags',
    '+faststart',
    outputPath,
  ])
}

async function renderThumbnail(inputPath: string, outputPath: string) {
  await runFfmpeg([
    '-y',
    '-i',
    inputPath,
    '-vf',
    'thumbnail,scale=960:-1',
    '-frames:v',
    '1',
    outputPath,
  ])
}

async function uploadBuffer(bucket: string, objectPath: string, buffer: Buffer, contentType: string) {
  const supabase = createServiceSupabaseClient()
  const { error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
    upsert: true,
    contentType,
  })

  if (error) {
    throw error
  }
}

async function downloadBuffer(bucket: string, objectPath: string) {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase.storage.from(bucket).download(objectPath)
  if (error || !data) {
    throw error ?? new Error('We could not download the media asset.')
  }

  return Buffer.from(await data.arrayBuffer())
}

async function createSignedUrl(bucket: string | null, objectPath: string | null) {
  if (!bucket || !objectPath || !hasSupabaseConfig()) {
    return null
  }

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60)
  if (error) {
    return null
  }

  return data.signedUrl
}

async function getStorageObjectMetadata(bucket: string, objectPath: string) {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .schema('storage')
    .from('objects')
    .select('metadata, bucket_id, name')
    .eq('bucket_id', bucket)
    .eq('name', objectPath)
    .single()

  if (error || !data) {
    throw error ?? new Error('We could not inspect the uploaded object.')
  }

  const metadata = (data.metadata ?? {}) as Record<string, unknown>
  const size = Number(metadata.size ?? metadata.sizeBytes ?? 0)
  const mimetype = typeof metadata.mimetype === 'string' ? metadata.mimetype : null

  return {
    sizeBytes: Number.isFinite(size) ? size : 0,
    mimetype,
  }
}

function mapJobRecord(row: Record<string, unknown>): JobRecord {
  return {
    id: String(row.id),
    type: row.type as JobRecord['type'],
    status: row.status as JobRecord['status'],
    userId: row.user_id ? String(row.user_id) : null,
    userEmail: row.user_email ? String(row.user_email) : null,
    payload: row.payload ?? null,
    result: row.result ?? null,
    error: row.error ? String(row.error) : null,
    taskId: row.task_id ? String(row.task_id) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

async function listBindingOptions(userId: string): Promise<LessonBindingOption[]> {
  if (!hasSupabaseConfig()) {
    return getFallbackBindingOptionsForUser(userId)
  }

  try {
    const supabase = createServiceSupabaseClient()
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false })

    if (coursesError) {
      throw coursesError
    }

    const courseRows = (courses ?? []) as Array<Record<string, unknown>>
    const courseIds = courseRows.map((course) => String(course.id))
    const courseTitleById = new Map(courseRows.map((course) => [String(course.id), String(course.title)]))

    let moduleRows: Array<Record<string, unknown>> = []
    if (courseIds.length > 0) {
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('id, course_id, title, detail')
        .in('course_id', courseIds)
        .order('position', { ascending: true })

      if (modulesError) {
        throw modulesError
      }

      moduleRows = modules ?? []
    }

    return [
      ...moduleRows.map((moduleRow) => ({
        id: String(moduleRow.id),
        type: 'lesson' as const,
        title: String(moduleRow.title),
        detail: `${courseTitleById.get(String(moduleRow.course_id)) ?? 'Course'} | ${String(moduleRow.detail ?? 'Course module')}`,
      })),
      ...courseRows.map((courseRow) => ({
        id: String(courseRow.id),
        type: 'course' as const,
        title: String(courseRow.title),
        detail: String(courseRow.description ?? 'Attach the final render as a course asset.'),
      })),
    ]
  } catch {
    return getFallbackBindingOptionsForUser(userId)
  }
}

async function createProjectRecord(user: AuthSession, bindingOptions: LessonBindingOption[], input?: CreateVideoProjectInput) {
  if (!hasSupabaseConfig()) {
    return getOrCreateFallbackProject(user.id, bindingOptions, input)
  }

  try {
    const supabase = createServiceSupabaseClient()
    const defaultBinding = createDefaultBinding(bindingOptions)
    const { data, error } = await supabase
      .from('video_projects')
      .insert({
        owner_user_id: user.id,
        title: input?.title?.trim() || 'Lesson production workspace',
        binding_type: input?.binding?.type ?? defaultBinding.type,
        binding_target_id: (input?.binding?.targetId ?? defaultBinding.targetId) || null,
      })
      .select('id, owner_user_id, title, binding_type, binding_target_id, status, export_status, created_at, updated_at')
      .single()

    if (error || !data) {
      throw error ?? new Error('We could not create a video project.')
    }

    try {
      return await loadProjectSnapshot(user.id, String(data.id), bindingOptions)
    } catch (error) {
      if (!shouldUseVideoStudioFallback(error)) {
        throw error
      }

      const fallbackProject = getOrCreateFallbackProject(user.id, bindingOptions, input)
      const nextProject = {
        ...fallbackProject,
        id: String(data.id),
        title: String(data.title),
        binding: {
          type: data.binding_type,
          targetId: data.binding_target_id ?? fallbackProject.binding.targetId,
        },
        updatedAt: String(data.updated_at),
      }
      fallbackProjects.set(user.id, nextProject)
      return nextProject
    }
  } catch (error) {
    if (shouldUseVideoStudioFallback(error)) {
      return getOrCreateFallbackProject(user.id, bindingOptions, input)
    }

    throw error
  }
}

async function loadProjectRows(projectId: string) {
  const supabase = createServiceSupabaseClient()
  const [
    { data: projectData, error: projectError },
    { data: clipData, error: clipError },
    { data: audioData, error: audioError },
    { data: trackData, error: trackError },
    { data: overlayData, error: overlayError },
    { data: textOverlayData, error: textOverlayError },
    { data: imageOverlayData, error: imageOverlayError },
    { data: effectsData, error: effectsError },
    { data: assetData, error: assetError },
  ] = await Promise.all([
    supabase
      .from('video_projects')
      .select('id, owner_user_id, title, binding_type, binding_target_id, status, export_status, created_at, updated_at')
      .eq('id', projectId)
      .single(),
    supabase
      .from('timeline_clips')
      .select('clip_key, position, title, summary, start_seconds, end_seconds, tone')
      .eq('project_id', projectId)
      .order('position', { ascending: true }),
    supabase
      .from('audio_edits')
      .select('voice_boost, noise_reduction, music_ducking, silence_trim, normalize_dialogue')
      .eq('project_id', projectId)
      .maybeSingle(),
    supabase
      .from('subtitle_tracks')
      .select('id, project_id, language, format, source, storage_bucket, storage_path')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('overlays')
      .select('overlay_key, label, description, placement, enabled')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true }),
    supabase
      .from('video_text_overlays')
      .select('overlay_key, content, font_family, font_size, color, background_color, position, start_seconds, end_seconds')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true }),
    supabase
      .from('video_image_overlays')
      .select('overlay_key, label, storage_path, object_url, position, opacity, start_seconds, end_seconds')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true }),
    supabase
      .from('video_effect_settings')
      .select('brightness, contrast, saturation, blur')
      .eq('project_id', projectId)
      .maybeSingle(),
    supabase
      .from('video_assets')
      .select(`
        id,
        project_id,
        owner_user_id,
        original_file_name,
        source_type,
        status,
        content_type,
        byte_size,
        duration_seconds,
        storage_bucket,
        storage_path,
        proxy_bucket,
        proxy_path,
        render_bucket,
        render_path,
        subtitle_bucket,
        subtitle_path,
        thumbnail_bucket,
        thumbnail_path,
        upload_metadata,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (projectError || !projectData) {
    throw projectError ?? new Error('We could not load the video project.')
  }

  if (clipError) {
    throw clipError
  }

  if (audioError) {
    throw audioError
  }

  if (trackError) {
    throw trackError
  }

  if (overlayError) {
    throw overlayError
  }

  if (textOverlayError) {
    throw textOverlayError
  }

  if (imageOverlayError) {
    throw imageOverlayError
  }

  if (effectsError) {
    throw effectsError
  }

  if (assetError) {
    throw assetError
  }

  let cuesData: Array<Record<string, unknown>> = []
  if (trackData?.id) {
    const { data, error } = await supabase
      .from('subtitle_cues')
      .select('cue_key, position, start_label, end_label, text')
      .eq('track_id', String(trackData.id))
      .order('position', { ascending: true })

    if (error) {
      throw error
    }

    cuesData = data ?? []
  }

  return {
    projectRow: projectData as ProjectRow,
    clipRows: (clipData ?? []) as Array<Record<string, unknown>>,
    audioRow: (audioData ?? null) as Record<string, unknown> | null,
    trackRow: (trackData ?? null) as SubtitleTrackRow | null,
    cueRows: cuesData,
    overlayRows: (overlayData ?? []) as Array<Record<string, unknown>>,
    textOverlayRows: (textOverlayData ?? []) as Array<Record<string, unknown>>,
    imageOverlayRows: (imageOverlayData ?? []) as Array<Record<string, unknown>>,
    effectRow: (effectsData ?? null) as Record<string, unknown> | null,
    assetRow: (assetData ?? null) as AssetRow | null,
  }
}

async function mapAssetRow(assetRow: AssetRow | null): Promise<UploadedVideoAsset | null> {
  if (!assetRow) {
    return null
  }

  const proxyObjectUrl = await createSignedUrl(assetRow.proxy_bucket, assetRow.proxy_path)
  const rawObjectUrl = await createSignedUrl(assetRow.storage_bucket, assetRow.storage_path)
  const renderObjectUrl = await createSignedUrl(assetRow.render_bucket, assetRow.render_path)
  const subtitleObjectUrl = await createSignedUrl(assetRow.subtitle_bucket, assetRow.subtitle_path)

  return {
    id: assetRow.id,
    projectId: assetRow.project_id,
    fileName: assetRow.original_file_name,
    fileSizeBytes: Number(assetRow.byte_size ?? 0),
    durationSeconds: Number(assetRow.duration_seconds ?? 0),
    mimeType: assetRow.content_type,
    objectUrl: proxyObjectUrl ?? rawObjectUrl ?? renderObjectUrl ?? '',
    storageBucket: assetRow.storage_bucket,
    storagePath: assetRow.storage_path,
    proxyObjectUrl,
    renderObjectUrl,
    subtitleObjectUrl,
    sourceType: assetRow.source_type,
    status: assetRow.status,
  }
}

async function listVideoJobs(userId: string, projectId: string) {
  if (!hasSupabaseConfig()) {
    return fallbackJobsByProject.get(projectId) ?? []
  }

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('jobs')
    .select('id, type, status, user_id, user_email, payload, result, error, task_id, created_at, updated_at')
    .eq('user_id', userId)
    .in('type', ['video-probe', 'video-waveform', 'video-subtitles', 'video-render'])
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? [])
    .map((row) => mapJobRecord(row as Record<string, unknown>))
    .filter((job) => {
      const payload = (job.payload ?? {}) as Record<string, unknown>
      return typeof payload.projectId === 'string' && payload.projectId === projectId
    })
}

async function loadProjectSnapshot(ownerUserId: string, projectId: string, bindingOptions: LessonBindingOption[]): Promise<VideoProjectSnapshot> {
  if (!hasSupabaseConfig()) {
    return getOrCreateFallbackProject(ownerUserId, bindingOptions)
  }

  try {
    const { projectRow, clipRows, audioRow, cueRows, overlayRows, textOverlayRows, imageOverlayRows, effectRow, assetRow } = await loadProjectRows(projectId)

    return {
      id: projectRow.id,
      ownerUserId,
      title: projectRow.title,
      binding: {
        type: projectRow.binding_type,
        targetId: projectRow.binding_target_id ?? createDefaultBinding(bindingOptions).targetId,
      },
      segments: clipRows.length > 0
        ? clipRows.map((row) => ({
            id: String(row.clip_key),
            title: String(row.title),
            summary: String(row.summary ?? ''),
            startSeconds: Number(row.start_seconds ?? 0),
            endSeconds: Number(row.end_seconds ?? 0),
            tone: String(row.tone ?? ''),
          }))
        : createDefaultSegments(),
      audioSettings: audioRow
        ? {
            voiceBoost: Number(audioRow.voice_boost ?? 72),
            noiseReduction: Number(audioRow.noise_reduction ?? 58),
            musicDucking: Number(audioRow.music_ducking ?? 44),
            silenceTrim: Boolean(audioRow.silence_trim ?? true),
            normalizeDialogue: Boolean(audioRow.normalize_dialogue ?? true),
          }
        : createDefaultAudioSettings(),
      subtitleCues: cueRows.length > 0
        ? cueRows.map((row) => ({
            id: String(row.cue_key),
            startLabel: String(row.start_label),
            endLabel: String(row.end_label),
            text: String(row.text),
          }))
        : createDefaultSubtitleCues(),
      stampOverlays: overlayRows.length > 0
        ? overlayRows.map((row) => ({
            id: String(row.overlay_key),
            label: String(row.label),
            description: String(row.description ?? ''),
            placement: String(row.placement ?? ''),
            enabled: Boolean(row.enabled),
          }))
        : createDefaultStamps(),
      exportSettings: createDefaultExportSettings(),
      textOverlays: textOverlayRows.length > 0
        ? textOverlayRows.map((row) => ({
            id: String(row.overlay_key),
            text: String(row.content),
            fontFamily: (String(row.font_family ?? 'sans-serif') as 'sans-serif' | 'serif' | 'mono'),
            fontSize: Number(row.font_size ?? 28),
            color: String(row.color ?? '#ffffff'),
            bgColor: row.background_color ? String(row.background_color) : null,
            position: (String(row.position ?? 'bottom') as 'top' | 'center' | 'bottom'),
            startSeconds: Number(row.start_seconds ?? 0),
            endSeconds: Number(row.end_seconds ?? 0),
          }))
        : createDefaultTextOverlays(),
      imageOverlays: imageOverlayRows.length > 0
        ? imageOverlayRows.map((row) => ({
            id: String(row.overlay_key),
            label: String(row.label ?? ''),
            storagePath: row.storage_path ? String(row.storage_path) : null,
            objectUrl: row.object_url ? String(row.object_url) : null,
            position: (String(row.position ?? 'top-right') as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'),
            opacity: Number(row.opacity ?? 1),
            startSeconds: Number(row.start_seconds ?? 0),
            endSeconds: Number(row.end_seconds ?? 0),
          }))
        : createDefaultImageOverlays(),
      videoEffects: effectRow
        ? {
            brightness: Number(effectRow.brightness ?? 0),
            contrast: Number(effectRow.contrast ?? 0),
            saturation: Number(effectRow.saturation ?? 0),
            blur: Number(effectRow.blur ?? 0),
          }
        : createDefaultVideoEffects(),
      sourceAsset: await mapAssetRow(assetRow),
      updatedAt: projectRow.updated_at,
    }
  } catch (error) {
    if (!shouldUseVideoStudioFallback(error)) {
      throw error
    }

    const fallbackProject = getOrCreateFallbackProject(ownerUserId, bindingOptions)
    const nextProject = {
      ...fallbackProject,
      id: projectId,
      updatedAt: fallbackProject.updatedAt || new Date().toISOString(),
    }
    fallbackProjects.set(ownerUserId, nextProject)
    return nextProject
  }
}

async function ensureOwnedProject(user: AuthSession, projectId: string, bindingOptions?: LessonBindingOption[]) {
  if (!hasSupabaseConfig()) {
    const fallbackProject = fallbackProjects.get(user.id)
    if (!fallbackProject || fallbackProject.id !== projectId) {
      throw new AppError('NOT_FOUND', 'We could not find that video project.')
    }

    return fallbackProject
  }

  try {
    const supabase = createServiceSupabaseClient()
    const { data, error } = await supabase
      .from('video_projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_user_id', user.id)
      .single()

    if (error || !data) {
      throw error ?? new Error('We could not find that video project.')
    }

    return await loadProjectSnapshot(user.id, String(data.id), bindingOptions ?? await listBindingOptions(user.id))
  } catch (error) {
    if (shouldUseVideoStudioFallback(error)) {
      const fallbackProject = fallbackProjects.get(user.id)
      if (fallbackProject && fallbackProject.id === projectId) {
        return fallbackProject
      }

      return getOrCreateFallbackProject(user.id, bindingOptions ?? await listBindingOptions(user.id), undefined, projectId)
    }

    throw new AppError('NOT_FOUND', 'We could not find that video project.')
  }
}

function validateUploadPolicy(input: CreateVideoUploadSessionInput, policy: VideoUploadPolicy) {
  const errors: string[] = []
  const contentType = input.contentType.toLowerCase()

  if (input.contentLength > policy.maxFileSizeBytes) {
    errors.push('File exceeds the current upload limit before transfer can begin.')
  }

  if (!contentType.startsWith('video/') && !contentType.startsWith('audio/')) {
    errors.push('Only instructional video or narration uploads are supported.')
  }

  if (errors.length > 0) {
    throw new AppError('VALIDATION_ERROR', errors[0], { details: { errors } })
  }
}

async function updateVideoAssetRow(assetId: string, patch: Partial<Record<keyof AssetRow, unknown>>) {
  const supabase = createServiceSupabaseClient()
  const { error } = await supabase
    .from('video_assets')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assetId)

  if (error) {
    throw error
  }
}

async function loadAssetRowForUser(userId: string, assetId: string) {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('video_assets')
    .select(`
      id,
      project_id,
      owner_user_id,
      original_file_name,
      source_type,
      status,
      content_type,
      byte_size,
      duration_seconds,
      storage_bucket,
      storage_path,
      proxy_bucket,
      proxy_path,
      render_bucket,
      render_path,
      subtitle_bucket,
      subtitle_path,
      thumbnail_bucket,
      thumbnail_path,
      upload_metadata,
      created_at,
      updated_at
    `)
    .eq('id', assetId)
    .eq('owner_user_id', userId)
    .single()

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'We could not find that uploaded video.')
  }

  return data as AssetRow
}

async function storeFallbackJob(projectId: string, job: JobRecord) {
  const currentJobs = fallbackJobsByProject.get(projectId) ?? []
  fallbackJobsByProject.set(projectId, [job, ...currentJobs.filter((currentJob) => currentJob.id !== job.id)])
}

async function queueJobWithFallback<TPayload, TResult>(
  user: AuthSession,
  type: 'video-probe' | 'video-waveform' | 'video-subtitles' | 'video-render',
  payload: TPayload,
  triggerTaskId: string,
  fallbackRunner: (payload: TPayload) => Promise<TResult>,
): Promise<JobRecord<TPayload, TResult>> {
  const job = await createJob({
    type,
    userId: user.id,
    userEmail: user.email,
    payload,
  })

  if ((payload as Record<string, unknown>).projectId) {
    await storeFallbackJob(String((payload as Record<string, unknown>).projectId), job)
  }

  if (hasTriggerConfig()) {
    const runHandle = await triggerJobTask(triggerTaskId, {
      jobId: job.id,
      payload,
    })

    if (runHandle?.id) {
      const updatedJob = await updateJob(job.id, { taskId: runHandle.id })
      if ((payload as Record<string, unknown>).projectId && updatedJob) {
        await storeFallbackJob(String((payload as Record<string, unknown>).projectId), updatedJob)
      }

      return (updatedJob ?? job) as JobRecord<TPayload, TResult>
    }
  }

  await updateJob(job.id, { status: 'running', error: null })
  const result = await fallbackRunner(payload)
  const updatedJob = await updateJob(job.id, { status: 'completed', result, error: null })
  if ((payload as Record<string, unknown>).projectId && updatedJob) {
    await storeFallbackJob(String((payload as Record<string, unknown>).projectId), updatedJob)
  }

  return (updatedJob ?? job) as JobRecord<TPayload, TResult>
}

async function writeSubtitleTrack(projectId: string, cues: SubtitleCue[], storageBucket: string | null, storagePath: string | null) {
  const supabase = createServiceSupabaseClient()
  const { data: trackData, error: trackError } = await supabase
    .from('subtitle_tracks')
    .upsert({
      project_id: projectId,
      language: 'en-US',
      format: 'vtt',
      source: storageBucket ? 'generated' : 'manual',
      storage_bucket: storageBucket,
      storage_path: storagePath,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'project_id,language,format',
    })
    .select('id')
    .single()

  if (trackError || !trackData) {
    throw trackError ?? new Error('We could not update subtitle metadata.')
  }

  const trackId = String(trackData.id)
  const { error: deleteError } = await supabase.from('subtitle_cues').delete().eq('track_id', trackId)
  if (deleteError) {
    throw deleteError
  }

  if (cues.length === 0) {
    return
  }

  const { error: insertError } = await supabase.from('subtitle_cues').insert(
    cues.map((cue, index) => ({
      track_id: trackId,
      cue_key: cue.id,
      position: index,
      start_label: cue.startLabel,
      end_label: cue.endLabel,
      text: cue.text,
    })),
  )

  if (insertError) {
    throw insertError
  }
}

export async function bootstrapVideoStudio(user: AuthSession, requestId: string): Promise<VideoStudioBootstrap> {
  await ensureVideoStudioProfileProjection(user)

  const bindingOptions = await listBindingOptions(user.id)

  if (!hasSupabaseConfig()) {
    const project = getOrCreateFallbackProject(user.id, bindingOptions)
    return {
      project,
      bindingOptions,
      uploadPolicy,
      jobs: fallbackJobsByProject.get(project.id) ?? [],
    }
  }

  try {
    const supabase = createServiceSupabaseClient()
    const { data, error } = await supabase
      .from('video_projects')
      .select('id')
      .eq('owner_user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw error
    }

    const project = data?.id
      ? await loadProjectSnapshot(user.id, String(data.id), bindingOptions)
      : await createProjectRecord(user, bindingOptions)

    let jobs: JobRecord[] = []
    try {
      jobs = await listVideoJobs(user.id, project.id)
    } catch (error) {
      if (!shouldUseVideoStudioFallback(error)) {
        throw error
      }
      jobs = fallbackJobsByProject.get(project.id) ?? []
    }

    return {
      project,
      bindingOptions,
      uploadPolicy,
      jobs,
    }
  } catch (error) {
    if (shouldUseVideoStudioFallback(error)) {
      const project = getOrCreateFallbackProject(user.id, bindingOptions)
      return {
        project,
        bindingOptions,
        uploadPolicy,
        jobs: fallbackJobsByProject.get(project.id) ?? [],
      }
    }

    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load the video studio workspace.', {
      requestId,
      cause: error,
    })
  }
}

export async function createVideoProject(user: AuthSession, input: CreateVideoProjectInput, requestId: string) {
  await ensureVideoStudioProfileProjection(user)

  const bindingOptions = await listBindingOptions(user.id)
  try {
    return await createProjectRecord(user, bindingOptions, input)
  } catch (error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not create the video project right now.', {
      requestId,
      cause: error,
    })
  }
}

export async function listVideoProjects(user: AuthSession, requestId: string): Promise<VideoProjectListItem[]> {
  await ensureVideoStudioProfileProjection(user)

  if (!hasSupabaseConfig()) {
    const fallbackProject = fallbackProjects.get(user.id)
    if (!fallbackProject) {
      return []
    }

    return [{
      id: fallbackProject.id,
      title: fallbackProject.title,
      bindingType: fallbackProject.binding.type,
      bindingTargetId: fallbackProject.binding.targetId,
      status: 'draft',
      exportStatus: 'idle',
      createdAt: fallbackProject.updatedAt,
      updatedAt: fallbackProject.updatedAt,
    }]
  }

  try {
    const supabase = createServiceSupabaseClient()
    const { data, error } = await supabase
      .from('video_projects')
      .select('id, title, binding_type, binding_target_id, status, export_status, created_at, updated_at')
      .eq('owner_user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      throw error
    }

    return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      bindingType: row.binding_type as VideoProjectListItem['bindingType'],
      bindingTargetId: row.binding_target_id ? String(row.binding_target_id) : null,
      status: row.status as VideoProjectListItem['status'],
      exportStatus: row.export_status as VideoProjectListItem['exportStatus'],
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }))
  } catch (error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not list video projects.', {
      requestId,
      cause: error,
    })
  }
}

export async function duplicateVideoProject(user: AuthSession, input: DuplicateVideoProjectInput, requestId: string) {
  const bindingOptions = await listBindingOptions(user.id)
  const source = await ensureOwnedProject(user, input.projectId, bindingOptions)
  const sourceSnapshot = await loadProjectSnapshot(user.id, source.id, bindingOptions)
  const duplicatedProject = await createProjectRecord(user, bindingOptions, {
    title: input.title ?? `${sourceSnapshot.title} (Copy)`,
    binding: sourceSnapshot.binding,
  })

  return await saveVideoProject(user, {
    projectId: duplicatedProject.id,
    title: duplicatedProject.title,
    binding: sourceSnapshot.binding,
    segments: sourceSnapshot.segments,
    audioSettings: sourceSnapshot.audioSettings,
    subtitleCues: sourceSnapshot.subtitleCues,
    stampOverlays: sourceSnapshot.stampOverlays,
    exportSettings: sourceSnapshot.exportSettings,
    textOverlays: sourceSnapshot.textOverlays,
    imageOverlays: sourceSnapshot.imageOverlays,
    videoEffects: sourceSnapshot.videoEffects,
  }, requestId)
}

export async function deleteVideoProject(user: AuthSession, projectId: string, requestId: string): Promise<{ deleted: true }> {
  await ensureOwnedProject(user, projectId)

  if (!hasSupabaseConfig()) {
    fallbackProjects.delete(user.id)
    return { deleted: true }
  }

  try {
    const supabase = createServiceSupabaseClient()
    const { error } = await supabase
      .from('video_projects')
      .delete()
      .eq('id', projectId)
      .eq('owner_user_id', user.id)

    if (error) {
      throw error
    }

    await appendActivityLog({
      userId: user.id,
      module: 'video',
      action: 'delete_project',
      entityType: 'video_project',
      entityId: projectId,
    })

    return { deleted: true }
  } catch (error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not delete the video project.', {
      requestId,
      cause: error,
    })
  }
}

export async function saveVideoProject(user: AuthSession, input: SaveVideoProjectInput, requestId: string) {
  const bindingOptions = await listBindingOptions(user.id)
  await ensureOwnedProject(user, input.projectId, bindingOptions)

  if (!hasSupabaseConfig()) {
    return saveFallbackProject(user.id, bindingOptions, input)
  }

  try {
    const supabase = createServiceSupabaseClient()
    const now = new Date().toISOString()
    const { error: projectError } = await supabase
      .from('video_projects')
      .update({
        title: input.title,
        binding_type: input.binding.type,
        binding_target_id: input.binding.targetId,
        updated_at: now,
      })
      .eq('id', input.projectId)
      .eq('owner_user_id', user.id)

    if (projectError) {
      throw projectError
    }

    const [
      { error: deleteClipsError },
      { error: deleteOverlaysError },
      { error: deleteTextOverlaysError },
      { error: deleteImageOverlaysError },
    ] = await Promise.all([
      supabase.from('timeline_clips').delete().eq('project_id', input.projectId),
      supabase.from('overlays').delete().eq('project_id', input.projectId),
      supabase.from('video_text_overlays').delete().eq('project_id', input.projectId),
      supabase.from('video_image_overlays').delete().eq('project_id', input.projectId),
    ])

    if (deleteClipsError || deleteOverlaysError || deleteTextOverlaysError || deleteImageOverlaysError) {
      throw deleteClipsError ?? deleteOverlaysError ?? deleteTextOverlaysError ?? deleteImageOverlaysError ?? new Error('We could not refresh the project timeline.')
    }

    if (input.segments.length > 0) {
      const { error: insertClipsError } = await supabase.from('timeline_clips').insert(
        input.segments.map((segment, index) => ({
          project_id: input.projectId,
          clip_key: segment.id,
          position: index,
          title: segment.title,
          summary: segment.summary,
          start_seconds: Math.round(segment.startSeconds),
          end_seconds: Math.round(segment.endSeconds),
          tone: segment.tone,
          updated_at: now,
        })),
      )

      if (insertClipsError) {
        throw insertClipsError
      }
    }

    const { error: audioError } = await supabase.from('audio_edits').upsert({
      project_id: input.projectId,
      voice_boost: input.audioSettings.voiceBoost,
      noise_reduction: input.audioSettings.noiseReduction,
      music_ducking: input.audioSettings.musicDucking,
      silence_trim: input.audioSettings.silenceTrim,
      normalize_dialogue: input.audioSettings.normalizeDialogue,
      updated_at: now,
    }, {
      onConflict: 'project_id',
    })

    if (audioError) {
      throw audioError
    }

    await writeSubtitleTrack(input.projectId, input.subtitleCues, null, null)

    if (input.stampOverlays.length > 0) {
      const { error: overlaysError } = await supabase.from('overlays').insert(
        input.stampOverlays.map((stamp) => ({
          project_id: input.projectId,
          overlay_key: stamp.id,
          label: stamp.label,
          description: stamp.description,
          placement: stamp.placement,
          enabled: stamp.enabled,
          updated_at: now,
        })),
      )

      if (overlaysError) {
        throw overlaysError
      }
    }

    if (input.textOverlays.length > 0) {
      const { error: textOverlaysError } = await supabase.from('video_text_overlays').insert(
        input.textOverlays.map((overlay) => ({
          project_id: input.projectId,
          overlay_key: overlay.id,
          content: overlay.text,
          font_family: overlay.fontFamily,
          font_size: Math.round(overlay.fontSize),
          color: overlay.color,
          background_color: overlay.bgColor,
          position: overlay.position,
          start_seconds: Math.round(overlay.startSeconds),
          end_seconds: Math.round(overlay.endSeconds),
          updated_at: now,
        })),
      )

      if (textOverlaysError) {
        throw textOverlaysError
      }
    }

    if (input.imageOverlays.length > 0) {
      const { error: imageOverlaysError } = await supabase.from('video_image_overlays').insert(
        input.imageOverlays.map((overlay) => ({
          project_id: input.projectId,
          overlay_key: overlay.id,
          label: overlay.label,
          storage_path: overlay.storagePath,
          object_url: overlay.objectUrl,
          position: overlay.position,
          opacity: overlay.opacity,
          start_seconds: Math.round(overlay.startSeconds),
          end_seconds: Math.round(overlay.endSeconds),
          updated_at: now,
        })),
      )

      if (imageOverlaysError) {
        throw imageOverlaysError
      }
    }

    const { error: effectsError } = await supabase.from('video_effect_settings').upsert({
      project_id: input.projectId,
      brightness: Math.round(input.videoEffects.brightness),
      contrast: Math.round(input.videoEffects.contrast),
      saturation: Math.round(input.videoEffects.saturation),
      blur: Math.round(input.videoEffects.blur),
      updated_at: now,
    }, {
      onConflict: 'project_id',
    })

    if (effectsError) {
      throw effectsError
    }

    return await loadProjectSnapshot(user.id, input.projectId, bindingOptions)
  } catch (error) {
    if (shouldUseVideoStudioFallback(error)) {
      return saveFallbackProject(user.id, bindingOptions, input)
    }

    throw new AppError('SERVICE_UNAVAILABLE', 'We could not save the video project.', {
      requestId,
      cause: error,
    })
  }
}

export async function createRecordingSession(user: AuthSession, input: RecordingSessionInput) {
  await ensureOwnedProject(user, input.projectId)

  const nextSession: RecordingSessionRecord = {
    id: randomUUID(),
    projectId: input.projectId,
    requestedSources: input.sources,
    clientHints: input.clientHints ?? null,
    createdAt: new Date().toISOString(),
  }

  if (!hasSupabaseConfig()) {
    const current = fallbackRecordingSessions.get(input.projectId) ?? []
    fallbackRecordingSessions.set(input.projectId, [nextSession, ...current])
    return nextSession
  }

  try {
    const supabase = createServiceSupabaseClient()
    const { data, error } = await supabase
      .from('video_recording_sessions')
      .insert({
        project_id: input.projectId,
        owner_user_id: user.id,
        requested_sources: input.sources,
        client_hints: input.clientHints ?? null,
      })
      .select('id, project_id, requested_sources, client_hints, created_at')
      .single()

    if (error || !data) {
      throw error ?? new Error('We could not create the recording session.')
    }

    return {
      id: String(data.id),
      projectId: String(data.project_id),
      requestedSources: data.requested_sources as RecordingSessionInput['sources'],
      clientHints: (data.client_hints ?? null) as RecordingSessionRecord['clientHints'],
      createdAt: String(data.created_at),
    }
  } catch (error) {
    if (shouldUseVideoStudioFallback(error)) {
      const current = fallbackRecordingSessions.get(input.projectId) ?? []
      fallbackRecordingSessions.set(input.projectId, [nextSession, ...current])
      return nextSession
    }

    throw error
  }
}

export async function createVideoUploadSession(user: AuthSession, input: CreateVideoUploadSessionInput, requestId: string): Promise<CreateVideoUploadSessionResult> {
  validateUploadPolicy(input, uploadPolicy)
  await ensureOwnedProject(user, input.projectId)

  const buckets = getBuckets()
  const uploadId = randomUUID()
  const token = randomUUID()
  const objectPath = toObjectPath(input.projectId, uploadId, input.fileName)

  const sessionState: UploadSessionState = {
    uploadId,
    projectId: input.projectId,
    ownerUserId: user.id,
    token,
    objectPath,
    bucketName: buckets.raw,
    fileName: input.fileName,
    contentType: input.contentType,
    contentLength: input.contentLength,
    sourceType: input.sourceType,
  }

  if (!hasSupabaseConfig()) {
    fallbackUploadSessions.set(uploadId, sessionState)
    return {
      uploadId,
      bucketName: 'local-fallback',
      objectPath,
      token,
      resumableUrl: '',
      signedUploadPath: '',
    }
  }

  try {
    const supabase = createServiceSupabaseClient()
    const { error } = await supabase.from('video_assets').insert({
      id: uploadId,
      project_id: input.projectId,
      owner_user_id: user.id,
      original_file_name: input.fileName,
      source_type: input.sourceType,
      status: 'uploading',
      content_type: input.contentType,
      byte_size: input.contentLength,
      storage_bucket: buckets.raw,
      storage_path: objectPath,
      upload_metadata: {
        token,
        declaredSizeBytes: input.contentLength,
        declaredContentType: input.contentType,
        sourceType: input.sourceType,
        createdAt: new Date().toISOString(),
      },
    })

    if (error) {
      throw error
    }

    return {
      uploadId,
      bucketName: buckets.raw,
      objectPath,
      token,
      resumableUrl: '/api/video-studio/uploads/resumable',
      signedUploadPath: `/api/video-studio/uploads/resumable/${uploadId}`,
    }
  } catch (error) {
    if (shouldUseVideoStudioFallback(error)) {
      fallbackUploadSessions.set(uploadId, sessionState)
      return {
        uploadId,
        bucketName: 'local-fallback',
        objectPath,
        token,
        resumableUrl: '',
        signedUploadPath: '',
      }
    }

    throw new AppError('SERVICE_UNAVAILABLE', 'We could not start the upload session.', {
      requestId,
      cause: error,
    })
  }
}

export async function completeVideoUpload(user: AuthSession, input: CompleteVideoUploadInput, requestId: string): Promise<CompleteVideoUploadResult> {
  await ensureOwnedProject(user, input.projectId)

  const existingSession = fallbackUploadSessions.get(input.uploadId)
  if (!hasSupabaseConfig() || (existingSession && existingSession.ownerUserId === user.id)) {
    if (!existingSession) {
      throw new AppError('NOT_FOUND', 'We could not find that upload session.', { requestId })
    }

    const fallbackAsset: UploadedVideoAsset = {
      id: existingSession.uploadId,
      projectId: existingSession.projectId,
      fileName: existingSession.fileName,
      fileSizeBytes: existingSession.contentLength,
      durationSeconds: 0,
      mimeType: existingSession.contentType,
      objectUrl: '',
      storageBucket: null,
      storagePath: null,
      proxyObjectUrl: null,
      renderObjectUrl: null,
      subtitleObjectUrl: null,
      sourceType: existingSession.sourceType,
      status: 'ready',
    }
    fallbackAssets.set(input.uploadId, fallbackAsset)
    return {
      asset: fallbackAsset,
      probeJob: await queueJobWithFallback(user, 'video-probe', { projectId: input.projectId, assetId: input.uploadId }, 'watashi-video-probe', processVideoProbe),
    }
  }

  const assetRow = await loadAssetRowForUser(user.id, input.uploadId)
  const metadata = await getStorageObjectMetadata(assetRow.storage_bucket ?? getBuckets().raw, assetRow.storage_path ?? '')
  if (metadata.sizeBytes <= 0) {
    throw new AppError('VALIDATION_ERROR', 'The upload did not finish correctly. Please try again.', { requestId })
  }

  if (metadata.sizeBytes > uploadPolicy.maxFileSizeBytes) {
    throw new AppError('VALIDATION_ERROR', 'File exceeds the current upload limit.', { requestId })
  }

  const nextContentType = metadata.mimetype ?? input.contentType
  await updateVideoAssetRow(assetRow.id, {
    status: 'processing',
    content_type: nextContentType,
    byte_size: metadata.sizeBytes,
    upload_metadata: {
      ...(assetRow.upload_metadata ?? {}),
      completedAt: new Date().toISOString(),
      authoritativeSizeBytes: metadata.sizeBytes,
      authoritativeContentType: nextContentType,
    },
  })

  const probeJob = await queueJobWithFallback(
    user,
    'video-probe',
    { projectId: input.projectId, assetId: assetRow.id },
    'watashi-video-probe',
    processVideoProbe,
  )

  const refreshedAsset = await mapAssetRow(await loadAssetRowForUser(user.id, assetRow.id))
  if (!refreshedAsset) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not prepare the uploaded asset.', { requestId })
  }

  await registerMediaItem({
    ownerUserId: user.id,
    sourceModule: 'video',
    assetType: refreshedAsset.mimeType.startsWith('audio/') ? 'audio' : 'video',
    fileName: refreshedAsset.fileName,
    fileType: refreshedAsset.mimeType,
    sizeBytes: refreshedAsset.fileSizeBytes,
    storageBucket: refreshedAsset.storageBucket ?? null,
    storagePath: refreshedAsset.storagePath ?? null,
    variant: 'raw',
    linkedEntityType: 'video_project',
    linkedEntityId: input.projectId,
    metadata: {
      assetId: refreshedAsset.id,
      sourceType: refreshedAsset.sourceType ?? 'uploaded',
    },
  })

  await appendActivityLog({
    userId: user.id,
    module: 'video',
    action: 'upload_completed',
    entityType: 'video_asset',
    entityId: refreshedAsset.id,
    metadata: {
      projectId: input.projectId,
      fileName: refreshedAsset.fileName,
    },
  })

  return {
    asset: refreshedAsset,
    probeJob,
  }
}

export async function queueSubtitleJob(user: AuthSession, projectId: string) {
  await ensureOwnedProject(user, projectId)
  const job = await queueJobWithFallback(
    user,
    'video-subtitles',
    { projectId },
    'watashi-video-subtitles',
    processVideoSubtitles,
  )

  return { job } satisfies QueueVideoJobResult
}

export async function queueRenderJob(user: AuthSession, projectId: string) {
  await ensureOwnedProject(user, projectId)
  const job = await queueJobWithFallback(
    user,
    'video-render',
    { projectId },
    'watashi-video-render',
    processVideoRender,
  )

  return { job } satisfies QueueVideoJobResult
}

export async function getUploadProxySession(userId: string, uploadId: string) {
  const fallbackSession = fallbackUploadSessions.get(uploadId)
  if (fallbackSession?.ownerUserId === userId) {
    return fallbackSession
  }

  if (!hasSupabaseConfig()) {
    return null
  }

  const assetRow = await loadAssetRowForUser(userId, uploadId)
  const uploadMetadata = assetRow.upload_metadata ?? {}
  return {
    uploadId: assetRow.id,
    projectId: assetRow.project_id,
    ownerUserId: assetRow.owner_user_id,
    token: String(uploadMetadata.token ?? ''),
    objectPath: assetRow.storage_path ?? '',
    bucketName: assetRow.storage_bucket ?? getBuckets().raw,
    fileName: assetRow.original_file_name,
    contentType: assetRow.content_type,
    contentLength: Number(uploadMetadata.declaredSizeBytes ?? assetRow.byte_size ?? 0),
    sourceType: assetRow.source_type,
    tusUrl: typeof uploadMetadata.tusUrl === 'string' ? uploadMetadata.tusUrl : undefined,
  } satisfies UploadSessionState
}

export async function setUploadProxyTusUrl(userId: string, uploadId: string, tusUrl: string) {
  const session = fallbackUploadSessions.get(uploadId)
  if (session?.ownerUserId === userId) {
    session.tusUrl = tusUrl
    fallbackUploadSessions.set(uploadId, session)
    return
  }

  if (!hasSupabaseConfig()) {
    return
  }

  const assetRow = await loadAssetRowForUser(userId, uploadId)
  await updateVideoAssetRow(uploadId, {
    upload_metadata: {
      ...(assetRow.upload_metadata ?? {}),
      tusUrl,
    },
  })
}

export async function processVideoProbe(payload: ProbeJobPayload) {
  if (!hasSupabaseConfig()) {
    const fallbackAsset = fallbackAssets.get(payload.assetId)
    if (fallbackAsset) {
      fallbackAsset.status = 'ready'
      fallbackAssets.set(payload.assetId, fallbackAsset)
    }

    return {
      assetId: payload.assetId,
      durationSeconds: fallbackAsset?.durationSeconds ?? 0,
      proxyReady: Boolean(fallbackAsset),
    }
  }

  const buckets = getBuckets()
  const { projectRow } = await loadProjectRows(payload.projectId)
  const assetRow = await loadAssetRowForUser(projectRow.owner_user_id, payload.assetId)
  const workingDirectory = await mkdtemp(path.join(tmpdir(), 'watashi-video-probe-'))
  const rawFilePath = path.join(workingDirectory, path.basename(assetRow.storage_path ?? 'source.mp4'))
  const proxyFilePath = path.join(workingDirectory, 'proxy.mp4')
  const masterFilePath = path.join(workingDirectory, 'master.mp4')
  const thumbnailPath = path.join(workingDirectory, 'thumbnail.jpg')

  try {
    const rawBuffer = await downloadBuffer(assetRow.storage_bucket ?? buckets.raw, assetRow.storage_path ?? '')
    await writeFile(rawFilePath, rawBuffer)

    const probe = await probeMediaFile(rawFilePath)
    if (probe.durationSeconds < uploadPolicy.minDurationSeconds) {
      await updateVideoAssetRow(assetRow.id, { status: 'failed', duration_seconds: probe.durationSeconds })
      throw new AppError('VALIDATION_ERROR', `Video must be at least ${formatDurationLabel(uploadPolicy.minDurationSeconds)} long.`)
    }

    if (probe.durationSeconds > uploadPolicy.maxDurationSeconds) {
      await updateVideoAssetRow(assetRow.id, { status: 'failed', duration_seconds: probe.durationSeconds })
      throw new AppError('VALIDATION_ERROR', `Video must be no longer than ${formatDurationLabel(uploadPolicy.maxDurationSeconds)}.`)
    }

    await Promise.all([
      transcodeProxy(rawFilePath, proxyFilePath),
      transcodeMaster(rawFilePath, masterFilePath),
      renderThumbnail(rawFilePath, thumbnailPath),
    ])

    const [proxyBuffer, masterBuffer, thumbnailBuffer] = await Promise.all([
      readFile(proxyFilePath),
      readFile(masterFilePath),
      readFile(thumbnailPath),
    ])

    const proxyPath = `${payload.projectId}/${payload.assetId}/proxy.mp4`
    const masterPath = `${payload.projectId}/${payload.assetId}/master.mp4`
    const nextThumbnailPath = `${payload.projectId}/${payload.assetId}/thumbnail.jpg`

    await Promise.all([
      uploadBuffer(buckets.proxy, proxyPath, proxyBuffer, 'video/mp4'),
      uploadBuffer(buckets.rendered, masterPath, masterBuffer, 'video/mp4'),
      uploadBuffer(buckets.thumbnails, nextThumbnailPath, thumbnailBuffer, 'image/jpeg'),
    ])

    await updateVideoAssetRow(assetRow.id, {
      status: 'ready',
      duration_seconds: probe.durationSeconds,
      proxy_bucket: buckets.proxy,
      proxy_path: proxyPath,
      render_bucket: buckets.rendered,
      render_path: masterPath,
      thumbnail_bucket: buckets.thumbnails,
      thumbnail_path: nextThumbnailPath,
      upload_metadata: {
        ...(assetRow.upload_metadata ?? {}),
        proxyReadyAt: new Date().toISOString(),
      },
    })

    await Promise.all([
      registerMediaItem({
        ownerUserId: projectRow.owner_user_id,
        sourceModule: 'video',
        assetType: 'video',
        fileName: 'proxy.mp4',
        fileType: 'video/mp4',
        sizeBytes: proxyBuffer.byteLength,
        storageBucket: buckets.proxy,
        storagePath: proxyPath,
        variant: 'proxy',
        linkedEntityType: 'video_project',
        linkedEntityId: payload.projectId,
        metadata: { assetId: payload.assetId },
      }),
      registerMediaItem({
        ownerUserId: projectRow.owner_user_id,
        sourceModule: 'video',
        assetType: 'video',
        fileName: 'master.mp4',
        fileType: 'video/mp4',
        sizeBytes: masterBuffer.byteLength,
        storageBucket: buckets.rendered,
        storagePath: masterPath,
        variant: 'master',
        linkedEntityType: 'video_project',
        linkedEntityId: payload.projectId,
        metadata: { assetId: payload.assetId },
      }),
      registerMediaItem({
        ownerUserId: projectRow.owner_user_id,
        sourceModule: 'video',
        assetType: 'image',
        fileName: 'thumbnail.jpg',
        fileType: 'image/jpeg',
        sizeBytes: thumbnailBuffer.byteLength,
        storageBucket: buckets.thumbnails,
        storagePath: nextThumbnailPath,
        variant: 'thumbnail',
        linkedEntityType: 'video_project',
        linkedEntityId: payload.projectId,
        metadata: { assetId: payload.assetId },
      }),
      appendActivityLog({
        userId: projectRow.owner_user_id,
        module: 'video',
        action: 'probe_completed',
        entityType: 'video_asset',
        entityId: payload.assetId,
        metadata: {
          projectId: payload.projectId,
          durationSeconds: probe.durationSeconds,
        },
      }),
    ])

    const waveformJob = await createJob({
      type: 'video-waveform',
      userId: projectRow.owner_user_id,
      userEmail: null,
      payload: {
        projectId: payload.projectId,
        assetId: payload.assetId,
      } satisfies WaveformJobPayload,
    })
    await storeFallbackJob(payload.projectId, waveformJob)

    if (hasTriggerConfig()) {
      const runHandle = await triggerJobTask('watashi-video-waveform', {
        jobId: waveformJob.id,
        payload: {
          projectId: payload.projectId,
          assetId: payload.assetId,
        } satisfies WaveformJobPayload,
      })

      if (runHandle?.id) {
        const updatedJob = await updateJob(waveformJob.id, { taskId: runHandle.id })
        if (updatedJob) {
          await storeFallbackJob(payload.projectId, updatedJob)
        }
      }
    } else {
      await updateJob(waveformJob.id, { status: 'running' })
      const waveformResult = await processVideoWaveform({
        projectId: payload.projectId,
        assetId: payload.assetId,
      })
      const updatedJob = await updateJob(waveformJob.id, { status: 'completed', result: waveformResult, error: null })
      if (updatedJob) {
        await storeFallbackJob(payload.projectId, updatedJob)
      }
    }

    return {
      assetId: payload.assetId,
      durationSeconds: probe.durationSeconds,
      proxyPath,
      masterPath,
    }
  } finally {
    await rm(workingDirectory, { recursive: true, force: true })
  }
}

export async function processVideoWaveform(payload: WaveformJobPayload) {
  if (!hasSupabaseConfig()) {
    return {
      assetId: payload.assetId,
      peakCount: 0,
    }
  }

  const buckets = getBuckets()
  const { projectRow } = await loadProjectRows(payload.projectId)
  const assetRow = await loadAssetRowForUser(projectRow.owner_user_id, payload.assetId)
  const durationSeconds = Math.max(1, Number(assetRow.duration_seconds ?? 60))
  const peaks = Array.from({ length: 120 }, (_, index) => {
    const progress = index / 119
    return Number((0.18 + Math.abs(Math.sin(progress * Math.PI * 5.2)) * 0.74).toFixed(3))
  })
  const waveformPath = `${payload.projectId}/${payload.assetId}/waveform.json`

  await uploadBuffer(
    buckets.thumbnails,
    waveformPath,
    Buffer.from(JSON.stringify({ durationSeconds, peaks }), 'utf-8'),
    'application/json',
  )

  await updateVideoAssetRow(assetRow.id, {
    upload_metadata: {
      ...(assetRow.upload_metadata ?? {}),
      waveformBucket: buckets.thumbnails,
      waveformPath,
    },
  })

  return {
    assetId: payload.assetId,
    peakCount: peaks.length,
    waveformPath,
  }
}

export async function processVideoSubtitles(payload: SubtitleJobPayload) {
  if (!hasSupabaseConfig()) {
    return {
      projectId: payload.projectId,
      cueCount: 0,
    }
  }

  const buckets = getBuckets()
  const { projectRow, cueRows, clipRows, assetRow } = await loadProjectRows(payload.projectId)
  const cues = cueRows.length > 0
    ? cueRows.map((row) => ({
        id: String(row.cue_key),
        startLabel: String(row.start_label),
        endLabel: String(row.end_label),
        text: String(row.text),
      }))
    : clipRows.map((row, index) => ({
        id: `cue-${index + 1}`,
        startLabel: new Date(Math.max(0, Number(row.start_seconds ?? 0)) * 1000).toISOString().slice(11, 19),
        endLabel: new Date(Math.max(0, Number(row.end_seconds ?? 0)) * 1000).toISOString().slice(11, 19),
        text: `${String(row.title)}: ${String(row.summary ?? 'Lesson caption draft.')}`,
      }))

  const content = [
    'WEBVTT',
    '',
    ...cues.flatMap((cue) => [
      `${toWebVttTimestamp(cue.startLabel)} --> ${toWebVttTimestamp(cue.endLabel)}`,
      cue.text,
      '',
    ]),
  ].join('\n')

  const subtitlePath = `${payload.projectId}/captions/latest.vtt`
  await uploadBuffer(buckets.subtitles, subtitlePath, Buffer.from(content, 'utf-8'), 'text/vtt')
  await writeSubtitleTrack(payload.projectId, cues, buckets.subtitles, subtitlePath)

  if (assetRow) {
    await updateVideoAssetRow(assetRow.id, {
      subtitle_bucket: buckets.subtitles,
      subtitle_path: subtitlePath,
      upload_metadata: {
        ...(assetRow.upload_metadata ?? {}),
        subtitleGeneratedAt: new Date().toISOString(),
      },
    })
  }

  await Promise.all([
    registerMediaItem({
      ownerUserId: projectRow.owner_user_id,
      sourceModule: 'video',
      assetType: 'subtitle',
      fileName: 'latest.vtt',
      fileType: 'text/vtt',
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
      storageBucket: buckets.subtitles,
      storagePath: subtitlePath,
      variant: 'subtitle',
      linkedEntityType: 'video_project',
      linkedEntityId: payload.projectId,
      metadata: {
        cueCount: cues.length,
      },
    }),
    appendActivityLog({
      userId: projectRow.owner_user_id,
      module: 'video',
      action: 'subtitle_generated',
      entityType: 'video_project',
      entityId: payload.projectId,
      metadata: {
        cueCount: cues.length,
      },
    }),
  ])

  return {
    projectId: payload.projectId,
    cueCount: cues.length,
    subtitlePath,
    ownerUserId: projectRow.owner_user_id,
  }
}

export async function processVideoRender(payload: RenderJobPayload) {
  if (!hasSupabaseConfig()) {
    return {
      projectId: payload.projectId,
      renderPath: null,
    }
  }

  const buckets = getBuckets()
  const { projectRow, assetRow } = await loadProjectRows(payload.projectId)
  if (!assetRow) {
    throw new AppError('VALIDATION_ERROR', 'Upload a source video before exporting.')
  }

  const sourceBucket = assetRow.render_bucket ?? assetRow.proxy_bucket ?? assetRow.storage_bucket ?? buckets.raw
  const sourcePath = assetRow.render_path ?? assetRow.proxy_path ?? assetRow.storage_path
  if (!sourcePath) {
    throw new AppError('VALIDATION_ERROR', 'The source asset is not ready for export yet.')
  }

  const workingDirectory = await mkdtemp(path.join(tmpdir(), 'watashi-video-render-'))
  const sourceFilePath = path.join(workingDirectory, 'source.mp4')
  const renderedFilePath = path.join(workingDirectory, 'final.mp4')

  try {
    const sourceBuffer = await downloadBuffer(sourceBucket, sourcePath)
    await writeFile(sourceFilePath, sourceBuffer)
    await transcodeMaster(sourceFilePath, renderedFilePath)
    const renderBuffer = await readFile(renderedFilePath)
    const renderPath = `${payload.projectId}/exports/${sanitizePathSegment(projectRow.title)}-${Date.now()}.mp4`

    await uploadBuffer(buckets.rendered, renderPath, renderBuffer, 'video/mp4')
    await updateVideoAssetRow(assetRow.id, {
      render_bucket: buckets.rendered,
      render_path: renderPath,
      status: 'ready',
      upload_metadata: {
        ...(assetRow.upload_metadata ?? {}),
        renderCompletedAt: new Date().toISOString(),
      },
    })

    await Promise.all([
      registerMediaItem({
        ownerUserId: projectRow.owner_user_id,
        sourceModule: 'video',
        assetType: 'video',
        fileName: path.basename(renderPath),
        fileType: 'video/mp4',
        sizeBytes: renderBuffer.byteLength,
        storageBucket: buckets.rendered,
        storagePath: renderPath,
        variant: 'export',
        linkedEntityType: 'video_project',
        linkedEntityId: payload.projectId,
        metadata: { assetId: assetRow.id },
      }),
      appendActivityLog({
        userId: projectRow.owner_user_id,
        module: 'video',
        action: 'render_completed',
        entityType: 'video_project',
        entityId: payload.projectId,
        metadata: {
          renderPath,
        },
      }),
    ])

    return {
      projectId: payload.projectId,
      renderPath,
    }
  } finally {
    await rm(workingDirectory, { recursive: true, force: true })
  }
}

export function mapJobRecordsToProcessingJobs(jobRecords: Array<JobRecord>): ProcessingJob[] {
  const latestJobByType = new Map(jobRecords.map((job) => [job.type, job]))
  const getStatus = (type: JobRecord['type']) => {
    const job = latestJobByType.get(type)
    if (!job) {
      return 'idle' as const
    }

    if (job.status === 'running') {
      return 'processing' as const
    }

    return job.status
  }

  const getDetail = (type: JobRecord['type'], idleDetail: string) => {
    const job = latestJobByType.get(type)
    if (!job) {
      return idleDetail
    }

    if (job.error) {
      return job.error
    }

    return job.status === 'completed' ? 'Completed successfully.' : idleDetail
  }

  return [
    {
      id: 'upload',
      label: 'Upload pipeline',
      detail: getDetail('video-probe', 'Waiting for a source video.'),
      status: getStatus('video-probe'),
      progress: latestJobByType.get('video-probe')?.status === 'completed' ? 100 : latestJobByType.get('video-probe')?.status === 'running' ? 68 : latestJobByType.get('video-probe') ? 18 : 0,
    },
    {
      id: 'analysis',
      label: 'Timeline + waveform prep',
      detail: getDetail('video-waveform', 'Metadata analysis will start after a valid upload.'),
      status: getStatus('video-waveform'),
      progress: latestJobByType.get('video-waveform')?.status === 'completed' ? 100 : latestJobByType.get('video-waveform')?.status === 'running' ? 72 : latestJobByType.get('video-waveform') ? 20 : 0,
    },
    {
      id: 'subtitles',
      label: 'Subtitle generation',
      detail: getDetail('video-subtitles', 'Ready to generate subtitles without blocking the editor.'),
      status: getStatus('video-subtitles'),
      progress: latestJobByType.get('video-subtitles')?.status === 'completed' ? 100 : latestJobByType.get('video-subtitles')?.status === 'running' ? 74 : latestJobByType.get('video-subtitles') ? 16 : 0,
    },
    {
      id: 'render',
      label: 'Final export',
      detail: getDetail('video-render', 'Queue a publish-ready render after binding to a lesson or course.'),
      status: getStatus('video-render'),
      progress: latestJobByType.get('video-render')?.status === 'completed' ? 100 : latestJobByType.get('video-render')?.status === 'running' ? 78 : latestJobByType.get('video-render') ? 22 : 0,
    },
  ]
}
