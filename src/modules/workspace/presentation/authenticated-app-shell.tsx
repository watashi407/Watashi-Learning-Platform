import { useRouterState } from '@tanstack/react-router'
import type { AuthSession } from '../../../shared/contracts/auth'
import { ROUTE_PATHS } from '../../../shared/routing/paths'
import { CreationLabShell } from './creation-lab-shell'
import { StandardWorkspaceShell } from './standard-workspace-shell'

export function AuthenticatedAppShell({ user }: { user: AuthSession }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  if (pathname.startsWith(ROUTE_PATHS.creationLab) || pathname.startsWith(ROUTE_PATHS.legacyCreationLabs)) {
    return <CreationLabShell user={user} />
  }

  return <StandardWorkspaceShell user={user} />
}
