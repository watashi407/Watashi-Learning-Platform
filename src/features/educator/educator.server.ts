import { randomUUID } from 'node:crypto'
import { ensureProfileProvisioned } from '../auth/auth.server'
import { createJob, updateJob } from '../../lib/backend/jobs'
import { triggerJobTask } from '../../lib/backend/trigger'
import { createServiceSupabaseClient } from '../../lib/supabase/server'
import { hasSupabaseConfig, hasTriggerConfig } from '../../server/env'
import type { AuthSession } from '../../shared/contracts/auth'
import type {
  ActivityLogRecord,
  CertificateIssueRecord,
  CertificateTemplateInput,
  CertificateTemplateRecord,
  CompleteEnrollmentInput,
  CourseListItem,
  CourseRecord,
  CourseTree,
  CreateCourseInput,
  DuplicateCertificateTemplateInput,
  DuplicateCourseInput,
  EducatorDashboardSnapshot,
  IssueCertificateInput,
  ListMediaLibraryInput,
  MediaItemRecord,
  ReissueCertificateInput,
  ReuseMediaItemInput,
  SaveCourseTreeInput,
  UpdateCertificateTemplateInput,
  UpdateCourseStatusInput,
} from '../../shared/contracts/educator'
import type { JobRecord } from '../../shared/contracts/jobs'
import { AppError } from '../../shared/errors'
import {
  appendActivityLog,
  mapActivityRow,
  mapMediaRow,
  registerMediaItem,
} from './educator-infra.server'
import { isDatabaseUniqueViolation } from './educator-security'
import { buildCourseTreeDiff } from './course-tree-diff'

type CourseRow = {
  id: string
  owner_id: string
  title: string
  description: string
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  archived_at: string | null
  default_certificate_template_id: string | null
  created_at: string
  updated_at: string
}

type CourseModuleRow = {
  id: string
  course_id: string
  position: number
  title: string
  detail: string
  created_at: string
  updated_at: string
}

type CourseLessonRow = {
  id: string
  module_id: string
  title: string
  content: string
  lesson_type: 'lesson' | 'video' | 'quiz' | 'resource'
  video_project_id: string | null
  certificate_template_id: string | null
  position: number
  duration_seconds: number
  status: 'draft' | 'published' | 'archived'
  metadata_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

type CertificateTemplateRow = {
  id: string
  owner_user_id: string
  title: string
  description: string
  layout_json: Record<string, unknown>
  config_json: Record<string, unknown>
  branding_logo_bucket: string | null
  branding_logo_path: string | null
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
}

type CertificateIssueRow = {
  id: string
  certificate_template_id: string
  learner_id: string
  course_id: string
  issued_by_user_id: string | null
  verification_code: string
  pdf_bucket: string | null
  pdf_path: string | null
  status: 'issued' | 'reissued' | 'revoked' | 'failed'
  reissued_from_issue_id: string | null
  metadata_json: Record<string, unknown>
  issued_at: string
  created_at: string
  updated_at: string
}

type CertificateGeneratePayload = {
  templateId: string
  learnerId: string
  courseId: string
  issuedByUserId: string | null
  reason: 'manual' | 'completion' | 'reissue'
  reissuedFromIssueId?: string | null
}

type CertificateReissuePayload = {
  issueId: string
  issuedByUserId: string | null
}

type EnrollmentRow = {
  id: string
  learner_id: string
  course_id: string
  status: 'active' | 'completed' | 'paused'
  completed_at: string | null
}

type EducatorDashboardMetricsRow = {
  total_courses: number | string | null
  total_published_courses: number | string | null
  total_video_projects: number | string | null
  total_certificate_templates: number | string | null
  total_certificates_issued: number | string | null
  total_draft_items: number | string | null
  storage_bytes: number | string | null
}

function assertSupabaseConfigured(requestId: string) {
  if (!hasSupabaseConfig()) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Educator services are not configured right now.', { requestId })
  }
}

function assertEducatorRole(user: AuthSession, requestId: string) {
  if (user.role !== 'educator' && user.role !== 'admin') {
    throw new AppError('FORBIDDEN', 'You do not have permission to use educator operations.', { requestId })
  }
}

