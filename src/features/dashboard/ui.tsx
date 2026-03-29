import type { ReactNode } from 'react'
import type { AuthSession } from '../../shared/contracts/auth'
import { cx, roleTheme } from '../../shared/ui/workspace'

export { cx }

export type DashboardTheme = {
  accentBg: string
  accentText: string
  accentSoft: string
}

export function getDashboardTheme(role: AuthSession['role']): DashboardTheme {
  const theme = roleTheme(role)
  return {
    accentBg: theme.accentBg,
    accentText: theme.accentText,
    accentSoft: theme.accentSoft,
  }
}

export function appCx(...values: Array<string | false | null | undefined>) {
  return cx(...values)
}

export function AppSurfaceCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cx(
        'rounded-[2rem] bg-[var(--color-watashi-surface-card)] p-6 shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)] backdrop-blur-sm transition-shadow duration-200 sm:p-8',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function AppSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-watashi-text-soft)]">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-[var(--color-watashi-text-strong)] sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-watashi-text)]">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function UserInitials({ user }: { user: AuthSession }) {
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-watashi-surface-contrast)] text-sm font-bold text-[var(--color-watashi-surface)]">
      {initials || 'WL'}
    </div>
  )
}
