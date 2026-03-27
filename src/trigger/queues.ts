import { queue } from '@trigger.dev/sdk'

export const aiGenerationQueue = queue({
  name: 'ai-generation',
  concurrencyLimit: 5,
})

export const notificationsQueue = queue({
  name: 'notifications',
  concurrencyLimit: 10,
})

export const billingSyncQueue = queue({
  name: 'billing-sync',
  concurrencyLimit: 4,
})

export const mediaProcessingQueue = queue({
  name: 'media-processing',
  concurrencyLimit: 3,
})
