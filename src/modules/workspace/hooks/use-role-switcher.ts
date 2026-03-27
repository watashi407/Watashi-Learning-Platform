import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import type { AuthSession } from '../../../shared/contracts/auth'
import type { PublicErrorPayload } from '../../../shared/errors'
import { getDisplayErrorMessage, unwrapActionResult } from '../../../shared/errors'
import { resolveRoleSwitchPath } from '../../../shared/routing/paths'
import { switchRole } from '../../../features/auth/auth.functions'

type WorkspaceRole = Extract<AuthSession['role'], 'learner' | 'educator'>

export function useRoleSwitcher(role: AuthSession['role']) {
  const [pendingRole, setPendingRole] = useState<WorkspaceRole | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const switchWorkspaceRole = async (nextRole: WorkspaceRole) => {
    if (role === 'admin' || role === nextRole) {
      return
    }

    setPendingRole(nextRole)
    setError(null)

    try {
      const result = await switchRole({
        data: {
          role: nextRole,
        },
      })
      unwrapActionResult<AuthSession>(result as { ok: true; data: AuthSession } | { ok: false; error: PublicErrorPayload })
      // Role changes alter the authenticated workspace contract, so we force a fresh document navigation.
      window.location.assign(resolveRoleSwitchPath(nextRole, pathname))
    } catch (switchError) {
      setError(getDisplayErrorMessage(switchError, 'We could not switch your workspace role right now.'))
      setPendingRole(null)
    }
  }

  return {
    pendingRole,
    error,
    switchWorkspaceRole,
  }
}
