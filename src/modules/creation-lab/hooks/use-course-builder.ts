import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  CertificateTemplateRecord,
  CourseListItem,
  CourseLessonInput,
  CourseModuleInput,
  CourseStatus,
  CourseTree,
} from '../../../shared/contracts/educator'
import type { VideoProjectListItem } from '../../../shared/contracts/educator'
import {
  createCourseClient,
  deleteCourseClient,
  getCourseClient,
  listCertificateTemplatesClient,
  listCoursesClient,
  saveCourseTreeClient,
} from '../../../features/educator/client'
import { listVideoProjectsClient } from '../../../modules/video-creation/client'
import { getDisplayErrorMessage } from '../../../shared/errors'

const AUTOSAVE_DEBOUNCE_MS = 1000

function createEmptyLesson(_moduleId: string, position: number): CourseLessonInput {
  return {
    title: 'New Lesson',
    content: '',
    lessonType: 'lesson',
    videoProjectId: null,
    certificateTemplateId: null,
    position,
    durationSeconds: 0,
    status: 'draft',
    metadata: {},
  }
}

function createEmptyModule(position: number): CourseModuleInput {
  return {
    title: 'New Module',
    detail: '',
    position,
    lessons: [],
  }
}

export function useCourseBuilder() {
  const [courses, setCourses] = useState<CourseListItem[]>([])
  const [courseTree, setCourseTree] = useState<CourseTree | null>(null)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [videoProjects, setVideoProjects] = useState<VideoProjectListItem[]>([])
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplateRecord[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lastSavedSnapshotRef = useRef<string>('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHydratedRef = useRef(false)

  // ── Bootstrap ──
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setIsLoading(true)
      try {
        const [courseList, videoList, templateList] = await Promise.all([
          listCoursesClient(),
          listVideoProjectsClient().catch(() => [] as VideoProjectListItem[]),
          listCertificateTemplatesClient().catch(() => [] as CertificateTemplateRecord[]),
        ])

        if (cancelled) return
        setCourses(courseList)
        setVideoProjects(videoList)
        setCertificateTemplates(templateList)
        setError(null)

        if (courseList.length > 0) {
          const first = courseList[0]
          const tree = await getCourseClient(first.id)
          if (!cancelled) {
            loadTreeIntoState(tree)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getDisplayErrorMessage(err, 'Could not load course data.'))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void bootstrap()
    return () => { cancelled = true }
  }, [])

  function loadTreeIntoState(tree: CourseTree) {
    setCourseTree(tree)
    const firstModule = tree.modules[0]
    setActiveModuleId(firstModule?.id ?? null)
    setActiveLessonId(firstModule?.lessons[0]?.id ?? null)
    lastSavedSnapshotRef.current = buildSnapshot(tree)
    isHydratedRef.current = true
  }

  function buildSnapshot(tree: CourseTree): string {
    return JSON.stringify({
      title: tree.course.title,
      description: tree.course.description,
      status: tree.course.status,
      defaultCertificateTemplateId: tree.course.defaultCertificateTemplateId,
      modules: tree.modules.map((m) => ({
        id: m.id,
        title: m.title,
        detail: m.detail,
        position: m.position,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          content: l.content,
          lessonType: l.lessonType,
          videoProjectId: l.videoProjectId,
          certificateTemplateId: l.certificateTemplateId,
          position: l.position,
          durationSeconds: l.durationSeconds,
          status: l.status,
          metadata: l.metadata,
        })),
      })),
    })
  }

  // ── Autosave ──
  const currentSnapshot = courseTree ? buildSnapshot(courseTree) : ''

  useEffect(() => {
    if (!isHydratedRef.current || !courseTree) return
    if (currentSnapshot === lastSavedSnapshotRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void save()
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [currentSnapshot])

  async function save() {
    if (!courseTree) return

    const payload = {
      courseId: courseTree.course.id,
      title: courseTree.course.title,
      description: courseTree.course.description,
      status: courseTree.course.status,
      defaultCertificateTemplateId: courseTree.course.defaultCertificateTemplateId,
      modules: courseTree.modules.map((m) => ({
        id: m.id,
        title: m.title,
        detail: m.detail,
        position: m.position,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          content: l.content,
          lessonType: l.lessonType,
          videoProjectId: l.videoProjectId,
          certificateTemplateId: l.certificateTemplateId,
          position: l.position,
          durationSeconds: l.durationSeconds,
          status: l.status,
          metadata: l.metadata,
        })),
      })),
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const updated = await saveCourseTreeClient(payload)
      setCourseTree(updated)
      lastSavedSnapshotRef.current = buildSnapshot(updated)
      setCourses((prev) => prev.map((c) =>
        c.id === updated.course.id
          ? { ...c, title: updated.course.title, description: updated.course.description, status: updated.course.status, moduleCount: updated.modules.length, lessonCount: updated.modules.reduce((sum, m) => sum + m.lessons.length, 0), updatedAt: updated.course.updatedAt }
          : c,
      ))
    } catch (err) {
      setSaveError(getDisplayErrorMessage(err, 'Could not save course.'))
    } finally {
      setIsSaving(false)
    }
  }

  // ── Course Actions ──
  const createNewCourse = useCallback(async (title: string) => {
    try {
      const tree = await createCourseClient({ title, description: '' })
      setCourses((prev) => [{
        id: tree.course.id,
        title: tree.course.title,
        description: tree.course.description,
        status: tree.course.status,
        moduleCount: 0,
        lessonCount: 0,
        updatedAt: tree.course.updatedAt,
      }, ...prev])
      loadTreeIntoState(tree)
    } catch (err) {
      setSaveError(getDisplayErrorMessage(err, 'Could not create course.'))
    }
  }, [])

  const selectCourse = useCallback(async (courseId: string) => {
    try {
      const tree = await getCourseClient(courseId)
      loadTreeIntoState(tree)
    } catch (err) {
      setSaveError(getDisplayErrorMessage(err, 'Could not load course.'))
    }
  }, [])

  const deleteCourse = useCallback(async (courseId: string) => {
    try {
      await deleteCourseClient(courseId)
      setCourses((prev) => prev.filter((c) => c.id !== courseId))
      if (courseTree?.course.id === courseId) {
        setCourseTree(null)
        setActiveModuleId(null)
        setActiveLessonId(null)
        isHydratedRef.current = false
      }
    } catch (err) {
      setSaveError(getDisplayErrorMessage(err, 'Could not delete course.'))
    }
  }, [courseTree?.course.id])

  const updateCourseTitle = useCallback((title: string) => {
    setCourseTree((prev) => prev ? { ...prev, course: { ...prev.course, title } } : null)
  }, [])

  const updateCourseDescription = useCallback((description: string) => {
    setCourseTree((prev) => prev ? { ...prev, course: { ...prev.course, description } } : null)
  }, [])

  const setDefaultCertificateTemplate = useCallback((templateId: string | null) => {
    setCourseTree((prev) => prev ? { ...prev, course: { ...prev.course, defaultCertificateTemplateId: templateId } } : null)
  }, [])

  const publishCourse = useCallback(async () => {
    if (!courseTree) return
    setCourseTree((prev) => prev ? { ...prev, course: { ...prev.course, status: 'published' as CourseStatus } } : null)
  }, [courseTree])

  const archiveCourse = useCallback(async () => {
    if (!courseTree) return
    setCourseTree((prev) => prev ? { ...prev, course: { ...prev.course, status: 'archived' as CourseStatus } } : null)
  }, [courseTree])

  // ── Module Actions ──
  const addModule = useCallback(() => {
    setCourseTree((prev) => {
      if (!prev) return null
      const position = prev.modules.length
      const newModule = {
        ...createEmptyModule(position),
        id: crypto.randomUUID(),
        lessons: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return { ...prev, modules: [...prev.modules, newModule] }
    })
  }, [])

  const removeModule = useCallback((moduleId: string) => {
    setCourseTree((prev) => {
      if (!prev) return null
      const filtered = prev.modules
        .filter((m) => m.id !== moduleId)
        .map((m, i) => ({ ...m, position: i }))
      return { ...prev, modules: filtered }
    })
    if (activeModuleId === moduleId) {
      setActiveModuleId(null)
      setActiveLessonId(null)
    }
  }, [activeModuleId])

  const updateModuleTitle = useCallback((moduleId: string, title: string) => {
    setCourseTree((prev) => {
      if (!prev) return null
      return { ...prev, modules: prev.modules.map((m) => m.id === moduleId ? { ...m, title } : m) }
    })
  }, [])

  const updateModuleDetail = useCallback((moduleId: string, detail: string) => {
    setCourseTree((prev) => {
      if (!prev) return null
      return { ...prev, modules: prev.modules.map((m) => m.id === moduleId ? { ...m, detail } : m) }
    })
  }, [])

  const reorderModules = useCallback((fromIndex: number, toIndex: number) => {
    setCourseTree((prev) => {
      if (!prev) return null
      const modules = [...prev.modules]
      const [moved] = modules.splice(fromIndex, 1)
      modules.splice(toIndex, 0, moved)
      return { ...prev, modules: modules.map((m, i) => ({ ...m, position: i })) }
    })
  }, [])

  // ── Lesson Actions ──
  const addLesson = useCallback((moduleId: string) => {
    setCourseTree((prev) => {
      if (!prev) return null
      return {
        ...prev,
        modules: prev.modules.map((m) => {
          if (m.id !== moduleId) return m
          const position = m.lessons.length
          const newLesson = {
            ...createEmptyLesson(moduleId, position),
            id: crypto.randomUUID(),
            moduleId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          return { ...m, lessons: [...m.lessons, newLesson] }
        }),
      }
    })
  }, [])

  const removeLesson = useCallback((moduleId: string, lessonId: string) => {
    setCourseTree((prev) => {
      if (!prev) return null
      return {
        ...prev,
        modules: prev.modules.map((m) => {
          if (m.id !== moduleId) return m
          return {
            ...m,
            lessons: m.lessons
              .filter((l) => l.id !== lessonId)
              .map((l, i) => ({ ...l, position: i })),
          }
        }),
      }
    })
    if (activeLessonId === lessonId) {
      setActiveLessonId(null)
    }
  }, [activeLessonId])

  const updateLesson = useCallback((lessonId: string, patch: Partial<CourseLessonInput>) => {
    setCourseTree((prev) => {
      if (!prev) return null
      return {
        ...prev,
        modules: prev.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, ...patch } : l),
        })),
      }
    })
  }, [])

  const reorderLessons = useCallback((moduleId: string, fromIndex: number, toIndex: number) => {
    setCourseTree((prev) => {
      if (!prev) return null
      return {
        ...prev,
        modules: prev.modules.map((m) => {
          if (m.id !== moduleId) return m
          const lessons = [...m.lessons]
          const [moved] = lessons.splice(fromIndex, 1)
          lessons.splice(toIndex, 0, moved)
          return { ...m, lessons: lessons.map((l, i) => ({ ...l, position: i })) }
        }),
      }
    })
  }, [])

  // ── Linking ──
  const linkVideoToLesson = useCallback((lessonId: string, videoProjectId: string | null) => {
    updateLesson(lessonId, { videoProjectId })
  }, [updateLesson])

  const linkCertificateToLesson = useCallback((lessonId: string, certificateTemplateId: string | null) => {
    updateLesson(lessonId, { certificateTemplateId })
  }, [updateLesson])

  // ── Derived State ──
  const activeModule = courseTree?.modules.find((m) => m.id === activeModuleId) ?? null
  const activeLesson = activeModule?.lessons.find((l) => l.id === activeLessonId) ?? null

  return {
    // Data
    courses,
    courseTree,
    activeModule,
    activeLesson,
    activeModuleId,
    activeLessonId,
    videoProjects,
    certificateTemplates,

    // State
    isLoading,
    isSaving,
    saveError,
    error,

    // Navigation
    setActiveModuleId,
    setActiveLessonId,

    // Course actions
    createNewCourse,
    selectCourse,
    deleteCourse,
    updateCourseTitle,
    updateCourseDescription,
    setDefaultCertificateTemplate,
    publishCourse,
    archiveCourse,

    // Module actions
    addModule,
    removeModule,
    updateModuleTitle,
    updateModuleDetail,
    reorderModules,

    // Lesson actions
    addLesson,
    removeLesson,
    updateLesson,
    reorderLessons,
    linkVideoToLesson,
    linkCertificateToLesson,

    // Manual save
    save,
  }
}
