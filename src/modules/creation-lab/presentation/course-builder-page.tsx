import { useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  GripVertical,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react'
import { WorkspaceEyebrow, WorkspacePanel, cx } from '../../../shared/ui/workspace'
import { SaveStatusIndicator } from '../../../shared/ui/save-status-indicator'
import { useCourseBuilder } from '../hooks/use-course-builder'
import type { CourseLessonType } from '../../../shared/contracts/educator'
import { resolveCourseOutline } from '../../../features/ai-jobs/client'
import { getDisplayErrorMessage } from '../../../shared/errors'

// ── Helpers ──

const LESSON_TYPE_CONFIG: Record<CourseLessonType, { label: string; icon: typeof FileText; activeBg: string; activeText: string; softBg: string; softText: string }> = {
  lesson: {
    label: 'Lesson',
    icon: FileText,
    activeBg: 'bg-[var(--color-watashi-indigo)]',
    activeText: 'text-white',
    softBg: 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_12%,var(--color-watashi-surface-low))]',
    softText: 'text-[var(--color-watashi-indigo)]',
  },
  video: {
    label: 'Video',
    icon: Video,
    activeBg: 'bg-[var(--color-watashi-emerald)]',
    activeText: 'text-white',
    softBg: 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_14%,var(--color-watashi-surface-low))]',
    softText: 'text-[var(--color-watashi-emerald)]',
  },
  quiz: {
    label: 'Quiz',
    icon: Sparkles,
    activeBg: 'bg-[#d97706]',
    activeText: 'text-white',
    softBg: 'bg-[color-mix(in_oklab,#d97706_12%,var(--color-watashi-surface-card))]',
    softText: 'text-[#d97706]',
  },
  resource: {
    label: 'Resource',
    icon: BookOpen,
    activeBg: 'bg-[var(--color-watashi-text)]',
    activeText: 'text-white',
    softBg: 'bg-[var(--color-watashi-surface-high)]',
    softText: 'text-[var(--color-watashi-text)]',
  },
}

function statusBadge(status: string) {
  switch (status) {
    case 'published': return 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_14%,transparent)] text-[var(--color-watashi-emerald)]'
    case 'archived': return 'bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text-soft)]'
    default: return 'bg-[color-mix(in_oklab,#d97706_12%,var(--color-watashi-surface-card))] text-[#d97706]'
  }
}

// ── Sub-components ──

function EmptyWelcomeState({ onStartCreating }: { onStartCreating: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.75rem] bg-[var(--color-watashi-surface-card)] px-8 py-20 text-center shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Illustration-like icon cluster */}
      <div className="relative mb-8 flex items-center justify-center">
        <div className="h-24 w-24 rounded-[2rem] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-watashi-indigo)_18%,var(--color-watashi-surface-low)),color-mix(in_oklab,var(--color-watashi-emerald)_12%,var(--color-watashi-surface-low)))]" />
        <div className="absolute flex h-24 w-24 items-center justify-center">
          <Layers className="h-10 w-10 text-[var(--color-watashi-indigo)]" style={{ opacity: 0.85 }} />
        </div>
        {/* Orbiting dots */}
        <div className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-[color-mix(in_oklab,var(--color-watashi-indigo)_22%,var(--color-watashi-surface-card))] ring-2 ring-[var(--color-watashi-surface-card)]" />
        <div className="absolute -bottom-1 -left-3 h-4 w-4 rounded-full bg-[color-mix(in_oklab,var(--color-watashi-emerald)_22%,var(--color-watashi-surface-card))] ring-2 ring-[var(--color-watashi-surface-card)]" />
      </div>

      <h2 className="font-display text-2xl font-black tracking-tight text-[var(--color-watashi-text-strong)]">
        Your workspace is ready
      </h2>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--color-watashi-text-soft)]">
        Create your first course to start building structured learning experiences with modules, lessons, and more.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onStartCreating}
          className="inline-flex items-center gap-2.5 rounded-full bg-[var(--color-watashi-indigo)] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(75,65,225,0.45)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_16px_32px_-10px_rgba(75,65,225,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          Create Your First Course
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-watashi-text-soft)]">
          or use the AI assistant below
        </p>
      </div>
    </div>
  )
}



// ── Main Page ──

