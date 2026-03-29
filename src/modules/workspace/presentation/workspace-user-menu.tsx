import { startTransition, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ChevronDown, Loader2, LogOut, Settings2, UserRound } from 'lucide-react'
import { signOutUser } from '../../../features/auth/auth.functions'
import type { PublicErrorPayload } from '../../../shared/errors'
import { getDisplayErrorMessage, unwrapActionResult } from '../../../shared/errors'
import { ROUTE_PATHS } from '../../../shared/routing/paths'
import { InitialsBadge, WorkspaceEyebrow, cx } from '../../../shared/ui/workspace'
import type { AuthSession } from '../../../shared/contracts/auth'

export function WorkspaceUserMenu({
  user,
  className,
}: {
  user: AuthSession
  className?: string
}) {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handleLogout = async () => {
    setLoggingOut(true)
    setError(null)

    try {
      const result = await signOutUser()
      unwrapActionResult<{ success: boolean }>(result as { ok: true; data: { success: boolean } } | { ok: false; error: PublicErrorPayload })
      startTransition(() => {
        void navigate({ to: ROUTE_PATHS.home })
      })
    } catch (logoutError) {
      setError(getDisplayErrorMessage(logoutError, 'We could not sign you out right now.'))
      setLoggingOut(false)
    }
  }

  return (
    <div ref={containerRef} className={cx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full bg-[var(--color-watashi-surface-card)] pr-2 shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-watashi-surface-card)_86%,var(--color-watashi-surface-high))]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <InitialsBadge user={user} />
        <ChevronDown className={cx('h-4 w-4 text-[var(--color-watashi-text)] transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 overflow-hidden rounded-[1.35rem] bg-[var(--color-watashi-surface-card)] shadow-[var(--shadow-watashi-dropdown)] ring-1 ring-[var(--color-watashi-border)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="border-b border-[var(--color-watashi-border)] px-4 py-4">
            <WorkspaceEyebrow>Profile</WorkspaceEyebrow>
            <p className="mt-2 text-sm font-bold text-[var(--color-watashi-text-strong)]">{user.name}</p>
            <p className="mt-1 text-xs text-[var(--color-watashi-text)]">{user.email}</p>
          </div>

          <div className="p-2">
            <Link
              to={ROUTE_PATHS.profile}
              className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-semibold text-[var(--color-watashi-text-strong)] transition-colors hover:bg-[var(--color-watashi-surface-low)] active:bg-[var(--color-watashi-surface-high)]"
            >
              <UserRound className="h-4 w-4 text-[var(--color-watashi-text)]" />
              Profile
            </Link>
            <Link
              to={ROUTE_PATHS.profile}
              className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-semibold text-[var(--color-watashi-text-strong)] transition-colors hover:bg-[var(--color-watashi-surface-low)] active:bg-[var(--color-watashi-surface-high)]"
            >
              <Settings2 className="h-4 w-4 text-[var(--color-watashi-text)]" />
              Settings
            </Link>
          </div>

          <div className="border-t border-[var(--color-watashi-border)] p-2">
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-semibold text-[var(--color-watashi-ember)] transition-all duration-200 hover:bg-[color-mix(in_oklab,var(--color-watashi-ember)_12%,var(--color-watashi-surface-card))] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Sign out
            </button>
            {error ? <p className="px-3 pb-2 pt-1 text-[11px] font-medium text-[var(--color-watashi-ember)]">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
