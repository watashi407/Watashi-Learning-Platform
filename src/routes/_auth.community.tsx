import { createFileRoute } from '@tanstack/react-router'
import { createProtectedAppPageOptions } from '../features/dashboard/route-options'
import { CommunityPage } from '../modules/community/presentation/community-page'

export const Route = createFileRoute('/_auth/community')({
  ...createProtectedAppPageOptions('community'),
  component: CommunityRoute,
})

function CommunityRoute() {
  return <CommunityPage />
}
