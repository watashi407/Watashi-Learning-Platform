import { startTransition, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Loader2, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { signOutUser } from '../../auth/auth.functions'
import { ROUTE_PATHS } from '../../../shared/routing/paths'
import { getDisplayErrorMessage, getErrorRequestId, unwrapActionResult } from '../../../shared/errors'
import { updateProfile } from '../profile.functions'
import { profileUpdateSchema } from '../profile.schemas'
import { AppSectionHeader, AppSurfaceCard, cx, getDashboardTheme } from '../ui'
import { useAppSession } from '../use-app-session'

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-watashi-text-soft)]">{label}</span>
      <div className="rounded-[1.25rem] border border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] px-4 py-4 text-sm font-semibold text-[var(--color-watashi-text)]">
        {value}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const user = useAppSession()
  const router = useRouter()
  const navigate = useNavigate()
  const theme = getDashboardTheme(user.role)
  const [fullName, setFullName] = useState(user.name)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<{ message: string; requestId?: string } | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    const parsed = profileUpdateSchema.safeParse({ fullName })
    if (!parsed.success) {
      setSubmitError({
        message: parsed.error.issues[0]?.message || 'Please review your profile details and try again.',
      })
      return
    }

    setSubmitting(true)

    try {
      const result = await updateProfile({ data: parsed.data })
      unwrapActionResult(result)
      await router.invalidate()
      setSubmitSuccess('Profile updated successfully.')
    } catch (error) {
      setSubmitError({
        message: getDisplayErrorMessage(error, 'We could not save your profile right now. Please try again.'),
        requestId: getErrorRequestId(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    setSubmitError(null)

    try {
      const result = await signOutUser()
      unwrapActionResult(result)
      startTransition(() => {
        void navigate({ to: ROUTE_PATHS.login })
      })
    } catch (error) {
      setSubmitError({
        message: getDisplayErrorMessage(error, 'We could not sign you out right now. Please try again.'),
        requestId: getErrorRequestId(error),
      })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="space-y-6">
      <AppSurfaceCard>
        <AppSectionHeader
          eyebrow="Profile"
          title="Account and route access"
          description="This page keeps form handling and auth actions in one place, with validation and request-aware error messages."
        />

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-[1.75rem] border border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] p-5">
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-watashi-text-soft)]">Display name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="rounded-[1.25rem] border border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)] px-4 py-4 text-sm font-semibold text-[var(--color-watashi-text-strong)] outline-none transition-all duration-200 focus:border-[var(--color-watashi-indigo)] focus:ring-4 focus:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,transparent)]"
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ReadonlyField label="Email address" value={user.email} />
              <ReadonlyField label="Role" value={user.role} />
            </div>

            {submitSuccess ? (
              <div className="rounded-[1.5rem] border border-[color-mix(in_oklab,var(--color-watashi-emerald)_20%,var(--color-watashi-border))] bg-[color-mix(in_oklab,var(--color-watashi-emerald)_10%,var(--color-watashi-surface-card))] px-4 py-3 text-sm text-[var(--color-watashi-emerald)]">
                {submitSuccess}
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-[1.5rem] border border-[color-mix(in_oklab,var(--color-watashi-ember)_20%,var(--color-watashi-border))] bg-[color-mix(in_oklab,var(--color-watashi-ember)_10%,var(--color-watashi-surface-card))] px-4 py-3 text-sm text-[var(--color-watashi-ember)]">
                <p>{submitError.message}</p>
                {submitError.requestId ? (
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
                    Support code: {submitError.requestId}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className={cx('inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60', theme.accentBg)}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save profile
              </button>

              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-watashi-border)] px-5 py-3 text-sm font-bold text-[var(--color-watashi-text-strong)] transition-all duration-200 hover:bg-[var(--color-watashi-surface-low)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Sign out
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <AppSurfaceCard className="border-none bg-[var(--color-watashi-surface-contrast)] text-white shadow-[0_32px_80px_-52px_rgba(15,23,42,0.7)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">Access model</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">Role-secured navigation</h3>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Navigation visibility and route access both come from the same central route definition map.
              </p>
            </AppSurfaceCard>

            <div className="rounded-[1.75rem] border border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] p-5">
              <div className="flex items-center gap-3">
                <span className={cx('flex h-12 w-12 items-center justify-center rounded-2xl', theme.accentSoft, theme.accentText)}>
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-watashi-text-strong)]">Current session</p>
                  <p className="text-xs text-[var(--color-watashi-text)]">Header data refreshes after a successful profile save.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppSurfaceCard>
    </div>
  )
}
