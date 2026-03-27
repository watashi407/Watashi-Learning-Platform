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

export async function readVideoDuration(file: File) {
  const objectUrl = URL.createObjectURL(file)

  return await new Promise<number>((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      URL.revokeObjectURL(objectUrl)
      resolve(duration)
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('We could not inspect that video file. Please try a standard MP4, MOV, or WebM export.'))
    }

    video.src = objectUrl
  })
}

export function validateVideoUpload(file: File, durationSeconds: number, policy = videoUploadPolicy): UploadValidationResult {
  const errors: string[] = []

  if (file.size > policy.maxFileSizeBytes) {
    errors.push(`File exceeds the current upload limit of ${formatBytes(policy.maxFileSizeBytes)}.`)
  }

  if (durationSeconds < policy.minDurationSeconds) {
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
