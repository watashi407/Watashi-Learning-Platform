import { createFileRoute } from '@tanstack/react-router'
import { requireRequestUser } from '../../../lib/backend/auth-server'
import { getJob } from '../../../lib/backend/jobs'
import { jsonResponse } from '../../../lib/backend/responses'
import { normalizeError } from '../../../shared/errors'

export const Route = createFileRoute('/api/jobs/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const user = await requireRequestUser(request)
          const job = await getJob(params.id)
          if (!job) {
            return jsonResponse({ error: 'We could not find that job.' }, { status: 404 })
          }

          if (!user.isAdmin && job.userEmail && job.userEmail !== user.email) {
            return jsonResponse({ error: 'You do not have permission to view that job.' }, { status: 403 })
          }

          return jsonResponse(job)
        } catch (error) {
          const normalized = normalizeError(error, 'api-job-status')
          return jsonResponse({ error: normalized.message }, { status: normalized.status })
        }
      },
    },
  },
})
