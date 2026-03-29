export type CertificateTemplateStyle = 'classic' | 'modern' | 'minimal' | 'ornate'
export type CertificateOrientation = 'landscape' | 'portrait'
export type CertificateLogoPosition = 'top-left' | 'top-center' | 'top-right' | 'none'
export type CertificateIssuanceMode = 'auto' | 'manual'

export type CertificateLayout = {
  templateStyle: CertificateTemplateStyle
  orientation: CertificateOrientation
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  logoPosition: CertificateLogoPosition
}

export type CertificateDynamicFields = {
  showLearnerName: boolean
  showCourseTitle: boolean
  showCompletionDate: boolean
  showCertificateNumber: boolean
  showVerificationCode: boolean
}

export type CertificateValidation = {
  hasExpiry: boolean
  expiryDays: number | null
  publicVerification: boolean
}

export type CertificateIssuance = {
  mode: CertificateIssuanceMode
  linkedCourseId: string | null
}

export type CertificateConfig = {
  dynamicFields: CertificateDynamicFields
  validation: CertificateValidation
  issuance: CertificateIssuance
}

export const DEFAULT_LAYOUT: CertificateLayout = {
  templateStyle: 'classic',
  orientation: 'landscape',
  primaryColor: '#1e293b',
  secondaryColor: '#4b41e1',
  fontFamily: 'serif',
  logoPosition: 'top-center',
}

export const DEFAULT_CONFIG: CertificateConfig = {
  dynamicFields: {
    showLearnerName: true,
    showCourseTitle: true,
    showCompletionDate: true,
    showCertificateNumber: true,
    showVerificationCode: false,
  },
  validation: {
    hasExpiry: false,
    expiryDays: null,
    publicVerification: true,
  },
  issuance: {
    mode: 'auto',
    linkedCourseId: null,
  },
}

export const TEMPLATE_STYLES: { value: CertificateTemplateStyle; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'ornate', label: 'Ornate' },
]

export const FONT_FAMILIES: { value: string; label: string }[] = [
  { value: 'serif', label: 'Serif' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'display', label: 'Display' },
]

export function parseCertificateLayout(raw: Record<string, unknown>): CertificateLayout {
  return {
    templateStyle: (raw.templateStyle as CertificateTemplateStyle) ?? DEFAULT_LAYOUT.templateStyle,
    orientation: (raw.orientation as CertificateOrientation) ?? DEFAULT_LAYOUT.orientation,
    primaryColor: (raw.primaryColor as string) ?? DEFAULT_LAYOUT.primaryColor,
    secondaryColor: (raw.secondaryColor as string) ?? DEFAULT_LAYOUT.secondaryColor,
    fontFamily: (raw.fontFamily as string) ?? DEFAULT_LAYOUT.fontFamily,
    logoPosition: (raw.logoPosition as CertificateLogoPosition) ?? DEFAULT_LAYOUT.logoPosition,
  }
}

export function parseCertificateConfig(raw: Record<string, unknown>): CertificateConfig {
  const dynamicFields = (raw.dynamicFields ?? {}) as Partial<CertificateDynamicFields>
  const validation = (raw.validation ?? {}) as Partial<CertificateValidation>
  const issuance = (raw.issuance ?? {}) as Partial<CertificateIssuance>

  return {
    dynamicFields: {
      showLearnerName: dynamicFields.showLearnerName ?? DEFAULT_CONFIG.dynamicFields.showLearnerName,
      showCourseTitle: dynamicFields.showCourseTitle ?? DEFAULT_CONFIG.dynamicFields.showCourseTitle,
      showCompletionDate: dynamicFields.showCompletionDate ?? DEFAULT_CONFIG.dynamicFields.showCompletionDate,
      showCertificateNumber: dynamicFields.showCertificateNumber ?? DEFAULT_CONFIG.dynamicFields.showCertificateNumber,
      showVerificationCode: dynamicFields.showVerificationCode ?? DEFAULT_CONFIG.dynamicFields.showVerificationCode,
    },
    validation: {
      hasExpiry: validation.hasExpiry ?? DEFAULT_CONFIG.validation.hasExpiry,
      expiryDays: validation.expiryDays ?? DEFAULT_CONFIG.validation.expiryDays,
      publicVerification: validation.publicVerification ?? DEFAULT_CONFIG.validation.publicVerification,
    },
    issuance: {
      mode: issuance.mode ?? DEFAULT_CONFIG.issuance.mode,
      linkedCourseId: issuance.linkedCourseId ?? DEFAULT_CONFIG.issuance.linkedCourseId,
    },
  }
}
