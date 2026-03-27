import { getJob, createJob, updateJob } from '../../lib/backend/jobs'
import { generateCourseOutlineResult, generateStudyPathResult } from '../../lib/backend/processors'
import { triggerJobTask } from '../../lib/backend/trigger'
import { ensureProfileProvisioned } from '../auth/auth.server'
import type { AuthSession } from '../../shared/contracts/auth'
import type {
  CourseOutlineRequest,
  CourseOutlineResult,
  JobCreateSuccess,
  JobRecord,
  StudyPathRequest,
  StudyPathResult,
} from '../../shared/contracts/jobs'
import { AppError } from '../../shared/errors'
import { hasTriggerConfig } from '../../server/env'
import { enforceRateLimit } from '../../server/security/rate-limit.server'

async function queueJob<TPayload, TResult>(
  type: 'study-path' | 'course-outline',
  user: AuthSession,
  payload: TPayload,
  requestId: string,
  rateLimitKey: string,
  triggerTaskId: string,
  fallbackRunner: (input: TPayload) => Promise<TResult>,
): Promise<JobCreateSuccess<TResult>> {
  await enforceRateLimit({
    scope: `job-${type}`,
    identifier: rateLimitKey,
    limit: 10,
    windowMinutes: 10,
    requestId,
  })

  try {
    await ensureProfileProvisioned({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not get your account ready for this request. Please try again.', {
      requestId,
      cause: error,
    })
  }

  const job = await createJob({
    type,
    userId: user.id,
    userEmail: user.email,
    payload,
  })

  if (hasTriggerConfig()) {
    const runHandle = await triggerJobTask(triggerTaskId, {
      jobId: job.id,
      payload,
    })

    if (runHandle?.id) {
      await updateJob(job.id, { taskId: runHandle.id, status: 'queued', error: null })
      return {
        jobId: job.id,
        status: 'queued',
        taskId: runHandle.id,
      }
    }
  }

  const result = await fallbackRunner(payload)
  await updateJob(job.id, {
    status: 'completed',
    result,
    error: null,
  })

  return {
    jobId: job.id,
    status: 'completed',
    result,
  }
}

export function createStudyPathJob(
  payload: StudyPathRequest,
  user: AuthSession,
  requestId: string,
): Promise<JobCreateSuccess<StudyPathResult>> {
  return queueJob(
    'study-path',
    user,
    payload,
    requestId,
    `${user.id}:${payload.learnerName.toLowerCase()}`,
    'watashi-study-path',
    generateStudyPathResult,
  )
}

export function createCourseOutlineJob(
  payload: CourseOutlineRequest,
  user: AuthSession,
  requestId: string,
): Promise<JobCreateSuccess<CourseOutlineResult>> {
  return queueJob(
    'course-outline',
    user,
    payload,
    requestId,
    `${user.id}:${payload.topic.toLowerCase()}`,
    'watashi-course-outline',
    generateCourseOutlineResult,
  )
}

export async function getOwnedJob<TResult = unknown>(jobId: string, user: AuthSession, requestId: string): Promise<JobRecord<unknown, TResult>> {
  const job = await getJob(jobId)

  if (!job) {
    throw new AppError('NOT_FOUND', 'We could not find that request.', { requestId })
  }

  if (job.userId !== user.id && user.role !== 'admin') {
    throw new AppError('FORBIDDEN', 'You do not have permission to view that request.', { requestId })
  }

  return job as JobRecord<unknown, TResult>
}
