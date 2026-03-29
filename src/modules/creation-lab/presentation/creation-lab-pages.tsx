import { Link } from '@tanstack/react-router'
import { startTransition, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CirclePlay,
  Clapperboard,
  FileText,
  HardDrive,
  LayoutTemplate,
  Loader2,
  MicVocal,
  Plus,
  RefreshCw,
  Sparkles,
  Video,
  Wand2,
} from 'lucide-react'
import { resolveCourseOutline } from '../../../features/ai-jobs/client'
import type { CourseOutlineResult } from '../../../shared/contracts/jobs'
import { getDisplayErrorMessage } from '../../../shared/errors'
import {
  courseBuilderModules,
  creationLabCards,
  multimediaAssets,
  multimediaTimeline,
} from '../domain/creation-lab-model'
import { WorkspaceEyebrow, WorkspacePanel, cx } from '../../../shared/ui/workspace'
import { ROUTE_PATHS } from '../../../shared/routing/paths'
import { useEducatorDashboard } from '../hooks/use-educator-dashboard'
import type { ActivityLogRecord } from '../../../shared/contracts/educator'
import type { JobRecord } from '../../../shared/contracts/jobs'

type CourseBuilderModule = {
  id: string
  title: string
  detail: string
  items: string[]
}

type CourseBlueprint = {
  title: string
  summary: string
  modules: CourseBuilderModule[]
}

const defaultCourseBlueprint: CourseBlueprint = {
  title: 'UI Foundations',
  summary: 'Shape the course structure, refine each module, and move from a strong brief into a publishable lesson flow.',
  modules: courseBuilderModules.map((module) => ({
    id: module.id,
    title: module.title,
    detail: module.items[0] ?? 'Define the learning objective, supporting references, and the exercise flow for this module.',
    items: module.items.length > 0 ? module.items : ['Draft the lesson brief', 'Add a guided exercise'],
  })),
}

const defaultCoursePrompt = 'Design a beginner-to-intermediate course on AI-assisted interface design for self-taught creators.'

function createModuleItems(detail: string) {
  const items = detail
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  return items.length > 0 ? items : ['Draft the lesson brief', 'Add a guided exercise']
}

function createCourseBlueprint(outline: CourseOutlineResult): CourseBlueprint {
  return {
    title: outline.title,
    summary: outline.desc,
    modules: outline.modules.map((module, index) => ({
      id: String(index + 1).padStart(2, '0'),
      title: module.name,
      detail: module.detail,
      items: createModuleItems(module.detail),
    })),
  }
}

function formatStorageBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatActivityAction(log: ActivityLogRecord): string {
  const action = log.action.replace(/_/g, ' ')
  return `${action.charAt(0).toUpperCase()}${action.slice(1)}`
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getJobStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_12%,var(--color-watashi-surface-card))] text-[var(--color-watashi-emerald)]'
    case 'running': return 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_12%,var(--color-watashi-surface-card))] text-[var(--color-watashi-indigo)]'
    case 'queued': return 'bg-[color-mix(in_oklab,#d97706_12%,var(--color-watashi-surface-card))] text-[#d97706]'
    case 'failed': return 'bg-[color-mix(in_oklab,var(--color-watashi-ember)_12%,var(--color-watashi-surface-card))] text-[var(--color-watashi-ember)]'
    default: return 'bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text)]'
  }
}

function getModuleIcon(module: string) {
  switch (module) {
    case 'course': return BookOpen
    case 'video': return Video
    case 'certificate': return Award
    default: return FileText
  }
}

