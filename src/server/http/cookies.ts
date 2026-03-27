type CookieValue = {
  name: string
  value: string
}

type CookieOptions = {
  domain?: string
  path?: string
  maxAge?: number
  expires?: Date
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
}

export function parseCookieHeader(header: string | null): CookieValue[] {
  if (!header) {
    return []
  }

  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf('=')
      if (separatorIndex === -1) {
        return null
      }

      const name = decodeURIComponent(part.slice(0, separatorIndex).trim())
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim())
      return { name, value }
    })
    .filter((cookie): cookie is CookieValue => Boolean(cookie))
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}) {
  const attributes = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`]

  attributes.push(`Path=${options.path ?? '/'}`)

  if (options.domain) {
    attributes.push(`Domain=${options.domain}`)
  }
  if (typeof options.maxAge === 'number') {
    attributes.push(`Max-Age=${options.maxAge}`)
  }
  if (options.expires) {
    attributes.push(`Expires=${options.expires.toUTCString()}`)
  }
  if (options.httpOnly) {
    attributes.push('HttpOnly')
  }
  if (options.secure) {
    attributes.push('Secure')
  }
  if (options.sameSite) {
    attributes.push(`SameSite=${options.sameSite}`)
  }

  return attributes.join('; ')
}
