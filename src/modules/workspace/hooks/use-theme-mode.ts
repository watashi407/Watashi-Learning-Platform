import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'watashi-theme-mode'

function getPreferredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') {
    return stored
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getAppliedThemeMode(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'light'
  }

  const applied = document.documentElement.dataset.theme
  if (applied === 'dark' || applied === 'light') {
    return applied
  }

  return getPreferredThemeMode()
}

function applyThemeMode(mode: ThemeMode) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode
}

export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    setMode(getAppliedThemeMode())
  }, [])

  useEffect(() => {
    applyThemeMode(mode)
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  }, [mode])

  return {
    mode,
    setMode,
  }
}
