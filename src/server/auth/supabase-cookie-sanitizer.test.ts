import { describe, expect, it } from 'vitest'
import { sanitizeSupabaseRequestCookies } from './supabase-cookie-sanitizer'

function encodeSupabaseCookiePayload(value: string) {
  return `base64-${Buffer.from(value, 'utf8').toString('base64url')}`
}

describe('sanitizeSupabaseRequestCookies', () => {
  it('keeps valid single-part Supabase auth cookies', () => {
    const cookies = [
      {
        name: 'sb-project-auth-token',
        value: encodeSupabaseCookiePayload(JSON.stringify({ access_token: 'token-1' })),
      },
    ]

    const result = sanitizeSupabaseRequestCookies(cookies)

    expect(result.cookies).toEqual(cookies)
    expect(result.rejectedCookieNames).toEqual([])
  })

  it('keeps valid chunked Supabase auth cookies', () => {
    const payload = encodeSupabaseCookiePayload(JSON.stringify({ access_token: 'chunked-token', refresh_token: 'refresh-token' }))
    const midpoint = Math.floor(payload.length / 2)
    const cookies = [
      { name: 'sb-project-auth-token.1', value: payload.slice(midpoint) },
      { name: 'sb-project-auth-token.0', value: payload.slice(0, midpoint) },
    ]

    const result = sanitizeSupabaseRequestCookies(cookies)

    expect(result.cookies).toHaveLength(2)
    expect(result.rejectedCookieNames).toEqual([])
  })

  it('drops malformed chunked Supabase auth cookies without touching unrelated cookies', () => {
    const cookies = [
      { name: 'theme', value: 'dark' },
      { name: 'sb-project-auth-token.0', value: 'base64-not-valid-' },
      { name: 'sb-project-auth-token.1', value: 'still-not-valid' },
    ]

    const result = sanitizeSupabaseRequestCookies(cookies)

    expect(result.cookies).toEqual([{ name: 'theme', value: 'dark' }])
    expect(result.rejectedCookieNames.sort()).toEqual([
      'sb-project-auth-token.0',
      'sb-project-auth-token.1',
    ])
  })

  it('ignores non-Supabase cookies that happen to contain arbitrary values', () => {
    const cookies = [
      { name: 'analytics-token', value: 'base64-not-supabase' },
    ]

    const result = sanitizeSupabaseRequestCookies(cookies)

    expect(result.cookies).toEqual(cookies)
    expect(result.rejectedCookieNames).toEqual([])
  })
})
