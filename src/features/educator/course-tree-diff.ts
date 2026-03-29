import { randomUUID } from 'node:crypto'
import type { CourseModuleInput } from '../../shared/contracts/educator'

type ExistingModuleRef = {
  id: string
}

type ExistingLessonRef = {
  id: string
  module_id: string
}

type NormalizedModuleRow = {
  id: string
  course_id: string
  position: number
  title: string
  detail: string
  updated_at: string
}

type NormalizedLessonRow = {
  id: string
  module_id: string
  title: string
  content: string
  lesson_type: 'lesson' | 'video' | 'quiz' | 'resource'
  video_project_id: string | null
  certificate_template_id: string | null
  position: number
  duration_seconds: number
  status: 'draft' | 'published' | 'archived'
  metadata_json: Record<string, unknown>
  updated_at: string
}

export type CourseTreeDiff = {
  normalizedModules: NormalizedModuleRow[]
  lessonRows: NormalizedLessonRow[]
  staleModuleIds: string[]
  staleLessonIds: string[]
}

export function buildCourseTreeDiff(args: {
  courseId: string
  modules: CourseModuleInput[]
  existingModules: ExistingModuleRef[]
  existingLessons: ExistingLessonRef[]
  now: string
}): CourseTreeDiff {
  const normalizedModules = args.modules
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((module, moduleIndex) => ({
      id: module.id ?? randomUUID(),
      course_id: args.courseId,
      position: moduleIndex,
      title: module.title,
      detail: module.detail,
      updated_at: args.now,
    }))

  const keptModuleIds = new Set(normalizedModules.map((module) => module.id))
  const staleModuleIds = args.existingModules
    .map((module) => module.id)
    .filter((moduleId) => !keptModuleIds.has(moduleId))

  const lessonRows = args.modules.flatMap((module, moduleIndex) =>
    module.lessons
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((lesson, lessonIndex) => ({
        id: lesson.id ?? randomUUID(),
        module_id: normalizedModules[moduleIndex]!.id,
        title: lesson.title,
        content: lesson.content,
        lesson_type: lesson.lessonType,
        video_project_id: lesson.videoProjectId,
        certificate_template_id: lesson.certificateTemplateId,
        position: lessonIndex,
        duration_seconds: lesson.durationSeconds,
        status: lesson.status,
        metadata_json: lesson.metadata,
        updated_at: args.now,
      })),
  )

  const incomingLessonIds = new Set(lessonRows.map((lesson) => lesson.id))
  const staleLessonIds = args.existingLessons
    .filter((lesson) => keptModuleIds.has(lesson.module_id))
    .map((lesson) => lesson.id)
    .filter((lessonId) => !incomingLessonIds.has(lessonId))

  return {
    normalizedModules,
    lessonRows,
    staleModuleIds,
    staleLessonIds,
  }
}
