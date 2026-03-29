import { z } from 'zod'

const uuidSchema = z.string().uuid()
const jsonSchema = z.record(z.string(), z.unknown())

const courseStatusSchema = z.enum(['draft', 'published', 'archived'])
const lessonTypeSchema = z.enum(['lesson', 'video', 'quiz', 'resource'])
const certificateTemplateStatusSchema = z.enum(['draft', 'published', 'archived'])
const mediaSourceModuleSchema = z.enum(['video', 'course', 'certificate', 'dashboard', 'system'])
const mediaAssetTypeSchema = z.enum(['video', 'audio', 'image', 'subtitle', 'document', 'other'])

export const createCourseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000).optional(),
})

export const saveCourseTreeSchema = z.object({
  courseId: uuidSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000),
  status: courseStatusSchema,
  defaultCertificateTemplateId: uuidSchema.nullable(),
  modules: z.array(
    z.object({
      id: uuidSchema.optional(),
      title: z.string().trim().min(1).max(200),
      detail: z.string().trim().max(10_000),
      position: z.number().int().min(0),
      lessons: z.array(
        z.object({
          id: uuidSchema.optional(),
          title: z.string().trim().min(1).max(200),
          content: z.string().trim().max(30_000),
          lessonType: lessonTypeSchema,
          videoProjectId: uuidSchema.nullable(),
          certificateTemplateId: uuidSchema.nullable(),
          position: z.number().int().min(0),
          durationSeconds: z.number().int().min(0),
          status: courseStatusSchema,
          metadata: jsonSchema,
        }),
      ),
    }),
  ),
})

export const updateCourseStatusSchema = z.object({
  courseId: uuidSchema,
  status: courseStatusSchema,
})

export const duplicateCourseSchema = z.object({
  courseId: uuidSchema,
  title: z.string().trim().min(1).max(200).optional(),
})

export const getCourseSchema = z.object({
  courseId: uuidSchema,
})

export const deleteCourseSchema = z.object({
  courseId: uuidSchema,
})

export const completeEnrollmentSchema = z.object({
  enrollmentId: uuidSchema,
})

export const createCertificateTemplateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000),
  layout: jsonSchema,
  config: jsonSchema,
  brandingLogoBucket: z.string().trim().min(1).max(120).nullable(),
  brandingLogoPath: z.string().trim().min(1).max(500).nullable(),
  status: certificateTemplateStatusSchema,
})

export const updateCertificateTemplateSchema = createCertificateTemplateSchema.extend({
  templateId: uuidSchema,
})

export const duplicateCertificateTemplateSchema = z.object({
  templateId: uuidSchema,
  title: z.string().trim().min(1).max(200).optional(),
})

export const deleteCertificateTemplateSchema = z.object({
  templateId: uuidSchema,
})

export const getCertificateTemplateSchema = z.object({
  templateId: uuidSchema,
})

export const issueCertificateSchema = z.object({
  templateId: uuidSchema,
  learnerId: uuidSchema,
  courseId: uuidSchema,
})

export const reissueCertificateSchema = z.object({
  issueId: uuidSchema,
})

export const getCertificateIssueSchema = z.object({
  issueId: uuidSchema,
})

export const listMediaLibrarySchema = z.object({
  module: mediaSourceModuleSchema.optional(),
  assetType: mediaAssetTypeSchema.optional(),
  linkedEntityType: z.string().trim().min(1).max(120).optional(),
  linkedEntityId: uuidSchema.optional(),
  limit: z.number().int().min(1).max(200).optional(),
})

export const reuseMediaItemSchema = z.object({
  mediaItemId: uuidSchema,
  linkedEntityType: z.string().trim().min(1).max(120),
  linkedEntityId: uuidSchema,
})

export const listVideoProjectsSchema = z.object({})

export const duplicateVideoProjectSchema = z.object({
  projectId: uuidSchema,
  title: z.string().trim().min(1).max(140).optional(),
})

export const deleteVideoProjectSchema = z.object({
  projectId: uuidSchema,
})
