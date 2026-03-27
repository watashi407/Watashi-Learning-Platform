import type { ActionResult } from '../shared/contracts/jobs'
import { createSuccessResult, normalizeError, toActionError } from '../shared/errors'
import { logServerError } from './logger'

export async function runAction<TData>(requestId: string, action: () => Promise<TData>): Promise<ActionResult<TData>> {
  try {
    const data = await action()
    return createSuccessResult(data)
  } catch (error) {
    const normalized = normalizeError(error, requestId)
    logServerError('server_action_failure', {
      requestId,
      code: normalized.code,
      message: normalized.message,
    })
    return toActionError(normalized, requestId)
  }
}
