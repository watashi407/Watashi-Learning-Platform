export type WatashiUser = {
  name: string
  email: string
}

const STORAGE_KEY = 'watashi-learn-user'

export function readUser(): WatashiUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as WatashiUser
    if (!parsed.name || !parsed.email) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeUser(user: WatashiUser) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearUser() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
