import { createFileRoute } from '@tanstack/react-router'
import { createProtectedAppPageOptions } from '../features/dashboard/route-options'
import { CoursesPage } from '../modules/courses/presentation/courses-page'

export const Route = createFileRoute('/_auth/courses')({
  ...createProtectedAppPageOptions('courses'),
  component: CoursesRoute,
})

function CoursesRoute() {
  return <CoursesPage />
}
