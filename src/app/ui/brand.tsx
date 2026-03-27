import { Link } from '@tanstack/react-router'

type WatashiMarkProps = {
  className?: string
}

type WatashiBrandProps = {
  compact?: boolean
}

export function WatashiMark({ className = '' }: WatashiMarkProps) {
  return (
    <div className={`flex items-center justify-center rounded-full bg-[linear-gradient(145deg,#4fa183_0%,#3f836b_100%)] text-white shadow-[0_14px_26px_rgba(64,138,113,0.24)] ${className}`}>
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="none" aria-hidden="true">
        <path
          d="M5.35 15.8c1.45-.9 3.05-1.35 4.8-1.35 1.63 0 3.22.45 4.75 1.35 1.03-.64 2.28-.96 3.75-.96V8.52c-1.4 0-2.65.32-3.75.96-1.53-.9-3.12-1.35-4.75-1.35-1.75 0-3.35.45-4.8 1.35v6.32Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.4 10.35c1.18-2.62 3.26-4.01 6.24-4.18"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="16.95" cy="6.05" r="1.25" fill="currentColor" />
      </svg>
    </div>
  )
}

export function WatashiBrand({ compact = false }: WatashiBrandProps) {
  return (
    <Link to="/" className="group flex items-center gap-3 rounded-full pr-2">
      <WatashiMark className={compact ? 'h-10 w-10' : 'h-11 w-11'} />
      <span className="flex flex-col">
        <span className="text-[18px] font-extrabold tracking-[-0.04em] text-[#17233f] transition-colors group-hover:text-[#0f1a31]">
          Watashi Learn
        </span>
        {!compact ? (
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a98b0]">
            AI Learning Workspace
          </span>
        ) : null}
      </span>
    </Link>
  )
}
