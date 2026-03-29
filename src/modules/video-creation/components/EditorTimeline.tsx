import { Captions, Check, ChevronDown, Film, Image, Mic, Minus, Pencil, Plus, Scissors, Trash2, Type, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  ImageOverlay,
  SubtitleCue,
  TextOverlay,
  TimelineAudioClip,
  TimelineVideoClip,
  VideoSegment,
} from '../types/video-project.types'
import {
  clampPct,
  formatTimeLabel,
  parseAudioAssetTransfer,
  parseImageAssetTransfer,
  parseTimestampLabel,
  parseVideoAssetTransfer,
} from '../services/editorHelpers'
import { cx } from '../../../shared/ui/workspace'

// ── Extra layer types (exported for VideoCreationPage) ────────────────────────

export type ExtraLayerClip = {
  id: string
  label: string
  startSeconds: number
  endSeconds: number
  // video / audio
  objectUrl?: string
  durationSeconds?: number
  assetId?: string
  // text overlay fields
  text?: string
  position?: 'top' | 'center' | 'bottom'
  fontFamily?: 'sans-serif' | 'serif' | 'mono'
  fontSize?: number
  color?: string
  bgColor?: string | null
  x?: number
  y?: number
}

export type ExtraLayer = {
  id: string
  type: 'video' | 'audio' | 'text'
  label: string
  clips: ExtraLayerClip[]
}

// ── Fixed track definitions ───────────────────────────────────────────────────

type TrackDef = {
  id: string
  icon: typeof Film
  color: string
  borderColor: string
  droppable?: boolean
  trimmable?: boolean
}

const TRACKS: TrackDef[] = [
  { id: 'video',  icon: Film,     color: 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_80%,white)]',  borderColor: 'ring-[color-mix(in_oklab,var(--color-watashi-indigo)_50%,transparent)]', droppable: true, trimmable: true },
  { id: 'audio',  icon: Mic,      color: 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_80%,white)]', borderColor: 'ring-[color-mix(in_oklab,var(--color-watashi-emerald)_50%,transparent)]', droppable: true, trimmable: true },
  { id: 'text',   icon: Type,     color: 'bg-amber-400',  borderColor: 'ring-amber-300/60',  trimmable: true },
  { id: 'images', icon: Image,    color: 'bg-sky-400',    borderColor: 'ring-sky-300/60',    droppable: true, trimmable: true },
  { id: 'subs',   icon: Captions, color: 'bg-pink-400',   borderColor: 'ring-pink-300/60' },
]

// Derive the same visual style from the base track type for extra layers
const EXTRA_LAYER_STYLES: Record<ExtraLayer['type'], Pick<TrackDef, 'icon' | 'color' | 'borderColor' | 'trimmable'>> = {
  video:  { icon: Film,  color: 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_80%,white)]',  borderColor: 'ring-[color-mix(in_oklab,var(--color-watashi-indigo)_50%,transparent)]',  trimmable: true },
  audio:  { icon: Mic,   color: 'bg-[color-mix(in_oklab,var(--color-watashi-emerald)_80%,white)]', borderColor: 'ring-[color-mix(in_oklab,var(--color-watashi-emerald)_50%,transparent)]', trimmable: true },
  text:   { icon: Type,  color: 'bg-amber-400',  borderColor: 'ring-amber-300/60',  trimmable: true },
}

// Maps fixed track IDs to their compatible extra-layer type for cross-layer drag
const FIXED_TRACK_TYPE: Partial<Record<string, ExtraLayer['type']>> = {
  video: 'video',
  audio: 'audio',
  text: 'text',
}

// ── Internal types ────────────────────────────────────────────────────────────

type Block = {
  id: string
  left: number
  width: number
  label: string
  startSeconds: number
  endSeconds: number
}

type Selection = { trackId: string; blockId: string; block: Block }

type DragState = {
  trackId: string; blockId: string
  originalStart: number; originalEnd: number
  startX: number; startY: number; laneWidth: number; moved: boolean
  targetTrackId: string
  extraLayersSnapshot: ExtraLayer[]
  finalStart: number; finalEnd: number
}

