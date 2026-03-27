import { ArrowRight, Play, Wand2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { getDashboardViewModel } from '../domain/dashboard-model'
import { useAuthSession } from '../../workspace/hooks/use-auth-session'
import {
  FeatureBadge,
  InitialsBadge,
  ProgressTrack,
  WorkspaceEyebrow,
  WorkspacePanel,
  cx,
  roleTheme,
} from '../../../shared/ui/workspace'

export function DashboardHomePage() {
  const user = useAuthSession()
  const theme = roleTheme(user.role)
  const view = getDashboardViewModel(user)

  return (
    <div className="space-y-8">
      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_320px]">
        <WorkspacePanel className="overflow-hidden bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--color-watashi-indigo)_12%,transparent),transparent_36%),linear-gradient(180deg,color-mix(in_oklab,var(--color-watashi-surface-card)_96%,white),var(--color-watashi-surface-card))]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_300px] lg:items-start">
            <div>
              <FeatureBadge className="bg-[color-mix(in_oklab,var(--color-watashi-surface-card)_92%,white)] text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)]">
                {user.role === 'educator' ? 'Content Studio' : 'AI Study Path'}
              </FeatureBadge>
              <h1 className="mt-6 max-w-3xl font-display text-[clamp(3rem,6vw,4.75rem)] font-black leading-[0.94] tracking-[-0.07em] text-slate-950">
                Welcome back, <span className={theme.accentText}>Curator.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-500">{view.supporting}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={view.primaryCtaPath}
                  className={cx(
                    'inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(23,104,81,0.55)] transition-transform hover:-translate-y-0.5',
                    theme.accentBg,
                  )}
                >
                  {view.primaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={user.role === 'educator' ? '/community' : '/focus'}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-surface-low)] px-6 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-[var(--color-watashi-surface-high)]"
                >
                  {user.role === 'educator' ? 'Open Community' : 'Resume Focus Mode'}
                </Link>
              </div>
            </div>

            <div className={cx('rounded-[2rem] bg-gradient-to-br p-7 text-white shadow-[0_28px_80px_-44px_rgba(31,41,55,0.45)]', theme.accentGradient)}>
              <WorkspaceEyebrow className="text-white/70">{user.role === 'educator' ? 'Launch window' : 'AI study path'}</WorkspaceEyebrow>
              <h2 className="mt-4 text-[2rem] font-black leading-tight tracking-[-0.05em]">{view.studyPathTitle}</h2>
              <p className="mt-2 text-sm text-white/75">{view.studyPathLength}</p>
              <div className="mt-10 flex items-end justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <p className="text-4xl font-black">{view.studyPathProgress}%</p>
                  <ProgressTrack value={view.studyPathProgress} className="mt-3 bg-white/20" />
                </div>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-900">
                  <Play className="h-5 w-5 fill-current" />
                </span>
              </div>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel className="flex flex-col justify-between bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-watashi-surface-card)_96%,white),color-mix(in_oklab,var(--color-watashi-surface-low)_92%,white))]">
          <div>
            <WorkspaceEyebrow>{view.railHeading}</WorkspaceEyebrow>
            <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">{view.railValue}</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{view.railLabel}</p>
          </div>

          <div className="mt-8 space-y-5">
            <div className="rounded-[1.75rem] bg-[color-mix(in_oklab,var(--color-watashi-surface-card)_94%,white)] p-5 ring-1 ring-[var(--color-watashi-border)]">
              <div className="flex items-center gap-3">
                <InitialsBadge user={user} className={user.role === 'educator' ? 'bg-[var(--color-watashi-indigo)]' : 'bg-[var(--color-watashi-emerald)]'} />
                <div>
                  <p className="text-sm font-bold text-slate-950">Stable module split</p>
                  <p className="text-xs text-slate-500">Dedicated dashboard, courses, community, and creation-lab surfaces.</p>
                </div>
              </div>
            </div>
            <p className="text-sm leading-7 text-slate-500">{view.railBody}</p>
            <Link
              to={view.railButtonPath}
              className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--color-watashi-indigo)_35%,white)] px-5 py-3 text-sm font-bold text-[var(--color-watashi-indigo)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,white)]"
            >
              {view.railButtonLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </WorkspacePanel>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        {view.metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <WorkspacePanel key={metric.label} className="rounded-[1.8rem] p-6">
              <div className={cx('mb-5 flex h-12 w-12 items-center justify-center rounded-2xl', metric.tone)}>
                <Icon className="h-5 w-5" />
              </div>
              <WorkspaceEyebrow>{metric.label}</WorkspaceEyebrow>
              <p className="mt-2 text-[2rem] font-black tracking-[-0.05em] text-slate-950">{metric.value}</p>
              <p className="mt-2 text-sm text-slate-500">{metric.detail}</p>
            </WorkspacePanel>
          )
        })}
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
        <WorkspacePanel>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[2rem] font-black tracking-[-0.05em] text-slate-950">Recent Activity</h2>
              <p className="mt-2 text-sm text-slate-500">Tracked workstreams are now mapped to route-level modules and reusable card primitives.</p>
            </div>
            <Link to="/courses" className={cx('text-sm font-bold', theme.accentText)}>
              View all exhibits
            </Link>
          </div>

          <div className="mt-8 space-y-3">
            {view.activities.map((item) => (
              <article
                key={item.title}
                className="flex flex-col gap-4 rounded-[1.75rem] bg-[var(--color-watashi-surface-low)] px-5 py-4 transition-colors hover:bg-[var(--color-watashi-surface-card)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-watashi-surface-card)] text-[var(--color-watashi-emerald)] shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)]">
                    <Wand2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-950">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.subtitle}</p>
                  </div>
                </div>
                <div className="min-w-[110px]">
                  <div className="flex justify-end text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    {item.progress}%
                  </div>
                  <ProgressTrack value={item.progress} className="mt-2" />
                </div>
              </article>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel className="bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-watashi-surface-card)_96%,white),color-mix(in_oklab,var(--color-watashi-emerald)_7%,var(--color-watashi-surface-low)))]">
          <WorkspaceEyebrow>{user.role === 'educator' ? 'Creation analytics' : 'Mentor upgrade'}</WorkspaceEyebrow>
          <h2 className="mt-3 font-display text-[1.8rem] font-black tracking-[-0.05em] text-slate-950">
            {user.role === 'educator' ? 'AI Course Blueprinting' : 'Watashi AI Plus'}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            {user.role === 'educator'
              ? 'Generate a complete module structure from a single brief, then move into course builder or multimedia editing without losing context.'
              : 'Unlock 1-on-1 AI mentorship, deeper route personalization, and faster handoff from dashboard into focus mode.'}
          </p>
          <div className="mt-8 rounded-[1.75rem] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-watashi-surface-contrast)_22%,var(--color-watashi-surface-card)),color-mix(in_oklab,var(--color-watashi-surface-card)_92%,black))] p-6 text-white">
            <WorkspaceEyebrow className="text-white/60">{user.role === 'educator' ? 'Workflow note' : 'Premium masterclass'}</WorkspaceEyebrow>
            <p className="mt-3 text-2xl font-black tracking-[-0.04em]">{user.role === 'educator' ? 'Launch assistant' : 'Curriculum Monetization'}</p>
            <p className="mt-3 text-sm leading-7 text-white/75">
              {user.role === 'educator'
                ? 'Course outlines, certificate packs, and media drafts are routed through explicit creation-lab submodules.'
                : 'Strategic frameworks for turning expert knowledge into a sustainable digital business.'}
            </p>
          </div>
        </WorkspacePanel>
      </section>
    </div>
  )
}
