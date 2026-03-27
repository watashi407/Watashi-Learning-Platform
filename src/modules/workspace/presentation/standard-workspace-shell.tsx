import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Bell, CircleHelp, Settings2 } from 'lucide-react'
import type { AuthSession } from '../../../shared/contracts/auth'
import { APP_ROUTE_DEFINITIONS, ROUTE_PATHS, getVisibleAppRoutes } from '../../../shared/routing/paths'
import { SearchField, WorkspaceEyebrow, cx } from '../../../shared/ui/workspace'
import { AppearanceSwitcher } from './appearance-switcher'
import { WorkspaceRoleSwitcher } from './workspace-role-switcher'
import { WorkspaceUserMenu } from './workspace-user-menu'

function getTopBarCopy(pathname: string) {
  if (pathname.startsWith(ROUTE_PATHS.dashboard)) {
    return { title: 'Dashboard', searchPlaceholder: 'Search exhibits...' }
  }

  if (pathname.startsWith(ROUTE_PATHS.courses)) {
    return { title: 'Watashi', navItems: ['Catalog', 'Pathways', 'Mentors'], searchPlaceholder: 'Search knowledge...' }
  }

  if (pathname.startsWith(ROUTE_PATHS.community)) {
    return { title: 'Community Board', subtitle: 'Connect, curate, and evolve with fellow scholars.', searchPlaceholder: 'Search discussions...' }
  }

  if (pathname.startsWith(ROUTE_PATHS.focus)) {
    return { title: 'Focus Mode', searchPlaceholder: 'Search lesson queue...' }
  }

  return { title: 'Profile', searchPlaceholder: 'Search workspace...' }
}

export function StandardWorkspaceShell({ user }: { user: AuthSession }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const navItems = getVisibleAppRoutes(user.role)
  const topBar = getTopBarCopy(pathname)

  return (
    <div className="workspace-theme min-h-screen bg-[var(--color-watashi-surface)] text-[var(--color-watashi-text-strong)] lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] px-5 py-8 lg:flex">
        <div>
          <div className="px-3">
            <p className="font-display text-xl font-black tracking-[-0.05em] text-[var(--color-watashi-emerald)]">Watashi</p>
            <WorkspaceEyebrow className="mt-1">The Digital Curator</WorkspaceEyebrow>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map((route) => {
              const Icon = route.icon
              const isActive = pathname === route.path

              return (
                <Link
                  key={route.key}
                  to={route.path}
                  style={isActive ? {
                    backgroundColor: 'color-mix(in oklab, var(--color-watashi-emerald) 18%, var(--color-watashi-surface-card))',
                    color: 'var(--color-watashi-emerald-strong)',
                    boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-watashi-emerald) 34%, var(--color-watashi-border))',
                  } : undefined}
                  className={cx(
                    'mx-1 flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold transition-all',
                    isActive
                      ? ''
                      : 'text-[var(--color-watashi-text)] hover:bg-[var(--color-watashi-surface-card)] hover:text-[var(--color-watashi-text-strong)]',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{route.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-4">
          <Link
            to={user.role === 'educator' ? ROUTE_PATHS.creationLab : ROUTE_PATHS.courses}
            className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-watashi-emerald)] px-4 py-4 text-sm font-bold text-white shadow-[0_18px_40px_-26px_rgba(23,104,81,0.55)]"
          >
            {user.role === 'educator' ? 'Open Creation Lab' : 'Start Learning'}
          </Link>

          <div className="space-y-1 border-t border-[var(--color-watashi-border)] pt-4">
            <Link
              to={APP_ROUTE_DEFINITIONS.profile.path}
              className="flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold text-[var(--color-watashi-text)] transition-colors hover:bg-[var(--color-watashi-surface-card)] hover:text-[var(--color-watashi-text-strong)]"
            >
              <Settings2 className="h-4 w-4" />
              Settings
            </Link>
            <button
              className="flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold text-[var(--color-watashi-text)] transition-colors hover:bg-[var(--color-watashi-surface-card)] hover:text-[var(--color-watashi-text-strong)]"
              type="button"
            >
              <CircleHelp className="h-4 w-4" />
              Help
            </button>
            <AppearanceSwitcher />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-[var(--color-watashi-border)] bg-[color-mix(in_oklab,var(--color-watashi-overlay)_90%,var(--color-watashi-surface-low))] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <h1 className="font-display text-[1.9rem] font-black tracking-[-0.05em] text-slate-950">{topBar.title}</h1>
              {'subtitle' in topBar && topBar.subtitle ? <p className="mt-1 text-sm text-slate-500">{topBar.subtitle}</p> : null}
            </div>
            {'navItems' in topBar && topBar.navItems ? (
              <nav className="hidden gap-5 lg:flex">
                {topBar.navItems.map((item, index) => (
                  <span key={item} className={cx('text-sm font-semibold', index === 0 ? 'text-[var(--color-watashi-emerald)]' : 'text-slate-500')}>
                    {item}
                  </span>
                ))}
              </nav>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <WorkspaceRoleSwitcher role={user.role} compact />
            <SearchField className="min-w-[16rem] flex-1 xl:w-72 xl:flex-none" placeholder={topBar.searchPlaceholder} />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-watashi-surface-card)] text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)]"
            >
              <Bell className="h-4 w-4" />
            </button>
            <WorkspaceUserMenu user={user} />
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}
