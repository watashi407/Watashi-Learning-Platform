import { AppError } from '../../shared/errors'

export function assertAllowedOrigin(request: Request, requestId: string) {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return
  }

  const origin = request.headers.get('origin')
  if (!origin) {
    return
  }

  const requestOrigin = new URL(request.url).origin
  if (origin !== requestOrigin) {
    throw new AppError('FORBIDDEN', 'We could not verify where this request came from.', {
      requestId,
      details: { origin },
    })
  }
}
