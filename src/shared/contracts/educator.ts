import type { JobRecord } from './jobs'
import type { LessonBindingType } from './video-studio'

export type CourseStatus = 'draft' | 'published' | 'archived'
export type CertificateTemplateStatus = 'draft' | 'published' | 'archived'
export type CertificateIssueStatus = 'issued' | 'reissued' | 'revoked' | 'failed'
export type VideoProjectLifecycleStatus = 'draft' | 'published' | 'archived'
export type VideoProjectExportStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed'

export type CourseLessonType = 'lesson' | 'video' | 'quiz' | 'resource'

export type CourseLessonInput = {
  id?: string
  title: string
  content: string
  lessonType: CourseLessonType
  videoProjectId: string | null
  certificateTemplateId: string | null
  position: number
  durationSeconds: number
  status: CourseStatus
  metadata: Record<string, unknown>
}

export type CourseModuleInput = {
  id?: string
  title: string
  detail: string
  position: number
  lessons: CourseLessonInput[]
}

export type CourseLessonRecord = CourseLessonInput & {
  id: string
  moduleId: string
  createdAt: string
  updatedAt: string
}

export type CourseModuleRecord = {
  id: string
  title: string
  detail: string
  position: number
  lessons: CourseLessonRecord[]
  createdAt: string
  updatedAt: string
}

export type CourseRecord = {
  id: string
  ownerId: string
  title: string
  description: string
  status: CourseStatus
  publishedAt: string | null
  archivedAt: string | null
  defaultCertificateTemplateId: string | null
  createdAt: string
  updatedAt: string
}

export type CourseTree = {
  course: CourseRecord
  modules: CourseModuleRecord[]
}

export type CourseListItem = {
  id: string
  title: string
  description: string
  status: CourseStatus
  moduleCount: number
  lessonCount: number
  updatedAt: string
}

export type CreateCourseInput = {
  title: string
  description?: string
}

export type SaveCourseTreeInput = {
  courseId: string
  title: string
  description: string
  status: CourseStatus
  defaultCertificateTemplateId: string | null
  modules: CourseModuleInput[]
}

export type UpdateCourseStatusInput = {
  courseId: string
  status: CourseStatus
}

export type DuplicateCourseInput = {
  courseId: string
  title?: string
}

export type CompleteEnrollmentInput = {
  enrollmentId: string
}

export type CertificateTemplateRecord = {
  id: string
  ownerUserId: string
  title: string
  description: string
  layout: Record<string, unknown>
  config: Record<string, unknown>
  brandingLogoBucket: string | null
  brandingLogoPath: string | null
  status: CertificateTemplateStatus
  createdAt: string
  updatedAt: string
}

export type CertificateTemplateInput = {
  title: string
  description: string
  layout: Record<string, unknown>
  config: Record<string, unknown>
  brandingLogoBucket: string | null
  brandingLogoPath: string | null
  status: CertificateTemplateStatus
}

export type UpdateCertificateTemplateInput = {
  templateId: string
} & CertificateTemplateInput

export type DuplicateCertificateTemplateInput = {
  templateId: string
  title?: string
}

export type IssueCertificateInput = {
  templateId: string
  learnerId: string
  courseId: string
}

export type ReissueCertificateInput = {
  issueId: string
}

export type CertificateIssueRecord = {
  id: string
  certificateTemplateId: string
  learnerId: string
  courseId: string
  issuedByUserId: string | null
  verificationCode: string
  pdfBucket: string | null
  pdfPath: string | null
  status: CertificateIssueStatus
  reissuedFromIssueId: string | null
  metadata: Record<string, unknown>
  issuedAt: string
  createdAt: string
  updatedAt: string
}

export type MediaSourceModule = 'video' | 'course' | 'certificate' | 'dashboard' | 'system'
export type MediaAssetType = 'video' | 'audio' | 'image' | 'subtitle' | 'document' | 'other'

export type MediaItemRecord = {
  id: string
  ownerUserId: string
  sourceModule: MediaSourceModule
  assetType: MediaAssetType
  fileName: string
  fileType: string | null
  sizeBytes: number
  storageBucket: string | null
  storagePath: string | null
  variant: string
  linkedEntityType: string | null
  linkedEntityId: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type ListMediaLibraryInput = {
  module?: MediaSourceModule
  assetType?: MediaAssetType
  linkedEntityType?: string
  linkedEntityId?: string
  limit?: number
}

export type ReuseMediaItemInput = {
  mediaItemId: string
  linkedEntityType: string
  linkedEntityId: string
}

export type ActivityLogRecord = {
  id: string
  userId: string
  module: string
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export type EducatorDashboardMetrics = {
  totalCourses: number
  totalPublishedCourses: number
  totalVideoProjects: number
  totalCertificateTemplates: number
  totalCertificatesIssued: number
  totalDraftItems: number
  storageBytes: number
}

export type EducatorDashboardSnapshot = {
  metrics: EducatorDashboardMetrics
  recentActivity: ActivityLogRecord[]
  recentJobs: JobRecord[]
}

export type VerifyCertificateRecord = {
  verificationCode: string
  certificateStatus: 'issued' | 'reissued'
  issuedAt: string
  certificateTitle: string
  courseTitle: string
  learnerName: string
}

export type VideoProjectListItem = {
  id: string
  title: string
  bindingType: LessonBindingType
  bindingTargetId: string | null
  status: VideoProjectLifecycleStatus
  exportStatus: VideoProjectExportStatus
  updatedAt: string
  createdAt: string
}
