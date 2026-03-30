import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const ensureProfileProvisionedMock = vi.fn()
const createServiceSupabaseClientMock = vi.fn()
const createJobMock = vi.fn()
const updateJobMock = vi.fn()
const triggerJobTaskMock = vi.fn()
const hasSupabaseConfigMock = vi.fn<() => boolean>()
const hasTriggerConfigMock = vi.fn<() => boolean>()
const getServerEnvMock = vi.fn()
const existsSyncMock = vi.fn()
const mkdtempMock = vi.fn()
const readFileMock = vi.fn()
const rmMock = vi.fn()
const writeFileMock = vi.fn()
const registerMediaItemMock = vi.fn()
const appendActivityLogMock = vi.fn()
const spawnMock = vi.fn()

vi.mock('../../features/auth/auth.server', () => ({
  ensureProfileProvisioned: ensureProfileProvisionedMock,
}))

vi.mock('../../lib/supabase/server', () => ({
  createServiceSupabaseClient: createServiceSupabaseClientMock,
}))

vi.mock('../../lib/backend/jobs', () => ({
  createJob: createJobMock,
  updateJob: updateJobMock,
}))

vi.mock('../../lib/backend/trigger', () => ({
  triggerJobTask: triggerJobTaskMock,
}))

vi.mock('../../server/env', () => ({
  hasSupabaseConfig: hasSupabaseConfigMock,
  hasTriggerConfig: hasTriggerConfigMock,
  getServerEnv: getServerEnvMock,
}))

vi.mock('../../features/educator/educator-infra.server', () => ({
  appendActivityLog: appendActivityLogMock,
  registerMediaItem: registerMediaItemMock,
}))

vi.mock('ffmpeg-static', () => ({
  default: 'C:/mock/ffmpeg.exe',
}))

vi.mock('ffprobe-static', () => ({
  default: { path: 'C:/mock/ffprobe.exe' },
}))

vi.mock('node:fs', () => ({
  existsSync: existsSyncMock,
}))

vi.mock('node:fs/promises', () => ({
  mkdtemp: mkdtempMock,
  readFile: readFileMock,
  rm: rmMock,
  writeFile: writeFileMock,
}))

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}))

type SpawnResponse = {
  stdout?: string
  stderr?: string
  exitCode?: number
  error?: Error
}

