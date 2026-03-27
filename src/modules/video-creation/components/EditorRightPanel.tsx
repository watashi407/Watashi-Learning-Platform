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
  { id: 'subtitles', icon: Captions, label: 'Subs' },
  { id: 'export', icon: Download, label: 'Export' },
  { id: 'binding', icon: BookOpen, label: 'Publish' },
]

function AudioSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-semibold text-[var(--color-watashi-text)]">
        <span>{label}</span>
        <span className="tabular-nums text-[var(--color-watashi-text-soft)]">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--color-watashi-indigo)]" />
    </div>
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
    <div className="flex flex-col border-l border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-watashi-border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cx(
                'flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-bold uppercase tracking-wide transition-colors',
                activeTab === tab.id
                  ? 'border-b-2 border-[var(--color-watashi-indigo)] text-[var(--color-watashi-indigo)]'
                  : 'text-[var(--color-watashi-text-soft)] hover:text-[var(--color-watashi-text)]',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'audio' && (
          <div className="space-y-5">
            <p className="text-[11px] font-black uppercase tracking-wide text-[var(--color-watashi-text-soft)]">Audio settings</p>
            <AudioSlider label="Voice boost" value={audioSettings.voiceBoost} onChange={(v) => onAudioChange('voiceBoost', v)} />
            <AudioSlider label="Noise reduction" value={audioSettings.noiseReduction} onChange={(v) => onAudioChange('noiseReduction', v)} />
            <AudioSlider label="Music ducking" value={audioSettings.musicDucking} onChange={(v) => onAudioChange('musicDucking', v)} />

            <div className="space-y-2 pt-1">
              {([['silenceTrim', 'Trim silence'], ['normalizeDialogue', 'Normalize dialogue']] as Array<[keyof AudioToolSettings, string]>).map(([field, label]) => (
                <label key={field} className="flex items-center justify-between rounded-xl bg-[var(--color-watashi-surface-card)] px-3 py-3 text-xs font-semibold text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)]">
                  {label}
                  <input
                    type="checkbox"
                    checked={audioSettings[field] as boolean}
                    onChange={(e) => onAudioChange(field, e.target.checked)}
                    className="h-4 w-4 accent-[var(--color-watashi-indigo)]"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subtitles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-wide text-[var(--color-watashi-text-soft)]">Subtitles</p>
              <button
                type="button"
                onClick={onGenerateSubtitles}
                disabled={subtitleJobStatus === 'queued' || subtitleJobStatus === 'processing'}
                className="rounded-lg bg-[color-mix(in_oklab,var(--color-watashi-indigo)_12%,white)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-watashi-indigo)] disabled:opacity-60"
              >
                {subtitleJobStatus === 'queued' || subtitleJobStatus === 'processing' ? 'Generating…' : 'Auto-generate'}
              </button>
            </div>

            <div className="space-y-3">
              {subtitleCues.map((cue) => (
                <div key={cue.id} className="rounded-xl bg-[var(--color-watashi-surface-card)] p-3 ring-1 ring-[var(--color-watashi-border)]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cue.startLabel}
                      onChange={(e) => onSubtitleChange(cue.id, 'startLabel', e.target.value)}
                      className="w-20 rounded-lg bg-[var(--color-watashi-surface-low)] p-1 text-center text-[11px] font-mono outline-none ring-1 ring-transparent focus:ring-[var(--color-watashi-border)]"
                    />
                    <span className="self-center text-[11px] text-[var(--color-watashi-text-soft)]">→</span>
                    <input
                      type="text"
                      value={cue.endLabel}
                      onChange={(e) => onSubtitleChange(cue.id, 'endLabel', e.target.value)}
                      className="w-20 rounded-lg bg-[var(--color-watashi-surface-low)] p-1 text-center text-[11px] font-mono outline-none ring-1 ring-transparent focus:ring-[var(--color-watashi-border)]"
                    />
                  </div>
                  <textarea
                    value={cue.text}
                    onChange={(e) => onSubtitleChange(cue.id, 'text', e.target.value)}
                    rows={2}
                    className="mt-2 w-full resize-none rounded-lg bg-[var(--color-watashi-surface-low)] p-2 text-xs outline-none ring-1 ring-transparent focus:ring-[var(--color-watashi-border)]"
                  />
                </div>
              ))}
            </div>

            <button type="button" onClick={onAddSubtitle} className="w-full rounded-xl bg-[var(--color-watashi-surface-card)] py-2 text-xs font-bold text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)] hover:bg-[var(--color-watashi-surface-high)]">
              + Add cue
            </button>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-5">
            <p className="text-[11px] font-black uppercase tracking-wide text-[var(--color-watashi-text-soft)]">Export settings</p>

            <label className="block text-xs font-semibold text-[var(--color-watashi-text)]">
              Format
              <select value={exportSettings.format} onChange={(e) => onExportChange('format', e.target.value as ExportSettings['format'])} className="mt-1 w-full rounded-xl bg-[var(--color-watashi-surface-card)] p-2 text-xs ring-1 ring-[var(--color-watashi-border)] outline-none">
                <option value="mp4">MP4</option>
                <option value="mov">MOV</option>
              </select>
            </label>

            <label className="block text-xs font-semibold text-[var(--color-watashi-text)]">
              Resolution
              <select value={exportSettings.resolution} onChange={(e) => onExportChange('resolution', e.target.value as ExportSettings['resolution'])} className="mt-1 w-full rounded-xl bg-[var(--color-watashi-surface-card)] p-2 text-xs ring-1 ring-[var(--color-watashi-border)] outline-none">
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
              </select>
            </label>

            <label className="block text-xs font-semibold text-[var(--color-watashi-text)]">
              Render preset
              <select value={exportSettings.renderPreset} onChange={(e) => onExportChange('renderPreset', e.target.value as ExportSettings['renderPreset'])} className="mt-1 w-full rounded-xl bg-[var(--color-watashi-surface-card)] p-2 text-xs ring-1 ring-[var(--color-watashi-border)] outline-none">
                <option value="balanced">Balanced</option>
                <option value="publish">Publish</option>
                <option value="high-detail">High detail</option>
              </select>
            </label>

            <label className="flex items-center justify-between rounded-xl bg-[var(--color-watashi-surface-card)] px-3 py-3 text-xs font-semibold text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)]">
              Burn subtitles
              <input
                type="checkbox"
                checked={exportSettings.includeBurnedSubtitles}
                onChange={(e) => onExportChange('includeBurnedSubtitles', e.target.checked)}
                className="h-4 w-4 accent-[var(--color-watashi-indigo)]"
              />
            </label>
          </div>
        )}

        {activeTab === 'binding' && (
          <div className="space-y-5">
            <p className="text-[11px] font-black uppercase tracking-wide text-[var(--color-watashi-text-soft)]">Publish destination</p>

            <div className="flex rounded-xl bg-[var(--color-watashi-surface-card)] p-1 ring-1 ring-[var(--color-watashi-border)]">
              {(['lesson', 'course'] as LessonBindingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onBindingTypeChange(type)}
                  className={cx(
                    'flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-colors',
                    bindingType === type
                      ? 'bg-[var(--color-watashi-indigo)] text-white'
                      : 'text-[var(--color-watashi-text-soft)] hover:text-[var(--color-watashi-text)]',
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {bindingOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onBindingTargetChange(option.id)}
                  className={cx(
                    'w-full rounded-xl p-3 text-left text-xs ring-1 transition-colors',
                    bindingTargetId === option.id
                      ? 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,white)] ring-[var(--color-watashi-indigo)]/40'
                      : 'bg-[var(--color-watashi-surface-card)] ring-[var(--color-watashi-border)] hover:bg-[var(--color-watashi-surface-high)]',
                  )}
                >
                  <p className="font-semibold text-[var(--color-watashi-text-strong)]">{option.title}</p>
                  <p className="mt-0.5 text-[var(--color-watashi-text-soft)]">{option.detail}</p>
                </button>
              ))}
            </div>

            {bindingOptions.length === 0 && (
              <p className="text-xs text-[var(--color-watashi-text-soft)]">No {bindingType}s available. Create one first.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