function mapCourseRow(row: CourseRow): CourseRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    status: row.status,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    defaultCertificateTemplateId: row.default_certificate_template_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapTemplateRow(row: CertificateTemplateRow): CertificateTemplateRecord {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    title: row.title,
    description: row.description,
    layout: row.layout_json ?? {},
    config: row.config_json ?? {},
    brandingLogoBucket: row.branding_logo_bucket,
    brandingLogoPath: row.branding_logo_path,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapIssueRow(row: CertificateIssueRow): CertificateIssueRecord {
  return {
    id: row.id,
    certificateTemplateId: row.certificate_template_id,
    learnerId: row.learner_id,
    courseId: row.course_id,
    issuedByUserId: row.issued_by_user_id,
    verificationCode: row.verification_code,
    pdfBucket: row.pdf_bucket,
    pdfPath: row.pdf_path,
    status: row.status,
    reissuedFromIssueId: row.reissued_from_issue_id,
    metadata: row.metadata_json ?? {},
    issuedAt: row.issued_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function ensureEducatorProfile(user: AuthSession, requestId: string) {
  try {
    await ensureProfileProvisioned({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not provision your profile for educator operations.', {
      requestId,
      cause: error,
    })
  }
}

async function getOwnedCourseRow(courseId: string, user: AuthSession, requestId: string): Promise<CourseRow> {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('courses')
    .select('id, owner_id, title, description, status, published_at, archived_at, default_certificate_template_id, created_at, updated_at')
    .eq('id', courseId)
    .single()

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Course not found.', { requestId, cause: error })
  }

  const row = data as CourseRow
  if (user.role !== 'admin' && row.owner_id !== user.id) {
    throw new AppError('FORBIDDEN', 'You can only manage your own courses.', { requestId })
  }

  return row
}

async function getOwnedTemplateRow(templateId: string, user: AuthSession, requestId: string): Promise<CertificateTemplateRow> {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('certificate_templates')
    .select('id, owner_user_id, title, description, layout_json, config_json, branding_logo_bucket, branding_logo_path, status, created_at, updated_at')
    .eq('id', templateId)
    .single()

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Certificate template not found.', { requestId, cause: error })
  }

  const row = data as CertificateTemplateRow
  if (user.role !== 'admin' && row.owner_user_id !== user.id) {
    throw new AppError('FORBIDDEN', 'You can only manage your own certificate templates.', { requestId })
  }

  return row
}

async function getCourseTreeById(courseId: string, user: AuthSession, requestId: string): Promise<CourseTree> {
  const courseRow = await getOwnedCourseRow(courseId, user, requestId)
  const supabase = createServiceSupabaseClient()

  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('id, course_id, position, title, detail, created_at, updated_at')
    .eq('course_id', courseId)
    .order('position', { ascending: true })

  if (modulesError) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load course modules.', {
      requestId,
      cause: modulesError,
    })
  }

  const moduleIds = ((modules ?? []) as CourseModuleRow[]).map((module) => module.id)
  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('id, module_id, title, content, lesson_type, video_project_id, certificate_template_id, position, duration_seconds, status, metadata_json, created_at, updated_at')
    .in('module_id', moduleIds.length > 0 ? moduleIds : ['00000000-0000-0000-0000-000000000000'])
    .order('position', { ascending: true })

  if (lessonsError) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load course lessons.', {
      requestId,
      cause: lessonsError,
    })
  }

  const lessonRows = (lessons ?? []) as CourseLessonRow[]
  const modulesById = new Map<string, CourseLessonRow[]>()
  for (const lesson of lessonRows) {
    const group = modulesById.get(lesson.module_id) ?? []
    group.push(lesson)
    modulesById.set(lesson.module_id, group)
  }

  return {
    course: mapCourseRow(courseRow),
    modules: ((modules ?? []) as CourseModuleRow[]).map((moduleRow) => ({
      id: moduleRow.id,
      title: moduleRow.title,
      detail: moduleRow.detail,
      position: Number(moduleRow.position ?? 0),
      lessons: (modulesById.get(moduleRow.id) ?? []).map((lessonRow) => ({
        id: lessonRow.id,
        moduleId: lessonRow.module_id,
        title: lessonRow.title,
        content: lessonRow.content,
        lessonType: lessonRow.lesson_type,
        videoProjectId: lessonRow.video_project_id,
        certificateTemplateId: lessonRow.certificate_template_id,
        position: Number(lessonRow.position ?? 0),
        durationSeconds: Number(lessonRow.duration_seconds ?? 0),
        status: lessonRow.status,
        metadata: lessonRow.metadata_json ?? {},
        createdAt: lessonRow.created_at,
        updatedAt: lessonRow.updated_at,
      })),
      createdAt: moduleRow.created_at,
      updatedAt: moduleRow.updated_at,
    })),
  }
}

function toCertificateFilePath(courseId: string, learnerId: string, verificationCode: string) {
  return `${courseId}/${learnerId}/${verificationCode}.pdf`
}

async function createCertificatePdfBytes(args: {
  learnerName: string
  courseTitle: string
  templateTitle: string
  issuedAtIso: string
  verificationCode: string
}) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  const page = doc.addPage([1200, 850])
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const issuedDate = new Date(args.issuedAtIso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  page.drawRectangle({
    x: 30,
    y: 30,
    width: 1140,
    height: 790,
    borderWidth: 2,
    borderColor: rgb(0.18, 0.22, 0.3),
    color: rgb(0.98, 0.99, 1),
  })

  page.drawText(args.templateTitle, {
    x: 80,
    y: 730,
    size: 40,
    font: fontBold,
    color: rgb(0.12, 0.18, 0.34),
  })

  page.drawText('This certifies that', {
    x: 80,
    y: 645,
    size: 28,
    font: fontRegular,
    color: rgb(0.2, 0.23, 0.3),
  })

  page.drawText(args.learnerName, {
    x: 80,
    y: 585,
    size: 54,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.22),
  })

  page.drawText(`has completed ${args.courseTitle}`, {
    x: 80,
    y: 525,
    size: 26,
    font: fontRegular,
    color: rgb(0.22, 0.25, 0.32),
  })

  page.drawText(`Issued: ${issuedDate}`, {
    x: 80,
    y: 430,
    size: 20,
    font: fontRegular,
    color: rgb(0.24, 0.26, 0.31),
  })

  page.drawText(`Verification Code: ${args.verificationCode}`, {
    x: 80,
    y: 390,
    size: 20,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.32),
  })

  return Buffer.from(await doc.save())
}

async function generateUniqueVerificationCode() {
  return randomUUID().replace(/-/g, '').slice(0, 18).toUpperCase()
}

async function getActiveCertificateIssue(
  templateId: string,
  learnerId: string,
  courseId: string,
): Promise<CertificateIssueRow | null> {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('certificate_issues')
    .select('id, certificate_template_id, learner_id, course_id, issued_by_user_id, verification_code, pdf_bucket, pdf_path, status, reissued_from_issue_id, metadata_json, issued_at, created_at, updated_at')
    .eq('certificate_template_id', templateId)
    .eq('learner_id', learnerId)
    .eq('course_id', courseId)
    .in('status', ['issued', 'reissued'])
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data ?? null) as CertificateIssueRow | null
}