type TrimState = {
  trackId: string; blockId: string
  field: 'startSeconds' | 'endSeconds'
  originalValue: number; startX: number; laneWidth: number
}

type DroppedAudioAsset = NonNullable<ReturnType<typeof parseAudioAssetTransfer>>
type DroppedVideoAsset = NonNullable<ReturnType<typeof parseVideoAssetTransfer>>
type DroppedImageAsset = NonNullable<ReturnType<typeof parseImageAssetTransfer>>

// ── Props ─────────────────────────────────────────────────────────────────────

export type BlockPatch = { startSeconds?: number; endSeconds?: number; label?: string }

type EditorTimelineProps = {
  totalDuration: number
  currentTime: number
  segments: VideoSegment[]
  videoTimelineClips: TimelineVideoClip[]
  subtitleCues: SubtitleCue[]
  textOverlays: TextOverlay[]
  imageOverlays: ImageOverlay[]
  audioTimelineClips: TimelineAudioClip[]
  extraLayers: ExtraLayer[]
  onSeek: (seconds: number) => void
  onBlockChange: (trackId: string, blockId: string, patch: BlockPatch) => void
  onDeleteBlock: (trackId: string, blockId: string) => void
  onCutAtPlayhead: () => void
  onRemoveLayer: (layerId: string) => void
  onReorderLayers: (newOrder: ExtraLayer[]) => void
  onMoveBlock?: (fromTrackId: string, toTrackId: string, blockId: string, startSeconds: number, endSeconds: number) => void
  onDropVideoAsset: (asset: DroppedVideoAsset, startSeconds: number) => void
  onDropAudioAsset: (asset: DroppedAudioAsset, startSeconds: number) => void
  onDropImageAsset: (asset: DroppedImageAsset, startSeconds: number) => void
  onRequestAddVideo: () => void
  onRequestAddAudio: () => void
  onAddText: (text: string, position: 'top' | 'center' | 'bottom') => void
}

// ── Helper: convert any clip array to Block[] ─────────────────────────────────

