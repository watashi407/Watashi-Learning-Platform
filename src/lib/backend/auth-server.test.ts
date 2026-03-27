import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAdminEmailsMock = vi.fn<() => string[]>()
const createServerSupabaseAuthClientMock = vi.fn()
const getSessionUserMock = vi.fn()
const hasSupabaseAuthConfigMock = vi.fn<() => boolean>()

vi.mock('./env', () => ({
  getAdminEmails: getAdminEmailsMock,
}))

vi.mock('../supabase/server', () => ({
  createServerSupabaseAuthClient: createServerSupabaseAuthClientMock,
}))

vi.mock('../../server/auth/supabase-auth.server', () => ({
  getSessionUser: getSessionUserMock,
}))

vi.mock('../../server/env', () => ({
  hasSupabaseAuthConfig: hasSupabaseAuthConfigMock,
}))

describe('getRequestUser', () => {
  beforeEach(() => {
    vi.resetModules()
    getAdminEmailsMock.mockReset()
    createServerSupabaseAuthClientMock.mockReset()
    getSessionUserMock.mockReset()
    hasSupabaseAuthConfigMock.mockReset()
  })

  it('accepts the current Supabase cookie session when no bearer token is provided', async () => {
    getAdminEmailsMock.mockReturnValue(['admin@watashi.com'])
    hasSupabaseAuthConfigMock.mockReturnValue(true)
    getSessionUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'admin@watashi.com',
      name: 'Admin User',
      role: 'admin',
    })

    const { getRequestUser } = await import('./auth-server')
    const user = await getRequestUser(new Request('https://watashi.local/api/jobs/study-path'))

    expect(user).toEqual({
      id: 'user-1',
      email: 'admin@watashi.com',
      name: 'Admin User',
      isAdmin: true,
    })
    expect(createServerSupabaseAuthClientMock).not.toHaveBeenCalled()
  })
})