async function loadEducatorDashboardMetricsFallback(userId: string): Promise<EducatorDashboardMetricsRow> {
  const supabase = createServiceSupabaseClient()
  const [coursesRes, videosRes, templatesRes, mediaRes] = await Promise.all([
    supabase.from('courses').select('id, status').eq('owner_id', userId),
    supabase.from('video_projects').select('id, status').eq('owner_user_id', userId),
    supabase.from('certificate_templates').select('id, status').eq('owner_user_id', userId),
    supabase.from('media_library').select('size_bytes').eq('owner_user_id', userId),
  ])

  if (coursesRes.error || videosRes.error || templatesRes.error || mediaRes.error) {
    throw coursesRes.error ?? videosRes.error ?? templatesRes.error ?? mediaRes.error ?? new Error('Failed to load dashboard metrics.')
  }

  const templateIds = ((templatesRes.data ?? []) as Array<{ id: string }>).map((row) => row.id)
  const issuesRes = await supabase
    .from('certificate_issues')
    .select('id')
    .in('certificate_template_id', templateIds.length > 0 ? templateIds : ['00000000-0000-0000-0000-000000000000'])

  if (issuesRes.error) {
    throw issuesRes.error
  }

  const courses = (coursesRes.data ?? []) as Array<{ status: 'draft' | 'published' | 'archived' }>
  const videos = (videosRes.data ?? []) as Array<{ status: 'draft' | 'published' | 'archived' }>
  const templates = (templatesRes.data ?? []) as Array<{ status: 'draft' | 'published' | 'archived' }>
  const storageBytes = ((mediaRes.data ?? []) as Array<{ size_bytes: number }>).reduce((sum, row) => sum + Number(row.size_bytes ?? 0), 0)

  return {
    total_courses: courses.length,
    total_published_courses: courses.filter((course) => course.status === 'published').length,
    total_video_projects: videos.length,
    total_certificate_templates: templates.length,
    total_certificates_issued: (issuesRes.data ?? []).length,
    total_draft_items:
      courses.filter((course) => course.status === 'draft').length
      + videos.filter((video) => video.status === 'draft').length
      + templates.filter((template) => template.status === 'draft').length,
    storage_bytes: storageBytes,
  }
}

async function queueCertificateGenerateJob(user: AuthSession, payload: CertificateGeneratePayload, requestId: string): Promise<JobRecord> {
  const job = await createJob({
    type: 'certificate-generate',
    userId: user.id,
    userEmail: user.email,
    payload,
  })

  if (hasTriggerConfig()) {
    const runHandle = await triggerJobTask('watashi-certificate-generate', {
      jobId: job.id,
      payload,
    })

    if (runHandle?.id) {
      const updated = await updateJob(job.id, { status: 'queued', taskId: runHandle.id, error: null })
      return updated ?? job
    }
  }

  await updateJob(job.id, { status: 'running', error: null })
  try {
    const result = await processCertificateGenerate(payload)
    const updated = await updateJob(job.id, { status: 'completed', result, error: null })
    return updated ?? job
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Certificate generation failed.'
    const updated = await updateJob(job.id, { status: 'failed', error: message })
    return updated ?? job
  }
}

async function queueCertificateReissueJob(user: AuthSession, payload: CertificateReissuePayload): Promise<JobRecord> {
  const job = await createJob({
    type: 'certificate-reissue',
    userId: user.id,
    userEmail: user.email,
    payload,
  })

  if (hasTriggerConfig()) {
    const runHandle = await triggerJobTask('watashi-certificate-reissue', {
      jobId: job.id,
      payload,
    })

    if (runHandle?.id) {
      const updated = await updateJob(job.id, { status: 'queued', taskId: runHandle.id, error: null })
      return updated ?? job
    }
  }

  await updateJob(job.id, { status: 'running', error: null })
  try {
    const result = await processCertificateReissue(payload)
    const updated = await updateJob(job.id, { status: 'completed', result, error: null })
    return updated ?? job
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Certificate reissue failed.'
    const updated = await updateJob(job.id, { status: 'failed', error: message })
    return updated ?? job
  }
}

export async function createCourse(user: AuthSession, input: CreateCourseInput, requestId: string): Promise<CourseTree> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  await ensureEducatorProfile(user, requestId)

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('courses')
    .insert({
      owner_id: user.id,
      title: input.title,
      description: input.description ?? '',
      status: 'draft',
    })
    .select('id, owner_id, title, description, status, published_at, archived_at, default_certificate_template_id, created_at, updated_at')
    .single()

  if (error || !data) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not create the course.', { requestId, cause: error })
  }

  await appendActivityLog({
    userId: user.id,
    module: 'course',
    action: 'create_course',
    entityType: 'course',
    entityId: String((data as CourseRow).id),
    metadata: { title: input.title },
  })

  return {
    course: mapCourseRow(data as CourseRow),
    modules: [],
  }
}

