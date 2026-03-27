import { createCourseOutlineJobFn, createStudyPathJobFn, getJobStatusFn } from './ai-jobs.functions'
import type { CourseOutlineRequest, CourseOutlineResult, JobRecord, StudyPathRequest, StudyPathResult } from '../../shared/contracts/jobs'
import { unwrapActionResult } from '../../shared/errors'

export async function createStudyPathJob(payload: StudyPathRequest) {
  return unwrapActionResult(await createStudyPathJobFn({ data: payload }))
}

export async function createCourseOutlineJob(payload: CourseOutlineRequest) {
  return unwrapActionResult(await createCourseOutlineJobFn({ data: payload }))
}

export async function getJobStatus(jobId: string) {
  return unwrapActionResult(await getJobStatusFn({ data: { jobId } }))
}

export async function waitForJobResult<TResult>(jobId: string, maxAttempts = 20, intervalMs = 900) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const job = await getJobStatus(jobId) as JobRecord<unknown, TResult>
    if (job.status === 'completed') {
      return job.result as TResult
    }
    if (job.status === 'failed') {
      throw new Error(job.error || 'We could not finish that request. Please try again.')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error('This is taking longer than expected. Please try again in a moment.')
}

export async function resolveStudyPath(payload: StudyPathRequest) {
  const created = await createStudyPathJob(payload)
  return created.result ?? waitForJobResult<StudyPathResult>(created.jobId)
}

export async function resolveCourseOutline(payload: CourseOutlineRequest) {
  const created = await createCourseOutlineJob(payload)
  return created.result ?? waitForJobResult<CourseOutlineResult>(created.jobId)
}
