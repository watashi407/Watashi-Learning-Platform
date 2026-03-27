import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { requireRequestUser } from '../../../lib/backend/auth-server'
import { createJob, updateJob } from '../../../lib/backend/jobs'
import { sendNotificationTest } from '../../../lib/backend/processors'
import { jsonResponse } from '../../../lib/backend/responses'
import { triggerJobTask } from '../../../lib/backend/trigger'
import { AppError, normalizeError } from '../../../shared/errors'

const notificationSchema = z.object({
  recipient: z.string().email(),
  message: z.string().min(1),
})

export const Route = createFileRoute('/api/notifications/test')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireRequestUser(request)
          if (!user.isAdmin) {
            return jsonResponse({ error: 'You do not have permission to send test notifications.' }, { status: 403 })
          }

          const body = notificationSchema.parse(await request.json())
          const job = await createJob({
            type: 'notification-test',
            userId: user.id,
            userEmail: user.email,
            payload: body,
          })

          const runHandle = await triggerJobTask('watashi-notification-test', {
            jobId: job.id,
            payload: body,
          })

          if (runHandle?.id) {
            await updateJob(job.id, { taskId: runHandle.id })
            return jsonResponse({ jobId: job.id, status: 'queued', taskId: runHandle.id })
          }

          const result = await sendNotificationTest(body)
          await updateJob(job.id, { status: 'completed', result })
          return jsonResponse({ jobId: job.id, status: 'completed', result })
        } catch (error) {
          const normalized = error instanceof z.ZodError
            ? new AppError('VALIDATION_ERROR', 'Please check the request and try again.')
            : normalizeError(error, 'api-notification-test')

          return jsonResponse({ error: normalized.message }, { status: normalized.status })
        }
      },
    },
  },
})
