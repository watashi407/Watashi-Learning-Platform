import { createFileRoute } from '@tanstack/react-router'
import { RouteErrorFallback } from '../app/errors/route-error-fallback'
import { AppShell } from '../features/dashboard/app-shell'
import { requireAuthenticatedSession } from '../features/dashboard/guards'

export const Route = createFileRoute('/_auth')({
  loader: async () => requireAuthenticatedSession(),
  component: AppRoute,
  errorComponent: RouteErrorFallback,
})

function AppRoute() {
  const user = Route.useLoaderData()
  return <AppShell user={user} />
}
