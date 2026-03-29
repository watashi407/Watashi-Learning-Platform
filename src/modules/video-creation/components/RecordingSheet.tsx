import {
  Camera,
  ChevronUp,
  CirclePlay,
  Loader2,
  Mic,
  MicOff,
  Minus,
  MonitorUp,
  Pause,
  Settings,
  Square,
  Volume2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { LiveCaptureMode, LiveCaptureStatus, RecordedCapture } from '../types/video-project.types'
import { cx } from '../../../shared/ui/workspace'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function statusLabel(status: LiveCaptureStatus) {
  if (status === 'requesting') return 'Requesting permissions…'
  if (status === 'ready') return 'Ready to record'
  if (status === 'recording') return 'Recording'
  if (status === 'paused') return 'Paused'
  if (status === 'recorded') return 'Take captured'
  if (status === 'error') return 'Check permissions'
  return 'Screen + Camera'
}

// ── Drag hook ─────────────────────────────────────────────────────────────────

type Position = { x: number; y: number }

function useDraggable(initialPosition: Position) {
  const [pos, setPos] = useState<Position>(initialPosition)
  const dragRef = useRef<{ startMouseX: number; startMouseY: number; startPosX: number; startPosY: number } | null>(null)

  function onDragStart(e: React.MouseEvent) {
    // Only drag on the handle itself (title bar), not its buttons
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    dragRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    }

    function onMove(ev: MouseEvent) {
      const d = dragRef.current
      if (!d) return
      setPos({
        x: d.startPosX + (ev.clientX - d.startMouseX),
        y: d.startPosY + (ev.clientY - d.startMouseY),
      })
    }

    function onUp() {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Cleanup on unmount
  useEffect(() => () => { dragRef.current = null }, [])

  return { pos, onDragStart }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type RecordingSheetProps = {
  mode: LiveCaptureMode
  status: LiveCaptureStatus
  previewStream: MediaStream | null
  recordedCapture: RecordedCapture | null
  errorMessage: string | null
  warningMessage: string | null
  elapsedSeconds: number
  onModeChange: (mode: LiveCaptureMode) => void
  onReady: () => void
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
  onUseClip: () => Promise<void> | void
  isUsingClip?: boolean
  onClose: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RecordingSheet({
  mode,
  status,
  previewStream,
  recordedCapture,
  errorMessage,
  warningMessage,
  elapsedSeconds,
  onModeChange,
  onReady,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onUseClip,
  isUsingClip = false,
  onClose,
}: RecordingSheetProps) {
  const previewRef = useRef<HTMLVideoElement | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [micMuted, setMicMuted] = useState(false)

  // Default position: center-right area of screen
  const { pos, onDragStart } = useDraggable({ x: window.innerWidth / 2 - 200, y: 80 })

  useEffect(() => {
    const video = previewRef.current
    if (!video) return
    if (previewStream) {
      video.srcObject = previewStream
      void video.play().catch(() => undefined)
    } else {
      video.srcObject = null
    }
    return () => { video.srcObject = null }
  }, [previewStream])

  const isRecording = status === 'recording'
  const isPaused = status === 'paused'
  const isReady = status === 'ready'
  const isRecorded = status === 'recorded'
  const isIdle = status === 'idle'
  const isLive = isRecording || isPaused

  // ── Minimized pill ──────────────────────────────────────────────────────────

  if (isMinimized) {
    return (
      <div
        className="fixed z-50 select-none"
        style={{ left: pos.x, top: pos.y }}
      >
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className={cx(
            'flex h-9 items-center gap-2.5 rounded-full px-3.5',
            'bg-black/85 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.5)]',
            isLive
              ? 'ring-1 ring-red-500/40'
              : 'ring-1 ring-white/[0.08]',
          )}
        >
          {/* Status dot */}
          <span className={cx(
            'h-2 w-2 rounded-full shrink-0',
            isRecording ? 'animate-pulse bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]' :
            isPaused ? 'bg-amber-400' :
            isRecorded ? 'bg-emerald-400' :
            'bg-white/30',
          )} />

          {/* Label */}
          <span className="text-[12px] font-semibold text-white/80 whitespace-nowrap">
            {isLive ? formatElapsed(elapsedSeconds) : statusLabel(status)}
          </span>

          {/* Expand icon */}
          <ChevronUp className="h-3 w-3 text-white/40 shrink-0" />
        </button>
      </div>
    )
  }

  // ── Expanded panel ──────────────────────────────────────────────────────────

  return (
    <div
      className="fixed z-50 select-none"
      style={{ left: pos.x, top: pos.y, width: 400 }}
    >
      <div className="rounded-2xl bg-[#0c0f14] shadow-[0_16px_64px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.06] overflow-hidden">

        {/* ── Title bar (drag handle) ── */}
        <div
          className="flex h-10 cursor-grab items-center justify-between gap-2 border-b border-white/[0.06] px-3 active:cursor-grabbing"
          onMouseDown={onDragStart}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={cx(
              'h-2 w-2 rounded-full shrink-0',
              isRecording ? 'animate-pulse bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]' :
              isPaused ? 'bg-amber-400' :
              isRecorded ? 'bg-emerald-400' :
              isReady ? 'bg-[var(--color-watashi-indigo)]' :
              'bg-white/20',
            )} />
            <span className="truncate text-[12px] font-bold uppercase tracking-widest text-white/50">
              {statusLabel(status)}
            </span>
            {isLive && (
              <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-white/40">
                {formatElapsed(elapsedSeconds)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Minimize */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              title="Minimize"
              className="flex h-6 w-6 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/[0.08] hover:text-white/60"
            >
              <Minus className="h-3 w-3" />
            </button>
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="flex h-6 w-6 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-red-500/20 hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3">

          {/* ── Mode selector ── */}
          {(isIdle || isReady) && (
            <div className="flex gap-1.5">
              {([
                { mode: 'screen-camera' as LiveCaptureMode, icon: MonitorUp, label: 'Screen + Cam' },
              ]).map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => onModeChange(opt.mode)}
                    className={cx(
                      'flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-[11px] font-bold transition-all',
                      mode === opt.mode
                        ? 'bg-[var(--color-watashi-indigo)] text-white shadow-[0_4px_16px_-4px_rgba(75,65,225,0.4)]'
                        : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Camera preview ── */}
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/[0.04]">
            {previewStream ? (
              <video
                ref={previewRef}
                className="h-full w-full object-cover"
                muted
                playsInline
                autoPlay
              />
            ) : isRecorded && recordedCapture ? (
              <video
                src={recordedCapture.objectUrl}
                className="h-full w-full object-cover"
                controls
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-white/15">
                <Camera className="h-8 w-8" />
                <span className="text-[10px] font-medium">Preview will appear here</span>
              </div>
            )}

            {/* Live recording badge */}
            {isRecording && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2 py-0.5 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                <span className="text-[10px] font-bold text-white">LIVE</span>
              </div>
            )}

            {/* Paused badge */}
            {isPaused && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-amber-500/90 px-2 py-0.5 backdrop-blur-sm">
                <span className="text-[10px] font-bold text-white">PAUSED</span>
              </div>
            )}
          </div>

          {/* ── Error / warning ── */}
          {(errorMessage || warningMessage) && (
            <p className={cx(
              'rounded-lg px-3 py-2 text-[11px] font-semibold leading-4',
              errorMessage
                ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                : 'bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20',
            )}>
              {errorMessage ?? warningMessage}
            </p>
          )}

          {/* ── Controls ── */}
          <div className="flex items-center gap-2">

            {/* Icon toolbar — left side */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMicMuted((m) => !m)}
                title={micMuted ? 'Unmute mic' : 'Mute mic'}
                className={cx(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                  micMuted
                    ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/20'
                    : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70',
                )}
              >
                {micMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                title="Audio settings"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Settings"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Primary action — right side */}
            <div className="flex flex-1 items-center justify-end gap-2">

              {isIdle && (
                <button
                  type="button"
                  onClick={onReady}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-watashi-indigo)] py-2.5 text-[12px] font-bold text-white shadow-[0_4px_16px_-4px_rgba(75,65,225,0.45)] transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <MonitorUp className="h-3.5 w-3.5" />
                  Arm camera
                </button>
              )}

              {isReady && (
                <button
                  type="button"
                  onClick={onStart}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-[12px] font-bold text-white shadow-[0_4px_16px_-4px_rgba(239,68,68,0.45)] transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                  Start recording
                </button>
              )}

              {isLive && (
                <>
                  {/* Pause / resume */}
                  <button
                    type="button"
                    onClick={isRecording ? onPause : onResume}
                    title={isRecording ? 'Pause' : 'Resume'}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-colors hover:bg-white/[0.12] hover:text-white"
                  >
                    {isRecording
                      ? <Pause className="h-3.5 w-3.5" />
                      : <CirclePlay className="h-3.5 w-3.5" />}
                  </button>

                  {/* Stop */}
                  <button
                    type="button"
                    onClick={onStop}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/12 py-2.5 text-[12px] font-bold text-red-400 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20 active:scale-[0.98]"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    Stop
                  </button>
                </>
              )}

              {isRecorded && (
                <>
                  {/* Discard */}
                  <button
                    type="button"
                    onClick={onReset}
                    title="Discard take"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/40 transition-colors hover:bg-white/[0.12] hover:text-white/70"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  {/* Use clip */}
                  <button
                    type="button"
                    onClick={() => void onUseClip()}
                    disabled={isUsingClip}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-watashi-indigo)] py-2.5 text-[12px] font-bold text-white shadow-[0_4px_16px_-4px_rgba(75,65,225,0.45)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUsingClip
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : null}
                    {isUsingClip ? 'Using clip…' : 'Use this clip'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
