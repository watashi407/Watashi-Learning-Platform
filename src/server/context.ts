import type { AuthSession } from '../shared/contracts/auth'

export type AppRequestContext = {
  requestId: string
  ip: string | null
  user: AuthSession | null
}
