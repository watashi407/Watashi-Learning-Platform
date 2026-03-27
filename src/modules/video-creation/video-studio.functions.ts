import { createServerFn } from '@tanstack/react-start'
import type { AppRequestContext } from '../../server/context'
import { runAction } from '../../server/run-action'
import { AppError } from '../../shared/errors'
import type {
  CompleteVideoUploadResult,
  CreateVideoUploadSessionResult,
  QueueVideoJobResult,
  RecordingSessionRecord,
  VideoProjectSnapshot,
  VideoStudioBootstrap,
} from '../../shared/contracts/video-studio'
import {
  bootstrapVideoStudio,
  completeVideoUpload,
  createRecordingSession,
  createVideoProject,
  createVideoUploadSession,
  saveVideoProject,
  queueRenderJob,
  queueSubtitleJob,
} from './video-studio.server'
import {
  completeVideoUploadSchema,
  createVideoProjectSchema,
  createVideoUploadSessionSchema,
  queueVideoJobSchema,
  recordingSessionSchema,
  saveVideoProjectSchema,
} from './video-studio.schemas'

function requireContextUser(context: Partial<AppRequestContext>, requestId: string) {
  if (!context.user) {
    throw new AppError('UNAUTHORIZED', 'You need to sign in to continue.', { requestId })
  }

  return context.user
}

export const bootstrapVideoStudioFn = createServerFn({ method: 'GET' }).handler(async ({ context }) => {
  const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
  return runAction<VideoStudioBootstrap>(requestId, async () => {
    const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
    return await bootstrapVideoStudio(user, requestId)
  })
})

export const createVideoProjectFn = createServerFn({ method: 'POST' })
  .inputValidator(createVideoProjectSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<VideoProjectSnapshot>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await createVideoProject(user, data, requestId)
    })
  })

export const saveVideoProjectFn = createServerFn({ method: 'POST' })
  .inputValidator(saveVideoProjectSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<VideoProjectSnapshot>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await saveVideoProject(user, data, requestId)
    })
  })

export const createRecordingSessionFn = createServerFn({ method: 'POST' })
  .inputValidator(recordingSessionSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<RecordingSessionRecord>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await createRecordingSession(user, data)
    })
  })

export const createVideoUploadSessionFn = createServerFn({ method: 'POST' })
  .inputValidator(createVideoUploadSessionSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<CreateVideoUploadSessionResult>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await createVideoUploadSession(user, data, requestId)
    })
  })

export const completeVideoUploadFn = createServerFn({ method: 'POST' })
  .inputValidator(completeVideoUploadSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<CompleteVideoUploadResult>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await completeVideoUpload(user, data, requestId)
    })
  })

export const queueSubtitleJobFn = createServerFn({ method: 'POST' })
  .inputValidator(queueVideoJobSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<QueueVideoJobResult>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await queueSubtitleJob(user, data.projectId)
    })
  })

export const queueRenderJobFn = createServerFn({ method: 'POST' })
  .inputValidator(queueVideoJobSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<QueueVideoJobResult>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await queueRenderJob(user, data.projectId)
    })
  })
