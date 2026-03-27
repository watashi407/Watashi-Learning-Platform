import type { AuthPayload, AuthSession, AuthSuccess, OAuthProvider, OAuthStartSuccess, UserRole } from '../../shared/contracts/auth'
import { AppError } from '../../shared/errors'
import { getMissingEnvKeys, hasSupabaseAuthConfig, hasSupabaseConfig } from '../../server/env'
import { enforceRateLimit } from '../../server/security/rate-limit.server'
import {
  ensureProfileProjection,
  mapProfileDisplayName,
  syncProfileProjectionSafely,
} from '../../server/auth/profile-projection.server'
import { createRequestSupabaseAuthClient, getSessionUser, mapSupabaseUserToSession } from '../../server/auth/supabase-auth.server'

function mapDisplayName(payload: AuthPayload) {
  return payload.name || payload.email.split('@')[0] || 'User'
}

function getAuthConfigurationError(requestId: string) {
  const missingKeys = getMissingEnvKeys('supabase-auth')

  return new AppError(
    'SERVICE_UNAVAILABLE',
    'Sign-in is not available right now. Please try again later.',
    {
      requestId,
      details: missingKeys.length > 0 ? { missingKeys } : undefined,
    },
  )
}

export async function ensureProfileProvisioned(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
  name?: string | null
  role?: UserRole | null
}) {
  await ensureProfileProjection(user)
}

export async function getCurrentSession() {
  return getSessionUser()
}

export async function signInWithPassword(payload: AuthPayload, requestId: string, identifier: string | null): Promise<AuthSuccess> {
  if (!hasSupabaseAuthConfig()) {
    throw getAuthConfigurationError(requestId)
  }

  await enforceRateLimit({
    scope: 'auth-sign-in',
    identifier: identifier || payload.email.toLowerCase(),
    limit: 10,
    windowMinutes: 10,
    requestId,
  })

  const { client, flushCookies } = createRequestSupabaseAuthClient()
  const { data, error } = await client.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })

  flushCookies()

  if (error || !data.user?.email) {
    throw new AppError('UNAUTHORIZED', 'That email or password did not match our records.', {
      requestId,
      cause: error,
    })
  }

  const session = mapSupabaseUserToSession({
    id: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata,
  })

  if (hasSupabaseConfig()) {
    await syncProfileProjectionSafely('sign_in_profile_provision_failed', requestId, {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
      name: session.name,
      role: session.role,
    })
  }

  return {
    nextStep: 'signed-in',
    session,
  }
}

export async function signUpWithPassword(payload: AuthPayload, requestId: string, identifier: string | null): Promise<AuthSuccess> {
  if (!hasSupabaseAuthConfig()) {
    throw getAuthConfigurationError(requestId)
  }

  await enforceRateLimit({
    scope: 'auth-sign-up',
    identifier: identifier || payload.email.toLowerCase(),
    limit: 6,
    windowMinutes: 30,
    requestId,
  })

  const { client, flushCookies } = createRequestSupabaseAuthClient()
  const displayName = mapDisplayName(payload)
  const { data, error } = await client.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: displayName,
        name: displayName,
        role: 'learner',
      },
    },
  })

  flushCookies()

  if (error || !data.user?.email) {
    throw new AppError('VALIDATION_ERROR', 'We could not create your account. Please check your details and try again.', {
      requestId,
      cause: error,
    })
  }

  if (hasSupabaseConfig()) {
    await syncProfileProjectionSafely('sign_up_profile_provision_failed', requestId, {
      id: data.user.id,
      email: payload.email,
      user_metadata: {
        full_name: displayName,
        name: displayName,
        role: 'learner',
      },
    })
  }

  const session = await getSessionUser()
  if (!session) {
    return {
      nextStep: 'confirm-email',
      session: null,
      message: 'Your account is ready. Please confirm your email before signing in.',
    }
  }

  return {
    nextStep: 'signed-in',
    session,
  }
}

export async function signOut(requestId: string) {
  if (!hasSupabaseAuthConfig()) {
    throw getAuthConfigurationError(requestId)
  }

  const { client, flushCookies } = createRequestSupabaseAuthClient()
  const { error } = await client.auth.signOut()
  flushCookies()

  if (error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not sign you out right now. Please try again.', {
      requestId,
      cause: error,
    })
  }
}

export async function startOAuthSignIn(
  provider: OAuthProvider,
  redirectTo: string,
  requestId: string,
): Promise<OAuthStartSuccess> {
  if (!hasSupabaseAuthConfig()) {
    throw getAuthConfigurationError(requestId)
  }

  const { client, flushCookies } = createRequestSupabaseAuthClient()
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  })

  flushCookies()

  if (error || !data.url) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not start social sign-in. Please try again.', {
      requestId,
      cause: error,
    })
  }

  return { url: data.url }
}

export async function switchWorkspaceRole(role: Extract<UserRole, 'learner' | 'educator'>, requestId: string): Promise<AuthSession> {
  if (!hasSupabaseAuthConfig()) {
    throw getAuthConfigurationError(requestId)
  }

  const { client, flushCookies } = createRequestSupabaseAuthClient()
  const { data: currentData, error: currentError } = await client.auth.getUser()

  if (currentError || !currentData.user?.email) {
    flushCookies()
    throw new AppError('UNAUTHORIZED', 'Please sign in to continue.', {
      requestId,
      cause: currentError,
    })
  }

  const currentSession = mapSupabaseUserToSession({
    id: currentData.user.id,
    email: currentData.user.email,
    user_metadata: currentData.user.user_metadata,
  })

  if (currentSession.role === 'admin') {
    flushCookies()
    throw new AppError('FORBIDDEN', 'Admin access cannot be switched from the workspace toggle.', {
      requestId,
    })
  }

  if (currentSession.role === role) {
    flushCookies()
    return currentSession
  }

  const nextMetadata = {
    ...(currentData.user.user_metadata ?? {}),
    role,
  }

  const { data: updatedData, error: updateError } = await client.auth.updateUser({
    data: nextMetadata,
  })

  flushCookies()

  if (updateError || !updatedData.user?.email) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not switch your workspace role right now. Please try again.', {
      requestId,
      cause: updateError,
    })
  }

  if (hasSupabaseConfig()) {
    await syncProfileProjectionSafely('role_switch_profile_projection_failed', requestId, {
      id: updatedData.user.id,
      email: updatedData.user.email,
      user_metadata: nextMetadata,
      name: mapProfileDisplayName({
        email: updatedData.user.email,
        user_metadata: nextMetadata,
      }),
      role,
    })
  }

  return mapSupabaseUserToSession({
    id: updatedData.user.id,
    email: updatedData.user.email,
    user_metadata: updatedData.user.user_metadata,
  })
}
