import { useEffect, useRef, useState } from 'react'
import type { LiveCaptureMode, LiveCaptureStatus, RecordedCapture } from '../types/video-project.types'

type CapturePreparation = {
  previewStream: MediaStream | null
  recordStream: MediaStream
  sourceAvailability: {
    screen: boolean
    camera: boolean
    microphone: boolean
    systemAudio: boolean
  }
  warningMessage: string | null
  cleanup: () => void
}

type OptionalCaptureResult = {
  stream: MediaStream | null
  warningMessage: string | null
}

function getTimestampLabel() {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
}

function getFileExtension(mimeType: string, fallback: 'webm' | 'wav' = 'webm') {
  if (mimeType.includes('mp4')) {
    return 'mp4'
  }

  if (mimeType.includes('ogg')) {
    return 'ogg'
  }

  if (mimeType.includes('wav')) {
    return 'wav'
  }

  return fallback
}

async function attachStreamToVideo(stream: MediaStream) {
  const video = document.createElement('video')
  video.srcObject = stream
  video.muted = true
  video.playsInline = true

  await new Promise<void>((resolve) => {
    const finish = () => resolve()
    video.onloadedmetadata = finish
    void video.play().then(finish).catch(finish)
  })

  return video
}

function drawRoundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if ('roundRect' in context) {
    context.beginPath()
    context.roundRect(x, y, width, height, radius)
    context.closePath()
    return
  }

  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.arcTo(x + width, y, x + width, y + height, safeRadius)
  context.arcTo(x + width, y + height, x, y + height, safeRadius)
  context.arcTo(x, y + height, x, y, safeRadius)
  context.arcTo(x, y, x + width, y, safeRadius)
  context.closePath()
}

function getCaptureErrorName(error: unknown) {
  if (error instanceof DOMException) {
    return error.name
  }

  if (typeof error === 'object' && error !== null && 'name' in error && typeof error.name === 'string') {
    return error.name
  }

  return null
}

function isPermissionError(error: unknown) {
  const errorName = getCaptureErrorName(error)
  return errorName === 'NotAllowedError'
    || errorName === 'PermissionDeniedError'
    || errorName === 'SecurityError'
}

function shouldRetryDisplayWithoutAudio(error: unknown) {
  const errorName = getCaptureErrorName(error)
  return errorName === 'TypeError'
    || errorName === 'NotSupportedError'
    || errorName === 'OverconstrainedError'
}

function describeRequiredCaptureError(label: string, error: unknown) {
  if (isPermissionError(error)) {
    return `${label} permission was denied. Allow access to continue with this capture mode.`
  }

  const errorName = getCaptureErrorName(error)
  if (errorName === 'NotFoundError') {
    return `We could not find an available ${label.toLowerCase()} source.`
  }

  if (errorName === 'NotReadableError') {
    return `${label} is already in use by another app or the browser could not read it.`
  }

  return `We could not start ${label.toLowerCase()} right now.`
}

function describeOptionalCaptureWarning(label: string, error: unknown) {
  if (isPermissionError(error)) {
    return `${label} permission was denied. The studio can continue without it, or you can allow access and try again.`
  }

  const errorName = getCaptureErrorName(error)
  if (errorName === 'NotFoundError') {
    return `${label} is not available on this device right now.`
  }

  if (errorName === 'NotReadableError') {
    return `${label} is busy in another app, so the studio skipped it for this take.`
  }

  return `${label} could not be connected, so the studio skipped it for this take.`
}

function stopStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop())
}

