import { redirect } from '@tanstack/react-router'
import { getSessionUser } from '../auth/auth.functions'
import type { AuthSession } from '../../shared/contracts/auth'
import { canAccessAppRoute, getDefaultAppPath, type AppRouteKey } from '../../shared/routing/paths'

export async function requireAuthenticatedSession() {
  const session = await getSessionUser()

  if (!session) {
    throw redirect({
      to: '/login',
      search: {
        message: 'Please sign in to continue.',
      },
    })
  }

  return session satisfies AuthSession
}

export async function requireAuthorizedRoute(routeKey: AppRouteKey) {
  const session = await requireAuthenticatedSession()

  if (!canAccessAppRoute(session.role, routeKey)) {
    throw redirect({
      to: getDefaultAppPath(session.role),
    })
  }

  return session
}
