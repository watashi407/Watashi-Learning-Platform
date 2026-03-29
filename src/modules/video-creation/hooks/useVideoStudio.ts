import { useEffect, useMemo, useRef, useState } from 'react'
import * as tus from 'tus-js-client'
import { getDisplayErrorMessage } from '../../../shared/errors'
import type {
  AudioToolSettings,
  ExportSettings,
  ImageOverlay,
  LessonBindingOption,
  LessonBindingType,
  ProcessingJob,
  RecordingSessionInput,
  StampOverlay,
  SubtitleCue,
  TextOverlay,
  UploadedVideoAsset,
  VideoEffects,
  VideoProjectSnapshot,
  VideoSegment,
  VideoSourceType,
} from '../types/video-project.types'
import {
  bootstrapVideoStudioClient,
  completeVideoUploadClient,
  createRecordingSessionClient,
  createVideoUploadSessionClient,
  queueRenderJobClient,
  queueSubtitleJobClient,
  saveVideoProjectClient,
} from '../client'
import {
  createDefaultAudioSettings,
  createDefaultExportSettings,
  createDefaultImageOverlays,
  createDefaultStamps,
  createDefaultSubtitleCues,
  createDefaultTextOverlays,
  createDefaultVideoEffects,
} from '../defaults'
import { readVideoDuration, validateVideoUpload } from '../services/mediaValidation'

function mapJobRecordsToProcessingJobs(jobRecords: Array<{ id: string; type: string; status: string; error: string | null }>): ProcessingJob[] {
  const latestJobByType = new Map(jobRecords.map((job) => [job.type, job]))
  const getStatus = (type: string) => {
    const job = latestJobByType.get(type)
    if (!job) {
      return 'idle' as const
    }

    if (job.status === 'running') {
      return 'processing' as const
    }

    return job.status as ProcessingJob['status']
  }

  const getDetail = (type: string, idleDetail: string) => latestJobByType.get(type)?.error || idleDetail

  return [
    {
      id: 'upload',
      label: 'Upload pipeline',
      detail: getDetail('video-probe', 'Waiting for a source video.'),
      status: getStatus('video-probe'),
      progress: latestJobByType.get('video-probe')?.status === 'completed' ? 100 : latestJobByType.get('video-probe')?.status === 'running' ? 68 : latestJobByType.get('video-probe') ? 18 : 0,
    },
    {
      id: 'analysis',
      label: 'Timeline + waveform prep',
      detail: getDetail('video-waveform', 'Metadata analysis will start after a valid upload.'),
      status: getStatus('video-waveform'),
      progress: latestJobByType.get('video-waveform')?.status === 'completed' ? 100 : latestJobByType.get('video-waveform')?.status === 'running' ? 72 : latestJobByType.get('video-waveform') ? 20 : 0,
    },
    {
      id: 'subtitles',
      label: 'Subtitle generation',
      detail: getDetail('video-subtitles', 'Ready to generate subtitles without blocking the editor.'),
      status: getStatus('video-subtitles'),
      progress: latestJobByType.get('video-subtitles')?.status === 'completed' ? 100 : latestJobByType.get('video-subtitles')?.status === 'running' ? 74 : latestJobByType.get('video-subtitles') ? 16 : 0,
    },
    {
      id: 'render',
      label: 'Final export',
      detail: getDetail('video-render', 'Queue a publish-ready render after binding to a lesson or course.'),
      status: getStatus('video-render'),
      progress: latestJobByType.get('video-render')?.status === 'completed' ? 100 : latestJobByType.get('video-render')?.status === 'running' ? 78 : latestJobByType.get('video-render') ? 22 : 0,
    },
  ]
}

function isActiveJob(job: { status: string }) {
  return job.status === 'queued' || job.status === 'running'
}

function buildSourceSegment(durationSeconds: number): VideoSegment[] {
  const safeDuration = Math.max(1, Math.round(durationSeconds))

  return [
    {
      id: 'source',
      title: 'Source clip',
      summary: 'Imported source media clip.',
      startSeconds: 0,
      endSeconds: safeDuration,
      tone: 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_18%,white)] text-slate-800',
    },
  ]
}

