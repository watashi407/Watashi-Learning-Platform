import type { AudioToolSettings } from '../types/video-project.types'
import { FeatureBadge, WorkspacePanel } from '../../../shared/ui/workspace'

function AudioSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="text-xs font-black uppercase tracking-[0.22em] text-white/44">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-[var(--color-watashi-emerald)]"
      />
    </label>
  )
}

export function AudioEditorPanel({
  settings,
  narrationClip,
  onSettingChange,
}: {
  settings: AudioToolSettings
  narrationClip?: {
    fileName: string
    objectUrl: string
  } | null
  onSettingChange: (field: keyof AudioToolSettings, value: number | boolean) => void
}) {
  return (
    <WorkspacePanel className="bg-[linear-gradient(180deg,#121922,#0d141b)] text-white ring-[color-mix(in_oklab,white_10%,transparent)]">
      <FeatureBadge className="bg-white/10 text-white">Audio</FeatureBadge>
      <h2 className="mt-3 font-display text-[1.8rem] font-black tracking-[-0.05em] text-white">Polish narration inside the video editor</h2>
      <p className="mt-4 text-sm leading-7 text-white/68">
        Audio cleanup is now part of the same lesson workflow, so educators no longer have to jump into a separate module.
      </p>

      <div className="mt-6 space-y-5">
        <AudioSlider label="Voice clarity boost" value={settings.voiceBoost} onChange={(value) => onSettingChange('voiceBoost', value)} />
        <AudioSlider label="Noise reduction" value={settings.noiseReduction} onChange={(value) => onSettingChange('noiseReduction', value)} />
        <AudioSlider label="Music ducking" value={settings.musicDucking} onChange={(value) => onSettingChange('musicDucking', value)} />
      </div>

      <div className="mt-6 grid gap-3">
        <label className="flex items-center justify-between rounded-[1.4rem] bg-white/6 px-4 py-4 text-sm font-semibold text-white ring-1 ring-white/8">
          <span>Trim silence gaps between sentences</span>
          <input
            type="checkbox"
            checked={settings.silenceTrim}
            onChange={(event) => onSettingChange('silenceTrim', event.target.checked)}
            className="h-4 w-4 accent-[var(--color-watashi-emerald)]"
          />
        </label>
        <label className="flex items-center justify-between rounded-[1.4rem] bg-white/6 px-4 py-4 text-sm font-semibold text-white ring-1 ring-white/8">
          <span>Normalize dialogue loudness before render</span>
          <input
            type="checkbox"
            checked={settings.normalizeDialogue}
            onChange={(event) => onSettingChange('normalizeDialogue', event.target.checked)}
            className="h-4 w-4 accent-[var(--color-watashi-emerald)]"
          />
        </label>
      </div>

      {narrationClip ? (
        <div className="mt-6 rounded-[1.5rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
          <p className="text-sm font-bold text-white">Latest live narration take</p>
          <p className="mt-2 text-sm text-white/64">{narrationClip.fileName}</p>
          <audio controls className="mt-4 w-full" src={narrationClip.objectUrl} />
        </div>
      ) : null}
    </WorkspacePanel>
  )
}
