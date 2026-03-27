import { z } from 'zod'

const optionalNonEmptyString = () =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }, z.string().min(1).optional())

const optionalUrlString = () =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }, z.string().url().optional())

const publicEnvSchema = z.object({
  VITE_SUPABASE_URL: optionalUrlString(),
  VITE_SUPABASE_ANON_KEY: optionalNonEmptyString(),
  VITE_VIDEO_CREATION_MAX_FILE_SIZE_MB: optionalNonEmptyString(),
})

const serverOnlyEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmptyString(),
  DATABASE_URL: optionalNonEmptyString(),
  GEMINI_API_KEY: optionalNonEmptyString(),
  TRIGGER_SECRET_KEY: optionalNonEmptyString(),
  TRIGGER_API_URL: optionalUrlString(),
  WATASHI_ADMIN_EMAILS: optionalNonEmptyString(),
  WATASHI_ALLOWED_HOSTS: optionalNonEmptyString(),
  SUPABASE_VIDEO_RAW_BUCKET: optionalNonEmptyString(),
  SUPABASE_VIDEO_PROXY_BUCKET: optionalNonEmptyString(),
  SUPABASE_VIDEO_RENDERED_BUCKET: optionalNonEmptyString(),
  SUPABASE_VIDEO_SUBTITLE_BUCKET: optionalNonEmptyString(),
  SUPABASE_VIDEO_THUMBNAIL_BUCKET: optionalNonEmptyString(),
  VIDEO_RAW_RETENTION_DAYS: optionalNonEmptyString(),
})

const serverEnvSchema = publicEnvSchema.extend(serverOnlyEnvSchema.shape)

type ServerEnv = z.infer<typeof serverEnvSchema>
type RuntimeConfigTarget = 'browser' | 'supabase-auth' | 'supabase-service' | 'trigger' | 'gemini' | 'database'

const parsedEnv = serverEnvSchema.parse(process.env)

const REQUIRED_ENV_BY_TARGET: Record<RuntimeConfigTarget, readonly (keyof ServerEnv)[]> = {
  browser: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  'supabase-auth': ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  'supabase-service': ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  trigger: ['TRIGGER_SECRET_KEY'],
  gemini: ['GEMINI_API_KEY'],
  database: ['DATABASE_URL'],
}

export function getServerEnv(): ServerEnv {
  return parsedEnv
}

export function getPublicEnv() {
  return publicEnvSchema.parse(parsedEnv)
}

export function getRequiredEnvKeys(target: RuntimeConfigTarget) {
  return [...REQUIRED_ENV_BY_TARGET[target]]
}

export function getMissingEnvKeys(target: RuntimeConfigTarget) {
  return REQUIRED_ENV_BY_TARGET[target].filter((key) => {
    const value = parsedEnv[key]
    return typeof value !== 'string' || value.length === 0
  })
}

export function assertRuntimeEnv(target: RuntimeConfigTarget) {
  const missing = getMissingEnvKeys(target)
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for ${target}: ${missing.join(', ')}`)
  }
}

export function hasSupabaseConfig() {
  return getMissingEnvKeys('supabase-service').length === 0
}

export function hasSupabaseAuthConfig() {
  return getMissingEnvKeys('supabase-auth').length === 0
}

export function hasTriggerConfig() {
  return getMissingEnvKeys('trigger').length === 0
}

export function hasGeminiConfig() {
  return getMissingEnvKeys('gemini').length === 0
}

export function hasDatabaseConfig() {
  return getMissingEnvKeys('database').length === 0
}

export function getRequiredServerValue(name: keyof ServerEnv) {
  const value = parsedEnv[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getOptionalDatabaseUrl() {
  return parsedEnv.DATABASE_URL
}

export function getAdminEmails() {
  return (parsedEnv.WATASHI_ADMIN_EMAILS ?? 'admin@watashi.com')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function getAllowedHostsFromEnv() {
  return (parsedEnv.WATASHI_ALLOWED_HOSTS ?? 'localhost,.localhost,127.0.0.1')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
}
