import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { requireRequestUser } from '../../../lib/backend/auth-server'
import { createJob, updateJob } from '../../../lib/backend/jobs'
import { jsonResponse } from '../../../lib/backend/responses'
import { moderateCommunityContent } from '../../../lib/backend/processors'
import { triggerJobTask } from '../../../lib/backend/trigger'
import { AppError, normalizeError } from '../../../shared/errors'

const moderateSchema = z.object({
  content: z.string().min(1),
  authorName: z.string().optional(),
})

export const Route = createFileRoute('/api/community/moderate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireRequestUser(request)
          const body = moderateSchema.parse(await request.json())
          const job = await createJob({
            type: 'community-moderation',
            userId: user.id,
            userEmail: user.email,
            payload: body,
          })

          const runHandle = await triggerJobTask('watashi-community-moderation', {
            jobId: job.id,
            payload: body,
          })

          if (runHandle?.id) {
            await updateJob(job.id, { taskId: runHandle.id })
            return jsonResponse({ jobId: job.id, status: 'queued', taskId: runHandle.id })
          }

          const result = await moderateCommunityContent(body)
          await updateJob(job.id, { status: 'completed', result })
          return jsonResponse({ jobId: job.id, status: 'completed', result })
        } catch (error) {
          const normalized = error instanceof z.ZodError
            ? new AppError('VALIDATION_ERROR', 'Please check the request and try again.')
            : normalizeError(error, 'api-community-moderation')

          return jsonResponse({ error: normalized.message }, { status: normalized.status })
        }
      },
    },
  },
})
