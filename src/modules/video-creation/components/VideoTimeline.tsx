import { ArrowDown, ArrowUp, Scissors } from 'lucide-react'
import { formatDuration } from '../services/mediaValidation'
import type { VideoSegment } from '../types/video-project.types'
import { FeatureBadge, WorkspaceEyebrow, WorkspacePanel } from '../../../shared/ui/workspace'

export function VideoTimeline({
  segments,
  totalDurationSeconds,
  onMoveSegment,
  onUpdateSegment,
}: {
  segments: VideoSegment[]
  totalDurationSeconds: number
  onMoveSegment: (segmentId: string, direction: 'up' | 'down') => void
  onUpdateSegment: (segmentId: string, field: 'startSeconds' | 'endSeconds', value: number) => void
}) {
  const safeTotalDuration = Math.max(1, totalDurationSeconds)

  return (
    <WorkspacePanel className="bg-[linear-gradient(180deg,#121922,#0d141b)] text-white ring-[color-mix(in_oklab,white_10%,transparent)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <FeatureBadge className="bg-white/10 text-white">Timeline</FeatureBadge>
          <h2 className="mt-3 font-display text-[1.8rem] font-black tracking-[-0.05em] text-white">Trim and arrange lesson segments</h2>
        </div>
        <div className="rounded-[1.4rem] bg-white/6 px-4 py-3 text-right ring-1 ring-white/8">
          <WorkspaceEyebrow className="text-white/50">Total duration</WorkspaceEyebrow>
          <p className="mt-2 text-lg font-black text-white">{formatDuration(safeTotalDuration)}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {segments.map((segment, index) => {
          const spanSeconds = Math.max(15, segment.endSeconds - segment.startSeconds)
          const spanWidth = Math.max(18, (spanSeconds / safeTotalDuration) * 100)

          return (
            <div key={segment.id} className="rounded-[1.7rem] bg-white/6 px-5 py-5 ring-1 ring-white/8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <WorkspaceEyebrow className="text-white/45">Segment {String(index + 1).padStart(2, '0')}</WorkspaceEyebrow>
                  <h3 className="mt-2 text-lg font-bold text-white">{segment.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/64">{segment.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onMoveSegment(segment.id, 'up')}
                    disabled={index === 0}
                    className="rounded-full bg-white/8 p-2 text-white/70 ring-1 ring-white/10 transition-colors hover:text-white disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveSegment(segment.id, 'down')}
                    disabled={index === segments.length - 1}
                    className="rounded-full bg-white/8 p-2 text-white/70 ring-1 ring-white/10 transition-colors hover:text-white disabled:opacity-40"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-full bg-black/30 p-2">
                <div className="flex h-4 items-center rounded-full bg-white/8 px-1">
                  <div className={`h-full rounded-full ${segment.tone}`} style={{ width: `${spanWidth}%` }} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
                <label className="block">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Trim in</span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, safeTotalDuration - 30)}
                    value={Math.min(segment.startSeconds, Math.max(0, safeTotalDuration - 30))}
                    onChange={(event) => onUpdateSegment(segment.id, 'startSeconds', Number(event.target.value))}
                    className="mt-3 w-full accent-[var(--color-watashi-indigo)]"
                  />
                  <p className="mt-2 text-sm font-semibold text-white">{formatDuration(segment.startSeconds)}</p>
                </label>

                <label className="block">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Trim out</span>
                  <input
                    type="range"
                    min={Math.min(segment.startSeconds + 15, safeTotalDuration)}
                    max={safeTotalDuration}
                    value={Math.max(segment.endSeconds, Math.min(segment.startSeconds + 15, safeTotalDuration))}
                    onChange={(event) => onUpdateSegment(segment.id, 'endSeconds', Number(event.target.value))}
                    className="mt-3 w-full accent-[var(--color-watashi-emerald)]"
                  />
                  <p className="mt-2 text-sm font-semibold text-white">{formatDuration(segment.endSeconds)}</p>
                </label>

                <div className="rounded-[1.3rem] bg-black/25 px-4 py-4 text-sm text-white/72 ring-1 ring-white/10">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Scissors className="h-4 w-4 text-[var(--color-watashi-indigo)]" />
                    Span
                  </div>
                  <p className="mt-2">{formatDuration(spanSeconds)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </WorkspacePanel>
  )
}