export async function saveCourseTree(user: AuthSession, input: SaveCourseTreeInput, requestId: string): Promise<CourseTree> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const courseRow = await getOwnedCourseRow(input.courseId, user, requestId)
  const supabase = createServiceSupabaseClient()
  const now = new Date().toISOString()

  const nextPublishedAt = input.status === 'published' ? (courseRow.published_at ?? now) : null
  const nextArchivedAt = input.status === 'archived' ? now : null

  const { error: updateCourseError } = await supabase
    .from('courses')
    .update({
      title: input.title,
      description: input.description,
      status: input.status,
      published_at: nextPublishedAt,
      archived_at: nextArchivedAt,
      default_certificate_template_id: input.defaultCertificateTemplateId,
      updated_at: now,
    })
    .eq('id', input.courseId)
    .eq('owner_id', courseRow.owner_id)

  if (updateCourseError) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not update the course.', { requestId, cause: updateCourseError })
  }

  const { data: existingModules, error: existingModulesError } = await supabase
    .from('course_modules')
    .select('id')
    .eq('course_id', input.courseId)

  if (existingModulesError) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load current course modules.', { requestId, cause: existingModulesError })
  }

  const existingModuleRows = (existingModules ?? []) as Array<{ id: string }>
  const existingModuleIds = existingModuleRows.map((row) => row.id)
  const { data: existingLessons, error: existingLessonsError } = await supabase
    .from('course_lessons')
    .select('id, module_id')
    .in('module_id', existingModuleIds.length > 0 ? existingModuleIds : ['00000000-0000-0000-0000-000000000000'])

  if (existingLessonsError) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load current course lessons.', { requestId, cause: existingLessonsError })
  }

  const {
    normalizedModules,
    lessonRows,
    staleModuleIds,
    staleLessonIds,
  } = buildCourseTreeDiff({
    courseId: input.courseId,
    modules: input.modules,
    existingModules: existingModuleRows,
    existingLessons: (existingLessons ?? []) as Array<{ id: string; module_id: string }>,
    now,
  })

  if (staleLessonIds.length > 0) {
    const { error: deleteLessonsError } = await supabase.from('course_lessons').delete().in('id', staleLessonIds)
    if (deleteLessonsError) {
      throw new AppError('SERVICE_UNAVAILABLE', 'We could not remove deleted course lessons.', { requestId, cause: deleteLessonsError })
    }
  }

  if (normalizedModules.length > 0) {
    const { error: upsertModulesError } = await supabase.from('course_modules').upsert(normalizedModules, { onConflict: 'id' })
    if (upsertModulesError) {
      throw new AppError('SERVICE_UNAVAILABLE', 'We could not save course modules.', { requestId, cause: upsertModulesError })
    }
  }

  if (lessonRows.length > 0) {
    const { error: upsertLessonsError } = await supabase.from('course_lessons').upsert(lessonRows, { onConflict: 'id' })
    if (upsertLessonsError) {
      throw new AppError('SERVICE_UNAVAILABLE', 'We could not save course lessons.', { requestId, cause: upsertLessonsError })
    }
  }

  if (staleModuleIds.length > 0) {
    const { error: deleteModulesError } = await supabase.from('course_modules').delete().in('id', staleModuleIds)
    if (deleteModulesError) {
      throw new AppError('SERVICE_UNAVAILABLE', 'We could not remove deleted course modules.', { requestId, cause: deleteModulesError })
    }
  }

  await appendActivityLog({
    userId: user.id,
    module: 'course',
    action: 'save_course_tree',
    entityType: 'course',
    entityId: input.courseId,
    metadata: {
      moduleCount: input.modules.length,
      lessonCount: lessonRows.length,
      status: input.status,
    },
  })

  return await getCourseTreeById(input.courseId, user, requestId)
}

export async function updateCourseStatus(user: AuthSession, input: UpdateCourseStatusInput, requestId: string): Promise<CourseRecord> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const courseRow = await getOwnedCourseRow(input.courseId, user, requestId)
  const now = new Date().toISOString()

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('courses')
    .update({
      status: input.status,
      published_at: input.status === 'published' ? (courseRow.published_at ?? now) : null,
      archived_at: input.status === 'archived' ? now : null,
      updated_at: now,
    })
    .eq('id', input.courseId)
    .eq('owner_id', courseRow.owner_id)
    .select('id, owner_id, title, description, status, published_at, archived_at, default_certificate_template_id, created_at, updated_at')
    .single()

  if (error || !data) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not update course status.', { requestId, cause: error })
  }

  await appendActivityLog({
    userId: user.id,
    module: 'course',
    action: 'update_course_status',
    entityType: 'course',
    entityId: input.courseId,
    metadata: { status: input.status },
  })

  return mapCourseRow(data as CourseRow)
}

export async function duplicateCourse(user: AuthSession, input: DuplicateCourseInput, requestId: string): Promise<CourseTree> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const source = await getCourseTreeById(input.courseId, user, requestId)
  const duplicate = await createCourse(user, {
    title: input.title ?? `${source.course.title} (Copy)`,
    description: source.course.description,
  }, requestId)

  return await saveCourseTree(user, {
    courseId: duplicate.course.id,
    title: duplicate.course.title,
    description: source.course.description,
    status: 'draft',
    defaultCertificateTemplateId: source.course.defaultCertificateTemplateId,
    modules: source.modules.map((module) => ({
      title: module.title,
      detail: module.detail,
      position: module.position,
      lessons: module.lessons.map((lesson) => ({
        title: lesson.title,
        content: lesson.content,
        lessonType: lesson.lessonType,
        videoProjectId: lesson.videoProjectId,
        certificateTemplateId: lesson.certificateTemplateId,
        position: lesson.position,
        durationSeconds: lesson.durationSeconds,
        status: lesson.status,
        metadata: lesson.metadata,
      })),
    })),
  }, requestId)
}

export async function deleteCourse(user: AuthSession, courseId: string, requestId: string): Promise<{ deleted: true }> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const courseRow = await getOwnedCourseRow(courseId, user, requestId)
  const supabase = createServiceSupabaseClient()
  const { error } = await supabase.from('courses').delete().eq('id', courseId).eq('owner_id', courseRow.owner_id)
  if (error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not delete the course.', { requestId, cause: error })
  }

  await appendActivityLog({
    userId: user.id,
    module: 'course',
    action: 'delete_course',
    entityType: 'course',
    entityId: courseId,
  })

  return { deleted: true }
}

export async function getCourse(user: AuthSession, courseId: string, requestId: string): Promise<CourseTree> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  return await getCourseTreeById(courseId, user, requestId)
}

