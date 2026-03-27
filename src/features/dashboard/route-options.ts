import { RouteErrorFallback } from '../../app/errors/route-error-fallback'
import type { AppRouteKey } from '../../shared/routing/paths'
import { requireAuthorizedRoute } from './guards'

export function createProtectedAppPageOptions(routeKey: AppRouteKey) {
  return {
    beforeLoad: async () => {
      await requireAuthorizedRoute(routeKey)
    },
    errorComponent: RouteErrorFallback,
  }
}
