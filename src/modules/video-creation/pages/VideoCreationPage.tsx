import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLiveCapture } from '../hooks/useLiveCapture'
import { useVideoStudio } from '../hooks/useVideoStudio'
import { readAudioDuration, readVideoDuration } from '../services/mediaValidation'
import type {
  AudioLibraryAsset,
  ImageLibraryAsset,
  ImageOverlay,
  LiveCaptureMode,
  TextOverlay,
  TimelineAudioClip,
  TimelineVideoClip,
  VideoLibraryAsset,
} from '../types/video-project.types'
import { EditorCanvas } from '../components/EditorCanvas'
import { EditorLeftPanel } from '../components/EditorLeftPanel'
import { EditorRightPanel } from '../components/EditorRightPanel'
import { EditorTimeline } from '../components/EditorTimeline'
import type { ExtraLayer } from '../components/EditorTimeline'
import { EditorTopBar } from '../components/EditorTopBar'
import { RecordingSheet } from '../components/RecordingSheet'
import { createDefaultVideoEffects } from '../defaults'
import {
  createPreviewPlaybackWindow,
  computeTimelineDuration,
  createFallbackSourceTitle,
  isCorruptedProjectTitle,
  normalizeProjectTitle,
} from '../services/editorHelpers'

function createAudioAsset(file: File, durationSeconds: number): AudioLibraryAsset {
  return {
    id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    objectUrl: URL.createObjectURL(file),
    mimeType: file.type || 'audio/mpeg',
    sizeBytes: file.size,
    durationSeconds: Math.max(0, Math.round(durationSeconds)),
  }
}

function createVideoAsset(file: File, durationSeconds: number): VideoLibraryAsset {
  return {
    id: `video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    objectUrl: URL.createObjectURL(file),
    mimeType: file.type || 'video/mp4',
    sizeBytes: file.size,
    durationSeconds: Math.max(1, Math.round(durationSeconds)),
  }
}

function createImageAsset(file: File): ImageLibraryAsset {
  return {
    id: `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    objectUrl: URL.createObjectURL(file),
    mimeType: file.type || 'image/png',
    sizeBytes: file.size,
  }
}