export async function listCourses(user: AuthSession, requestId: string): Promise<CourseListItem[]> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const supabase = createServiceSupabaseClient()
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, owner_id, title, description, status, published_at, archived_at, default_certificate_template_id, created_at, updated_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  if (coursesError) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load courses.', { requestId, cause: coursesError })
  }

  const courseIds = ((courses ?? []) as CourseRow[]).map((course) => course.id)
  const { data: moduleRows, error: moduleError } = await supabase
    .from('course_modules')
    .select('id, course_id')
    .in('course_id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])

  if (moduleError) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load module counts.', { requestId, cause: moduleError })
  }

  const moduleIds = ((moduleRows ?? []) as Array<{ id: string; course_id: string }>).map((module) => module.id)
  const { data: lessonRows, error: lessonError } = await supabase
    .from('course_lessons')
    .select('id, module_id')
    .in('module_id', moduleIds.length > 0 ? moduleIds : ['00000000-0000-0000-0000-000000000000'])

  if (lessonError) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load lesson counts.', { requestId, cause: lessonError })
  }

  const moduleCountByCourse = new Map<string, number>()
  for (const module of (moduleRows ?? []) as Array<{ id: string; course_id: string }>) {
    moduleCountByCourse.set(module.course_id, (moduleCountByCourse.get(module.course_id) ?? 0) + 1)
  }

  const lessonCountByModule = new Map<string, number>()
  for (const lesson of (lessonRows ?? []) as Array<{ id: string; module_id: string }>) {
    lessonCountByModule.set(lesson.module_id, (lessonCountByModule.get(lesson.module_id) ?? 0) + 1)
  }

  const lessonCountByCourse = new Map<string, number>()
  for (const module of (moduleRows ?? []) as Array<{ id: string; course_id: string }>) {
    const current = lessonCountByCourse.get(module.course_id) ?? 0
    lessonCountByCourse.set(module.course_id, current + (lessonCountByModule.get(module.id) ?? 0))
  }

  return ((courses ?? []) as CourseRow[]).map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    status: course.status,
    moduleCount: moduleCountByCourse.get(course.id) ?? 0,
    lessonCount: lessonCountByCourse.get(course.id) ?? 0,
    updatedAt: course.updated_at,
  }))
}

export async function createCertificateTemplate(user: AuthSession, input: CertificateTemplateInput, requestId: string): Promise<CertificateTemplateRecord> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('certificate_templates')
    .insert({
      owner_user_id: user.id,
      title: input.title,
      description: input.description,
      layout_json: input.layout,
      config_json: input.config,
      branding_logo_bucket: input.brandingLogoBucket,
      branding_logo_path: input.brandingLogoPath,
      status: input.status,
    })
    .select('id, owner_user_id, title, description, layout_json, config_json, branding_logo_bucket, branding_logo_path, status, created_at, updated_at')
    .single()

  if (error || !data) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not create certificate template.', { requestId, cause: error })
  }

  await appendActivityLog({
    userId: user.id,
    module: 'certificate',
    action: 'create_template',
    entityType: 'certificate_template',
    entityId: String((data as CertificateTemplateRow).id),
  })

  return mapTemplateRow(data as CertificateTemplateRow)
}

export async function updateCertificateTemplate(user: AuthSession, input: UpdateCertificateTemplateInput, requestId: string): Promise<CertificateTemplateRecord> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const template = await getOwnedTemplateRow(input.templateId, user, requestId)
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from('certificate_templates')
    .update({
      title: input.title,
      description: input.description,
      layout_json: input.layout,
      config_json: input.config,
      branding_logo_bucket: input.brandingLogoBucket,
      branding_logo_path: input.brandingLogoPath,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', template.id)
    .eq('owner_user_id', template.owner_user_id)
    .select('id, owner_user_id, title, description, layout_json, config_json, branding_logo_bucket, branding_logo_path, status, created_at, updated_at')
    .single()

  if (error || !data) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not update certificate template.', { requestId, cause: error })
  }

  await appendActivityLog({
    userId: user.id,
    module: 'certificate',
    action: 'update_template',
    entityType: 'certificate_template',
    entityId: template.id,
  })

  return mapTemplateRow(data as CertificateTemplateRow)
}

export async function duplicateCertificateTemplate(user: AuthSession, input: DuplicateCertificateTemplateInput, requestId: string): Promise<CertificateTemplateRecord> {
  const template = await getOwnedTemplateRow(input.templateId, user, requestId)
  return await createCertificateTemplate(user, {
    title: input.title ?? `${template.title} (Copy)`,
    description: template.description,
    layout: template.layout_json ?? {},
    config: template.config_json ?? {},
    brandingLogoBucket: template.branding_logo_bucket,
    brandingLogoPath: template.branding_logo_path,
    status: 'draft',
  }, requestId)
}

export async function deleteCertificateTemplate(user: AuthSession, templateId: string, requestId: string): Promise<{ deleted: true }> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const template = await getOwnedTemplateRow(templateId, user, requestId)
  const supabase = createServiceSupabaseClient()
  const { error } = await supabase.from('certificate_templates').delete().eq('id', template.id).eq('owner_user_id', template.owner_user_id)
  if (error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not delete the certificate template.', { requestId, cause: error })
  }

  await appendActivityLog({
    userId: user.id,
    module: 'certificate',
    action: 'delete_template',
    entityType: 'certificate_template',
    entityId: templateId,
  })

  return { deleted: true }
}

export async function getCertificateTemplate(user: AuthSession, templateId: string, requestId: string): Promise<CertificateTemplateRecord> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const template = await getOwnedTemplateRow(templateId, user, requestId)
  return mapTemplateRow(template)
}

export async function listCertificateTemplates(user: AuthSession, requestId: string): Promise<CertificateTemplateRecord[]> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('certificate_templates')
    .select('id, owner_user_id, title, description, layout_json, config_json, branding_logo_bucket, branding_logo_path, status, created_at, updated_at')
    .eq('owner_user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load certificate templates.', { requestId, cause: error })
  }

  return ((data ?? []) as CertificateTemplateRow[]).map(mapTemplateRow)
}

export async function issueCertificate(user: AuthSession, input: IssueCertificateInput, requestId: string): Promise<{ job: JobRecord }> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  await getOwnedTemplateRow(input.templateId, user, requestId)
  await getOwnedCourseRow(input.courseId, user, requestId)

  const job = await queueCertificateGenerateJob(user, {
    templateId: input.templateId,
    learnerId: input.learnerId,
    courseId: input.courseId,
    issuedByUserId: user.id,
    reason: 'manual',
  }, requestId)

  return { job }
}

export async function reissueCertificate(user: AuthSession, input: ReissueCertificateInput, requestId: string): Promise<{ job: JobRecord }> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const issue = await getCertificateIssue(user, input.issueId, requestId)
  await getOwnedTemplateRow(issue.certificateTemplateId, user, requestId)

  const job = await queueCertificateReissueJob(user, {
    issueId: input.issueId,
    issuedByUserId: user.id,
  })

  return { job }
}

