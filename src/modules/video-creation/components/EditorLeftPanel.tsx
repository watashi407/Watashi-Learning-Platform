import { Image, ImagePlus, Sliders, Type, Upload, Video } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ImageOverlay, TextOverlay, UploadedVideoAsset, VideoEffects } from '../types/video-project.types'
import { cx } from '../../../shared/ui/workspace'

type LeftTab = 'media' | 'effects' | 'text' | 'images'

const tabs: Array<{ id: LeftTab; icon: typeof Video; label: string }> = [
  { id: 'media', icon: Video, label: 'Media' },
  { id: 'effects', icon: Sliders, label: 'Effects' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'images', icon: Image, label: 'Images' },
]

function EffectSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[var(--color-watashi-text)]">
        <span>{label}</span>
        <span className="tabular-nums text-[var(--color-watashi-text-soft)]">{value > 0 ? `+${value}` : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-watashi-indigo)]"
      />
    </div>
  )
}

type EditorLeftPanelProps = {
  uploadedAsset: UploadedVideoAsset | null
  isInspecting: boolean
  effects: VideoEffects
  textOverlays: TextOverlay[]
  imageOverlays: ImageOverlay[]
  currentTime: number
  totalDuration: number
  onStageFile: (file: File) => void
  onEffectChange: <K extends keyof VideoEffects>(field: K, value: VideoEffects[K]) => void
  onAddText: (overlay: TextOverlay) => void
  onAddImage: (overlay: ImageOverlay) => void
}

