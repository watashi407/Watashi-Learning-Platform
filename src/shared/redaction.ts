const REDACTED = '[REDACTED]'

const ASSIGNMENT_PATTERNS = [
  /\b(SUPABASE_SERVICE_ROLE_KEY|TRIGGER_SECRET_KEY|GEMINI_API_KEY|DATABASE_URL|SUPABASE_DB_URL)\s*[:=]\s*([^\s'",`]+)/gi,
]

const INLINE_SECRET_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /\bpostgres(?:ql)?:\/\/[^\s'",`]+/gi,
    replacement: '[REDACTED_POSTGRES_URL]',
  },
  {
    pattern: /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{16,}\b/gi,
    replacement: '[REDACTED_SUPABASE_KEY]',
  },
  {
    pattern: /\bBearer\s+[A-Za-z0-9._~+\/=-]{16,}\b/gi,
    replacement: '[REDACTED_BEARER_TOKEN]',
  },
  {
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    replacement: '[REDACTED_JWT]',
  },
]

const SENSITIVE_KEY_PATTERN =
  /(authorization|token|secret|password|passphrase|cookie|api[-_]?key|connection[-_]?string|supabase|database_url|trigger_secret_key|gemini_api_key)/i

export function redactSecretsInString(value: string) {
  let redacted = value

  for (const pattern of ASSIGNMENT_PATTERNS) {
    redacted = redacted.replace(pattern, (_, key: string) => `${key}=${REDACTED}`)
  }

  for (const { pattern, replacement } of INLINE_SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, replacement)
  }

  return redacted
}

export function redactSecrets<T>(value: T): T {
  return redactValue(value, new WeakSet()) as T
}

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') {
    return redactSecretsInString(value)
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
    return value
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSecretsInString(value.message),
    }
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, seen))
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]'
    }

    seen.add(value)

    const redactedEntries = Object.entries(value).map(([key, entryValue]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        return [key, REDACTED]
      }

      return [key, redactValue(entryValue, seen)]
    })

    return Object.fromEntries(redactedEntries)
  }

  return String(value)
}
