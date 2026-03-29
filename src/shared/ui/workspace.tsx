import type { ReactNode } from 'react'
import { Search, Sparkles } from 'lucide-react'
import type { AuthSession } from '../contracts/auth'

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function roleTheme(role: AuthSession['role']) {
  if (role === 'educator') {
    return {
      accentText: 'text-[var(--color-watashi-indigo)]',
      accentBg: 'bg-[var(--color-watashi-indigo)]',
      accentSoft: 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_14%,var(--color-watashi-surface-card))]',
      accentGradient: 'from-[var(--color-watashi-indigo)] to-[#786cff]',
    }
  }

  if (role === 'admin') {
    return {
      accentText: 'text-[var(--color-watashi-text-strong)]',
      accentBg: 'bg-[var(--color-watashi-surface-contrast)]',
      accentSoft: 'bg-[color-mix(in_oklab,var(--color-watashi-text-strong)_10%,var(--color-watashi-surface-card))]',
      accentGradient: 'from-[var(--color-watashi-surface-contrast)] to-[color-mix(in_oklab,var(--color-watashi-surface-contrast)_84%,black)]',
    }
  }

  return {
    accentText: 'text-[var(--color-watashi-emerald)]',
    accentBg: 'bg-[var(--color-watashi-emerald)]',
    accentSoft: 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_14%,var(--color-watashi-surface-card))]',
    accentGradient: 'from-[var(--color-watashi-emerald)] to-[var(--color-watashi-emerald-strong)]',
  }
}

export function WorkspacePanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cx(
        'rounded-[2rem] bg-[var(--color-watashi-surface-card)] p-6 shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)] transition-shadow duration-200 sm:p-8',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function WorkspaceEyebrow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cx('text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--color-watashi-text-soft)]', className)}>
      {children}
    </p>
  )
}

export function SearchField({
  placeholder,
  className,
}: {
  placeholder: string
  className?: string
}) {
  return (
    <label
      className={cx(
        'flex min-w-0 items-center gap-3 rounded-full bg-[var(--color-watashi-surface-card)] px-4 py-2.5 text-sm text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)] transition-shadow duration-200 focus-within:ring-2 focus-within:ring-[var(--color-watashi-indigo)]',
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-[var(--color-watashi-text-soft)]" />
      <input
        aria-label={placeholder}
        className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm text-[var(--color-watashi-text-strong)] outline-none placeholder:text-[var(--color-watashi-text-soft)]"
        placeholder={placeholder}
        readOnly
        value=""
      />
    </label>
  )
}

export function RoleToggle({
  role,
  compact,
  disabled,
  pendingRole,
  onChange,
}: {
  role: AuthSession['role']
  compact?: boolean
  disabled?: boolean
  pendingRole?: Extract<AuthSession['role'], 'learner' | 'educator'> | null
  onChange?: (role: Extract<AuthSession['role'], 'learner' | 'educator'>) => void
}) {
  const options: Array<{ key: 'learner' | 'educator'; label: string }> = [
    { key: 'learner', label: 'Learner' },
    { key: 'educator', label: 'Educator' },
  ]

  return (
    <div className={cx('inline-flex rounded-full bg-[var(--color-watashi-surface-low)] p-1', compact && 'scale-95')}>
      {options.map((option) => {
        const isActive = option.key === role
        const isPending = pendingRole === option.key

        return (
          <button
            key={option.key}
            type="button"
            disabled={disabled || isActive || isPending || !onChange}
            onClick={() => onChange?.(option.key)}
            className={cx(
              'rounded-full px-4 py-1.5 text-[11px] font-bold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70',
              isActive
                ? 'bg-[var(--color-watashi-surface-card)] text-[var(--color-watashi-indigo)] shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)]'
                : 'text-[var(--color-watashi-text)]',
              !isActive && onChange && 'hover:text-[var(--color-watashi-text-strong)]',
            )}
          >
            {isPending ? 'Switching...' : option.label}
          </button>
        )
      })}
    </div>
  )
}

export function InitialsBadge({ user, className }: { user: AuthSession; className?: string }) {
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div
      className={cx(
        'flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-watashi-ember)] text-xs font-black text-white shadow-sm',
        className,
      )}
      aria-label={user.name}
      title={user.name}
    >
      {initials || 'WL'}
    </div>
  )
}

export function ProgressTrack({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return (
    <div className={cx('h-2 rounded-full bg-[var(--color-watashi-surface-low)]', className)}>
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-watashi-emerald),var(--color-watashi-indigo))] transition-[width] duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function FeatureBadge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] transition-colors duration-200',
        className || 'bg-[var(--color-watashi-primary-fixed)] text-[var(--color-watashi-emerald)]',
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  )
}
