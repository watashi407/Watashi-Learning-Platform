import type { ProcessingJob } from '../types/video-project.types'
import { ProgressTrack, WorkspaceEyebrow, WorkspacePanel } from '../../../shared/ui/workspace'

function statusTone(status: ProcessingJob['status']) {
  if (status === 'completed') {
    return 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_18%,white)] text-[var(--color-watashi-emerald)]'
  }

  if (status === 'processing' || status === 'queued') {
    return 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_18%,white)] text-[var(--color-watashi-indigo)]'
  }

  if (status === 'failed') {
    return 'bg-rose-400/20 text-rose-100'
  }

  return 'bg-white/8 text-white/58'
}

function statusLabel(status: ProcessingJob['status']) {
  if (status === 'idle') {
    return 'Idle'
  }

  if (status === 'queued') {
    return 'Queued'
  }

  if (status === 'processing') {
    return 'Processing'
  }

  if (status === 'completed') {
    return 'Completed'
  }

  return 'Failed'
}

export function ProcessingStatusCard({
  jobs,
}: {
  jobs: ProcessingJob[]
}) {
  return (
    <WorkspacePanel className="bg-[linear-gradient(180deg,#121922,#0d141b)] text-white ring-[color-mix(in_oklab,white_10%,transparent)]">
      <WorkspaceEyebrow className="text-white/50">Processing jobs</WorkspaceEyebrow>
      <h2 className="mt-3 font-display text-[1.7rem] font-black tracking-[-0.05em] text-white">Track upload, subtitles, and render work</h2>

      <div className="mt-6 space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-[1.5rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">{job.label}</p>
                <p className="mt-2 text-sm leading-6 text-white/64">{job.detail}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusTone(job.status)}`}>
                {statusLabel(job.status)}
              </span>
            </div>
            <ProgressTrack value={job.progress} className="mt-4 bg-white/10" />
          </div>
        ))}
      </div>
    </WorkspacePanel>
  )
}
