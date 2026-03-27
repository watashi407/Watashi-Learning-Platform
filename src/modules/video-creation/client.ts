import { unwrapActionResult } from '../../shared/errors'
import type {
  CompleteVideoUploadInput,
  CreateVideoProjectInput,
  CreateVideoUploadSessionInput,
  QueueVideoJobResult,
  RecordingSessionInput,
  SaveVideoProjectInput,
} from '../../shared/contracts/video-studio'
import {
  bootstrapVideoStudioFn,
  completeVideoUploadFn,
  createRecordingSessionFn,
  createVideoProjectFn,
  createVideoUploadSessionFn,
  queueRenderJobFn,
  queueSubtitleJobFn,
  saveVideoProjectFn,
} from './video-studio.functions'

export async function bootstrapVideoStudioClient() {
  return unwrapActionResult(await bootstrapVideoStudioFn())
}

export async function createVideoProjectClient(payload: CreateVideoProjectInput) {
  return unwrapActionResult(await createVideoProjectFn({ data: payload }))
}

export async function saveVideoProjectClient(payload: SaveVideoProjectInput) {
  return unwrapActionResult(await saveVideoProjectFn({ data: payload }))
}

export async function createRecordingSessionClient(payload: RecordingSessionInput) {
  return unwrapActionResult(await createRecordingSessionFn({ data: payload }))
}

export async function createVideoUploadSessionClient(payload: CreateVideoUploadSessionInput) {
  return unwrapActionResult(await createVideoUploadSessionFn({ data: payload }))
}

export async function completeVideoUploadClient(payload: CompleteVideoUploadInput) {
  return unwrapActionResult(await completeVideoUploadFn({ data: payload }))
}

export async function queueSubtitleJobClient(projectId: string): Promise<QueueVideoJobResult> {
  return unwrapActionResult(await queueSubtitleJobFn({ data: { projectId } }))
}

export async function queueRenderJobClient(projectId: string): Promise<QueueVideoJobResult> {
  return unwrapActionResult(await queueRenderJobFn({ data: { projectId } }))
}
