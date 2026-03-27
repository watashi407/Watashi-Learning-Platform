import { describe, expect, it } from 'vitest'
import { buildSecurityHeaders } from './headers'

describe('buildSecurityHeaders', () => {
  it('includes strict baseline headers', () => {
    const headers = buildSecurityHeaders()

    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(headers.get('Permissions-Policy')).toContain('camera=(self)')
    expect(headers.get('Permissions-Policy')).toContain('microphone=(self)')
    expect(headers.get('Permissions-Policy')).toContain('display-capture=(self)')
  })

  it('allows hydration scripts in csp', () => {
    const csp = buildSecurityHeaders().get('Content-Security-Policy') || ''
    const scriptDirective = csp.split(';').map((part) => part.trim()).find((part) => part.startsWith('script-src'))
    const mediaDirective = csp.split(';').map((part) => part.trim()).find((part) => part.startsWith('media-src'))

    expect(scriptDirective).toBe("script-src 'self' 'unsafe-inline'")
    expect(mediaDirective).toBe("media-src 'self' blob:")
    expect(csp).toContain('https://api.dicebear.com')
  })
})
