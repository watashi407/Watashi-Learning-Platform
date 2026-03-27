import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { requireRequestUser } from '../../../lib/backend/auth-server'
import { createJob, updateJob } from '../../../lib/backend/jobs'
import { generateCourseOutlineResult } from '../../../lib/backend/processors'
import { jsonResponse } from '../../../lib/backend/responses'
import { triggerJobTask } from '../../../lib/backend/trigger'
import { AppError, normalizeError } from '../../../shared/errors'

const courseOutlineSchema = z.object({
  topic: z.string().min(3),
})

export const Route = createFileRoute('/api/jobs/course-outline')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireRequestUser(request)
          const body = courseOutlineSchema.parse(await request.json())
          const job = await createJob({
            type: 'course-outline',
            userId: user.id,
            userEmail: user.email,
            payload: body,
          })

          const runHandle = await triggerJobTask('watashi-course-outline', {
            jobId: job.id,
            payload: body,
          })

          if (runHandle?.id) {
            await updateJob(job.id, { taskId: runHandle.id })
            return jsonResponse({ jobId: job.id, status: 'queued', taskId: runHandle.id })
          }

          const result = await generateCourseOutlineResult(body)
          await updateJob(job.id, { status: 'completed', result })
          return jsonResponse({ jobId: job.id, status: 'completed', result })
        } catch (error) {
          const normalized = error instanceof z.ZodError
            ? new AppError('VALIDATION_ERROR', 'Please check the request and try again.')
            : normalizeError(error, 'api-course-outline')

          return jsonResponse({ error: normalized.message }, { status: normalized.status })
        }
      },
    },
  },
})
