'use client'

import { useContext } from 'react'
import { ThemeContext, type ThemeContextType } from './ThemeProvider'
import { themeConfig, type ThemeMode, type AccentColor } from './themeConfig'

/**
 * useTheme Hook
 *
 * Access theme state and controls from any component.
 * Safe to use even outside of ThemeProvider (returns default values).
 *
 * @example
 * function MyComponent() {
 *   const { mode, accent, setMode, setAccent, toggleMode } = useTheme()
 *
 *   return (
 *     <div>
 *       <p>Current mode: {mode}</p>
 *       <p>Current accent: {accent}</p>
 *       <button onClick={toggleMode}>Toggle Mode</button>
 *       <button onClick={() => setAccent('emerald')}>Set Emerald</button>
 *     </div>
 *   )
 * }
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)

  // Return a default context if used outside provider (e.g., during SSR)
  if (context === undefined) {
    return {
      mode: themeConfig.defaultMode,
      accent: themeConfig.defaultAccent,
      setMode: () => {},
      setAccent: () => {},
      toggleMode: () => {},
    }
  }

  return context
}
