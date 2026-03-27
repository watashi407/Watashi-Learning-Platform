import { Loader2, Upload, Video } from 'lucide-react'
import { formatBytes, formatDuration } from '../services/mediaValidation'
import type { UploadedVideoAsset, VideoUploadPolicy } from '../types/video-project.types'
import { FeatureBadge, WorkspaceEyebrow, WorkspacePanel } from '../../../shared/ui/workspace'

export function MediaUploadPanel({
  inputId,
  policy,
  uploadedAsset,
  validationErrors,
  isInspecting,
  onFileSelected,
}: {
  inputId?: string
  policy: VideoUploadPolicy
  uploadedAsset: UploadedVideoAsset | null
  validationErrors: string[]
  isInspecting: boolean
  onFileSelected: (file: File | null) => void
}) {
  return (
    <WorkspacePanel className="overflow-hidden bg-[linear-gradient(180deg,#151d26,#111821)] text-white ring-[color-mix(in_oklab,white_10%,transparent)]">
      <FeatureBadge className="bg-white/10 text-white">Media</FeatureBadge>
      <h2 className="mt-4 font-display text-[1.9rem] font-black tracking-[-0.05em] text-white">Upload a lesson-ready source video</h2>
      <p className="mt-4 text-sm leading-7 text-white/68">
        Upload or import one instructional source file, validate it before processing, and keep the project in a guided educator workflow.
      </p>

      <label className="mt-6 block">
        <input
          id={inputId}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
          className="sr-only"
          onChange={(event) => {
            onFileSelected(event.target.files?.[0] ?? null)
            event.currentTarget.value = ''
          }}
        />
        <span className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[1.4rem] bg-white px-5 py-4 text-sm font-bold text-slate-950 shadow-[0_24px_48px_-30px_rgba(15,23,42,0.72)] transition-transform hover:-translate-y-0.5">
          {isInspecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isInspecting ? 'Inspecting upload...' : 'Choose video file'}
        </span>
      </label>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.4rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
          <WorkspaceEyebrow className="text-white/50">Duration</WorkspaceEyebrow>
          <p className="mt-2 text-sm font-bold text-white">
            {formatDuration(policy.minDurationSeconds)} to {formatDuration(policy.maxDurationSeconds)}
          </p>
        </div>
        <div className="rounded-[1.4rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
          <WorkspaceEyebrow className="text-white/50">Max file size</WorkspaceEyebrow>
          <p className="mt-2 text-sm font-bold text-white">{formatBytes(policy.maxFileSizeBytes)}</p>
        </div>
        <div className="rounded-[1.4rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
          <WorkspaceEyebrow className="text-white/50">Processing</WorkspaceEyebrow>
          <p className="mt-2 text-sm font-bold text-white">Async render queue</p>
        </div>
      </div>

      {uploadedAsset ? (
        <div className="mt-6 rounded-[1.6rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-[var(--color-watashi-emerald)]">
              <Video className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">{uploadedAsset.fileName}</p>
              <p className="mt-1 text-sm text-white/65">
                {formatDuration(uploadedAsset.durationSeconds)} | {formatBytes(uploadedAsset.fileSizeBytes)} | {uploadedAsset.mimeType}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {validationErrors.length > 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-rose-400/25 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
          <p className="font-bold">Upload blocked</p>
          <ul className="mt-2 space-y-1.5 leading-6">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5 text-xs leading-6 text-white/52">
        Validation happens before processing begins. The max file size is configurable so infrastructure can tune it without changing the UI.
      </p>
    </WorkspacePanel>
  )
}
