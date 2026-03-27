import { ArrowRight, Filter, Plus, Sparkles } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { courseCards, learningRail } from '../domain/courses-model'
import { useAuthSession } from '../../workspace/hooks/use-auth-session'
import { FeatureBadge, WorkspaceEyebrow, WorkspacePanel, cx, roleTheme } from '../../../shared/ui/workspace'

export function CoursesPage() {
  const user = useAuthSession()
  const theme = roleTheme(user.role)

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <FeatureBadge>{user.role === 'educator' ? 'Educator pathway' : 'Learner pathway'}</FeatureBadge>
          <h1 className="mt-5 font-display text-[clamp(3.2rem,7vw,5.4rem)] font-black leading-[0.88] tracking-[-0.08em] text-slate-950">
            Your Learning <span className={theme.accentText}>Paths</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-500">
            Curate your intellectual journey with modular architectures, cognitive frameworks, and route-level course surfaces that scale cleanly.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-surface-low)] px-5 py-3 text-sm font-bold text-slate-700">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-indigo)] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(75,65,225,0.55)]">
            <Plus className="h-4 w-4" />
            New Pathway
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_300px]">
        <div className="grid gap-6 md:grid-cols-2">
          {courseCards.map((course, index) => (
            <WorkspacePanel
              key={course.title}
              className={cx(
                'relative overflow-hidden rounded-[2rem] bg-gradient-to-br',
                course.accent,
                index === 0 ? 'md:col-span-2 md:min-h-[23rem]' : 'min-h-[19rem]',
                index === 3 && 'from-[var(--color-watashi-indigo)] to-[#7066ff] text-white',
              )}
            >
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <WorkspaceEyebrow className={index === 3 ? 'text-white/65' : ''}>{course.label}</WorkspaceEyebrow>
                  <h2 className={cx('mt-4 max-w-[15ch] font-display text-[2rem] font-black leading-tight tracking-[-0.05em]', index === 3 ? 'text-white' : 'text-slate-950')}>
                    {course.title}
                  </h2>
                  <p className={cx('mt-4 max-w-[34ch] text-sm leading-7', index === 3 ? 'text-white/75' : 'text-slate-500')}>
                    {course.summary}
                  </p>
                </div>

                <div className="mt-8 flex items-end justify-between gap-6">
                  <div>
                    <p className={cx('text-[10px] font-black uppercase tracking-[0.22em]', index === 3 ? 'text-white/60' : 'text-slate-400')}>
                      {course.metricLabel}
                    </p>
                    <p className={cx('mt-2 text-lg font-black', index === 3 ? 'text-white' : theme.accentText)}>
                      {course.metricValue}
                    </p>
                  </div>
                  <Link to="/courses" className={cx('inline-flex items-center gap-2 text-sm font-bold', index === 3 ? 'text-white' : 'text-slate-700')}>
                    Explore
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </WorkspacePanel>
          ))}
        </div>

        <div className="space-y-6">
          <WorkspacePanel className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(242,244,246,0.94))]">
            <WorkspaceEyebrow>Knowledge rail</WorkspaceEyebrow>
            <h2 className="mt-3 font-display text-[2rem] font-black tracking-[-0.05em] text-slate-950">Guided by signal</h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Course discovery, progress, and authoring now live in their own module so new catalog states can grow without bloating the dashboard.
            </p>
          </WorkspacePanel>

          {learningRail.map((item) => (
            <WorkspacePanel key={item.label} className="rounded-[1.8rem] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <WorkspaceEyebrow>{item.label}</WorkspaceEyebrow>
                  <p className="mt-2 text-[1.9rem] font-black tracking-[-0.05em] text-slate-950">{item.value}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-watashi-primary-fixed)] text-[var(--color-watashi-emerald)]">
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500">{item.detail}</p>
            </WorkspacePanel>
          ))}
        </div>
      </section>
    </div>
  )
}
