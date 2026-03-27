import { createServiceSupabaseClient } from '../../lib/supabase/server'
import { hasSupabaseConfig } from '../env'
import { logServerError } from '../logger'
import type { UserRole } from '../../shared/contracts/auth'

type ProfileProjectionInput = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
  name?: string | null
  role?: UserRole | null
}

export function mapProfileProjectionRole(value: unknown): UserRole {
  if (value === 'educator' || value === 'admin') {
    return value
  }

  return 'learner'
}

export function mapProfileDisplayName(user: {
  email?: string | null
  user_metadata?: Record<string, unknown>
}) {
  const metadata = user.user_metadata ?? {}
  return (
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    user.email?.split('@')[0] ||
    'User'
  )
}

export async function ensureProfileProjection(user: ProfileProjectionInput) {
  if (!hasSupabaseConfig() || !user.email) {
    return
  }

  const fullName = mapProfileDisplayName({
    email: user.email,
    user_metadata: user.user_metadata,
  }) || user.name || user.email.split('@')[0] || 'User'
  const role = mapProfileProjectionRole(user.user_metadata?.role ?? user.role)
  const serviceClient = createServiceSupabaseClient()
  const { error } = await serviceClient.from('profiles').upsert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    role,
  })

  if (error) {
    throw error
  }
}

export async function syncProfileProjectionSafely(
  event: string,
  requestId: string,
  user: ProfileProjectionInput,
) {
  try {
    await ensureProfileProjection(user)
  } catch (error) {
    logServerError(event, {
      requestId,
      userId: user.id,
      email: user.email,
      error,
    })
  }
}
