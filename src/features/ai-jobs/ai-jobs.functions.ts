import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { AppRequestContext } from '../../server/context'
import { AppError } from '../../shared/errors'
import type {
  CourseOutlineResult,
  JobCreateSuccess,
  JobRecord,
  StudyPathResult,
} from '../../shared/contracts/jobs'
import { runAction } from '../../server/run-action'
import { createCourseOutlineJob, createStudyPathJob, getOwnedJob } from './ai-jobs.server'
import { courseOutlineRequestSchema, studyPathRequestSchema } from './ai-jobs.schemas'

function requireContextUser(context: Partial<AppRequestContext>, requestId: string) {
  if (!context.user) {
    throw new AppError('UNAUTHORIZED', 'You need to sign in to continue.', { requestId })
  }

  return context.user
}

export const createStudyPathJobFn = createServerFn({ method: 'POST' })
  .inputValidator(studyPathRequestSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'

    return runAction<JobCreateSuccess<StudyPathResult>>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return createStudyPathJob(data, user, requestId)
    })
  })

export const createCourseOutlineJobFn = createServerFn({ method: 'POST' })
  .inputValidator(courseOutlineRequestSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'

    return runAction<JobCreateSuccess<CourseOutlineResult>>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return createCourseOutlineJob(data, user, requestId)
    })
  })

export const getJobStatusFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ jobId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'

    return runAction<JobRecord>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return getOwnedJob(data.jobId, user, requestId)
    })
  })
