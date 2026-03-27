import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { SubtitleCue, TextOverlay, VideoEffects } from '../types/video-project.types'

function buildCssFilter(effects: VideoEffects) {
  const parts: string[] = []
  if (effects.brightness !== 0) parts.push(`brightness(${1 + effects.brightness / 100})`)
  if (effects.contrast !== 0) parts.push(`contrast(${1 + effects.contrast / 100})`)
  if (effects.saturation !== 0) parts.push(`saturate(${1 + effects.saturation / 100})`)
  if (effects.blur > 0) parts.push(`blur(${effects.blur}px)`)
  return parts.join(' ') || 'none'
}

function textPositionClass(position: TextOverlay['position']) {
  if (position === 'top') return 'top-4 left-1/2 -translate-x-1/2'
  if (position === 'bottom') return 'bottom-10 left-1/2 -translate-x-1/2'
  return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
}

function fontFamilyStyle(family: TextOverlay['fontFamily']) {
  if (family === 'serif') return 'Georgia, serif'
  if (family === 'mono') return '"Courier New", monospace'
  return 'system-ui, sans-serif'
}

type EditorCanvasProps = {
  sourceUrl: string | null
  effects: VideoEffects
  textOverlays: TextOverlay[]
  subtitleCues: SubtitleCue[]
  currentTime: number
  totalDuration: number
  onTimeUpdate: (seconds: number) => void
  onScrub: (seconds: number) => void
  videoRef: RefObject<HTMLVideoElement | null>
}

export function EditorCanvas({
  sourceUrl,
  effects,
  textOverlays,
  subtitleCues,
  currentTime,
  totalDuration,
  onTimeUpdate,
  onScrub,
  videoRef,
}: EditorCanvasProps) {
  const scrubBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.style.filter = buildCssFilter(effects)
  }, [effects, videoRef])

  const activeTextOverlays = textOverlays.filter(
    (t) => currentTime >= t.startSeconds && currentTime <= t.endSeconds,
  )

  const activeCue = subtitleCues.find((cue) => {
    function parseLabel(label: string) {
      const [h = '0', m = '0', s = '0'] = label.split(':')
      return Number(h) * 3600 + Number(m) * 60 + Number(s)
    }
    return currentTime >= parseLabel(cue.startLabel) && currentTime <= parseLabel(cue.endLabel)
  })

  const playheadPct = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0

  function handleScrubClick(e: React.MouseEvent<HTMLDivElement>) {
    const bar = scrubBarRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onScrub(pct * totalDuration)
  }

  return (
    <div className="relative flex flex-col bg-[#0e1117]">
      {/* Video */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {sourceUrl ? (
          <video
            ref={videoRef}
            src={sourceUrl}
            className="max-h-full max-w-full object-contain"
            controls={false}
            onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
            style={{ filter: buildCssFilter(effects) }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center text-white/40">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <p className="text-sm font-medium">No source loaded</p>
            <p className="max-w-[200px] text-[12px] leading-5">Upload or record a clip to begin editing</p>
          </div>
        )}

        {/* Text overlays */}
        {activeTextOverlays.map((overlay) => (
          <div
            key={overlay.id}
            className={`pointer-events-none absolute ${textPositionClass(overlay.position)}`}
            style={{
              fontFamily: fontFamilyStyle(overlay.fontFamily),
              fontSize: overlay.fontSize,
              color: overlay.color,
              backgroundColor: overlay.bgColor ?? undefined,
              padding: overlay.bgColor ? '4px 10px' : undefined,
              borderRadius: overlay.bgColor ? 6 : undefined,
            }}
          >
            {overlay.text}
          </div>
        ))}

        {/* Subtitle bar */}
        {activeCue && (
          <div className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 max-w-[80%] rounded-lg bg-black/70 px-4 py-2 text-center text-sm font-medium text-white">
            {activeCue.text}
          </div>
        )}
      </div>

      {/* Scrub bar */}
      <div
        ref={scrubBarRef}
        role="slider"
        aria-label="Video scrubber"
        aria-valuenow={Math.round(currentTime)}
        aria-valuemin={0}
        aria-valuemax={Math.round(totalDuration)}
        tabIndex={0}
        className="relative h-8 cursor-pointer bg-[#1a1f2e]"
        onClick={handleScrubClick}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') onScrub(Math.max(0, currentTime - 5))
          if (e.key === 'ArrowRight') onScrub(Math.min(totalDuration, currentTime + 5))
        }}
      >
        <div className="absolute inset-0 flex items-center px-1">
          <div className="relative h-1.5 w-full rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[var(--color-watashi-indigo)]" style={{ width: `${playheadPct}%` }} />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
              style={{ left: `${playheadPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
