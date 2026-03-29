import { createServerClient } from '@supabase/ssr'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthSession, UserRole } from '../../shared/contracts/auth'
import { AppError } from '../../shared/errors'
import { getAdminEmails, getRequiredServerValue, hasSupabaseAuthConfig } from '../env'
import { parseCookieHeader, serializeCookie } from '../http/cookies'
import { sanitizeSupabaseRequestCookies } from './supabase-cookie-sanitizer'

type PendingCookie = {
  name: string
  value: string
  options?: {
    domain?: string
    path?: string
    maxAge?: number
    expires?: string | Date
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'lax' | 'strict' | 'none'
  }
}

type RequestAuthClient = {
  client: SupabaseClient
  flushCookies: () => void
}

function mapRole(value: unknown): UserRole {
  if (value === 'educator' || value === 'admin') {
    return value
  }

  return 'learner'
}

export function mapSupabaseUserToSession(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}): AuthSession {
  const email = user.email || ''
  const metadata = user.user_metadata ?? {}
  const name =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    email.split('@')[0] ||
    'User'

  const roleFromMetadata = mapRole(metadata.role)
  const role = getAdminEmails().includes(email.toLowerCase()) ? 'admin' : roleFromMetadata

  return {
    id: user.id,
    email,
    name,
    role,
  }
}

export function createRequestSupabaseAuthClient(): RequestAuthClient {
  if (!hasSupabaseAuthConfig()) {
    throw new AppError('CONFIGURATION_ERROR', 'Sign-in is not available right now. Please try again later.')
  }

  const request = getRequest()
  const pendingCookies: PendingCookie[] = []
  const invalidCookieNames = new Set<string>()

  const client = createServerClient(
    getRequiredServerValue('VITE_SUPABASE_URL'),
    getRequiredServerValue('VITE_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          const parsedCookies = parseCookieHeader(request.headers.get('cookie'))
          const sanitizedCookies = sanitizeSupabaseRequestCookies(parsedCookies)
          for (const rejectedCookieName of sanitizedCookies.rejectedCookieNames) {
            invalidCookieNames.add(rejectedCookieName)
          }
          return sanitizedCookies.cookies
        },
        setAll(cookies) {
          pendingCookies.push(...cookies)
        },
      },
    },
  )

  return {
    client,
    flushCookies() {
      if (invalidCookieNames.size > 0) {
        pendingCookies.push(
          ...[...invalidCookieNames].map((cookieName) => ({
            name: cookieName,
            value: '',
            options: {
              maxAge: 0,
              path: '/',
            },
          })),
        )
      }

      if (pendingCookies.length === 0) {
        return
      }

      setResponseHeader(
        'Set-Cookie',
        pendingCookies.map((cookie) =>
          serializeCookie(cookie.name, cookie.value, {
            domain: cookie.options?.domain,
            path: cookie.options?.path,
            maxAge: cookie.options?.maxAge,
            expires: typeof cookie.options?.expires === 'string' ? new Date(cookie.options.expires) : cookie.options?.expires,
            httpOnly: cookie.options?.httpOnly,
            secure: cookie.options?.secure,
            sameSite: cookie.options?.sameSite,
          }),
        ),
      )
    },
  }
}

export async function getSessionUser() {
  if (!hasSupabaseAuthConfig()) {
    return null
  }

  const { client, flushCookies } = createRequestSupabaseAuthClient()
  const { data, error } = await client.auth.getUser()
  flushCookies()

  if (error || !data.user?.email) {
    return null
  }

  return mapSupabaseUserToSession({
    id: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata,
  })
}

export async function requireSessionUser(requestId: string) {
  const user = await getSessionUser()
  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Please sign in to continue.', { requestId })
  }

  return user
}