export async function getCertificateIssue(user: AuthSession, issueId: string, requestId: string): Promise<CertificateIssueRecord> {
  assertSupabaseConfigured(requestId)
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('certificate_issues')
    .select('id, certificate_template_id, learner_id, course_id, issued_by_user_id, verification_code, pdf_bucket, pdf_path, status, reissued_from_issue_id, metadata_json, issued_at, created_at, updated_at')
    .eq('id', issueId)
    .single()

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Certificate issue not found.', { requestId, cause: error })
  }

  const issue = data as CertificateIssueRow
  if (user.role === 'admin' || issue.learner_id === user.id) {
    return mapIssueRow(issue)
  }

  const { data: templateData, error: templateError } = await supabase
    .from('certificate_templates')
    .select('owner_user_id')
    .eq('id', issue.certificate_template_id)
    .single()

  if (templateError || !templateData) {
    throw new AppError('NOT_FOUND', 'Certificate issue not found.', { requestId, cause: templateError })
  }

  if (String((templateData as { owner_user_id: string }).owner_user_id) !== user.id) {
    throw new AppError('FORBIDDEN', 'You do not have permission to access this certificate issue.', { requestId })
  }

  return mapIssueRow(issue)
}

export async function listCertificateIssues(user: AuthSession, requestId: string): Promise<CertificateIssueRecord[]> {
  assertSupabaseConfigured(requestId)
  const supabase = createServiceSupabaseClient()

  if (user.role === 'learner') {
    const { data, error } = await supabase
      .from('certificate_issues')
      .select('id, certificate_template_id, learner_id, course_id, issued_by_user_id, verification_code, pdf_bucket, pdf_path, status, reissued_from_issue_id, metadata_json, issued_at, created_at, updated_at')
      .eq('learner_id', user.id)
      .order('issued_at', { ascending: false })

    if (error) {
      throw new AppError('SERVICE_UNAVAILABLE', 'We could not load your certificate issues.', { requestId, cause: error })
    }

    return ((data ?? []) as CertificateIssueRow[]).map(mapIssueRow)
  }

  const { data: templates, error: templatesError } = await supabase
    .from('certificate_templates')
    .select('id')
    .eq('owner_user_id', user.id)

  if (templatesError) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load template ownership.', { requestId, cause: templatesError })
  }

  const templateIds = ((templates ?? []) as Array<{ id: string }>).map((row) => row.id)
  const { data, error } = await supabase
    .from('certificate_issues')
    .select('id, certificate_template_id, learner_id, course_id, issued_by_user_id, verification_code, pdf_bucket, pdf_path, status, reissued_from_issue_id, metadata_json, issued_at, created_at, updated_at')
    .in('certificate_template_id', templateIds.length > 0 ? templateIds : ['00000000-0000-0000-0000-000000000000'])
    .order('issued_at', { ascending: false })

  if (error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load certificate issues.', { requestId, cause: error })
  }

  return ((data ?? []) as CertificateIssueRow[]).map(mapIssueRow)
}

export async function completeEnrollment(user: AuthSession, input: CompleteEnrollmentInput, requestId: string): Promise<{ enrollmentId: string; status: 'completed'; certificateJob: JobRecord | null }> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const supabase = createServiceSupabaseClient()

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, learner_id, course_id, status, completed_at')
    .eq('id', input.enrollmentId)
    .single()

  if (enrollmentError || !enrollmentData) {
    throw new AppError('NOT_FOUND', 'Enrollment not found.', { requestId, cause: enrollmentError })
  }

  const enrollmentRow = enrollmentData as EnrollmentRow
  const courseRow = await getOwnedCourseRow(enrollmentRow.course_id, user, requestId)

  if (enrollmentRow.status === 'completed') {
    return {
      enrollmentId: enrollmentRow.id,
      status: 'completed',
      certificateJob: null,
    }
  }

  const now = new Date().toISOString()
  const { data: updatedEnrollment, error: updateError } = await supabase
    .from('enrollments')
    .update({
      status: 'completed',
      completed_at: enrollmentRow.completed_at ?? now,
      updated_at: now,
    })
    .eq('id', enrollmentRow.id)
    .neq('status', 'completed')
    .select('id, learner_id, course_id, status, completed_at')
    .maybeSingle()

  if (updateError) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not complete this enrollment.', { requestId, cause: updateError })
  }

  if (!updatedEnrollment) {
    return {
      enrollmentId: enrollmentRow.id,
      status: 'completed',
      certificateJob: null,
    }
  }

  await appendActivityLog({
    userId: user.id,
    module: 'course',
    action: 'complete_enrollment',
    entityType: 'enrollment',
    entityId: enrollmentRow.id,
    metadata: { courseId: enrollmentRow.course_id, learnerId: enrollmentRow.learner_id },
  })

  if (!courseRow.default_certificate_template_id) {
    return {
      enrollmentId: enrollmentRow.id,
      status: 'completed',
      certificateJob: null,
    }
  }

  const job = await queueCertificateGenerateJob(user, {
    templateId: courseRow.default_certificate_template_id,
    learnerId: enrollmentRow.learner_id,
    courseId: enrollmentRow.course_id,
    issuedByUserId: user.id,
    reason: 'completion',
  }, requestId)

  return {
    enrollmentId: enrollmentRow.id,
    status: 'completed',
    certificateJob: job,
  }
}

