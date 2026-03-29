import { BookOpen, Captions, Download, Headphones } from 'lucide-react'
import { useState } from 'react'
import type {
  AudioToolSettings,
  ExportSettings,
  LessonBindingOption,
  LessonBindingType,
  SubtitleCue,
} from '../types/video-project.types'
import { cx } from '../../../shared/ui/workspace'

type RightTab = 'audio' | 'subtitles' | 'export' | 'binding'

const tabs: Array<{ id: RightTab; icon: typeof Headphones; label: string }> = [
  { id: 'audio', icon: Headphones, label: 'Audio' },
  { id: 'subtitles', icon: Captions, label: 'Captions' },
  { id: 'export', icon: Download, label: 'Export' },
  { id: 'binding', icon: BookOpen, label: 'Bind' },
]

/** Styled slider with a coloured fill track */
function StyledSlider({
  label,
  value,
  min = 0,
  max = 100,
  unit = '%',
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  unit?: string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="text-[var(--color-watashi-text-strong)]">{label}</span>
        <span className="rounded-md bg-[var(--color-watashi-surface-low)] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[var(--color-watashi-text-soft)]">
          {value > 0 && unit !== '%' ? `+${value} ${unit}` : `${value}${unit}`}
        </span>
      </div>
      {/* Visual track */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-watashi-surface-high)]">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-watashi-indigo)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Invisible range input layered on top */}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-watashi-indigo)]"
        style={{ marginTop: -8 }}
      />
    </div>
  )
}

