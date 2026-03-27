import { Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLiveCapture } from '../hooks/useLiveCapture'
import { useVideoStudio } from '../hooks/useVideoStudio'
import type { ImageOverlay, LiveCaptureMode, TextOverlay } from '../types/video-project.types'
import { EditorCanvas } from '../components/EditorCanvas'
import { EditorLeftPanel } from '../components/EditorLeftPanel'
import { EditorRightPanel } from '../components/EditorRightPanel'
import { EditorTimeline } from '../components/EditorTimeline'
import { EditorTopBar } from '../components/EditorTopBar'
import { RecordingSheet } from '../components/RecordingSheet'
import { createDefaultVideoEffects } from '../defaults'

function toProjectTitle(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function VideoCreationPage() {
  const studio = useVideoStudio()
  const capture = useLiveCapture()
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [showRecording, setShowRecording] = useState(false)

  const totalDuration = studio.uploadedAsset?.durationSeconds
    ? Math.max(studio.uploadedAsset.durationSeconds, studio.segments[studio.segments.length - 1]?.endSeconds ?? 0)
    : Math.max(studio.segments[studio.segments.length - 1]?.endSeconds ?? 0, 930)

  const previewSourceUrl =
    studio.uploadedAsset?.proxyObjectUrl ??
    studio.uploadedAsset?.objectUrl ??
    (capture.recordedCapture && capture.recordedCapture.mode !== 'audio' ? capture.recordedCapture.objectUrl : null)

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
    const video = videoRef.current
    if (video) video.currentTime = seconds
    setCurrentTime(seconds)
  }

  async function handleStageFile(file: File) {
    const result = await studio.stageFile(file)
    if (result.accepted) {
      studio.setProjectTitle(toProjectTitle(file.name))
    }
  }

  async function handleUseCapturedClip() {
    if (!capture.recordedCapture) return
    if (capture.recordedCapture.mode === 'audio') {
      // audio-only clips used as narration — not staged as main video source
      setShowRecording(false)
      return
    }

    await studio.createCaptureSession(capture.recordedCapture.mode)
    const result = await studio.stageFile(capture.recordedCapture.file)
    if (result.accepted) {
      studio.setProjectTitle(toProjectTitle(capture.recordedCapture.fileName))
    }
    setShowRecording(false)
    capture.resetCapture()
  }

  async function handleExport() {
    await studio.queueRenderWorkflow()
  }

  function handleAddText(overlay: TextOverlay) {
    studio.addTextOverlay(overlay)
  }

  function handleAddImage(overlay: ImageOverlay) {
    studio.addImageOverlay(overlay)
  }

  if (studio.isBootstrapping) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-[var(--color-watashi-text-soft)]">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-sm">Loading studio…</span>
      </div>
    )
  }

  const videoEffects = studio.videoEffects ?? createDefaultVideoEffects()

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 89px)' }}>
      {/* Top bar */}
      <EditorTopBar
        title={studio.projectTitle}
        onTitleChange={studio.setProjectTitle}
        jobs={studio.jobs}
        isSaving={studio.isSaving}
        exportBlocked={exportBlockedReason}
        onRecord={handleRecord}
        onExport={handleExport}
      />

      {/* Middle section: left panel + canvas + right panel */}
      <div className="flex min-h-0 flex-1">
        {/* Left panel */}
        <div className="w-52 shrink-0 overflow-hidden">
          <EditorLeftPanel
            uploadedAsset={studio.uploadedAsset}
            isInspecting={studio.isInspecting}
            effects={videoEffects}
            textOverlays={studio.textOverlays}
            imageOverlays={studio.imageOverlays}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onStageFile={handleStageFile}
            onEffectChange={studio.updateVideoEffect}
            onAddText={handleAddText}
            onAddImage={handleAddImage}
          />
        </div>

        {/* Canvas */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <EditorCanvas
            sourceUrl={previewSourceUrl}
            effects={videoEffects}
            textOverlays={studio.textOverlays}
            subtitleCues={studio.subtitleCues}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onTimeUpdate={setCurrentTime}
            onScrub={handleSeek}
            videoRef={videoRef}
          />
        </div>

        {/* Right panel */}
        <div className="w-64 shrink-0 overflow-hidden">
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

      {/* Timeline */}
      <div className="h-44 shrink-0 overflow-hidden">
        <EditorTimeline
          totalDuration={totalDuration}
          currentTime={currentTime}
          segments={studio.segments}
          subtitleCues={studio.subtitleCues}
          textOverlays={studio.textOverlays}
          imageOverlays={studio.imageOverlays}
          onSeek={handleSeek}
          onTrimSegment={studio.updateSegment}
        />
      </div>

      {/* Recording sheet overlay */}
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
          onClose={() => setShowRecording(false)}
        />
      )}
    </div>
  )
}
