'use client'

import { createContext, useEffect, useState, type ReactNode } from 'react'
import {
  themeConfig,
  isValidThemeMode,
  isValidAccentColor,
  getAccentPalette,
  type ThemeMode,
  type AccentColor,
} from './themeConfig'

export interface ThemeContextType {
  mode: ThemeMode
  accent: AccentColor
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: AccentColor) => void
  toggleMode: () => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * ThemeProvider Component
 *
 * Provides theme context for the entire application.
 * Handles:
 * - Light/Dark mode switching
 * - Accent color selection
 * - localStorage persistence
 * - System preference detection
 * - SSR-safe initialization (no hydration mismatch)
 *
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // IMPORTANT: Keep the initial render deterministic across SSR + hydration.
  // Reading localStorage/matchMedia during the initial client render can cause React hydration
  // error #418 if the server-rendered HTML differs from the client's first render.
  const [mode, setModeState] = useState<ThemeMode>(themeConfig.defaultMode)
  const [accent, setAccentState] = useState<AccentColor>(themeConfig.defaultAccent)
  const [isInitialized, setIsInitialized] = useState(false)

  /**
   * Apply theme mode to document element
   */
  const applyMode = (newMode: ThemeMode) => {
    const root = document.documentElement
    if (newMode === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }

  /**
   * Apply accent color to document element
   * Updates CSS custom properties for primary colors
   */
  const applyAccent = (newAccent: AccentColor) => {
    const palette = getAccentPalette(newAccent)
    const root = document.documentElement

    // Set CSS custom properties for primary colors
    Object.entries(palette.primary).forEach(([shade, color]) => {
      root.style.setProperty(`--color-primary-${shade}`, color)
    })

    // Store accent as data attribute for potential CSS targeting
    root.setAttribute('data-accent', newAccent)
  }

  // Resolve initial theme after mount (prefer DOM class set by the inline script in app/layout.tsx)
  useEffect(() => {
    try {
      const root = document.documentElement

      // Resolve mode
      const domMode: ThemeMode | null = root.classList.contains('dark')
        ? 'dark'
        : root.classList.contains('light')
          ? 'light'
          : null

      const storedMode = localStorage.getItem(themeConfig.storageKeyMode)
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const resolvedMode: ThemeMode =
        (storedMode && isValidThemeMode(storedMode) ? storedMode : null) ||
        domMode ||
        (themeConfig.respectSystemPreference && prefersDark ? 'dark' : themeConfig.defaultMode)

      // Resolve accent
      const storedAccent = localStorage.getItem(themeConfig.storageKeyAccent)
      const resolvedAccent: AccentColor =
        storedAccent && isValidAccentColor(storedAccent)
          ? storedAccent
          : themeConfig.defaultAccent

      setModeState(resolvedMode)
      setAccentState(resolvedAccent)
    } catch {
      // keep defaults
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Apply mode only after initialization to avoid fighting the pre-hydration inline script
  useEffect(() => {
    if (!isInitialized) return
    applyMode(mode)
  }, [isInitialized, mode])

  // Apply accent after initialization
  useEffect(() => {
    if (!isInitialized) return
    applyAccent(accent)
  }, [isInitialized, accent])

  // Listen for system preference changes
  useEffect(() => {
    if (!themeConfig.respectSystemPreference) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set an explicit preference
      const hasStoredPreference = localStorage.getItem(themeConfig.storageKeyMode)
      if (!hasStoredPreference) {
        const newMode = e.matches ? 'dark' : 'light'
        setModeState(newMode)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  /**
   * Set theme mode and persist to localStorage
   */
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem(themeConfig.storageKeyMode, newMode)
  }

  /**
   * Set accent color and persist to localStorage
   */
  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent)
    localStorage.setItem(themeConfig.storageKeyAccent, newAccent)
  }

  /**
   * Toggle between light and dark mode
   */
  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light'
    setMode(newMode)
  }

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
