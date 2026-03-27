import type { AuthSession } from '../../../shared/contracts/auth'
import { RoleToggle, cx } from '../../../shared/ui/workspace'
import { useRoleSwitcher } from '../hooks/use-role-switcher'

export function WorkspaceRoleSwitcher({
  role,
  compact,
  className,
}: {
  role: AuthSession['role']
  compact?: boolean
  className?: string
}) {
  const { error, pendingRole, switchWorkspaceRole } = useRoleSwitcher(role)

  if (role === 'admin') {
    return null
  }

  return (
    <div className={cx('space-y-1', className)}>
      <RoleToggle compact={compact} role={role} pendingRole={pendingRole} onChange={switchWorkspaceRole} />
      {error ? <p className="px-2 text-[11px] font-medium text-rose-600">{error}</p> : null}
    </div>
  )
}
