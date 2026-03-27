import { Download, Loader2 } from 'lucide-react'
import type { ExportSettings } from '../types/video-project.types'
import { FeatureBadge, WorkspacePanel } from '../../../shared/ui/workspace'

export function ExportSettingsPanel({
  settings,
  isRendering,
  disabledReason,
  onSettingChange,
  onQueueExport,
}: {
  settings: ExportSettings
  isRendering: boolean
  disabledReason: string | null
  onSettingChange: <K extends keyof ExportSettings>(field: K, value: ExportSettings[K]) => void
  onQueueExport: () => void
}) {
  return (
    <WorkspacePanel className="bg-[linear-gradient(180deg,#121922,#0d141b)] text-white ring-[color-mix(in_oklab,white_10%,transparent)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <FeatureBadge className="bg-white/10 text-white">Export</FeatureBadge>
          <h2 className="mt-3 font-display text-[1.8rem] font-black tracking-[-0.05em] text-white">Render a publish-ready lesson video</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
            Export runs in the background so educators can keep refining subtitles and timeline decisions while the server render is queued.
          </p>
        </div>

        <button
          type="button"
          onClick={onQueueExport}
          disabled={Boolean(disabledReason) || isRendering}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-emerald)] px-5 py-3 text-sm font-bold text-white shadow-[0_22px_48px_-28px_rgba(23,104,81,0.45)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isRendering ? 'Render queued...' : 'Queue final render'}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Format</span>
          <select
            value={settings.format}
            onChange={(event) => onSettingChange('format', event.target.value as ExportSettings['format'])}
            className="mt-2 w-full rounded-[1.2rem] border-none bg-white/6 px-4 py-3 text-sm font-semibold text-white outline-none ring-1 ring-white/8"
          >
            <option value="mp4">MP4</option>
            <option value="mov">MOV</option>
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Resolution</span>
          <select
            value={settings.resolution}
            onChange={(event) => onSettingChange('resolution', event.target.value as ExportSettings['resolution'])}
            className="mt-2 w-full rounded-[1.2rem] border-none bg-white/6 px-4 py-3 text-sm font-semibold text-white outline-none ring-1 ring-white/8"
          >
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
            <option value="4k">4K</option>
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Render preset</span>
          <select
            value={settings.renderPreset}
            onChange={(event) => onSettingChange('renderPreset', event.target.value as ExportSettings['renderPreset'])}
            className="mt-2 w-full rounded-[1.2rem] border-none bg-white/6 px-4 py-3 text-sm font-semibold text-white outline-none ring-1 ring-white/8"
          >
            <option value="balanced">Balanced draft</option>
            <option value="publish">Publish-ready</option>
            <option value="high-detail">High detail</option>
          </select>
        </label>

        <label className="flex items-center justify-between rounded-[1.2rem] bg-white/6 px-4 py-4 text-sm font-semibold text-white ring-1 ring-white/8">
          <span>Burn subtitles into final render</span>
          <input
            type="checkbox"
            checked={settings.includeBurnedSubtitles}
            onChange={(event) => onSettingChange('includeBurnedSubtitles', event.target.checked)}
            className="h-4 w-4 accent-[var(--color-watashi-indigo)]"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <div className="rounded-[1.4rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Delivery target</p>
          <p className="mt-2 text-sm font-semibold text-white">Lesson publishing pipeline</p>
        </div>
        <div className="rounded-[1.4rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Render mode</p>
          <p className="mt-2 text-sm font-semibold text-white">Server-side async job</p>
        </div>
        <div className="rounded-[1.4rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Lesson attach</p>
          <p className="mt-2 text-sm font-semibold text-white">Handled after render completes</p>
        </div>
      </div>

      {disabledReason ? (
        <div className="mt-5 rounded-[1.4rem] border border-amber-300/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
          {disabledReason}
        </div>
      ) : null}
    </WorkspacePanel>
  )
}
