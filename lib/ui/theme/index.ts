/**
 * Theme System Exports
 *
 * Central export point for the theme system.
 */

export { ThemeProvider, ThemeContext } from './ThemeProvider'
export type { ThemeContextType } from './ThemeProvider'

export { useTheme } from './useTheme'

export {
  themeConfig,
  themeModes,
  accentColors,
  accentPalettes,
  isValidThemeMode,
  isValidAccentColor,
  getAccentPalette,
} from './themeConfig'
export type { ThemeMode, AccentColor } from './themeConfig'