function getAudioContextConstructor() {
  return window.AudioContext
    ?? (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    ?? null
}

function createMixedAudioStream(streams: MediaStream[]) {
  const audioTracks = streams.flatMap((stream) => stream.getAudioTracks())
  if (audioTracks.length === 0) {
    return {
      stream: null,
      cleanup: () => undefined,
    }
  }

  const AudioContextCtor = getAudioContextConstructor()
  if (!AudioContextCtor) {
    return {
      stream: new MediaStream(audioTracks),
      cleanup: () => undefined,
    }
  }

  const audioContext = new AudioContextCtor()
  const destination = audioContext.createMediaStreamDestination()
  const nodes = streams
    .filter((stream) => stream.getAudioTracks().length > 0)
    .map((stream) => audioContext.createMediaStreamSource(stream))

  nodes.forEach((node) => node.connect(destination))
  void audioContext.resume().catch(() => undefined)

  return {
    stream: destination.stream,
    cleanup: () => {
      nodes.forEach((node) => node.disconnect())
      void audioContext.close().catch(() => undefined)
    },
  }
}

async function requestDisplayStream(): Promise<OptionalCaptureResult> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('Screen capture is not available in this browser.')
  }

  const displayVideoConstraints = {
    frameRate: 30,
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
  }

  try {
    return {
      stream: await navigator.mediaDevices.getDisplayMedia({
        video: displayVideoConstraints,
        audio: true,
      }),
      warningMessage: null,
    }
  } catch (error) {
    if (!shouldRetryDisplayWithoutAudio(error)) {
      throw new Error(describeRequiredCaptureError('Screen sharing', error))
    }
  }

  try {
    return {
      stream: await navigator.mediaDevices.getDisplayMedia({
        video: displayVideoConstraints,
      }),
      warningMessage: 'Screen audio is not available from this share source, so the studio will rely on your microphone instead.',
    }
  } catch (error) {
    throw new Error(describeRequiredCaptureError('Screen sharing', error))
  }
}

async function requestOptionalUserMedia(label: string, constraints: MediaStreamConstraints): Promise<OptionalCaptureResult> {
  try {
    return {
      stream: await navigator.mediaDevices.getUserMedia(constraints),
      warningMessage: null,
    }
  } catch (error) {
    return {
      stream: null,
      warningMessage: describeOptionalCaptureWarning(label, error),
    }
  }
}

async function createScreenCameraCapture(): Promise<CapturePreparation> {
  if (!navigator.mediaDevices?.getDisplayMedia || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Screen + camera capture is not available in this browser.')
  }

  const warnings: string[] = []
  const displayResult = await requestDisplayStream()
  const displayStream = displayResult.stream
  if (!displayStream) {
    throw new Error('Screen sharing could not be prepared.')
  }

  if (displayResult.warningMessage) {
    warnings.push(displayResult.warningMessage)
  }

  const cameraResult = await requestOptionalUserMedia('Camera', {
    video: {
      width: { ideal: 1280, max: 1280 },
      height: { ideal: 720, max: 720 },
      frameRate: { ideal: 30, max: 30 },
    },
  })
  const microphoneResult = await requestOptionalUserMedia('Microphone', {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })

  if (cameraResult.warningMessage) {
    warnings.push(cameraResult.warningMessage)
  }

  if (microphoneResult.warningMessage) {
    warnings.push(microphoneResult.warningMessage)
  }

  const cameraStream = cameraResult.stream
  const microphoneStream = microphoneResult.stream
  const screenVideo = await attachStreamToVideo(displayStream)
  const cameraVideo = cameraStream ? await attachStreamToVideo(cameraStream) : null

  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 720

  const context = canvas.getContext('2d')
  if (!context) {
    stopStream(displayStream)
    stopStream(cameraStream)
    stopStream(microphoneStream)
    throw new Error('We could not prepare the screen capture canvas.')
  }

  let frameId = 0

  const drawFrame = () => {
    context.fillStyle = '#091018'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)

    const pipWidth = 270
    const pipHeight = 152
    const pipX = canvas.width - pipWidth - 28
    const pipY = canvas.height - pipHeight - 28

    if (cameraVideo) {
      context.save()
      context.shadowColor = 'rgba(6, 12, 18, 0.45)'
      context.shadowBlur = 24
      drawRoundedRectangle(context, pipX, pipY, pipWidth, pipHeight, 24)
      context.clip()
      context.drawImage(cameraVideo, pipX, pipY, pipWidth, pipHeight)
      context.restore()
    }

    frameId = window.requestAnimationFrame(drawFrame)
  }

  drawFrame()

  const canvasStream = canvas.captureStream(30)
  const mixedAudio = createMixedAudioStream(
    [displayStream, microphoneStream].filter((stream): stream is MediaStream => Boolean(stream)),
  )
  const systemAudioAvailable = displayStream.getAudioTracks().length > 0
  const microphoneAvailable = (microphoneStream?.getAudioTracks().length ?? 0) > 0
  const sourceAvailability = {
    screen: true,
    camera: Boolean(cameraStream?.getVideoTracks().length),
    microphone: microphoneAvailable,
    systemAudio: systemAudioAvailable,
  }

  if (!systemAudioAvailable && !microphoneAvailable) {
    warnings.push('No audio source was connected. This take will record the screen only unless you allow microphone or share tab audio.')
  }

  const recordStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...(mixedAudio.stream?.getAudioTracks() ?? []),
  ])

  return {
    previewStream: canvasStream,
    recordStream,
    sourceAvailability,
    warningMessage: warnings.length > 0 ? warnings.join(' ') : null,
    cleanup: () => {
      window.cancelAnimationFrame(frameId)
      mixedAudio.cleanup()
      ;[
        ...displayStream.getTracks(),
        ...(cameraStream?.getTracks() ?? []),
        ...(microphoneStream?.getTracks() ?? []),
        ...canvasStream.getTracks(),
      ].forEach((track) => track.stop())
      screenVideo.srcObject = null
      if (cameraVideo) {
        cameraVideo.srcObject = null
      }
    },
  }
}

