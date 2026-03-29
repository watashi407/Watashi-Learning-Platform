import { AlertTriangle, Check, Loader2 } from 'lucide-react'
import { cx } from './workspace'

type SaveStatusIndicatorProps = {
  isSaving: boolean
  saveError: string | null
  className?: string
}

export function SaveStatusIndicator({ isSaving, saveError, className }: SaveStatusIndicatorProps) {
  if (saveError) {
    return (
      <span
        className={cx(
          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[color-mix(in_oklab,var(--color-watashi-ember)_12%,transparent)] px-3 py-1 text-[11px] font-bold text-[var(--color-watashi-ember)] transition-colors duration-200',
          className,
        )}
        title={saveError}
      >
        <AlertTriangle className="h-3 w-3" />
        Save failed
      </span>
    )
  }

  if (isSaving) {
    return (
      <span
        className={cx(
          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,transparent)] px-3 py-1 text-[11px] font-bold text-[var(--color-watashi-indigo)] transition-colors duration-200',
          className,
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving
      </span>
    )
  }

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[color-mix(in_oklab,var(--color-watashi-emerald)_10%,transparent)] px-3 py-1 text-[11px] font-bold text-[var(--color-watashi-emerald)] transition-colors duration-200',
        className,
      )}
    >
      <Check className="h-3 w-3" />
      All changes saved
    </span>
  )
}
