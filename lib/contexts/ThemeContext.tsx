'use client'

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  type ReactNode 
} from 'react'
import { accentPalettes } from '@/lib/ui/theme/themeConfig'

type Theme = 'light' | 'dark'
type AccentColor = 'sky' | 'emerald' | 'violet' | 'amber'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  accent: AccentColor
  setAccent: (accent: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // IMPORTANT: Keep the initial render deterministic across SSR + hydration.
  // Reading localStorage/matchMedia during the initial client render can cause React hydration
  // error #418 if the server-rendered HTML differs from the client's first render.
  const [theme, setThemeState] = useState<Theme>('light')
  const [accent, setAccentState] = useState<AccentColor>('sky')
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

  const applyAccent = (newAccent: AccentColor) => {
    const palette = accentPalettes[newAccent].primary
    const root = document.documentElement

    // Set CSS custom properties for primary colors
    Object.entries(palette).forEach(([shade, color]) => {
      root.style.setProperty(`--color-primary-${shade}`, color)
    })

    // Store accent as data attribute for potential CSS targeting
    root.setAttribute('data-accent', newAccent)
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

      // Resolve accent
      const storedAccent = localStorage.getItem('theme-accent')
      const validAccentColors: AccentColor[] = ['sky', 'emerald', 'violet', 'amber']
      const resolvedAccent: AccentColor =
        storedAccent && validAccentColors.includes(storedAccent as AccentColor)
          ? (storedAccent as AccentColor)
          : 'sky'

      setThemeState(resolved)
      setAccentState(resolvedAccent)
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

  // Apply accent after initialization
  useEffect(() => {
    if (!isInitialized) return
    applyAccent(accent)
  }, [isInitialized, accent])

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

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent)
    localStorage.setItem('theme-accent', newAccent)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, accent, setAccent }}>
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
      accent: 'sky' as AccentColor,
      setAccent: () => {},
    }
  }
  return context
}
