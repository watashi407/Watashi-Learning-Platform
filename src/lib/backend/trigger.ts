import { configure, tasks } from '@trigger.dev/sdk'
import { assertRuntimeEnv, isTriggerConfigured } from './env'

let configured = false

function ensureTriggerConfigured() {
  if (!isTriggerConfigured() || configured) {
    return
  }

  assertRuntimeEnv('trigger')
  configure({
    accessToken: process.env.TRIGGER_SECRET_KEY!,
    baseURL: process.env.TRIGGER_API_URL,
  })
  configured = true
}

export async function triggerJobTask(taskId: string, payload: unknown) {
  if (!isTriggerConfigured()) {
    return null
  }

  ensureTriggerConfigured()
  return tasks.trigger(taskId, payload as never)
}
