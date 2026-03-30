import type { VideoSourceType } from '../types/video-project.types'

const objectObjectPattern = /\[object object\]/i
const fileExtensionPattern = /\.[^./\\]+$/

export type AudioAssetTransferPayload = {
  id: string
  label: string
  objectUrl: string
  durationSeconds: number
}

export type VideoAssetTransferPayload = {
  id: string
  label: string
  objectUrl: string
  durationSeconds: number
}

export type ImageAssetTransferPayload = {
  id: string
  label: string
  objectUrl: string
}

type TimelineRange = {
  endSeconds: number
}

type TimelineDurationInput = {
  sourceDurationSeconds?: number | null
  segmentEndSeconds?: number | null
  audioTimelineClips?: TimelineRange[]
  videoTimelineClips?: TimelineRange[]
  imageOverlays?: TimelineRange[]
  minimumDurationSeconds?: number
}

function readFileNameLike(input: unknown) {
  if (typeof input === 'string') {
    return input
  }

  if (input && typeof input === 'object') {
    if ('name' in input && typeof input.name === 'string') {
      return input.name
    }

    if ('fileName' in input && typeof input.fileName === 'string') {
      return input.fileName
    }
  }

  return null
}

export function normalizeProjectTitle(input: unknown, fallbackTitle: string) {
  const rawTitle = readFileNameLike(input)
  if (!rawTitle || isCorruptedProjectTitle(rawTitle)) {
    return fallbackTitle
  }

  const normalizedTitle = rawTitle
    .replace(fileExtensionPattern, '')
    .replace(/[|]+/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())

  return normalizedTitle || fallbackTitle
}

export function createFallbackSourceTitle(sourceType: VideoSourceType) {
  return sourceType === 'recorded' ? 'Screen Recording' : 'Uploaded Clip'
}

export function isCorruptedProjectTitle(value: unknown) {
  return typeof value !== 'string' || objectObjectPattern.test(value)
}

export function isPlaybackToggleKey(key: string) {
  return key === ' ' || key === 'Spacebar' || key.toLowerCase() === 'k'
}

export function shouldHandlePlaybackShortcut(input: {
  key: string
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  targetTagName?: string | null
  targetIsContentEditable?: boolean
}) {
  if (
    !isPlaybackToggleKey(input.key)
    || input.altKey
    || input.ctrlKey
    || input.metaKey
    || input.targetIsContentEditable
  ) {
    return false
  }

  const tagName = input.targetTagName?.toLowerCase()
  return tagName !== 'input' && tagName !== 'textarea' && tagName !== 'select'
}

export function parseAudioAssetTransfer(rawPayload: string | null | undefined): AudioAssetTransferPayload | null {
  if (!rawPayload) {
    return null
  }

  try {
    const parsed = JSON.parse(rawPayload) as Record<string, unknown>
    if (
      typeof parsed.id !== 'string'
      || typeof parsed.label !== 'string'
      || typeof parsed.objectUrl !== 'string'
      || typeof parsed.durationSeconds !== 'number'
      || !Number.isFinite(parsed.durationSeconds)
      || parsed.durationSeconds < 0
    ) {
      return null
    }

    return {
      id: parsed.id,
      label: parsed.label,
      objectUrl: parsed.objectUrl,
      durationSeconds: parsed.durationSeconds,
    }
  } catch {
    return null
  }
}

export function parseVideoAssetTransfer(rawPayload: string | null | undefined): VideoAssetTransferPayload | null {
  if (!rawPayload) {
    return null
  }

  try {
    const parsed = JSON.parse(rawPayload) as Record<string, unknown>
    if (
      typeof parsed.id !== 'string'
      || typeof parsed.label !== 'string'
      || typeof parsed.objectUrl !== 'string'
      || typeof parsed.durationSeconds !== 'number'
      || !Number.isFinite(parsed.durationSeconds)
      || parsed.durationSeconds <= 0
    ) {
      return null
    }

    return {
      id: parsed.id,
      label: parsed.label,
      objectUrl: parsed.objectUrl,
      durationSeconds: parsed.durationSeconds,
    }
  } catch {
    return null
  }
}

