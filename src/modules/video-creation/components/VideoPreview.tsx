import { Captions, CirclePlay, FolderTree, Waves } from 'lucide-react'
import { formatDuration } from '../services/mediaValidation'
import type { StampOverlay, SubtitleCue, UploadedVideoAsset } from '../types/video-project.types'
import { FeatureBadge, WorkspaceEyebrow, WorkspacePanel } from '../../../shared/ui/workspace'

export function VideoPreview({
  uploadedAsset,
  projectTitle,
  subtitleCue,
  enabledStamps,
  bindingLabel,
}: {
  uploadedAsset: UploadedVideoAsset | null
  projectTitle: string
  subtitleCue: SubtitleCue | undefined
  enabledStamps: StampOverlay[]
  bindingLabel: string
}) {
  return (
    <WorkspacePanel className="overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#121922,#0b1118)] p-0 text-white ring-[color-mix(in_oklab,white_10%,transparent)]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <FeatureBadge className="bg-white/10 text-white">Preview</FeatureBadge>
          <h2 className="mt-3 font-display text-[1.8rem] font-black tracking-[-0.05em] text-white">{projectTitle}</h2>
        </div>
        <div className="rounded-[1.4rem] bg-white/6 px-4 py-3 text-right ring-1 ring-white/8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">Binding</p>
          <p className="mt-2 text-sm font-semibold text-white">{bindingLabel}</p>
        </div>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(82,140,255,0.22),transparent_36%),linear-gradient(180deg,#182338,#0b1218)]">
        {uploadedAsset ? (
          <video className="h-full w-full object-cover opacity-92" controls preload="metadata" src={uploadedAsset.objectUrl} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-white/85">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.9rem] bg-white/10 backdrop-blur-sm">
                <CirclePlay className="h-9 w-9 fill-current" />
              </span>
              <p className="mt-5 text-base font-semibold">Upload a valid source file to preview the lesson canvas.</p>
            </div>
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
            Lesson preview
          </span>
          <span className="rounded-full bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
            {uploadedAsset ? formatDuration(uploadedAsset.durationSeconds) : 'Awaiting upload'}
          </span>
        </div>

        <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-2">
          {enabledStamps.map((stamp) => (
            <span key={stamp.id} className="rounded-full bg-white/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm">
              {stamp.label}
            </span>
          ))}
        </div>

        {subtitleCue ? (
          <div className="absolute inset-x-8 bottom-6 rounded-[1.2rem] bg-black/55 px-4 py-3 text-center text-sm font-medium leading-6 text-white backdrop-blur-sm">
            {subtitleCue.text}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 border-t border-white/10 px-6 py-5 md:grid-cols-3">
        <div className="rounded-[1.4rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
          <div className="flex items-center gap-2 text-[var(--color-watashi-indigo)]">
            <FolderTree className="h-4 w-4" />
            <WorkspaceEyebrow className="text-[var(--color-watashi-indigo)]">Course binding</WorkspaceEyebrow>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/70">{bindingLabel}</p>
        </div>
        <div className="rounded-[1.4rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
          <div className="flex items-center gap-2 text-[var(--color-watashi-emerald)]">
            <Waves className="h-4 w-4" />
            <WorkspaceEyebrow className="text-[var(--color-watashi-emerald)]">Audio workflow</WorkspaceEyebrow>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/70">Voice cleanup, ducking, silence trim, and level normalization are all handled here.</p>
        </div>
        <div className="rounded-[1.4rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
          <div className="flex items-center gap-2 text-[var(--color-watashi-ember)]">
            <Captions className="h-4 w-4" />
            <WorkspaceEyebrow className="text-[var(--color-watashi-ember)]">Subtitle workflow</WorkspaceEyebrow>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/70">Generate captions asynchronously, then fine-tune timing and copy before render.</p>
        </div>
      </div>
    </WorkspacePanel>
  )
}
