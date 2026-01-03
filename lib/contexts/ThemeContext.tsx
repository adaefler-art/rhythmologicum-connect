'use client'

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  type ReactNode 
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // IMPORTANT: Keep the initial render deterministic across SSR + hydration.
  // Reading localStorage/matchMedia during the initial client render can cause React hydration
  // error #418 if the server-rendered HTML differs from the client's first render.
  const [theme, setThemeState] = useState<Theme>('light')
  const [isInitialized, setIsInitialized] = useState(false)

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }

  // Resolve initial theme after mount (prefer DOM class set by the inline script in app/layout.tsx).
  useEffect(() => {
    try {
      const root = document.documentElement
      const domTheme: Theme | null = root.classList.contains('dark')
        ? 'dark'
        : root.classList.contains('light')
          ? 'light'
          : null

      const stored = (localStorage.getItem('theme') as Theme | null) || null
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const resolved: Theme = stored || domTheme || (prefersDark ? 'dark' : 'light')

      setThemeState(resolved)
    } catch {
      // keep default
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Apply theme only after initialization to avoid fighting the pre-hydration inline script.
  useEffect(() => {
    if (!isInitialized) return
    applyTheme(theme)
  }, [isInitialized, theme])

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set an explicit preference
      const hasStoredPreference = localStorage.getItem('theme')
      if (!hasStoredPreference) {
        const newTheme = e.matches ? 'dark' : 'light'
        setThemeState(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return a default context if used outside provider (e.g., during SSR)
  if (context === undefined) {
    return {
      theme: 'light' as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    }
  }
  return context
}
