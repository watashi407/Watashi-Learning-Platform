import { useState } from 'react'
import {
  AlertCircle,
  Archive,
  Award,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  FileText,
  Globe,
  Hash,
  Loader2,
  Palette,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  Shield,
  Trash2,
  Type,
  User,
} from 'lucide-react'
import { WorkspaceEyebrow, WorkspacePanel, cx } from '../../../shared/ui/workspace'
import { SaveStatusIndicator } from '../../../shared/ui/save-status-indicator'
import { useCertificateBuilder } from '../hooks/use-certificate-builder'
import {
  FONT_FAMILIES,
  TEMPLATE_STYLES,
  type CertificateConfig,
  type CertificateLayout,
  type CertificateLogoPosition,
} from '../domain/certificate-builder-model'

// ── Helpers ──

function statusBadge(status: string) {
  switch (status) {
    case 'published':
      return { label: 'Published', className: 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_12%,var(--color-watashi-surface-card))] text-[var(--color-watashi-emerald)] ring-[color-mix(in_oklab,var(--color-watashi-emerald)_25%,var(--color-watashi-border))]' }
    case 'archived':
      return { label: 'Archived', className: 'bg-[var(--color-watashi-surface-high)] text-[var(--color-watashi-text)] ring-[var(--color-watashi-border)]' }
    default:
      return { label: 'Draft', className: 'bg-[color-mix(in_oklab,#d97706_12%,var(--color-watashi-surface-card))] text-[#d97706] ring-[color-mix(in_oklab,#d97706_25%,var(--color-watashi-border))]' }
  }
}

/** Returns a deterministic muted hex swatch from the template's primaryColor or a fallback. */
function templateSwatch(primaryColor: string): string {
  return primaryColor || '#4b41e1'
}

const LOGO_POSITIONS: { value: CertificateLogoPosition; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'none', label: 'Hidden' },
]

// ── Toggle Switch ──

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-watashi-indigo)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-watashi-surface-card)] outline-none',
        checked ? 'bg-[var(--color-watashi-indigo)]' : 'bg-[var(--color-watashi-surface-high)]',
      )}
    >
      <span
        className={cx(
          'pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-[var(--color-watashi-surface-card)] ring-0 transition-transform duration-200',
          // Tactile knob shadow — stronger on active state
          checked
            ? 'translate-x-[22px] shadow-[0_2px_6px_rgba(75,65,225,0.35),0_1px_2px_rgba(0,0,0,0.15)]'
            : 'translate-x-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.1)]',
        )}
      />
    </button>
  )
}

// ── Select Input ──

function SelectInput({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  label: string
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl bg-[var(--color-watashi-surface-low)] px-4 py-2.5 pr-10 text-sm font-semibold text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-all duration-200 focus:ring-[var(--color-watashi-indigo)] focus-visible:ring-2 focus-visible:ring-[var(--color-watashi-indigo)]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-watashi-text-soft)]" />
    </div>
  )
}

// ── Color Input ──

function ColorInput({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (value: string) => void
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="relative cursor-pointer">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          aria-label={label}
        />
        {/* Larger swatch with layered shadow for depth */}
        <span
          className="block h-11 w-11 cursor-pointer rounded-xl ring-2 ring-[var(--color-watashi-border)] transition-all duration-200 hover:scale-105 hover:ring-[var(--color-watashi-indigo)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.2)]"
          style={{
            backgroundColor: value,
            boxShadow: `0 2px 8px -2px ${value}66, 0 1px 3px rgba(0,0,0,0.1)`,
          }}
        />
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded-lg bg-[var(--color-watashi-surface-low)] px-3 py-1.5 font-mono text-xs text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-all duration-200 focus:ring-[var(--color-watashi-indigo)] focus-visible:ring-2 focus-visible:ring-[var(--color-watashi-indigo)]"
      />
    </div>
  )
}

// ── Bento Card ──

