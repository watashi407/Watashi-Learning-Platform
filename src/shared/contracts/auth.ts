export type UserRole = 'learner' | 'educator' | 'admin'
export type OAuthProvider = 'google' | 'github'

export type AuthSession = {
  id: string
  email: string
  name: string
  role: UserRole
}

export type AuthPayload = {
  email: string
  password: string
  name?: string
}

export type AuthSuccess =
  | {
      nextStep: 'signed-in'
      session: AuthSession
      message?: string
    }
  | {
      nextStep: 'confirm-email'
      session: null
      message: string
    }

export type OAuthStartPayload = {
  provider: OAuthProvider
  next?: string
}

export type OAuthStartSuccess = {
  url: string
}
