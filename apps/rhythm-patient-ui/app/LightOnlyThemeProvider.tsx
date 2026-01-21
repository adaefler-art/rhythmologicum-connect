'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { accentPalettes, type AccentColor } from '@/lib/ui/theme/themeConfig'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  accent: AccentColor
  setAccent: (accent: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * LightOnlyThemeProvider
 * 
 * A simplified theme provider for the patient mobile UI that enforces light mode only.
 * 
 * Features:
 * - Always returns 'light' as the theme
 * - Clears any persisted theme values on mount
 * - Provides no-op functions for theme toggling (for compatibility)
 * - Still supports accent color changes
 * 
 * Mobile v2 is light-only for stability and testability.
 */
export function LightOnlyThemeProvider({ children }: { children: ReactNode }) {
  const theme: Theme = 'light'
  const accent: AccentColor = 'sky'

  useEffect(() => {
    // Clear any persisted theme values
    try {
      localStorage.removeItem('theme')
      localStorage.removeItem('theme-accent')
    } catch {
      // Ignore errors
    }

    // Ensure light mode is applied
    const root = document.documentElement
    root.classList.add('light')
    root.classList.remove('dark')

    // Apply default accent
    const palette = accentPalettes[accent].primary
    Object.entries(palette).forEach(([shade, color]) => {
      root.style.setProperty(`--color-primary-${shade}`, color)
    })
    root.setAttribute('data-accent', accent)
  }, [])

  // No-op functions for compatibility with existing components
  const setTheme = () => {}
  const toggleTheme = () => {}
  const setAccent = () => {}

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return a default context if used outside provider
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