function BentoCard({
  title,
  icon: Icon,
  children,
  className,
  accentColor = 'indigo',
  animationDelay = 0,
}: {
  title: string
  icon: typeof Award
  children: React.ReactNode
  className?: string
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'rose'
  animationDelay?: number
}) {
  const accentMap = {
    indigo: {
      badge: 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_12%,var(--color-watashi-surface-low))]',
      icon: 'text-[var(--color-watashi-indigo)]',
      gradient: 'from-[color-mix(in_oklab,var(--color-watashi-indigo)_5%,var(--color-watashi-surface-card))] to-[var(--color-watashi-surface-card)]',
    },
    emerald: {
      badge: 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_12%,var(--color-watashi-surface-low))]',
      icon: 'text-[var(--color-watashi-emerald)]',
      gradient: 'from-[color-mix(in_oklab,var(--color-watashi-emerald)_5%,var(--color-watashi-surface-card))] to-[var(--color-watashi-surface-card)]',
    },
    amber: {
      badge: 'bg-[color-mix(in_oklab,var(--color-watashi-amber,#f59e0b)_12%,var(--color-watashi-surface-low))]',
      icon: 'text-[var(--color-watashi-amber,#f59e0b)]',
      gradient: 'from-[color-mix(in_oklab,var(--color-watashi-amber,#f59e0b)_5%,var(--color-watashi-surface-card))] to-[var(--color-watashi-surface-card)]',
    },
    rose: {
      badge: 'bg-[color-mix(in_oklab,var(--color-watashi-ember)_12%,var(--color-watashi-surface-low))]',
      icon: 'text-[var(--color-watashi-ember)]',
      gradient: 'from-[color-mix(in_oklab,var(--color-watashi-ember)_5%,var(--color-watashi-surface-card))] to-[var(--color-watashi-surface-card)]',
    },
  }

  const accent = accentMap[accentColor]

  return (
    <div
      className={cx(
        'rounded-[1.75rem] bg-[var(--color-watashi-surface-card)] ring-1 ring-[var(--color-watashi-border)]',
        'transition-shadow duration-300 hover:shadow-[0_16px_48px_-24px_rgba(18,32,43,0.14)]',
        'animate-[fadeInUp_0.4s_ease_both]',
        className,
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Card header with subtle gradient */}
      <div className={cx(
        'rounded-t-[1.75rem] bg-gradient-to-b px-5 pb-3 pt-5',
        accent.gradient,
      )}>
        <div className="flex items-center gap-3">
          <div className={cx(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            accent.badge,
          )}>
            <Icon className={cx('h-4 w-4', accent.icon)} />
          </div>
          <WorkspaceEyebrow>{title}</WorkspaceEyebrow>
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 pb-5 pt-3">
        {children}
      </div>
    </div>
  )
}

// ── Certificate Live Preview ──