export async function listMediaLibrary(user: AuthSession, input: ListMediaLibraryInput, requestId: string): Promise<MediaItemRecord[]> {
  assertSupabaseConfigured(requestId)
  const supabase = createServiceSupabaseClient()
  let query = supabase
    .from('media_library')
    .select('id, owner_user_id, source_module, asset_type, file_name, file_type, size_bytes, storage_bucket, storage_path, variant, linked_entity_type, linked_entity_id, metadata_json, created_at, updated_at')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(input.limit ?? 50)

  if (input.module) {
    query = query.eq('source_module', input.module)
  }

  if (input.assetType) {
    query = query.eq('asset_type', input.assetType)
  }

  if (input.linkedEntityType) {
    query = query.eq('linked_entity_type', input.linkedEntityType)
  }

  if (input.linkedEntityId) {
    query = query.eq('linked_entity_id', input.linkedEntityId)
  }

  const { data, error } = await query
  if (error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load media library items.', { requestId, cause: error })
  }

  return ((data ?? []) as Array<{
    id: string
    owner_user_id: string
    source_module: 'video' | 'course' | 'certificate' | 'dashboard' | 'system'
    asset_type: 'video' | 'audio' | 'image' | 'subtitle' | 'document' | 'other'
    file_name: string
    file_type: string | null
    size_bytes: number
    storage_bucket: string | null
    storage_path: string | null
    variant: string
    linked_entity_type: string | null
    linked_entity_id: string | null
    metadata_json: Record<string, unknown>
    created_at: string
    updated_at: string
  }>).map(mapMediaRow)
}

export async function reuseMediaItem(user: AuthSession, input: ReuseMediaItemInput, requestId: string): Promise<MediaItemRecord> {
  assertSupabaseConfigured(requestId)
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('media_library')
    .update({
      linked_entity_type: input.linkedEntityType,
      linked_entity_id: input.linkedEntityId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.mediaItemId)
    .eq('owner_user_id', user.id)
    .select('id, owner_user_id, source_module, asset_type, file_name, file_type, size_bytes, storage_bucket, storage_path, variant, linked_entity_type, linked_entity_id, metadata_json, created_at, updated_at')
    .single()

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Media item not found.', { requestId, cause: error })
  }

  await appendActivityLog({
    userId: user.id,
    module: 'media',
    action: 'reuse_asset',
    entityType: 'media',
    entityId: input.mediaItemId,
    metadata: {
      linkedEntityType: input.linkedEntityType,
      linkedEntityId: input.linkedEntityId,
    },
  })

  return mapMediaRow(data as {
    id: string
    owner_user_id: string
    source_module: 'video' | 'course' | 'certificate' | 'dashboard' | 'system'
    asset_type: 'video' | 'audio' | 'image' | 'subtitle' | 'document' | 'other'
    file_name: string
    file_type: string | null
    size_bytes: number
    storage_bucket: string | null
    storage_path: string | null
    variant: string
    linked_entity_type: string | null
    linked_entity_id: string | null
    metadata_json: Record<string, unknown>
    created_at: string
    updated_at: string
  })
}

