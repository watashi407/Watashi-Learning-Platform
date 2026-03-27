import type { PublicErrorPayload } from '../errors'

export type JobType =
  | 'study-path'
  | 'course-outline'
  | 'community-moderation'
  | 'notification-test'
  | 'video-probe'
  | 'video-waveform'
  | 'video-subtitles'
  | 'video-render'
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed'

export type JobRecord<TPayload = unknown, TResult = unknown> = {
  id: string
  type: JobType
  status: JobStatus
  userId: string | null
  userEmail: string | null
  payload: TPayload | null
  result: TResult | null
  error: string | null
  taskId: string | null
  createdAt: string
  updatedAt: string
}

export type StudyPathRequest = {
  learnerName: string
  currentCourses: Array<{
    title: string
    progress: number
  }>
}

export type StudyPathResult = {
  pivot: string
  tip: string
}

export type CourseOutlineRequest = {
  topic: string
}

export type CourseOutlineResult = {
  title: string
  desc: string
  modules: Array<{
    name: string
    detail: string
  }>
}

export type CommunityModerationRequest = {
  content: string
}

export type CommunityModerationResult = {
  verdict: 'approved' | 'flagged'
  summary: string
  reasons: string[]
}

export type NotificationTestRequest = {
  recipient: string
  message: string
}

export type NotificationTestResult = {
  accepted: boolean
  channel: 'test'
  recipient: string
  message: string
}

export type JobCreateSuccess<TResult> = {
  jobId: string
  status: JobStatus
  taskId?: string
  result?: TResult
}

export type ActionResult<TData> =
  | {
      ok: true
      data: TData
    }
  | {
      ok: false
      error: PublicErrorPayload
    }
