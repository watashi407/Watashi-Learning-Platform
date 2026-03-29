import { Film, ImagePlus, Music2, Sliders, Type, Upload, Video } from 'lucide-react'
import { useRef, useState } from 'react'
import type {
  AudioLibraryAsset,
  ImageLibraryAsset,
  ImageOverlay,
  TextOverlay,
  UploadedVideoAsset,
  VideoEffects,
  VideoLibraryAsset,
} from '../types/video-project.types'
import { cx } from '../../../shared/ui/workspace'

type LeftTab = 'media' | 'effects' | 'text' | 'images'

const tabs: Array<{ id: LeftTab; icon: typeof Video; label: string }> = [
  { id: 'media', icon: Film, label: 'Media' },
  { id: 'effects', icon: Sliders, label: 'Effects' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'images', icon: ImagePlus, label: 'Images' },
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
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[var(--color-watashi-text-strong)]">{label}</span>
        <span className="rounded-md bg-[var(--color-watashi-surface-low)] px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-[var(--color-watashi-text-soft)]">
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-watashi-surface-high)]">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-watashi-indigo)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        style={{ position: 'relative', marginTop: -14 }}
      />
    </div>
  )
}

function FileRow({
  icon: Icon,
  iconBg,
  iconColor,
  name,
  meta,
  draggable: isDraggable,
  onDragStart,
}: {
  icon: typeof Film
  iconBg: string
  iconColor: string
  name: string
  meta: string
  draggable?: boolean
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      className={cx(
        'group flex items-center gap-2.5 rounded-lg p-2 ring-1 ring-[var(--color-watashi-border)] transition-all',
        isDraggable
          ? 'cursor-grab bg-[var(--color-watashi-surface-card)] hover:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_25%,var(--color-watashi-border))] active:cursor-grabbing'
          : 'bg-[var(--color-watashi-surface-card)]',
      )}
    >
      <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', iconBg)}>
        <Icon className={cx('h-3.5 w-3.5', iconColor)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-[var(--color-watashi-text-strong)]">{name}</p>
        <p className="text-[10px] text-[var(--color-watashi-text-soft)]">{meta}</p>
      </div>
    </div>
  )
}

type EditorLeftPanelProps = {
  uploadedAsset: UploadedVideoAsset | null
  uploadErrors: string[]
  audioAssets: AudioLibraryAsset[]
  videoAssets: VideoLibraryAsset[]
  imageAssets: ImageLibraryAsset[]
  audioUploadError: string | null
  isInspecting: boolean
  effects: VideoEffects
  textOverlays: TextOverlay[]
  imageOverlays: ImageOverlay[]
  currentTime: number
  totalDuration: number
  onStageVideoFile: (file: File) => void
  onStageAudioFile: (file: File) => void
  onStageImageFile: (file: File) => void
  onEffectChange: <K extends keyof VideoEffects>(field: K, value: VideoEffects[K]) => void
  onAddText: (overlay: TextOverlay) => void
  onAddImage: (overlay: ImageOverlay) => void
}

export function EditorLeftPanel({
  uploadedAsset,
  uploadErrors,
  audioAssets,
  videoAssets,
  imageAssets,
  audioUploadError,
  isInspecting,
  effects,
  textOverlays,
  imageOverlays,
  currentTime,
  totalDuration,
  onStageVideoFile,
  onStageAudioFile,
  onStageImageFile,
  onEffectChange,
  onAddText,
  onAddImage: _onAddImage,
}: EditorLeftPanelProps) {
  const [activeTab, setActiveTab] = useState<LeftTab>('media')
  const [isDragOver, setIsDragOver] = useState(false)
  const [textDraft, setTextDraft] = useState({
    text: 'Add title here',
    fontFamily: 'sans-serif' as TextOverlay['fontFamily'],
    fontSize: 32,
    color: '#ffffff',
    bgColor: null as string | null,
    position: 'bottom' as TextOverlay['position'],
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(files: FileList | null) {
    if (!files?.[0]) return
    const file = files[0]
    if (file.type.startsWith('audio/')) {
      onStageAudioFile(file)
      return
    }
    onStageVideoFile(file)
  }

  function handleImageSelect(files: FileList | null) {
    if (!files?.[0]) return
    onStageImageFile(files[0])
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

  const hasFiles = !!(uploadedAsset || audioAssets.length || videoAssets.length)

  return (
    <div className="flex flex-col border-r border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)]">
      {/* Tab bar — icon only, tooltip on hover */}
      <div className="flex border-b border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)]">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* ── MEDIA TAB ── */}
        {activeTab === 'media' && (
          <div className="space-y-3">
            {/* Upload zone */}
            <div
              className={cx(
                'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-3 py-5 text-center transition-all',
                isDragOver
                  ? 'border-[var(--color-watashi-indigo)] bg-[color-mix(in_oklab,var(--color-watashi-indigo)_5%,var(--color-watashi-surface-low))]'
                  : 'border-[var(--color-watashi-border)] hover:border-[color-mix(in_oklab,var(--color-watashi-indigo)_35%,var(--color-watashi-border))] hover:bg-[var(--color-watashi-surface-low)]',
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files) }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-watashi-surface-low)] ring-1 ring-[var(--color-watashi-border)]">
                <Upload className="h-4 w-4 text-[var(--color-watashi-text-soft)]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[var(--color-watashi-text-strong)]">Drop media here</p>
                <p className="mt-0.5 text-[10px] text-[var(--color-watashi-text-soft)]">MP4 · MOV · WebM · MP3 · WAV</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isInspecting}
                className="rounded-lg bg-[var(--color-watashi-indigo)] px-4 py-1.5 text-[11px] font-bold text-white shadow-[0_2px_8px_-2px_color-mix(in_oklab,var(--color-watashi-indigo)_40%,transparent)] transition-all active:scale-[0.97] disabled:opacity-60"
              >
                {isInspecting ? 'Uploading…' : 'Browse files'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {/* Project files */}
            {hasFiles && (
              <div className="space-y-1.5">
                <p className="px-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Project Files</p>

                {uploadedAsset && (
                  <FileRow
                    icon={Video}
                    iconBg="bg-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,var(--color-watashi-surface-low))]"
                    iconColor="text-[var(--color-watashi-indigo)]"
                    name={uploadedAsset.fileName}
                    meta={`${Math.round(uploadedAsset.durationSeconds / 60)} min · Video`}
                  />
                )}

                {audioAssets.map((asset) => (
                  <FileRow
                    key={asset.id}
                    icon={Music2}
                    iconBg="bg-[color-mix(in_oklab,var(--color-watashi-emerald)_10%,var(--color-watashi-surface-low))]"
                    iconColor="text-[var(--color-watashi-emerald)]"
                    name={asset.fileName}
                    meta={`${Math.round(asset.durationSeconds)}s · Audio`}
                    draggable
                    onDragStart={(event) => {
                      const payload = JSON.stringify({ id: asset.id, label: asset.fileName, objectUrl: asset.objectUrl, durationSeconds: asset.durationSeconds })
                      event.dataTransfer.setData('application/watashi-audio-asset', payload)
                      event.dataTransfer.setData('text/plain', payload)
                      event.dataTransfer.effectAllowed = 'copy'
                    }}
                  />
                ))}

                {videoAssets.map((asset) => (
                  <FileRow
                    key={asset.id}
                    icon={Film}
                    iconBg="bg-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,var(--color-watashi-surface-low))]"
                    iconColor="text-[var(--color-watashi-indigo)]"
                    name={asset.fileName}
                    meta={`${Math.round(asset.durationSeconds)}s · Video`}
                    draggable
                    onDragStart={(event) => {
                      const payload = JSON.stringify({ id: asset.id, label: asset.fileName, objectUrl: asset.objectUrl, durationSeconds: asset.durationSeconds })
                      event.dataTransfer.setData('application/watashi-video-asset', payload)
                      event.dataTransfer.setData('text/plain', payload)
                      event.dataTransfer.effectAllowed = 'copy'
                    }}
                  />
                ))}

                {imageOverlays.length > 0 && (
                  <>
                    <p className="px-0.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Overlays</p>
                    {imageOverlays.map((img) => (
                      <div key={img.id} className="flex items-center gap-2 rounded-lg bg-[var(--color-watashi-surface-low)] p-2 ring-1 ring-[var(--color-watashi-border)]">
                        {img.objectUrl && <img src={img.objectUrl} alt={img.label} className="h-7 w-7 rounded-md object-cover" />}
                        <span className="flex-1 truncate text-[11px] font-semibold text-[var(--color-watashi-text)]">{img.label}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Errors */}
            {(audioUploadError || uploadErrors.length > 0) && (
              <div className="space-y-1 rounded-lg bg-[color-mix(in_oklab,var(--color-watashi-ember)_8%,var(--color-watashi-surface-card))] px-2.5 py-2 ring-1 ring-[color-mix(in_oklab,var(--color-watashi-ember)_20%,var(--color-watashi-border))]">
                {audioUploadError && <p className="text-[11px] font-semibold text-[var(--color-watashi-ember)]">{audioUploadError}</p>}
                {uploadErrors.map((error) => (
                  <p key={error} className="text-[11px] font-semibold text-[var(--color-watashi-ember)]">{error}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EFFECTS TAB ── */}
        {activeTab === 'effects' && (
          <div className="space-y-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Adjustments</p>
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
              className="w-full rounded-lg bg-[var(--color-watashi-surface-low)] py-2 text-[11px] font-bold text-[var(--color-watashi-text)] ring-1 ring-[var(--color-watashi-border)] transition-colors hover:bg-[var(--color-watashi-surface-high)]"
            >
              Reset all
            </button>
          </div>
        )}

        {/* ── TEXT TAB ── */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Text overlay</p>

            <textarea
              value={textDraft.text}
              onChange={(e) => setTextDraft((d) => ({ ...d, text: e.target.value }))}
              className="w-full resize-none rounded-lg bg-[var(--color-watashi-surface-low)] p-2.5 text-[12px] text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none transition-shadow focus:ring-[var(--color-watashi-indigo)]"
              rows={2}
              placeholder="Enter overlay text…"
            />

            <label className="block text-[11px] font-semibold text-[var(--color-watashi-text)]">
              Font family
              <select
                value={textDraft.fontFamily}
                onChange={(e) => setTextDraft((d) => ({ ...d, fontFamily: e.target.value as TextOverlay['fontFamily'] }))}
                className="mt-1 w-full rounded-lg bg-[var(--color-watashi-surface-low)] p-1.5 text-[11px] text-[var(--color-watashi-text-strong)] ring-1 ring-[var(--color-watashi-border)] outline-none focus:ring-[var(--color-watashi-indigo)]"
              >
                <option value="sans-serif">Sans-serif</option>
                <option value="serif">Serif</option>
                <option value="mono">Monospace</option>
              </select>
            </label>

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-[var(--color-watashi-text)]">
                <span>Size</span>
                <span className="font-mono text-[var(--color-watashi-text-soft)]">{textDraft.fontSize}px</span>
              </div>
              <input
                type="range"
                min={16}
                max={96}
                value={textDraft.fontSize}
                onChange={(e) => setTextDraft((d) => ({ ...d, fontSize: Number(e.target.value) }))}
                className="w-full accent-[var(--color-watashi-indigo)]"
              />
            </div>

            <div className="flex items-end gap-2">
              <label className="flex-1 text-[11px] font-semibold text-[var(--color-watashi-text)]">
                Color
                <input
                  type="color"
                  value={textDraft.color}
                  onChange={(e) => setTextDraft((d) => ({ ...d, color: e.target.value }))}
                  className="mt-1 h-7 w-full cursor-pointer rounded-md border border-[var(--color-watashi-border)]"
                />
              </label>
              <label className="flex-1 text-[11px] font-semibold text-[var(--color-watashi-text)]">
                Position
                <select
                  value={textDraft.position}
                  onChange={(e) => setTextDraft((d) => ({ ...d, position: e.target.value as TextOverlay['position'] }))}
                  className="mt-1 w-full rounded-lg bg-[var(--color-watashi-surface-low)] p-1.5 text-[11px] ring-1 ring-[var(--color-watashi-border)] outline-none"
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={handleAddText}
              className="w-full rounded-lg bg-[var(--color-watashi-indigo)] py-2 text-[11px] font-bold text-white shadow-[0_2px_8px_-2px_color-mix(in_oklab,var(--color-watashi-indigo)_40%,transparent)] transition-all active:scale-[0.97]"
            >
              Add to canvas
            </button>

            {textOverlays.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Active overlays</p>
                {textOverlays.map((t) => (
                  <div key={t.id} className="rounded-lg bg-[var(--color-watashi-surface-low)] p-2 ring-1 ring-[var(--color-watashi-border)]">
                    <p className="truncate text-[11px] font-semibold text-[var(--color-watashi-text-strong)]">{t.text}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--color-watashi-text-soft)]">{t.startSeconds}s – {t.endSeconds}s · {t.position}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── IMAGES TAB ── */}
        {activeTab === 'images' && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Image overlay</p>
            <div
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-watashi-border)] px-3 py-5 text-center transition-colors hover:border-[color-mix(in_oklab,var(--color-watashi-indigo)_35%,var(--color-watashi-border))] hover:bg-[var(--color-watashi-surface-low)]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImageSelect(e.dataTransfer.files) }}
            >
              <ImagePlus className="h-6 w-6 text-[var(--color-watashi-text-soft)]" />
              <p className="text-[11px] font-semibold text-[var(--color-watashi-text-strong)]">PNG · SVG · JPG</p>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="rounded-lg bg-[var(--color-watashi-indigo)] px-4 py-1.5 text-[11px] font-bold text-white transition-all active:scale-[0.97]"
              >
                Browse
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e.target.files)} />
            </div>

            {imageAssets.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Imported</p>
                {imageAssets.map((asset) => (
                  <div
                    key={asset.id}
                    draggable
                    onDragStart={(event) => {
                      const payload = JSON.stringify({ id: asset.id, label: asset.fileName, objectUrl: asset.objectUrl })
                      event.dataTransfer.setData('application/watashi-image-asset', payload)
                      event.dataTransfer.setData('text/plain', payload)
                      event.dataTransfer.effectAllowed = 'copy'
                    }}
                    className="flex cursor-grab items-center gap-2 rounded-lg bg-[var(--color-watashi-surface-low)] p-2 ring-1 ring-[var(--color-watashi-border)] transition-all hover:ring-[color-mix(in_oklab,var(--color-watashi-indigo)_28%,var(--color-watashi-border))] active:cursor-grabbing"
                  >
                    <img src={asset.objectUrl} alt={asset.fileName} className="h-8 w-8 rounded-md object-cover ring-1 ring-[var(--color-watashi-border)]" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-[var(--color-watashi-text-strong)]">{asset.fileName}</p>
                      <p className="text-[10px] text-[var(--color-watashi-text-soft)]">Drag to track</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {imageOverlays.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">On canvas</p>
                {imageOverlays.map((img) => (
                  <div key={img.id} className="flex items-center gap-2 rounded-lg bg-[var(--color-watashi-surface-low)] p-2 ring-1 ring-[var(--color-watashi-border)]">
                    {img.objectUrl && <img src={img.objectUrl} alt={img.label} className="h-7 w-7 rounded-md object-cover" />}
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-[var(--color-watashi-text-strong)]">{img.label}</p>
                      <p className="text-[10px] text-[var(--color-watashi-text-soft)]">{img.position} · {img.startSeconds}s</p>
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