export function CreationLabHubPage() {
  const { snapshot, isLoading, error, refresh } = useEducatorDashboard()

  if (isLoading) {
    return (
      <div className="space-y-8">
        <section className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <WorkspaceEyebrow>Workspace</WorkspaceEyebrow>
            <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,3.6rem)] font-black leading-[0.9] tracking-[-0.08em] text-[var(--color-watashi-text-strong)]">
              Your Creation <span className="text-[var(--color-watashi-indigo)]">Lab.</span>
            </h1>
          </div>
        </section>
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <WorkspacePanel key={i} className="animate-pulse rounded-[1.8rem] p-6">
              <div className="mb-5 h-12 w-12 rounded-2xl bg-[var(--color-watashi-surface-high)]" />
              <div className="h-3 w-24 rounded bg-[var(--color-watashi-surface-high)]" />
              <div className="mt-3 h-8 w-16 rounded bg-[var(--color-watashi-surface-high)]" />
              <div className="mt-3 h-3 w-36 rounded bg-[var(--color-watashi-surface-high)]" />
            </WorkspacePanel>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
          <WorkspacePanel className="animate-pulse rounded-[1.75rem]">
            <div className="h-4 w-28 rounded bg-[var(--color-watashi-surface-high)]" />
            <div className="mt-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-[1.4rem] bg-[var(--color-watashi-surface-low)]" />
              ))}
            </div>
          </WorkspacePanel>
          <WorkspacePanel className="animate-pulse rounded-[1.75rem]">
            <div className="h-4 w-28 rounded bg-[var(--color-watashi-surface-high)]" />
            <div className="mt-6 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 rounded-[1.4rem] bg-[var(--color-watashi-surface-low)]" />
              ))}
            </div>
          </WorkspacePanel>
        </div>
      </div>
    )
  }

  if (error && !snapshot) {
    return (
      <div className="space-y-8">
        <section className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <WorkspaceEyebrow>Workspace</WorkspaceEyebrow>
            <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,3.6rem)] font-black leading-[0.9] tracking-[-0.08em] text-[var(--color-watashi-text-strong)]">
              Your Creation <span className="text-[var(--color-watashi-indigo)]">Lab.</span>
            </h1>
          </div>
        </section>
        <WorkspacePanel className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-10 w-10 text-[var(--color-watashi-ember)]" />
          <p className="mt-4 text-sm font-semibold text-[var(--color-watashi-text-strong)]">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-indigo)] px-5 py-3 text-sm font-bold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </WorkspacePanel>
      </div>
    )
  }

  const metrics = snapshot?.metrics
  const recentActivity = snapshot?.recentActivity ?? []
  const recentJobs = snapshot?.recentJobs ?? []

  const statCards = [
    { label: 'Total Courses', value: String(metrics?.totalCourses ?? 0), detail: `${metrics?.totalPublishedCourses ?? 0} published`, tone: 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_12%,var(--color-watashi-surface-card))] text-[var(--color-watashi-indigo)]', icon: BookOpen },
    { label: 'Video Projects', value: String(metrics?.totalVideoProjects ?? 0), detail: 'Across all projects', tone: 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_12%,var(--color-watashi-surface-card))] text-[var(--color-watashi-emerald)]', icon: Video },
    { label: 'Certificates Issued', value: String(metrics?.totalCertificatesIssued ?? 0), detail: `${metrics?.totalCertificateTemplates ?? 0} templates`, tone: 'bg-[color-mix(in_oklab,#d97706_12%,var(--color-watashi-surface-card))] text-[#d97706]', icon: Award },
  ]

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <WorkspaceEyebrow>Workspace</WorkspaceEyebrow>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,3.6rem)] font-black leading-[0.9] tracking-[-0.08em] text-[var(--color-watashi-text-strong)]">
            Your Creation <span className="text-[var(--color-watashi-indigo)]">Lab.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-watashi-text)]">
            Manage your curriculum, edit cinematic lessons, and design official certifications from one educator-grade workspace.
          </p>
        </div>
      </section>

      {/* ── Metrics Row ── */}
      <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <WorkspacePanel key={card.label} className="rounded-[1.8rem] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-watashi-card)]">
              <div className={cx('mb-5 flex h-12 w-12 items-center justify-center rounded-2xl', card.tone)}>
                <Icon className="h-5 w-5" />
              </div>
              <WorkspaceEyebrow>{card.label}</WorkspaceEyebrow>
              <p className="mt-2 text-[2rem] font-black tracking-[-0.05em] text-[var(--color-watashi-text-strong)]">{card.value}</p>
              <p className="mt-2 text-sm text-[var(--color-watashi-text)]">{card.detail}</p>
            </WorkspacePanel>
          )
        })}
        <WorkspacePanel className="rounded-[1.8rem] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-watashi-card)]">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text)]">
            <HardDrive className="h-5 w-5" />
          </div>
          <WorkspaceEyebrow>Drafts / Storage</WorkspaceEyebrow>
          <p className="mt-2 text-[2rem] font-black tracking-[-0.05em] text-[var(--color-watashi-text-strong)]">{metrics?.totalDraftItems ?? 0}</p>
          <p className="mt-2 text-sm text-[var(--color-watashi-text)]">{formatStorageBytes(metrics?.storageBytes ?? 0)} used</p>
        </WorkspacePanel>
      </div>

      {/* ── Quick Actions + Activity ── */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
        <WorkspacePanel className="overflow-hidden bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--color-watashi-indigo)_16%,transparent),transparent_36%),linear-gradient(180deg,color-mix(in_oklab,var(--color-watashi-surface-card)_96%,transparent),var(--color-watashi-surface-card))]">
          <WorkspaceEyebrow>Quick actions</WorkspaceEyebrow>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {creationLabCards.map((card) => (
              <Link key={card.title} to={card.path} className="rounded-[1.7rem] bg-[var(--color-watashi-surface-low)] px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-watashi-card)] hover:bg-[var(--color-watashi-surface-high)]">
                <WorkspaceEyebrow>{card.title}</WorkspaceEyebrow>
                <p className="mt-3 text-sm text-[var(--color-watashi-text)]">{card.detail}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <WorkspaceEyebrow>Recent activity</WorkspaceEyebrow>
            <div className="mt-4 space-y-3">
              {recentActivity.length === 0 ? (
                <p className="py-4 text-sm text-[var(--color-watashi-text-soft)]">No recent activity yet. Start creating to see updates here.</p>
              ) : (
                recentActivity.slice(0, 6).map((log) => {
                  const ModuleIcon = getModuleIcon(log.module)
                  return (
                    <div key={log.id} className="flex items-center gap-3 rounded-[1.4rem] bg-[var(--color-watashi-surface-low)] px-4 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-watashi-primary-fixed)] text-[var(--color-watashi-emerald)]">
                        <ModuleIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--color-watashi-text-strong)]">
                          {formatActivityAction(log)}
                          {log.entityType ? ` (${log.entityType})` : ''}
                        </p>
                        <p className="text-xs text-[var(--color-watashi-text-soft)]">{log.module} &middot; {formatRelativeTime(log.createdAt)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </WorkspacePanel>

        <div className="space-y-6">
          <WorkspacePanel className="bg-[linear-gradient(180deg,var(--color-watashi-indigo),#6f63ff)] text-white">
            <WorkspaceEyebrow className="text-white/65">Quick start</WorkspaceEyebrow>
            <h2 className="mt-3 font-display text-[2rem] font-black tracking-[-0.05em]">Jump into a builder</h2>
            <p className="mt-4 text-sm leading-7 text-white/78">
              Create courses, record videos, or design certificates from your educator workspace.
            </p>
            <Link
              to={ROUTE_PATHS.creationLabVideo}
              className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--color-watashi-indigo)]"
            >
              Open Video Editor
            </Link>
          </WorkspacePanel>

          {recentJobs.length > 0 && (
            <WorkspacePanel>
              <WorkspaceEyebrow>Recent jobs</WorkspaceEyebrow>
              <div className="mt-4 space-y-3">
                {recentJobs.slice(0, 5).map((job: JobRecord) => (
                  <div key={job.id} className="flex items-center justify-between rounded-[1.4rem] bg-[var(--color-watashi-surface-low)] px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-watashi-text-strong)]">{job.type.replace(/-/g, ' ')}</p>
                      <p className="text-xs text-[var(--color-watashi-text-soft)]">{formatRelativeTime(job.updatedAt)}</p>
                    </div>
                    <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]', getJobStatusColor(job.status))}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </WorkspacePanel>
          )}

          <WorkspacePanel className="bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-watashi-surface-card)_97%,white),color-mix(in_oklab,var(--color-watashi-indigo)_5%,var(--color-watashi-surface-low)))]">
            <WorkspaceEyebrow>AI Course Blueprinting</WorkspaceEyebrow>
            <h2 className="mt-3 font-display text-[1.8rem] font-black tracking-[-0.05em] text-[var(--color-watashi-text-strong)]">Generate the next build</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--color-watashi-text)]">
              Outline modules, align certificate packs, and prepare media assets from a single prompt.
            </p>
            <Link
              to={ROUTE_PATHS.creationLabCourseBuilder}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-watashi-indigo),color-mix(in_oklab,var(--color-watashi-indigo)_78%,white))] px-5 py-3 text-sm font-bold text-white shadow-[0_22px_48px_-28px_rgba(75,65,225,0.55)]"
            >
              Launch assistant
              <Sparkles className="h-4 w-4" />
            </Link>
          </WorkspacePanel>
        </div>
      </section>
    </div>
  )
}

export function CourseBuilderPage() {
  const [assistantPrompt, setAssistantPrompt] = useState(defaultCoursePrompt)
  const [courseBlueprint, setCourseBlueprint] = useState(defaultCourseBlueprint)
  const [activeModuleId, setActiveModuleId] = useState(defaultCourseBlueprint.modules[0]?.id ?? '01')
  const [assistantError, setAssistantError] = useState<string | null>(null)
  const [isRunningPrompt, setIsRunningPrompt] = useState(false)

  const activeModule = courseBlueprint.modules.find((module) => module.id === activeModuleId) ?? courseBlueprint.modules[0]

  async function runPrompt() {
    const trimmedPrompt = assistantPrompt.trim()
    if (!trimmedPrompt) {
      return
    }

    setIsRunningPrompt(true)
    setAssistantError(null)

    try {
      const outline = await resolveCourseOutline({ topic: trimmedPrompt })
      const nextBlueprint = createCourseBlueprint(outline)

      startTransition(() => {
        setCourseBlueprint(nextBlueprint)
        setActiveModuleId(nextBlueprint.modules[0]?.id ?? activeModuleId)
      })
    } catch (error) {
      setAssistantError(getDisplayErrorMessage(error, 'We could not run that prompt right now. Please try again.'))
    } finally {
      setIsRunningPrompt(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-10rem)] gap-6 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
      <WorkspacePanel className="rounded-[1.75rem] bg-[var(--color-watashi-surface-low)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[1.35rem] font-black tracking-[-0.04em] text-[var(--color-watashi-text-strong)]">Curriculum</h2>
          <button type="button" className="text-[var(--color-watashi-indigo)]">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {courseBlueprint.modules.map((module) => (
            <button
              key={module.id}
              type="button"
              onClick={() => setActiveModuleId(module.id)}
              className={`block w-full rounded-[1.5rem] px-4 py-4 text-left transition-colors ${activeModule?.id === module.id ? 'bg-[var(--color-watashi-surface-card)] shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)]' : 'bg-transparent hover:bg-[var(--color-watashi-surface-card)]/70'}`}
            >
              <WorkspaceEyebrow>Module {module.id}</WorkspaceEyebrow>
              <h3 className="mt-2 font-bold text-[var(--color-watashi-text-strong)]">{module.title}</h3>
              {module.items.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-[var(--color-watashi-text)]">
                  {module.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-watashi-indigo)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-[1.6rem] border border-[color-mix(in_oklab,var(--color-watashi-indigo)_18%,var(--color-watashi-border))] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-watashi-indigo)_10%,var(--color-watashi-surface-card)),color-mix(in_oklab,var(--color-watashi-surface-card)_98%,transparent))] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-watashi-indigo)] text-white shadow-[0_18px_40px_-26px_rgba(75,65,225,0.55)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-watashi-indigo)]">AI Course Assistant</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-watashi-text)]">
                {isRunningPrompt ? 'Running prompt and refreshing the module rail.' : `Blueprint ready for ${courseBlueprint.modules.length} modules.`}
              </p>
            </div>
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel className="rounded-[1.75rem]">
        <nav className="flex items-center gap-2 text-xs font-medium text-[var(--color-watashi-text-soft)]">
          <span>My Courses</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>{courseBlueprint.title}</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span className="text-[var(--color-watashi-text)]">{activeModule?.title}</span>
        </nav>
        <div className="mt-6 rounded-[1.9rem] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-watashi-primary-fixed)_78%,var(--color-watashi-surface-card)),color-mix(in_oklab,var(--color-watashi-surface-low)_86%,var(--color-watashi-surface-card)))] p-6 ring-1 ring-[color-mix(in_oklab,var(--color-watashi-indigo)_16%,var(--color-watashi-border))]">
          <WorkspaceEyebrow className="text-[var(--color-watashi-indigo)]">Course blueprint</WorkspaceEyebrow>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-black tracking-[-0.06em] text-[var(--color-watashi-text-strong)]">
                {activeModule?.title}
              </h1>
              <p className="mt-4 text-sm leading-7 text-[var(--color-watashi-text)]">{courseBlueprint.summary}</p>
            </div>
            <div className="rounded-[1.4rem] bg-[color-mix(in_oklab,var(--color-watashi-surface-card)_72%,transparent)] px-4 py-4 shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)]">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-watashi-text-soft)]">Modules planned</p>
              <p className="mt-2 text-3xl font-black text-[var(--color-watashi-indigo)]">{courseBlueprint.modules.length}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-[1.7rem] bg-[var(--color-watashi-surface-low)] p-5 ring-1 ring-[var(--color-watashi-border)]">
            <WorkspaceEyebrow>Lesson abstract</WorkspaceEyebrow>
            <label className="mt-4 block">
              <span className="sr-only">Lesson abstract</span>
              <textarea
                key={activeModule?.id}
                className="min-h-32 w-full resize-none rounded-[1.3rem] border-none bg-[var(--color-watashi-surface-card)] px-4 py-4 text-sm leading-7 text-[var(--color-watashi-text)] outline-none ring-1 ring-[var(--color-watashi-border)]"
                defaultValue={activeModule?.detail}
              />
            </label>
          </div>
          <WorkspacePanel className="rounded-[1.7rem] bg-[var(--color-watashi-surface-low)] p-5">
            <WorkspaceEyebrow>Lesson controls</WorkspaceEyebrow>
            <div className="mt-4 flex gap-3 text-[var(--color-watashi-text)]">
              <button
                type="button"
                className="rounded-full bg-[var(--color-watashi-surface-card)] px-3 py-2 ring-1 ring-[var(--color-watashi-border)]"
              >
                Tt
              </button>
              <button
                type="button"
                className="rounded-full bg-[var(--color-watashi-surface-card)] px-3 py-2 ring-1 ring-[var(--color-watashi-border)]"
              >
                Fx
              </button>
              <button
                type="button"
                className="rounded-full bg-[color-mix(in_oklab,var(--color-watashi-indigo)_18%,var(--color-watashi-surface-card))] px-3 py-2 text-[var(--color-watashi-indigo)] ring-1 ring-[color-mix(in_oklab,var(--color-watashi-indigo)_28%,var(--color-watashi-border))]"
              >
                AI
              </button>
            </div>
          </WorkspacePanel>
        </div>

        <div className="mt-8 rounded-[2rem] bg-[linear-gradient(180deg,#9f8f6c,#8b7c58)] p-6 text-white">
          <div className="flex min-h-[14rem] items-center justify-center rounded-[1.5rem] bg-black/12">
            <span className="flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-white/18 backdrop-blur-sm">
              <CirclePlay className="h-8 w-8 fill-current" />
            </span>
          </div>
        </div>

        <div className="mt-8 rounded-[1.75rem] bg-[var(--color-watashi-surface-low)] px-5 py-5">
          <WorkspaceEyebrow>Lesson content</WorkspaceEyebrow>
          <p className="mt-4 text-sm leading-7 text-[var(--color-watashi-text)]">
            {activeModule?.detail}
          </p>
        </div>
      </WorkspacePanel>

      <div className="space-y-6">
        <WorkspacePanel className="rounded-[1.75rem] bg-[linear-gradient(180deg,var(--color-watashi-indigo),#6d61ff)] text-white">
          <WorkspaceEyebrow className="text-white/65">Prompt runner</WorkspaceEyebrow>
          <h2 className="mt-3 font-display text-[1.85rem] font-black tracking-[-0.05em]">Run a single brief</h2>
          <p className="mt-4 text-sm leading-7 text-white/78">
            Generate the module structure, rewrite the curriculum rail, and seed the active lesson without leaving the builder.
          </p>
          <label className="mt-6 block">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/72">Course prompt</span>
            <textarea
              value={assistantPrompt}
              onChange={(event) => setAssistantPrompt(event.target.value)}
              className="mt-3 min-h-36 w-full resize-none rounded-[1.5rem] border-none bg-white/12 px-4 py-4 text-sm leading-7 text-white outline-none ring-1 ring-white/18 placeholder:text-white/52"
              placeholder="Describe the audience, outcome, and tone for the course you want to generate."
            />
          </label>
          <button
            type="button"
            onClick={() => void runPrompt()}
            disabled={isRunningPrompt || assistantPrompt.trim().length === 0}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--color-watashi-indigo)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRunningPrompt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isRunningPrompt ? 'Running prompt...' : 'Run prompt'}
          </button>
          <div aria-live="polite" className="mt-4 min-h-10 text-sm">
            {assistantError ? (
              <p className="font-semibold text-[color-mix(in_oklab,var(--color-watashi-ember)_60%,white)]">{assistantError}</p>
            ) : (
              <p className="text-white/72">
                {isRunningPrompt
                  ? 'Building a fresh curriculum draft from your prompt.'
                  : 'Include topic, audience, and outcome to get a sharper course outline.'}
              </p>
            )}
          </div>
          <div className="mt-6 rounded-[1.6rem] bg-black/14 px-4 py-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-black">{courseBlueprint.title}</p>
              <span className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/72">
                {courseBlueprint.modules.length} modules
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/72">{courseBlueprint.summary}</p>
          </div>
        </WorkspacePanel>

        <WorkspacePanel className="rounded-[1.75rem]">
          <WorkspaceEyebrow>Asset library</WorkspaceEyebrow>
          <div className="mt-5 space-y-4">
            {multimediaAssets.map((asset) => (
              <div key={asset.name} className="overflow-hidden rounded-[1.5rem] bg-[var(--color-watashi-surface-low)]">
                <div className="aspect-[4/3] overflow-hidden">
                  <img alt={asset.name} className="h-full w-full object-cover" src={asset.preview} />
                </div>
                <div className="px-4 py-4">
                  <WorkspaceEyebrow>{asset.label}</WorkspaceEyebrow>
                  <p className="mt-2 text-sm font-bold text-[var(--color-watashi-text-strong)]">{asset.name}</p>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </div>
    </div>
  )
}

export function MultimediaEditorPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_280px]">
        <WorkspacePanel className="overflow-hidden rounded-[2rem] p-0">
          <div className="relative aspect-[16/10] bg-[color-mix(in_oklab,var(--color-watashi-surface-contrast)_16%,var(--color-watashi-surface-card))]">
            <img alt="Preview" className="h-full w-full object-cover opacity-85" src="/stitch-assets/asset-11f0048f9c77a1af.jpg" />
            <div className="absolute left-4 top-4 flex gap-2">
              <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">Live preview</span>
              <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">1080p | 60 fps</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--color-watashi-border)] px-6 py-4">
            <div className="flex items-center gap-3 text-[var(--color-watashi-text)]">
              <button type="button">
                <CirclePlay className="h-5 w-5" />
              </button>
              <button type="button">
                <Clapperboard className="h-5 w-5" />
              </button>
              <button type="button">
                <MicVocal className="h-5 w-5" />
              </button>
            </div>
            <div className="font-mono text-sm font-bold text-[var(--color-watashi-text)]">00:04:12:24 / 00:12:45:00</div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel className="rounded-[2rem]">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-[var(--color-watashi-surface-low)] p-1 text-[11px] font-bold text-[var(--color-watashi-text)]">
            <span className="rounded-full bg-[var(--color-watashi-surface-card)] px-3 py-2 text-center text-[var(--color-watashi-indigo)] shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)]">
              Video Assets
            </span>
            <span className="px-3 py-2 text-center">Text</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {multimediaAssets.map((asset) => (
              <div key={asset.name} className="overflow-hidden rounded-[1.35rem] bg-[var(--color-watashi-surface-low)]">
                <img alt={asset.name} className="aspect-square h-auto w-full object-cover" src={asset.preview} />
                <p className="px-3 py-3 text-xs font-bold text-[var(--color-watashi-text-strong)]">{asset.name}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3">
            {[
              { label: 'Record', icon: MicVocal },
              { label: 'Edit', icon: Wand2 },
              { label: 'Timestamp', icon: LayoutTemplate },
              { label: 'Subtitles', icon: Sparkles },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-full bg-[var(--color-watashi-surface-low)] px-4 py-3 text-sm font-bold text-[var(--color-watashi-text)]">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              )
            })}
          </div>
        </WorkspacePanel>
      </section>

      <WorkspacePanel className="rounded-[2rem]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[1.8rem] font-black tracking-[-0.05em] text-[var(--color-watashi-text-strong)]">Timeline</h2>
          <button type="button" className="text-sm font-bold text-[var(--color-watashi-indigo)]">
            Auto-save active
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {multimediaTimeline.map((track, index) => (
            <div key={track.name} className="grid gap-3 rounded-[1.6rem] bg-[var(--color-watashi-surface-low)] px-4 py-4 md:grid-cols-[90px_minmax(0,1fr)_90px] md:items-center">
              <WorkspaceEyebrow>{track.label}</WorkspaceEyebrow>
              <div className={`rounded-[1.2rem] px-4 py-3 text-sm font-semibold ${index === 0 ? 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_18%,var(--color-watashi-surface-card))] text-[var(--color-watashi-text-strong)]' : index === 1 ? 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_14%,var(--color-watashi-surface-card))] text-[var(--color-watashi-text-strong)]' : 'bg-[color-mix(in_oklab,var(--color-watashi-ember)_16%,var(--color-watashi-surface-card))] text-[var(--color-watashi-text-strong)]'}`}>
                {track.name}
              </div>
              <div className="text-right text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-watashi-text-soft)]">{track.span}</div>
            </div>
          ))}
        </div>
      </WorkspacePanel>
    </div>
  )
}

