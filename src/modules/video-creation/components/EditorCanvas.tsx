import { GripVertical, Maximize2, Pause, Play, Settings, SkipBack, SkipForward, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { SubtitleCue, TextOverlay, VideoEffects } from '../types/video-project.types'
import {
  clampMediaOffset,
  formatTimestamp,
  getPreviewMediaDuration,
  getPreviewRestartTime,
  isPreviewPlaybackWindowAtEnd,
  mapPreviewMediaTimeToTimelineTime,
  parseTimestampLabel,
  shouldHandlePlaybackShortcut,
} from '../services/editorHelpers'
import { cx } from '../../../shared/ui/workspace'

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
  if (position === 'bottom') return 'bottom-16 left-1/2 -translate-x-1/2'
  return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
}

function fontFamilyStyle(family: TextOverlay['fontFamily']) {
  if (family === 'serif') return 'Georgia, serif'
  if (family === 'mono') return '"Courier New", monospace'
  return 'system-ui, sans-serif'
}


type EditorCanvasProps = {
  sourceUrl: string | null
  sourceTimelineStartSeconds: number
  sourceMediaOffsetSeconds: number
  sourceTimelineEndSeconds?: number
  isPlaybackActive: boolean
  effects: VideoEffects
  textOverlays: TextOverlay[]
  imageOverlays: Array<{
    id: string
    label: string
    objectUrl: string | null
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    opacity: number
    startSeconds: number
    endSeconds: number
    x?: number
    y?: number
  }>
  subtitleCues: SubtitleCue[]
  currentTime: number
  totalDuration: number
  onTimeUpdate: (seconds: number) => void
  onScrub: (seconds: number) => void
  onPlaybackChange: (isPlaying: boolean) => void
  videoRef: RefObject<HTMLVideoElement | null>
  onTextOverlayMove?: (id: string, x: number, y: number) => void
  onImageOverlayMove?: (id: string, x: number, y: number) => void
  onDeleteTextOverlay?: (id: string) => void
  onDeleteImageOverlay?: (id: string) => void
}

