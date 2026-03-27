import { createFileRoute } from '@tanstack/react-router'
import { FocusPage } from '../features/dashboard/pages/focus-page'
import { createProtectedAppPageOptions } from '../features/dashboard/route-options'

export const Route = createFileRoute('/_auth/focus')({
  ...createProtectedAppPageOptions('focus'),
  component: FocusRoute,
})

function FocusRoute() {
  return <FocusPage />
}
