import { createFileRoute } from '@tanstack/react-router'
import { createProtectedAppPageOptions } from '../features/dashboard/route-options'
import { DashboardHomePage } from '../modules/dashboard/presentation/dashboard-home-page'

export const Route = createFileRoute('/_auth/dashboard')({
  ...createProtectedAppPageOptions('dashboard'),
  component: DashboardIndexRoute,
})

function DashboardIndexRoute() {
  return <DashboardHomePage />
}