export function EditorCanvas({
  sourceUrl,
  sourceTimelineStartSeconds,
  sourceMediaOffsetSeconds,
  sourceTimelineEndSeconds,
  isPlaybackActive,
  effects,
  textOverlays,
  imageOverlays,
  subtitleCues,
  currentTime,
  totalDuration,
  onTimeUpdate,
  onScrub,
  onPlaybackChange,
  videoRef,
  onTextOverlayMove,
  onImageOverlayMove,
  onDeleteTextOverlay,
  onDeleteImageOverlay,
}: EditorCanvasProps) {
  const progressBarRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayDragRef = useRef<{
    id: string; type: 'text' | 'image'
    startMouseX: number; startMouseY: number
    startX: number; startY: number
  } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [draggingOverlayId, setDraggingOverlayId] = useState<string | null>(null)
  const [selectedCanvasItemId, setSelectedCanvasItemId] = useState<string | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const desiredPlaybackRef = useRef(isPlaybackActive)

  useEffect(() => {
    desiredPlaybackRef.current = isPlaybackActive
  }, [isPlaybackActive])

  const playbackWindow = useMemo(() => ({
    timelineStartSeconds: sourceTimelineStartSeconds,
    mediaOffsetSeconds: sourceMediaOffsetSeconds,
    timelineEndSeconds: sourceTimelineEndSeconds,
  }), [sourceMediaOffsetSeconds, sourceTimelineEndSeconds, sourceTimelineStartSeconds])

  const getPreviewDuration = useCallback(() => {
    const video = videoRef.current
    return getPreviewMediaDuration(
      playbackWindow,
      Number.isFinite(video?.duration) ? video.duration : null,
    )
  }, [playbackWindow, videoRef])

  const syncVideoPosition = useCallback(() => {
    const video = videoRef.current
    if (!video || !sourceUrl) return
    const desiredTime = clampMediaOffset(sourceMediaOffsetSeconds, getPreviewDuration())
    if (Math.abs(video.currentTime - desiredTime) > 0.35) {
      video.currentTime = desiredTime
    }
  }, [getPreviewDuration, sourceMediaOffsetSeconds, sourceUrl, videoRef])

  const syncVideoPlayback = useCallback(() => {
    const video = videoRef.current
    if (!video || !sourceUrl) { setIsPlaying(false); return }
    if (!isPlaybackActive) {
      if (!video.paused) video.pause()
      return
    }
    void video.play().catch(() => setIsPlaying(false))
  }, [isPlaybackActive, sourceUrl, videoRef])

  useEffect(() => {
    const video = videoRef.current
    if (!video) { setIsPlaying(false); return }
    if (!sourceUrl) { video.pause(); setIsPlaying(false); return }
    setIsPlaying(!video.paused && !video.ended)
  }, [sourceUrl, videoRef])

  useEffect(() => { syncVideoPosition() }, [syncVideoPosition])
  useEffect(() => { syncVideoPlayback() }, [syncVideoPlayback])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !sourceUrl) return
    function handleMediaReady() {
      syncVideoPosition()
      if (desiredPlaybackRef.current) syncVideoPlayback()
    }
    video.addEventListener('loadedmetadata', handleMediaReady)
    video.addEventListener('canplay', handleMediaReady)
    return () => {
      video.removeEventListener('loadedmetadata', handleMediaReady)
      video.removeEventListener('canplay', handleMediaReady)
    }
  }, [sourceUrl, syncVideoPlayback, syncVideoPosition, videoRef])

  const activeTextOverlays = useMemo(
    () => textOverlays.filter((t) => currentTime >= t.startSeconds && currentTime <= t.endSeconds),
    [textOverlays, currentTime],
  )

  const activeCue = useMemo(
    () => subtitleCues.find((cue) =>
      currentTime >= parseTimestampLabel(cue.startLabel) && currentTime <= parseTimestampLabel(cue.endLabel)
    ),
    [subtitleCues, currentTime],
  )

  const playheadPct = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const bar = progressBarRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onScrub(pct * totalDuration)
  }

  const togglePlayback = useCallback(() => {
    const video = videoRef.current
    if (!video || !sourceUrl) return
    if (isPlaybackActive) { onPlaybackChange(false); return }
    if (video.ended || isPreviewPlaybackWindowAtEnd(playbackWindow, getPreviewDuration())) {
      onScrub(getPreviewRestartTime(playbackWindow))
    }
    onPlaybackChange(true)
  }, [getPreviewDuration, isPlaybackActive, onPlaybackChange, onScrub, playbackWindow, sourceUrl, videoRef])

  useEffect(() => {
    if (!sourceUrl) return
    function handleWindowKeyDown(event: KeyboardEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null
      if (!shouldHandlePlaybackShortcut({
        key: event.key,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        targetTagName: target?.tagName ?? null,
        targetIsContentEditable: target?.isContentEditable ?? false,
      })) return
      event.preventDefault()
      togglePlayback()
    }
    window.addEventListener('keydown', handleWindowKeyDown)
    return () => window.removeEventListener('keydown', handleWindowKeyDown)
  }, [sourceUrl, togglePlayback])

  const activeImageOverlays = useMemo(
    () => imageOverlays.filter((image) => image.objectUrl && currentTime >= image.startSeconds && currentTime <= image.endSeconds),
    [imageOverlays, currentTime],
  )

  function scheduleHideControls() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    setShowControls(true)
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 2500)
    }
  }

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    } else {
      scheduleHideControls()
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  function getOverlayInitialXY(overlay: { x?: number; y?: number; position: string }): { x: number; y: number } {
    if (overlay.x !== undefined && overlay.y !== undefined) return { x: overlay.x, y: overlay.y }
    const p = overlay.position
    if (p === 'top') return { x: 50, y: 8 }
    if (p === 'bottom') return { x: 50, y: 82 }
    if (p === 'top-left') return { x: 12, y: 8 }
    if (p === 'top-right') return { x: 88, y: 8 }
    if (p === 'bottom-left') return { x: 12, y: 82 }
    if (p === 'bottom-right') return { x: 88, y: 82 }
    return { x: 50, y: 50 }
  }

  function startOverlayDrag(e: React.MouseEvent, id: string, type: 'text' | 'image', initial: { x: number; y: number }) {
    e.stopPropagation()
    e.preventDefault()
    setDraggingOverlayId(id)
    overlayDragRef.current = { id, type, startMouseX: e.clientX, startMouseY: e.clientY, startX: initial.x, startY: initial.y }

    function onMove(ev: MouseEvent) {
      const d = overlayDragRef.current
      const container = containerRef.current
      if (!d || !container) return
      const rect = container.getBoundingClientRect()
      const newX = Math.max(5, Math.min(95, d.startX + ((ev.clientX - d.startMouseX) / rect.width) * 100))
      const newY = Math.max(5, Math.min(95, d.startY + ((ev.clientY - d.startMouseY) / rect.height) * 100))
      if (d.type === 'text') onTextOverlayMove?.(d.id, newX, newY)
      else onImageOverlayMove?.(d.id, newX, newY)
    }

    function onUp() {
      overlayDragRef.current = null
      setDraggingOverlayId(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="relative flex flex-1 flex-col bg-[var(--color-watashi-surface-low)]">
      <div
        className="relative flex flex-1 items-center justify-center p-5"
        onMouseMove={sourceUrl ? scheduleHideControls : undefined}
        onMouseLeave={() => { if (isPlaying) hideTimerRef.current = setTimeout(() => setShowControls(false), 800) }}
      >
        {sourceUrl ? (
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18),0_2px_8px_-2px_rgba(0,0,0,0.10)]"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
            onClick={() => setSelectedCanvasItemId(null)}
          >
            <video
              ref={videoRef}
              src={sourceUrl}
              className="block max-h-full max-w-full object-contain"
              controls={false}
              onClick={togglePlayback}
              onTimeUpdate={(e) => {
                const nextTimelineTime = mapPreviewMediaTimeToTimelineTime(
                  playbackWindow,
                  e.currentTarget.currentTime,
                  totalDuration,
                )
                onTimeUpdate(nextTimelineTime)

                const previewDuration = getPreviewDuration()
                if (
                  isPlaybackActive
                  && Number.isFinite(previewDuration)
                  && previewDuration
                  && e.currentTarget.currentTime >= previewDuration - 0.05
                ) {
                  e.currentTarget.pause()
                  onTimeUpdate(mapPreviewMediaTimeToTimelineTime(
                    playbackWindow,
                    previewDuration,
                    totalDuration,
                  ))
                  onPlaybackChange(false)
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => { setIsPlaying(false); onPlaybackChange(false) }}
              style={{ filter: buildCssFilter(effects) }}
            />

            {activeTextOverlays.map((overlay) => {
              const hasXY = overlay.x !== undefined && overlay.y !== undefined
              const canDrag = !!onTextOverlayMove
              const isSelected = selectedCanvasItemId === overlay.id
              return (
                <div
                  key={overlay.id}
                  className={cx(
                    'group absolute z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-[transform,outline] duration-100',
                    canDrag ? 'cursor-move select-none' : 'pointer-events-none',
                    !hasXY && textPositionClass(overlay.position),
                    (draggingOverlayId === overlay.id || isSelected) && 'scale-105 outline outline-2 outline-offset-4 outline-[var(--color-watashi-indigo)]',
                  )}
                  style={{
                    fontFamily: fontFamilyStyle(overlay.fontFamily),
                    fontSize: overlay.fontSize,
                    color: overlay.color,
                    backgroundColor: overlay.bgColor ?? undefined,
                    padding: overlay.bgColor ? '4px 10px' : undefined,
                    borderRadius: overlay.bgColor ? 6 : undefined,
                    ...(hasXY && { left: `${overlay.x}%`, top: `${overlay.y}%`, transform: 'translate(-50%, -50%)' }),
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedCanvasItemId(overlay.id) }}
                  onMouseDown={canDrag ? (e) => startOverlayDrag(e, overlay.id, 'text', getOverlayInitialXY(overlay)) : undefined}
                >
                  {overlay.text}

                  {/* Delete button — visible on hover or when selected */}
                  {canDrag && (
                    <button
                      type="button"
                      onMouseDown={(e) => { e.stopPropagation(); onDeleteTextOverlay?.(overlay.id); setSelectedCanvasItemId(null) }}
                      title="Delete overlay"
                      className={cx(
                        'absolute -left-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-opacity',
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                      )}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}

                  {/* Grip handle — drag to any timeline text layer */}
                  {canDrag && (
                    <div
                      draggable
                      onMouseDown={(e) => e.stopPropagation()}
                      onDragStart={(e) => {
                        e.stopPropagation()
                        const dur = Math.max(1, overlay.endSeconds - overlay.startSeconds)
                        const payload = JSON.stringify({ id: overlay.id, label: overlay.text.slice(0, 30), durationSeconds: dur })
                        e.dataTransfer.setData('application/watashi-text-overlay', payload)
                        e.dataTransfer.setData('text/plain', payload)
                        // Must match timeline's dropEffect = 'copy'
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      title="Drag to timeline layer"
                      className={cx(
                        'absolute -right-2 -top-2 flex h-5 w-5 cursor-grab items-center justify-center rounded bg-[var(--color-watashi-indigo)] text-white shadow-md transition-opacity active:cursor-grabbing',
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                      )}
                    >
                      <GripVertical className="h-3 w-3" />
                    </div>
                  )}
                </div>
              )
            })}

            {activeImageOverlays.map((overlay) => {
              const hasXY = overlay.x !== undefined && overlay.y !== undefined
              const canDrag = !!onImageOverlayMove
              const isSelected = selectedCanvasItemId === overlay.id
              const namedPosClass = hasXY ? '' : (
                overlay.position === 'top-left' ? 'left-4 top-4'
                  : overlay.position === 'top-right' ? 'right-4 top-4'
                  : overlay.position === 'bottom-left' ? 'bottom-16 left-4'
                  : overlay.position === 'center' ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
                  : 'bottom-16 right-4'
              )
              return (
                <div
                  key={overlay.id}
                  className={cx(
                    'group absolute z-10 transition-[transform,outline] duration-100',
                    namedPosClass,
                    (draggingOverlayId === overlay.id || isSelected) && 'scale-105 outline outline-2 outline-offset-2 outline-[var(--color-watashi-indigo)]',
                  )}
                  style={{
                    ...(hasXY && { left: `${overlay.x}%`, top: `${overlay.y}%`, transform: 'translate(-50%, -50%)' }),
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedCanvasItemId(overlay.id) }}
                >
                  <img
                    src={overlay.objectUrl ?? undefined}
                    alt={overlay.label}
                    className={cx(
                      'max-h-32 max-w-32 rounded-xl object-contain shadow-lg',
                      canDrag ? 'cursor-move select-none' : 'pointer-events-none',
                    )}
                    style={{ opacity: overlay.opacity }}
                    onMouseDown={canDrag ? (e) => startOverlayDrag(e, overlay.id, 'image', getOverlayInitialXY(overlay)) : undefined}
                  />

                  {/* Delete button — visible on hover or when selected */}
                  {canDrag && (
                    <button
                      type="button"
                      onMouseDown={(e) => { e.stopPropagation(); onDeleteImageOverlay?.(overlay.id); setSelectedCanvasItemId(null) }}
                      title="Delete overlay"
                      className={cx(
                        'absolute -left-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-opacity',
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                      )}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}

                  {/* Grip handle — drag to any timeline images layer */}
                  {canDrag && (
                    <div
                      draggable
                      onMouseDown={(e) => e.stopPropagation()}
                      onDragStart={(e) => {
                        e.stopPropagation()
                        const dur = Math.max(1, overlay.endSeconds - overlay.startSeconds)
                        const payload = JSON.stringify({ id: overlay.id, label: overlay.label, durationSeconds: dur })
                        e.dataTransfer.setData('application/watashi-image-overlay', payload)
                        e.dataTransfer.setData('text/plain', payload)
                        // Must match timeline's dropEffect = 'copy'
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      title="Drag to timeline layer"
                      className={cx(
                        'absolute -right-2 -top-2 flex h-5 w-5 cursor-grab items-center justify-center rounded bg-[var(--color-watashi-indigo)] text-white shadow-md transition-opacity active:cursor-grabbing',
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                      )}
                    >
                      <GripVertical className="h-3 w-3" />
                    </div>
                  )}
                </div>
              )
            })}

            {activeCue && (
              <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 max-w-[80%] rounded-lg bg-black/80 px-4 py-1.5 text-center text-[13px] font-medium leading-5 text-white backdrop-blur-sm">
                {activeCue.text}
              </div>
            )}

            {/* Floating control pill */}
            <div
              className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 transition-opacity duration-300"
              style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none', width: 'calc(100% - 24px)' }}
            >
              <div className="flex items-center gap-2 rounded-full bg-black/75 px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
                {/* Current time */}
                <span className="w-[3.2rem] shrink-0 text-center font-mono text-[11px] tabular-nums text-white/70">
                  {formatTimestamp(currentTime)}
                </span>

                {/* Skip back 5s */}
                <button
                  type="button"
                  aria-label="Skip back 5 seconds"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); onScrub(Math.max(0, currentTime - 5)) }}
                >
                  <SkipBack className="h-3.5 w-3.5 fill-current" />
                </button>

                {/* Play / Pause */}
                <button
                  type="button"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#1a1035] shadow-sm transition-transform hover:scale-105 active:scale-95"
                  onClick={(e) => { e.stopPropagation(); togglePlayback() }}
                >
                  {isPlaying
                    ? <Pause className="h-3.5 w-3.5 fill-current" />
                    : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
                </button>

                {/* Skip forward 5s */}
                <button
                  type="button"
                  aria-label="Skip forward 5 seconds"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); onScrub(Math.min(totalDuration, currentTime + 5)) }}
                >
                  <SkipForward className="h-3.5 w-3.5 fill-current" />
                </button>

                {/* Progress bar */}
                <div
                  ref={progressBarRef}
                  className="group relative flex flex-1 cursor-pointer items-center py-1"
                  onClick={(e) => { e.stopPropagation(); handleProgressClick(e) }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') onScrub(Math.max(0, currentTime - 5))
                    if (e.key === 'ArrowRight') onScrub(Math.min(totalDuration, currentTime + 5))
                  }}
                  role="slider"
                  aria-label="Video progress"
                  aria-valuenow={Math.round(currentTime)}
                  aria-valuemin={0}
                  aria-valuemax={Math.round(totalDuration)}
                  tabIndex={0}
                >
                  <div className="relative h-1 w-full rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-[var(--color-watashi-indigo)] transition-[width] duration-75"
                      style={{ width: `${playheadPct}%` }}
                    />
                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                      style={{ left: `${playheadPct}%` }}
                    />
                  </div>
                </div>

                {/* Duration */}
                <span className="w-[3.2rem] shrink-0 text-center font-mono text-[11px] tabular-nums text-white/70">
                  {formatTimestamp(totalDuration)}
                </span>

                {/* Settings */}
                <button
                  type="button"
                  aria-label="Settings"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>

                {/* Fullscreen */}
                <button
                  type="button"
                  aria-label="Expand"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    videoRef.current?.requestFullscreen?.()
                  }}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)]">
              <svg className="h-10 w-10 text-[var(--color-watashi-text-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-bold text-[var(--color-watashi-text-strong)]">No media loaded</p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--color-watashi-text-soft)]">Upload or record a clip using the panel on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
