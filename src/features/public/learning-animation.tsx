import { BadgeCheck, BookOpen, Play } from 'lucide-react'

function OrbNode({
  className,
  label,
  tone,
  children,
}: {
  className: string
  label: string
  tone: 'white' | 'violet' | 'mint'
  children: React.ReactNode
}) {
  const shellClasses = tone === 'mint'
    ? 'border-white/75 bg-[radial-gradient(circle_at_30%_28%,#ffffff_0%,#daf8ee_36%,#bdf1e0_100%)] text-[#176851] shadow-[0_30px_55px_rgba(79,153,126,0.22)]'
    : tone === 'violet'
      ? 'border-white/80 bg-[radial-gradient(circle_at_30%_28%,#ffffff_0%,#f1ecff_38%,#ddd5ff_100%)] text-[#4b41e1] shadow-[0_26px_48px_rgba(111,97,230,0.2)]'
      : 'border-white/85 bg-[radial-gradient(circle_at_30%_28%,#ffffff_0%,#ffffff_38%,#f2f5fb_100%)] text-[#7d8da8] shadow-[0_24px_42px_rgba(19,37,72,0.12)]'

  return (
    <div className={`absolute flex flex-col items-center ${className}`}>
      <div className={`flex h-full w-full items-center justify-center rounded-full border ${shellClasses}`}>
        <div className="flex h-[38%] w-[38%] items-center justify-center rounded-full bg-white/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
          {children}
        </div>
      </div>
      <span className="mt-4 text-[10px] font-extrabold tracking-[0.22em] text-[#a1afc5]">{label}</span>
    </div>
  )
}

export function LearningAnimation() {
  return (
    <div className="relative h-full w-full max-w-[640px]">
      <div className="absolute inset-0 rounded-[56px] bg-[radial-gradient(circle_at_18%_26%,rgba(255,255,255,0.92),transparent_34%),radial-gradient(circle_at_80%_18%,rgba(184,242,223,0.72),transparent_28%),radial-gradient(circle_at_55%_58%,rgba(233,235,254,0.75),transparent_26%),radial-gradient(circle_at_45%_88%,rgba(255,255,255,0.8),transparent_30%)]" />
      <div className="absolute left-[18%] top-[16%] h-[76px] w-[76px] rounded-full border border-dashed border-[#dce4f1] opacity-80" />
      <div className="absolute left-[66%] top-[10%] h-2.5 w-2.5 rounded-full bg-[#111827]" />
      <div className="absolute left-[58%] top-[64%] h-1.5 w-1.5 rounded-full bg-[#176851]" />
      <div className="absolute left-[72%] top-[55%] h-2 w-2 rounded-full bg-[#4b41e1]" />
      <div className="absolute left-[31%] top-[70%] h-2 w-2 rounded-full bg-[#cbd5e1]" />

      <div className="absolute left-[29%] top-[10%] rotate-[-10deg] rounded-[20px] border border-white/85 bg-white/90 px-4 py-3 shadow-[0_18px_34px_rgba(17,34,68,0.1)]">
        <div className="text-[11px] font-black leading-none tracking-[-0.04em] text-[#16213c]">0 to 100X</div>
        <div className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.18em] text-[#9aa9bf]">Curated Paths</div>
      </div>

      <svg viewBox="0 0 640 520" className="absolute inset-0 h-full w-full overflow-visible">
        <path
          d="M208 390C300 352 316 246 402 214C447 197 476 171 516 112"
          fill="none"
          stroke="#bfd0cb"
          strokeWidth="4"
          strokeDasharray="10 14"
          strokeLinecap="round"
          className="animate-[dash_15s_linear_infinite]"
        />
      </svg>

      <OrbNode className="left-[22%] top-[61%] h-[110px] w-[110px] animate-[float_7s_ease-in-out_infinite]" label="PHASE ZERO" tone="white">
        <BookOpen className="h-7 w-7" strokeWidth={1.8} />
      </OrbNode>

      <OrbNode className="left-[48%] top-[40%] h-[122px] w-[122px] animate-[float_8s_ease-in-out_infinite_0.8s]" label="THE DEEP DIVE" tone="violet">
        <Play className="ml-1 h-7 w-7 fill-current" strokeWidth={1.8} />
      </OrbNode>

      <OrbNode className="left-[64%] top-[14%] h-[160px] w-[160px] animate-[float_9s_ease-in-out_infinite_1.4s]" label="THE HERO" tone="mint">
        <BadgeCheck className="h-8 w-8" strokeWidth={1.8} />
      </OrbNode>
    </div>
  )
}