async function prepareCapture(mode: LiveCaptureMode): Promise<CapturePreparation> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Live capture is not available in this browser.')
  }

  void mode
  return createScreenCameraCapture()
}

export function useLiveCapture() {
  const [mode, setMode] = useState<LiveCaptureMode>('screen-camera')
  const [status, setStatus] = useState<LiveCaptureStatus>('idle')
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const [recordedCapture, setRecordedCapture] = useState<RecordedCapture | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [sourceAvailability, setSourceAvailability] = useState<CapturePreparation['sourceAvailability']>({
    screen: false,
    camera: false,
    microphone: false,
    systemAudio: false,
  })

  const preparedRef = useRef<CapturePreparation | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordedCaptureRef = useRef<RecordedCapture | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const elapsedBeforePauseRef = useRef(0)

  useEffect(() => {
    recordedCaptureRef.current = recordedCapture
  }, [recordedCapture])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }

      if (recordedCaptureRef.current?.objectUrl) {
        URL.revokeObjectURL(recordedCaptureRef.current.objectUrl)
      }

      preparedRef.current?.cleanup()
      preparedRef.current = null
    }
  }, [])

  function clearTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function releasePreparation() {
    preparedRef.current?.cleanup()
    preparedRef.current = null
    setPreviewStream(null)
    setSourceAvailability({
      screen: false,
      camera: false,
      microphone: false,
      systemAudio: false,
    })
  }

  function clearRecordedCapture() {
    setRecordedCapture((currentCapture) => {
      if (currentCapture?.objectUrl) {
        URL.revokeObjectURL(currentCapture.objectUrl)
      }

      return null
    })
  }

  async function initializeCapture(nextMode?: LiveCaptureMode) {
    const activeMode = nextMode ?? mode

    clearTimer()
    releasePreparation()
    setErrorMessage(null)
    setWarningMessage(null)
    setStatus('requesting')
    if (nextMode && nextMode !== mode) {
      setMode(nextMode)
    }

    try {
      const preparedCapture = await prepareCapture(activeMode)
      preparedRef.current = preparedCapture
      setPreviewStream(preparedCapture.previewStream)
      setSourceAvailability(preparedCapture.sourceAvailability)
      setWarningMessage(preparedCapture.warningMessage)
      setElapsedSeconds(0)
      setStatus('ready')
      return preparedCapture
    } catch (error) {
      const nextError = error instanceof Error ? error.message : 'We could not start the live capture devices.'
      setErrorMessage(nextError)
      setWarningMessage(null)
      setStatus('error')
      return null
    }
  }

  async function readyCapture(nextMode?: LiveCaptureMode) {
    await initializeCapture(nextMode)
  }

  async function startRecording() {
    clearRecordedCapture()
    const preparedCapture = preparedRef.current ?? await initializeCapture()

    if (!preparedCapture) {
      return
    }

    try {
      const mimeTypeCandidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      const mimeType = mimeTypeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? ''
      const recorder = new MediaRecorder(preparedCapture.recordStream, mimeType
        ? {
            mimeType,
            videoBitsPerSecond: 2_400_000,
            audioBitsPerSecond: 128_000,
          }
        : undefined)
      chunksRef.current = []
      elapsedBeforePauseRef.current = 0

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        clearTimer()
        startedAtRef.current = null
        elapsedBeforePauseRef.current = 0

        const nextMimeType = recorder.mimeType || mimeType || 'video/webm'
        const extension = getFileExtension(nextMimeType)
        const fileName = `${mode}-${getTimestampLabel()}.${extension}`
        const file = new File(chunksRef.current, fileName, { type: nextMimeType })
        const objectUrl = URL.createObjectURL(file)

        setRecordedCapture((currentCapture) => {
          if (currentCapture?.objectUrl) {
            URL.revokeObjectURL(currentCapture.objectUrl)
          }

          return {
            id: `${mode}-${Date.now()}`,
            mode,
            file,
            fileName,
            mimeType: nextMimeType,
            sizeBytes: file.size,
            objectUrl,
          }
        })

        releasePreparation()
        recorderRef.current = null
        setStatus('recorded')
      }

      recorderRef.current = recorder
      recorder.start(300)
      startedAtRef.current = Date.now()
      clearTimer()
      timerRef.current = window.setInterval(() => {
        if (!startedAtRef.current) {
          return
        }

        setElapsedSeconds(Math.max(0, elapsedBeforePauseRef.current + Math.round((Date.now() - startedAtRef.current) / 1000)))
      }, 1000)
      setStatus('recording')
    } catch (error) {
      const nextError = error instanceof Error ? error.message : 'We could not start recording.'
      setErrorMessage(nextError)
      setWarningMessage(null)
      releasePreparation()
      setStatus('error')
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
      recorderRef.current = null
      return
    }

    clearTimer()
    releasePreparation()
    setStatus('idle')
  }

  function pauseRecording() {
    if (!recorderRef.current || recorderRef.current.state !== 'recording' || !startedAtRef.current) {
      return
    }

    recorderRef.current.pause()
    elapsedBeforePauseRef.current += Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
    startedAtRef.current = null
    clearTimer()
    setStatus('paused')
  }

  function resumeRecording() {
    if (!recorderRef.current || recorderRef.current.state !== 'paused') {
      return
    }

    recorderRef.current.resume()
    startedAtRef.current = Date.now()
    clearTimer()
    timerRef.current = window.setInterval(() => {
      if (!startedAtRef.current) {
        return
      }

      setElapsedSeconds(Math.max(0, elapsedBeforePauseRef.current + Math.round((Date.now() - startedAtRef.current) / 1000)))
    }, 1000)
    setStatus('recording')
  }

  function resetCapture() {
    clearTimer()
    releasePreparation()
    clearRecordedCapture()
    setErrorMessage(null)
    setWarningMessage(null)
    setElapsedSeconds(0)
    elapsedBeforePauseRef.current = 0
    setStatus('idle')
  }

  function changeMode(nextMode: LiveCaptureMode) {
    if (nextMode !== 'screen-camera') {
      return
    }

    if (nextMode === mode) {
      return
    }

    resetCapture()
    setMode(nextMode)
  }

  return {
    mode,
    setMode: changeMode,
    status,
    previewStream,
    recordedCapture,
    errorMessage,
    warningMessage,
    sourceAvailability,
    elapsedSeconds,
    readyCapture,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetCapture,
  }
}
