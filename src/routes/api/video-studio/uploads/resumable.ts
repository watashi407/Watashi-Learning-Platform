import { Buffer } from 'node:buffer'
import { createFileRoute } from '@tanstack/react-router'
import { requireRequestUser } from '../../../../lib/backend/auth-server'
import { getRequiredServerValue, hasSupabaseConfig } from '../../../../server/env'
import { normalizeError } from '../../../../shared/errors'
import { getUploadProxySession, setUploadProxyTusUrl } from '../../../../modules/video-creation/video-studio.server'

function parseTusMetadata(headerValue: string | null) {
  if (!headerValue) {
    return {}
  }

  return Object.fromEntries(
    headerValue
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [key, encodedValue = ''] = item.split(' ')
        return [key, Buffer.from(encodedValue, 'base64').toString('utf-8')]
      }),
  ) as Record<string, string>
}

function encodeTusMetadata(entries: Record<string, string>) {
  return Object.entries(entries)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key} ${Buffer.from(value, 'utf-8').toString('base64')}`)
    .join(',')
}

function buildUpstreamLocation(location: string) {
  if (/^https?:\/\//.test(location)) {
    return location
  }

  return new URL(location, getRequiredServerValue('VITE_SUPABASE_URL')).toString()
}

export const Route = createFileRoute('/api/video-studio/uploads/resumable')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!hasSupabaseConfig()) {
            return new Response('Video uploads are not configured.', { status: 503 })
          }

          const user = await requireRequestUser(request)
          if (!user.id) {
            return new Response('Unauthorized', { status: 401 })
          }

          const metadata = parseTusMetadata(request.headers.get('Upload-Metadata'))
          const uploadId = metadata.uploadId
          const token = request.headers.get('x-video-upload-token') ?? ''
          if (!uploadId) {
            return new Response('Missing upload id.', { status: 400 })
          }

          const session = await getUploadProxySession(user.id, uploadId)
          if (!session || session.token !== token) {
            return new Response('Upload session not found.', { status: 404 })
          }

          const upstreamResponse = await fetch(`${getRequiredServerValue('VITE_SUPABASE_URL')}/storage/v1/upload/resumable`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${getRequiredServerValue('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Tus-Resumable': request.headers.get('Tus-Resumable') ?? '1.0.0',
              'Upload-Length': request.headers.get('Upload-Length') ?? String(session.contentLength),
              'Upload-Metadata': encodeTusMetadata({
                bucketName: session.bucketName,
                objectName: session.objectPath,
                contentType: session.contentType,
                cacheControl: '3600',
              }),
              'x-upsert': 'false',
            },
          })

          if (!upstreamResponse.ok) {
            const body = await upstreamResponse.text()
            return new Response(body || 'Unable to create resumable upload.', { status: upstreamResponse.status })
          }

          const upstreamLocation = upstreamResponse.headers.get('location')
          if (upstreamLocation) {
            await setUploadProxyTusUrl(user.id, uploadId, buildUpstreamLocation(upstreamLocation))
          }

          return new Response(null, {
            status: upstreamResponse.status,
            headers: {
              'Tus-Resumable': upstreamResponse.headers.get('Tus-Resumable') ?? '1.0.0',
              Location: `/api/video-studio/uploads/resumable/${uploadId}`,
            },
          })
        } catch (error) {
          const normalized = normalizeError(error, 'video-upload-proxy-post')
          return new Response(normalized.message, { status: normalized.status })
        }
      },
    },
  },
})
