export type { JobRecord } from './jobs'
import type { JobRecord } from './jobs'

export type LessonBindingType = 'lesson' | 'course'

export type VideoUploadPolicy = {
  minDurationSeconds: number
  maxDurationSeconds: number
  maxFileSizeBytes: number
}

export type UploadValidationResult = {
  isValid: boolean
  errors: string[]
  policy: VideoUploadPolicy
}

export type VideoSourceType = 'recorded' | 'uploaded' | 'imported'
export type VideoAssetStatus = 'uploading' | 'processing' | 'ready' | 'failed'

export type UploadedVideoAsset = {
  id: string
  projectId: string | null
  fileName: string
  fileSizeBytes: number
  durationSeconds: number
  mimeType: string
  objectUrl: string
  storageBucket?: string | null
  storagePath?: string | null
  proxyObjectUrl?: string | null
  renderObjectUrl?: string | null
  subtitleObjectUrl?: string | null
  sourceType?: VideoSourceType
  status?: VideoAssetStatus
}

export type UploadAttemptResult = {
  accepted: boolean
  errors: string[]
  asset?: UploadedVideoAsset
}

export type VideoSegment = {
  id: string
  title: string
  summary: string
  startSeconds: number
  endSeconds: number
  tone: string
}

export type AudioToolSettings = {
  voiceBoost: number
  noiseReduction: number
  musicDucking: number
  silenceTrim: boolean
  normalizeDialogue: boolean
}

export type SubtitleCue = {
  id: string
  startLabel: string
  endLabel: string
  text: string
}

export type StampOverlay = {
  id: string
  label: string
  description: string
  placement: string
  enabled: boolean
}

export type ExportSettings = {
  format: 'mp4' | 'mov'
  resolution: '720p' | '1080p' | '4k'
  includeBurnedSubtitles: boolean
  renderPreset: 'balanced' | 'publish' | 'high-detail'
}

export type LessonBindingOption = {
  id: string
  type: LessonBindingType
  title: string
  detail: string
}

export type ProcessingJobStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed'

export type ProcessingJob = {
  id: 'upload' | 'analysis' | 'subtitles' | 'render'
  label: string
  detail: string
  status: ProcessingJobStatus
  progress: number
}

export type LiveCaptureMode = 'camera' | 'audio' | 'screen-camera'

export type LiveCaptureStatus = 'idle' | 'requesting' | 'ready' | 'recording' | 'paused' | 'recorded' | 'error'

export type VideoProjectBinding = {
  type: LessonBindingType
  targetId: string
}

export type VideoProjectSnapshot = {
  id: string
  ownerUserId: string
  title: string
  binding: VideoProjectBinding
  segments: VideoSegment[]
  audioSettings: AudioToolSettings
  subtitleCues: SubtitleCue[]
  stampOverlays: StampOverlay[]
  exportSettings: ExportSettings
  textOverlays: TextOverlay[]
  imageOverlays: ImageOverlay[]
  videoEffects: VideoEffects
  sourceAsset: UploadedVideoAsset | null
  updatedAt: string
}

export type VideoStudioBootstrap = {
  project: VideoProjectSnapshot
  bindingOptions: LessonBindingOption[]
  uploadPolicy: VideoUploadPolicy
  jobs: Array<JobRecord>
}

export type CreateVideoProjectInput = {
  title?: string
  binding?: Partial<VideoProjectBinding>
}

export type SaveVideoProjectInput = {
  projectId: string
  title: string
  binding: VideoProjectBinding
  segments: VideoSegment[]
  audioSettings: AudioToolSettings
  subtitleCues: SubtitleCue[]
  stampOverlays: StampOverlay[]
  exportSettings: ExportSettings
}

export type RecordingSessionInput = {
  projectId: string
  sources: {
    screen: boolean
    camera: boolean
    microphone: boolean
  }
  clientHints?: {
    userAgent?: string
    timezone?: string
  }
}

export type RecordingSessionRecord = {
  id: string
  projectId: string
  requestedSources: RecordingSessionInput['sources']
  clientHints: RecordingSessionInput['clientHints'] | null
  createdAt: string
}

export type CreateVideoUploadSessionInput = {
  projectId: string
  fileName: string
  contentType: string
  contentLength: number
  sourceType: VideoSourceType
}

export type CreateVideoUploadSessionResult = {
  uploadId: string
  bucketName: string
  objectPath: string
  token: string
  resumableUrl: string
  signedUploadPath: string
}

export type CompleteVideoUploadInput = {
  uploadId: string
  projectId: string
  fileName: string
  contentType: string
  sourceType: VideoSourceType
}

export type CompleteVideoUploadResult = {
  asset: UploadedVideoAsset
  probeJob: JobRecord
}

export type QueueVideoJobResult = {
  job: JobRecord
}

export type TextOverlay = {
  id: string
  text: string
  fontFamily: 'sans-serif' | 'serif' | 'mono'
  fontSize: number
  color: string
  bgColor: string | null
  position: 'top' | 'center' | 'bottom'
  startSeconds: number
  endSeconds: number
}

export type ImageOverlay = {
  id: string
  label: string
  storagePath: string | null
  objectUrl: string | null
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity: number
  startSeconds: number
  endSeconds: number
}

export type VideoEffects = {
  brightness: number
  contrast: number
  saturation: number
  blur: number
}
