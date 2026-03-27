import { useRef } from 'react'
import type { ImageOverlay, SubtitleCue, TextOverlay, VideoSegment } from '../types/video-project.types'
import { cx } from '../../../shared/ui/workspace'

function clampPct(value: number) {
  return Math.min(100, Math.max(0, value))
}

function parseTimestampLabel(label: string) {
  const [h = '0', m = '0', s = '0'] = label.split(':')
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

type Track = {
  id: string
  label: string
  color: string
}

const tracks: Track[] = [
  { id: 'video', label: 'Video', color: 'bg-[var(--color-watashi-indigo)]/70' },
  { id: 'audio', label: 'Audio', color: 'bg-[var(--color-watashi-emerald)]/70' },
  { id: 'text', label: 'Text', color: 'bg-amber-400/70' },
  { id: 'subs', label: 'Subs', color: 'bg-pink-400/70' },
]

type Block = {
  id: string
  left: number
  width: number
  label: string
}

type EditorTimelineProps = {
  totalDuration: number
  currentTime: number
  segments: VideoSegment[]
  subtitleCues: SubtitleCue[]
  textOverlays: TextOverlay[]
  imageOverlays: ImageOverlay[]
  onSeek: (seconds: number) => void
  onTrimSegment: (id: string, field: 'startSeconds' | 'endSeconds', value: number) => void
}

export function EditorTimeline({
  totalDuration,
  currentTime,
  segments,
  subtitleCues,
  textOverlays,
  imageOverlays,
  onSeek,
  onTrimSegment,
}: EditorTimelineProps) {
  const rulerRef = useRef<HTMLDivElement>(null)
  const dur = Math.max(1, totalDuration)
  const playheadPct = clampPct((currentTime / dur) * 100)

  const videoBlocks: Block[] = segments.map((seg) => ({
    id: seg.id,
    left: clampPct((seg.startSeconds / dur) * 100),
    width: clampPct(((seg.endSeconds - seg.startSeconds) / dur) * 100),
    label: seg.title,
  }))

  const subsBlocks: Block[] = subtitleCues.map((cue) => {
    const start = parseTimestampLabel(cue.startLabel)
    const end = parseTimestampLabel(cue.endLabel)
    return {
      id: cue.id,
      left: clampPct((start / dur) * 100),
      width: clampPct(((end - start) / dur) * 100),
      label: cue.text.slice(0, 24),
    }
  })

  const textBlocks: Block[] = textOverlays.map((t) => ({
    id: t.id,
    left: clampPct((t.startSeconds / dur) * 100),
    width: clampPct(((t.endSeconds - t.startSeconds) / dur) * 100),
    label: t.text.slice(0, 20),
  }))

  // Audio track: show a single solid bar representing the source duration (conceptual)
  const audioBlocks: Block[] = segments.length > 0
    ? [{ id: 'audio-main', left: 0, width: clampPct((segments[segments.length - 1].endSeconds / dur) * 100), label: 'Source audio' }]
    : []

  const blocksByTrack: Record<string, Block[]> = {
    video: videoBlocks,
    audio: audioBlocks,
    text: textBlocks,
    subs: subsBlocks,
  }

  function handleRulerClick(e: React.MouseEvent<HTMLDivElement>) {
    const ruler = rulerRef.current
    if (!ruler) return
    const rect = ruler.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(pct * dur)
  }

  const tickCount = 8
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (i / tickCount) * dur)

  return (
    <div className="flex flex-col border-t border-[var(--color-watashi-border)] bg-[#0e1117] text-white select-none">
      {/* Ruler */}
      <div
        ref={rulerRef}
        className="relative h-6 cursor-pointer border-b border-white/10 bg-[#141920]"
        onClick={handleRulerClick}
      >
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${clampPct((t / dur) * 100)}%` }}
          >
            <div className="h-2 w-px bg-white/20" />
            <span className="mt-0.5 text-[9px] font-mono text-white/40 -translate-x-1/2">{formatTime(t)}</span>
          </div>
        ))}

        {/* Playhead */}
        <div
          className="pointer-events-none absolute top-0 z-10 h-full w-0.5 bg-[var(--color-watashi-indigo)]"
          style={{ left: `${playheadPct}%` }}
        >
          <div className="absolute -top-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--color-watashi-indigo)]" />
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => {
          const blocks = blocksByTrack[track.id] ?? []
          return (
            <div key={track.id} className="flex items-center border-b border-white/5">
              {/* Track label */}
              <div className="flex w-14 shrink-0 items-center justify-end border-r border-white/10 px-2 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{track.label}</span>
              </div>

              {/* Track lane */}
              <div className="relative flex-1 h-9">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className={cx(
                      'absolute top-1 bottom-1 rounded overflow-hidden flex items-center px-2',
                      track.color,
                    )}
                    style={{ left: `${block.left}%`, width: `${Math.max(block.width, 1)}%` }}
                    title={block.label}
                  >
                    <span className="truncate text-[10px] font-semibold text-white">{block.label}</span>

                    {/* Trim handles on video track */}
                    {track.id === 'video' && (
                      <>
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize bg-white/30 hover:bg-white/60"
                          onMouseDown={(startEvent) => {
                            const seg = segments.find((s) => s.id === block.id)
                            if (!seg) return
                            const ruler = rulerRef.current
                            if (!ruler) return
                            const rulerRect = ruler.getBoundingClientRect()
                            function onMove(moveEvent: MouseEvent) {
                              const pct = Math.max(0, Math.min(1, (moveEvent.clientX - rulerRect.left) / rulerRect.width))
                              onTrimSegment(block.id, 'startSeconds', pct * dur)
                            }
                            function onUp() {
                              window.removeEventListener('mousemove', onMove)
                              window.removeEventListener('mouseup', onUp)
                            }
                            window.addEventListener('mousemove', onMove)
                            window.addEventListener('mouseup', onUp)
                            startEvent.preventDefault()
                          }}
                        />
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-white/30 hover:bg-white/60"
                          onMouseDown={(startEvent) => {
                            const seg = segments.find((s) => s.id === block.id)
                            if (!seg) return
                            const ruler = rulerRef.current
                            if (!ruler) return
                            const rulerRect = ruler.getBoundingClientRect()
                            function onMove(moveEvent: MouseEvent) {
                              const pct = Math.max(0, Math.min(1, (moveEvent.clientX - rulerRect.left) / rulerRect.width))
                              onTrimSegment(block.id, 'endSeconds', pct * dur)
                            }
                            function onUp() {
                              window.removeEventListener('mousemove', onMove)
                              window.removeEventListener('mouseup', onUp)
                            }
                            window.addEventListener('mousemove', onMove)
                            window.addEventListener('mouseup', onUp)
                            startEvent.preventDefault()
                          }}
                        />
                      </>
                    )}
                  </div>
                ))}

                {/* Playhead line over track */}
                <div
                  className="pointer-events-none absolute top-0 h-full w-0.5 bg-[var(--color-watashi-indigo)]/60"
                  style={{ left: `${playheadPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
