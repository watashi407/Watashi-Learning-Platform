import { useEffect, useRef, useState } from 'react'
import type { ProcessingJob } from '../types/video-project.types'

const initialJobs: ProcessingJob[] = [
  {
    id: 'upload',
    label: 'Upload pipeline',
    detail: 'Waiting for a source video.',
    status: 'idle',
    progress: 0,
  },
  {
    id: 'analysis',
    label: 'Timeline + waveform prep',
    detail: 'Metadata analysis will start after a valid upload.',
    status: 'idle',
    progress: 0,
  },
  {
    id: 'subtitles',
    label: 'Subtitle generation',
    detail: 'Ready to generate subtitles without blocking the editor.',
    status: 'idle',
    progress: 0,
  },
  {
    id: 'render',
    label: 'Final export',
    detail: 'Queue a publish-ready render after binding to a lesson or course.',
    status: 'idle',
    progress: 0,
  },
]

export function useProcessingJobs() {
  const [jobs, setJobs] = useState(initialJobs)
  const timeouts = useRef<number[]>([])

  useEffect(() => {
    return () => {
      timeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [])

  function updateJob(jobId: ProcessingJob['id'], update: Partial<ProcessingJob>) {
    setJobs((currentJobs) =>
      currentJobs.map((job) => (job.id === jobId ? { ...job, ...update } : job)),
    )
  }

  function scheduleLifecycle(
    jobId: ProcessingJob['id'],
    queuedDetail: string,
    processingDetail: string,
    completedDetail: string,
    processingDelay = 600,
    completedDelay = 2200,
  ) {
    updateJob(jobId, { status: 'queued', detail: queuedDetail, progress: 12 })

    const processingTimeout = window.setTimeout(() => {
      updateJob(jobId, { status: 'processing', detail: processingDetail, progress: 68 })
    }, processingDelay)

    const completedTimeout = window.setTimeout(() => {
      updateJob(jobId, { status: 'completed', detail: completedDetail, progress: 100 })
    }, completedDelay)

    timeouts.current.push(processingTimeout, completedTimeout)
  }

  function markUploadRejected(detail: string) {
    updateJob('upload', {
      status: 'failed',
      detail,
      progress: 0,
    })

    updateJob('analysis', {
      status: 'idle',
      detail: 'Metadata analysis will start after a valid upload.',
      progress: 0,
    })
  }

  function queueUploadWorkflow(fileName: string) {
    scheduleLifecycle(
      'upload',
      `Validating ${fileName} before transfer.`,
      `Uploading ${fileName} through the educator pipeline.`,
      `${fileName} is staged and ready for editing.`,
      400,
      1800,
    )

    scheduleLifecycle(
      'analysis',
      'Preparing duration, waveform, and scene analysis.',
      'Generating edit handles, timeline markers, and waveform previews.',
      'Timeline analysis is complete and ready for editing.',
      900,
      2600,
    )
  }

  function queueSubtitleWorkflow(projectTitle: string) {
    scheduleLifecycle(
      'subtitles',
      'Sending the latest cut for subtitle generation.',
      'Transcribing lesson dialogue and timing captions.',
      `Subtitle draft is ready for ${projectTitle}.`,
      400,
      2100,
    )
  }

  function queueRenderWorkflow(targetLabel: string) {
    scheduleLifecycle(
      'render',
      'Render queued with export settings and lesson binding.',
      'Rendering captions, overlays, and audio polish server-side.',
      `Final render is ready to attach to ${targetLabel}.`,
      700,
      2600,
    )
  }

  return {
    jobs,
    markUploadRejected,
    queueUploadWorkflow,
    queueSubtitleWorkflow,
    queueRenderWorkflow,
  }
}
