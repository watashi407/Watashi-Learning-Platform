import { redactSecrets } from '../shared/redaction'

export function logServerError(message: string, details: Record<string, unknown>) {
  writeLog('error', message, details)
}

export function logServerInfo(message: string, details: Record<string, unknown>) {
  writeLog('info', message, details)
}

function writeLog(level: 'error' | 'info', message: string, details: Record<string, unknown>) {
  const payload = redactSecrets({
    level,
    message,
    ...details,
  })

  const serialized = JSON.stringify(payload)
  if (level === 'error') {
    console.error(serialized)
    return
  }

  console.info(serialized)
}