/** iOS-style toggle switch */
function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  id: string
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
        checked ? 'bg-[var(--color-watashi-indigo)]' : 'bg-[var(--color-watashi-surface-high)]',
      )}
    >
      <span
        className={cx(
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

/** Row: label on left, toggle on right */
function ToggleRow({
  label,
  checked,
  onChange,
  id,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  id: string
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-[var(--color-watashi-surface-low)] px-3 py-2.5 ring-1 ring-[var(--color-watashi-border)] transition-colors hover:bg-[var(--color-watashi-surface-high)]"
    >
      <span className="text-[11px] font-semibold text-[var(--color-watashi-text-strong)]">{label}</span>
      <Toggle checked={checked} onChange={onChange} id={id} />
    </label>
  )
}

type EditorRightPanelProps = {
  audioSettings: AudioToolSettings
  onAudioChange: (field: keyof AudioToolSettings, value: number | boolean) => void
  subtitleCues: SubtitleCue[]
  onSubtitleChange: (id: string, field: keyof SubtitleCue, value: string) => void
  onAddSubtitle: () => void
  onGenerateSubtitles: () => void
  subtitleJobStatus: string
  exportSettings: ExportSettings
  onExportChange: <K extends keyof ExportSettings>(field: K, value: ExportSettings[K]) => void
  bindingType: LessonBindingType
  bindingTargetId: string
  bindingOptions: LessonBindingOption[]
  onBindingTypeChange: (type: LessonBindingType) => void
  onBindingTargetChange: (id: string) => void
}

export function EditorRightPanel({
  audioSettings,
  onAudioChange,
  subtitleCues,
  onSubtitleChange,
  onAddSubtitle,
  onGenerateSubtitles,
  subtitleJobStatus,
  exportSettings,
  onExportChange,
  bindingType,
  bindingTargetId,
  bindingOptions,
  onBindingTypeChange,
  onBindingTargetChange,
}: EditorRightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightTab>('audio')

  return (
    <div className="flex flex-col border-l border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)]">
      {/* Tab bar — icon only, tooltip on hover */}
      <div className="flex border-b border-[var(--color-watashi-border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              aria-label={tab.label}
              className={cx(
                'group relative flex flex-1 items-center justify-center py-3.5 transition-colors',
                isActive
                  ? 'text-[var(--color-watashi-indigo)]'
                  : 'text-[var(--color-watashi-text-soft)] hover:text-[var(--color-watashi-text)]',
              )}
            >
              <Icon className="h-4 w-4" />

              {/* Hover tooltip */}
              <span className="pointer-events-none absolute -bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--color-watashi-text-strong)] px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-md transition-opacity delay-150 group-hover:opacity-100">
                {tab.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[var(--color-watashi-indigo)]" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* ── AUDIO TAB ── */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Enhancements</p>

            <div className="space-y-4">
              <StyledSlider
                label="Voice boost"
                value={audioSettings.voiceBoost}
                min={0}
                max={100}
                unit="%"
                onChange={(v) => onAudioChange('voiceBoost', v)}
              />
              <StyledSlider
                label="Noise reduction"
                value={audioSettings.noiseReduction}
                min={0}
                max={100}
                unit="%"
                onChange={(v) => onAudioChange('noiseReduction', v)}
              />
              <StyledSlider
                label="Music ducking"
                value={audioSettings.musicDucking}
                min={0}
                max={100}
                unit="%"
                onChange={(v) => onAudioChange('musicDucking', v)}
              />
            </div>

            <div className="space-y-2 pt-1">
              <ToggleRow
                id="silence-trim"
                label="Trim silence automatically"
                checked={!!audioSettings.silenceTrim}
                onChange={(v) => onAudioChange('silenceTrim', v)}
              />
              <ToggleRow
                id="normalize-dialogue"
                label="Normalize loudness"
                checked={!!audioSettings.normalizeDialogue}
                onChange={(v) => onAudioChange('normalizeDialogue', v)}
              />
            </div>
          </div>
        )}

        {/* ── CAPTIONS TAB ── */}
        {activeTab === 'subtitles' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Captions</p>
              <button
                type="button"
                onClick={onGenerateSubtitles}
                disabled={subtitleJobStatus === 'queued' || subtitleJobStatus === 'processing'}
                className="rounded-lg bg-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,var(--color-watashi-surface-low))] px-2.5 py-1 text-[10px] font-bold text-[var(--color-watashi-indigo)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-watashi-indigo)_16%,var(--color-watashi-surface-low))] disabled:opacity-60"
              >
                {subtitleJobStatus === 'queued' || subtitleJobStatus === 'processing' ? 'Generating…' : 'Auto-generate'}
              </button>
            </div>

            <div className="space-y-2">
              {subtitleCues.map((cue) => (
                <div key={cue.id} className="rounded-lg bg-[var(--color-watashi-surface-low)] p-2.5 ring-1 ring-[var(--color-watashi-border)]">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={cue.startLabel}
                      onChange={(e) => onSubtitleChange(cue.id, 'startLabel', e.target.value)}
                      className="w-[4.5rem] rounded-md bg-[var(--color-watashi-surface-card)] p-1 text-center text-[10px] font-mono text-[var(--color-watashi-text-strong)] outline-none ring-1 ring-transparent transition-shadow focus:ring-[var(--color-watashi-border)]"
                    />
                    <span className="self-center text-[10px] text-[var(--color-watashi-text-soft)]">–</span>
                    <input
                      type="text"
                      value={cue.endLabel}
                      onChange={(e) => onSubtitleChange(cue.id, 'endLabel', e.target.value)}
                      className="w-[4.5rem] rounded-md bg-[var(--color-watashi-surface-card)] p-1 text-center text-[10px] font-mono text-[var(--color-watashi-text-strong)] outline-none ring-1 ring-transparent transition-shadow focus:ring-[var(--color-watashi-border)]"
                    />
                  </div>
                  <textarea
                    value={cue.text}
                    onChange={(e) => onSubtitleChange(cue.id, 'text', e.target.value)}
                    rows={2}
                    className="mt-1.5 w-full resize-none rounded-md bg-[var(--color-watashi-surface-card)] p-1.5 text-[11px] text-[var(--color-watashi-text-strong)] outline-none ring-1 ring-transparent transition-shadow focus:ring-[var(--color-watashi-border)]"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onAddSubtitle}
              className="w-full rounded-lg bg-[var(--color-watashi-surface-low)] py-2 text-[11px] font-bold text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)] transition-colors hover:bg-[var(--color-watashi-surface-high)]"
            >
              + Add cue
            </button>
          </div>
        )}

        {/* ── EXPORT TAB ── */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Format & Export</p>

            <label className="block text-[11px] font-semibold text-[var(--color-watashi-text-strong)]">
              Format
              <select
                value={exportSettings.format}
                onChange={(e) => onExportChange('format', e.target.value as ExportSettings['format'])}
                className="mt-1.5 w-full rounded-lg bg-[var(--color-watashi-surface-low)] p-2 text-[11px] text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-shadow focus:ring-[var(--color-watashi-indigo)]"
              >
                <option value="mp4">MP4</option>
                <option value="mov">MOV</option>
              </select>
            </label>

            <label className="block text-[11px] font-semibold text-[var(--color-watashi-text-strong)]">
              Resolution
              <select
                value={exportSettings.resolution}
                onChange={(e) => onExportChange('resolution', e.target.value as ExportSettings['resolution'])}
                className="mt-1.5 w-full rounded-lg bg-[var(--color-watashi-surface-low)] p-2 text-[11px] text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-shadow focus:ring-[var(--color-watashi-indigo)]"
              >
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
                <option value="4k">4K Ultra HD</option>
              </select>
            </label>

            <label className="block text-[11px] font-semibold text-[var(--color-watashi-text-strong)]">
              Render preset
              <select
                value={exportSettings.renderPreset}
                onChange={(e) => onExportChange('renderPreset', e.target.value as ExportSettings['renderPreset'])}
                className="mt-1.5 w-full rounded-lg bg-[var(--color-watashi-surface-low)] p-2 text-[11px] text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-shadow focus:ring-[var(--color-watashi-indigo)]"
              >
                <option value="balanced">Balanced</option>
                <option value="publish">Publish</option>
                <option value="high-detail">High detail</option>
              </select>
            </label>

            <ToggleRow
              id="burn-subs"
              label="Burn-in captions"
              checked={!!exportSettings.includeBurnedSubtitles}
              onChange={(v) => onExportChange('includeBurnedSubtitles', v)}
            />
          </div>
        )}

        {/* ── BINDING TAB ── */}
        {activeTab === 'binding' && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Publish destination</p>

            {/* Segmented control */}
            <div className="flex rounded-xl bg-[var(--color-watashi-surface-low)] p-1 ring-1 ring-[var(--color-watashi-border)]">
              {(['lesson', 'course'] as LessonBindingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onBindingTypeChange(type)}
                  className={cx(
                    'flex-1 rounded-lg py-1.5 text-[11px] font-bold capitalize transition-all',
                    bindingType === type
                      ? 'bg-[var(--color-watashi-surface-card)] text-[var(--color-watashi-indigo)] shadow-sm ring-1 ring-[var(--color-watashi-border)]'
                      : 'text-[var(--color-watashi-text-soft)] hover:text-[var(--color-watashi-text)]',
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              {bindingOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onBindingTargetChange(option.id)}
                  className={cx(
                    'w-full rounded-xl p-2.5 text-left text-[11px] ring-1 transition-all',
                    bindingTargetId === option.id
                      ? 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_8%,var(--color-watashi-surface-card))] ring-[color-mix(in_oklab,var(--color-watashi-indigo)_28%,var(--color-watashi-border))]'
                      : 'bg-[var(--color-watashi-surface-low)] ring-[var(--color-watashi-border)] hover:bg-[var(--color-watashi-surface-high)]',
                  )}
                >
                  <p className="font-semibold text-[var(--color-watashi-text-strong)]">{option.title}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--color-watashi-text-soft)]">{option.detail}</p>
                </button>
              ))}
              {bindingOptions.length === 0 && (
                <p className="rounded-lg bg-[var(--color-watashi-surface-low)] px-3 py-3 text-[11px] text-[var(--color-watashi-text-soft)]">
                  No {bindingType}s available. Create one in the Course Builder first.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
