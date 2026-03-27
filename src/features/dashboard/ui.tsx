import type { ReactNode } from 'react'
import type { AuthSession } from '../../shared/contracts/auth'

export type DashboardTheme = {
  accentBg: string
  accentText: string
  accentSoft: string
}

export function getDashboardTheme(role: AuthSession['role']): DashboardTheme {
  if (role === 'educator') {
    return {
      accentBg: 'bg-[#4b41e1]',
      accentText: 'text-[#4b41e1]',
      accentSoft: 'bg-[#4b41e1]/10',
    }
  }

  if (role === 'admin') {
    return {
      accentBg: 'bg-slate-900',
      accentText: 'text-slate-900',
      accentSoft: 'bg-slate-900/10',
    }
  }

  return {
    accentBg: 'bg-[#176851]',
    accentText: 'text-[#176851]',
    accentSoft: 'bg-[#176851]/10',
  }
}

export function appCx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
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
      className={appCx(
        'rounded-[2rem] border border-white/80 bg-white/92 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-8',
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
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{description}</p> : null}
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
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
      {initials || 'WL'}
    </div>
  )
}
