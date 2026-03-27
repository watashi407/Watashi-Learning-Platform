import { MoonStar, SunMedium } from 'lucide-react'
import { cx } from '../../../shared/ui/workspace'
import { useThemeMode } from '../hooks/use-theme-mode'

export function AppearanceSwitcher() {
  const { mode, setMode } = useThemeMode()
  const isDark = mode === 'dark'
  const Icon = isDark ? MoonStar : SunMedium

  return (
    <button
      type="button"
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      className="mt-3 flex w-full items-center justify-between rounded-xl bg-[var(--color-watashi-surface-card)] px-3 py-2.5 text-left shadow-[var(--shadow-watashi-panel)] ring-1 ring-[var(--color-watashi-border)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-watashi-surface-card)_90%,var(--color-watashi-surface-high))]"
      aria-pressed={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text-strong)]">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13px] font-semibold text-[var(--color-watashi-text-strong)]">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      </span>

      <span
        className={cx(
          'relative inline-flex h-6 w-10 items-center rounded-full transition-colors',
          isDark ? 'bg-[var(--color-watashi-indigo)]' : 'bg-[var(--color-watashi-surface-high)]',
        )}
      >
        <span
          className={cx(
            'absolute h-4.5 w-4.5 rounded-full bg-[var(--color-watashi-surface-card)] shadow-[0_4px_12px_rgba(15,23,42,0.28)] transition-transform',
            isDark ? 'translate-x-5' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  )
}
