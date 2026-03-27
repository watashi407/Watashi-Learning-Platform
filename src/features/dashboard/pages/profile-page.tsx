import { startTransition, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Loader2, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { signOutUser } from '../../auth/auth.functions'
import { ROUTE_PATHS } from '../../../shared/routing/paths'
import { getDisplayErrorMessage, getErrorRequestId, unwrapActionResult } from '../../../shared/errors'
import { updateProfile } from '../profile.functions'
import { profileUpdateSchema } from '../profile.schemas'
import { AppSectionHeader, AppSurfaceCard, appCx, getDashboardTheme } from '../ui'
import { useAppSession } from '../use-app-session'

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{label}</span>
      <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">
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
            <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5">
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Display name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5"
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
              <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {submitSuccess}
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <p>{submitError.message}</p>
                {submitError.requestId ? (
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-500">
                    Support code: {submitError.requestId}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className={appCx('inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60', theme.accentBg)}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save profile
              </button>

              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Sign out
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <AppSurfaceCard className="border-none bg-slate-950 text-white shadow-[0_32px_80px_-52px_rgba(15,23,42,0.7)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Access model</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">Role-secured navigation</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Navigation visibility and route access both come from the same central route definition map.
              </p>
            </AppSurfaceCard>

            <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <span className={appCx('flex h-12 w-12 items-center justify-center rounded-2xl', theme.accentSoft, theme.accentText)}>
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-950">Current session</p>
                  <p className="text-xs text-slate-500">Header data refreshes after a successful profile save.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppSurfaceCard>
    </div>
  )
}
