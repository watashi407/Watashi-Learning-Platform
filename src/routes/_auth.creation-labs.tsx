import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireAuthenticatedSession } from '../features/dashboard/guards'
import { ROUTE_PATHS } from '../shared/routing/paths'

export const Route = createFileRoute('/_auth/creation-labs')({
  beforeLoad: async () => {
    await requireAuthenticatedSession()
    throw redirect({ to: ROUTE_PATHS.creationLab })
  },
})