export async function getEducatorDashboardSnapshot(user: AuthSession, requestId: string): Promise<EducatorDashboardSnapshot> {
  assertEducatorRole(user, requestId)
  assertSupabaseConfigured(requestId)
  const supabase = createServiceSupabaseClient()

  const [
    metricsRes,
    activityRes,
    jobsRes,
  ] = await Promise.all([
    supabase
      .rpc('get_educator_dashboard_metrics', {
        owner_id_input: user.id,
      })
      .single(),
    supabase
      .from('activity_logs')
      .select('id, user_id, module, action, entity_type, entity_id, metadata_json, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('jobs')
      .select('id, type, status, user_id, user_email, payload, result, error, task_id, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (activityRes.error || jobsRes.error) {
    throw new AppError('SERVICE_UNAVAILABLE', 'We could not load educator dashboard data.', {
      requestId,
      cause: activityRes.error ?? jobsRes.error,
    })
  }

  const metricsRow = metricsRes.error
    ? await loadEducatorDashboardMetricsFallback(user.id)
    : (metricsRes.data ?? {
        total_courses: 0,
        total_published_courses: 0,
        total_video_projects: 0,
        total_certificate_templates: 0,
        total_certificates_issued: 0,
        total_draft_items: 0,
        storage_bytes: 0,
      }) as EducatorDashboardMetricsRow

  return {
    metrics: {
      totalCourses: Number(metricsRow.total_courses ?? 0),
      totalPublishedCourses: Number(metricsRow.total_published_courses ?? 0),
      totalVideoProjects: Number(metricsRow.total_video_projects ?? 0),
      totalCertificateTemplates: Number(metricsRow.total_certificate_templates ?? 0),
      totalCertificatesIssued: Number(metricsRow.total_certificates_issued ?? 0),
      totalDraftItems: Number(metricsRow.total_draft_items ?? 0),
      storageBytes: Number(metricsRow.storage_bytes ?? 0),
    },
    recentActivity: ((activityRes.data ?? []) as Array<{
      id: string
      user_id: string
      module: string
      action: string
      entity_type: string
      entity_id: string | null
      metadata_json: Record<string, unknown>
      created_at: string
    }>).map(mapActivityRow) as ActivityLogRecord[],
    recentJobs: ((jobsRes.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      type: row.type as JobRecord['type'],
      status: row.status as JobRecord['status'],
      userId: row.user_id ? String(row.user_id) : null,
      userEmail: row.user_email ? String(row.user_email) : null,
      payload: row.payload ?? null,
      result: row.result ?? null,
      error: row.error ? String(row.error) : null,
      taskId: row.task_id ? String(row.task_id) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    })),
  }
}

export async function processCertificateGenerate(payload: CertificateGeneratePayload): Promise<CertificateIssueRecord> {
  if (!hasSupabaseConfig()) {
    const issuedAt = new Date().toISOString()
    return {
      id: randomUUID(),
      certificateTemplateId: payload.templateId,
      learnerId: payload.learnerId,
      courseId: payload.courseId,
      issuedByUserId: payload.issuedByUserId,
      verificationCode: await generateUniqueVerificationCode(),
      pdfBucket: null,
      pdfPath: null,
      status: payload.reason === 'reissue' ? 'reissued' : 'issued',
      reissuedFromIssueId: payload.reissuedFromIssueId ?? null,
      metadata: { reason: payload.reason },
      issuedAt,
      createdAt: issuedAt,
      updatedAt: issuedAt,
    }
  }

  const supabase = createServiceSupabaseClient()
  const [templateRes, courseRes, learnerRes] = await Promise.all([
    supabase.from('certificate_templates').select('id, owner_user_id, title').eq('id', payload.templateId).single(),
    supabase.from('courses').select('id, title').eq('id', payload.courseId).single(),
    supabase.from('profiles').select('id, full_name').eq('id', payload.learnerId).single(),
  ])

  if (templateRes.error || !templateRes.data || courseRes.error || !courseRes.data || learnerRes.error || !learnerRes.data) {
    throw new Error('Certificate generation failed because required records were not found.')
  }

  const existingIssue = await getActiveCertificateIssue(payload.templateId, payload.learnerId, payload.courseId)
  if (existingIssue && payload.reason !== 'reissue') {
    return mapIssueRow(existingIssue)
  }

  if (payload.reason === 'reissue' && payload.reissuedFromIssueId) {
    const { error: revokeError } = await supabase
      .from('certificate_issues')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', payload.reissuedFromIssueId)

    if (revokeError) {
      throw revokeError
    }
  }

  const issuedAt = new Date().toISOString()
  const certificateBucket = 'certificates'
  const learnerName = String((learnerRes.data as { full_name: string }).full_name)
  const courseTitle = String((courseRes.data as { title: string }).title)
  const templateTitle = String((templateRes.data as { title: string }).title)

  let verificationCode = ''
  let pdfPath = ''
  let pdfBytes = Buffer.alloc(0)
  let data: CertificateIssueRow | null = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    verificationCode = await generateUniqueVerificationCode()
    pdfPath = toCertificateFilePath(payload.courseId, payload.learnerId, verificationCode)
    pdfBytes = await createCertificatePdfBytes({
      learnerName,
      courseTitle,
      templateTitle,
      issuedAtIso: issuedAt,
      verificationCode,
    })

    const uploadRes = await supabase.storage.from(certificateBucket).upload(pdfPath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })
    if (uploadRes.error) {
      throw uploadRes.error
    }

    const insertRes = await supabase
      .from('certificate_issues')
      .insert({
        certificate_template_id: payload.templateId,
        learner_id: payload.learnerId,
        course_id: payload.courseId,
        issued_by_user_id: payload.issuedByUserId,
        verification_code: verificationCode,
        pdf_bucket: certificateBucket,
        pdf_path: pdfPath,
        status: payload.reason === 'reissue' ? 'reissued' : 'issued',
        reissued_from_issue_id: payload.reissuedFromIssueId ?? null,
        metadata_json: { reason: payload.reason },
        issued_at: issuedAt,
      })
      .select('id, certificate_template_id, learner_id, course_id, issued_by_user_id, verification_code, pdf_bucket, pdf_path, status, reissued_from_issue_id, metadata_json, issued_at, created_at, updated_at')
      .single()

    if (!insertRes.error && insertRes.data) {
      data = insertRes.data as CertificateIssueRow
      break
    }

    if (isDatabaseUniqueViolation(insertRes.error, 'certificate_template_id')) {
      const duplicateIssue = await getActiveCertificateIssue(payload.templateId, payload.learnerId, payload.courseId)
      if (duplicateIssue) {
        return mapIssueRow(duplicateIssue)
      }
    }

    if (!isDatabaseUniqueViolation(insertRes.error, 'verification_code')) {
      throw insertRes.error ?? new Error('We could not create the certificate issue record.')
    }
  }

  if (!data) {
    throw new Error('We could not create the certificate issue record.')
  }

  await registerMediaItem({
    ownerUserId: String((templateRes.data as { owner_user_id: string }).owner_user_id),
    sourceModule: 'certificate',
    assetType: 'document',
    fileName: `${verificationCode}.pdf`,
    fileType: 'application/pdf',
    sizeBytes: pdfBytes.byteLength,
    storageBucket: certificateBucket,
    storagePath: pdfPath,
    variant: payload.reason === 'reissue' ? 'reissue' : 'issued',
    linkedEntityType: 'certificate_issue',
    linkedEntityId: String((data as CertificateIssueRow).id),
    metadata: {
      templateId: payload.templateId,
      learnerId: payload.learnerId,
      courseId: payload.courseId,
      verificationCode,
    },
  })

  if (payload.issuedByUserId) {
    await appendActivityLog({
      userId: payload.issuedByUserId,
      module: 'certificate',
      action: payload.reason === 'reissue' ? 'reissue_certificate' : 'issue_certificate',
      entityType: 'certificate_issue',
      entityId: String((data as CertificateIssueRow).id),
      metadata: {
        templateId: payload.templateId,
        learnerId: payload.learnerId,
        courseId: payload.courseId,
        reason: payload.reason,
      },
    })
  }

  return mapIssueRow(data as CertificateIssueRow)
}

export async function processCertificateReissue(payload: CertificateReissuePayload): Promise<CertificateIssueRecord> {
  if (!hasSupabaseConfig()) {
    const issuedAt = new Date().toISOString()
    return {
      id: randomUUID(),
      certificateTemplateId: randomUUID(),
      learnerId: randomUUID(),
      courseId: randomUUID(),
      issuedByUserId: payload.issuedByUserId,
      verificationCode: await generateUniqueVerificationCode(),
      pdfBucket: null,
      pdfPath: null,
      status: 'reissued',
      reissuedFromIssueId: payload.issueId,
      metadata: { reason: 'reissue' },
      issuedAt,
      createdAt: issuedAt,
      updatedAt: issuedAt,
    }
  }

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('certificate_issues')
    .select('id, certificate_template_id, learner_id, course_id')
    .eq('id', payload.issueId)
    .single()

  if (error || !data) {
    throw error ?? new Error('Certificate issue was not found.')
  }

  return await processCertificateGenerate({
    templateId: String((data as { certificate_template_id: string }).certificate_template_id),
    learnerId: String((data as { learner_id: string }).learner_id),
    courseId: String((data as { course_id: string }).course_id),
    issuedByUserId: payload.issuedByUserId,
    reason: 'reissue',
    reissuedFromIssueId: payload.issueId,
  })
}
