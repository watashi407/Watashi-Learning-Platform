import { CheckCircle2, CirclePlay, Lock, TimerReset } from 'lucide-react'
import { focusLessons } from '../data'
import { AppSectionHeader, AppSurfaceCard, cx } from '../ui'

export function FocusPage() {
  const lessons = focusLessons as ReadonlyArray<{
    title: string
    duration: string
    complete?: boolean
    active?: boolean
  }>

  return (
    <div className="space-y-6">
      <AppSurfaceCard className="overflow-hidden border-none bg-[linear-gradient(135deg,var(--color-watashi-surface-contrast),color-mix(in_oklab,var(--color-watashi-surface-contrast)_90%,var(--color-watashi-indigo)))] text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">Focus</p>
        <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">Learner-only playback route</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
          This route is locked to learner sessions. It keeps the player experience isolated from the rest of the app shell.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--color-watashi-surface-contrast)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]">
            <CirclePlay className="h-4 w-4" />
            Resume current lesson
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition-colors duration-200 hover:bg-white/10">
            <TimerReset className="h-4 w-4" />
            Reset timer
          </button>
        </div>
      </AppSurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <AppSurfaceCard>
          <AppSectionHeader
            eyebrow="Lesson queue"
            title="Current playlist"
            description="The current module queue is rendered from stable lesson data and guarded at the route layer."
          />

          <div className="mt-8 space-y-3">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.title}
                className={cx(
                  'rounded-[1.5rem] border px-4 py-4 transition-all duration-200',
                  lesson.active ? 'border-[var(--color-watashi-emerald)] bg-[var(--color-watashi-emerald)] text-white' : 'border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text-strong)]',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cx('mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', lesson.active ? 'bg-white/20 text-white' : lesson.complete ? 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_16%,var(--color-watashi-surface-card))] text-[var(--color-watashi-emerald)]' : 'bg-[var(--color-watashi-surface-card)] text-[var(--color-watashi-text)]')}>
                    {lesson.complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{lesson.title}</p>
                    <p className={cx('mt-1 text-xs', lesson.active ? 'text-white/75' : 'text-[var(--color-watashi-text-soft)]')}>{lesson.duration}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AppSurfaceCard>

        <AppSurfaceCard>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-watashi-text-soft)]">Route security</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-[var(--color-watashi-text-strong)]">Learner access enforced</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--color-watashi-text)]">
            Educators are redirected before the page renders, so the player does not need its own defensive role checks.
          </p>

          <div className="mt-6 rounded-[1.5rem] border border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-watashi-surface-contrast)] text-[var(--color-watashi-surface)]">
                <Lock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--color-watashi-text-strong)]">Protected at the route level</p>
                <p className="text-xs text-[var(--color-watashi-text)]">No hidden tabs, no client-only visibility checks.</p>
              </div>
            </div>
          </div>
        </AppSurfaceCard>
      </div>
    </div>
  )
}
