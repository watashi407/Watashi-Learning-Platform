import { unwrapActionResult } from '../../shared/errors'
import type {
  CertificateIssueRecord,
  CertificateTemplateInput,
  CertificateTemplateRecord,
  CompleteEnrollmentInput,
  CourseListItem,
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
import {
  completeEnrollmentFn,
  createCertificateTemplateFn,
  createCourseFn,
  deleteCertificateTemplateFn,
  deleteCourseFn,
  duplicateCertificateTemplateFn,
  duplicateCourseFn,
  getCertificateIssueFn,
  getCertificateTemplateFn,
  getCourseFn,
  getEducatorDashboardSnapshotFn,
  issueCertificateFn,
  listCertificateIssuesFn,
  listCertificateTemplatesFn,
  listCoursesFn,
  listMediaLibraryFn,
  reissueCertificateFn,
  reuseMediaItemFn,
  saveCourseTreeFn,
  updateCertificateTemplateFn,
  updateCourseStatusFn,
} from './educator.functions'

// ── Courses ──

export async function createCourseClient(payload: CreateCourseInput): Promise<CourseTree> {
  return unwrapActionResult(await createCourseFn({ data: payload }))
}

export async function saveCourseTreeClient(payload: SaveCourseTreeInput): Promise<CourseTree> {
  return unwrapActionResult(await saveCourseTreeFn({ data: payload }))
}

export async function updateCourseStatusClient(payload: UpdateCourseStatusInput) {
  return unwrapActionResult(await updateCourseStatusFn({ data: payload }))
}

export async function duplicateCourseClient(payload: DuplicateCourseInput): Promise<CourseTree> {
  return unwrapActionResult(await duplicateCourseFn({ data: payload }))
}

export async function deleteCourseClient(courseId: string): Promise<{ deleted: true }> {
  return unwrapActionResult(await deleteCourseFn({ data: { courseId } }))
}

export async function getCourseClient(courseId: string): Promise<CourseTree> {
  return unwrapActionResult(await getCourseFn({ data: { courseId } }))
}

export async function listCoursesClient(): Promise<CourseListItem[]> {
  return unwrapActionResult(await listCoursesFn())
}

// ── Enrollments ──

export async function completeEnrollmentClient(payload: CompleteEnrollmentInput) {
  return unwrapActionResult(await completeEnrollmentFn({ data: payload }))
}

// ── Certificate Templates ──

export async function createCertificateTemplateClient(payload: CertificateTemplateInput): Promise<CertificateTemplateRecord> {
  return unwrapActionResult(await createCertificateTemplateFn({ data: payload }))
}

export async function updateCertificateTemplateClient(payload: UpdateCertificateTemplateInput): Promise<CertificateTemplateRecord> {
  return unwrapActionResult(await updateCertificateTemplateFn({ data: payload }))
}

export async function duplicateCertificateTemplateClient(payload: DuplicateCertificateTemplateInput): Promise<CertificateTemplateRecord> {
  return unwrapActionResult(await duplicateCertificateTemplateFn({ data: payload }))
}

export async function deleteCertificateTemplateClient(templateId: string): Promise<{ deleted: true }> {
  return unwrapActionResult(await deleteCertificateTemplateFn({ data: { templateId } }))
}

export async function getCertificateTemplateClient(templateId: string): Promise<CertificateTemplateRecord> {
  return unwrapActionResult(await getCertificateTemplateFn({ data: { templateId } }))
}

export async function listCertificateTemplatesClient(): Promise<CertificateTemplateRecord[]> {
  return unwrapActionResult(await listCertificateTemplatesFn())
}

// ── Certificate Issues ──

export async function issueCertificateClient(payload: IssueCertificateInput) {
  return unwrapActionResult(await issueCertificateFn({ data: payload }))
}

export async function reissueCertificateClient(payload: ReissueCertificateInput) {
  return unwrapActionResult(await reissueCertificateFn({ data: payload }))
}

export async function getCertificateIssueClient(issueId: string): Promise<CertificateIssueRecord> {
  return unwrapActionResult(await getCertificateIssueFn({ data: { issueId } }))
}

export async function listCertificateIssuesClient(): Promise<CertificateIssueRecord[]> {
  return unwrapActionResult(await listCertificateIssuesFn())
}

// ── Media Library ──

export async function listMediaLibraryClient(payload: ListMediaLibraryInput): Promise<MediaItemRecord[]> {
  return unwrapActionResult(await listMediaLibraryFn({ data: payload }))
}

export async function reuseMediaItemClient(payload: ReuseMediaItemInput): Promise<MediaItemRecord> {
  return unwrapActionResult(await reuseMediaItemFn({ data: payload }))
}

// ── Dashboard ──

export async function getEducatorDashboardSnapshotClient(): Promise<EducatorDashboardSnapshot> {
  return unwrapActionResult(await getEducatorDashboardSnapshotFn())
}
