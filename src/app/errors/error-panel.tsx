import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, RefreshCcw } from 'lucide-react'

type ErrorPanelProps = {
  title: string
  message: string
  requestId?: string
  showHomeLink?: boolean
  retryLabel?: string
  onRetry?: () => void
}

export function ErrorPanel({ title, message, requestId, showHomeLink = true, retryLabel = 'Try again', onRetry }: ErrorPanelProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[560px] rounded-[32px] border border-[#e4ebf3] bg-white p-8 text-center shadow-[0_24px_48px_rgba(20,38,63,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-[32px] font-black tracking-[-0.04em] text-[#16213c]">{title}</h1>
        <p className="mt-4 text-[16px] leading-[1.75] text-[#5f6d87]">{message}</p>
        {requestId ? <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8d9ab3]">Support code: {requestId}</p> : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {onRetry ? (
            <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-[14px] bg-[#4a9378] px-5 py-3 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(64,138,113,0.24)] transition hover:bg-[#3f836b]">
              <RefreshCcw className="h-4 w-4" />
              {retryLabel}
            </button>
          ) : null}
          {showHomeLink ? (
            <Link to="/" className="inline-flex items-center gap-2 rounded-[14px] border border-[#dbe5ef] px-5 py-3 text-sm font-extrabold text-[#16213c] transition hover:bg-[#f8fbfd]">
              Back Home
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
