import { randomUUID } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import { createRequestSupabaseAuthClient } from '../../server/auth/supabase-auth.server'
import { hasSupabaseAuthConfig, hasSupabaseConfig } from '../../server/env'
import { syncProfileProjectionSafely } from '../../server/auth/profile-projection.server'
import { ROUTE_PATHS } from '../../shared/routing/paths'

function redirectResponse(location: string, init?: ResponseInit) {
  return new Response(null, {
    status: 302,
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Location: location,
    },
  })
}

function toLoginMessage(message: string) {
  const params = new URLSearchParams({ message })
  return `${ROUTE_PATHS.login}?${params.toString()}`
}

export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!hasSupabaseAuthConfig()) {
          return redirectResponse(toLoginMessage('Sign-in is not available right now. Please try again later.'))
        }

        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const providerError = url.searchParams.get('error_description') || url.searchParams.get('error')
        const next = url.searchParams.get('next') ?? ROUTE_PATHS.dashboard
        const safeNext = next.startsWith('/') ? next : ROUTE_PATHS.dashboard

        if (providerError) {
          return redirectResponse(toLoginMessage('We could not complete sign-in with that provider. Please try again.'))
        }

        if (!code) {
          return redirectResponse(toLoginMessage('We could not verify your sign-in. Please try again.'))
        }

        const { client, flushCookies } = createRequestSupabaseAuthClient()
        const { error } = await client.auth.exchangeCodeForSession(code)

        if (error) {
          flushCookies()
          return redirectResponse(toLoginMessage('We could not finish social sign-in. Please try again.'))
        }

        const { data: userData } = await client.auth.getUser()
        const user = userData.user

        if (hasSupabaseConfig()) {
          if (user?.id && user.email) {
            await syncProfileProjectionSafely('oauth_profile_provision_failed', randomUUID(), {
              id: user.id,
              email: user.email,
              user_metadata: user.user_metadata,
            })
          }
        }

        flushCookies()

        if (!user) {
          return redirectResponse(toLoginMessage('We could not finish signing you in. Please try again.'))
        }

        return redirectResponse(safeNext)
      },
    },
  },
  component: AuthCallbackRoute,
})

function AuthCallbackRoute() {
  return null
}
