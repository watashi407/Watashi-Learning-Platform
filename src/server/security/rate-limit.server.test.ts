import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../shared/errors'

const hasSupabaseConfigMock = vi.fn<() => boolean>()
const rpcMock = vi.fn()
const logServerErrorMock = vi.fn()
const logServerInfoMock = vi.fn()

vi.mock('../env', () => ({
  hasSupabaseConfig: hasSupabaseConfigMock,
}))

vi.mock('../../lib/supabase/server', () => ({
  createServiceSupabaseClient: () => ({
    rpc: rpcMock,
  }),
}))

vi.mock('../logger', () => ({
  logServerError: logServerErrorMock,
  logServerInfo: logServerInfoMock,
}))

describe('enforceRateLimit', () => {
  beforeEach(() => {
    vi.resetModules()
    hasSupabaseConfigMock.mockReset()
    rpcMock.mockReset()
    logServerErrorMock.mockReset()
    logServerInfoMock.mockReset()
  })

  it('falls back to in-memory limiting and disables rpc retries when the Supabase rpc is unavailable', async () => {
    hasSupabaseConfigMock.mockReturnValue(true)
    rpcMock.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'function public.check_rate_limit() does not exist' },
    })

    const { enforceRateLimit } = await import('./rate-limit.server')

    await expect(enforceRateLimit({
      scope: 'auth-sign-in',
      identifier: '127.0.0.1',
      limit: 1,
      windowMinutes: 10,
      requestId: 'req-1',
    })).resolves.toBeUndefined()

    await expect(enforceRateLimit({
      scope: 'auth-sign-in',
      identifier: '127.0.0.1',
      limit: 1,
      windowMinutes: 10,
      requestId: 'req-2',
    })).rejects.toMatchObject<AppError>({
      code: 'RATE_LIMITED',
    })

    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(logServerInfoMock).toHaveBeenCalledTimes(1)
    expect(logServerErrorMock).not.toHaveBeenCalled()
  })
})
