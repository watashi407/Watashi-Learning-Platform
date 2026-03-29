import { createServerFn } from '@tanstack/react-start'
import type { AppRequestContext } from '../../server/context'
import { runAction } from '../../server/run-action'
import { AppError } from '../../shared/errors'
import type {
  CertificateIssueRecord,
  CertificateTemplateRecord,
  CourseListItem,
  CourseTree,
  EducatorDashboardSnapshot,
  MediaItemRecord,
} from '../../shared/contracts/educator'
import {
  completeEnrollment,
  createCertificateTemplate,
  createCourse,
  deleteCertificateTemplate,
  deleteCourse,
  duplicateCertificateTemplate,
  duplicateCourse,
  getCertificateIssue,
  getCertificateTemplate,
  getCourse,
  getEducatorDashboardSnapshot,
  issueCertificate,
  listCertificateIssues,
  listCertificateTemplates,
  listCourses,
  listMediaLibrary,
  reissueCertificate,
  reuseMediaItem,
  saveCourseTree,
  updateCertificateTemplate,
  updateCourseStatus,
} from './educator.server'
import {
  completeEnrollmentSchema,
  createCertificateTemplateSchema,
  createCourseSchema,
  deleteCertificateTemplateSchema,
  deleteCourseSchema,
  duplicateCertificateTemplateSchema,
  duplicateCourseSchema,
  getCertificateIssueSchema,
  getCertificateTemplateSchema,
  getCourseSchema,
  issueCertificateSchema,
  listMediaLibrarySchema,
  reissueCertificateSchema,
  reuseMediaItemSchema,
  saveCourseTreeSchema,
  updateCertificateTemplateSchema,
  updateCourseStatusSchema,
} from './educator.schemas'

function requireContextUser(context: Partial<AppRequestContext>, requestId: string) {
  if (!context.user) {
    throw new AppError('UNAUTHORIZED', 'You need to sign in to continue.', { requestId })
  }

  return context.user
}

export const createCourseFn = createServerFn({ method: 'POST' })
  .inputValidator(createCourseSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<CourseTree>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await createCourse(user, data, requestId)
    })
  })

export const saveCourseTreeFn = createServerFn({ method: 'POST' })
  .inputValidator(saveCourseTreeSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<CourseTree>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await saveCourseTree(user, data, requestId)
    })
  })

export const updateCourseStatusFn = createServerFn({ method: 'POST' })
  .inputValidator(updateCourseStatusSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await updateCourseStatus(user, data, requestId)
    })
  })

export const duplicateCourseFn = createServerFn({ method: 'POST' })
  .inputValidator(duplicateCourseSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<CourseTree>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await duplicateCourse(user, data, requestId)
    })
  })

export const deleteCourseFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteCourseSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<{ deleted: true }>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await deleteCourse(user, data.courseId, requestId)
    })
  })

export const getCourseFn = createServerFn({ method: 'GET' })
  .inputValidator(getCourseSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<CourseTree>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await getCourse(user, data.courseId, requestId)
    })
  })

export const listCoursesFn = createServerFn({ method: 'GET' }).handler(async ({ context }) => {
  const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
  return runAction<CourseListItem[]>(requestId, async () => {
    const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
    return await listCourses(user, requestId)
  })
})

export const completeEnrollmentFn = createServerFn({ method: 'POST' })
  .inputValidator(completeEnrollmentSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await completeEnrollment(user, data, requestId)
    })
  })

export const createCertificateTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator(createCertificateTemplateSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<CertificateTemplateRecord>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await createCertificateTemplate(user, data, requestId)
    })
  })

export const updateCertificateTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator(updateCertificateTemplateSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<CertificateTemplateRecord>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await updateCertificateTemplate(user, data, requestId)
    })
  })

export const duplicateCertificateTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator(duplicateCertificateTemplateSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<CertificateTemplateRecord>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await duplicateCertificateTemplate(user, data, requestId)
    })
  })

export const deleteCertificateTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteCertificateTemplateSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<{ deleted: true }>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await deleteCertificateTemplate(user, data.templateId, requestId)
    })
  })

export const getCertificateTemplateFn = createServerFn({ method: 'GET' })
  .inputValidator(getCertificateTemplateSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<CertificateTemplateRecord>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await getCertificateTemplate(user, data.templateId, requestId)
    })
  })

export const listCertificateTemplatesFn = createServerFn({ method: 'GET' }).handler(async ({ context }) => {
  const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
  return runAction<CertificateTemplateRecord[]>(requestId, async () => {
    const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
    return await listCertificateTemplates(user, requestId)
  })
})

export const issueCertificateFn = createServerFn({ method: 'POST' })
  .inputValidator(issueCertificateSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await issueCertificate(user, data, requestId)
    })
  })

export const reissueCertificateFn = createServerFn({ method: 'POST' })
  .inputValidator(reissueCertificateSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await reissueCertificate(user, data, requestId)
    })
  })

export const getCertificateIssueFn = createServerFn({ method: 'GET' })
  .inputValidator(getCertificateIssueSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<CertificateIssueRecord>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await getCertificateIssue(user, data.issueId, requestId)
    })
  })

export const listCertificateIssuesFn = createServerFn({ method: 'GET' }).handler(async ({ context }) => {
  const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
  return runAction<CertificateIssueRecord[]>(requestId, async () => {
    const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
    return await listCertificateIssues(user, requestId)
  })
})

export const listMediaLibraryFn = createServerFn({ method: 'GET' })
  .inputValidator(listMediaLibrarySchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<MediaItemRecord[]>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await listMediaLibrary(user, data, requestId)
    })
  })

export const reuseMediaItemFn = createServerFn({ method: 'POST' })
  .inputValidator(reuseMediaItemSchema)
  .handler(async ({ data, context }) => {
    const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
    return runAction<MediaItemRecord>(requestId, async () => {
      const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
      return await reuseMediaItem(user, data, requestId)
    })
  })

export const getEducatorDashboardSnapshotFn = createServerFn({ method: 'GET' }).handler(async ({ context }) => {
  const requestId = (context as Partial<AppRequestContext>).requestId ?? 'unknown-request'
  return runAction<EducatorDashboardSnapshot>(requestId, async () => {
    const user = requireContextUser(context as Partial<AppRequestContext>, requestId)
    return await getEducatorDashboardSnapshot(user, requestId)
  })
})
