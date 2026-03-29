import { useState } from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Bell, Menu, X, CircleHelp, Settings2 } from 'lucide-react'
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

function SidebarContent({ user, pathname, navItems, onNavigate }: { user: AuthSession; pathname: string; navItems: ReturnType<typeof getVisibleAppRoutes>; onNavigate?: () => void }) {
  return (
    <>
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
                onClick={onNavigate}
                className={cx(
                  'group relative mx-1 flex items-center gap-3 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_18%,var(--color-watashi-surface-card))] text-[var(--color-watashi-emerald-strong)] ring-1 ring-[color-mix(in_oklab,var(--color-watashi-emerald)_34%,var(--color-watashi-border))]'
                    : 'text-[var(--color-watashi-text)] hover:bg-[var(--color-watashi-surface-card)] hover:text-[var(--color-watashi-text-strong)]',
                )}
              >
                {isActive ? (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--color-watashi-emerald)]" />
                ) : null}
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                <span>{route.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-4">
        <Link
          to={user.role === 'educator' ? ROUTE_PATHS.creationLab : ROUTE_PATHS.courses}
          onClick={onNavigate}
          className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-watashi-emerald)] px-4 py-4 text-sm font-bold text-white shadow-[0_18px_40px_-26px_rgba(23,104,81,0.55)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
        >
          {user.role === 'educator' ? 'Open Creation Lab' : 'Start Learning'}
        </Link>

        <div className="space-y-1 border-t border-[var(--color-watashi-border)] pt-4">
          <Link
            to={APP_ROUTE_DEFINITIONS.profile.path}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-watashi-text)] transition-colors hover:bg-[var(--color-watashi-surface-card)] hover:text-[var(--color-watashi-text-strong)]"
          >
            <Settings2 className="h-4 w-4" />
            Settings
          </Link>
          <button
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-watashi-text)] transition-colors hover:bg-[var(--color-watashi-surface-card)] hover:text-[var(--color-watashi-text-strong)]"
            type="button"
          >
            <CircleHelp className="h-4 w-4" />
            Help
          </button>
          <AppearanceSwitcher />
        </div>
      </div>
    </>
  )
}

export function StandardWorkspaceShell({ user }: { user: AuthSession }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const navItems = getVisibleAppRoutes(user.role)
  const topBar = getTopBarCopy(pathname)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="workspace-theme min-h-screen bg-[var(--color-watashi-surface)] text-[var(--color-watashi-text-strong)] lg:pl-64">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[var(--color-watashi-surface-low)] px-5 py-8 lg:flex">
        {/* Gradient separator */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-[linear-gradient(180deg,transparent,var(--color-watashi-border)_30%,var(--color-watashi-border)_70%,transparent)]" />
        <SidebarContent user={user} pathname={pathname} navItems={navItems} />
      </aside>

      {/* Mobile Nav Overlay */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-[var(--color-watashi-surface-low)] px-5 py-8 shadow-[var(--shadow-watashi-dropdown)] animate-in slide-in-from-left duration-300">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-watashi-surface-card)] text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)]"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent user={user} pathname={pathname} navItems={navItems} onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      ) : null}

      <header className="sticky top-0 z-30 border-b border-[var(--color-watashi-border)] bg-[var(--color-watashi-overlay)] px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-watashi-surface-card)] text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)] transition-colors hover:bg-[var(--color-watashi-surface-low)] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-black tracking-[-0.05em] text-[var(--color-watashi-text-strong)]">{topBar.title}</h1>
              {'subtitle' in topBar && topBar.subtitle ? <p className="mt-1 text-sm text-[var(--color-watashi-text)]">{topBar.subtitle}</p> : null}
            </div>
            {'navItems' in topBar && topBar.navItems ? (
              <nav className="hidden gap-5 lg:flex">
                {topBar.navItems.map((item, index) => (
                  <span key={item} className={cx('text-sm font-semibold', index === 0 ? 'text-[var(--color-watashi-emerald)]' : 'text-[var(--color-watashi-text)]')}>
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
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-watashi-surface-card)] text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)] transition-colors hover:bg-[var(--color-watashi-surface-low)]"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[var(--color-watashi-ember)]" />
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
