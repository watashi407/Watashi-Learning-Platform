import { ChevronDown } from 'lucide-react'
import { cx } from './workspace'

type EntityOption = {
  id: string
  label: string
  detail?: string
}

type EntitySelectorProps = {
  label: string
  options: EntityOption[]
  value: string | null
  onChange: (id: string | null) => void
  placeholder?: string
  allowClear?: boolean
  className?: string
}

export function EntitySelector({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  allowClear = true,
  className,
}: EntitySelectorProps) {
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-watashi-text-soft)]">
        {label}
      </label>
      <div className="relative">
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full appearance-none rounded-xl bg-[var(--color-watashi-surface-low)] px-3 py-2 pr-8 text-sm text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] transition-all duration-200 outline-none focus:ring-2 focus:ring-[var(--color-watashi-indigo)]"
        >
          {allowClear && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}{opt.detail ? ` — ${opt.detail}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-watashi-text-soft)]" />
      </div>
    </div>
  )
}