function CertificatePreview({
  title,
  description,
  layout,
  config,
}: {
  title: string
  description: string
  layout: CertificateLayout
  config: CertificateConfig
}) {
  const fontClass = layout.fontFamily === 'serif'
    ? 'font-serif'
    : layout.fontFamily === 'display'
      ? 'font-display'
      : 'font-sans'

  const isLandscape = layout.orientation === 'landscape'

  // Style-specific backgrounds
  const styleBackgrounds: Record<string, React.CSSProperties> = {
    classic: {
      background: 'linear-gradient(160deg, #fdfcf8 0%, #f6f0e4 45%, #fdfcf8 100%)',
    },
    modern: {
      background: 'linear-gradient(160deg, var(--color-watashi-surface-card) 0%, var(--color-watashi-surface-low) 50%, var(--color-watashi-surface-card) 100%)',
    },
    minimal: {
      background: 'var(--color-watashi-surface-card)',
    },
    ornate: {
      background: 'linear-gradient(160deg, #fdfbf2 0%, #f5ebce 40%, #fdfbf2 100%)',
    },
  }

  // Paper texture using repeating CSS pattern
  const paperTextureStyle: React.CSSProperties =
    layout.templateStyle === 'classic' || layout.templateStyle === 'ornate'
      ? {
          backgroundImage: `
            ${styleBackgrounds[layout.templateStyle]?.background ? '' : ''},
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")
          `,
        }
      : {}

  const ringStyles: Record<string, string> = {
    classic: 'ring-2 ring-[color-mix(in_oklab,var(--color-watashi-ember,#c89a5b)_25%,transparent)]',
    modern: 'ring-1 ring-[var(--color-watashi-border)]',
    minimal: 'ring-1 ring-[var(--color-watashi-border)]',
    ornate: 'ring-2 ring-amber-300/50',
  }

  // Drop shadow matched to style
  const shadowStyles: Record<string, string> = {
    classic: 'shadow-[0_24px_60px_-20px_rgba(120,80,20,0.22),0_4px_16px_-8px_rgba(0,0,0,0.1)]',
    modern: 'shadow-[0_24px_60px_-20px_rgba(18,32,43,0.18),0_4px_16px_-8px_rgba(0,0,0,0.06)]',
    minimal: 'shadow-[0_8px_32px_-12px_rgba(18,32,43,0.12)]',
    ornate: 'shadow-[0_24px_60px_-20px_rgba(160,110,20,0.25),0_4px_16px_-8px_rgba(0,0,0,0.08)]',
  }

  const currentStyle = layout.templateStyle

  return (
    <div className="flex items-center justify-center rounded-[1.75rem] bg-[var(--color-watashi-surface-low)] p-6">
      <div
        className={cx(
          'relative overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.02]',
          ringStyles[currentStyle] ?? ringStyles.classic,
          shadowStyles[currentStyle] ?? shadowStyles.classic,
          isLandscape ? 'aspect-[1.414/1] w-full max-w-[480px]' : 'aspect-[1/1.414] w-full max-w-[340px]',
        )}
        style={{
          ...(styleBackgrounds[currentStyle] ?? styleBackgrounds.classic),
          ...paperTextureStyle,
        }}
      >
        {/* Ornate: double border + corner flourishes */}
        {currentStyle === 'ornate' && (
          <>
            {/* Outer decorative border */}
            <div className="pointer-events-none absolute inset-2 rounded-xl border border-amber-300/50" />
            {/* Inner decorative border */}
            <div className="pointer-events-none absolute inset-[10px] rounded-lg border border-dashed border-amber-200/60" />
            {/* Corner flourishes via pseudo-positioned divs */}
            <div
              className="pointer-events-none absolute left-[6px] top-[6px] h-5 w-5 border-l-2 border-t-2 border-amber-400/60"
              style={{ borderRadius: '4px 0 0 0' }}
            />
            <div
              className="pointer-events-none absolute right-[6px] top-[6px] h-5 w-5 border-r-2 border-t-2 border-amber-400/60"
              style={{ borderRadius: '0 4px 0 0' }}
            />
            <div
              className="pointer-events-none absolute bottom-[6px] left-[6px] h-5 w-5 border-b-2 border-l-2 border-amber-400/60"
              style={{ borderRadius: '0 0 0 4px' }}
            />
            <div
              className="pointer-events-none absolute bottom-[6px] right-[6px] h-5 w-5 border-b-2 border-r-2 border-amber-400/60"
              style={{ borderRadius: '0 0 4px 0' }}
            />
          </>
        )}

        {/* Classic: warm inner glow vignette */}
        {currentStyle === 'classic' && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              boxShadow: 'inset 0 0 48px rgba(180,130,60,0.08)',
            }}
          />
        )}

        <div className={cx('relative flex h-full flex-col items-center justify-between p-8 text-center', fontClass)}>
          {/* Logo position placeholder */}
          {layout.logoPosition !== 'none' && (
            <div className={cx(
              'flex w-full',
              layout.logoPosition === 'top-left' && 'justify-start',
              layout.logoPosition === 'top-center' && 'justify-center',
              layout.logoPosition === 'top-right' && 'justify-end',
            )}>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black"
                style={{ backgroundColor: `${layout.secondaryColor}18`, color: layout.secondaryColor }}
              >
                W
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
            <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: layout.secondaryColor }}>
              Certificate of Completion
            </p>

            <p className="text-xs text-[var(--color-watashi-text-soft)]">This certifies that</p>

            {config.dynamicFields.showLearnerName && (
              <p
                className="text-xl font-black leading-tight tracking-tight"
                style={{ color: layout.primaryColor }}
              >
                {'{{Learner Name}}'}
              </p>
            )}

            {config.dynamicFields.showCourseTitle && (
              <p className="text-[11px] leading-relaxed text-[var(--color-watashi-text)]">
                has successfully completed{' '}
                <span className="font-semibold" style={{ color: layout.primaryColor }}>
                  {title || 'Course Title'}
                </span>
              </p>
            )}

            {description && (
              <p className="mt-1 max-w-[280px] text-[9px] leading-relaxed text-[var(--color-watashi-text-soft)]">
                {description}
              </p>
            )}

            {config.dynamicFields.showCompletionDate && (
              <p className="mt-2 text-[9px] text-[var(--color-watashi-text-soft)]">
                Issued on {'{{Date}}'}
              </p>
            )}
          </div>

          <div className="flex w-full items-end justify-between text-[8px] text-[var(--color-watashi-text-soft)]">
            {config.dynamicFields.showCertificateNumber && (
              <span>No. {'{{CERT-XXXX}}'}</span>
            )}
            <span className="font-semibold" style={{ color: layout.secondaryColor }}>Watashi Learn</span>
            {config.dynamicFields.showVerificationCode && (
              <span>Verify: {'{{CODE}}'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Empty State Illustration ──

function EmptyStateIllustration() {
  return (
    // Decorative dot-grid pattern + centered icon
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[1.75rem] bg-[var(--color-watashi-surface-low)] py-20 text-center">
      {/* Dot-grid background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, var(--color-watashi-text) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      {/* Radial fade at edges to hide dot grid cleanly */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, var(--color-watashi-surface-low) 100%)',
        }}
      />

      {/* Layered ring illustration */}
      <div className="relative mb-6">
        <div className="absolute inset-0 h-24 w-24 -translate-x-0 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-[color-mix(in_oklab,var(--color-watashi-indigo)_8%,transparent)]" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,var(--color-watashi-surface-card))] ring-1 ring-[var(--color-watashi-border)]">
          <Award className="h-10 w-10 text-[var(--color-watashi-indigo)]" strokeWidth={1.5} />
        </div>
      </div>

      <p className="relative text-base font-bold text-[var(--color-watashi-text-strong)]">No template selected</p>
      <p className="relative mt-2 max-w-[200px] text-sm leading-relaxed text-[var(--color-watashi-text-soft)]">
        Create a new template or select one from the sidebar to get started
      </p>
    </div>
  )
}

