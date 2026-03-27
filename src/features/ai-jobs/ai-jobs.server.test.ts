import { beforeEach, describe, expect, it, vi } from 'vitest'

const createJobMock = vi.fn()
const updateJobMock = vi.fn()
const getJobMock = vi.fn()
const generateStudyPathResultMock = vi.fn()
const generateCourseOutlineResultMock = vi.fn()
const triggerJobTaskMock = vi.fn()
const hasTriggerConfigMock = vi.fn<() => boolean>()
const enforceRateLimitMock = vi.fn()
const ensureProfileProvisionedMock = vi.fn()

vi.mock('../../lib/backend/jobs', () => ({
  createJob: createJobMock,
  updateJob: updateJobMock,
  getJob: getJobMock,
}))

vi.mock('../../lib/backend/processors', () => ({
  generateStudyPathResult: generateStudyPathResultMock,
  generateCourseOutlineResult: generateCourseOutlineResultMock,
}))

vi.mock('../../lib/backend/trigger', () => ({
  triggerJobTask: triggerJobTaskMock,
}))

vi.mock('../../server/env', () => ({
  hasTriggerConfig: hasTriggerConfigMock,
}))

vi.mock('../../server/security/rate-limit.server', () => ({
  enforceRateLimit: enforceRateLimitMock,
}))

vi.mock('../auth/auth.server', () => ({
  ensureProfileProvisioned: ensureProfileProvisionedMock,
}))

describe('createStudyPathJob', () => {
  beforeEach(() => {
    vi.resetModules()
    createJobMock.mockReset()
    updateJobMock.mockReset()
    getJobMock.mockReset()
    generateStudyPathResultMock.mockReset()
    generateCourseOutlineResultMock.mockReset()
    triggerJobTaskMock.mockReset()
    hasTriggerConfigMock.mockReset()
    enforceRateLimitMock.mockReset()
    ensureProfileProvisionedMock.mockReset()
  })

  it('backfills the user profile before creating the job record', async () => {
    hasTriggerConfigMock.mockReturnValue(false)
    ensureProfileProvisionedMock.mockResolvedValue(undefined)
    createJobMock.mockResolvedValue({ id: 'job-1' })
    generateStudyPathResultMock.mockResolvedValue({
      pivot: 'Ship a stronger React portfolio.',
      tip: 'Finish one milestone before switching context.',
    })
    updateJobMock.mockResolvedValue(undefined)

    const { createStudyPathJob } = await import('./ai-jobs.server')
    const result = await createStudyPathJob(
      {
        learnerName: 'Jae',
        currentCourses: [{ title: 'UI Systems', progress: 40 }],
      },
      {
        id: 'user-1',
        email: 'jae@watashi.com',
        name: 'Jae',
        role: 'learner',
      },
      'req-1',
    )

    expect(enforceRateLimitMock).toHaveBeenCalled()
    expect(ensureProfileProvisionedMock).toHaveBeenCalledWith({
      id: 'user-1',
      email: 'jae@watashi.com',
      name: 'Jae',
      role: 'learner',
    })
    expect(createJobMock).toHaveBeenCalled()
    expect(result).toEqual({
      jobId: 'job-1',
      status: 'completed',
      result: {
        pivot: 'Ship a stronger React portfolio.',
        tip: 'Finish one milestone before switching context.',
      },
    })
  })
})
