export function buildSecurityHeaders() {
  return new Headers({
    'Content-Security-Policy': [
      "default-src 'self'",
      // TanStack Start emits inline hydration/bootstrap scripts for SSR pages.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://api.dicebear.com https://images.unsplash.com",
      "media-src 'self' blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' ws: wss: https://generativelanguage.googleapis.com https://api.trigger.dev https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'Permissions-Policy': 'camera=(self), microphone=(self), display-capture=(self), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  })
}
