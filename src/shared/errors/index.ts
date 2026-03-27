import { redactSecrets, redactSecretsInString } from '../redaction'

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM_FAILURE'
  | 'CONFIGURATION_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export type PublicErrorPayload = {
  code: ErrorCode
  message: string
  requestId: string
  details?: unknown
}

const PUBLIC_MESSAGE_BY_CODE: Record<ErrorCode, string> = {
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to do that.',
  VALIDATION_ERROR: 'Please check the information you entered and try again.',
  NOT_FOUND: 'We could not find what you were looking for.',
  RATE_LIMITED: 'You are doing that a little too quickly. Please wait a moment and try again.',
  UPSTREAM_FAILURE: 'A connected service is having trouble right now. Please try again.',
  CONFIGURATION_ERROR: 'This feature is not ready yet. Please try again later.',
  SERVICE_UNAVAILABLE: 'This feature is temporarily unavailable. Please try again later.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
}

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  UPSTREAM_FAILURE: 502,
  CONFIGURATION_ERROR: 503,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
}

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly requestId?: string
  readonly details?: unknown

  constructor(code: ErrorCode, message: string, options?: { status?: number; requestId?: string; details?: unknown; cause?: unknown }) {
    super(message, { cause: options?.cause })
    this.name = 'AppError'
    this.code = code
    this.status = options?.status ?? STATUS_BY_CODE[code]
    this.requestId = options?.requestId
    this.details = options?.details
  }
}

export class ClientActionError extends Error {
  readonly code: ErrorCode
  readonly requestId: string
  readonly details?: unknown

  constructor(payload: PublicErrorPayload) {
    super(payload.message)
    this.name = 'ClientActionError'
    this.code = payload.code
    this.requestId = payload.requestId
    this.details = payload.details
  }
}

export function isRetryableError(error: AppError) {
  return error.code === 'UPSTREAM_FAILURE' || error.code === 'SERVICE_UNAVAILABLE' || error.code === 'RATE_LIMITED'
}

export function getPublicErrorMessage(code: ErrorCode) {
  return PUBLIC_MESSAGE_BY_CODE[code]
}

export function getDisplayErrorMessage(error: unknown, fallback = PUBLIC_MESSAGE_BY_CODE.INTERNAL_ERROR) {
  if (error instanceof ClientActionError) {
    return error.message || getPublicErrorMessage(error.code)
  }

  if (error instanceof AppError) {
    return error.message || getPublicErrorMessage(error.code)
  }

  return fallback
}

export function getErrorRequestId(error: unknown) {
  if (error instanceof ClientActionError) {
    return error.requestId
  }

  if (error instanceof AppError) {
    return error.requestId
  }

  return undefined
}

export function serializeError(error: AppError, requestId: string): PublicErrorPayload {
  return {
    code: error.code,
    message: redactSecretsInString(error.message),
    requestId,
    details: redactSecrets(error.details),
  }
}

export function normalizeError(error: unknown, requestId: string) {
  if (error instanceof AppError) {
    return error.requestId ? error : new AppError(error.code, error.message, {
      status: error.status,
      requestId,
      details: error.details,
      cause: error.cause,
    })
  }

  if (error instanceof Error) {
    return new AppError('INTERNAL_ERROR', getPublicErrorMessage('INTERNAL_ERROR'), {
      requestId,
      cause: error,
    })
  }

  return new AppError('INTERNAL_ERROR', getPublicErrorMessage('INTERNAL_ERROR'), {
    requestId,
    details: redactSecrets(error),
  })
}

export function toActionError(error: unknown, requestId: string) {
  const normalized = normalizeError(error, requestId)
  return {
    ok: false as const,
    error: serializeError(normalized, requestId),
  }
}

export function createSuccessResult<TData>(data: TData) {
  return {
    ok: true as const,
    data,
  }
}

export function unwrapActionResult<TData>(result: { ok: true; data: TData } | { ok: false; error: PublicErrorPayload }) {
  if (!result.ok) {
    throw new ClientActionError(result.error)
  }

  return result.data
}