export function useVideoStudio() {
  const [project, setProject] = useState<VideoProjectSnapshot | null>(null)
  const [bindingOptions, setBindingOptions] = useState<LessonBindingOption[]>([])
  const [jobRecords, setJobRecords] = useState<Array<{ id: string; type: string; status: string; error: string | null }>>([])
  const [uploadPolicy, setUploadPolicy] = useState({
    minDurationSeconds: 0,
    maxDurationSeconds: 3600,
    maxFileSizeBytes: 2048 * 1024 * 1024,
  })
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isInspecting, setIsInspecting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const latestProjectRef = useRef<VideoProjectSnapshot | null>(null)
  const hydratedRef = useRef(false)
  const lastSavedSnapshotRef = useRef('')
  const currentObjectUrlRef = useRef<string | null>(null)

  async function refreshBootstrap() {
    setIsBootstrapping(true)
    try {
      const nextBootstrap = await bootstrapVideoStudioClient()
      setProject(nextBootstrap.project)
      latestProjectRef.current = nextBootstrap.project
      setBindingOptions(nextBootstrap.bindingOptions)
      setUploadPolicy(nextBootstrap.uploadPolicy)
      setJobRecords(nextBootstrap.jobs)
      lastSavedSnapshotRef.current = JSON.stringify({
        title: nextBootstrap.project.title,
        binding: nextBootstrap.project.binding,
        segments: nextBootstrap.project.segments,
        audioSettings: nextBootstrap.project.audioSettings,
        subtitleCues: nextBootstrap.project.subtitleCues,
        stampOverlays: nextBootstrap.project.stampOverlays,
        exportSettings: nextBootstrap.project.exportSettings,
        textOverlays: nextBootstrap.project.textOverlays,
        imageOverlays: nextBootstrap.project.imageOverlays,
        videoEffects: nextBootstrap.project.videoEffects,
      })
      hydratedRef.current = true
      setSaveError(null)
    } catch (error) {
      setSaveError(getDisplayErrorMessage(error, 'We could not load the video studio right now.'))
    } finally {
      setIsBootstrapping(false)
    }
  }

  useEffect(() => {
    void refreshBootstrap()
  }, [])

  useEffect(() => {
    return () => {
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!project || !hydratedRef.current) {
      return
    }

    const nextSnapshot = JSON.stringify({
      title: project.title,
      binding: project.binding,
      segments: project.segments,
      audioSettings: project.audioSettings,
      subtitleCues: project.subtitleCues,
      stampOverlays: project.stampOverlays,
      exportSettings: project.exportSettings,
      textOverlays: project.textOverlays,
      imageOverlays: project.imageOverlays,
      videoEffects: project.videoEffects,
    })

    if (nextSnapshot === lastSavedSnapshotRef.current) {
      return
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSaving(true)
        const savedProject = await saveVideoProjectClient({
          projectId: project.id,
          title: project.title,
          binding: project.binding,
          segments: project.segments,
          audioSettings: project.audioSettings,
          subtitleCues: project.subtitleCues,
          stampOverlays: project.stampOverlays,
          exportSettings: project.exportSettings,
          textOverlays: project.textOverlays,
          imageOverlays: project.imageOverlays,
          videoEffects: project.videoEffects,
        })
        setProject((currentProject) => currentProject ? { ...currentProject, updatedAt: savedProject.updatedAt } : currentProject)
        latestProjectRef.current = savedProject
        lastSavedSnapshotRef.current = nextSnapshot
        setSaveError(null)
      } catch (error) {
        setSaveError(getDisplayErrorMessage(error, 'We could not save the latest studio edits.'))
      } finally {
        setIsSaving(false)
      }
    }, 700)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [project])

  const hasActiveJobs = jobRecords.some(isActiveJob)
  useEffect(() => {
    if (!hasActiveJobs) {
      return
    }

    const intervalId = window.setInterval(() => {
      void refreshBootstrap()
    }, 1800)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [hasActiveJobs])

  const selectedBinding = useMemo(
    () => bindingOptions.find((option) => option.id === project?.binding.targetId),
    [bindingOptions, project?.binding.targetId],
  )

  const filteredBindingOptions = useMemo(
    () => bindingOptions.filter((option) => option.type === (project?.binding.type ?? 'lesson')),
    [bindingOptions, project?.binding.type],
  )

  const jobs = useMemo(() => mapJobRecordsToProcessingJobs(jobRecords), [jobRecords])

  function updateProject(mutator: (currentProject: VideoProjectSnapshot) => VideoProjectSnapshot) {
    setProject((currentProject) => {
      if (!currentProject) {
        return currentProject
      }

      const nextProject = mutator(currentProject)
      latestProjectRef.current = nextProject
      return nextProject
    })
  }

  function setProjectTitle(title: string) {
    updateProject((currentProject) => ({
      ...currentProject,
      title,
    }))
  }

  function updateSegment(segmentId: string, field: 'startSeconds' | 'endSeconds', value: number) {
    updateProject((currentProject) => ({
      ...currentProject,
      segments: currentProject.segments.map((segment) =>
        segment.id === segmentId
          ? field === 'startSeconds'
            ? { ...segment, startSeconds: Math.min(Math.max(0, Math.round(value)), Math.max(0, segment.endSeconds - 15)) }
            : { ...segment, endSeconds: Math.max(Math.round(value), segment.startSeconds + 15) }
          : segment,
      ),
    }))
  }

  function splitSegment(segmentId: string, atSeconds: number) {
    updateProject((p) => {
      const seg = p.segments.find((s) => s.id === segmentId)
      if (!seg) return p
      const cutTime = Math.round(atSeconds)
      // Need at least 1s on each side
      if (cutTime <= seg.startSeconds + 1 || cutTime >= seg.endSeconds - 1) return p
      const newId = `seg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const first = { ...seg, endSeconds: cutTime }
      const second = { ...seg, id: newId, title: `${seg.title} (2)`, startSeconds: cutTime }
      return {
        ...p,
        segments: p.segments.flatMap((s) => (s.id === segmentId ? [first, second] : [s])),
      }
    })
  }

  function removeSegment(segmentId: string) {
    updateProject((p) => {
      if (p.segments.length <= 1) return p
      return { ...p, segments: p.segments.filter((s) => s.id !== segmentId) }
    })
  }

  function moveSegment(segmentId: string, direction: 'up' | 'down') {
    updateProject((currentProject) => {
      const currentIndex = currentProject.segments.findIndex((segment) => segment.id === segmentId)
      if (currentIndex === -1) {
        return currentProject
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (targetIndex < 0 || targetIndex >= currentProject.segments.length) {
        return currentProject
      }

      const nextSegments = [...currentProject.segments]
      const [segment] = nextSegments.splice(currentIndex, 1)
      nextSegments.splice(targetIndex, 0, segment)
      return {
        ...currentProject,
        segments: nextSegments,
      }
    })
  }

  function updateAudioSetting(field: keyof AudioToolSettings, value: number | boolean) {
    updateProject((currentProject) => ({
      ...currentProject,
      audioSettings: {
        ...currentProject.audioSettings,
        [field]: value,
      },
    }))
  }

  function updateSubtitleCue(cueId: string, field: keyof SubtitleCue, value: string) {
    updateProject((currentProject) => ({
      ...currentProject,
      subtitleCues: currentProject.subtitleCues.map((cue) => (cue.id === cueId ? { ...cue, [field]: value } : cue)),
    }))
  }

  function addSubtitleCue() {
    updateProject((currentProject) => ({
      ...currentProject,
      subtitleCues: [
        ...currentProject.subtitleCues,
        {
          id: `cue-${currentProject.subtitleCues.length + 1}`,
          startLabel: '00:00:30',
          endLabel: '00:00:37',
          text: 'Add a new subtitle cue or paste generated dialogue here.',
        },
      ],
    }))
  }

  function toggleStamp(stampId: string) {
    updateProject((currentProject) => ({
      ...currentProject,
      stampOverlays: currentProject.stampOverlays.map((stamp) =>
        stamp.id === stampId ? { ...stamp, enabled: !stamp.enabled } : stamp,
      ),
    }))
  }

  function updateExportSetting<K extends keyof ExportSettings>(field: K, value: ExportSettings[K]) {
    updateProject((currentProject) => ({
      ...currentProject,
      exportSettings: {
        ...currentProject.exportSettings,
        [field]: value,
      },
    }))
  }

  function updateBindingType(nextType: LessonBindingType) {
    const firstMatchingOption = bindingOptions.find((option) => option.type === nextType)
    updateProject((currentProject) => ({
      ...currentProject,
      binding: {
        type: nextType,
        targetId: firstMatchingOption?.id ?? '',
      },
    }))
  }

  function setBindingTargetId(targetId: string) {
    updateProject((currentProject) => ({
      ...currentProject,
      binding: {
        ...currentProject.binding,
        targetId,
      },
    }))
  }

  function addTextOverlay(overlay: TextOverlay) {
    updateProject((p) => ({ ...p, textOverlays: [...(p.textOverlays ?? []), overlay] }))
  }

  function updateTextOverlay(id: string, patch: Partial<TextOverlay>) {
    updateProject((p) => ({
      ...p,
      textOverlays: (p.textOverlays ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }

  function removeTextOverlay(id: string) {
    updateProject((p) => ({ ...p, textOverlays: (p.textOverlays ?? []).filter((t) => t.id !== id) }))
  }

  function addImageOverlay(overlay: ImageOverlay) {
    updateProject((p) => ({ ...p, imageOverlays: [...(p.imageOverlays ?? []), overlay] }))
  }

  function updateImageOverlay(id: string, patch: Partial<ImageOverlay>) {
    updateProject((p) => ({
      ...p,
      imageOverlays: (p.imageOverlays ?? []).map((img) => (img.id === id ? { ...img, ...patch } : img)),
    }))
  }

  function removeImageOverlay(id: string) {
    updateProject((p) => ({ ...p, imageOverlays: (p.imageOverlays ?? []).filter((img) => img.id !== id) }))
  }

  function updateVideoEffect<K extends keyof VideoEffects>(field: K, value: VideoEffects[K]) {
    updateProject((p) => ({
      ...p,
      videoEffects: { ...(p.videoEffects ?? createDefaultVideoEffects()), [field]: value },
    }))
  }

  async function createCaptureSession() {
    if (!project) {
      return
    }

    const sources: RecordingSessionInput['sources'] = { screen: true, camera: true, microphone: true }

    await createRecordingSessionClient({
      projectId: project.id,
      sources,
      clientHints: {
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    })
  }

  async function stageFile(file: File | null, sourceType: VideoSourceType = 'uploaded') {
    if (!file || !project) {
      return { accepted: false, errors: [] }
    }

    setValidationErrors([])
    setIsInspecting(true)

    let localObjectUrl: string | null = null

    try {
      let durationSeconds = 0
      try {
        durationSeconds = await readVideoDuration(file)
      } catch {
        durationSeconds = 0
      }

      const validation = validateVideoUpload(file, durationSeconds, uploadPolicy)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        return {
          accepted: false,
          errors: validation.errors,
        }
      }

      localObjectUrl = URL.createObjectURL(file)
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current)
      }
      currentObjectUrlRef.current = localObjectUrl

      const localDuration = Math.max(1, Math.round(durationSeconds))
      const localAsset: UploadedVideoAsset = {
        id: `local-${Date.now()}`,
        projectId: project.id,
        fileName: file.name,
        fileSizeBytes: file.size,
        durationSeconds: localDuration,
        mimeType: file.type || 'video/mp4',
        objectUrl: localObjectUrl,
        sourceType,
        status: 'processing',
      }

      updateProject((currentProject) => ({
        ...currentProject,
        sourceAsset: localAsset,
        segments: buildSourceSegment(localDuration),
      }))

      try {
        const session = await createVideoUploadSessionClient({
          projectId: project.id,
          fileName: file.name,
          contentType: file.type || 'video/mp4',
          contentLength: file.size,
          sourceType,
        })

        if (session.resumableUrl) {
          setUploadProgress(0)
          await new Promise<void>((resolve, reject) => {
            const upload = new tus.Upload(file, {
              endpoint: session.resumableUrl,
              chunkSize: 5 * 1024 * 1024,
              retryDelays: [0, 1500, 3000, 5000],
              uploadSize: file.size,
              metadata: {
                uploadId: session.uploadId,
              },
              headers: {
                'x-video-upload-token': session.token,
              },
              onError: reject,
              onProgress: (bytesUploaded, bytesTotal) => {
                setUploadProgress(bytesTotal > 0 ? (bytesUploaded / bytesTotal) * 100 : 0)
              },
              onSuccess: () => {
                setUploadProgress(100)
                resolve()
              },
            })

            void upload.findPreviousUploads().then((previousUploads) => {
              if (previousUploads[0]) {
                upload.resumeFromPreviousUpload(previousUploads[0])
              }

              upload.start()
            }).catch(reject)
          })
        }

        setUploadProgress(null)

        const uploadResult = await completeVideoUploadClient({
          uploadId: session.uploadId,
          projectId: project.id,
          fileName: file.name,
          contentType: file.type || 'video/mp4',
          sourceType,
        })

        setJobRecords((currentJobs) => [
          uploadResult.probeJob,
          ...currentJobs.filter((job) => job.id !== uploadResult.probeJob.id),
        ])

        const nextDurationSeconds = Math.max(
          1,
          Math.round(uploadResult.asset.durationSeconds || durationSeconds || localDuration),
        )
        const nextAsset: UploadedVideoAsset = {
          ...uploadResult.asset,
          durationSeconds: nextDurationSeconds,
          objectUrl: uploadResult.asset.objectUrl || localObjectUrl,
        }

        updateProject((currentProject) => ({
          ...currentProject,
          sourceAsset: nextAsset,
          segments: buildSourceSegment(nextDurationSeconds),
        }))

        return {
          accepted: true,
          errors: [],
          asset: nextAsset,
        }
      } catch (error) {
        const message = getDisplayErrorMessage(error, 'The video is loaded locally, but cloud sync failed.')
        setValidationErrors([message])

        return {
          accepted: true,
          errors: [message],
          asset: localAsset,
        }
      }
    } catch (error) {
      const message = getDisplayErrorMessage(error, 'We could not upload that video.')
      setValidationErrors([message])

      if (localObjectUrl && currentObjectUrlRef.current === localObjectUrl) {
        URL.revokeObjectURL(localObjectUrl)
        currentObjectUrlRef.current = null
      }

      return {
        accepted: false,
        errors: [message],
      }
    } finally {
      setIsInspecting(false)
      setUploadProgress(null)
    }
  }

  async function queueSubtitleWorkflow() {
    if (!project) {
      return
    }

    const result = await queueSubtitleJobClient(project.id)
    setJobRecords((currentJobs) => [result.job, ...currentJobs.filter((job) => job.id !== result.job.id)])
  }

  async function queueRenderWorkflow() {
    if (!project) {
      return
    }

    const result = await queueRenderJobClient(project.id)
    setJobRecords((currentJobs) => [result.job, ...currentJobs.filter((job) => job.id !== result.job.id)])
  }

  return {
    project,
    isBootstrapping,
    isSaving,
    saveError,
    policy: uploadPolicy,
    bindingOptions: filteredBindingOptions,
    allBindingOptions: bindingOptions,
    selectedBinding,
    jobs,
    uploadedAsset: project?.sourceAsset ?? null,
    validationErrors,
    isInspecting,
    uploadProgress,
    createCaptureSession,
    stageFile,
    queueSubtitleWorkflow,
    queueRenderWorkflow,
    projectTitle: project?.title ?? 'Lesson production workspace',
    setProjectTitle,
    segments: project?.segments ?? [],
    updateSegment,
    splitSegment,
    removeSegment,
    moveSegment,
    audioSettings: project?.audioSettings ?? createDefaultAudioSettings(),
    updateAudioSetting,
    subtitleCues: project?.subtitleCues ?? createDefaultSubtitleCues(),
    updateSubtitleCue,
    addSubtitleCue,
    stampOverlays: project?.stampOverlays ?? createDefaultStamps(),
    toggleStamp,
    exportSettings: project?.exportSettings ?? createDefaultExportSettings(),
    updateExportSetting,
    bindingType: project?.binding.type ?? 'lesson',
    bindingTargetId: project?.binding.targetId ?? '',
    setBindingTargetId,
    updateBindingType,
    textOverlays: project?.textOverlays ?? createDefaultTextOverlays(),
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    imageOverlays: project?.imageOverlays ?? createDefaultImageOverlays(),
    addImageOverlay,
    updateImageOverlay,
    removeImageOverlay,
    videoEffects: project?.videoEffects ?? createDefaultVideoEffects(),
    updateVideoEffect,
    refreshBootstrap,
  }
}
