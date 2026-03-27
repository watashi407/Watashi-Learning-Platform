import {
  assertRuntimeEnv,
  getAdminEmails as getAdminEmailsFromServerEnv,
  getRequiredServerValue,
  getServerEnv as getServerEnvValues,
  hasDatabaseConfig,
  hasGeminiConfig,
  hasSupabaseConfig,
  hasTriggerConfig,
} from '../../server/env'

export { assertRuntimeEnv, hasDatabaseConfig }

export function getServerEnv(name: string): string | undefined {
  const env = getServerEnvValues() as Record<string, string | undefined>
  return env[name]
}

export function getRequiredServerEnv(name: string): string {
  return getRequiredServerValue(name as keyof ReturnType<typeof getServerEnvValues>)
}

export function isSupabaseServerConfigured() {
  return hasSupabaseConfig()
}

export function isTriggerConfigured() {
  return hasTriggerConfig()
}

export function isGeminiConfigured() {
  return hasGeminiConfig()
}

export function getAdminEmails() {
  return getAdminEmailsFromServerEnv()
}
