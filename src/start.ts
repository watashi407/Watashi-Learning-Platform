import { createStart } from '@tanstack/react-start'
import { functionMiddleware, requestMiddleware } from './server/middleware'

export const startInstance = createStart(() => ({
  requestMiddleware: [requestMiddleware],
  functionMiddleware: [functionMiddleware],
}))
