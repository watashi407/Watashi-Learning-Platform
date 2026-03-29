import type {
  AudioToolSettings,
  ExportSettings,
  ImageOverlay,
  LessonBindingOption,
  StampOverlay,
  SubtitleCue,
  TextOverlay,
  VideoEffects,
  VideoProjectBinding,
  VideoProjectSnapshot,
  VideoSegment,
  VideoUploadPolicy,
} from '../../shared/contracts/video-studio'

const DEFAULT_MAX_FILE_SIZE_MB = 2048

export function getConfiguredMaxFileSizeMb(source?: string | undefined) {
  const configuredValue = Number(source ?? import.meta.env.VITE_VIDEO_CREATION_MAX_FILE_SIZE_MB ?? DEFAULT_MAX_FILE_SIZE_MB)
  if (!Number.isFinite(configuredValue) || configuredValue <= 0) {
    return DEFAULT_MAX_FILE_SIZE_MB
  }

  return configuredValue
}

export function createVideoUploadPolicy(maxFileSizeMb = getConfiguredMaxFileSizeMb()): VideoUploadPolicy {
  return {
    minDurationSeconds: 0,
    maxDurationSeconds: 60 * 60,
    maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
  }
}

export function createDefaultSegments(): VideoSegment[] {
  return []
}

export function createDefaultSubtitleCues(): SubtitleCue[] {
  return []
}

export function createDefaultStamps(): StampOverlay[] {
  return []
}

export function createDefaultAudioSettings(): AudioToolSettings {
  return {
    voiceBoost: 72,
    noiseReduction: 58,
    musicDucking: 44,
    silenceTrim: true,
    normalizeDialogue: true,
  }
}

export function createDefaultExportSettings(): ExportSettings {
  return {
    format: 'mp4',
    resolution: '1080p',
    includeBurnedSubtitles: true,
    renderPreset: 'publish',
  }
}

export function createDefaultVideoEffects(): VideoEffects {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
  }
}

export function createDefaultTextOverlays(): TextOverlay[] {
  return []
}

export function createDefaultImageOverlays(): ImageOverlay[] {
  return []
}

export function createFallbackBindingOptions(): LessonBindingOption[] {
  return []
}

export function createDefaultBinding(bindingOptions = createFallbackBindingOptions()): VideoProjectBinding {
  const lessonOption = bindingOptions.find((option) => option.type === 'lesson')
  return {
    type: lessonOption?.type ?? 'lesson',
    targetId: lessonOption?.id ?? '',
  }
}

export function createDefaultProjectSnapshot(ownerUserId: string, bindingOptions = createFallbackBindingOptions()): VideoProjectSnapshot {
  return {
    id: ownerUserId,
    ownerUserId,
    title: 'Lesson production workspace',
    binding: createDefaultBinding(bindingOptions),
    segments: createDefaultSegments(),
    audioSettings: createDefaultAudioSettings(),
    subtitleCues: createDefaultSubtitleCues(),
    stampOverlays: createDefaultStamps(),
    exportSettings: createDefaultExportSettings(),
    textOverlays: createDefaultTextOverlays(),
    imageOverlays: createDefaultImageOverlays(),
    videoEffects: createDefaultVideoEffects(),
    sourceAsset: null,
    updatedAt: new Date().toISOString(),
  }
}