function toBlocks(
  clips: Array<{ id: string; startSeconds: number; endSeconds: number }>,
  getLabel: (c: { id: string; startSeconds: number; endSeconds: number }) => string,
  dur: number,
): Block[] {
  return clips.map((c) => ({
    id: c.id,
    left: clampPct((c.startSeconds / dur) * 100),
    width: clampPct(((c.endSeconds - c.startSeconds) / dur) * 100),
    label: getLabel(c),
    startSeconds: c.startSeconds,
    endSeconds: c.endSeconds,
  }))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditorTimeline({
  totalDuration,
  currentTime,
  segments,
  videoTimelineClips,
  subtitleCues,
  textOverlays,
  imageOverlays,
  audioTimelineClips,
  extraLayers,
  onSeek,
  onBlockChange,
  onDeleteBlock,
  onCutAtPlayhead,
  onRemoveLayer,
  onReorderLayers,
  onMoveBlock,
  onDropVideoAsset,
  onDropAudioAsset,
  onDropImageAsset,
  onRequestAddVideo,
  onRequestAddAudio,
  onAddText,
}: EditorTimelineProps) {
  const rulerRef = useRef<HTMLDivElement>(null)
  const tracksContainerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const trimRef = useRef<TrimState | null>(null)
  const trackSortRef = useRef<{
    trackId: string; origIndex: number; startY: number
    orderSnapshot: string[]; extraLayersSnapshot: ExtraLayer[]; currentIds: string[]
  } | null>(null)

  const [zoom, setZoom] = useState(1)
  const [trackOrder, setTrackOrder] = useState<string[]>(() => TRACKS.map((t) => t.id))
  const [sortingTrackId, setSortingTrackId] = useState<string | null>(null)
  const [sortPreviewIds, setSortPreviewIds] = useState<string[] | null>(null)
  const [hoveredDropTrackId, setHoveredDropTrackId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Selection | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)
  const [textForm, setTextForm] = useState<{ text: string; position: 'top' | 'center' | 'bottom' } | null>(null)

  const dur = Math.max(1, totalDuration)
  const playheadPct = clampPct((currentTime / dur) * 100)

  // ── Block map (fixed tracks + extra layers) ───────────────────────────────

  const blocksByTrack = useMemo<Record<string, Block[]>>(() => {
    const videoBlocks = toBlocks(
      [...segments.map(s => ({ ...s, id: s.id, startSeconds: s.startSeconds, endSeconds: s.endSeconds })), ...videoTimelineClips],
      (c) => 'title' in c ? (c as VideoSegment).title : (c as TimelineVideoClip).label,
      dur,
    )

    const audioBlocks: Block[] = audioTimelineClips.length > 0
      ? toBlocks(audioTimelineClips, (c) => (c as TimelineAudioClip).label, dur)
      : segments.length > 0
        ? [{ id: 'audio-main', left: 0, width: clampPct((segments[segments.length - 1].endSeconds / dur) * 100), label: 'Source audio', startSeconds: 0, endSeconds: segments[segments.length - 1].endSeconds }]
        : []

    const textBlocks  = toBlocks(textOverlays,  (c) => (c as TextOverlay).text.slice(0, 30), dur)
    const imageBlocks = toBlocks(imageOverlays,  (c) => (c as ImageOverlay).label.slice(0, 20), dur)
    const subsBlocks  = toBlocks(
      subtitleCues.map(cue => ({ id: cue.id, startSeconds: parseTimestampLabel(cue.startLabel), endSeconds: parseTimestampLabel(cue.endLabel), text: cue.text })),
      (c) => ((c as unknown) as { text: string }).text.slice(0, 24),
      dur,
    )

    const result: Record<string, Block[]> = { video: videoBlocks, audio: audioBlocks, text: textBlocks, images: imageBlocks, subs: subsBlocks }

    // Extra dynamic layers
    for (const layer of extraLayers) {
      result[layer.id] = toBlocks(layer.clips, (c) => (c as ExtraLayerClip).label, dur)
    }

    return result
  }, [dur, segments, videoTimelineClips, audioTimelineClips, textOverlays, imageOverlays, subtitleCues, extraLayers])

  // Sync trackOrder when extra layers are added/removed
  useEffect(() => {
    setTrackOrder((prev) => {
      const fixedIds = new Set(TRACKS.map((t) => t.id))
      const extraIds = new Set(extraLayers.map((l) => l.id))
      const filtered = prev.filter((id) => fixedIds.has(id) || extraIds.has(id))
      const existing = new Set(filtered)
      const newExtras = extraLayers.filter((l) => !existing.has(l.id)).map((l) => l.id)
      if (filtered.length === prev.length && newExtras.length === 0) return prev
      return [...filtered, ...newExtras]
    })
  }, [extraLayers])

  // ── Derived selection state ───────────────────────────────────────────────

  const liveSelectedBlock = selected
    ? (blocksByTrack[selected.trackId] ?? []).find((b) => b.id === selected.blockId) ?? null
    : null

  const isPlayheadInSelected =
    liveSelectedBlock !== null &&
    currentTime > liveSelectedBlock.startSeconds &&
    currentTime < liveSelectedBlock.endSeconds

  // ── Helpers ───────────────────────────────────────────────────────────────

  function selectBlock(trackId: string, block: Block) {
    setSelected({ trackId, blockId: block.id, block })
    setEditingLabel(block.label)
  }

  function clearSelection() {
    setSelected(null)
    setEditingLabel('')
  }

  function handleRulerClick(e: React.MouseEvent<HTMLDivElement>) {
    const ruler = rulerRef.current
    if (!ruler) return
    const rect = ruler.getBoundingClientRect()
    const laneLeft = rect.left + 40
    const laneWidth = rect.width - 40
    const pct = Math.max(0, Math.min(1, (e.clientX - laneLeft) / laneWidth))
    onSeek(pct * dur)
  }

  function getTrackAtY(clientY: number): string | null {
    const container = tracksContainerRef.current
    if (!container) return null
    const rows = container.querySelectorAll<HTMLElement>('[data-track-id]')
    for (const row of rows) {
      const rect = row.getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) return row.dataset.trackId ?? null
    }
    return null
  }

  function startBlockInteraction(e: React.MouseEvent, trackId: string, block: Block, laneEl: HTMLElement) {
    if ((e.target as HTMLElement).dataset.handle) return
    e.preventDefault()
    e.stopPropagation()

    const laneRect = laneEl.getBoundingClientRect()
    dragRef.current = {
      trackId, blockId: block.id,
      originalStart: block.startSeconds, originalEnd: block.endSeconds,
      startX: e.clientX, startY: e.clientY, laneWidth: laneRect.width, moved: false,
      targetTrackId: trackId, extraLayersSnapshot: extraLayers,
      finalStart: block.startSeconds, finalEnd: block.endSeconds,
    }

    function onMove(ev: MouseEvent) {
      const d = dragRef.current
      if (!d) return
      const dx = ev.clientX - d.startX
      const dy = ev.clientY - d.startY
      if (!d.moved && Math.hypot(dx, dy) < 4) return
      d.moved = true

      const blockDuration = d.originalEnd - d.originalStart
      const newStart = Math.max(0, Math.min(dur - blockDuration, d.originalStart + (dx / d.laneWidth) * dur))
      d.finalStart = newStart
      d.finalEnd = newStart + blockDuration

      // Always update position in the original track during the drag
      onBlockChange(d.trackId, d.blockId, { startSeconds: newStart, endSeconds: newStart + blockDuration })

      // Detect compatible cross-layer target (same extra layer type only)
      const hitId = getTrackAtY(ev.clientY)
      if (hitId && hitId !== d.trackId) {
        const fromType = FIXED_TRACK_TYPE[d.trackId] ?? d.extraLayersSnapshot.find((l) => l.id === d.trackId)?.type
        const toType = FIXED_TRACK_TYPE[hitId] ?? d.extraLayersSnapshot.find((l) => l.id === hitId)?.type
        if (fromType && toType && fromType === toType) {
          d.targetTrackId = hitId
          setHoveredDropTrackId(hitId)
          return
        }
      }
      d.targetTrackId = d.trackId
      setHoveredDropTrackId(null)
    }

    function onUp() {
      const d = dragRef.current
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setHoveredDropTrackId(null)
      if (!d) return
      if (!d.moved) { selectBlock(trackId, block); return }
      // Move to target layer if it changed
      if (d.targetTrackId !== d.trackId) {
        onMoveBlock?.(d.trackId, d.targetTrackId, d.blockId, d.finalStart, d.finalEnd)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function startTrim(e: React.MouseEvent, trackId: string, block: Block, field: 'startSeconds' | 'endSeconds', laneEl: HTMLElement) {
    e.preventDefault()
    e.stopPropagation()

    const laneRect = laneEl.getBoundingClientRect()
    trimRef.current = { trackId, blockId: block.id, field, originalValue: field === 'startSeconds' ? block.startSeconds : block.endSeconds, startX: e.clientX, laneWidth: laneRect.width }

    function onMove(ev: MouseEvent) {
      const t = trimRef.current
      if (!t) return
      const deltaSeconds = ((ev.clientX - t.startX) / t.laneWidth) * dur
      onBlockChange(t.trackId, t.blockId, { [t.field]: t.originalValue + deltaSeconds })
    }

    function onUp() {
      trimRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function getLaneStartSeconds(event: React.DragEvent<HTMLDivElement>) {
    const lane = event.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (event.clientX - lane.left) / lane.width))
    return pct * dur
  }

  function handleDelete() {
    if (!selected) return
    onDeleteBlock(selected.trackId, selected.blockId)
    clearSelection()
  }

  function commitLabelEdit() {
    if (!selected || !editingLabel.trim()) return
    onBlockChange(selected.trackId, selected.blockId, { label: editingLabel.trim() })
  }

  // Unified sort — works for both fixed tracks and extra layers
  function startTrackSort(e: React.MouseEvent, trackId: string) {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    const origIndex = trackOrder.indexOf(trackId)
    if (origIndex === -1) return
    trackSortRef.current = {
      trackId, origIndex, startY: e.clientY,
      orderSnapshot: trackOrder, extraLayersSnapshot: extraLayers,
      currentIds: [...trackOrder],
    }
    setSortingTrackId(trackId)

    function onMove(ev: MouseEvent) {
      const d = trackSortRef.current
      if (!d) return
      const dy = ev.clientY - d.startY
      const delta = Math.round(dy / 36) // h-9 = 36px per row
      const newIndex = Math.max(0, Math.min(d.orderSnapshot.length - 1, d.origIndex + delta))
      const next = [...d.orderSnapshot]
      next.splice(d.origIndex, 1)
      next.splice(newIndex, 0, d.trackId)
      d.currentIds = next
      setSortPreviewIds([...next])
    }

    function onUp() {
      const d = trackSortRef.current
      trackSortRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setSortingTrackId(null)
      setSortPreviewIds(null)
      if (d) {
        setTrackOrder(d.currentIds)
        // Sync parent with the new extra-layer order derived from unified order
        const newExtraOrder = d.currentIds
          .filter((id) => d.extraLayersSnapshot.some((l) => l.id === id))
          .map((id) => d.extraLayersSnapshot.find((l) => l.id === id)!)
        onReorderLayers(newExtraOrder)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Close add-layer menu on outside click
  useEffect(() => {
    if (!addMenuOpen) return
    function handleOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [addMenuOpen])

  // Cleanup drag/trim/sort on unmount
  useEffect(() => () => { dragRef.current = null; trimRef.current = null; trackSortRef.current = null }, [])

  const ticks = useMemo(() => Array.from({ length: 9 }, (_, i) => (i / 8) * dur), [dur])

  // ── Shared track lane renderer ────────────────────────────────────────────

  function renderLane(
    trackId: string,
    blocks: Block[],
    color: string,
    borderColor: string,
    trimmable: boolean,
    droppable: boolean,
    onDrop?: (event: React.DragEvent<HTMLDivElement>) => void,
    isDropTarget?: boolean,
  ) {
    const hasSelection = selected !== null

    return (
      <div
        className={cx(
          'relative h-9 flex-1',
          isDropTarget
            ? 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_7%,var(--color-watashi-surface-card))]'
            : 'bg-[var(--color-watashi-surface-card)]',
        )}
        onClick={(e) => { if (e.target === e.currentTarget) clearSelection() }}
        onDragOver={(event) => { if (!droppable) return; event.preventDefault(); event.dataTransfer.dropEffect = 'copy' }}
        onDrop={onDrop}
      >
        {blocks.length === 0 && droppable && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[var(--color-watashi-text-soft)]/40">
            Drop here
          </span>
        )}

        {blocks.map((block) => {
          const isSelected = selected?.blockId === block.id && selected.trackId === trackId
          return (
            <div
              key={block.id}
              className={cx(
                'absolute top-1.5 bottom-1.5 flex items-center overflow-visible rounded-md px-2',
                'cursor-grab ring-1 transition-all active:cursor-grabbing',
                color,
                isSelected
                  ? 'ring-2 ring-white shadow-lg opacity-100'
                  : hasSelection
                    ? cx('opacity-50', borderColor)
                    : cx('opacity-90 hover:opacity-100', borderColor),
              )}
              style={{ left: `${block.left}%`, width: `${Math.max(block.width, 1)}%` }}
              title={block.label}
              onMouseDown={(e) => startBlockInteraction(e, trackId, block, e.currentTarget.parentElement as HTMLElement)}
            >
              <span className="pointer-events-none truncate text-[9px] font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
                {block.label}
              </span>

              {trimmable && (
                <>
                  <div
                    data-handle="start"
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize rounded-l-md bg-white/0 hover:bg-white/30 transition-colors"
                    onMouseDown={(e) => startTrim(e, trackId, block, 'startSeconds', e.currentTarget.parentElement!.parentElement as HTMLElement)}
                  />
                  <div
                    data-handle="end"
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize rounded-r-md bg-white/0 hover:bg-white/30 transition-colors"
                    onMouseDown={(e) => startTrim(e, trackId, block, 'endSeconds', e.currentTarget.parentElement!.parentElement as HTMLElement)}
                  />
                </>
              )}
            </div>
          )
        })}

        {/* Playhead overlay */}
        <div
          className="pointer-events-none absolute top-0 h-full w-px bg-[var(--color-watashi-indigo)]/25"
          style={{ left: `${playheadPct}%` }}
        />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col border-t border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)] select-none">

      {/* ── Toolbar ── */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-watashi-border)] px-3 py-1.5">
        <div className="flex items-center gap-1">
          {/* Cut at playhead */}
          <button
            type="button"
            onClick={onCutAtPlayhead}
            disabled={!isPlayheadInSelected}
            title={isPlayheadInSelected ? 'Cut at playhead' : 'Select a clip and position the playhead inside it to cut'}
            className={cx(
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
              isPlayheadInSelected
                ? 'text-[var(--color-watashi-indigo)] hover:bg-[color-mix(in_oklab,var(--color-watashi-indigo)_10%,var(--color-watashi-surface-low))]'
                : 'cursor-not-allowed text-[var(--color-watashi-text-soft)]/40',
            )}
          >
            <Scissors className="h-3.5 w-3.5" />
          </button>

          {/* Delete selected clip */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={!selected}
            title={selected ? 'Delete selected clip' : 'Select a clip to delete'}
            className={cx(
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
              selected
                ? 'text-[var(--color-watashi-ember)] hover:bg-[color-mix(in_oklab,var(--color-watashi-ember)_10%,var(--color-watashi-surface-low))]'
                : 'cursor-not-allowed text-[var(--color-watashi-text-soft)]/40',
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-4 w-px bg-[var(--color-watashi-border)]" />

          {/* Add Layer dropdown */}
          <div ref={addMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAddMenuOpen((o) => !o)}
              title="Add layer"
              className={cx(
                'flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-semibold transition-colors',
                addMenuOpen
                  ? 'bg-[color-mix(in_oklab,var(--color-watashi-indigo)_12%,var(--color-watashi-surface-low))] text-[var(--color-watashi-indigo)]'
                  : 'text-[var(--color-watashi-text-soft)] hover:bg-[var(--color-watashi-surface-low)] hover:text-[var(--color-watashi-text)]',
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Add layer
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {addMenuOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-card)] shadow-[0_8px_24px_-4px_rgba(0,0,0,0.15)]">
                {([
                  { icon: Film,  label: 'Video layer',  desc: 'New video track',  action: () => { onRequestAddVideo(); setAddMenuOpen(false) } },
                  { icon: Mic,   label: 'Audio layer',  desc: 'New audio track',  action: () => { onRequestAddAudio(); setAddMenuOpen(false) } },
                  { icon: Type,  label: 'Text layer',   desc: 'New text track',   action: () => { setTextForm({ text: '', position: 'center' }); setAddMenuOpen(false) } },
                ] as const).map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-watashi-surface-low)]"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--color-watashi-surface-low)]">
                        <Icon className="h-3.5 w-3.5 text-[var(--color-watashi-text-soft)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[var(--color-watashi-text-strong)]">{item.label}</p>
                        <p className="text-[10px] text-[var(--color-watashi-text-soft)]">{item.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-watashi-text-soft)]">Zoom</span>
          <button type="button" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--color-watashi-text-soft)] transition-colors hover:bg-[var(--color-watashi-surface-low)] hover:text-[var(--color-watashi-text)]">
            <Minus className="h-3 w-3" />
          </button>
          <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-[var(--color-watashi-surface-low)]">
            <div className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-watashi-indigo)]" style={{ width: `${((zoom - 0.5) / 1.5) * 100}%` }} />
          </div>
          <button type="button" onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))} className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--color-watashi-text-soft)] transition-colors hover:bg-[var(--color-watashi-surface-low)] hover:text-[var(--color-watashi-text)]">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ── Add Text form ── */}
      {textForm !== null && (
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--color-watashi-border)] bg-amber-50/40 dark:bg-[color-mix(in_oklab,theme(colors.amber.400)_4%,var(--color-watashi-surface-card))] px-3 py-1.5">
          <Type className="h-3 w-3 shrink-0 text-amber-500" />
          <input
            autoFocus
            className="min-w-0 flex-1 rounded-md bg-[var(--color-watashi-surface-card)] px-2 py-1 text-[11px] font-semibold text-[var(--color-watashi-text-strong)] outline-none ring-1 ring-[var(--color-watashi-border)] transition-shadow focus:ring-amber-400/60 placeholder:text-[var(--color-watashi-text-soft)]/50"
            placeholder="Text content…"
            value={textForm.text}
            onChange={(e) => setTextForm((f) => f && { ...f, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textForm.text.trim()) { onAddText(textForm.text.trim(), textForm.position); setTextForm(null) }
              if (e.key === 'Escape') setTextForm(null)
            }}
          />
          <select
            value={textForm.position}
            onChange={(e) => setTextForm((f) => f && { ...f, position: e.target.value as 'top' | 'center' | 'bottom' })}
            className="rounded-md bg-[var(--color-watashi-surface-card)] px-1.5 py-1 text-[11px] font-semibold text-[var(--color-watashi-text)] outline-none ring-1 ring-[var(--color-watashi-border)] transition-shadow focus:ring-amber-400/60"
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
          <button type="button" disabled={!textForm.text.trim()} onClick={() => { if (textForm.text.trim()) { onAddText(textForm.text.trim(), textForm.position); setTextForm(null) } }} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-400 text-white transition-opacity disabled:opacity-40 hover:bg-amber-500">
            <Check className="h-3 w-3" />
          </button>
          <button type="button" onClick={() => setTextForm(null)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--color-watashi-text-soft)] transition-colors hover:bg-[var(--color-watashi-surface-low)]">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ── Selected clip info bar ── */}
      {liveSelectedBlock && (
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--color-watashi-border)] bg-[color-mix(in_oklab,var(--color-watashi-indigo)_4%,var(--color-watashi-surface-card))] px-3 py-1.5">
          <Pencil className="h-3 w-3 shrink-0 text-[var(--color-watashi-indigo)]" />
          <input
            className="min-w-0 flex-1 rounded-md bg-[var(--color-watashi-surface-card)] px-2 py-1 text-[11px] font-semibold text-[var(--color-watashi-text-strong)] outline-none ring-1 ring-[var(--color-watashi-border)] transition-shadow focus:ring-[var(--color-watashi-indigo)]"
            value={editingLabel}
            onChange={(e) => setEditingLabel(e.target.value)}
            onBlur={commitLabelEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') { commitLabelEdit(); e.currentTarget.blur() } }}
            placeholder="Clip name"
            aria-label="Clip name"
          />
          <span className="shrink-0 font-mono text-[10px] text-[var(--color-watashi-text-soft)]">
            {formatTimeLabel(liveSelectedBlock.startSeconds)} – {formatTimeLabel(liveSelectedBlock.endSeconds)}
          </span>
          <button type="button" onClick={clearSelection} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[var(--color-watashi-text-soft)] transition-colors hover:bg-[var(--color-watashi-surface-low)]" aria-label="Deselect clip">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ── Ruler ── */}
      <div ref={rulerRef} className="relative flex h-6 shrink-0 cursor-pointer items-stretch border-b border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)]" onClick={handleRulerClick}>
        <div className="w-10 shrink-0 border-r border-[var(--color-watashi-border)]" />
        <div className="relative flex-1">
          {ticks.map((t) => (
            <div key={t} className="absolute top-0 flex flex-col items-center" style={{ left: `${clampPct((t / dur) * 100)}%` }}>
              <div className="h-2 w-px bg-[var(--color-watashi-border)]" />
              <span className="-translate-x-1/2 mt-0.5 text-[9px] font-mono text-[var(--color-watashi-text-soft)]">{formatTimeLabel(t)}</span>
            </div>
          ))}
          <div className="pointer-events-none absolute top-0 z-10 h-full w-0.5 bg-[var(--color-watashi-indigo)]" style={{ left: `${playheadPct}%` }}>
            <div className="absolute -top-px left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-[var(--color-watashi-indigo)]" />
          </div>
        </div>
      </div>

      {/* ── Tracks (scrollable) — unified fixed + extra, all sortable ── */}
      <div ref={tracksContainerRef} className="flex-1 overflow-y-auto">
        {(sortPreviewIds ?? trackOrder).map((trackId) => {
          const fixed = TRACKS.find((t) => t.id === trackId)
          const extra = extraLayers.find((l) => l.id === trackId)

          if (fixed) {
            const blocks = blocksByTrack[fixed.id] ?? []
            const Icon = fixed.icon
            const isThisSelected = selected?.trackId === fixed.id
            const isSorting = sortingTrackId === fixed.id

            return (
              <div
                key={fixed.id}
                data-track-id={fixed.id}
                className={cx('flex items-stretch border-b border-[var(--color-watashi-border)] transition-opacity', isSorting ? 'opacity-50' : 'opacity-100')}
              >
                <div
                  className="flex w-10 shrink-0 cursor-grab items-center justify-center border-r border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] active:cursor-grabbing"
                  onMouseDown={(e) => startTrackSort(e, fixed.id)}
                  title="Drag to reorder"
                >
                  <Icon className={cx('h-3.5 w-3.5 transition-colors', isThisSelected ? 'text-[var(--color-watashi-indigo)]' : 'text-[var(--color-watashi-text-soft)]')} />
                </div>
                {renderLane(
                  fixed.id, blocks, fixed.color, fixed.borderColor, fixed.trimmable ?? false, fixed.droppable ?? false,
                  fixed.droppable ? (event) => {
                    event.preventDefault()
                    const startSeconds = getLaneStartSeconds(event)
                    if (fixed.id === 'audio') {
                      const raw = event.dataTransfer.getData('application/watashi-audio-asset') || event.dataTransfer.getData('text/plain')
                      const payload = parseAudioAssetTransfer(raw)
                      if (payload) onDropAudioAsset(payload, startSeconds)
                    } else if (fixed.id === 'video') {
                      const raw = event.dataTransfer.getData('application/watashi-video-asset') || event.dataTransfer.getData('text/plain')
                      const payload = parseVideoAssetTransfer(raw)
                      if (payload) onDropVideoAsset(payload, startSeconds)
                    } else if (fixed.id === 'images') {
                      const raw = event.dataTransfer.getData('application/watashi-image-asset') || event.dataTransfer.getData('text/plain')
                      const payload = parseImageAssetTransfer(raw)
                      if (payload) onDropImageAsset(payload, startSeconds)
                    }
                  } : undefined,
                  hoveredDropTrackId === fixed.id,
                )}
              </div>
            )
          }

          if (extra) {
            const style = EXTRA_LAYER_STYLES[extra.type]
            const Icon = style.icon
            const blocks = blocksByTrack[extra.id] ?? []
            const isThisSelected = selected?.trackId === extra.id
            const isSorting = sortingTrackId === extra.id
            const isDropTarget = hoveredDropTrackId === extra.id

            return (
              <div
                key={extra.id}
                data-track-id={extra.id}
                className={cx('group flex items-stretch border-b border-[var(--color-watashi-border)] transition-opacity', isSorting ? 'opacity-50' : 'opacity-100')}
              >
                <div
                  className="relative flex w-10 shrink-0 cursor-grab items-center justify-center border-r border-[var(--color-watashi-border)] bg-[var(--color-watashi-surface-low)] active:cursor-grabbing"
                  onMouseDown={(e) => startTrackSort(e, extra.id)}
                  title="Drag to reorder"
                >
                  <Icon className={cx('h-3.5 w-3.5 transition-colors', isThisSelected ? 'text-[var(--color-watashi-indigo)]' : 'text-[var(--color-watashi-text-soft)]')} />
                  <button
                    type="button"
                    className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-md text-[var(--color-watashi-ember)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[color-mix(in_oklab,var(--color-watashi-ember)_12%,var(--color-watashi-surface-low))]"
                    onClick={(e) => { e.stopPropagation(); onRemoveLayer(extra.id) }}
                    title={`Remove ${extra.label}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
                {renderLane(extra.id, blocks, style.color, style.borderColor, style.trimmable ?? false, false, undefined, isDropTarget)}
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