export function VideoCreationPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_320px]">
      <WorkspacePanel className="overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-watashi-surface-card)_96%,transparent),color-mix(in_oklab,var(--color-watashi-surface-low)_92%,white))]">
        <WorkspaceEyebrow>Video creation</WorkspaceEyebrow>
        <h1 className="mt-3 font-display text-[2.8rem] font-black tracking-[-0.06em] text-[var(--color-watashi-text-strong)]">Narratives with motion discipline</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-watashi-text)]">
          Use the multimedia editor for precision work, then return here for batch render status, reusable templates, and media organization.
        </p>
        <div className="mt-8 aspect-[16/9] overflow-hidden rounded-[1.8rem]">
          <img alt="Ocean preview" className="h-full w-full object-cover" src="/stitch-assets/asset-11f0048f9c77a1af.jpg" />
        </div>
      </WorkspacePanel>
      <div className="space-y-6">
        <WorkspacePanel className="rounded-[2rem] bg-[linear-gradient(180deg,var(--color-watashi-indigo),#6f63ff)] text-white">
          <WorkspaceEyebrow className="text-white/65">Fast route</WorkspaceEyebrow>
          <h2 className="mt-3 font-display text-[1.7rem] font-black tracking-[-0.05em]">Jump into the multimedia editor</h2>
          <Link to={ROUTE_PATHS.creationLabVideo} className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--color-watashi-indigo)]">
            Open editor
          </Link>
        </WorkspacePanel>
        <WorkspacePanel className="rounded-[2rem]">
          <WorkspaceEyebrow>Template packs</WorkspaceEyebrow>
          <div className="mt-5 space-y-3">
            <div className="rounded-[1.4rem] bg-[var(--color-watashi-surface-low)] px-4 py-4 text-sm font-semibold text-[var(--color-watashi-text-strong)]">Lecture intro system</div>
            <div className="rounded-[1.4rem] bg-[var(--color-watashi-surface-low)] px-4 py-4 text-sm font-semibold text-[var(--color-watashi-text-strong)]">Case-study lower thirds</div>
            <div className="rounded-[1.4rem] bg-[var(--color-watashi-surface-low)] px-4 py-4 text-sm font-semibold text-[var(--color-watashi-text-strong)]">Cohort recap montage</div>
          </div>
        </WorkspacePanel>
      </div>
    </div>
  )
}

