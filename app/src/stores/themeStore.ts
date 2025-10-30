import { create } from 'zustand'
import { Theme } from '@/types'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  initTheme: () => void
}

const THEME_STORAGE_KEY = 'app-theme'

const getSystemTheme = (): 'light' | 'dark' => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

const getStoredTheme = (): Theme => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

const applyTheme = (resolvedTheme: 'light' | 'dark') => {
  const root = document.documentElement
  if (resolvedTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',

  setTheme: (theme: Theme) => {
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    applyTheme(resolvedTheme)
    set({ theme, resolvedTheme })
  },

  initTheme: () => {
    const storedTheme = getStoredTheme()
    const resolvedTheme = storedTheme === 'system' ? getSystemTheme() : storedTheme
    applyTheme(resolvedTheme)
    set({ theme: storedTheme, resolvedTheme })

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const { theme } = get()
      if (theme === 'system') {
        const newResolvedTheme = e.matches ? 'dark' : 'light'
        applyTheme(newResolvedTheme)
        set({ resolvedTheme: newResolvedTheme })
      }
    })
  }
}))
