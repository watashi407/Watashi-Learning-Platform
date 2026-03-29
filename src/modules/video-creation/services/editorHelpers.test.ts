import { describe, expect, it } from 'vitest'
import {
  clampMediaOffset,
  computeTimelineDuration,
  createFallbackSourceTitle,
  getTimelineRangeEnd,
  isPlaybackToggleKey,
  isCorruptedProjectTitle,
  isMediaOffsetAtEnd,
  normalizeProjectTitle,
  parseAudioAssetTransfer,
  parseImageAssetTransfer,
  parseVideoAssetTransfer,
  shouldHandlePlaybackShortcut,
} from './editorHelpers'

describe('editorHelpers', () => {
  it('normalizes uploaded filenames into readable project titles', () => {
    expect(normalizeProjectTitle('my-lesson_take-2.mp4', createFallbackSourceTitle('uploaded'))).toBe('My Lesson Take 2')
  })

  it('uses the fallback title when the upstream name is corrupted', () => {
    expect(normalizeProjectTitle('[object Object]-20260327T112117.webm', createFallbackSourceTitle('recorded'))).toBe('Screen Recording')
    expect(normalizeProjectTitle({ bad: true }, createFallbackSourceTitle('uploaded'))).toBe('Uploaded Clip')
  })

  it('reads file-like objects when a valid name property exists', () => {
    expect(
      normalizeProjectTitle({ name: 'screen-camera-20260327T112117.webm' }, createFallbackSourceTitle('recorded')),
    ).toBe('Screen Camera 20260327T112117')
  })

  it('detects corrupted persisted project titles', () => {
    expect(isCorruptedProjectTitle('[object Object]-20260327T112117')).toBe(true)
    expect(isCorruptedProjectTitle('')).toBe(false)
    expect(isCorruptedProjectTitle('Good Existing Title')).toBe(false)
  })

  it('recognizes playback toggle keys', () => {
    expect(isPlaybackToggleKey(' ')).toBe(true)
    expect(isPlaybackToggleKey('k')).toBe(true)
    expect(isPlaybackToggleKey('K')).toBe(true)
    expect(isPlaybackToggleKey('Enter')).toBe(false)
  })

  it('ignores playback shortcuts while typing in editable controls', () => {
    expect(shouldHandlePlaybackShortcut({ key: 'k', targetTagName: 'div' })).toBe(true)
    expect(shouldHandlePlaybackShortcut({ key: ' ', targetTagName: 'INPUT' })).toBe(false)
    expect(shouldHandlePlaybackShortcut({ key: 'K', targetIsContentEditable: true })).toBe(false)
    expect(shouldHandlePlaybackShortcut({ key: 'K', ctrlKey: true })).toBe(false)
  })

  it('parses a valid audio drag payload', () => {
    expect(
      parseAudioAssetTransfer(JSON.stringify({
        id: 'audio-1',
        label: 'Voiceover',
        objectUrl: 'blob:voiceover',
        durationSeconds: 14,
      })),
    ).toEqual({
      id: 'audio-1',
      label: 'Voiceover',
      objectUrl: 'blob:voiceover',
      durationSeconds: 14,
    })
  })

  it('rejects malformed audio drag payloads', () => {
    expect(parseAudioAssetTransfer(null)).toBeNull()
    expect(parseAudioAssetTransfer('not-json')).toBeNull()
    expect(
      parseAudioAssetTransfer(JSON.stringify({
        id: 'audio-1',
        label: 'Voiceover',
        durationSeconds: 14,
      })),
    ).toBeNull()
  })

  it('parses valid video and image drag payloads', () => {
    expect(
      parseVideoAssetTransfer(JSON.stringify({
        id: 'video-1',
        label: 'B-roll',
        objectUrl: 'blob:video',
        durationSeconds: 9,
      })),
    ).toEqual({
      id: 'video-1',
      label: 'B-roll',
      objectUrl: 'blob:video',
      durationSeconds: 9,
    })

    expect(
      parseImageAssetTransfer(JSON.stringify({
        id: 'image-1',
        label: 'Logo',
        objectUrl: 'blob:image',
      })),
    ).toEqual({
      id: 'image-1',
      label: 'Logo',
      objectUrl: 'blob:image',
    })
  })

  it('rejects malformed video and image drag payloads', () => {
    expect(parseVideoAssetTransfer('not-json')).toBeNull()
    expect(parseVideoAssetTransfer(JSON.stringify({
      id: 'video-1',
      label: 'B-roll',
      objectUrl: 'blob:video',
      durationSeconds: 0,
    }))).toBeNull()
    expect(parseImageAssetTransfer(JSON.stringify({
      id: 'image-1',
      label: 'Logo',
    }))).toBeNull()
  })

  it('computes layered timeline duration using all visible tracks', () => {
    expect(computeTimelineDuration({
      sourceDurationSeconds: 12,
      segmentEndSeconds: 12,
      audioTimelineClips: [{ endSeconds: 18 }],
      videoTimelineClips: [{ endSeconds: 26 }],
      imageOverlays: [{ endSeconds: 22 }],
      minimumDurationSeconds: 30,
    })).toBe(30)

    expect(computeTimelineDuration({
      sourceDurationSeconds: 12,
      segmentEndSeconds: 12,
      audioTimelineClips: [{ endSeconds: 18 }],
      videoTimelineClips: [{ endSeconds: 34 }],
      imageOverlays: [{ endSeconds: 22 }],
      minimumDurationSeconds: 30,
    })).toBe(34)
  })

  it('finds the furthest end point for timeline ranges', () => {
    expect(getTimelineRangeEnd([{ endSeconds: 4 }, { endSeconds: 11 }, { endSeconds: 6 }])).toBe(11)
    expect(getTimelineRangeEnd([])).toBe(0)
  })

  it('detects media boundaries and clamps seek offsets safely', () => {
    expect(isMediaOffsetAtEnd(9.96, 10)).toBe(true)
    expect(isMediaOffsetAtEnd(8.5, 10)).toBe(false)
    expect(isMediaOffsetAtEnd(4, null)).toBe(false)

    expect(clampMediaOffset(11, 10)).toBe(9.95)
    expect(clampMediaOffset(-2, 10)).toBe(0)
    expect(clampMediaOffset(4, null)).toBe(4)
  })
})
