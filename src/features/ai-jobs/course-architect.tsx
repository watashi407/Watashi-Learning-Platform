import { startTransition, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { CheckCircle2, Loader2, RefreshCcw, Search, Sparkles } from 'lucide-react'
import { ErrorPanel } from '../../app/errors/error-panel'
import { getDisplayErrorMessage, getErrorRequestId } from '../../shared/errors'
import { resolveCourseOutline } from './client'

type Theme = { bg: string; text: string; hover: string; border: string; bgLight: string }
type Curriculum = { title: string; desc: string; modules: Array<{ name: string; detail: string }> }

function CourseArchitectBody() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)

  const generateCourse = async () => {
    if (!topic) {
      return
    }

    setLoading(true)
    setInlineError(null)

    try {
      const response = await resolveCourseOutline({ topic })
      startTransition(() => {
        setCurriculum(response)
      })
    } catch (error) {
      setInlineError(getDisplayErrorMessage(error, 'We could not build the course outline right now. Please try again.'))
      setCurriculum({
        title: `${topic} Intensive`,
        desc: `A structured starter curriculum for ${topic} with practical modules and a publish-ready outline.`,
        modules: [
          { name: 'Foundations', detail: 'Set the mental model, vocabulary, and core outcomes for the course.' },
          { name: 'Core Workflow', detail: 'Introduce the most important day-to-day techniques and decisions.' },
          { name: 'Applied Practice', detail: 'Guide learners through an exercise that turns theory into output.' },
          { name: 'Advanced Path', detail: 'Close with next steps, review prompts, and an expansion module.' },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2.5rem] border border-[var(--color-watashi-border)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-watashi-surface-card)_96%,white),color-mix(in_oklab,var(--color-watashi-surface-low)_94%,white))] p-8 shadow-[var(--shadow-watashi-panel)]">
        <div className="mb-8 max-w-xl"><h3 className="mb-2 flex items-center gap-2 text-2xl font-black text-[var(--color-watashi-text-strong)]">Smart Course Architect <Sparkles className="h-6 w-6 text-[var(--color-watashi-indigo)]" /></h3><p className="text-sm text-[var(--color-watashi-text)]">Describe what you want to teach and the assistant will draft a clean, publish-ready structure.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-watashi-text-soft)]" /><input type="text" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Modern Architecture with Rust" className="w-full rounded-2xl bg-[var(--color-watashi-surface-card)] py-4 pl-12 pr-6 text-[var(--color-watashi-text-strong)] outline-none ring-1 ring-[var(--color-watashi-border)] transition-all placeholder:text-[var(--color-watashi-text-soft)] focus:ring-2 focus:ring-[var(--color-watashi-indigo)]" /></div><button onClick={() => void generateCourse()} disabled={loading || !topic} className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[linear-gradient(135deg,var(--color-watashi-indigo),color-mix(in_oklab,var(--color-watashi-indigo)_78%,white))] px-8 py-4 font-bold text-white shadow-xl shadow-indigo-600/20 transition-all active:scale-95 hover:brightness-105 disabled:bg-[var(--color-watashi-surface-high)] disabled:text-[var(--color-watashi-text-soft)]">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}Generate Syllabus</button></div>
        {inlineError ? <p className="mt-4 text-sm font-semibold text-rose-600">{inlineError}</p> : null}
      </section>
      {curriculum ? <div className="animate-in zoom-in-95 relative overflow-hidden rounded-[2.5rem] bg-[linear-gradient(145deg,color-mix(in_oklab,var(--color-watashi-indigo)_74%,var(--color-watashi-surface-card)),color-mix(in_oklab,var(--color-watashi-surface-card)_84%,black))] p-10 text-white duration-500"><div className="relative z-10"><div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/72"><CheckCircle2 className="h-4 w-4" /> Curriculum Drafted by Gemini</div><h2 className="mb-3 text-4xl font-black">{curriculum.title}</h2><p className="mb-10 max-w-2xl text-lg leading-relaxed text-white/76">{curriculum.desc}</p><div className="grid gap-6 md:grid-cols-3">{curriculum.modules.map((module, index) => <div key={`${module.name}-${index}`} className="group rounded-3xl border border-white/12 bg-white/8 p-6 backdrop-blur-md transition-colors hover:bg-white/12"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/14 text-lg font-black">{index + 1}</div><h4 className="mb-2 text-lg font-bold transition-colors group-hover:text-white">{module.name}</h4><p className="text-sm leading-relaxed text-white/72">{module.detail}</p></div>)}</div><div className="mt-12 flex gap-4"><button className="rounded-2xl bg-[var(--color-watashi-surface-contrast)] px-8 py-4 text-lg font-black text-[var(--color-watashi-indigo)] shadow-xl transition-transform hover:scale-105 active:scale-95">Adopt This Path</button><button onClick={() => setCurriculum(null)} className="rounded-2xl px-8 py-4 font-bold text-white/72 transition-colors hover:text-white">Discard</button></div></div><div className="absolute right-0 top-0 rotate-12 scale-150 p-12 opacity-10"><RefreshCcw className="h-64 w-64" /></div></div> : null}
    </div>
  )
}

export function CourseArchitect({ theme: _theme }: { theme: Theme }) {
  return (
    <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
      <ErrorPanel
        title="Course planner unavailable"
        message={getDisplayErrorMessage(error, 'We could not open the course planner right now. Please try again.')}
        requestId={getErrorRequestId(error)}
        showHomeLink={false}
        onRetry={resetErrorBoundary}
      />
    )}>
      <CourseArchitectBody />
    </ErrorBoundary>
  )
}
