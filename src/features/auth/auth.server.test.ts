import { beforeEach, describe, expect, it, vi } from 'vitest'

const hasSupabaseAuthConfigMock = vi.fn<() => boolean>()
const hasSupabaseConfigMock = vi.fn<() => boolean>()
const getMissingEnvKeysMock = vi.fn<() => string[]>()
const enforceRateLimitMock = vi.fn()
const signInWithPasswordRpcMock = vi.fn()
const getUserRpcMock = vi.fn()
const updateUserRpcMock = vi.fn()
const flushCookiesMock = vi.fn()
const getSessionUserMock = vi.fn()
const mapSupabaseUserToSessionMock = vi.fn()
const upsertMock = vi.fn()
const fromMock = vi.fn()
const logServerErrorMock = vi.fn()

vi.mock('../../server/env', () => ({
  hasSupabaseAuthConfig: hasSupabaseAuthConfigMock,
  hasSupabaseConfig: hasSupabaseConfigMock,
  getMissingEnvKeys: getMissingEnvKeysMock,
}))

vi.mock('../../server/security/rate-limit.server', () => ({
  enforceRateLimit: enforceRateLimitMock,
}))

vi.mock('../../server/auth/supabase-auth.server', () => ({
  createRequestSupabaseAuthClient: () => ({
    client: {
      auth: {
        signInWithPassword: signInWithPasswordRpcMock,
        getUser: getUserRpcMock,
        updateUser: updateUserRpcMock,
      },
    },
    flushCookies: flushCookiesMock,
  }),
  getSessionUser: getSessionUserMock,
  mapSupabaseUserToSession: mapSupabaseUserToSessionMock,
}))

vi.mock('../../lib/supabase/server', () => ({
  createServiceSupabaseClient: () => ({
    from: fromMock,
  }),
}))

vi.mock('../../server/logger', () => ({
  logServerError: logServerErrorMock,
}))

describe('signInWithPassword', () => {
  beforeEach(() => {
    vi.resetModules()
    hasSupabaseAuthConfigMock.mockReset()
    hasSupabaseConfigMock.mockReset()
    getMissingEnvKeysMock.mockReset()
    enforceRateLimitMock.mockReset()
    signInWithPasswordRpcMock.mockReset()
    getUserRpcMock.mockReset()
    updateUserRpcMock.mockReset()
    flushCookiesMock.mockReset()
    getSessionUserMock.mockReset()
    mapSupabaseUserToSessionMock.mockReset()
    upsertMock.mockReset()
    fromMock.mockReset()
    logServerErrorMock.mockReset()
  })

  it('returns the mapped session from the sign-in response without re-reading the request session', async () => {
    hasSupabaseAuthConfigMock.mockReturnValue(true)
    hasSupabaseConfigMock.mockReturnValue(true)
    getMissingEnvKeysMock.mockReturnValue([])
    signInWithPasswordRpcMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'learner@watashi.com',
          user_metadata: { full_name: 'Learner One', role: 'learner' },
        },
      },
      error: null,
    })
    mapSupabaseUserToSessionMock.mockReturnValue({
      id: 'user-1',
      email: 'learner@watashi.com',
      name: 'Learner One',
      role: 'learner',
    })
    fromMock.mockReturnValue({
      upsert: upsertMock.mockResolvedValue({ error: null }),
    })

    const { signInWithPassword } = await import('./auth.server')
    const result = await signInWithPassword(
      { email: 'learner@watashi.com', password: 'Password123' },
      'req-1',
      '127.0.0.1',
    )

    expect(result).toEqual({
      nextStep: 'signed-in',
      session: {
        id: 'user-1',
        email: 'learner@watashi.com',
        name: 'Learner One',
        role: 'learner',
      },
    })
    expect(enforceRateLimitMock).toHaveBeenCalled()
    expect(flushCookiesMock).toHaveBeenCalledTimes(1)
    expect(upsertMock).toHaveBeenCalledWith({
      id: 'user-1',
      email: 'learner@watashi.com',
      full_name: 'Learner One',
      role: 'learner',
    })
    expect(getSessionUserMock).not.toHaveBeenCalled()
  })
})

describe('switchWorkspaceRole', () => {
  beforeEach(() => {
    vi.resetModules()
    hasSupabaseAuthConfigMock.mockReset()
    hasSupabaseConfigMock.mockReset()
    getMissingEnvKeysMock.mockReset()
    getUserRpcMock.mockReset()
    updateUserRpcMock.mockReset()
    flushCookiesMock.mockReset()
    mapSupabaseUserToSessionMock.mockReset()
    upsertMock.mockReset()
    fromMock.mockReset()
    logServerErrorMock.mockReset()
  })

  it('returns the updated session even if profile projection sync fails after the auth role update', async () => {
    hasSupabaseAuthConfigMock.mockReturnValue(true)
    hasSupabaseConfigMock.mockReturnValue(true)
    getUserRpcMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'learner@watashi.com',
          user_metadata: { full_name: 'Learner One', role: 'learner' },
        },
      },
      error: null,
    })
    updateUserRpcMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'learner@watashi.com',
          user_metadata: { full_name: 'Learner One', role: 'educator' },
        },
      },
      error: null,
    })
    mapSupabaseUserToSessionMock
      .mockReturnValueOnce({
        id: 'user-1',
        email: 'learner@watashi.com',
        name: 'Learner One',
        role: 'learner',
      })
      .mockReturnValueOnce({
        id: 'user-1',
        email: 'learner@watashi.com',
        name: 'Learner One',
        role: 'educator',
      })
    fromMock.mockReturnValue({
      upsert: upsertMock.mockResolvedValue({ error: new Error('profiles down') }),
    })

    const { switchWorkspaceRole } = await import('./auth.server')
    const result = await switchWorkspaceRole('educator', 'req-switch-1')

    expect(result).toEqual({
      id: 'user-1',
      email: 'learner@watashi.com',
      name: 'Learner One',
      role: 'educator',
    })
    expect(updateUserRpcMock).toHaveBeenCalledWith({
      data: {
        full_name: 'Learner One',
        role: 'educator',
      },
    })
    expect(logServerErrorMock).toHaveBeenCalledWith(
      'role_switch_profile_projection_failed',
      expect.objectContaining({
        requestId: 'req-switch-1',
        userId: 'user-1',
        email: 'learner@watashi.com',
      }),
    )
  })
})
