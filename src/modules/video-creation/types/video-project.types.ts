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
  UploadedVideoAsset,
  UploadAttemptResult,
  UploadValidationResult,
  VideoAssetStatus,
  VideoEffects,
  VideoProjectBinding,
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