export function CourseBuilderPage() {
  const builder = useCourseBuilder()
  const [isCreating, setIsCreating] = useState(false)
  const [newCourseTitle, setNewCourseTitle] = useState('')
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set())
  const [showCourseSelector, setShowCourseSelector] = useState(false)

  // AI assistant state
  const [assistantPrompt, setAssistantPrompt] = useState('')
  const [isRunningPrompt, setIsRunningPrompt] = useState(false)
  const [assistantError, setAssistantError] = useState<string | null>(null)

  const toggleModuleCollapse = (moduleId: string) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  async function handleCreateCourse() {
    const title = newCourseTitle.trim()
    if (!title) return
    setIsCreating(false)
    setNewCourseTitle('')
    await builder.createNewCourse(title)
  }

  async function runAiCourseGeneration() {
    const prompt = assistantPrompt.trim()
    if (!prompt) return

    setIsRunningPrompt(true)
    setAssistantError(null)

    try {
      const outline = await resolveCourseOutline({ topic: prompt })

      // Create the course with the AI-generated title
      await builder.createNewCourse(outline.title)

      // Add modules for each AI outline entry and immediately set their titles.
      // We call addModule() once per module, then rely on the snapshot from the
      // hook's state to walk the newly added modules in order and rename them.
      for (const mod of outline.modules) {
        builder.addModule()
        // Give React a tick to flush the state update so the new module id is stable
        await new Promise<void>((resolve) => setTimeout(resolve, 0))

        // After each addModule() flush the tree snapshot to find the latest module
        // (the one with title "New Module" at the highest position).
        const currentModules = builder.courseTree?.modules ?? []
        const lastModule = currentModules[currentModules.length - 1]
        if (lastModule) {
          builder.updateModuleTitle(lastModule.id, mod.name)
          if (mod.detail) {
            builder.updateModuleDetail(lastModule.id, mod.detail)
          }
        }
      }

      setAssistantPrompt('')
    } catch (err) {
      setAssistantError(getDisplayErrorMessage(err, 'Could not generate course outline.'))
    } finally {
      setIsRunningPrompt(false)
    }
  }

  // ── Loading ──
  if (builder.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-[color-mix(in_oklab,var(--color-watashi-indigo)_12%,var(--color-watashi-surface-card))]">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--color-watashi-indigo)]" />
          </div>
          <p className="text-sm font-bold text-[var(--color-watashi-text-soft)]">Loading course builder…</p>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (builder.error && !builder.courseTree && builder.courses.length === 0) {
    return (
      <WorkspacePanel className="mx-auto mt-12 flex max-w-lg flex-col items-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-[color-mix(in_oklab,var(--color-watashi-ember)_10%,var(--color-watashi-surface-card))]">
          <AlertCircle className="h-7 w-7 text-[var(--color-watashi-ember)]" />
        </div>
        <p className="mt-5 text-base font-bold text-[var(--color-watashi-text-strong)]">{builder.error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-indigo)] px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </WorkspacePanel>
    )
  }

  const course = builder.courseTree?.course
  const modules = builder.courseTree?.modules ?? []
  const activeLesson = builder.activeLesson
  const activeModule = builder.activeModule

  return (
    <div className="space-y-6">

      {/* ── Gradient Header Bar ── */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(120deg,color-mix(in_oklab,var(--color-watashi-indigo)_9%,var(--color-watashi-surface-card)),var(--color-watashi-surface-card)_55%,color-mix(in_oklab,var(--color-watashi-emerald)_7%,var(--color-watashi-surface-card)))] px-6 py-5 shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)]">
        {/* Subtle background blobs */}
        <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-[color-mix(in_oklab,var(--color-watashi-indigo)_7%,transparent)] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 right-12 h-24 w-24 rounded-full bg-[color-mix(in_oklab,var(--color-watashi-emerald)_7%,transparent)] blur-2xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-black tracking-tight text-[var(--color-watashi-text-strong)]">
              Course Builder
            </h1>
            {course && (
              <span className={cx('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]', statusBadge(course.status))}>
                {course.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {course && (
              <SaveStatusIndicator isSaving={builder.isSaving} saveError={builder.saveError} />
            )}
            {course?.status === 'draft' && (
              <button
                type="button"
                onClick={() => void builder.publishCourse()}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-indigo)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_-10px_rgba(75,65,225,0.5)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_14px_32px_-8px_rgba(75,65,225,0.6)] active:scale-[0.97]"
              >
                <Send className="h-4 w-4" />
                Publish
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3-Column Layout ── */}
      <div className="grid min-h-[calc(100vh-14rem)] gap-5 xl:grid-cols-[288px_minmax(0,1fr)_272px]">

        {/* ── Left: Curriculum Sidebar ── */}
        <div className="flex flex-col gap-4">

          {/* Course Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCourseSelector(!showCourseSelector)}
              className={cx(
                'flex w-full items-center justify-between rounded-[1.4rem] bg-[var(--color-watashi-surface-card)] px-4 py-4 text-left shadow-[var(--shadow-watashi-panel)] ring-1 transition-all duration-200',
                showCourseSelector
                  ? 'ring-[color-mix(in_oklab,var(--color-watashi-indigo)_40%,var(--color-watashi-border))]'
                  : 'ring-[var(--color-watashi-border)] hover:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_24%,var(--color-watashi-border))]',
              )}
            >
              <div className="min-w-0 flex-1">
                <WorkspaceEyebrow>Active Course</WorkspaceEyebrow>
                <p className="mt-1 truncate text-sm font-bold text-[var(--color-watashi-text-strong)]">
                  {course?.title ?? 'No course selected'}
                </p>
              </div>
              <ChevronDown className={cx(
                'h-4 w-4 shrink-0 text-[var(--color-watashi-text-soft)] transition-transform duration-200',
                showCourseSelector && 'rotate-180',
              )} />
            </button>

            {showCourseSelector && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-auto rounded-[1.4rem] bg-[var(--color-watashi-surface-card)] p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] ring-1 ring-[var(--color-watashi-border)]">
                {builder.courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { void builder.selectCourse(c.id); setShowCourseSelector(false) }}
                    className={cx(
                      'block w-full rounded-xl px-3 py-2.5 text-left transition-colors duration-150',
                      c.id === course?.id
                        ? 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,var(--color-watashi-surface-low))]'
                        : 'hover:bg-[var(--color-watashi-surface-low)]',
                    )}
                  >
                    <p className="truncate text-sm font-semibold text-[var(--color-watashi-text-strong)]">{c.title}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-watashi-text-soft)]">
                      {c.moduleCount} modules &middot; {c.lessonCount} lessons
                    </p>
                  </button>
                ))}

                <div className="mt-1 border-t border-[var(--color-watashi-border)] pt-1">
                  {isCreating ? (
                    <div className="flex gap-2 px-3 py-2">
                      <input
                        type="text"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && void handleCreateCourse()}
                        placeholder="Course title…"
                        autoFocus
                        className="min-w-0 flex-1 rounded-lg bg-[var(--color-watashi-surface-low)] px-3 py-1.5 text-sm text-[var(--color-watashi-text-strong)] outline-none ring-1 ring-[var(--color-watashi-border)] transition-colors focus:ring-[var(--color-watashi-indigo)]"
                      />
                      <button
                        type="button"
                        onClick={() => void handleCreateCourse()}
                        className="rounded-lg bg-[var(--color-watashi-indigo)] px-3 py-1.5 text-xs font-bold text-white transition-all hover:brightness-110"
                      >
                        Create
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCreating(true)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--color-watashi-indigo)] transition-colors hover:bg-[var(--color-watashi-surface-low)]"
                    >
                      <Plus className="h-4 w-4" />
                      New Course
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Module / Lesson Navigation Tree */}
          {course && (
            <div className="space-y-1.5">
              {modules.map((mod, modIdx) => {
                const isCollapsed = collapsedModules.has(mod.id)
                const isActiveModule = mod.id === builder.activeModuleId

                return (
                  <div
                    key={mod.id}
                    className={cx(
                      'group rounded-[1.3rem] transition-all duration-200',
                      isActiveModule
                        ? 'bg-[var(--color-watashi-surface-card)] shadow-[var(--shadow-watashi-panel)] ring-1 ring-[color-mix(in_oklab,var(--color-watashi-indigo)_28%,var(--color-watashi-border))]'
                        : 'bg-[var(--color-watashi-surface-low)] ring-1 ring-transparent hover:ring-[var(--color-watashi-border)]',
                    )}
                  >
                    {/* Module row */}
                    <div className="flex items-center gap-1.5 px-2.5 py-2.5">
                      <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-[var(--color-watashi-text-soft)] opacity-0 transition-opacity duration-150 group-hover:opacity-60" />

                      <button
                        type="button"
                        onClick={() => toggleModuleCollapse(mod.id)}
                        className="shrink-0 rounded-md p-0.5 transition-colors hover:bg-[var(--color-watashi-surface-high)]"
                        aria-label={isCollapsed ? 'Expand module' : 'Collapse module'}
                      >
                        <ChevronRight className={cx(
                          'h-3.5 w-3.5 text-[var(--color-watashi-text-soft)] transition-transform duration-200',
                          !isCollapsed && 'rotate-90',
                        )} />
                      </button>

                      <button
                        type="button"
                        onClick={() => { builder.setActiveModuleId(mod.id); builder.setActiveLessonId(null) }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <WorkspaceEyebrow>Module {modIdx + 1}</WorkspaceEyebrow>
                        <p className="mt-0.5 truncate text-sm font-bold text-[var(--color-watashi-text-strong)]">
                          {mod.title}
                        </p>
                      </button>

                      {/* Delete module — revealed on group hover */}
                      <button
                        type="button"
                        onClick={() => builder.removeModule(mod.id)}
                        className="shrink-0 rounded-lg p-1.5 text-[var(--color-watashi-text-soft)] opacity-0 transition-all duration-150 hover:bg-[color-mix(in_oklab,var(--color-watashi-ember)_10%,var(--color-watashi-surface-card))] hover:text-[var(--color-watashi-ember)] group-hover:opacity-100"
                        title="Remove module"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Lesson tree — indented */}
                    {!isCollapsed && (
                      <div className="pb-2.5 pl-8 pr-2.5">
                        {/* Visual connector line */}
                        <div className="relative space-y-0.5">
                          <div className="absolute bottom-3 left-[-12px] top-2 w-px bg-[var(--color-watashi-border)]" />

                          {mod.lessons.map((lesson) => {
                            const typeConfig = LESSON_TYPE_CONFIG[lesson.lessonType]
                            const TypeIcon = typeConfig.icon
                            const isActiveLesson = lesson.id === builder.activeLessonId

                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                onClick={() => { builder.setActiveModuleId(mod.id); builder.setActiveLessonId(lesson.id) }}
                                className={cx(
                                  'relative flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all duration-150',
                                  isActiveLesson
                                    ? 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,var(--color-watashi-surface-card))] shadow-sm ring-1 ring-[color-mix(in_oklab,var(--color-watashi-indigo)_20%,var(--color-watashi-border))]'
                                    : 'hover:bg-[var(--color-watashi-surface-card)]',
                                )}
                              >
                                {/* Connector tick */}
                                <div className="absolute left-[-12px] top-1/2 h-px w-3 -translate-y-1/2 bg-[var(--color-watashi-border)]" />

                                <span className={cx(
                                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors duration-150',
                                  isActiveLesson ? typeConfig.activeBg : typeConfig.softBg,
                                )}>
                                  <TypeIcon className={cx('h-2.5 w-2.5', isActiveLesson ? typeConfig.activeText : typeConfig.softText)} />
                                </span>
                                <span className={cx(
                                  'min-w-0 flex-1 truncate text-xs font-medium leading-tight transition-colors duration-150',
                                  isActiveLesson ? 'text-[var(--color-watashi-indigo)]' : 'text-[var(--color-watashi-text)]',
                                )}>
                                  {lesson.title}
                                </span>
                              </button>
                            )
                          })}

                          <button
                            type="button"
                            onClick={() => builder.addLesson(mod.id)}
                            className="relative flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[var(--color-watashi-indigo)] transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--color-watashi-indigo)_6%,var(--color-watashi-surface-card))]"
                          >
                            <Plus className="h-3 w-3" />
                            Add Lesson
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <button
                type="button"
                onClick={builder.addModule}
                className="flex w-full items-center justify-center gap-2 rounded-[1.3rem] border-2 border-dashed border-[var(--color-watashi-border)] px-4 py-3 text-sm font-bold text-[var(--color-watashi-indigo)] transition-all duration-200 hover:border-[var(--color-watashi-indigo)] hover:bg-[color-mix(in_oklab,var(--color-watashi-indigo)_5%,var(--color-watashi-surface-card))] active:scale-[0.99]"
              >
                <Plus className="h-4 w-4" />
                Add Module
              </button>
            </div>
          )}

          {/* ── AI Assistant — Glass-morphism card ── */}
          <div className="relative mt-auto overflow-hidden rounded-[1.4rem] p-px shadow-[0_12px_36px_-12px_rgba(75,65,225,0.3)]">
            {/* Gradient border */}
            <div className="pointer-events-none absolute inset-0 rounded-[1.4rem] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-watashi-indigo)_60%,transparent),color-mix(in_oklab,var(--color-watashi-emerald)_40%,transparent))]" />

            <div className="relative rounded-[calc(1.4rem-1px)] bg-[linear-gradient(160deg,color-mix(in_oklab,var(--color-watashi-indigo)_82%,#1a1040),color-mix(in_oklab,var(--color-watashi-indigo)_70%,#1a1040))] p-4">
              {/* Glass shimmer */}
              <div className="pointer-events-none absolute inset-0 rounded-[calc(1.4rem-1px)] bg-[linear-gradient(135deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0)_60%)]" />

              <div className="relative">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <WorkspaceEyebrow className="text-white/60">AI Assistant</WorkspaceEyebrow>
                  </div>
                </div>

                <p className="mt-2.5 text-[13px] font-semibold leading-snug text-white/90">
                  Generate a full course outline
                </p>

                <textarea
                  value={assistantPrompt}
                  onChange={(e) => setAssistantPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      void runAiCourseGeneration()
                    }
                  }}
                  placeholder="e.g. Introduction to machine learning for beginners…"
                  rows={3}
                  className="mt-3 w-full resize-none rounded-xl bg-white/10 px-3 py-2.5 text-sm leading-relaxed text-white outline-none ring-1 ring-white/15 placeholder:text-white/40 focus:ring-white/30 transition-all duration-200"
                />

                <button
                  type="button"
                  onClick={() => void runAiCourseGeneration()}
                  disabled={isRunningPrompt || !assistantPrompt.trim()}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[var(--color-watashi-indigo)] shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-all duration-200 hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                >
                  {isRunningPrompt ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Course
                    </>
                  )}
                </button>

                {assistantError && (
                  <p className="mt-2.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-[color-mix(in_oklab,var(--color-watashi-ember)_60%,white)]">
                    {assistantError}
                  </p>
                )}

                <p className="mt-2 text-center text-[10px] font-semibold text-white/35">
                  ⌘ Enter to generate
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Center: Editor Panel ── */}
        {activeLesson ? (
          <WorkspacePanel className="flex flex-col gap-0 rounded-[1.75rem] p-0 overflow-hidden">
            {/* Editor top chrome */}
            <div className="border-b border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] px-8 py-4">
              <nav className="flex items-center gap-2 text-xs font-medium text-[var(--color-watashi-text-soft)]">
                <span className="transition-colors hover:text-[var(--color-watashi-text)]">{course?.title}</span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="transition-colors hover:text-[var(--color-watashi-text)]">{activeModule?.title}</span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="font-semibold text-[var(--color-watashi-text-strong)]">{activeLesson.title}</span>
              </nav>
            </div>

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
              {/* Lesson Title */}
              <input
                type="text"
                value={activeLesson.title}
                onChange={(e) => builder.updateLesson(activeLesson.id, { title: e.target.value })}
                className="w-full border-none bg-transparent font-display text-[clamp(1.7rem,3vw,2.5rem)] font-black leading-tight tracking-tight text-[var(--color-watashi-text-strong)] outline-none placeholder:text-[var(--color-watashi-text-soft)]"
                placeholder="Untitled Lesson"
              />

              {/* Lesson Type Chip Selector */}
              <div className="mt-5 flex flex-wrap gap-2">
                {(Object.entries(LESSON_TYPE_CONFIG) as [CourseLessonType, typeof LESSON_TYPE_CONFIG['lesson']][]).map(([type, config]) => {
                  const Icon = config.icon
                  const isActive = activeLesson.lessonType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => builder.updateLesson(activeLesson.id, { lessonType: type })}
                      className={cx(
                        'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200',
                        isActive
                          ? cx(
                              config.activeBg,
                              config.activeText,
                              'shadow-[0_4px_12px_-4px_rgba(0,0,0,0.25)] ring-2 ring-white/20',
                            )
                          : 'bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)] hover:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_30%,var(--color-watashi-border))] hover:text-[var(--color-watashi-text-strong)]',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {config.label}
                    </button>
                  )
                })}
              </div>

              {/* Video embed placeholder */}
              {activeLesson.lessonType === 'video' && (
                <div className="mt-8 overflow-hidden rounded-[1.4rem] bg-[var(--color-watashi-surface-low)] ring-1 ring-[var(--color-watashi-border)]">
                  <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,var(--color-watashi-surface-low),var(--color-watashi-surface-card))]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-[color-mix(in_oklab,var(--color-watashi-emerald)_14%,var(--color-watashi-surface-card))]">
                        <Video className="h-7 w-7 text-[var(--color-watashi-emerald)]" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-[var(--color-watashi-text-strong)]">
                          {activeLesson.videoProjectId ? 'Video linked' : 'No video linked yet'}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-watashi-text-soft)]">
                          Select a project from the properties panel
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content editor */}
              <div className="mt-8">
                <label className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-watashi-text-soft)]">
                  <FileText className="h-3.5 w-3.5" />
                  Content
                </label>
                <textarea
                  value={activeLesson.content}
                  onChange={(e) => builder.updateLesson(activeLesson.id, { content: e.target.value })}
                  placeholder="Write lesson content here…"
                  rows={14}
                  className="w-full resize-y rounded-[1.2rem] bg-[var(--color-watashi-surface-low)] px-5 py-4 text-sm leading-[1.85] text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-all duration-200 placeholder:text-[var(--color-watashi-text-soft)] focus:bg-[var(--color-watashi-surface-card)] focus:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_40%,var(--color-watashi-border))]"
                />
                <p className="mt-2 text-right text-xs text-[var(--color-watashi-text-soft)]">
                  {activeLesson.content.length.toLocaleString()} / 30,000
                </p>
              </div>
            </div>
          </WorkspacePanel>
        ) : activeModule ? (
          <WorkspacePanel className="flex flex-col gap-0 rounded-[1.75rem] p-0 overflow-hidden">
            {/* Module editor chrome */}
            <div className="border-b border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] px-8 py-4">
              <nav className="flex items-center gap-2 text-xs font-medium text-[var(--color-watashi-text-soft)]">
                <span>{course?.title}</span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="font-semibold text-[var(--color-watashi-text-strong)]">{activeModule.title}</span>
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8">
              <input
                type="text"
                value={activeModule.title}
                onChange={(e) => builder.updateModuleTitle(activeModule.id, e.target.value)}
                className="w-full border-none bg-transparent font-display text-[clamp(1.7rem,3vw,2.5rem)] font-black leading-tight tracking-tight text-[var(--color-watashi-text-strong)] outline-none placeholder:text-[var(--color-watashi-text-soft)]"
                placeholder="Module title…"
              />

              <div className="mt-8">
                <label className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-watashi-text-soft)]">
                  Module Description
                </label>
                <textarea
                  value={activeModule.detail}
                  onChange={(e) => builder.updateModuleDetail(activeModule.id, e.target.value)}
                  placeholder="Describe what this module covers…"
                  rows={5}
                  className="w-full resize-y rounded-[1.2rem] bg-[var(--color-watashi-surface-low)] px-5 py-4 text-sm leading-[1.85] text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-all duration-200 placeholder:text-[var(--color-watashi-text-soft)] focus:bg-[var(--color-watashi-surface-card)] focus:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_40%,var(--color-watashi-border))]"
                />
              </div>

              {/* Lessons list inside module view */}
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <WorkspaceEyebrow>Lessons ({activeModule.lessons.length})</WorkspaceEyebrow>
                </div>

                {activeModule.lessons.length === 0 ? (
                  <div className="rounded-[1.2rem] border-2 border-dashed border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] px-6 py-8 text-center">
                    <p className="text-sm font-semibold text-[var(--color-watashi-text-soft)]">No lessons yet</p>
                    <p className="mt-1 text-xs text-[var(--color-watashi-text-soft)]">Add the first lesson to this module below.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeModule.lessons.map((lesson) => {
                      const typeConfig = LESSON_TYPE_CONFIG[lesson.lessonType]
                      const TypeIcon = typeConfig.icon
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => builder.setActiveLessonId(lesson.id)}
                          className="group flex w-full items-center gap-3.5 rounded-[1.2rem] bg-[var(--color-watashi-surface-low)] px-4 py-3.5 text-left ring-1 ring-transparent transition-all duration-200 hover:bg-[var(--color-watashi-surface-card)] hover:ring-[var(--color-watashi-border)] hover:shadow-[var(--shadow-watashi-panel)]"
                        >
                          <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-150', typeConfig.softBg)}>
                            <TypeIcon className={cx('h-4 w-4', typeConfig.softText)} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[var(--color-watashi-text-strong)]">{lesson.title}</p>
                            <p className="mt-0.5 text-[11px] text-[var(--color-watashi-text-soft)]">{typeConfig.label}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-watashi-text-soft)] transition-transform duration-150 group-hover:translate-x-0.5" />
                        </button>
                      )
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => builder.addLesson(activeModule.id)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-[1.2rem] border-2 border-dashed border-[var(--color-watashi-border)] px-4 py-3 text-sm font-bold text-[var(--color-watashi-indigo)] transition-all duration-200 hover:border-[var(--color-watashi-indigo)] hover:bg-[color-mix(in_oklab,var(--color-watashi-indigo)_5%,var(--color-watashi-surface-card))]"
                >
                  <Plus className="h-4 w-4" />
                  Add Lesson
                </button>
              </div>
            </div>
          </WorkspacePanel>
        ) : course ? (
          /* Course overview / landing when no module/lesson is selected */
          <WorkspacePanel className="flex flex-col gap-0 rounded-[1.75rem] p-0 overflow-hidden">
            <div className="border-b border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] px-8 py-4">
              <WorkspaceEyebrow>Course Overview</WorkspaceEyebrow>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8">
              <input
                type="text"
                value={course.title}
                onChange={(e) => builder.updateCourseTitle(e.target.value)}
                className="w-full border-none bg-transparent font-display text-[clamp(1.7rem,3vw,2.5rem)] font-black leading-tight tracking-tight text-[var(--color-watashi-text-strong)] outline-none placeholder:text-[var(--color-watashi-text-soft)]"
                placeholder="Course title…"
              />

              <div className="mt-8">
                <label className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-watashi-text-soft)]">
                  Description
                </label>
                <textarea
                  value={course.description}
                  onChange={(e) => builder.updateCourseDescription(e.target.value)}
                  placeholder="Describe the course and what learners will achieve…"
                  rows={6}
                  className="w-full resize-y rounded-[1.2rem] bg-[var(--color-watashi-surface-low)] px-5 py-4 text-sm leading-[1.85] text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-all duration-200 placeholder:text-[var(--color-watashi-text-soft)] focus:bg-[var(--color-watashi-surface-card)] focus:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_40%,var(--color-watashi-border))]"
                />
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-[1.2rem] bg-[var(--color-watashi-surface-low)] px-5 py-4 ring-1 ring-[var(--color-watashi-border)]">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-watashi-text-soft)]">Modules</p>
                  <p className="mt-1.5 font-display text-3xl font-black text-[var(--color-watashi-text-strong)]">{modules.length}</p>
                </div>
                <div className="rounded-[1.2rem] bg-[var(--color-watashi-surface-low)] px-5 py-4 ring-1 ring-[var(--color-watashi-border)]">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-watashi-text-soft)]">Lessons</p>
                  <p className="mt-1.5 font-display text-3xl font-black text-[var(--color-watashi-text-strong)]">
                    {modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                  </p>
                </div>
              </div>

              {modules.length === 0 && (
                <div className="mt-8 rounded-[1.4rem] border-2 border-dashed border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] px-6 py-8 text-center">
                  <Layers className="mx-auto h-8 w-8 text-[var(--color-watashi-text-soft)]" />
                  <p className="mt-3 text-sm font-bold text-[var(--color-watashi-text-strong)]">No modules yet</p>
                  <p className="mt-1.5 text-xs text-[var(--color-watashi-text-soft)]">
                    Add your first module from the sidebar to structure your course.
                  </p>
                </div>
              )}
            </div>
          </WorkspacePanel>
        ) : (
          <EmptyWelcomeState onStartCreating={() => { setIsCreating(true); setShowCourseSelector(true) }} />
        )}

        {/* ── Right: Properties Panel ── */}
        <div className="flex flex-col gap-4">
          {activeLesson ? (
            <>
              {/* Lesson Properties card */}
              <div className="rounded-[1.75rem] bg-[var(--color-watashi-surface-card)] p-5 shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)]">
                <WorkspaceEyebrow>Lesson Properties</WorkspaceEyebrow>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Status</label>
                    <div className="relative">
                      <select
                        value={activeLesson.status}
                        onChange={(e) => builder.updateLesson(activeLesson.id, { status: e.target.value as 'draft' | 'published' | 'archived' })}
                        className="w-full appearance-none rounded-xl bg-[var(--color-watashi-surface-low)] px-4 py-2.5 pr-10 text-sm font-semibold text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-colors focus:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_40%,var(--color-watashi-border))]"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-watashi-text-soft)]" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Duration (seconds)</label>
                    <input
                      type="number"
                      min={0}
                      value={activeLesson.durationSeconds}
                      onChange={(e) => builder.updateLesson(activeLesson.id, { durationSeconds: Number(e.target.value) || 0 })}
                      className="w-full rounded-xl bg-[var(--color-watashi-surface-low)] px-4 py-2.5 text-sm text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-colors focus:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_40%,var(--color-watashi-border))]"
                    />
                  </div>
                </div>
              </div>

              {/* Video Binding card */}
              {activeLesson.lessonType === 'video' && (
                <div className="rounded-[1.75rem] bg-[var(--color-watashi-surface-card)] p-5 shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)]">
                  <WorkspaceEyebrow>Video Project</WorkspaceEyebrow>
                  <div className="relative mt-3">
                    <select
                      value={activeLesson.videoProjectId ?? ''}
                      onChange={(e) => builder.linkVideoToLesson(activeLesson.id, e.target.value || null)}
                      className="w-full appearance-none rounded-xl bg-[var(--color-watashi-surface-low)] px-4 py-2.5 pr-10 text-sm font-semibold text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-colors focus:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_40%,var(--color-watashi-border))]"
                    >
                      <option value="">None</option>
                      {builder.videoProjects.map((vp) => (
                        <option key={vp.id} value={vp.id}>{vp.title}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-watashi-text-soft)]" />
                  </div>
                </div>
              )}

              {/* Certificate Binding card */}
              <div className="rounded-[1.75rem] bg-[var(--color-watashi-surface-card)] p-5 shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)]">
                <WorkspaceEyebrow>Certificate</WorkspaceEyebrow>
                <div className="relative mt-3">
                  <select
                    value={activeLesson.certificateTemplateId ?? ''}
                    onChange={(e) => builder.linkCertificateToLesson(activeLesson.id, e.target.value || null)}
                    className="w-full appearance-none rounded-xl bg-[var(--color-watashi-surface-low)] px-4 py-2.5 pr-10 text-sm font-semibold text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-colors focus:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_40%,var(--color-watashi-border))]"
                  >
                    <option value="">None</option>
                    {builder.certificateTemplates.map((ct) => (
                      <option key={ct.id} value={ct.id}>{ct.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-watashi-text-soft)]" />
                </div>
              </div>

              {/* Delete Lesson */}
              <button
                type="button"
                onClick={() => {
                  if (builder.activeModuleId) {
                    builder.removeLesson(builder.activeModuleId, activeLesson.id)
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-[var(--color-watashi-surface-card)] px-4 py-3 text-sm font-semibold text-[var(--color-watashi-text-soft)] shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)] transition-all duration-200 hover:bg-[color-mix(in_oklab,var(--color-watashi-ember)_10%,var(--color-watashi-surface-card))] hover:text-[var(--color-watashi-ember)] hover:ring-[color-mix(in_oklab,var(--color-watashi-ember)_30%,var(--color-watashi-border))]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Lesson
              </button>
            </>
          ) : course ? (
            /* Course settings floating card */
            <div className="rounded-[1.75rem] bg-[var(--color-watashi-surface-card)] p-5 shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)]">
              <WorkspaceEyebrow>Course Settings</WorkspaceEyebrow>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Default Certificate</label>
                  <div className="relative">
                    <select
                      value={course.defaultCertificateTemplateId ?? ''}
                      onChange={(e) => builder.setDefaultCertificateTemplate(e.target.value || null)}
                      className="w-full appearance-none rounded-xl bg-[var(--color-watashi-surface-low)] px-4 py-2.5 pr-10 text-sm font-semibold text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-colors focus:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_40%,var(--color-watashi-border))]"
                    >
                      <option value="">None</option>
                      {builder.certificateTemplates.map((ct) => (
                        <option key={ct.id} value={ct.id}>{ct.title}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-watashi-text-soft)]" />
                  </div>
                </div>

                {/* Stats */}
                <div className="rounded-xl bg-[var(--color-watashi-surface-low)] p-4 ring-1 ring-[var(--color-watashi-border)]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-watashi-text-soft)]">Modules</span>
                    <span className="font-bold text-[var(--color-watashi-text-strong)]">{modules.length}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-sm">
                    <span className="text-[var(--color-watashi-text-soft)]">Total Lessons</span>
                    <span className="font-bold text-[var(--color-watashi-text-strong)]">
                      {modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                    </span>
                  </div>
                </div>

                {course.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => void builder.archiveCourse()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-watashi-surface-low)] px-4 py-2.5 text-sm font-semibold text-[var(--color-watashi-text-soft)] ring-1 ring-[var(--color-watashi-border)] transition-all duration-200 hover:bg-[color-mix(in_oklab,#d97706_10%,var(--color-watashi-surface-card))] hover:text-[#d97706] hover:ring-[color-mix(in_oklab,#d97706_30%,var(--color-watashi-border))]"
                  >
                    Archive Course
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void builder.deleteCourse(course.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[color-mix(in_oklab,var(--color-watashi-ember)_10%,var(--color-watashi-surface-card))] px-4 py-2.5 text-sm font-semibold text-[var(--color-watashi-ember)] ring-1 ring-[color-mix(in_oklab,var(--color-watashi-ember)_20%,var(--color-watashi-border))] transition-all duration-200 hover:bg-[color-mix(in_oklab,var(--color-watashi-ember)_16%,var(--color-watashi-surface-card))] hover:ring-[color-mix(in_oklab,var(--color-watashi-ember)_30%,var(--color-watashi-border))]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Course
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
