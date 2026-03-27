import { createFileRoute } from '@tanstack/react-router'
import { requireRequestUser } from '../../../../lib/backend/auth-server'
import { getRequiredServerValue, hasSupabaseConfig } from '../../../../server/env'
import { normalizeError } from '../../../../shared/errors'
import { getUploadProxySession } from '../../../../modules/video-creation/video-studio.server'

function buildProxyHeaders(source: Headers) {
  const headers = new Headers()
  const passthroughHeaders = ['tus-resumable', 'upload-offset', 'upload-length', 'cache-control', 'content-length', 'content-type']

  for (const header of passthroughHeaders) {
    const value = source.get(header)
    if (value) {
      headers.set(header, value)
    }
  }

  return headers
}

async function proxyTusRequest(request: Request, uploadId: string) {
  if (!hasSupabaseConfig()) {
    return new Response('Video uploads are not configured.', { status: 503 })
  }

  const user = await requireRequestUser(request)
  if (!user.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const token = request.headers.get('x-video-upload-token') ?? ''
  const session = await getUploadProxySession(user.id, uploadId)
  if (!session || session.token !== token || !session.tusUrl) {
    return new Response('Upload session not found.', { status: 404 })
  }

  const upstreamHeaders = new Headers()
  upstreamHeaders.set('Authorization', `Bearer ${getRequiredServerValue('SUPABASE_SERVICE_ROLE_KEY')}`)
  upstreamHeaders.set('Tus-Resumable', request.headers.get('Tus-Resumable') ?? '1.0.0')

  const uploadOffset = request.headers.get('Upload-Offset')
  if (uploadOffset) {
    upstreamHeaders.set('Upload-Offset', uploadOffset)
  }

  const contentType = request.headers.get('Content-Type')
  if (contentType) {
    upstreamHeaders.set('Content-Type', contentType)
  }

  const contentLength = request.headers.get('Content-Length')
  if (contentLength) {
    upstreamHeaders.set('Content-Length', contentLength)
  }

  const upstreamResponse = await fetch(session.tusUrl, {
    method: request.method,
    headers: upstreamHeaders,
    body: request.method === 'PATCH' ? request.body : undefined,
    duplex: request.method === 'PATCH' ? ('half' as never) : undefined,
  })

  const responseHeaders = buildProxyHeaders(upstreamResponse.headers)
  return new Response(request.method === 'HEAD' ? null : upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  })
}

export const Route = createFileRoute('/api/video-studio/uploads/resumable/$uploadId')({
  server: {
    handlers: {
      HEAD: async ({ request, params }) => {
        try {
          return await proxyTusRequest(request, params.uploadId)
        } catch (error) {
          const normalized = normalizeError(error, 'video-upload-proxy-head')
          return new Response(normalized.message, { status: normalized.status })
        }
      },
      PATCH: async ({ request, params }) => {
        try {
          return await proxyTusRequest(request, params.uploadId)
        } catch (error) {
          const normalized = normalizeError(error, 'video-upload-proxy-patch')
          return new Response(normalized.message, { status: normalized.status })
        }
      },
    },
  },
})
