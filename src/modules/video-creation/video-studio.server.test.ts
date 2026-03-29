import { beforeEach, describe, expect, it, vi } from 'vitest'

const ensureProfileProvisionedMock = vi.fn()
const createServiceSupabaseClientMock = vi.fn()
const createJobMock = vi.fn()
const updateJobMock = vi.fn()
const triggerJobTaskMock = vi.fn()
const hasSupabaseConfigMock = vi.fn<() => boolean>()
const hasTriggerConfigMock = vi.fn<() => boolean>()
const getServerEnvMock = vi.fn()

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

describe('video studio fallback persistence', () => {
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

    hasSupabaseConfigMock.mockReturnValue(false)
    hasTriggerConfigMock.mockReturnValue(false)
    getServerEnvMock.mockReturnValue({
      VITE_VIDEO_CREATION_MAX_FILE_SIZE_MB: '2048',
      VIDEO_STUDIO_RAW_BUCKET: '',
      VIDEO_STUDIO_PROXY_BUCKET: '',
      VIDEO_STUDIO_RENDER_BUCKET: '',
      VIDEO_STUDIO_SUBTITLE_BUCKET: '',
      VIDEO_STUDIO_THUMBNAIL_BUCKET: '',
    })
    ensureProfileProvisionedMock.mockResolvedValue(undefined)
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
    expect(reloaded.project.textOverlays).toHaveLength(1)
    expect(reloaded.project.imageOverlays).toHaveLength(1)
    expect(reloaded.project.videoEffects).toEqual({
      brightness: 10,
      contrast: 7,
      saturation: 4,
      blur: 0,
    })
  })
})
