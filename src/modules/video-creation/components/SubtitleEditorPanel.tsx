import { Loader2, Sparkles } from 'lucide-react'
import type { ProcessingJobStatus, SubtitleCue } from '../types/video-project.types'
import { FeatureBadge, WorkspacePanel } from '../../../shared/ui/workspace'

function subtitleStatusLabel(status: ProcessingJobStatus) {
  if (status === 'processing' || status === 'queued') {
    return 'Generating'
  }

  if (status === 'completed') {
    return 'Ready'
  }

  if (status === 'failed') {
    return 'Needs attention'
  }

  return 'Manual'
}

export function SubtitleEditorPanel({
  cues,
  status,
  onCueChange,
  onAddCue,
  onAutoGenerate,
}: {
  cues: SubtitleCue[]
  status: ProcessingJobStatus
  onCueChange: (cueId: string, field: keyof SubtitleCue, value: string) => void
  onAddCue: () => void
  onAutoGenerate: () => void
}) {
  return (
    <WorkspacePanel className="bg-[linear-gradient(180deg,#121922,#0d141b)] text-white ring-[color-mix(in_oklab,white_10%,transparent)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <FeatureBadge className="bg-white/10 text-white">Subtitles</FeatureBadge>
          <h2 className="mt-3 font-display text-[1.8rem] font-black tracking-[-0.05em] text-white">Generate and refine caption tracks</h2>
        </div>
        <button
          type="button"
          onClick={onAutoGenerate}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-950 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)]"
        >
          {status === 'processing' || status === 'queued' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Auto-generate
        </button>
      </div>

      <div className="mt-4 inline-flex rounded-full bg-white/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-watashi-emerald)]">
        {subtitleStatusLabel(status)}
      </div>

      <div className="mt-6 space-y-4">
        {cues.map((cue) => (
          <div key={cue.id} className="rounded-[1.5rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
            <div className="grid gap-3 md:grid-cols-[120px_120px_minmax(0,1fr)]">
              <label className="block">
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Start</span>
                <input
                  value={cue.startLabel}
                  onChange={(event) => onCueChange(cue.id, 'startLabel', event.target.value)}
                  className="mt-2 w-full rounded-[1rem] border-none bg-black/25 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">End</span>
                <input
                  value={cue.endLabel}
                  onChange={(event) => onCueChange(cue.id, 'endLabel', event.target.value)}
                  className="mt-2 w-full rounded-[1rem] border-none bg-black/25 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Subtitle text</span>
                <textarea
                  value={cue.text}
                  onChange={(event) => onCueChange(cue.id, 'text', event.target.value)}
                  className="mt-2 min-h-24 w-full resize-none rounded-[1rem] border-none bg-black/25 px-3 py-3 text-sm leading-6 text-white outline-none ring-1 ring-white/10"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddCue}
        className="mt-5 rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-bold text-white"
      >
        Add subtitle cue
      </button>
    </WorkspacePanel>
  )
}
