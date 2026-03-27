import { startTransition, useEffect, useEffectEvent, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Loader2, RefreshCcw, Sparkles } from 'lucide-react'
import type { AuthSession } from '../../shared/contracts/auth'
import { ErrorPanel } from '../../app/errors/error-panel'
import { getDisplayErrorMessage, getErrorRequestId } from '../../shared/errors'
import { resolveStudyPath } from './client'

type Theme = { bg: string; text: string; hover: string; border: string; bgLight: string }
type StudyAdvice = { pivot: string; tip: string }

function StudyPathCardBody({ user, theme }: { user: AuthSession; theme: Theme }) {
  const [advice, setAdvice] = useState<StudyAdvice | null>(null)
  const [loading, setLoading] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  const loadAdvice = useEffectEvent(async () => {
    setLoading(true)
    setInlineError(null)

    try {
      const response = await resolveStudyPath({
        learnerName: user.name,
        currentCourses: [
          { title: 'Tailwind CSS', progress: 78 },
          { title: 'UI Design Psychology', progress: 32 },
        ],
      })

      startTransition(() => {
        setAdvice(response)
      })
    } catch (error) {
      setInlineError(getDisplayErrorMessage(error, 'We could not refresh your study plan right now. Please try again.'))
      setAdvice({ pivot: 'Consider exploring advanced React patterns next.', tip: 'Set a 25-minute timer to enter flow state.' })
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    void loadAdvice()
  }, [])

  return (
    <div
      className={`group relative mb-10 overflow-hidden rounded-[2.5rem] border p-6 shadow-[var(--shadow-watashi-panel)] ${theme.bgLight} ${theme.border}`}
    >
      <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-4"><div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-[#408A71]/20 ${theme.bg}`}><Sparkles className="h-7 w-7" /></div><div><h4 className={`mb-0.5 text-lg font-black ${theme.text}`}>AI Study Path</h4><p className="text-sm font-medium text-[var(--color-watashi-text)]">Personalized for you today</p></div></div>
        <div className="max-w-xl flex-1">
          {loading ? <div className="flex items-center gap-3 text-[var(--color-watashi-text-soft)]"><Loader2 className="h-5 w-5 animate-spin" /><span className="animate-pulse text-sm">Analyzing your learning trajectory...</span></div> : <div className="animate-in fade-in duration-700"><p className="mb-1 text-sm font-bold italic text-[var(--color-watashi-text-strong)]">&quot;{advice?.pivot}&quot;</p><p className="text-xs text-[var(--color-watashi-text)]">Pivot Tip: {advice?.tip}</p>{inlineError ? <p className="mt-3 text-xs font-semibold text-rose-600">{inlineError}</p> : null}</div>}
        </div>
        <button
          onClick={() => void loadAdvice()}
          disabled={loading}
          className="rounded-xl border border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)] p-3 text-[var(--color-watashi-text-soft)] shadow-[var(--shadow-watashi-panel)] transition-all hover:scale-105 hover:text-[var(--color-watashi-text-strong)] active:scale-95"
        >
          <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="absolute -bottom-10 -right-10 opacity-5 transition-transform duration-700 group-hover:rotate-12"><RefreshCcw className="h-48 w-48" /></div>
    </div>
  )
}

export function StudyPathCard({ user, theme }: { user: AuthSession; theme: Theme }) {
  return (
    <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
      <ErrorPanel
        title="Study plan unavailable"
        message={getDisplayErrorMessage(error, 'We could not load your study plan right now. Please try again.')}
        requestId={getErrorRequestId(error)}
        showHomeLink={false}
        onRetry={resetErrorBoundary}
      />
    )}>
      <StudyPathCardBody user={user} theme={theme} />
    </ErrorBoundary>
  )
}
