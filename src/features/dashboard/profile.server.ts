import { syncProfileProjectionSafely } from '../../server/auth/profile-projection.server'
import { createRequestSupabaseAuthClient, mapSupabaseUserToSession } from '../../server/auth/supabase-auth.server'
import { hasSupabaseAuthConfig, hasSupabaseConfig } from '../../server/env'
import { AppError } from '../../shared/errors'
import type { ProfileUpdateInput } from './profile.schemas'

export async function updateProfileDetails(payload: ProfileUpdateInput, requestId: string) {
  if (!hasSupabaseAuthConfig()) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Profile updates are not available right now. Please try again later.', {
      requestId,
    })
  }

  const { client, flushCookies } = createRequestSupabaseAuthClient()
  const { data: currentUserData, error: currentUserError } = await client.auth.getUser()

  if (currentUserError || !currentUserData.user?.email) {
    flushCookies()
    throw new AppError('UNAUTHORIZED', 'Please sign in to update your profile.', {
      requestId,
      cause: currentUserError,
    })
  }

  const { data, error } = await client.auth.updateUser({
    data: {
      ...currentUserData.user.user_metadata,
      full_name: payload.fullName,
      name: payload.fullName,
    },
  })

  flushCookies()

  if (error || !data.user?.email) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not save your profile right now. Please try again.', {
      requestId,
      cause: error,
    })
  }

  if (hasSupabaseConfig()) {
    await syncProfileProjectionSafely('profile_update_projection_failed', requestId, {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
      name: payload.fullName,
      role: data.user.user_metadata?.role === 'educator' || data.user.user_metadata?.role === 'admin'
        ? data.user.user_metadata.role
        : 'learner',
    })
  }

  return mapSupabaseUserToSession({
    id: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata,
  })
}
