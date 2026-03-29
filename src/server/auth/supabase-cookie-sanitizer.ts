type ParsedCookie = {
  name: string
  value: string
}

const CHUNK_SUFFIX_PATTERN = /\.(\d+)$/
const SUPABASE_COOKIE_MARKERS = ['auth-token', 'code-verifier']
const BASE64_PREFIX = 'base64-'
const BASE64_URL_PATTERN = /^[A-Za-z0-9\-_]+=*$/

function getCookieBaseName(name: string) {
  return name.replace(CHUNK_SUFFIX_PATTERN, '')
}

function isSupabaseStateCookie(baseName: string) {
  return SUPABASE_COOKIE_MARKERS.some((marker) => baseName.includes(marker))
}

function decodeBase64UrlUtf8(value: string) {
  if (!BASE64_URL_PATTERN.test(value)) {
    throw new Error('Invalid Base64-URL payload.')
  }

  const bytes = Buffer.from(value, 'base64url')
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

function isValidSupabaseCookieValue(value: string) {
  if (!value.startsWith(BASE64_PREFIX)) {
    return true
  }

  const encoded = value.slice(BASE64_PREFIX.length)
  if (!encoded) {
    return false
  }

  try {
    decodeBase64UrlUtf8(encoded)
    return true
  } catch {
    return false
  }
}

export function sanitizeSupabaseRequestCookies(cookies: ParsedCookie[]) {
  const groups = new Map<string, ParsedCookie[]>()
  for (const cookie of cookies) {
    const baseName = getCookieBaseName(cookie.name)
    const current = groups.get(baseName)
    if (current) {
      current.push(cookie)
    } else {
      groups.set(baseName, [cookie])
    }
  }

  const rejectedCookieNames = new Set<string>()

  for (const [baseName, groupedCookies] of groups) {
    if (!isSupabaseStateCookie(baseName)) {
      continue
    }

    const exactCookie = groupedCookies.find((cookie) => cookie.name === baseName)
    const combinedValue = exactCookie
      ? exactCookie.value
      : groupedCookies
          .slice()
          .sort((left, right) => {
            const leftIndex = Number.parseInt(left.name.match(CHUNK_SUFFIX_PATTERN)?.[1] ?? '-1', 10)
            const rightIndex = Number.parseInt(right.name.match(CHUNK_SUFFIX_PATTERN)?.[1] ?? '-1', 10)
            return leftIndex - rightIndex
          })
          .map((cookie) => cookie.value)
          .join('')

    if (!combinedValue || isValidSupabaseCookieValue(combinedValue)) {
      continue
    }

    for (const cookie of groupedCookies) {
      rejectedCookieNames.add(cookie.name)
    }
  }

  return {
    cookies: cookies.filter((cookie) => !rejectedCookieNames.has(cookie.name)),
    rejectedCookieNames: [...rejectedCookieNames],
  }
}
