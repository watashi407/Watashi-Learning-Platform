import { schedules, task } from '@trigger.dev/sdk'
import { updateJob } from '../lib/backend/jobs'
import {
  generateCourseOutlineResult,
  generateStudyPathResult,
  moderateCommunityContent,
  sendNotificationTest,
} from '../lib/backend/processors'
import type {
  CommunityModerationRequest,
  CourseOutlineRequest,
  NotificationTestRequest,
  StudyPathRequest,
} from '../lib/backend/types'
import {
  processVideoProbe,
  processVideoRender,
  processVideoSubtitles,
  processVideoWaveform,
} from '../modules/video-creation/video-studio.server'
import {
  processCertificateGenerate,
  processCertificateReissue,
} from '../features/educator/educator.server'
import { normalizeError } from '../shared/errors'
import { aiGenerationQueue, mediaProcessingQueue, notificationsQueue } from './queues'

type JobPayload<TPayload> = {
  jobId: string
  payload: TPayload
}

export const studyPathTask = task({
  id: 'watashi-study-path',
  queue: aiGenerationQueue,
  run: async ({ jobId, payload }: JobPayload<StudyPathRequest>) => {
    await updateJob(jobId, { status: 'running', error: null })
    try {
      const result = await generateStudyPathResult(payload)
      await updateJob(jobId, { status: 'completed', result, error: null })
      return result
    } catch (error) {
      const message = normalizeError(error, jobId).message
      await updateJob(jobId, { status: 'failed', error: message })
      throw error
    }
  },
})

export const courseOutlineTask = task({
  id: 'watashi-course-outline',
  queue: aiGenerationQueue,
  run: async ({ jobId, payload }: JobPayload<CourseOutlineRequest>) => {
    await updateJob(jobId, { status: 'running', error: null })
    try {
      const result = await generateCourseOutlineResult(payload)
      await updateJob(jobId, { status: 'completed', result, error: null })
      return result
    } catch (error) {
      const message = normalizeError(error, jobId).message
      await updateJob(jobId, { status: 'failed', error: message })
      throw error
    }
  },
})

export const communityModerationTask = task({
  id: 'watashi-community-moderation',
  queue: aiGenerationQueue,
  run: async ({ jobId, payload }: JobPayload<CommunityModerationRequest>) => {
    await updateJob(jobId, { status: 'running', error: null })
    try {
      const result = await moderateCommunityContent(payload)
      await updateJob(jobId, { status: 'completed', result, error: null })
      return result
    } catch (error) {
      const message = normalizeError(error, jobId).message
      await updateJob(jobId, { status: 'failed', error: message })
      throw error
    }
  },
})

export const notificationTestTask = task({
  id: 'watashi-notification-test',
  queue: notificationsQueue,
  run: async ({ jobId, payload }: JobPayload<NotificationTestRequest>) => {
    await updateJob(jobId, { status: 'running', error: null })
    try {
      const result = await sendNotificationTest(payload)
      await updateJob(jobId, { status: 'completed', result, error: null })
      return result
    } catch (error) {
      const message = normalizeError(error, jobId).message
      await updateJob(jobId, { status: 'failed', error: message })
      throw error
    }
  },
})

export const videoProbeTask = task({
  id: 'watashi-video-probe',
  queue: mediaProcessingQueue,
  run: async ({ jobId, payload }: JobPayload<{ projectId: string; assetId: string }>) => {
    await updateJob(jobId, { status: 'running', error: null })
    try {
      const result = await processVideoProbe(payload)
      await updateJob(jobId, { status: 'completed', result, error: null })
      return result
    } catch (error) {
      const message = normalizeError(error, jobId).message
      await updateJob(jobId, { status: 'failed', error: message })
      throw error
    }
  },
})

export const videoWaveformTask = task({
  id: 'watashi-video-waveform',
  queue: mediaProcessingQueue,
  run: async ({ jobId, payload }: JobPayload<{ projectId: string; assetId: string }>) => {
    await updateJob(jobId, { status: 'running', error: null })
    try {
      const result = await processVideoWaveform(payload)
      await updateJob(jobId, { status: 'completed', result, error: null })
      return result
    } catch (error) {
      const message = normalizeError(error, jobId).message
      await updateJob(jobId, { status: 'failed', error: message })
      throw error
    }
  },
})

export const videoSubtitlesTask = task({
  id: 'watashi-video-subtitles',
  queue: mediaProcessingQueue,
  run: async ({ jobId, payload }: JobPayload<{ projectId: string }>) => {
    await updateJob(jobId, { status: 'running', error: null })
    try {
      const result = await processVideoSubtitles(payload)
      await updateJob(jobId, { status: 'completed', result, error: null })
      return result
    } catch (error) {
      const message = normalizeError(error, jobId).message
      await updateJob(jobId, { status: 'failed', error: message })
      throw error
    }
  },
})

export const videoRenderTask = task({
  id: 'watashi-video-render',
  queue: mediaProcessingQueue,
  run: async ({ jobId, payload }: JobPayload<{ projectId: string }>) => {
    await updateJob(jobId, { status: 'running', error: null })
    try {
      const result = await processVideoRender(payload)
      await updateJob(jobId, { status: 'completed', result, error: null })
      return result
    } catch (error) {
      const message = normalizeError(error, jobId).message
      await updateJob(jobId, { status: 'failed', error: message })
      throw error
    }
  },
})

export const certificateGenerateTask = task({
  id: 'watashi-certificate-generate',
  queue: mediaProcessingQueue,
  run: async ({ jobId, payload }: JobPayload<{ templateId: string; learnerId: string; courseId: string; issuedByUserId: string | null; reason: 'manual' | 'completion' | 'reissue'; reissuedFromIssueId?: string | null }>) => {
    await updateJob(jobId, { status: 'running', error: null })
    try {
      const result = await processCertificateGenerate(payload)
      await updateJob(jobId, { status: 'completed', result, error: null })
      return result
    } catch (error) {
      const message = normalizeError(error, jobId).message
      await updateJob(jobId, { status: 'failed', error: message })
      throw error
    }
  },
})

export const certificateReissueTask = task({
  id: 'watashi-certificate-reissue',
  queue: mediaProcessingQueue,
  run: async ({ jobId, payload }: JobPayload<{ issueId: string; issuedByUserId: string | null }>) => {
    await updateJob(jobId, { status: 'running', error: null })
    try {
      const result = await processCertificateReissue(payload)
      await updateJob(jobId, { status: 'completed', result, error: null })
      return result
    } catch (error) {
      const message = normalizeError(error, jobId).message
      await updateJob(jobId, { status: 'failed', error: message })
      throw error
    }
  },
})

export const weeklyDigestTask = schedules.task({
  id: 'watashi-weekly-digest',
  cron: {
    pattern: '0 9 * * 1',
    timezone: 'Asia/Manila',
    environments: ['PRODUCTION'],
  },
  queue: notificationsQueue,
  run: async () => {
    return {
      delivered: true,
      schedule: 'weekly-digest',
      generatedAt: new Date().toISOString(),
    }
  },
})
