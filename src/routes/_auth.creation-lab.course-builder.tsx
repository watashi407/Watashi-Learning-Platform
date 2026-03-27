import { createFileRoute } from '@tanstack/react-router'
import { CourseBuilderPage } from '../modules/creation-lab/presentation/creation-lab-pages'

export const Route = createFileRoute('/_auth/creation-lab/course-builder')({
  component: CreationLabCourseBuilderRoute,
})

function CreationLabCourseBuilderRoute() {
  return <CourseBuilderPage />
}
