import { useEffect, useState } from 'react'
import { readVideoDuration, validateVideoUpload, videoUploadPolicy } from '../services/mediaValidation'
import type { UploadAttemptResult, UploadValidationResult, UploadedVideoAsset } from '../types/video-project.types'

export function useUploadVideo() {
  const [uploadedAsset, setUploadedAsset] = useState<UploadedVideoAsset | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [lastValidation, setLastValidation] = useState<UploadValidationResult | null>(null)

  useEffect(() => {
    return () => {
      if (uploadedAsset?.objectUrl) {
        URL.revokeObjectURL(uploadedAsset.objectUrl)
      }
    }
  }, [uploadedAsset?.objectUrl])

  async function stageFile(file: File | null): Promise<UploadAttemptResult> {
    if (!file) {
      return { accepted: false, errors: [] }
    }

    setIsInspecting(true)
    setValidationErrors([])

    try {
      const durationSeconds = await readVideoDuration(file)
      const validation = validateVideoUpload(file, durationSeconds, videoUploadPolicy)
      setLastValidation(validation)

      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        return {
          accepted: false,
          errors: validation.errors,
        }
      }

      const nextAsset: UploadedVideoAsset = {
        id: `${file.name}-${Date.now()}`,
        fileName: file.name,
        fileSizeBytes: file.size,
        durationSeconds,
        mimeType: file.type || 'video/mp4',
        objectUrl: URL.createObjectURL(file),
      }

      setUploadedAsset((currentAsset) => {
        if (currentAsset?.objectUrl) {
          URL.revokeObjectURL(currentAsset.objectUrl)
        }

        return nextAsset
      })

      return {
        accepted: true,
        errors: [],
        asset: nextAsset,
      }
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : 'We could not inspect that upload.'
      setValidationErrors([fallbackMessage])

      return {
        accepted: false,
        errors: [fallbackMessage],
      }
    } finally {
      setIsInspecting(false)
    }
  }

  return {
    uploadedAsset,
    isInspecting,
    validationErrors,
    lastValidation,
    policy: videoUploadPolicy,
    stageFile,
  }
}
