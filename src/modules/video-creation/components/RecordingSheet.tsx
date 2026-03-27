import { Camera, CirclePlay, Mic, MonitorUp, Pause, Square, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { LiveCaptureMode, LiveCaptureStatus, RecordedCapture } from '../types/video-project.types'
import { cx } from '../../../shared/ui/workspace'

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function statusLabel(status: LiveCaptureStatus) {
  if (status === 'requesting') return 'Requesting permissions…'
  if (status === 'ready') return 'Ready — press Record'
  if (status === 'recording') return 'Recording live'
  if (status === 'paused') return 'Paused'
  if (status === 'recorded') return 'Take captured'
  if (status === 'error') return 'Error — check permissions'
  return 'Idle'
}

const modeOptions: Array<{ mode: LiveCaptureMode; icon: typeof Camera; label: string }> = [
  { mode: 'screen-camera', icon: MonitorUp, label: 'Screen + Cam' },
  { mode: 'camera', icon: Camera, label: 'Camera' },
  { mode: 'audio', icon: Mic, label: 'Audio only' },
]

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
  onUseClip: () => void
  onClose: () => void
}

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
  onClose,
}: RecordingSheetProps) {
  const previewRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = previewRef.current
    if (!video) return
    if (previewStream) {
      video.srcObject = previewStream
      void video.play().catch(() => undefined)
    } else {
      video.srcObject = null
    }
    return () => {
      video.srcObject = null
    }
  }, [previewStream])

  const isRecording = status === 'recording'
  const isPaused = status === 'paused'
  const isReady = status === 'ready'
  const isRecorded = status === 'recorded'
  const isIdle = status === 'idle'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl rounded-t-3xl bg-[#0e1117] text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={cx('h-2.5 w-2.5 rounded-full', isRecording ? 'animate-pulse bg-red-500' : 'bg-white/30')} />
            <span className="text-sm font-semibold">{statusLabel(status)}</span>
            {(isRecording || isPaused) && (
              <span className="font-mono text-sm text-white/60">{formatElapsed(elapsedSeconds)}</span>
            )}
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode selector */}
          {(isIdle || isReady) && (
            <div className="flex gap-2">
              {modeOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => onModeChange(opt.mode)}
                    className={cx(
                      'flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-bold transition-colors',
                      mode === opt.mode
                        ? 'bg-[var(--color-watashi-indigo)] text-white'
                        : 'bg-white/8 text-white/60 hover:bg-white/14',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Preview */}
          {mode !== 'audio' && (
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              {previewStream ? (
                <video ref={previewRef} className="h-full w-full object-cover" muted playsInline autoPlay />
              ) : isRecorded && recordedCapture && recordedCapture.mode !== 'audio' ? (
                <video src={recordedCapture.objectUrl} className="h-full w-full object-cover" controls />
              ) : (
                <div className="flex h-full items-center justify-center text-white/30">
                  <Camera className="h-12 w-12" />
                </div>
              )}
            </div>
          )}

          {/* Audio-only waveform placeholder */}
          {mode === 'audio' && (
            <div className="flex h-20 items-center justify-center rounded-2xl bg-white/5">
              <Mic className={cx('h-8 w-8', isRecording ? 'animate-pulse text-red-400' : 'text-white/30')} />
            </div>
          )}

          {/* Messages */}
          {(errorMessage || warningMessage) && (
            <p className={cx('rounded-xl px-4 py-2.5 text-xs font-semibold', errorMessage ? 'bg-red-500/15 text-red-300' : 'bg-amber-400/15 text-amber-300')}>
              {errorMessage ?? warningMessage}
            </p>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            {isIdle && (
              <button type="button" onClick={onReady} className="flex-1 rounded-2xl bg-[var(--color-watashi-indigo)] py-3 text-sm font-bold">
                Arm {mode === 'screen-camera' ? 'screen + camera' : mode === 'camera' ? 'camera' : 'microphone'}
              </button>
            )}

            {isReady && (
              <button type="button" onClick={onStart} className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold">
                Start recording
              </button>
            )}

            {(isRecording || isPaused) && (
              <>
                <button
                  type="button"
                  onClick={isRecording ? onPause : onResume}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                >
                  {isRecording ? <Pause className="h-5 w-5" /> : <CirclePlay className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={onStop}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500/20 py-3 text-sm font-bold text-red-300"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </button>
              </>
            )}

            {isRecorded && (
              <>
                <button type="button" onClick={onReset} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                  <X className="h-4 w-4" />
                </button>
                <button type="button" onClick={onUseClip} className="flex-1 rounded-2xl bg-[var(--color-watashi-indigo)] py-3 text-sm font-bold">
                  Use this clip
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
