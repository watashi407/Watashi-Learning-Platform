import { useCallback, useEffect, useRef, useState } from 'react'
import type { CertificateTemplateRecord, CourseListItem } from '../../../shared/contracts/educator'
import {
  createCertificateTemplateClient,
  deleteCertificateTemplateClient,
  duplicateCertificateTemplateClient,
  getCertificateTemplateClient,
  listCertificateTemplatesClient,
  listCoursesClient,
  updateCertificateTemplateClient,
} from '../../../features/educator/client'
import { getDisplayErrorMessage } from '../../../shared/errors'
import {
  DEFAULT_CONFIG,
  DEFAULT_LAYOUT,
  parseCertificateConfig,
  parseCertificateLayout,
  type CertificateConfig,
  type CertificateLayout,
} from '../domain/certificate-builder-model'

const AUTOSAVE_DEBOUNCE_MS = 700

export function useCertificateBuilder() {
  const [templates, setTemplates] = useState<CertificateTemplateRecord[]>([])
  const [activeTemplate, setActiveTemplate] = useState<CertificateTemplateRecord | null>(null)
  const [layout, setLayout] = useState<CertificateLayout>(DEFAULT_LAYOUT)
  const [config, setConfig] = useState<CertificateConfig>(DEFAULT_CONFIG)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courses, setCourses] = useState<CourseListItem[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lastSavedSnapshotRef = useRef<string>('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHydratedRef = useRef(false)

  // ── Bootstrap ──
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setIsLoading(true)
      try {
        const [templateList, courseList] = await Promise.all([
          listCertificateTemplatesClient(),
          listCoursesClient(),
        ])

        if (cancelled) return
        setTemplates(templateList)
        setCourses(courseList)
        setError(null)

        if (templateList.length > 0) {
          const first = templateList[0]
          loadTemplateIntoState(first)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getDisplayErrorMessage(err, 'Could not load certificate data.'))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void bootstrap()
    return () => { cancelled = true }
  }, [])

  function loadTemplateIntoState(template: CertificateTemplateRecord) {
    setActiveTemplate(template)
    setTitle(template.title)
    setDescription(template.description)
    setLayout(parseCertificateLayout(template.layout))
    setConfig(parseCertificateConfig(template.config))
    lastSavedSnapshotRef.current = buildSnapshot(
      template.title,
      template.description,
      parseCertificateLayout(template.layout),
      parseCertificateConfig(template.config),
      template.status,
    )
    isHydratedRef.current = true
  }

  function buildSnapshot(t: string, d: string, l: CertificateLayout, c: CertificateConfig, s: string): string {
    return JSON.stringify({ title: t, description: d, layout: l, config: c, status: s })
  }

  // ── Autosave ──
  const currentSnapshot = activeTemplate
    ? buildSnapshot(title, description, layout, config, activeTemplate.status)
    : ''

  useEffect(() => {
    if (!isHydratedRef.current || !activeTemplate) return
    if (currentSnapshot === lastSavedSnapshotRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void saveTemplate()
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [currentSnapshot])

  async function saveTemplate() {
    if (!activeTemplate) return

    const payload = {
      templateId: activeTemplate.id,
      title,
      description,
      layout: layout as Record<string, unknown>,
      config: config as Record<string, unknown>,
      brandingLogoBucket: activeTemplate.brandingLogoBucket,
      brandingLogoPath: activeTemplate.brandingLogoPath,
      status: activeTemplate.status,
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const updated = await updateCertificateTemplateClient(payload)
      setActiveTemplate(updated)
      lastSavedSnapshotRef.current = buildSnapshot(title, description, layout, config, updated.status)
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      setSaveError(getDisplayErrorMessage(err, 'Could not save certificate template.'))
    } finally {
      setIsSaving(false)
    }
  }

  // ── Actions ──
  const createTemplate = useCallback(async (newTitle?: string) => {
    try {
      const created = await createCertificateTemplateClient({
        title: newTitle ?? 'Untitled Certificate',
        description: '',
        layout: DEFAULT_LAYOUT as Record<string, unknown>,
        config: DEFAULT_CONFIG as Record<string, unknown>,
        brandingLogoBucket: null,
        brandingLogoPath: null,
        status: 'draft',
      })
      setTemplates((prev) => [created, ...prev])
      loadTemplateIntoState(created)
    } catch (err) {
      setSaveError(getDisplayErrorMessage(err, 'Could not create certificate template.'))
    }
  }, [])

  const selectTemplate = useCallback(async (templateId: string) => {
    try {
      const template = await getCertificateTemplateClient(templateId)
      loadTemplateIntoState(template)
    } catch (err) {
      setSaveError(getDisplayErrorMessage(err, 'Could not load certificate template.'))
    }
  }, [])

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      await deleteCertificateTemplateClient(templateId)
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
      if (activeTemplate?.id === templateId) {
        setActiveTemplate(null)
        setTitle('')
        setDescription('')
        setLayout(DEFAULT_LAYOUT)
        setConfig(DEFAULT_CONFIG)
        isHydratedRef.current = false
      }
    } catch (err) {
      setSaveError(getDisplayErrorMessage(err, 'Could not delete certificate template.'))
    }
  }, [activeTemplate?.id])

  const duplicateTemplate = useCallback(async (templateId: string) => {
    try {
      const dup = await duplicateCertificateTemplateClient({ templateId })
      setTemplates((prev) => [dup, ...prev])
      loadTemplateIntoState(dup)
    } catch (err) {
      setSaveError(getDisplayErrorMessage(err, 'Could not duplicate certificate template.'))
    }
  }, [])

  const setStatus = useCallback(async (status: 'draft' | 'published' | 'archived') => {
    if (!activeTemplate) return
    setActiveTemplate((prev) => prev ? { ...prev, status } : null)
    // Autosave will pick up the change
  }, [activeTemplate])

  // ── Layout/Config Updaters ──
  const updateLayout = useCallback(<K extends keyof CertificateLayout>(key: K, value: CertificateLayout[K]) => {
    setLayout((prev) => ({ ...prev, [key]: value }))
  }, [])

  const updateDynamicField = useCallback(<K extends keyof CertificateConfig['dynamicFields']>(key: K, value: boolean) => {
    setConfig((prev) => ({ ...prev, dynamicFields: { ...prev.dynamicFields, [key]: value } }))
  }, [])

  const updateValidation = useCallback(<K extends keyof CertificateConfig['validation']>(key: K, value: CertificateConfig['validation'][K]) => {
    setConfig((prev) => ({ ...prev, validation: { ...prev.validation, [key]: value } }))
  }, [])

  const updateIssuance = useCallback(<K extends keyof CertificateConfig['issuance']>(key: K, value: CertificateConfig['issuance'][K]) => {
    setConfig((prev) => ({ ...prev, issuance: { ...prev.issuance, [key]: value } }))
  }, [])

  return {
    // Data
    templates,
    activeTemplate,
    layout,
    config,
    title,
    description,
    courses,

    // State
    isLoading,
    isSaving,
    saveError,
    error,

    // Actions
    setTitle,
    setDescription,
    createTemplate,
    selectTemplate,
    deleteTemplate,
    duplicateTemplate,
    setStatus,
    saveTemplate,

    // Layout/Config updaters
    updateLayout,
    updateDynamicField,
    updateValidation,
    updateIssuance,
  }
}
