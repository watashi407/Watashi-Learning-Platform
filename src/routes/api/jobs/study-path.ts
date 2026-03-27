import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { requireRequestUser } from '../../../lib/backend/auth-server'
import { createJob, updateJob } from '../../../lib/backend/jobs'
import { generateStudyPathResult } from '../../../lib/backend/processors'
import { jsonResponse } from '../../../lib/backend/responses'
import { triggerJobTask } from '../../../lib/backend/trigger'
import { AppError, normalizeError } from '../../../shared/errors'

const studyPathSchema = z.object({
  learnerName: z.string().min(1),
  currentCourses: z.array(
    z.object({
      title: z.string().min(1),
      progress: z.number().min(0).max(100),
    }),
  ).min(1),
})

export const Route = createFileRoute('/api/jobs/study-path')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireRequestUser(request)
          const body = studyPathSchema.parse(await request.json())
          const job = await createJob({
            type: 'study-path',
            userId: user.id,
            userEmail: user.email,
            payload: body,
          })

          const runHandle = await triggerJobTask('watashi-study-path', {
            jobId: job.id,
            payload: body,
          })

          if (runHandle?.id) {
            await updateJob(job.id, { taskId: runHandle.id })
            return jsonResponse({ jobId: job.id, status: 'queued', taskId: runHandle.id })
          }

          const result = await generateStudyPathResult(body)
          await updateJob(job.id, { status: 'completed', result })
          return jsonResponse({ jobId: job.id, status: 'completed', result })
        } catch (error) {
          const normalized = error instanceof z.ZodError
            ? new AppError('VALIDATION_ERROR', 'Please check the request and try again.')
            : normalizeError(error, 'api-study-path')

          return jsonResponse({ error: normalized.message }, { status: normalized.status })
        }
      },
    },
  },
})