export type TextOverlayTransferPayload = {
  id: string
  label: string
  durationSeconds: number
}

export type ImageOverlayTransferPayload = {
  id: string
  label: string
  durationSeconds: number
}

export function parseTextOverlayTransfer(rawPayload: string | null | undefined): TextOverlayTransferPayload | null {
  if (!rawPayload) return null
  try {
    const parsed = JSON.parse(rawPayload) as Record<string, unknown>
    if (
      typeof parsed.id !== 'string'
      || typeof parsed.label !== 'string'
      || typeof parsed.durationSeconds !== 'number'
      || !Number.isFinite(parsed.durationSeconds)
      || parsed.durationSeconds <= 0
    ) return null
    return { id: parsed.id, label: parsed.label, durationSeconds: parsed.durationSeconds }
  } catch {
    return null
  }
}

export function parseImageOverlayTransfer(rawPayload: string | null | undefined): ImageOverlayTransferPayload | null {
  if (!rawPayload) return null
  try {
    const parsed = JSON.parse(rawPayload) as Record<string, unknown>
    if (
      typeof parsed.id !== 'string'
      || typeof parsed.label !== 'string'
      || typeof parsed.durationSeconds !== 'number'
      || !Number.isFinite(parsed.durationSeconds)
      || parsed.durationSeconds <= 0
    ) return null
    return { id: parsed.id, label: parsed.label, durationSeconds: parsed.durationSeconds }
  } catch {
    return null
  }
}

export function parseImageAssetTransfer(rawPayload: string | null | undefined): ImageAssetTransferPayload | null {
  if (!rawPayload) {
    return null
  }

  try {
    const parsed = JSON.parse(rawPayload) as Record<string, unknown>
    if (
      typeof parsed.id !== 'string'
      || typeof parsed.label !== 'string'
      || typeof parsed.objectUrl !== 'string'
    ) {
      return null
    }

    return {
      id: parsed.id,
      label: parsed.label,
      objectUrl: parsed.objectUrl,
    }
  } catch {
    return null
  }
}

export function getTimelineRangeEnd(ranges: TimelineRange[] | null | undefined) {
  return (ranges ?? []).reduce((maxEnd, range) => Math.max(maxEnd, range.endSeconds), 0)
}

export function computeTimelineDuration(input: TimelineDurationInput) {
  return Math.max(
    input.sourceDurationSeconds ?? 0,
    input.segmentEndSeconds ?? 0,
    getTimelineRangeEnd(input.audioTimelineClips),
    getTimelineRangeEnd(input.videoTimelineClips),
    getTimelineRangeEnd(input.imageOverlays),
    input.minimumDurationSeconds ?? 30,
  )
}

export function isMediaOffsetAtEnd(offsetSeconds: number, mediaDurationSeconds: number | null | undefined) {
  if (!Number.isFinite(mediaDurationSeconds) || !mediaDurationSeconds || mediaDurationSeconds <= 0) {
    return false
  }

  return offsetSeconds >= Math.max(0, mediaDurationSeconds - 0.05)
}

export function clampPct(value: number) {
  return Math.min(100, Math.max(0, value))
}

export function parseTimestampLabel(label: string) {
  const [h = '0', m = '0', s = '0'] = label.split(':')
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

/** Timeline tick labels: no leading zero on minutes (e.g. "1:05") */
export function formatTimeLabel(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Playhead / control display: padded minutes (e.g. "01:05") */
export function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function clampMediaOffset(offsetSeconds: number, mediaDurationSeconds: number | null | undefined) {
  if (!Number.isFinite(mediaDurationSeconds) || !mediaDurationSeconds || mediaDurationSeconds <= 0) {
    return Math.max(0, offsetSeconds)
  }

  return Math.min(Math.max(0, offsetSeconds), Math.max(0, mediaDurationSeconds - 0.05))
}
