import { useState } from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Bell, CircleHelp, Menu, Settings2, X } from 'lucide-react'
import type { AuthSession } from '../../../shared/contracts/auth'
import { getCreationLabNavItems, getCreationLabRouteKey } from '../../creation-lab/application/creation-lab-view'
import { ROUTE_PATHS } from '../../../shared/routing/paths'
import { SearchField, WorkspaceEyebrow, cx } from '../../../shared/ui/workspace'
import { AppearanceSwitcher } from './appearance-switcher'
import { WorkspaceRoleSwitcher } from './workspace-role-switcher'
import { WorkspaceUserMenu } from './workspace-user-menu'

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const activeKey = getCreationLabRouteKey(pathname)
  const navItems = getCreationLabNavItems()

  return (
    <>
      <div>
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-watashi-indigo)_16%,var(--color-watashi-surface-card))] text-[var(--color-watashi-indigo)]">
            <span className="text-lg font-black">+</span>
          </div>
          <div>
            <p className="font-display text-xl font-black tracking-[-0.05em] text-[var(--color-watashi-indigo)]">Watashi</p>
            <WorkspaceEyebrow>Creation Lab</WorkspaceEyebrow>
          </div>
        </div>

        <button
          type="button"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-watashi-indigo)] px-5 py-4 text-sm font-bold text-white shadow-[0_18px_40px_-26px_rgba(75,65,225,0.55)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
        >
          Create New
        </button>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.key === activeKey
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={onNavigate}
                className={cx(
                  'group relative flex items-center gap-4 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_14%,var(--color-watashi-surface-card))] text-[var(--color-watashi-indigo)] ring-1 ring-[color-mix(in_oklab,var(--color-watashi-indigo)_30%,var(--color-watashi-border))]'
                    : 'text-[var(--color-watashi-text)] hover:bg-[var(--color-watashi-surface-card)] hover:text-[var(--color-watashi-text-strong)]',
                )}
              >
                {isActive ? (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--color-watashi-indigo)]" />
                ) : null}
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-1 border-t border-[var(--color-watashi-border)] pt-6">
        <Link
          to={ROUTE_PATHS.profile}
          onClick={onNavigate}
          className="flex items-center gap-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-watashi-text)] transition-colors hover:bg-[var(--color-watashi-surface-card)] hover:text-[var(--color-watashi-text-strong)]"
        >
          <Settings2 className="h-4 w-4" />
          Settings
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-watashi-text)] transition-colors hover:bg-[var(--color-watashi-surface-card)] hover:text-[var(--color-watashi-text-strong)]"
        >
          <CircleHelp className="h-4 w-4" />
          Help
        </button>
        <AppearanceSwitcher />
      </div>
    </>
  )
}

export function CreationLabShell({ user }: { user: AuthSession }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="workspace-theme min-h-screen bg-[var(--color-watashi-surface)] text-[var(--color-watashi-text-strong)] lg:pl-72">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[var(--color-watashi-surface-low)] px-6 py-8 lg:flex">
        {/* Gradient separator */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-[linear-gradient(180deg,transparent,var(--color-watashi-border)_30%,var(--color-watashi-border)_70%,transparent)]" />
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile Nav Overlay */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[var(--color-watashi-surface-low)] px-6 py-8 shadow-[var(--shadow-watashi-dropdown)] animate-in slide-in-from-left duration-300">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-watashi-surface-card)] text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)]"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
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
            <WorkspaceRoleSwitcher role={user.role} compact />
            <SearchField className="min-w-[16rem] xl:w-72" placeholder="Search projects, assets..." />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={ROUTE_PATHS.creationLabCourseBuilder}
              className="inline-flex items-center rounded-full bg-[var(--color-watashi-emerald)] px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
            >
              Publish Course
            </Link>
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text)] transition-colors hover:bg-[var(--color-watashi-surface-high)]"
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
