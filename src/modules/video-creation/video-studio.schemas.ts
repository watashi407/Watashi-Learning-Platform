import { z } from 'zod'

const bindingSchema = z.object({
  type: z.enum(['lesson', 'course']),
  targetId: z.string().min(1),
})

export const createVideoProjectSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  binding: bindingSchema.partial().optional(),
})

export const saveVideoProjectSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(140),
  binding: bindingSchema,
  segments: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().trim().min(1).max(120),
      summary: z.string().trim().min(1).max(300),
      startSeconds: z.number().min(0),
      endSeconds: z.number().min(0),
      tone: z.string().trim().min(1).max(200),
    }),
  ),
  audioSettings: z.object({
    voiceBoost: z.number().min(0).max(100),
    noiseReduction: z.number().min(0).max(100),
    musicDucking: z.number().min(0).max(100),
    silenceTrim: z.boolean(),
    normalizeDialogue: z.boolean(),
  }),
  subtitleCues: z.array(
    z.object({
      id: z.string().min(1),
      startLabel: z.string().trim().min(1).max(16),
      endLabel: z.string().trim().min(1).max(16),
      text: z.string().trim().min(1).max(500),
    }),
  ),
  stampOverlays: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().trim().min(1).max(120),
      description: z.string().trim().min(1).max(300),
      placement: z.string().trim().min(1).max(120),
      enabled: z.boolean(),
    }),
  ),
  exportSettings: z.object({
    format: z.enum(['mp4', 'mov']),
    resolution: z.enum(['720p', '1080p', '4k']),
    includeBurnedSubtitles: z.boolean(),
    renderPreset: z.enum(['balanced', 'publish', 'high-detail']),
  }),
  textOverlays: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().trim().min(1).max(400),
      fontFamily: z.enum(['sans-serif', 'serif', 'mono']),
      fontSize: z.number().int().min(10).max(220),
      color: z.string().trim().min(1).max(64),
      bgColor: z.string().trim().min(1).max(64).nullable(),
      position: z.enum(['top', 'center', 'bottom']),
      startSeconds: z.number().min(0),
      endSeconds: z.number().min(0),
    }),
  ),
  imageOverlays: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().trim().min(1).max(240),
      storagePath: z.string().trim().min(1).max(600).nullable(),
      objectUrl: z.string().trim().min(1).max(2000).nullable(),
      position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']),
      opacity: z.number().min(0).max(1),
      startSeconds: z.number().min(0),
      endSeconds: z.number().min(0),
    }),
  ),
  videoEffects: z.object({
    brightness: z.number().int().min(-100).max(100),
    contrast: z.number().int().min(-100).max(100),
    saturation: z.number().int().min(-100).max(100),
    blur: z.number().int().min(0).max(100),
  }),
})

export const recordingSessionSchema = z.object({
  projectId: z.string().uuid(),
  sources: z.object({
    screen: z.boolean(),
    camera: z.boolean(),
    microphone: z.boolean(),
  }),
  clientHints: z
    .object({
      userAgent: z.string().trim().min(1).max(300).optional(),
      timezone: z.string().trim().min(1).max(120).optional(),
    })
    .optional(),
})

export const createVideoUploadSessionSchema = z.object({
  projectId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(260),
  contentType: z.string().trim().min(1).max(140),
  contentLength: z.number().int().min(1),
  sourceType: z.enum(['recorded', 'uploaded', 'imported']),
})

export const completeVideoUploadSchema = z.object({
  uploadId: z.string().uuid(),
  projectId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(260),
  contentType: z.string().trim().min(1).max(140),
  sourceType: z.enum(['recorded', 'uploaded', 'imported']),
})

export const queueVideoJobSchema = z.object({
  projectId: z.string().uuid(),
})

export const duplicateVideoProjectSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(140).optional(),
})

export const deleteVideoProjectSchema = z.object({
  projectId: z.string().uuid(),
})
