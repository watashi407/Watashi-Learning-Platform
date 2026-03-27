import { randomUUID } from 'node:crypto'
import { createServiceSupabaseClient } from '../supabase/server'
import { isSupabaseServerConfigured } from './env'
import type { JobRecord, JobStatus, JobType } from './types'

const fallbackJobs = new Map<string, JobRecord>()

type CreateJobInput<TPayload> = {
  type: JobType
  userId: string | null
  userEmail: string | null
  payload: TPayload
  status?: JobStatus
}

export async function createJob<TPayload>({ type, userId, userEmail, payload, status = 'queued' }: CreateJobInput<TPayload>) {
  const now = new Date().toISOString()

  if (!isSupabaseServerConfigured()) {
    const job: JobRecord<TPayload> = {
      id: randomUUID(),
      type,
      status,
      userId,
      userEmail,
      payload,
      result: null,
      error: null,
      taskId: null,
      createdAt: now,
      updatedAt: now,
    }
    fallbackJobs.set(job.id, job)
    return job
  }

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      type,
      status,
      user_id: userId,
      user_email: userEmail,
      payload,
    })
    .select('id, type, status, user_id, user_email, payload, result, error, task_id, created_at, updated_at')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create job')
  }

  return mapJobRecord(data)
}

export async function updateJob(jobId: string, patch: Partial<Pick<JobRecord, 'status' | 'result' | 'error' | 'taskId'>>) {
  const now = new Date().toISOString()

  if (!isSupabaseServerConfigured()) {
    const current = fallbackJobs.get(jobId)
    if (!current) {
      return null
    }

    const next = {
      ...current,
      ...patch,
      updatedAt: now,
    }
    fallbackJobs.set(jobId, next)
    return next
  }

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('jobs')
    .update({
      status: patch.status,
      result: patch.result,
      error: patch.error,
      task_id: patch.taskId,
      updated_at: now,
    })
    .eq('id', jobId)
    .select('id, type, status, user_id, user_email, payload, result, error, task_id, created_at, updated_at')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update job')
  }

  return mapJobRecord(data)
}

export async function getJob(jobId: string) {
  if (!isSupabaseServerConfigured()) {
    return fallbackJobs.get(jobId) ?? null
  }

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('jobs')
    .select('id, type, status, user_id, user_email, payload, result, error, task_id, created_at, updated_at')
    .eq('id', jobId)
    .single()

  if (error || !data) {
    return null
  }

  return mapJobRecord(data)
}

function mapJobRecord(row: Record<string, unknown>): JobRecord {
  return {
    id: String(row.id),
    type: row.type as JobType,
    status: row.status as JobStatus,
    userId: row.user_id ? String(row.user_id) : null,
    userEmail: row.user_email ? String(row.user_email) : null,
    payload: row.payload ?? null,
    result: row.result ?? null,
    error: row.error ? String(row.error) : null,
    taskId: row.task_id ? String(row.task_id) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}