export function EditorLeftPanel({
  uploadedAsset,
  isInspecting,
  effects,
  textOverlays,
  imageOverlays,
  currentTime,
  totalDuration,
  onStageFile,
  onEffectChange,
  onAddText,
  onAddImage,
}: EditorLeftPanelProps) {
  const [activeTab, setActiveTab] = useState<LeftTab>('media')
  const [isDragOver, setIsDragOver] = useState(false)
  const [textDraft, setTextDraft] = useState({ text: 'Add title here', fontFamily: 'sans-serif' as TextOverlay['fontFamily'], fontSize: 32, color: '#ffffff', bgColor: null as string | null, position: 'bottom' as TextOverlay['position'] })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(files: FileList | null) {
    if (!files?.[0]) return
    onStageFile(files[0])
  }

  function handleImageSelect(files: FileList | null) {
    if (!files?.[0]) return
    const file = files[0]
    const objectUrl = URL.createObjectURL(file)
    onAddImage({
      id: `img-${Date.now()}`,
      label: file.name,
      storagePath: null,
      objectUrl,
      position: 'bottom-right',
      opacity: 1,
      startSeconds: currentTime,
      endSeconds: Math.min(currentTime + 10, totalDuration || currentTime + 10),
    })
  }

  function handleAddText() {
    if (!textDraft.text.trim()) return
    onAddText({
      id: `text-${Date.now()}`,
      ...textDraft,
      startSeconds: currentTime,
      endSeconds: Math.min(currentTime + 8, totalDuration || currentTime + 8),
    })
  }

  return (
    <div className="flex flex-col border-r border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)]">
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

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'media' && (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              className={cx(
                'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors',
                isDragOver
                  ? 'border-[var(--color-watashi-indigo)] bg-[color-mix(in_oklab,var(--color-watashi-indigo)_8%,white)]'
                  : 'border-[var(--color-watashi-border)] hover:border-[var(--color-watashi-indigo)]/60',
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files) }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-watashi-surface-card)] shadow-sm">
                <Upload className="h-5 w-5 text-[var(--color-watashi-text-soft)]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-watashi-text)]">Drop video here</p>
                <p className="mt-1 text-[11px] text-[var(--color-watashi-text-soft)]">MP4, MOV, WebM • up to 2 GB</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isInspecting}
                className="rounded-xl bg-[var(--color-watashi-indigo)] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {isInspecting ? 'Uploading…' : 'Browse file'}
              </button>
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
            </div>

            {/* Staged asset */}
            {uploadedAsset && (
              <div className="rounded-xl bg-[var(--color-watashi-surface-card)] p-3 ring-1 ring-[var(--color-watashi-border)]">
                <p className="text-[11px] font-black uppercase tracking-wide text-[var(--color-watashi-text-soft)]">Source clip</p>
                <p className="mt-1 truncate text-xs font-semibold text-[var(--color-watashi-text-strong)]">{uploadedAsset.fileName}</p>
                <p className="mt-0.5 text-[11px] text-[var(--color-watashi-text-soft)]">
                  {Math.round(uploadedAsset.durationSeconds / 60)} min • {(uploadedAsset.fileSizeBytes / 1024 / 1024).toFixed(0)} MB
                </p>
              </div>
            )}

            {/* Image overlays list */}
            {imageOverlays.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wide text-[var(--color-watashi-text-soft)]">Image overlays</p>
                {imageOverlays.map((img) => (
                  <div key={img.id} className="flex items-center gap-2 rounded-xl bg-[var(--color-watashi-surface-card)] p-2.5 text-xs ring-1 ring-[var(--color-watashi-border)]">
                    {img.objectUrl && <img src={img.objectUrl} alt={img.label} className="h-8 w-8 rounded-lg object-cover" />}
                    <span className="flex-1 truncate font-semibold text-[var(--color-watashi-text)]">{img.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'effects' && (
          <div className="space-y-5">
            <p className="text-[11px] font-black uppercase tracking-wide text-[var(--color-watashi-text-soft)]">Visual adjustments</p>
            <EffectSlider label="Brightness" value={effects.brightness} min={-100} max={100} onChange={(v) => onEffectChange('brightness', v)} />
            <EffectSlider label="Contrast" value={effects.contrast} min={-100} max={100} onChange={(v) => onEffectChange('contrast', v)} />
            <EffectSlider label="Saturation" value={effects.saturation} min={-100} max={100} onChange={(v) => onEffectChange('saturation', v)} />
            <EffectSlider label="Blur" value={effects.blur} min={0} max={20} onChange={(v) => onEffectChange('blur', v)} />
            <button
              type="button"
              onClick={() => {
                onEffectChange('brightness', 0)
                onEffectChange('contrast', 0)
                onEffectChange('saturation', 0)
                onEffectChange('blur', 0)
              }}
              className="w-full rounded-xl bg-[var(--color-watashi-surface-card)] py-2 text-xs font-bold text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)] hover:bg-[var(--color-watashi-surface-high)]"
            >
              Reset effects
            </button>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-[var(--color-watashi-text-soft)]">Add text overlay</p>

            <div className="space-y-3">
              <textarea
                value={textDraft.text}
                onChange={(e) => setTextDraft((d) => ({ ...d, text: e.target.value }))}
                className="w-full resize-none rounded-xl bg-[var(--color-watashi-surface-card)] p-3 text-sm ring-1 ring-[var(--color-watashi-border)] outline-none focus:ring-[var(--color-watashi-indigo)]"
                rows={3}
                placeholder="Enter overlay text…"
              />

              <label className="block text-xs font-semibold text-[var(--color-watashi-text)]">
                Font style
                <select
                  value={textDraft.fontFamily}
                  onChange={(e) => setTextDraft((d) => ({ ...d, fontFamily: e.target.value as TextOverlay['fontFamily'] }))}
                  className="mt-1 w-full rounded-xl bg-[var(--color-watashi-surface-card)] p-2 text-xs ring-1 ring-[var(--color-watashi-border)] outline-none"
                >
                  <option value="sans-serif">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </label>

              <label className="block text-xs font-semibold text-[var(--color-watashi-text)]">
                Size: {textDraft.fontSize}px
                <input
                  type="range"
                  min={16}
                  max={96}
                  value={textDraft.fontSize}
                  onChange={(e) => setTextDraft((d) => ({ ...d, fontSize: Number(e.target.value) }))}
                  className="mt-1 w-full accent-[var(--color-watashi-indigo)]"
                />
              </label>

              <div className="flex items-center gap-3">
                <label className="block flex-1 text-xs font-semibold text-[var(--color-watashi-text)]">
                  Color
                  <input
                    type="color"
                    value={textDraft.color}
                    onChange={(e) => setTextDraft((d) => ({ ...d, color: e.target.value }))}
                    className="mt-1 h-8 w-full rounded-lg cursor-pointer"
                  />
                </label>
                <label className="block text-xs font-semibold text-[var(--color-watashi-text)]">
                  Position
                  <select
                    value={textDraft.position}
                    onChange={(e) => setTextDraft((d) => ({ ...d, position: e.target.value as TextOverlay['position'] }))}
                    className="mt-1 w-full rounded-xl bg-[var(--color-watashi-surface-card)] p-2 text-xs ring-1 ring-[var(--color-watashi-border)] outline-none"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddText}
              className="w-full rounded-xl bg-[var(--color-watashi-indigo)] py-2.5 text-sm font-bold text-white"
            >
              Add to canvas
            </button>

            {textOverlays.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wide text-[var(--color-watashi-text-soft)]">Added overlays</p>
                {textOverlays.map((t) => (
                  <div key={t.id} className="rounded-xl bg-[var(--color-watashi-surface-card)] p-2.5 text-xs ring-1 ring-[var(--color-watashi-border)]">
                    <p className="truncate font-semibold text-[var(--color-watashi-text-strong)]">{t.text}</p>
                    <p className="text-[var(--color-watashi-text-soft)]">{t.startSeconds}s – {t.endSeconds}s · {t.position}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-[var(--color-watashi-text-soft)]">Add image overlay</p>
            <div
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--color-watashi-border)] px-4 py-8 text-center hover:border-[var(--color-watashi-indigo)]/60"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImageSelect(e.dataTransfer.files) }}
            >
              <ImagePlus className="h-8 w-8 text-[var(--color-watashi-text-soft)]" />
              <p className="text-xs font-semibold text-[var(--color-watashi-text)]">PNG, SVG, JPG</p>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="rounded-xl bg-[var(--color-watashi-indigo)] px-4 py-2 text-xs font-bold text-white"
              >
                Browse image
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e.target.files)} />
            </div>
            {imageOverlays.length > 0 && (
              <div className="space-y-2">
                {imageOverlays.map((img) => (
                  <div key={img.id} className="flex items-center gap-2 rounded-xl bg-[var(--color-watashi-surface-card)] p-2.5 text-xs ring-1 ring-[var(--color-watashi-border)]">
                    {img.objectUrl && <img src={img.objectUrl} alt={img.label} className="h-8 w-8 rounded-lg object-cover" />}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--color-watashi-text-strong)]">{img.label}</p>
                      <p className="text-[var(--color-watashi-text-soft)]">{img.position} · {img.startSeconds}s</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
