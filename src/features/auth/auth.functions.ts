import { randomUUID } from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import type { AuthSuccess, OAuthStartSuccess } from '../../shared/contracts/auth'
import { createSuccessResult } from '../../shared/errors'
import type { AppRequestContext } from '../../server/context'
import { getClientIp } from '../../server/security/client-id'
import { runAction } from '../../server/run-action'
import { ROUTE_PATHS } from '../../shared/routing/paths'
import { authPayloadSchema, oauthStartSchema, roleSwitchSchema } from './auth.schemas'
import { getCurrentSession, signInWithPassword, signOut, signUpWithPassword, startOAuthSignIn, switchWorkspaceRole } from './auth.server'

function getRequestMetadata(context: Partial<AppRequestContext>) {
  const request = getRequest()
  return {
    requestId: context.requestId ?? randomUUID(),
    identifier: context.ip ?? getClientIp(request),
  }
}

export const getSessionUser = createServerFn({ method: 'GET' }).handler(async () => {
  return getCurrentSession()
})

export const signIn = createServerFn({ method: 'POST' })
  .inputValidator(authPayloadSchema)
  .handler(async ({ data, context }) => {
    const metadata = getRequestMetadata(context as Partial<AppRequestContext>)
    return runAction<AuthSuccess>(metadata.requestId, () => signInWithPassword(data, metadata.requestId, metadata.identifier))
  })

export const signUp = createServerFn({ method: 'POST' })
  .inputValidator(authPayloadSchema)
  .handler(async ({ data, context }) => {
    const metadata = getRequestMetadata(context as Partial<AppRequestContext>)
    return runAction<AuthSuccess>(metadata.requestId, () => signUpWithPassword(data, metadata.requestId, metadata.identifier))
  })

export const signOutUser = createServerFn({ method: 'POST' }).handler(async ({ context }) => {
  const metadata = getRequestMetadata(context as Partial<AppRequestContext>)
  const result = await runAction(metadata.requestId, async () => {
    await signOut(metadata.requestId)
    return null
  })

  if (!result.ok) {
    return result
  }

  return createSuccessResult({ success: true })
})

export const startOAuth = createServerFn({ method: 'POST' })
  .inputValidator(oauthStartSchema)
  .handler(async ({ data, context }) => {
    const metadata = getRequestMetadata(context as Partial<AppRequestContext>)
    const request = getRequest()
    const origin = new URL(request.url).origin
    const next = data.next && data.next.startsWith('/') ? data.next : ROUTE_PATHS.dashboard
    const callbackUrl = new URL('/auth/callback', origin)
    callbackUrl.searchParams.set('next', next)

    return runAction<OAuthStartSuccess>(metadata.requestId, () =>
      startOAuthSignIn(data.provider, callbackUrl.toString(), metadata.requestId),
    )
  })

export const switchRole = createServerFn({ method: 'POST' })
  .inputValidator(roleSwitchSchema)
  .handler(async ({ data, context }) => {
    const metadata = getRequestMetadata(context as Partial<AppRequestContext>)
    return runAction(metadata.requestId, () => switchWorkspaceRole(data.role, metadata.requestId))
  })