export function VideoCreationPage() {
  const studio = useVideoStudio()
  const capture = useLiveCapture()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioAssetsRef = useRef<AudioLibraryAsset[]>([])
  const videoAssetsRef = useRef<VideoLibraryAsset[]>([])
  const imageAssetsRef = useRef<ImageLibraryAsset[]>([])
  const audioElementRefs = useRef<Record<string, HTMLAudioElement | null>>({})
  const activeCaptureImportIdRef = useRef<string | null>(null)
  const addVideoInputRef = useRef<HTMLInputElement | null>(null)
  const addAudioInputRef = useRef<HTMLInputElement | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [showRecording, setShowRecording] = useState(false)
  const [isUsingClip, setIsUsingClip] = useState(false)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null)
  const [mediaLibraryErrors, setMediaLibraryErrors] = useState<string[]>([])
  const [audioAssets, setAudioAssets] = useState<AudioLibraryAsset[]>([])
  const [audioTimelineClips, setAudioTimelineClips] = useState<TimelineAudioClip[]>([])
  const [videoAssets, setVideoAssets] = useState<VideoLibraryAsset[]>([])
  const [videoTimelineClips, setVideoTimelineClips] = useState<TimelineVideoClip[]>([])
  const [imageAssets, setImageAssets] = useState<ImageLibraryAsset[]>([])
  const [extraLayers, setExtraLayers] = useState<ExtraLayer[]>([])

  useEffect(() => {
    audioAssetsRef.current = audioAssets
  }, [audioAssets])

  useEffect(() => {
    videoAssetsRef.current = videoAssets
  }, [videoAssets])

  useEffect(() => {
    imageAssetsRef.current = imageAssets
  }, [imageAssets])

  useEffect(() => {
    return () => {
      for (const asset of audioAssetsRef.current) {
        URL.revokeObjectURL(asset.objectUrl)
      }
      for (const asset of videoAssetsRef.current) {
        URL.revokeObjectURL(asset.objectUrl)
      }
      for (const asset of imageAssetsRef.current) {
        URL.revokeObjectURL(asset.objectUrl)
      }
    }
  }, [])

  const totalDuration = computeTimelineDuration({
    sourceDurationSeconds: studio.uploadedAsset?.durationSeconds ?? 0,
    segmentEndSeconds: studio.segments[studio.segments.length - 1]?.endSeconds ?? 0,
    audioTimelineClips,
    videoTimelineClips,
    imageOverlays: studio.imageOverlays,
    minimumDurationSeconds: 30,
  })

  // Only overlays that have been explicitly placed in the timeline
  const placedTextOverlays = useMemo(
    () => studio.textOverlays.filter((t) => t.placed !== false),
    [studio.textOverlays],
  )

  const placedImageOverlays = useMemo(
    () => studio.imageOverlays.filter((img) => img.placed !== false),
    [studio.imageOverlays],
  )

  // Merge placed text overlays + extra text-layer clips into the canvas overlay list
  const allTextOverlays = useMemo<TextOverlay[]>(() => {
    const extraTextOverlays = extraLayers
      .filter((l) => l.type === 'text')
      .flatMap((l) =>
        l.clips.map((c) => ({
          id: c.id,
          text: c.text ?? c.label,
          fontFamily: (c.fontFamily ?? 'sans-serif') as TextOverlay['fontFamily'],
          fontSize: c.fontSize ?? 28,
          color: c.color ?? '#ffffff',
          bgColor: c.bgColor ?? null,
          position: (c.position ?? 'bottom') as TextOverlay['position'],
          startSeconds: c.startSeconds,
          endSeconds: c.endSeconds,
          x: c.x,
          y: c.y,
        })),
      )
    return [...placedTextOverlays, ...extraTextOverlays]
  }, [placedTextOverlays, extraLayers])

  const previewSourceUrl =
    studio.uploadedAsset?.proxyObjectUrl ??
    studio.uploadedAsset?.objectUrl ??
    (capture.recordedCapture ? capture.recordedCapture.objectUrl : null)

  const activeVideoTimelineClip = [...videoTimelineClips]
    .reverse()
    .find((clip) => currentTime >= clip.startSeconds && currentTime <= clip.endSeconds)

  const activePreviewSourceUrl = activeVideoTimelineClip?.objectUrl ?? previewSourceUrl
  const previewPlaybackWindow = createPreviewPlaybackWindow(currentTime, activeVideoTimelineClip ?? null)

  const subtitleJobStatus = studio.jobs.find((j) => j.id === 'subtitles')?.status ?? 'idle'

  const exportBlockedReason = !studio.uploadedAsset
    ? 'Import or capture a video before exporting.'
    : !studio.selectedBinding
      ? 'Choose a lesson or course destination before exporting.'
      : null

  function handleRecord(mode: LiveCaptureMode) {
    capture.setMode(mode)
    setShowRecording(true)
  }

  function handleSeek(seconds: number) {
    setCurrentTime(seconds)
  }

  function resetPreviewPosition() {
    setIsPreviewPlaying(false)
    setCurrentTime(0)
  }

  async function handleStageVideoFile(file: File) {
    if (!studio.uploadedAsset) {
      resetPreviewPosition()
      const result = await studio.stageFile(file, 'uploaded')
      if (result.accepted) {
        studio.setProjectTitle(normalizeProjectTitle(file, createFallbackSourceTitle('uploaded')))
      }
      setMediaLibraryErrors([])
      return
    }

    try {
      const durationSeconds = await readVideoDuration(file)
      const asset = createVideoAsset(file, durationSeconds)
      setVideoAssets((current) => [asset, ...current])
      setMediaLibraryErrors([])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'We could not read that video file.'
      setMediaLibraryErrors([message])
    }
  }

  async function handleStageAudioFile(file: File) {
    try {
      const durationSeconds = await readAudioDuration(file)
      const asset = createAudioAsset(file, durationSeconds)
      setAudioAssets((current) => [asset, ...current])
      setAudioUploadError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'We could not read that audio file.'
      setAudioUploadError(message)
    }
  }

  async function handleStageImageFile(file: File) {
    const asset = createImageAsset(file)
    setImageAssets((current) => [asset, ...current])
    setMediaLibraryErrors([])
  }

  const handleUseCapturedClip = useCallback(async () => {
    if (isUsingClip || !capture.recordedCapture) {
      return
    }

    const clip = capture.recordedCapture
    if (activeCaptureImportIdRef.current === clip.id) {
      return
    }

    try {
      activeCaptureImportIdRef.current = clip.id
      setIsUsingClip(true)
      setShowRecording(false)
      capture.resetCapture()
      resetPreviewPosition()
      studio.setProjectTitle(normalizeProjectTitle(clip.fileName, createFallbackSourceTitle('recorded')))

      await studio.createCaptureSession().catch(() => undefined)
      await studio.stageFile(clip.file, 'recorded')
    } finally {
      activeCaptureImportIdRef.current = null
      setIsUsingClip(false)
    }
  }, [capture, isUsingClip, studio])

  useEffect(() => {
    if (!showRecording || capture.status !== 'recorded' || !capture.recordedCapture || isUsingClip) {
      return
    }

    void handleUseCapturedClip()
  }, [capture.recordedCapture, capture.status, handleUseCapturedClip, isUsingClip, showRecording])

  useEffect(() => {
    if (!isCorruptedProjectTitle(studio.projectTitle)) {
      return
    }

    const sourceType = studio.uploadedAsset?.sourceType === 'recorded' ? 'recorded' : 'uploaded'
    const fallbackTitle = createFallbackSourceTitle(sourceType)
    const nextTitle = normalizeProjectTitle(studio.uploadedAsset?.fileName ?? null, fallbackTitle)
    if (nextTitle === studio.projectTitle) {
      return
    }

    studio.setProjectTitle(nextTitle)
  }, [studio.projectTitle, studio.setProjectTitle, studio.uploadedAsset?.fileName, studio.uploadedAsset?.sourceType])

  function handleDropAudioAsset(
    asset: {
      id: string
      label: string
      objectUrl: string
      durationSeconds: number
    },
    startSeconds: number,
  ) {
    const safeStart = Math.max(0, Math.round(startSeconds))
    const clipDuration = Math.max(2, Math.round(asset.durationSeconds || 2))

    setAudioTimelineClips((clips) => [
      ...clips,
      {
        id: `audio-clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        assetId: asset.id,
        label: asset.label,
        objectUrl: asset.objectUrl,
        startSeconds: safeStart,
        endSeconds: safeStart + clipDuration,
      },
    ])
  }

  function handleDropVideoAsset(
    asset: {
      id: string
      label: string
      objectUrl: string
      durationSeconds: number
    },
    startSeconds: number,
  ) {
    const safeStart = Math.max(0, Math.round(startSeconds))
    const clipDuration = Math.max(1, Math.round(asset.durationSeconds))

    setVideoTimelineClips((clips) => [
      ...clips,
      {
        id: `video-clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        assetId: asset.id,
        label: asset.label,
        objectUrl: asset.objectUrl,
        startSeconds: safeStart,
        endSeconds: safeStart + clipDuration,
        durationSeconds: clipDuration,
      },
    ])
  }

  function handleDropImageAsset(
    asset: {
      id: string
      label: string
      objectUrl: string
    },
    startSeconds: number,
  ) {
    const safeStart = Math.max(0, Math.round(startSeconds))
    studio.addImageOverlay({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: asset.label,
      storagePath: null,
      objectUrl: asset.objectUrl,
      position: 'bottom-right',
      opacity: 1,
      startSeconds: safeStart,
      endSeconds: safeStart + 8,
    })
  }

  function handleRequestAddVideo() {
    addVideoInputRef.current?.click()
  }

  function handleRequestAddAudio() {
    addAudioInputRef.current?.click()
  }

  function handleAddTextLayer(text: string, position: 'top' | 'center' | 'bottom') {
    const start = Math.round(currentTime)
    setExtraLayers((layers) => {
      const textCount = layers.filter((l) => l.type === 'text').length + 2
      const clipId = `extra-text-clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      return [
        ...layers,
        {
          id: `extra-text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'text' as const,
          label: `Text ${textCount}`,
          clips: [
            {
              id: clipId,
              label: text,
              text,
              position,
              fontFamily: 'sans-serif' as const,
              fontSize: 28,
              color: '#ffffff',
              bgColor: null,
              startSeconds: start,
              endSeconds: start + 5,
            },
          ],
        },
      ]
    })
  }

  function handleRemoveLayer(layerId: string) {
    setExtraLayers((layers) => layers.filter((l) => l.id !== layerId))
  }

  function handleMoveBlock(fromTrackId: string, toTrackId: string, blockId: string, startSeconds: number, endSeconds: number) {
    const extraFrom = extraLayers.find((l) => l.id === fromTrackId)
    const extraTo = extraLayers.find((l) => l.id === toTrackId)

    // ── extra → extra (same type) ──────────────────────────────────────────
    if (extraFrom && extraTo && extraFrom.type === extraTo.type) {
      setExtraLayers((layers) => {
        const clip = layers.find((l) => l.id === fromTrackId)?.clips.find((c) => c.id === blockId)
        if (!clip) return layers
        return layers.map((l) => {
          if (l.id === fromTrackId) return { ...l, clips: l.clips.filter((c) => c.id !== blockId) }
          if (l.id === toTrackId) return { ...l, clips: [...l.clips, { ...clip, startSeconds, endSeconds }] }
          return l
        })
      })
      return
    }

    // ── fixed 'text' → extra 'text' ────────────────────────────────────────
    if (fromTrackId === 'text' && extraTo?.type === 'text') {
      const overlay = studio.textOverlays.find((t) => t.id === blockId)
      if (!overlay) return
      studio.removeTextOverlay(blockId)
      setExtraLayers((layers) => layers.map((l) =>
        l.id === toTrackId
          ? { ...l, clips: [...l.clips, { id: overlay.id, label: overlay.text.slice(0, 30), text: overlay.text, position: overlay.position, fontFamily: overlay.fontFamily, fontSize: overlay.fontSize, color: overlay.color, bgColor: overlay.bgColor, startSeconds, endSeconds }] }
          : l,
      ))
      return
    }

    // ── extra 'text' → fixed 'text' ────────────────────────────────────────
    if (extraFrom?.type === 'text' && toTrackId === 'text') {
      const clip = extraFrom.clips.find((c) => c.id === blockId)
      if (!clip) return
      setExtraLayers((layers) => layers.map((l) => l.id === fromTrackId ? { ...l, clips: l.clips.filter((c) => c.id !== blockId) } : l))
      studio.addTextOverlay({ id: clip.id, text: clip.text ?? clip.label, fontFamily: clip.fontFamily ?? 'sans-serif', fontSize: clip.fontSize ?? 28, color: clip.color ?? '#ffffff', bgColor: clip.bgColor ?? null, position: clip.position ?? 'bottom', startSeconds, endSeconds })
      return
    }

    // ── fixed 'audio' → extra 'audio' ──────────────────────────────────────
    if (fromTrackId === 'audio' && extraTo?.type === 'audio') {
      const clip = audioTimelineClips.find((c) => c.id === blockId)
      if (!clip) return
      setAudioTimelineClips((clips) => clips.filter((c) => c.id !== blockId))
      setExtraLayers((layers) => layers.map((l) =>
        l.id === toTrackId
          ? { ...l, clips: [...l.clips, { id: clip.id, label: clip.label, objectUrl: clip.objectUrl, assetId: clip.assetId, startSeconds, endSeconds }] }
          : l,
      ))
      return
    }

    // ── extra 'audio' → fixed 'audio' ──────────────────────────────────────
    if (extraFrom?.type === 'audio' && toTrackId === 'audio') {
      const clip = extraFrom.clips.find((c) => c.id === blockId)
      if (!clip) return
      setExtraLayers((layers) => layers.map((l) => l.id === fromTrackId ? { ...l, clips: l.clips.filter((c) => c.id !== blockId) } : l))
      setAudioTimelineClips((clips) => [...clips, { id: clip.id, label: clip.label, objectUrl: clip.objectUrl ?? '', assetId: clip.assetId ?? '', startSeconds, endSeconds }])
      return
    }

    // ── fixed 'video' → extra 'video' (timeline clips only, not segments) ──
    if (fromTrackId === 'video' && extraTo?.type === 'video') {
      const clip = videoTimelineClips.find((c) => c.id === blockId)
      if (!clip) return
      setVideoTimelineClips((clips) => clips.filter((c) => c.id !== blockId))
      setExtraLayers((layers) => layers.map((l) =>
        l.id === toTrackId
          ? { ...l, clips: [...l.clips, { id: clip.id, label: clip.label, objectUrl: clip.objectUrl, assetId: clip.assetId, durationSeconds: clip.durationSeconds, startSeconds, endSeconds }] }
          : l,
      ))
      return
    }

    // ── extra 'video' → fixed 'video' ──────────────────────────────────────
    if (extraFrom?.type === 'video' && toTrackId === 'video') {
      const clip = extraFrom.clips.find((c) => c.id === blockId)
      if (!clip) return
      setExtraLayers((layers) => layers.map((l) => l.id === fromTrackId ? { ...l, clips: l.clips.filter((c) => c.id !== blockId) } : l))
      setVideoTimelineClips((clips) => [...clips, { id: clip.id, label: clip.label, objectUrl: clip.objectUrl ?? '', assetId: clip.assetId ?? '', durationSeconds: clip.durationSeconds ?? (endSeconds - startSeconds), startSeconds, endSeconds }])
    }
  }

  function handleRepositionTextOverlay(id: string, startSeconds: number, durationSeconds: number) {
    const safeStart = Math.max(0, startSeconds)
    if (studio.textOverlays.some((t) => t.id === id)) {
      studio.updateTextOverlay(id, { startSeconds: safeStart, endSeconds: safeStart + durationSeconds, placed: true })
      return
    }
    setExtraLayers((layers) => layers.map((l) => ({
      ...l,
      clips: l.clips.map((c) => c.id === id ? { ...c, startSeconds: safeStart, endSeconds: safeStart + durationSeconds } : c),
    })))
  }

  function handleRepositionImageOverlay(id: string, startSeconds: number, durationSeconds: number) {
    const safeStart = Math.max(0, startSeconds)
    studio.updateImageOverlay(id, { startSeconds: safeStart, endSeconds: safeStart + durationSeconds, placed: true })
  }

  function handleTextOverlayMove(id: string, x: number, y: number) {
    if (studio.textOverlays.some((t) => t.id === id)) {
      studio.updateTextOverlay(id, { x, y })
      return
    }
    setExtraLayers((layers) => layers.map((l) => ({
      ...l,
      clips: l.clips.map((c) => c.id === id ? { ...c, x, y } : c),
    })))
  }

  function handleImageOverlayMove(id: string, x: number, y: number) {
    studio.updateImageOverlay(id, { x, y })
  }

  function handleDeleteCanvasTextOverlay(id: string) {
    if (studio.textOverlays.some((t) => t.id === id)) {
      studio.removeTextOverlay(id)
      return
    }
    setExtraLayers((layers) => layers.map((l) => ({ ...l, clips: l.clips.filter((c) => c.id !== id) })))
  }

  function handleDeleteCanvasImageOverlay(id: string) {
    studio.removeImageOverlay(id)
  }

  async function handleExport() {
    await studio.queueRenderWorkflow()
  }

  function handleAddText(overlay: TextOverlay) {
    // Stage in panel only — user must drag to the timeline to place it
    studio.addTextOverlay({ ...overlay, placed: false })
  }

  function handleAddImage(overlay: ImageOverlay) {
    // Stage in panel only — user must drag to the timeline to place it
    studio.addImageOverlay({ ...overlay, placed: false })
  }

  function handleBlockChange(
    trackId: string,
    blockId: string,
    patch: { startSeconds?: number; endSeconds?: number; label?: string },
  ) {
    if (trackId === 'video') {
      const isSegment = studio.segments.some((s) => s.id === blockId)
      if (isSegment) {
        if (patch.startSeconds !== undefined) studio.updateSegment(blockId, 'startSeconds', patch.startSeconds)
        if (patch.endSeconds !== undefined) studio.updateSegment(blockId, 'endSeconds', patch.endSeconds)
      } else {
        setVideoTimelineClips((clips) =>
          clips.map((c) =>
            c.id === blockId
              ? { ...c, ...(patch.startSeconds !== undefined && { startSeconds: patch.startSeconds }), ...(patch.endSeconds !== undefined && { endSeconds: patch.endSeconds }), ...(patch.label !== undefined && { label: patch.label }) }
              : c,
          ),
        )
      }
      return
    }
    if (trackId === 'audio') {
      setAudioTimelineClips((clips) =>
        clips.map((c) =>
          c.id === blockId
            ? { ...c, ...(patch.startSeconds !== undefined && { startSeconds: patch.startSeconds }), ...(patch.endSeconds !== undefined && { endSeconds: patch.endSeconds }), ...(patch.label !== undefined && { label: patch.label }) }
            : c,
        ),
      )
      return
    }
    if (trackId === 'text') {
      const { label, ...timePatch } = patch
      if (Object.keys(timePatch).length > 0) studio.updateTextOverlay(blockId, timePatch)
      if (label !== undefined) studio.updateTextOverlay(blockId, { text: label })
      return
    }
    if (trackId === 'images') {
      const { label, ...timePatch } = patch
      if (Object.keys(timePatch).length > 0) studio.updateImageOverlay(blockId, timePatch)
      if (label !== undefined) studio.updateImageOverlay(blockId, { label })
      return
    }
    // Extra dynamic layers
    setExtraLayers((layers) =>
      layers.map((layer) =>
        layer.id === trackId
          ? {
              ...layer,
              clips: layer.clips.map((c) =>
                c.id === blockId
                  ? {
                      ...c,
                      ...(patch.startSeconds !== undefined && { startSeconds: patch.startSeconds }),
                      ...(patch.endSeconds !== undefined && { endSeconds: patch.endSeconds }),
                      ...(patch.label !== undefined && { label: patch.label, text: patch.label }),
                    }
                  : c,
              ),
            }
          : layer,
      ),
    )
  }

  function handleDeleteBlock(trackId: string, blockId: string) {
    if (trackId === 'video') {
      const isSegment = studio.segments.some((s) => s.id === blockId)
      if (isSegment) {
        studio.removeSegment(blockId)
      } else {
        setVideoTimelineClips((clips) => clips.filter((c) => c.id !== blockId))
      }
      return
    }
    if (trackId === 'audio') {
      setAudioTimelineClips((clips) => clips.filter((c) => c.id !== blockId))
      return
    }
    if (trackId === 'text') {
      studio.removeTextOverlay(blockId)
      return
    }
    if (trackId === 'images') {
      studio.removeImageOverlay(blockId)
      return
    }
    // Extra dynamic layers — remove the clip, leave the empty row
    setExtraLayers((layers) =>
      layers.map((layer) =>
        layer.id === trackId
          ? { ...layer, clips: layer.clips.filter((c) => c.id !== blockId) }
          : layer,
      ),
    )
  }

  function handleCutAtPlayhead() {
    const t = currentTime

    // Video segments first
    const seg = studio.segments.find((s) => t > s.startSeconds + 1 && t < s.endSeconds - 1)
    if (seg) {
      studio.splitSegment(seg.id, t)
      return
    }

    // Audio timeline clips
    const audioClip = audioTimelineClips.find((c) => t > c.startSeconds + 1 && t < c.endSeconds - 1)
    if (audioClip) {
      const cutAt = Math.round(t)
      const newClip = { ...audioClip, id: `audio-clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, startSeconds: cutAt }
      setAudioTimelineClips((clips) =>
        clips.map((c) => (c.id === audioClip.id ? { ...c, endSeconds: cutAt } : c)).concat([newClip]),
      )
      return
    }

    // Video timeline clips
    const videoClip = videoTimelineClips.find((c) => t > c.startSeconds + 1 && t < c.endSeconds - 1)
    if (videoClip) {
      const cutAt = Math.round(t)
      const newClip = { ...videoClip, id: `video-clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, startSeconds: cutAt }
      setVideoTimelineClips((clips) =>
        clips.map((c) => (c.id === videoClip.id ? { ...c, endSeconds: cutAt } : c)).concat([newClip]),
      )
    }
  }

  useEffect(() => {
    const refs = audioElementRefs.current

    for (const clip of audioTimelineClips) {
      const audio = refs[clip.id]
      if (!audio) {
        continue
      }

      const clipDuration = Math.max(0, clip.endSeconds - clip.startSeconds)
      const targetTime = Math.max(0, Math.min(clipDuration, currentTime - clip.startSeconds))
      const shouldPlay = isPreviewPlaying && currentTime >= clip.startSeconds && currentTime < clip.endSeconds

      if (Math.abs(audio.currentTime - targetTime) > 0.35) {
        audio.currentTime = targetTime
      }

      if (shouldPlay) {
        audio.volume = 1
        if (audio.paused) {
          void audio.play().catch(() => undefined)
        }
        continue
      }

      if (!audio.paused) {
        audio.pause()
      }
    }

    for (const [clipId, audio] of Object.entries(refs)) {
      if (!audioTimelineClips.some((clip) => clip.id === clipId)) {
        if (audio && !audio.paused) audio.pause()
        delete refs[clipId]
      }
    }
  }, [audioTimelineClips, currentTime, isPreviewPlaying])

  if (studio.isBootstrapping) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-[var(--color-watashi-text-soft)]">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-watashi-indigo)]" />
        <span className="text-[13px] font-medium">Loading studio</span>
      </div>
    )
  }

  const videoEffects = studio.videoEffects ?? createDefaultVideoEffects()

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 81px)' }}>
      <EditorTopBar
        title={studio.projectTitle}
        onTitleChange={studio.setProjectTitle}
        jobs={studio.jobs}
        isSaving={studio.isSaving}
        saveError={studio.saveError}
        uploadProgress={studio.uploadProgress}
        exportBlocked={exportBlockedReason}
        onRecord={handleRecord}
        onExport={handleExport}
      />

      <div className="flex min-h-0 flex-1">
        <div className="w-56 shrink-0 overflow-hidden">
          <EditorLeftPanel
            uploadedAsset={studio.uploadedAsset}
            uploadErrors={[...studio.validationErrors, ...mediaLibraryErrors]}
            audioAssets={audioAssets}
            videoAssets={videoAssets}
            imageAssets={imageAssets}
            audioUploadError={audioUploadError}
            isInspecting={studio.isInspecting || isUsingClip}
            effects={videoEffects}
            textOverlays={studio.textOverlays}
            imageOverlays={studio.imageOverlays}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onStageVideoFile={handleStageVideoFile}
            onStageAudioFile={handleStageAudioFile}
            onStageImageFile={handleStageImageFile}
            onEffectChange={studio.updateVideoEffect}
            onAddText={handleAddText}
            onAddImage={handleAddImage}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <EditorCanvas
            sourceUrl={activePreviewSourceUrl}
            sourceTimelineStartSeconds={previewPlaybackWindow.timelineStartSeconds}
            sourceMediaOffsetSeconds={previewPlaybackWindow.mediaOffsetSeconds}
            sourceTimelineEndSeconds={previewPlaybackWindow.timelineEndSeconds}
            isPlaybackActive={isPreviewPlaying}
            effects={videoEffects}
            textOverlays={allTextOverlays}
            imageOverlays={placedImageOverlays}
            subtitleCues={studio.subtitleCues}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onTimeUpdate={setCurrentTime}
            onScrub={handleSeek}
            onPlaybackChange={setIsPreviewPlaying}
            videoRef={videoRef}
            onTextOverlayMove={handleTextOverlayMove}
            onImageOverlayMove={handleImageOverlayMove}
            onDeleteTextOverlay={handleDeleteCanvasTextOverlay}
            onDeleteImageOverlay={handleDeleteCanvasImageOverlay}
          />
        </div>

        <div className="w-60 shrink-0 overflow-hidden">
          <EditorRightPanel
            audioSettings={studio.audioSettings}
            onAudioChange={studio.updateAudioSetting}
            subtitleCues={studio.subtitleCues}
            onSubtitleChange={studio.updateSubtitleCue}
            onAddSubtitle={studio.addSubtitleCue}
            onGenerateSubtitles={studio.queueSubtitleWorkflow}
            subtitleJobStatus={subtitleJobStatus}
            exportSettings={studio.exportSettings}
            onExportChange={studio.updateExportSetting}
            bindingType={studio.bindingType}
            bindingTargetId={studio.bindingTargetId}
            bindingOptions={studio.bindingOptions}
            onBindingTypeChange={studio.updateBindingType}
            onBindingTargetChange={studio.setBindingTargetId}
          />
        </div>
      </div>

      <div className="h-52 shrink-0 overflow-hidden">
        <EditorTimeline
          totalDuration={totalDuration}
          currentTime={currentTime}
          segments={studio.segments}
          videoTimelineClips={videoTimelineClips}
          subtitleCues={studio.subtitleCues}
          textOverlays={placedTextOverlays}
          imageOverlays={placedImageOverlays}
          audioTimelineClips={audioTimelineClips}
          extraLayers={extraLayers}
          onSeek={handleSeek}
          onBlockChange={handleBlockChange}
          onDeleteBlock={handleDeleteBlock}
          onCutAtPlayhead={handleCutAtPlayhead}
          onRemoveLayer={handleRemoveLayer}
          onReorderLayers={setExtraLayers}
          onMoveBlock={handleMoveBlock}
          onDropVideoAsset={handleDropVideoAsset}
          onDropAudioAsset={handleDropAudioAsset}
          onDropImageAsset={handleDropImageAsset}
          onRepositionTextOverlay={handleRepositionTextOverlay}
          onRepositionImageOverlay={handleRepositionImageOverlay}
          onRequestAddVideo={handleRequestAddVideo}
          onRequestAddAudio={handleRequestAddAudio}
          onAddText={handleAddTextLayer}
        />
      </div>

      {/* Hidden file inputs for "Add Layer" actions from the timeline toolbar */}
      <input
        ref={addVideoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          e.target.value = ''
          try {
            const { readVideoDuration } = await import('../services/mediaValidation')
            const durationSeconds = await readVideoDuration(file)
            const asset = createVideoAsset(file, durationSeconds)
            setVideoAssets((current) => [asset, ...current])
            const safeStart = Math.max(0, Math.round(currentTime))
            const clipDuration = Math.max(1, Math.round(durationSeconds))
            const clipLabel = asset.fileName.replace(/\.[^.]+$/, '')
            setExtraLayers((layers) => {
              const videoCount = layers.filter((l) => l.type === 'video').length + 2
              return [
                ...layers,
                {
                  id: `extra-video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  type: 'video' as const,
                  label: `Video ${videoCount}`,
                  clips: [
                    {
                      id: `extra-video-clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      label: clipLabel,
                      objectUrl: asset.objectUrl,
                      durationSeconds: clipDuration,
                      assetId: asset.id,
                      startSeconds: safeStart,
                      endSeconds: safeStart + clipDuration,
                    },
                  ],
                },
              ]
            })
          } catch {
            setMediaLibraryErrors(['Could not read that video file.'])
          }
        }}
      />
      <input
        ref={addAudioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          e.target.value = ''
          try {
            const { readAudioDuration } = await import('../services/mediaValidation')
            const durationSeconds = await readAudioDuration(file)
            const asset = createAudioAsset(file, durationSeconds)
            setAudioAssets((current) => [asset, ...current])
            const safeStart = Math.max(0, Math.round(currentTime))
            const clipDuration = Math.max(2, Math.round(durationSeconds))
            const clipLabel = asset.fileName.replace(/\.[^.]+$/, '')
            setExtraLayers((layers) => {
              const audioCount = layers.filter((l) => l.type === 'audio').length + 2
              return [
                ...layers,
                {
                  id: `extra-audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  type: 'audio' as const,
                  label: `Audio ${audioCount}`,
                  clips: [
                    {
                      id: `extra-audio-clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      label: clipLabel,
                      objectUrl: asset.objectUrl,
                      durationSeconds: clipDuration,
                      assetId: asset.id,
                      startSeconds: safeStart,
                      endSeconds: safeStart + clipDuration,
                    },
                  ],
                },
              ]
            })
          } catch {
            setAudioUploadError('Could not read that audio file.')
          }
        }}
      />

      <div className="hidden">
        {audioTimelineClips.map((clip) => (
          <audio
            key={clip.id}
            ref={(element) => {
              audioElementRefs.current[clip.id] = element
            }}
            src={clip.objectUrl}
            preload="auto"
          />
        ))}
      </div>

      {showRecording && (
        <RecordingSheet
          mode={capture.mode}
          status={capture.status}
          previewStream={capture.previewStream}
          recordedCapture={capture.recordedCapture}
          errorMessage={capture.errorMessage}
          warningMessage={capture.warningMessage}
          elapsedSeconds={capture.elapsedSeconds}
          onModeChange={capture.setMode}
          onReady={capture.readyCapture}
          onStart={capture.startRecording}
          onPause={capture.pauseRecording}
          onResume={capture.resumeRecording}
          onStop={capture.stopRecording}
          onReset={capture.resetCapture}
          onUseClip={handleUseCapturedClip}
          isUsingClip={isUsingClip}
          onClose={() => setShowRecording(false)}
        />
      )}
    </div>
  )
}
