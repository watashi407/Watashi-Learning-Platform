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
    minDurationSeconds: 3 * 60,
    maxDurationSeconds: 60 * 60,
    maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
  }
}

export function createDefaultSegments(): VideoSegment[] {
  return [
    {
      id: 'intro',
      title: 'Lesson opener',
      summary: 'Context framing and learning outcome.',
      startSeconds: 0,
      endSeconds: 120,
      tone: 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_18%,white)] text-slate-800',
    },
    {
      id: 'core',
      title: 'Core walkthrough',
      summary: 'Main educator explanation and guided demo.',
      startSeconds: 120,
      endSeconds: 780,
      tone: 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_20%,white)] text-slate-800',
    },
    {
      id: 'recap',
      title: 'Recap + callout',
      summary: 'Chapter marker recap and learner action prompt.',
      startSeconds: 780,
      endSeconds: 930,
      tone: 'bg-[color-mix(in_oklab,var(--color-watashi-ember)_18%,white)] text-slate-800',
    },
  ]
}

export function createDefaultSubtitleCues(): SubtitleCue[] {
  return [
    {
      id: 'cue-1',
      startLabel: '00:00:04',
      endLabel: '00:00:11',
      text: 'Welcome back. In this lesson we will turn a rough concept into a production-ready course video.',
    },
    {
      id: 'cue-2',
      startLabel: '00:00:14',
      endLabel: '00:00:22',
      text: 'We will trim dead space, clean the narration, add chapter stamps, and prepare a publishable export.',
    },
  ]
}

export function createDefaultStamps(): StampOverlay[] {
  return [
    {
      id: 'logo',
      label: 'Logo / watermark',
      description: 'Keep brand presence visible during playback.',
      placement: 'Top-right',
      enabled: true,
    },
    {
      id: 'badge',
      label: 'Lesson badge',
      description: 'Display course and module context near the opening section.',
      placement: 'Top-left',
      enabled: true,
    },
    {
      id: 'chapters',
      label: 'Chapter markers',
      description: 'Show chapter or section boundaries inside the preview.',
      placement: 'Timeline + lower-third',
      enabled: true,
    },
    {
      id: 'note',
      label: 'Important note stamp',
      description: 'Surface educator emphasis for key learner moments.',
      placement: 'Inline callout',
      enabled: false,
    },
  ]
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
  return [
    {
      id: 'lesson-quantum-05',
      type: 'lesson',
      title: 'Lesson 5: Space-Time Fabric',
      detail: 'Quantum Architecture | Module 2',
    },
    {
      id: 'lesson-ui-motion-03',
      type: 'lesson',
      title: 'Lesson 3: Motion Systems',
      detail: 'Applied Interface Design | Module 1',
    },
    {
      id: 'course-quantum-architecture',
      type: 'course',
      title: 'Course: Introduction to Quantum Architecture',
      detail: 'Attach the final render as a course asset.',
    },
    {
      id: 'course-ai-interface',
      type: 'course',
      title: 'Course: AI-Assisted Interface Design',
      detail: 'Publish directly to the main course library.',
    },
  ]
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
