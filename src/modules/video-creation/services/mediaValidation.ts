import type { UploadValidationResult, VideoUploadPolicy } from '../types/video-project.types'
import { createVideoUploadPolicy } from '../defaults'

export const videoUploadPolicy: VideoUploadPolicy = createVideoUploadPolicy()

export function formatDuration(seconds: number) {
  const totalSeconds = Math.max(0, Math.round(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`
  }

  return `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  return `${Math.round(bytes / (1024 * 1024))} MB`
}

export async function readVideoDuration(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file)

  return new Promise<number>((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    let settled = false
    let metadataDuration = 0

    function settle(result: number | Error) {
      if (settled) return
      settled = true
      URL.revokeObjectURL(objectUrl)
      video.src = ''
      if (result instanceof Error) reject(result)
      else resolve(result)
    }

    video.onloadedmetadata = () => {
      // Store the metadata-reported duration as a fallback.
      if (Number.isFinite(video.duration) && video.duration > 0) {
        metadataDuration = video.duration
      }
      // Always seek to the end to discover the real duration.
      // Many files (screen recordings, progressive MP4s, OBS/Loom exports) write
      // incorrect or placeholder durations in their container headers. Seeking
      // forces the browser to scan to the true playback endpoint.
      video.currentTime = 1e10
    }

    video.onseeked = () => {
      // Prefer the seek-end time; fall back to metadata duration when seeking
      // returns 0 (e.g. format has no seek index).
      settle(Math.max(video.currentTime, metadataDuration))
    }

    video.onerror = () => {
      settle(new Error('We could not inspect that video file. Please try a standard MP4, MOV, or WebM export.'))
    }

    video.src = objectUrl
  })
}

export async function readAudioDuration(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file)

  return new Promise<number>((resolve, reject) => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    let settled = false
    let metadataDuration = 0

    function settle(result: number | Error) {
      if (settled) return
      settled = true
      URL.revokeObjectURL(objectUrl)
      audio.src = ''
      if (result instanceof Error) reject(result)
      else resolve(result)
    }

    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        metadataDuration = audio.duration
      }
      // Always seek to the end to get the true playback length.
      audio.currentTime = 1e10
    }

    audio.onseeked = () => {
      settle(Math.max(audio.currentTime, metadataDuration))
    }

    audio.onerror = () => {
      settle(new Error('We could not inspect that audio file. Please try MP3, WAV, or WebM audio.'))
    }

    audio.src = objectUrl
  })
}

export function validateVideoUpload(file: File, durationSeconds: number, policy = videoUploadPolicy): UploadValidationResult {
  const errors: string[] = []

  if (file.size > policy.maxFileSizeBytes) {
    errors.push(`File exceeds the current upload limit of ${formatBytes(policy.maxFileSizeBytes)}.`)
  }

  if (policy.minDurationSeconds > 0 && durationSeconds < policy.minDurationSeconds) {
    errors.push(`Video must be at least ${formatDuration(policy.minDurationSeconds)} long.`)
  }

  if (durationSeconds > policy.maxDurationSeconds) {
    errors.push(`Video must be no longer than ${formatDuration(policy.maxDurationSeconds)}.`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    policy,
  }
}