export function CertificateBuilderPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <WorkspacePanel className="rounded-[2rem]">
        <WorkspaceEyebrow>Certificate creation</WorkspaceEyebrow>
        <h1 className="mt-3 font-display text-[2.3rem] font-black tracking-[-0.05em] text-[var(--color-watashi-text-strong)]">Credential system</h1>
        <div className="mt-6 space-y-4">
          {['Gold framed layout', 'Handwritten signature', 'Completion seal', 'Cohort badge'].map((item) => (
            <label key={item} className="flex items-center justify-between rounded-[1.5rem] bg-[var(--color-watashi-surface-low)] px-4 py-4 text-sm font-semibold text-[var(--color-watashi-text-strong)]">
              <span>{item}</span>
              <span className="h-5 w-5 rounded-full border border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)]" />
            </label>
          ))}
        </div>
        <button type="button" className="mt-6 inline-flex rounded-full bg-[var(--color-watashi-emerald)] px-5 py-3 text-sm font-bold text-white">
          Configure signature
        </button>
      </WorkspacePanel>

      <WorkspacePanel className="rounded-[2rem] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-watashi-surface-card)_86%,transparent),color-mix(in_oklab,#f0eee8_76%,var(--color-watashi-surface-low)))]">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-[color-mix(in_oklab,var(--color-watashi-surface-card)_72%,white)] p-10 shadow-[0_36px_80px_-56px_rgba(18,32,43,0.45)]">
          <WorkspaceEyebrow>Certificate preview</WorkspaceEyebrow>
          <p className="mt-10 text-center text-base text-[var(--color-watashi-text)]">This certifies that</p>
          <p className="mt-6 text-center font-display text-[3rem] font-black tracking-[-0.06em] text-[var(--color-watashi-text-strong)]">The Learner Name</p>
          <p className="mt-5 text-center text-base leading-8 text-[var(--color-watashi-text)]">
            has successfully completed Applied AI Systems Mastery with distinction in strategic interface design.
          </p>
          <div className="mt-14 flex items-end justify-between text-sm font-semibold text-[var(--color-watashi-text)]">
            <span>Watashi Learn</span>
            <span>Official seal</span>
          </div>
        </div>
      </WorkspacePanel>
    </div>
  )
}
