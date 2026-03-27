import { randomUUID } from 'node:crypto'
import { createMiddleware } from '@tanstack/react-start'
import { mergeHeaders } from '@tanstack/react-start'
import type { AppRequestContext } from './context'
import { normalizeError } from '../shared/errors'
import { logServerError } from './logger'
import { getClientIp } from './security/client-id'
import { buildSecurityHeaders } from './security/headers'
import { assertAllowedOrigin } from './security/origin'
import { getSessionUser } from './auth/supabase-auth.server'

export const requestMiddleware = createMiddleware({ type: 'request' }).server(async ({ request, next }) => {
  const requestId = randomUUID()

  try {
    assertAllowedOrigin(request, requestId)
    const response = await next({
      context: {
        requestId,
        ip: getClientIp(request),
      } satisfies Omit<AppRequestContext, 'user'>,
    })

    const headers = mergeHeaders(response.response.headers, buildSecurityHeaders(), {
      'x-request-id': requestId,
    })

    return {
      ...response,
      context: {
        ...response.context,
        requestId,
      },
      response: new Response(response.response.body, {
        status: response.response.status,
        statusText: response.response.statusText,
        headers,
      }),
    }
  } catch (error) {
    const normalized = normalizeError(error, requestId)
    logServerError('request_middleware_failure', {
      requestId,
      code: normalized.code,
      message: normalized.message,
      path: request.url,
    })
    throw normalized
  }
})

export const functionMiddleware = createMiddleware().server(async ({ context, next }) => {
  const user = await getSessionUser()

  return next({
    context: {
      ...context,
      user,
    } satisfies AppRequestContext,
  })
})
