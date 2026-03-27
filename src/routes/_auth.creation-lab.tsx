import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { createProtectedAppPageOptions } from '../features/dashboard/route-options'
import { CreationLabHubPage } from '../modules/creation-lab/presentation/creation-lab-pages'
import { ROUTE_PATHS } from '../shared/routing/paths'

export const Route = createFileRoute('/_auth/creation-lab')({
  ...createProtectedAppPageOptions('creationLab'),
  component: CreationLabRoute,
})

function CreationLabRoute() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  if (pathname === ROUTE_PATHS.creationLab) {
    return <CreationLabHubPage />
  }

  return <Outlet />
}
