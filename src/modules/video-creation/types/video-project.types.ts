export type {
  AudioToolSettings,
  CompleteVideoUploadInput,
  CompleteVideoUploadResult,
  CreateVideoProjectInput,
  CreateVideoUploadSessionInput,
  CreateVideoUploadSessionResult,
  ExportSettings,
  ImageOverlay,
  LessonBindingOption,
  LessonBindingType,
  LiveCaptureMode,
  LiveCaptureStatus,
  ProcessingJob,
  ProcessingJobStatus,
  QueueVideoJobResult,
  RecordingSessionInput,
  RecordingSessionRecord,
  SaveVideoProjectInput,
  StampOverlay,
  SubtitleCue,
  TextOverlay,
  DuplicateVideoProjectInput,
  UploadedVideoAsset,
  UploadAttemptResult,
  UploadValidationResult,
  VideoAssetStatus,
  VideoEffects,
  VideoProjectExportStatus,
  VideoProjectBinding,
  VideoProjectListItem,
  VideoProjectLifecycleStatus,
  VideoProjectSnapshot,
  VideoSegment,
  VideoSourceType,
  VideoStudioBootstrap,
  VideoUploadPolicy,
} from '../../../shared/contracts/video-studio'

export type RecordedCapture = {
  id: string
  mode: LiveCaptureMode
  file: File
  fileName: string
  mimeType: string
  sizeBytes: number
  objectUrl: string
}

export type AudioLibraryAsset = {
  id: string
  fileName: string
  objectUrl: string
  mimeType: string
  sizeBytes: number
  durationSeconds: number
}

export type VideoLibraryAsset = {
  id: string
  fileName: string
  objectUrl: string
  mimeType: string
  sizeBytes: number
  durationSeconds: number
}

export type ImageLibraryAsset = {
  id: string
  fileName: string
  objectUrl: string
  mimeType: string
  sizeBytes: number
}

export type TimelineAudioClip = {
  id: string
  assetId: string
  label: string
  objectUrl: string
  startSeconds: number
  endSeconds: number
}

export type TimelineVideoClip = {
  id: string
  assetId: string
  label: string
  objectUrl: string
  startSeconds: number
  endSeconds: number
  durationSeconds: number
}
