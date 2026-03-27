import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '../features/dashboard/pages/profile-page'
import { createProtectedAppPageOptions } from '../features/dashboard/route-options'

export const Route = createFileRoute('/_auth/profile')({
  ...createProtectedAppPageOptions('profile'),
  component: ProfileRoute,
})

function ProfileRoute() {
  return <ProfilePage />
}
