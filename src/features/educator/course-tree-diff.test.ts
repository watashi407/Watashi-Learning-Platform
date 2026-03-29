import { describe, expect, it } from 'vitest'
import { buildCourseTreeDiff } from './course-tree-diff'

describe('buildCourseTreeDiff', () => {
  it('preserves existing ids and only marks removed modules and lessons as stale', () => {
    const diff = buildCourseTreeDiff({
      courseId: 'course-1',
      now: '2026-03-28T00:00:00.000Z',
      existingModules: [{ id: 'module-a' }, { id: 'module-b' }],
      existingLessons: [
        { id: 'lesson-a1', module_id: 'module-a' },
        { id: 'lesson-b1', module_id: 'module-b' },
      ],
      modules: [
        {
          id: 'module-a',
          title: 'Module A',
          detail: 'A',
          position: 5,
          lessons: [
            {
              id: 'lesson-a1',
              title: 'Lesson A1',
              content: 'Keep',
              lessonType: 'lesson',
              videoProjectId: null,
              certificateTemplateId: null,
              position: 9,
              durationSeconds: 60,
              status: 'draft',
              metadata: {},
            },
          ],
        },
      ],
    })

    expect(diff.normalizedModules).toHaveLength(1)
    expect(diff.normalizedModules[0]).toMatchObject({
      id: 'module-a',
      position: 0,
    })
    expect(diff.lessonRows[0]).toMatchObject({
      id: 'lesson-a1',
      module_id: 'module-a',
      position: 0,
    })
    expect(diff.staleModuleIds).toEqual(['module-b'])
    expect(diff.staleLessonIds).toEqual([])
  })

  it('marks replaced lessons in kept modules as stale before upsert', () => {
    const diff = buildCourseTreeDiff({
      courseId: 'course-1',
      now: '2026-03-28T00:00:00.000Z',
      existingModules: [{ id: 'module-a' }],
      existingLessons: [
        { id: 'lesson-old', module_id: 'module-a' },
      ],
      modules: [
        {
          id: 'module-a',
          title: 'Module A',
          detail: 'A',
          position: 0,
          lessons: [
            {
              title: 'Replacement',
              content: 'New',
              lessonType: 'video',
              videoProjectId: 'video-1',
              certificateTemplateId: null,
              position: 0,
              durationSeconds: 120,
              status: 'draft',
              metadata: {},
            },
          ],
        },
      ],
    })

    expect(diff.staleModuleIds).toEqual([])
    expect(diff.staleLessonIds).toEqual(['lesson-old'])
    expect(diff.lessonRows).toHaveLength(1)
    expect(diff.lessonRows[0]?.id).not.toBe('lesson-old')
    expect(diff.lessonRows[0]).toMatchObject({
      module_id: 'module-a',
      position: 0,
      lesson_type: 'video',
    })
  })
})
