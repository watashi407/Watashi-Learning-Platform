const VERIFICATION_CODE_PATTERN = /^[A-Z0-9]{8,64}$/

type MaybeDatabaseError = {
  code?: string | null
  message?: string | null
  details?: string | null
}

export function normalizeVerificationCodeInput(rawCode: string) {
  const normalized = rawCode.trim().toUpperCase()
  if (!VERIFICATION_CODE_PATTERN.test(normalized)) {
    return null
  }

  return normalized
}

export function isDatabaseUniqueViolation(error: unknown, constraintName?: string) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const databaseError = error as MaybeDatabaseError
  if (databaseError.code !== '23505') {
    return false
  }

  if (!constraintName) {
    return true
  }

  const details = `${databaseError.message ?? ''} ${databaseError.details ?? ''}`.toLowerCase()
  return details.includes(constraintName.toLowerCase())
}