// ── Main Page ──

export function CertificateBuilderPage() {
  const builder = useCertificateBuilder()
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // ── Loading State ──
  if (builder.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-[color-mix(in_oklab,var(--color-watashi-indigo)_20%,transparent)]" />
            <Loader2 className="relative h-8 w-8 animate-spin text-[var(--color-watashi-indigo)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-watashi-text-soft)]">Loading certificate builder...</p>
        </div>
      </div>
    )
  }

  // ── Error State ──
  if (builder.error && !builder.activeTemplate && builder.templates.length === 0) {
    return (
      <WorkspacePanel className="mx-auto mt-12 flex max-w-lg flex-col items-center py-16 text-center">
        <AlertCircle className="h-10 w-10 text-[var(--color-watashi-ember)]" />
        <p className="mt-4 text-sm font-semibold text-[var(--color-watashi-text-strong)]">{builder.error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-indigo)] px-5 py-3 text-sm font-bold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </WorkspacePanel>
    )
  }

  const badge = builder.activeTemplate ? statusBadge(builder.activeTemplate.status) : null

  async function handleCreateTemplate() {
    setIsCreating(true)
    try {
      await builder.createTemplate()
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header Bar with subtle gradient ── */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[color-mix(in_oklab,var(--color-watashi-indigo)_7%,var(--color-watashi-surface-card))] via-[var(--color-watashi-surface-card)] to-[var(--color-watashi-surface-card)] px-6 py-5 ring-1 ring-[var(--color-watashi-border)] shadow-[var(--shadow-watashi-panel)]">
        {/* Subtle decorative orb */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, var(--color-watashi-indigo) 0%, transparent 70%)' }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-watashi-indigo)_12%,var(--color-watashi-surface-low))]">
              <Award className="h-5 w-5 text-[var(--color-watashi-indigo)]" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight text-[var(--color-watashi-text-strong)]">
                Certificate Builder
              </h1>
              {badge && (
                <span className={cx('mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ring-1', badge.className)}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {builder.activeTemplate && (
              <SaveStatusIndicator isSaving={builder.isSaving} saveError={builder.saveError} />
            )}
            {builder.activeTemplate && (
              <>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-surface-low)] px-4 py-2.5 text-sm font-bold text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] transition-colors hover:bg-[var(--color-watashi-surface-high)]"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                {builder.activeTemplate.status === 'draft' ? (
                  <button
                    type="button"
                    onClick={() => void builder.setStatus('published')}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-indigo)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_32px_-16px_rgba(75,65,225,0.5)] transition-shadow hover:shadow-[0_16px_40px_-16px_rgba(75,65,225,0.65)]"
                  >
                    <Send className="h-4 w-4" />
                    Publish
                  </button>
                ) : builder.activeTemplate.status === 'published' ? (
                  <button
                    type="button"
                    onClick={() => void builder.setStatus('draft')}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-surface-low)] px-4 py-2.5 text-sm font-bold text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)]"
                  >
                    Unpublish
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Grid: Sidebar + Bento + Preview ── */}
      <div className="grid min-h-[calc(100vh-14rem)] gap-6 xl:grid-cols-[260px_minmax(0,1fr)_380px]">
        {/* ── Left: Template Sidebar ── */}
        <div className="space-y-3">
          {/* Create button */}
          <button
            type="button"
            onClick={() => void handleCreateTemplate()}
            disabled={isCreating}
            className="group flex w-full items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)] px-4 py-4 text-sm font-bold text-[var(--color-watashi-indigo)] transition-all hover:border-[var(--color-watashi-indigo)] hover:bg-[color-mix(in_oklab,var(--color-watashi-indigo)_6%,var(--color-watashi-surface-card))] disabled:opacity-60"
          >
            {isCreating
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
            }
            {isCreating ? 'Creating...' : 'New Template'}
          </button>

          {/* Subtle divider with label */}
          {builder.templates.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-[var(--color-watashi-border)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-watashi-text-soft)]">
                Templates
              </span>
              <div className="h-px flex-1 bg-[var(--color-watashi-border)]" />
            </div>
          )}

          {/* Template list */}
          <div className="space-y-2">
            {builder.templates.map((template) => {
              const isActive = template.id === builder.activeTemplate?.id
              const tBadge = statusBadge(template.status)
              const swatch = templateSwatch(template.layout?.primaryColor as string ?? '#4b41e1')
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => void builder.selectTemplate(template.id)}
                  className={cx(
                    'group relative block w-full rounded-[1.4rem] px-4 py-3.5 text-left transition-all duration-200',
                    isActive
                      ? 'bg-[var(--color-watashi-surface-card)] shadow-[var(--shadow-watashi-panel)] ring-1 ring-[color-mix(in_oklab,var(--color-watashi-indigo)_30%,var(--color-watashi-border))]'
                      : 'bg-[var(--color-watashi-surface-low)] hover:bg-[var(--color-watashi-surface-card)] hover:shadow-[0_4px_16px_-8px_rgba(18,32,43,0.1)]',
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Color swatch preview */}
                    <div
                      className="mt-0.5 h-8 w-8 shrink-0 rounded-lg ring-1 ring-[var(--color-watashi-border)] transition-transform group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${swatch} 0%, ${swatch}99 100%)`,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cx('truncate text-sm font-bold leading-tight', isActive ? 'text-[var(--color-watashi-indigo)]' : 'text-[var(--color-watashi-text-strong)]')}>
                        {template.title || 'Untitled'}
                      </p>
                      <span className={cx('mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ring-1', tBadge.className)}>
                        {tBadge.label}
                      </span>
                    </div>
                    {/* Action buttons — visible on hover when active */}
                    {isActive && (
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); void builder.duplicateTemplate(template.id) }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text-soft)] transition-colors hover:text-[var(--color-watashi-indigo)]"
                          title="Duplicate"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); void builder.deleteTemplate(template.id) }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text-soft)] transition-colors hover:text-[var(--color-watashi-ember)]"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}

            {/* Empty sidebar state */}
            {builder.templates.length === 0 && (
              <div className="rounded-[1.4rem] bg-[var(--color-watashi-surface-low)] px-4 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-watashi-indigo)_8%,var(--color-watashi-surface-card))]">
                  <Award className="h-6 w-6 text-[var(--color-watashi-text-soft)]" strokeWidth={1.5} />
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--color-watashi-text-soft)]">No templates yet</p>
                <p className="mt-1 text-xs text-[var(--color-watashi-text-soft)]">Create one to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Center: Bento Form Grid ── */}
        {builder.activeTemplate ? (
          <div className="grid auto-rows-min gap-4 md:grid-cols-2">
            {/* Certificate Info — spans full width */}
            <BentoCard title="Certificate Info" icon={FileText} className="md:col-span-2" accentColor="indigo" animationDelay={0}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Title</label>
                  <input
                    type="text"
                    value={builder.title}
                    onChange={(e) => builder.setTitle(e.target.value)}
                    placeholder="Certificate title..."
                    className="w-full rounded-xl bg-[var(--color-watashi-surface-low)] px-4 py-2.5 text-sm font-semibold text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-all duration-200 placeholder:text-[var(--color-watashi-text-soft)] focus:ring-[var(--color-watashi-indigo)] focus-visible:ring-2 focus-visible:ring-[var(--color-watashi-indigo)]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Description</label>
                  <textarea
                    value={builder.description}
                    onChange={(e) => builder.setDescription(e.target.value)}
                    placeholder="What this certificate recognizes..."
                    rows={2}
                    className="w-full resize-none rounded-xl bg-[var(--color-watashi-surface-low)] px-4 py-2.5 text-sm text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-all duration-200 placeholder:text-[var(--color-watashi-text-soft)] focus:ring-[var(--color-watashi-indigo)] focus-visible:ring-2 focus-visible:ring-[var(--color-watashi-indigo)]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Template Style</label>
                  <SelectInput
                    value={builder.layout.templateStyle}
                    onChange={(v) => builder.updateLayout('templateStyle', v as CertificateLayout['templateStyle'])}
                    options={TEMPLATE_STYLES}
                    label="Template style"
                  />
                </div>
              </div>
            </BentoCard>

            {/* Branding */}
            <BentoCard title="Branding" icon={Palette} accentColor="emerald" animationDelay={60}>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Primary Color</label>
                  <ColorInput
                    value={builder.layout.primaryColor}
                    onChange={(v) => builder.updateLayout('primaryColor', v)}
                    label="Primary color"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Accent Color</label>
                  <ColorInput
                    value={builder.layout.secondaryColor}
                    onChange={(v) => builder.updateLayout('secondaryColor', v)}
                    label="Secondary color"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Font Family</label>
                  <SelectInput
                    value={builder.layout.fontFamily}
                    onChange={(v) => builder.updateLayout('fontFamily', v)}
                    options={FONT_FAMILIES}
                    label="Font family"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Logo Position</label>
                  <SelectInput
                    value={builder.layout.logoPosition}
                    onChange={(v) => builder.updateLayout('logoPosition', v as CertificateLogoPosition)}
                    options={LOGO_POSITIONS}
                    label="Logo position"
                  />
                </div>
              </div>
            </BentoCard>

            {/* Dynamic Fields */}
            <BentoCard title="Dynamic Fields" icon={Type} accentColor="indigo" animationDelay={120}>
              <div className="space-y-3.5">
                {[
                  { key: 'showLearnerName' as const, label: 'Learner Name', icon: User },
                  { key: 'showCourseTitle' as const, label: 'Course Title', icon: Award },
                  { key: 'showCompletionDate' as const, label: 'Completion Date', icon: Clock },
                  { key: 'showCertificateNumber' as const, label: 'Certificate Number', icon: Hash },
                  { key: 'showVerificationCode' as const, label: 'Verification Code', icon: Shield },
                ].map((field) => {
                  const FieldIcon = field.icon
                  return (
                    <div key={field.key} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <FieldIcon className="h-3.5 w-3.5 text-[var(--color-watashi-text-soft)]" />
                        <span className="text-sm font-medium text-[var(--color-watashi-text-strong)]">{field.label}</span>
                      </div>
                      <ToggleSwitch
                        checked={builder.config.dynamicFields[field.key]}
                        onChange={(v) => builder.updateDynamicField(field.key, v)}
                        label={field.label}
                      />
                    </div>
                  )
                })}
              </div>
            </BentoCard>

            {/* Validation */}
            <BentoCard title="Validation" icon={Shield} accentColor="amber" animationDelay={180}>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-3.5 w-3.5 text-[var(--color-watashi-text-soft)]" />
                    <span className="text-sm font-medium text-[var(--color-watashi-text-strong)]">Public Verification</span>
                  </div>
                  <ToggleSwitch
                    checked={builder.config.validation.publicVerification}
                    onChange={(v) => builder.updateValidation('publicVerification', v)}
                    label="Public verification"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-3.5 w-3.5 text-[var(--color-watashi-text-soft)]" />
                    <span className="text-sm font-medium text-[var(--color-watashi-text-strong)]">Expiry</span>
                  </div>
                  <ToggleSwitch
                    checked={builder.config.validation.hasExpiry}
                    onChange={(v) => builder.updateValidation('hasExpiry', v)}
                    label="Has expiry"
                  />
                </div>

                {builder.config.validation.hasExpiry && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Expiry (days)</label>
                    <input
                      type="number"
                      min={1}
                      value={String(builder.config.validation.expiryDays ?? '')}
                      onChange={(e) => builder.updateValidation('expiryDays', e.target.value ? Number(e.target.value) : null)}
                      placeholder="365"
                      className="w-full rounded-xl bg-[var(--color-watashi-surface-low)] px-4 py-2.5 text-sm text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-all duration-200 focus:ring-[var(--color-watashi-indigo)] focus-visible:ring-2 focus-visible:ring-[var(--color-watashi-indigo)]"
                    />
                  </div>
                )}
              </div>
            </BentoCard>

            {/* Issuance Rules */}
            <BentoCard title="Issuance Rules" icon={Settings2} accentColor="indigo" animationDelay={240}>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Issuance Mode</label>
                  <div className="flex gap-2">
                    {(['auto', 'manual'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => builder.updateIssuance('mode', mode)}
                        className={cx(
                          'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                          builder.config.issuance.mode === mode
                            ? 'bg-[var(--color-watashi-indigo)] text-white shadow-[0_4px_16px_-6px_rgba(75,65,225,0.4)]'
                            : 'bg-[var(--color-watashi-surface-low)] text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)] hover:text-[var(--color-watashi-text-strong)]',
                        )}
                      >
                        {mode === 'auto' ? 'Auto Issue' : 'Manual'}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-watashi-text-soft)]">
                    {builder.config.issuance.mode === 'auto'
                      ? 'Certificates are issued automatically upon course completion.'
                      : 'Certificates require manual approval before issuance.'}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--color-watashi-text-soft)]">Linked Course</label>
                  <SelectInput
                    value={builder.config.issuance.linkedCourseId ?? ''}
                    onChange={(v) => builder.updateIssuance('linkedCourseId', v || null)}
                    options={[
                      { value: '', label: 'None' },
                      ...builder.courses.map((c) => ({ value: c.id, label: c.title })),
                    ]}
                    label="Linked course"
                  />
                </div>

                {builder.activeTemplate.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => void builder.setStatus('archived')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-watashi-surface-low)] px-4 py-2.5 text-sm font-semibold text-[var(--color-watashi-text-soft)] ring-1 ring-[var(--color-watashi-border)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-watashi-ember)_10%,var(--color-watashi-surface-card))] hover:text-[var(--color-watashi-ember)] hover:ring-[color-mix(in_oklab,var(--color-watashi-ember)_30%,var(--color-watashi-border))]"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive Template
                  </button>
                )}
              </div>
            </BentoCard>
          </div>
        ) : (
          /* ── Empty center state ── */
          <div className="flex flex-col">
            <EmptyStateIllustration />
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => void handleCreateTemplate()}
                disabled={isCreating}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-watashi-indigo)] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_32px_-16px_rgba(75,65,225,0.5)] transition-shadow hover:shadow-[0_16px_40px_-16px_rgba(75,65,225,0.65)] disabled:opacity-60"
              >
                {isCreating
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Plus className="h-4 w-4" />
                }
                {isCreating ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        )}

        {/* ── Right: Live Preview ── */}
        <div className="space-y-4">
          <WorkspacePanel className="sticky top-28 rounded-[1.75rem]">
            <WorkspaceEyebrow>Live Preview</WorkspaceEyebrow>
            <div className="mt-4">
              <CertificatePreview
                title={builder.title}
                description={builder.description}
                layout={builder.layout}
                config={builder.config}
              />
            </div>

            {builder.activeTemplate && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => builder.updateLayout('orientation', builder.layout.orientation === 'landscape' ? 'portrait' : 'landscape')}
                  className="flex-1 rounded-xl bg-[var(--color-watashi-surface-low)] px-3 py-2 text-xs font-semibold text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)] transition-colors hover:text-[var(--color-watashi-text-strong)]"
                >
                  {builder.layout.orientation === 'landscape' ? 'Switch to Portrait' : 'Switch to Landscape'}
                </button>
              </div>
            )}
          </WorkspacePanel>
        </div>
      </div>

      {/* ── Preview Modal with open/close animation ── */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex animate-[fadeIn_0.2s_ease_both] items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="max-h-[90vh] max-w-[90vw] animate-[scaleIn_0.25s_cubic-bezier(0.34,1.56,0.64,1)_both] overflow-auto rounded-[2rem] bg-[var(--color-watashi-surface-card)] p-8 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.35)] ring-1 ring-[var(--color-watashi-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-6">
              <div>
                <h2 className="font-display text-xl font-black text-[var(--color-watashi-text-strong)]">Certificate Preview</h2>
                <p className="mt-0.5 text-xs text-[var(--color-watashi-text-soft)]">
                  {builder.layout.templateStyle.charAt(0).toUpperCase() + builder.layout.templateStyle.slice(1)} style
                  &middot; {builder.layout.orientation}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="rounded-full bg-[var(--color-watashi-surface-low)] px-4 py-2 text-sm font-bold text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)] transition-colors hover:bg-[var(--color-watashi-surface-high)]"
              >
                Close
              </button>
            </div>
            <CertificatePreview
              title={builder.title}
              description={builder.description}
              layout={builder.layout}
              config={builder.config}
            />
          </div>
        </div>
      )}
    </div>
  )
}
