import { useState } from 'react'
import type {
  AudioToolSettings,
  ExportSettings,
  LessonBindingOption,
  LessonBindingType,
  StampOverlay,
  SubtitleCue,
  VideoSegment,
} from '../types/video-project.types'

const defaultSegments: VideoSegment[] = [
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

const defaultSubtitleCues: SubtitleCue[] = [
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

const defaultStamps: StampOverlay[] = [
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

const defaultAudioSettings: AudioToolSettings = {
  voiceBoost: 72,
  noiseReduction: 58,
  musicDucking: 44,
  silenceTrim: true,
  normalizeDialogue: true,
}

const defaultExportSettings: ExportSettings = {
  format: 'mp4',
  resolution: '1080p',
  includeBurnedSubtitles: true,
  renderPreset: 'publish',
}

const lessonBindingOptions: LessonBindingOption[] = [
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

export function useVideoProject() {
  const [projectTitle, setProjectTitle] = useState('Lesson production workspace')
  const [segments, setSegments] = useState<VideoSegment[]>(defaultSegments)
  const [audioSettings, setAudioSettings] = useState<AudioToolSettings>(defaultAudioSettings)
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>(defaultSubtitleCues)
  const [stampOverlays, setStampOverlays] = useState<StampOverlay[]>(defaultStamps)
  const [exportSettings, setExportSettings] = useState<ExportSettings>(defaultExportSettings)
  const [bindingType, setBindingType] = useState<LessonBindingType>('lesson')
  const [bindingTargetId, setBindingTargetId] = useState('lesson-quantum-05')

  function updateSegment(segmentId: string, field: 'startSeconds' | 'endSeconds', value: number) {
    setSegments((currentSegments) =>
      currentSegments.map((segment) =>
        segment.id === segmentId
          ? (() => {
              const roundedValue = Math.max(0, Math.round(value))

              if (field === 'startSeconds') {
                return {
                  ...segment,
                  startSeconds: Math.min(roundedValue, Math.max(0, segment.endSeconds - 15)),
                }
              }

              return {
                ...segment,
                endSeconds: Math.max(roundedValue, segment.startSeconds + 15),
              }
            })()
          : segment,
      ),
    )
  }

  function moveSegment(segmentId: string, direction: 'up' | 'down') {
    setSegments((currentSegments) => {
      const currentIndex = currentSegments.findIndex((segment) => segment.id === segmentId)

      if (currentIndex === -1) {
        return currentSegments
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

      if (targetIndex < 0 || targetIndex >= currentSegments.length) {
        return currentSegments
      }

      const nextSegments = [...currentSegments]
      const [segment] = nextSegments.splice(currentIndex, 1)
      nextSegments.splice(targetIndex, 0, segment)
      return nextSegments
    })
  }

  function updateAudioSetting(field: keyof AudioToolSettings, value: number | boolean) {
    setAudioSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }))
  }

  function updateSubtitleCue(cueId: string, field: keyof SubtitleCue, value: string) {
    setSubtitleCues((currentCues) =>
      currentCues.map((cue) => (cue.id === cueId ? { ...cue, [field]: value } : cue)),
    )
  }

  function addSubtitleCue() {
    setSubtitleCues((currentCues) => [
      ...currentCues,
      {
        id: `cue-${currentCues.length + 1}`,
        startLabel: '00:00:30',
        endLabel: '00:00:37',
        text: 'Add a new subtitle cue or paste generated dialogue here.',
      },
    ])
  }

  function toggleStamp(stampId: string) {
    setStampOverlays((currentStamps) =>
      currentStamps.map((stamp) => (stamp.id === stampId ? { ...stamp, enabled: !stamp.enabled } : stamp)),
    )
  }

  function updateExportSetting<K extends keyof ExportSettings>(field: K, value: ExportSettings[K]) {
    setExportSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }))
  }

  function updateBindingType(nextType: LessonBindingType) {
    setBindingType(nextType)
    const firstMatchingOption = lessonBindingOptions.find((option) => option.type === nextType)
    setBindingTargetId(firstMatchingOption?.id ?? '')
  }

  const filteredBindingOptions = lessonBindingOptions.filter((option) => option.type === bindingType)

  return {
    projectTitle,
    setProjectTitle,
    segments,
    updateSegment,
    moveSegment,
    audioSettings,
    updateAudioSetting,
    subtitleCues,
    updateSubtitleCue,
    addSubtitleCue,
    stampOverlays,
    toggleStamp,
    exportSettings,
    updateExportSetting,
    bindingType,
    bindingTargetId,
    setBindingTargetId,
    updateBindingType,
    bindingOptions: filteredBindingOptions,
    allBindingOptions: lessonBindingOptions,
  }
}
