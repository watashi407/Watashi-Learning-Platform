import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Bell, CircleHelp, Settings2 } from 'lucide-react'
import type { AuthSession } from '../../../shared/contracts/auth'
import { getCreationLabNavItems, getCreationLabRouteKey } from '../../creation-lab/application/creation-lab-view'
import { ROUTE_PATHS } from '../../../shared/routing/paths'
import { SearchField, WorkspaceEyebrow, cx } from '../../../shared/ui/workspace'
import { AppearanceSwitcher } from './appearance-switcher'
import { WorkspaceRoleSwitcher } from './workspace-role-switcher'
import { WorkspaceUserMenu } from './workspace-user-menu'

export function CreationLabShell({ user }: { user: AuthSession }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const activeKey = getCreationLabRouteKey(pathname)
  const navItems = getCreationLabNavItems()

  return (
    <div className="workspace-theme min-h-screen bg-[var(--color-watashi-surface)] text-[var(--color-watashi-text-strong)] lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[var(--color-watashi-surface-low)] px-6 py-8 lg:flex">
        <div>
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-watashi-indigo)_16%,white)] text-[var(--color-watashi-indigo)]">
              <span className="text-lg font-black">+</span>
            </div>
            <div>
              <p className="font-display text-xl font-black tracking-[-0.05em] text-[var(--color-watashi-indigo)]">Watashi</p>
              <WorkspaceEyebrow>Creation Lab</WorkspaceEyebrow>
            </div>
          </div>

          <button
            type="button"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-watashi-indigo)] px-5 py-4 text-sm font-bold text-white shadow-[0_18px_40px_-26px_rgba(75,65,225,0.55)]"
          >
            Create New
          </button>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.key === activeKey
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={cx(
                    'flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                    isActive
                      ? 'border-r-4 border-[var(--color-watashi-indigo)] bg-white/65 text-[var(--color-watashi-indigo)]'
                      : 'text-slate-500 hover:bg-white/55',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-2 border-t border-white/70 pt-6">
          <Link to={ROUTE_PATHS.profile} className="flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-white/55">
            <Settings2 className="h-4 w-4" />
            Settings
          </Link>
          <button type="button" className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-white/55">
            <CircleHelp className="h-4 w-4" />
            Help
          </button>
          <AppearanceSwitcher />
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/74 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <WorkspaceRoleSwitcher role={user.role} compact />
            <SearchField className="min-w-[16rem] xl:w-72" placeholder="Search projects, assets..." />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={ROUTE_PATHS.creationLabCourseBuilder}
              className="inline-flex items-center rounded-full bg-[var(--color-watashi-emerald)] px-5 py-2.5 text-sm font-bold text-white"
            >
              Publish Course
            </Link>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-watashi-surface-low)] text-slate-500">
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