type FakeAssetRow = {
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

type FakeVideoStudioState = {
  assetRow: FakeAssetRow
  projectRow: {
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
  rawBuffer: Buffer
  assetUpdates: Array<Record<string, unknown>>
  storageUploads: Array<{ bucket: string; objectPath: string; body: Buffer; contentType: string | undefined }>
}

function createSpawnMockQueue() {
  const queue: SpawnResponse[] = []

  spawnMock.mockImplementation(() => {
    const response = queue.shift() ?? { exitCode: 0 }
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter
      stderr: EventEmitter
    }
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()

    queueMicrotask(() => {
      if (response.error) {
        child.emit('error', response.error)
        return
      }

      if (response.stdout) {
        child.stdout.emit('data', Buffer.from(response.stdout))
      }

      if (response.stderr) {
        child.stderr.emit('data', Buffer.from(response.stderr))
      }

      child.emit('close', response.exitCode ?? 0)
    })

    return child
  })

  return {
    enqueue(response: SpawnResponse) {
      queue.push(response)
    },
  }
}

function createFakeSupabaseClient(state: FakeVideoStudioState) {
  const execute = async (table: string, patch: Record<string, unknown> | null, mode: 'single' | 'maybeSingle' | 'list' | 'noop') => {
    if (patch) {
      if (table === 'video_assets') {
        state.assetUpdates.push({ ...patch })
        state.assetRow = {
          ...state.assetRow,
          ...patch,
          upload_metadata: patch.upload_metadata
            ? { ...(state.assetRow.upload_metadata ?? {}), ...(patch.upload_metadata as Record<string, unknown>) }
            : state.assetRow.upload_metadata,
        }
        return { data: null, error: null }
      }

      return { data: null, error: null }
    }

    switch (table) {
      case 'video_projects':
        return { data: state.projectRow, error: null }
      case 'video_assets':
        return { data: state.assetRow, error: null }
      case 'timeline_clips':
      case 'overlays':
      case 'video_text_overlays':
      case 'video_image_overlays':
      case 'subtitle_cues':
        return { data: [], error: null }
      case 'audio_edits':
      case 'subtitle_tracks':
      case 'video_effect_settings':
        return { data: null, error: null }
      default:
        return { data: mode === 'list' ? [] : null, error: null }
    }
  }

  const createQuery = (table: string) => {
    let patch: Record<string, unknown> | null = null
    let mode: 'single' | 'maybeSingle' | 'list' | 'noop' = 'noop'

    const builder = {
      select() {
        mode = 'list'
        return builder
      },
      eq() {
        return builder
      },
      order() {
        return builder
      },
      limit() {
        return builder
      },
      in() {
        return builder
      },
      insert(value: Record<string, unknown>) {
        patch = value
        return builder
      },
      update(value: Record<string, unknown>) {
        patch = value
        return builder
      },
      upsert(value: Record<string, unknown>) {
        patch = value
        return builder
      },
      single() {
        mode = 'single'
        return execute(table, patch, mode)
      },
      maybeSingle() {
        mode = 'maybeSingle'
        return execute(table, patch, mode)
      },
      then(resolve: (value: { data: unknown; error: unknown }) => void, reject: (reason?: unknown) => void) {
        execute(table, patch, mode).then(resolve, reject)
      },
    }

    return builder
  }

  return {
    from(table: string) {
      return createQuery(table)
    },
    schema(schemaName: string) {
      if (schemaName !== 'storage') {
        throw new Error(`Unexpected schema ${schemaName}`)
      }

      return {
        from(table: string) {
          if (table !== 'objects') {
            throw new Error(`Unexpected storage table ${table}`)
          }

          return {
            select() {
              return this
            },
            eq() {
              return this
            },
            single: async () => ({
              data: {
                metadata: {
                  size: state.assetRow.byte_size,
                  mimetype: state.assetRow.content_type,
                },
                bucket_id: state.assetRow.storage_bucket,
                name: state.assetRow.storage_path,
              },
              error: null,
            }),
          }
        },
      }
    },
    storage: {
      from(bucket: string) {
        return {
          upload: async (objectPath: string, body: Buffer, options?: { contentType?: string }) => {
            state.storageUploads.push({
              bucket,
              objectPath,
              body: Buffer.from(body),
              contentType: options?.contentType,
            })
            return { error: null }
          },
          download: async (objectPath: string) => {
            if (bucket !== state.assetRow.storage_bucket || objectPath !== state.assetRow.storage_path) {
              return { data: null, error: new Error('Object not found') }
            }

            return { data: new Blob([state.rawBuffer]), error: null }
          },
          createSignedUrl: async (objectPath: string) => ({
            data: { signedUrl: `https://example.com/${bucket}/${objectPath}` },
            error: null,
          }),
        }
      },
    },
  }
}

function createVideoStudioState(overrides?: Partial<FakeAssetRow>): FakeVideoStudioState {
  const now = '2026-03-30T00:00:00.000Z'
  return {
    projectRow: {
      id: 'project-1',
      owner_user_id: 'educator-1',
      title: 'Lesson production workspace',
      binding_type: 'lesson',
      binding_target_id: 'lesson-1',
      status: 'draft',
      export_status: 'idle',
      created_at: now,
      updated_at: now,
    },
    assetRow: {
      id: 'asset-1',
      project_id: 'project-1',
      owner_user_id: 'educator-1',
      original_file_name: 'source.mp4',
      source_type: 'uploaded',
      status: 'processing',
      content_type: 'video/mp4',
      byte_size: 1024,
      duration_seconds: null,
      storage_bucket: 'video-raw',
      storage_path: 'project-1/asset-1/source.mp4',
      proxy_bucket: null,
      proxy_path: null,
      render_bucket: null,
      render_path: null,
      subtitle_bucket: null,
      subtitle_path: null,
      thumbnail_bucket: null,
      thumbnail_path: null,
      upload_metadata: { token: 'upload-token' },
      created_at: now,
      updated_at: now,
      ...overrides,
    },
    rawBuffer: Buffer.from('raw-media-buffer'),
    assetUpdates: [],
    storageUploads: [],
  }
}

describe('video studio backend media pipeline', () => {
  beforeEach(() => {
    vi.resetModules()
    ensureProfileProvisionedMock.mockReset()
    createServiceSupabaseClientMock.mockReset()
    createJobMock.mockReset()
    updateJobMock.mockReset()
    triggerJobTaskMock.mockReset()
    hasSupabaseConfigMock.mockReset()
    hasTriggerConfigMock.mockReset()
    getServerEnvMock.mockReset()
    existsSyncMock.mockReset()
    mkdtempMock.mockReset()
    readFileMock.mockReset()
    rmMock.mockReset()
    writeFileMock.mockReset()
    registerMediaItemMock.mockReset()
    appendActivityLogMock.mockReset()
    spawnMock.mockReset()

    hasSupabaseConfigMock.mockReturnValue(false)
    hasTriggerConfigMock.mockReturnValue(false)
    getServerEnvMock.mockReturnValue({
      VITE_VIDEO_CREATION_MAX_FILE_SIZE_MB: '2048',
      SUPABASE_VIDEO_RAW_BUCKET: undefined,
      SUPABASE_VIDEO_PROXY_BUCKET: undefined,
      SUPABASE_VIDEO_RENDERED_BUCKET: undefined,
      SUPABASE_VIDEO_SUBTITLE_BUCKET: undefined,
      SUPABASE_VIDEO_THUMBNAIL_BUCKET: undefined,
      VIDEO_RAW_RETENTION_DAYS: undefined,
      FFMPEG_PATH: undefined,
      FFPROBE_PATH: undefined,
    })
    existsSyncMock.mockReturnValue(true)
    ensureProfileProvisionedMock.mockResolvedValue(undefined)
    mkdtempMock.mockResolvedValue('C:/tmp/watashi-video-probe')
    writeFileMock.mockResolvedValue(undefined)
    rmMock.mockResolvedValue(undefined)
    readFileMock.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('proxy.mp4')) {
        return Buffer.from('proxy')
      }

      if (filePath.endsWith('master.mp4')) {
        return Buffer.from('master')
      }

      if (filePath.endsWith('thumbnail.jpg')) {
        return Buffer.from('thumbnail')
      }

      return Buffer.from('file')
    })
    createJobMock.mockResolvedValue({
      id: 'job-waveform-1',
      type: 'video-waveform',
      status: 'queued',
      userId: 'educator-1',
      userEmail: null,
      payload: { projectId: 'project-1', assetId: 'asset-1' },
      result: null,
      error: null,
      taskId: null,
      createdAt: '2026-03-30T00:00:00.000Z',
      updatedAt: '2026-03-30T00:00:00.000Z',
    })
    updateJobMock.mockImplementation(async (jobId: string, patch: Record<string, unknown>) => ({
      id: jobId,
      type: 'video-waveform',
      status: String(patch.status ?? 'completed'),
      userId: 'educator-1',
      userEmail: null,
      payload: { projectId: 'project-1', assetId: 'asset-1' },
      result: patch.result ?? null,
      error: patch.error ?? null,
      taskId: patch.taskId ?? null,
      createdAt: '2026-03-30T00:00:00.000Z',
      updatedAt: '2026-03-30T00:00:00.000Z',
    }))
    triggerJobTaskMock.mockResolvedValue(null)
    registerMediaItemMock.mockResolvedValue(undefined)
    appendActivityLogMock.mockResolvedValue(undefined)
  })

  it('preserves text overlays, image overlays, and effects across save/load', async () => {
    const { bootstrapVideoStudio, saveVideoProject } = await import('./video-studio.server')

    const user = {
      id: 'educator-1',
      email: 'educator@example.com',
      name: 'Educator',
      role: 'educator' as const,
    }

    const bootstrap = await bootstrapVideoStudio(user, 'req-1')
    const source = bootstrap.project

    const saved = await saveVideoProject(user, {
      projectId: source.id,
      title: source.title,
      binding: source.binding,
      segments: source.segments,
      audioSettings: source.audioSettings,
      subtitleCues: source.subtitleCues,
      stampOverlays: source.stampOverlays,
      exportSettings: source.exportSettings,
      textOverlays: [
        {
          id: 'txt-1',
          text: 'Welcome learners',
          fontFamily: 'sans-serif',
          fontSize: 32,
          color: '#ffffff',
          bgColor: '#111111',
          position: 'bottom',
          startSeconds: 2,
          endSeconds: 18,
        },
      ],
      imageOverlays: [
        {
          id: 'img-1',
          label: 'Watermark',
          storagePath: 'branding/logo.png',
          objectUrl: 'https://example.com/logo.png',
          position: 'top-right',
          opacity: 0.85,
          startSeconds: 0,
          endSeconds: 120,
        },
      ],
      videoEffects: {
        brightness: 10,
        contrast: 7,
        saturation: 4,
        blur: 0,
      },
    }, 'req-2')

    const reloaded = await bootstrapVideoStudio(user, 'req-3')

    expect(saved.textOverlays).toEqual(reloaded.project.textOverlays)
    expect(saved.imageOverlays).toEqual(reloaded.project.imageOverlays)
    expect(saved.videoEffects).toEqual(reloaded.project.videoEffects)
  })

  it('marks the asset failed when media binaries are missing', async () => {
    hasSupabaseConfigMock.mockReturnValue(true)
    existsSyncMock.mockReturnValue(false)

    const state = createVideoStudioState()
    createServiceSupabaseClientMock.mockReturnValue(createFakeSupabaseClient(state))

    const { processVideoProbe } = await import('./video-studio.server')

    await expect(processVideoProbe({ projectId: 'project-1', assetId: 'asset-1' })).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
    })

    expect(state.assetRow.status).toBe('failed')
    expect(state.assetRow.upload_metadata.probeError).toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
    })
    expect(state.storageUploads).toHaveLength(0)
  })

  it('stores exact duration for audio-only uploads and skips video derivatives', async () => {
    hasSupabaseConfigMock.mockReturnValue(true)
    const spawnQueue = createSpawnMockQueue()
    spawnQueue.enqueue({
      stdout: JSON.stringify({
        format: { duration: '12.345' },
        streams: [{ codec_type: 'audio' }],
      }),
    })

    const state = createVideoStudioState({
      original_file_name: 'narration.wav',
      content_type: 'audio/wav',
      storage_path: 'project-1/asset-1/narration.wav',
    })
    createServiceSupabaseClientMock.mockReturnValue(createFakeSupabaseClient(state))

    const { processVideoProbe } = await import('./video-studio.server')
    const result = await processVideoProbe({ projectId: 'project-1', assetId: 'asset-1' })

    expect(result.durationSeconds).toBeCloseTo(12.345, 3)
    expect(result.proxyPath).toBeNull()
    expect(result.masterPath).toBeNull()
    expect(state.assetRow.status).toBe('ready')
    expect(state.assetRow.duration_seconds).toBeCloseTo(12.345, 3)
    expect(state.assetRow.proxy_path).toBeNull()
    expect(state.assetRow.thumbnail_path).toBeNull()
    expect(state.assetRow.upload_metadata).toMatchObject({
      mediaKind: 'audio',
      hasAudioStream: true,
      hasVideoStream: false,
      probeError: null,
      waveformBucket: 'video-thumbnails',
      waveformPath: 'project-1/asset-1/waveform.json',
    })
    expect(state.storageUploads.map((upload) => upload.objectPath)).toEqual([
      'project-1/asset-1/waveform.json',
    ])
    expect(registerMediaItemMock).not.toHaveBeenCalled()
  })

  it('stores exact duration for video uploads and writes proxy derivatives', async () => {
    hasSupabaseConfigMock.mockReturnValue(true)
    const spawnQueue = createSpawnMockQueue()
    spawnQueue.enqueue({
      stdout: JSON.stringify({
        format: { duration: '25.25' },
        streams: [{ codec_type: 'video' }, { codec_type: 'audio' }],
      }),
    })
    spawnQueue.enqueue({ exitCode: 0 })
    spawnQueue.enqueue({ exitCode: 0 })
    spawnQueue.enqueue({ exitCode: 0 })

    const state = createVideoStudioState()
    createServiceSupabaseClientMock.mockReturnValue(createFakeSupabaseClient(state))

    const { processVideoProbe } = await import('./video-studio.server')
    const result = await processVideoProbe({ projectId: 'project-1', assetId: 'asset-1' })

    expect(result.durationSeconds).toBeCloseTo(25.25, 2)
    expect(result.proxyPath).toBe('project-1/asset-1/proxy.mp4')
    expect(result.masterPath).toBe('project-1/asset-1/master.mp4')
    expect(state.assetRow.status).toBe('ready')
    expect(state.assetRow.upload_metadata).toMatchObject({
      mediaKind: 'video',
      hasAudioStream: true,
      hasVideoStream: true,
      probeError: null,
      waveformBucket: 'video-thumbnails',
      waveformPath: 'project-1/asset-1/waveform.json',
    })
    expect(state.storageUploads.map((upload) => upload.objectPath)).toEqual([
      'project-1/asset-1/proxy.mp4',
      'project-1/asset-1/master.mp4',
      'project-1/asset-1/thumbnail.jpg',
      'project-1/asset-1/waveform.json',
    ])
    expect(registerMediaItemMock).toHaveBeenCalledTimes(3)
  })

  it('persists probe failure details when transcoding fails after probe succeeds', async () => {
    hasSupabaseConfigMock.mockReturnValue(true)
    const spawnQueue = createSpawnMockQueue()
    spawnQueue.enqueue({
      stdout: JSON.stringify({
        format: { duration: '18' },
        streams: [{ codec_type: 'video' }, { codec_type: 'audio' }],
      }),
    })
    spawnQueue.enqueue({ exitCode: 1, stderr: 'transcode failed' })
    spawnQueue.enqueue({ exitCode: 0 })
    spawnQueue.enqueue({ exitCode: 0 })

    const state = createVideoStudioState()
    createServiceSupabaseClientMock.mockReturnValue(createFakeSupabaseClient(state))

    const { processVideoProbe } = await import('./video-studio.server')

    await expect(processVideoProbe({ projectId: 'project-1', assetId: 'asset-1' })).rejects.toThrow('transcode failed')

    expect(state.assetRow.status).toBe('failed')
    expect(state.assetRow.duration_seconds).toBe(18)
    expect(state.assetRow.upload_metadata).toMatchObject({
      mediaKind: 'video',
      hasAudioStream: true,
      hasVideoStream: true,
    })
    expect(state.assetRow.upload_metadata.probeError).toMatchObject({
      message: 'transcode failed',
    })
  })
})
