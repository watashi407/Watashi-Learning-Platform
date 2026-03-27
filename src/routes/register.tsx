import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { RouteErrorFallback } from '../app/errors/route-error-fallback'
import { AuthPage } from '../features/auth/auth-page'
import { getSessionUser } from '../features/auth/auth.functions'
import { ROUTE_PATHS, getDefaultAppPath } from '../shared/routing/paths'

export const Route = createFileRoute('/register')({
  validateSearch: z.object({
    message: z.string().optional(),
  }),
  beforeLoad: async () => {
    const session = await getSessionUser()
    if (session) {
      throw redirect({ to: getDefaultAppPath(session.role) })
    }
  },
  component: RegisterRoute,
  errorComponent: RouteErrorFallback,
})

function BackToLandingButton() {
  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[60] sm:right-5 sm:top-5 lg:right-[calc(50%+1.5rem)] lg:top-8">
      <Link
        to={ROUTE_PATHS.home}
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/92 px-3 py-1.5 text-[12px] font-semibold text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur transition-colors hover:bg-white hover:text-slate-900 lg:border-white/12 lg:bg-white/8 lg:text-white/88 lg:shadow-[0_16px_40px_rgba(2,8,23,0.22)] lg:hover:bg-white/14 lg:hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back</span>
      </Link>
    </div>
  )
}

function RegisterRoute() {
  const search = Route.useSearch()

  return (
    <>
      <BackToLandingButton />
      <AuthPage mode="register" initialError={search.message ?? null} />
    </>
  )
}
