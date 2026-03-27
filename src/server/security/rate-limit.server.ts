import { randomUUID } from 'node:crypto'
import { AppError } from '../../shared/errors'
import { createServiceSupabaseClient } from '../../lib/supabase/server'
import { hasSupabaseConfig } from '../env'
import { logServerError, logServerInfo } from '../logger'

type RateLimitInput = {
  scope: string
  identifier: string
  limit: number
  windowMinutes: number
  requestId: string
}

const memoryBuckets = new Map<string, { count: number; expiresAt: number }>()
const RATE_LIMIT_RPC_DISABLE_MS = 5 * 60 * 1000

let rpcDisabledUntil = 0

function isRateLimitRpcUnavailableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  return 'code' in error && error.code === 'PGRST202'
}

function isRpcTemporarilyDisabled(now: number) {
  return rpcDisabledUntil > now
}

function disableRpcRateLimit(now: number, input: RateLimitInput, reason: string, error: unknown) {
  const nextDisabledUntil = now + RATE_LIMIT_RPC_DISABLE_MS
  const shouldLogTransition = rpcDisabledUntil <= now
  rpcDisabledUntil = nextDisabledUntil

  if (!shouldLogTransition) {
    return
  }

  logServerInfo('rate_limit_backend_disabled', {
    requestId: input.requestId,
    scope: input.scope,
    reason,
    disabledForMs: RATE_LIMIT_RPC_DISABLE_MS,
    error,
  })
}

function getBucketStart(windowMinutes: number) {
  const now = new Date()
  const bucket = new Date(now)
  bucket.setSeconds(0, 0)
  bucket.setMinutes(Math.floor(now.getMinutes() / windowMinutes) * windowMinutes)
  return bucket
}

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.expiresAt <= now) {
      memoryBuckets.delete(key)
    }
  }
}

function getMemoryBucketKey(scope: string, identifier: string, bucketStart: Date) {
  return `${scope}:${identifier}:${bucketStart.toISOString()}`
}

function enforceMemoryRateLimit({
  scope,
  identifier,
  limit,
  windowMinutes,
  requestId,
}: RateLimitInput, bucketStart: Date) {
  const key = getMemoryBucketKey(scope, identifier, bucketStart)
  const now = Date.now()

  pruneExpiredBuckets(now)

  const existing = memoryBuckets.get(key)

  if (!existing || existing.expiresAt <= now) {
    memoryBuckets.set(key, {
      count: 1,
      expiresAt: now + windowMinutes * 60 * 1000,
    })
    return
  }

  existing.count += 1
  if (existing.count > limit) {
    throw new AppError('RATE_LIMITED', 'Too many requests. Try again later.', { requestId })
  }
}

function fallbackToMemoryRateLimit(input: RateLimitInput, bucketStart: Date, reason: string, error?: unknown) {
  logServerError('rate_limit_backend_unavailable', {
    requestId: input.requestId,
    scope: input.scope,
    reason,
    error,
  })

  enforceMemoryRateLimit(input, bucketStart)
}

export async function enforceRateLimit(input: RateLimitInput) {
  const bucketStart = getBucketStart(input.windowMinutes)
  const now = Date.now()

  if (!hasSupabaseConfig()) {
    enforceMemoryRateLimit(input, bucketStart)
    return
  }

  if (isRpcTemporarilyDisabled(now)) {
    enforceMemoryRateLimit(input, bucketStart)
    return
  }

  try {
    const supabase = createServiceSupabaseClient()
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_scope: input.scope,
      p_identifier: input.identifier || randomUUID(),
      p_bucket_start: bucketStart.toISOString(),
      p_limit: input.limit,
    })

    if (error) {
      if (isRateLimitRpcUnavailableError(error)) {
        disableRpcRateLimit(now, input, 'rpc_missing', error)
        enforceMemoryRateLimit(input, bucketStart)
        return
      }

      fallbackToMemoryRateLimit(input, bucketStart, 'rpc_error', error)
      return
    }

    const result = Array.isArray(data) ? data[0] : data
    if (typeof result?.allowed !== 'boolean') {
      fallbackToMemoryRateLimit(input, bucketStart, 'invalid_rpc_response', { data })
      return
    }

    if (!result.allowed) {
      throw new AppError('RATE_LIMITED', 'Too many requests. Try again later.', { requestId: input.requestId })
    }
  } catch (error) {
    if (error instanceof AppError && error.code === 'RATE_LIMITED') {
      throw error
    }

    if (isRateLimitRpcUnavailableError(error)) {
      disableRpcRateLimit(now, input, 'unexpected_rpc_missing', error)
      enforceMemoryRateLimit(input, bucketStart)
      return
    }

    fallbackToMemoryRateLimit(input, bucketStart, 'unexpected_rate_limit_failure', error)
  }
}
