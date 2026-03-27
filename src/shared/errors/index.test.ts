import { describe, expect, it } from 'vitest'
import { AppError, ClientActionError, getDisplayErrorMessage, normalizeError, serializeError, unwrapActionResult } from './index'

describe('shared errors', () => {
  it('normalizes unknown errors into AppError', () => {
    const error = normalizeError(new Error('Boom'), 'req-123')

    expect(error).toBeInstanceOf(AppError)
    expect(error.requestId).toBe('req-123')
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(error.message).toBe('Something went wrong on our side. Please try again.')
  })

  it('serializes public errors with request ids', () => {
    const payload = serializeError(new AppError('FORBIDDEN', 'No access', { requestId: 'req-789' }), 'req-789')

    expect(payload).toEqual({
      code: 'FORBIDDEN',
      message: 'No access',
      requestId: 'req-789',
      details: undefined,
    })
  })

  it('unwraps action results and throws typed client errors on failure', () => {
    expect(unwrapActionResult({ ok: true, data: { value: 42 } })).toEqual({ value: 42 })

    expect(() => unwrapActionResult({
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Slow down',
        requestId: 'req-rate',
      },
    })).toThrow(ClientActionError)
  })

  it('uses safe fallback copy for generic errors in the UI', () => {
    expect(getDisplayErrorMessage(new Error('Database connection refused'))).toBe(
      'Something went wrong on our side. Please try again.',
    )
  })
})
