import { Camera, Disc3, Mic, MonitorUp, Radio, RefreshCcw, Square, UploadCloud, Video } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { formatBytes, formatDuration } from '../services/mediaValidation'
import type { LiveCaptureMode, LiveCaptureStatus, RecordedCapture } from '../types/video-project.types'
import { FeatureBadge, WorkspaceEyebrow, WorkspacePanel } from '../../../shared/ui/workspace'

function modeLabel(mode: LiveCaptureMode) {
  if (mode === 'camera') {
    return 'Camera + mic'
  }

  if (mode === 'audio') {
    return 'Audio only'
  }

  return 'Screen + camera'
}

function statusLabel(status: LiveCaptureStatus) {
  if (status === 'requesting') {
    return 'Requesting devices'
  }

  if (status === 'ready') {
    return 'Ready to record'
  }

  if (status === 'recording') {
    return 'Recording live'
  }

  if (status === 'paused') {
    return 'Paused'
  }

  if (status === 'recorded') {
    return 'Take captured'
  }

  if (status === 'error') {
    return 'Needs attention'
  }

  return 'Idle'
}

export function LiveCapturePanel({
  mode,
  status,
  previewStream,
  recordedCapture,
  errorMessage,
  elapsedSeconds,
  onModeChange,
  onReadyCapture,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onUseCapture,
  onResetCapture,
}: {
  mode: LiveCaptureMode
  status: LiveCaptureStatus
  previewStream: MediaStream | null
  recordedCapture: RecordedCapture | null
  errorMessage: string | null
  elapsedSeconds: number
  onModeChange: (mode: LiveCaptureMode) => void
  onReadyCapture: () => void
  onStartRecording: () => void
  onPauseRecording: () => void
  onResumeRecording: () => void
  onStopRecording: () => void
  onUseCapture: () => void
  onResetCapture: () => void
}) {
  const previewRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!previewRef.current) {
      return
    }

    previewRef.current.srcObject = previewStream

    return () => {
      if (previewRef.current) {
        previewRef.current.srcObject = null
      }
    }
  }, [previewStream])

  const isRecording = status === 'recording'
  const isPaused = status === 'paused'

  return (
    <WorkspacePanel className="overflow-hidden bg-[linear-gradient(180deg,#121922,#0e141b)] text-white ring-[color-mix(in_oklab,white_10%,transparent)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <FeatureBadge className="bg-white/10 text-white">Live Capture</FeatureBadge>
          <h2 className="mt-3 font-display text-[1.8rem] font-black tracking-[-0.05em] text-white">Record inside the editor</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">
            Start a camera lesson, record a voice-only take, or capture your screen with a camera overlay without leaving the video workspace.
          </p>
        </div>

        <div className="rounded-[1.2rem] bg-white/8 px-4 py-3 text-right">
          <WorkspaceEyebrow className="text-white/55">Capture state</WorkspaceEyebrow>
          <p className="mt-2 text-sm font-semibold text-white">{statusLabel(status)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 rounded-[1.4rem] bg-white/6 p-1">
        {([
          { key: 'camera', label: 'Camera', icon: Camera },
          { key: 'audio', label: 'Audio', icon: Mic },
          { key: 'screen-camera', label: 'Screen + Cam', icon: MonitorUp },
        ] as const).map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onModeChange(option.key)}
              className={`flex items-center justify-center gap-2 rounded-[1.15rem] px-3 py-3 text-sm font-bold transition-colors ${
                mode === option.key
                  ? 'bg-white text-slate-900 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.65)]'
                  : 'text-white/74 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,#171f29,#111821)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/74">
            <Video className="h-4 w-4 text-[var(--color-watashi-emerald)]" />
            {modeLabel(mode)}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/68">
            <Disc3 className={`h-3.5 w-3.5 ${isRecording ? 'animate-spin text-rose-300' : 'text-white/55'}`} />
            {isRecording ? formatDuration(elapsedSeconds) : statusLabel(status)}
          </div>
        </div>

        <div className="relative aspect-[16/10] bg-[radial-gradient(circle_at_top_left,rgba(61,212,162,0.18),transparent_38%),linear-gradient(180deg,#0f151d,#0a1016)]">
          {previewStream ? (
            <video ref={previewRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          ) : recordedCapture && recordedCapture.mode !== 'audio' ? (
            <video controls playsInline className="h-full w-full object-cover" src={recordedCapture.objectUrl} />
          ) : (
            <div className="flex h-full items-center justify-center px-8">
              <div className="max-w-sm text-center">
                <span className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.6rem] bg-white/10 text-[var(--color-watashi-emerald)] backdrop-blur-sm">
                  {mode === 'audio' ? <Mic className="h-8 w-8" /> : mode === 'screen-camera' ? <MonitorUp className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
                </span>
                <p className="mt-5 text-base font-semibold text-white">
                  {mode === 'audio' ? 'Voice takes land here after recording.' : 'Prepare the devices to preview the live capture surface.'}
                </p>
                <p className="mt-3 text-sm leading-6 text-white/64">
                  {mode === 'screen-camera'
                    ? 'Screen share and camera overlay will be composed into one teaching capture.'
                    : mode === 'audio'
                      ? 'Audio-only capture is useful for narration, corrections, or quick guided notes.'
                      : 'Use the camera mode for direct-to-camera lessons and walkthrough intros.'}
                </p>
              </div>
            </div>
          )}

          {recordedCapture?.mode === 'audio' ? (
            <div className="absolute inset-x-6 bottom-6 rounded-[1.4rem] bg-black/45 px-4 py-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white">{recordedCapture.fileName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/58">{formatBytes(recordedCapture.sizeBytes)}</p>
                </div>
                <Radio className="h-5 w-5 text-[var(--color-watashi-emerald)]" />
              </div>
              <audio controls className="mt-4 w-full" src={recordedCapture.objectUrl} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={status === 'ready' ? onStartRecording : onReadyCapture}
          disabled={isRecording || isPaused}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5"
        >
          {status === 'ready' ? <Disc3 className="h-4 w-4 text-rose-500" /> : <Camera className="h-4 w-4 text-[var(--color-watashi-emerald)]" />}
          {status === 'ready' ? 'Start recording' : 'Ready devices'}
        </button>
        {(isRecording || isPaused) ? (
          <button
            type="button"
            onClick={isRecording ? onPauseRecording : onResumeRecording}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-bold text-white/80"
          >
            <Disc3 className={`h-4 w-4 ${isRecording ? 'text-white/80' : 'text-[var(--color-watashi-emerald)]'}`} />
            {isRecording ? 'Pause' : 'Resume'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={isRecording ? onStopRecording : onResetCapture}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-bold text-white/80"
        >
          {isRecording ? <Square className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
          {isRecording ? 'Stop capture' : 'Reset'}
        </button>
        {recordedCapture ? (
          <button
            type="button"
            onClick={onUseCapture}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-emerald)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_-28px_rgba(23,104,81,0.55)]"
          >
            <UploadCloud className="h-4 w-4" />
            {recordedCapture.mode === 'audio' ? 'Use as narration' : 'Use as main source'}
          </button>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-[1.4rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm leading-6 text-rose-100">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          { label: 'Permissions', detail: 'Screen, camera, and mic are requested only when the selected capture mode needs them.' },
          { label: 'Camera lesson', detail: 'Direct talking-head recording with microphone.' },
          { label: 'Audio note', detail: 'Quick narration or correction take for the lesson.' },
          { label: 'Screen + cam', detail: 'Teach a tool while keeping your face visible in frame.' },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.3rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
            <WorkspaceEyebrow className="text-white/52">{item.label}</WorkspaceEyebrow>
            <p className="mt-2 text-sm leading-6 text-white/70">{item.detail}</p>
          </div>
        ))}
      </div>
    </WorkspacePanel>
  )
}
