import { Camera, Clapperboard, Download, Loader2, Mic, Save } from 'lucide-react'
import type { LiveCaptureMode, ProcessingJob } from '../types/video-project.types'
import { cx } from '../../../shared/ui/workspace'

type JobTone = 'idle' | 'queued' | 'processing' | 'completed' | 'failed'

function jobPillStyle(status: JobTone) {
  if (status === 'completed') return 'bg-[#e0f3ea] text-[#175b48] ring-[#cfe7dc]'
  if (status === 'queued' || status === 'processing') return 'bg-[#e4ebff] text-[#4156b7] ring-[#d6dff9]'
  if (status === 'failed') return 'bg-[#ffe8e6] text-[#b84d48] ring-[#f3d3cf]'
  return 'bg-[#f2f4ef] text-[#7c897f] ring-[#e1e5de]'
}

const captureButtons: Array<{ mode: LiveCaptureMode; icon: typeof Camera; label: string }> = [
  { mode: 'screen-camera', icon: Clapperboard, label: 'Screen + Cam' },
  { mode: 'camera', icon: Camera, label: 'Camera' },
  { mode: 'audio', icon: Mic, label: 'Audio' },
]

type EditorTopBarProps = {
  title: string
  onTitleChange: (value: string) => void
  jobs: ProcessingJob[]
  isSaving: boolean
  exportBlocked: string | null
  onRecord: (mode: LiveCaptureMode) => void
  onExport: () => void
}

export function EditorTopBar({ title, onTitleChange, jobs, isSaving, exportBlocked, onRecord, onExport }: EditorTopBarProps) {
  const activeJobs = jobs.filter((j) => j.status !== 'idle')

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)] px-4 py-3">
      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="min-w-0 flex-1 rounded-xl bg-[var(--color-watashi-surface-low)] px-3 py-2 text-sm font-semibold text-[var(--color-watashi-text-strong)] outline-none ring-1 ring-transparent transition-shadow focus:ring-[var(--color-watashi-border)] placeholder:text-[var(--color-watashi-text-soft)]"
        placeholder="Project title"
        aria-label="Project title"
      />

      {/* Recording mode buttons */}
      <div className="flex items-center gap-1 rounded-xl bg-[var(--color-watashi-surface-low)] p-1">
        {captureButtons.map((btn) => {
          const Icon = btn.icon
          return (
            <button
              key={btn.label}
              type="button"
              onClick={() => onRecord(btn.mode)}
              title={`Record: ${btn.label}`}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--color-watashi-text)] transition-colors hover:bg-[var(--color-watashi-surface-card)] hover:text-[var(--color-watashi-indigo)]"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{btn.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active job pills */}
      {activeJobs.length > 0 && (
        <div className="flex items-center gap-1.5">
          {activeJobs.map((job) => (
            <span
              key={job.id}
              className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1', jobPillStyle(job.status as JobTone))}
            >
              {(job.status === 'queued' || job.status === 'processing') && <Loader2 className="h-3 w-3 animate-spin" />}
              {job.label}
            </span>
          ))}
        </div>
      )}

      {/* Save indicator */}
      {isSaving && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-watashi-text-soft)]">
          <Save className="h-3.5 w-3.5 animate-pulse" />
          Saving
        </span>
      )}

      {/* Export */}
      <button
        type="button"
        disabled={!!exportBlocked}
        onClick={onExport}
        title={exportBlocked ?? undefined}
        className={cx(
          'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors',
          exportBlocked
            ? 'cursor-not-allowed bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text-soft)]'
            : 'bg-[var(--color-watashi-indigo)] text-white hover:opacity-90',
        )}
      >
        <Download className="h-4 w-4" />
        Export
      </button>
    </div>
  )
}
