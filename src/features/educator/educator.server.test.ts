import { beforeEach, describe, expect, it, vi } from 'vitest'

const createServiceSupabaseClientMock = vi.fn()
const hasSupabaseConfigMock = vi.fn<() => boolean>()
const hasTriggerConfigMock = vi.fn<() => boolean>()
const createJobMock = vi.fn()
const updateJobMock = vi.fn()
const triggerJobTaskMock = vi.fn()
const ensureProfileProvisionedMock = vi.fn()

vi.mock('../../lib/supabase/server', () => ({
  createServiceSupabaseClient: createServiceSupabaseClientMock,
}))

vi.mock('../../server/env', () => ({
  hasSupabaseConfig: hasSupabaseConfigMock,
  hasTriggerConfig: hasTriggerConfigMock,
}))

vi.mock('../../lib/backend/jobs', () => ({
  createJob: createJobMock,
  updateJob: updateJobMock,
}))

vi.mock('../../lib/backend/trigger', () => ({
  triggerJobTask: triggerJobTaskMock,
}))

vi.mock('../auth/auth.server', () => ({
  ensureProfileProvisioned: ensureProfileProvisionedMock,
}))

type EnrollmentState = {
  status: 'active' | 'completed' | 'paused'
  completedAt: string | null
}

function createSupabaseStub(state: EnrollmentState) {
  const courseRow = {
    id: 'course-1',
    owner_id: 'educator-1',
    title: 'Course 1',
    description: 'Course',
    status: 'draft',
    published_at: null,
    archived_at: null,
    default_certificate_template_id: 'template-1',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  }

  return {
    from(table: string) {
      if (table === 'enrollments') {
        return {
          select() {
            return {
              eq() {
                return {
                  async single() {
                    return {
                      data: {
                        id: 'enrollment-1',
                        learner_id: 'learner-1',
                        course_id: 'course-1',
                        status: state.status,
                        completed_at: state.completedAt,
                      },
                      error: null,
                    }
                  },
                }
              },
            }
          },
          update(update: { status?: 'active' | 'completed' | 'paused'; completed_at?: string | null }) {
            const query = {
              eq() {
                return query
              },
              neq() {
                return query
              },
              select() {
                return query
              },
              async maybeSingle() {
                if (state.status === 'completed') {
                  return { data: null, error: null }
                }

                state.status = update.status ?? state.status
                state.completedAt = update.completed_at ?? state.completedAt

                return {
                  data: {
                    id: 'enrollment-1',
                    learner_id: 'learner-1',
                    course_id: 'course-1',
                    status: state.status,
                    completed_at: state.completedAt,
                  },
                  error: null,
                }
              },
            }

            return query
          },
        }
      }

      if (table === 'courses') {
        return {
          select() {
            return {
              eq() {
                return {
                  async single() {
                    return { data: courseRow, error: null }
                  },
                }
              },
            }
          },
        }
      }

      if (table === 'activity_logs') {
        return {
          async insert() {
            return { error: null }
          },
        }
      }

      throw new Error(`Unexpected table lookup in test stub: ${table}`)
    },
  }
}

describe('completeEnrollment', () => {
  beforeEach(() => {
    vi.resetModules()
    createServiceSupabaseClientMock.mockReset()
    hasSupabaseConfigMock.mockReset()
    hasTriggerConfigMock.mockReset()
    createJobMock.mockReset()
    updateJobMock.mockReset()
    triggerJobTaskMock.mockReset()
    ensureProfileProvisionedMock.mockReset()

    hasSupabaseConfigMock.mockReturnValue(true)
    hasTriggerConfigMock.mockReturnValue(true)
    createJobMock.mockResolvedValue({
      id: 'job-1',
      type: 'certificate-generate',
      status: 'queued',
    })
    triggerJobTaskMock.mockResolvedValue({ id: 'trigger-run-1' })
    updateJobMock.mockImplementation(async (jobId: string, patch: Record<string, unknown>) => ({
      id: jobId,
      type: 'certificate-generate',
      status: patch.status ?? 'queued',
      userId: 'educator-1',
      userEmail: 'educator@example.com',
      payload: {},
      result: null,
      error: null,
      taskId: patch.taskId ?? null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }))
  })

  it('queues certificate generation only on the first completion transition', async () => {
    const enrollmentState: EnrollmentState = {
      status: 'active',
      completedAt: null,
    }
    createServiceSupabaseClientMock.mockReturnValue(createSupabaseStub(enrollmentState))

    const { completeEnrollment } = await import('./educator.server')
    const user = {
      id: 'educator-1',
      email: 'educator@example.com',
      name: 'Educator',
      role: 'educator' as const,
    }

    const first = await completeEnrollment(user, { enrollmentId: 'enrollment-1' }, 'req-1')
    const second = await completeEnrollment(user, { enrollmentId: 'enrollment-1' }, 'req-2')

    expect(first.status).toBe('completed')
    expect(first.certificateJob).not.toBeNull()
    expect(second.status).toBe('completed')
    expect(second.certificateJob).toBeNull()
    expect(createJobMock).toHaveBeenCalledTimes(1)
  })
})
