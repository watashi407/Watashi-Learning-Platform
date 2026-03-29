import { AlertTriangle, Check, Download, Loader2, Save, Video } from 'lucide-react'
import type { LiveCaptureMode, ProcessingJob } from '../types/video-project.types'
import { cx } from '../../../shared/ui/workspace'

type JobTone = 'idle' | 'queued' | 'processing' | 'completed' | 'failed'

function jobPillStyle(status: JobTone) {
  if (status === 'completed') return 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_12%,var(--color-watashi-surface-card))] text-[var(--color-watashi-emerald)] ring-[color-mix(in_oklab,var(--color-watashi-emerald)_20%,var(--color-watashi-border))]'
  if (status === 'queued' || status === 'processing') return 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,var(--color-watashi-surface-card))] text-[var(--color-watashi-indigo)] ring-[color-mix(in_oklab,var(--color-watashi-indigo)_18%,var(--color-watashi-border))]'
  if (status === 'failed') return 'bg-[color-mix(in_oklab,var(--color-watashi-ember)_10%,var(--color-watashi-surface-card))] text-[var(--color-watashi-ember)] ring-[color-mix(in_oklab,var(--color-watashi-ember)_18%,var(--color-watashi-border))]'
  return 'bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text-soft)] ring-[var(--color-watashi-border)]'
}

type EditorTopBarProps = {
  title: string
  onTitleChange: (value: string) => void
  jobs: ProcessingJob[]
  isSaving: boolean
  saveError: string | null
  uploadProgress: number | null
  exportBlocked: string | null
  onRecord: (mode: LiveCaptureMode) => void
  onExport: () => void
}

export function EditorTopBar({ title, onTitleChange, jobs, isSaving, saveError, uploadProgress, exportBlocked, onRecord, onExport }: EditorTopBarProps) {
  const activeJobs = jobs.filter((j) => j.status !== 'idle')

  return (
    <div className="flex items-center gap-2 border-b border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)] px-4 py-2.5">
      {/* Project title */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="min-w-0 max-w-[220px] flex-shrink rounded-md bg-transparent px-2 py-1 text-[13px] font-bold text-[var(--color-watashi-text-strong)] outline-none transition-all placeholder:text-[var(--color-watashi-text-soft)] hover:bg-[var(--color-watashi-surface-low)] focus:bg-[var(--color-watashi-surface-low)] focus:ring-1 focus:ring-[var(--color-watashi-border)]"
        placeholder="Untitled project"
        aria-label="Project title"
      />

      <div className="h-4 w-px shrink-0 bg-[var(--color-watashi-border)]" />

      {/* Record button */}
      <button
        type="button"
        onClick={() => onRecord('screen-camera')}
        className="flex items-center gap-1.5 rounded-full border border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] px-3 py-1.5 text-[11px] font-semibold text-[var(--color-watashi-text)] transition-all hover:border-red-400/40 hover:bg-red-50/50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        <Video className="h-3 w-3" />
        <span className="hidden sm:inline">Screen + Cam</span>
      </button>

      {/* Active job pills */}
      {activeJobs.length > 0 && (
        <div className="flex items-center gap-1.5">
          {activeJobs.map((job) => (
            <span
              key={job.id}
              className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1', jobPillStyle(job.status as JobTone))}
            >
              {(job.status === 'queued' || job.status === 'processing') && <Loader2 className="h-3 w-3 animate-spin" />}
              {job.label}
            </span>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress !== null && uploadProgress < 100 && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[var(--color-watashi-indigo)]">
            Uploading {Math.round(uploadProgress)}%
          </span>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-[var(--color-watashi-surface-low)]">
            <div
              className="h-full rounded-full bg-[var(--color-watashi-indigo)] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save indicator */}
      {saveError ? (
        <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--color-watashi-ember)]" title={saveError}>
          <AlertTriangle className="h-3 w-3" />
          <span className="hidden sm:inline">Failed to save</span>
        </span>
      ) : isSaving ? (
        <span className="flex items-center gap-1.5 px-2 text-[11px] font-medium text-[var(--color-watashi-text-soft)]">
          <Save className="h-3 w-3 animate-pulse" />
          <span className="hidden sm:inline">Saving</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 px-2 text-[11px] font-medium text-[var(--color-watashi-emerald)]">
          <Check className="h-3 w-3" />
          <span className="hidden sm:inline">Saved</span>
        </span>
      )}

      <div className="h-4 w-px shrink-0 bg-[var(--color-watashi-border)]" />

      {/* Export */}
      <button
        type="button"
        disabled={!!exportBlocked}
        onClick={onExport}
        title={exportBlocked ?? undefined}
        className={cx(
          'flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-bold transition-all',
          exportBlocked
            ? 'cursor-not-allowed bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text-soft)]'
            : 'bg-[var(--color-watashi-indigo)] text-white shadow-[0_2px_10px_-2px_color-mix(in_oklab,var(--color-watashi-indigo)_50%,transparent)] hover:shadow-[0_4px_14px_-2px_color-mix(in_oklab,var(--color-watashi-indigo)_60%,transparent)] active:scale-[0.97]',
        )}
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>
    </div>
  )
}
