import { createFileRoute } from '@tanstack/react-router'
import { CourseBuilderPage } from '../modules/creation-lab/presentation/course-builder-page'

export const Route = createFileRoute('/_auth/creation-lab/course-builder')({
  component: CreationLabCourseBuilderRoute,
})

function CreationLabCourseBuilderRoute() {
  return <CourseBuilderPage />
}
