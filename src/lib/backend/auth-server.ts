import type { WatashiUser } from '../session'
import { getAdminEmails } from './env'
import { createServerSupabaseAuthClient } from '../supabase/server'
import { getSessionUser } from '../../server/auth/supabase-auth.server'
import { hasSupabaseAuthConfig } from '../../server/env'
import { AppError } from '../../shared/errors'

export type RequestUser = WatashiUser & {
  id: string | null
  isAdmin: boolean
}

function withAdminFlag(user: WatashiUser, id: string | null): RequestUser {
  const isAdmin = getAdminEmails().includes(user.email.toLowerCase())
  return {
    ...user,
    id,
    isAdmin,
  }
}

export async function getRequestUser(request: Request) {
  if (!hasSupabaseAuthConfig()) {
    const raw = request.headers.get('x-watashi-dev-user')
    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as WatashiUser
      if (!parsed.email || !parsed.name) {
        return null
      }

      return withAdminFlag(parsed, null)
    } catch {
      return null
    }
  }

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (token) {
    const client = createServerSupabaseAuthClient()
    const { data, error } = await client.auth.getUser(token)
    if (error || !data.user?.email) {
      return null
    }

    return withAdminFlag(
      {
        email: data.user.email,
        name:
          (typeof data.user.user_metadata.full_name === 'string' && data.user.user_metadata.full_name) ||
          (typeof data.user.user_metadata.name === 'string' && data.user.user_metadata.name) ||
          data.user.email.split('@')[0] ||
          'User',
      },
      data.user.id,
    )
  }

  const session = await getSessionUser()
  if (!session) {
    return null
  }

  return withAdminFlag(
    {
      email: session.email,
      name: session.name,
    },
    session.id,
  )
}

export async function requireRequestUser(request: Request) {
  const user = await getRequestUser(request)
  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Please sign in to continue.')
  }

  return user
}
