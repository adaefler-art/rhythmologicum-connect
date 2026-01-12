/**
 * Theme Configuration for Rhythmologicum Connect
 *
 * Defines the available theme modes (light/dark) and accent colors.
 * This configuration serves as the single source of truth for theme options.
 *
 * Usage:
 * @example
 * import { themeConfig, isValidThemeMode, isValidAccentColor } from '@/lib/ui/theme/themeConfig'
 *
 * if (isValidThemeMode('dark')) {
 *   // Apply dark mode
 * }
 */

/**
 * Available theme modes
 */
export const themeModes = ['light', 'dark'] as const
export type ThemeMode = (typeof themeModes)[number]

/**
 * Available accent colors
 * Each accent defines a primary color palette used throughout the application
 */
export const accentColors = ['sky', 'emerald', 'violet', 'amber'] as const
export type AccentColor = (typeof accentColors)[number]

/**
 * Accent color palettes
 * Maps each accent to its corresponding color values
 */
export const accentPalettes: Record<
  AccentColor,
  {
    name: string
    description: string
    primary: {
      50: string
      100: string
      200: string
      300: string
      400: string
      500: string
      600: string
      700: string
      800: string
      900: string
    }
  }
> = {
  sky: {
    name: 'Sky Blue',
    description: 'Default calm, medical theme',
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },
  emerald: {
    name: 'Emerald Green',
    description: 'Growth and wellness theme',
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
  },
  violet: {
    name: 'Violet Purple',
    description: 'Focus and mindfulness theme',
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
  },
  amber: {
    name: 'Amber Gold',
    description: 'Energy and warmth theme',
    primary: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
  },
}

/**
 * Default theme configuration
 */
export const themeConfig = {
  /**
   * Default theme mode
   * If not set in localStorage, will fallback to system preference
   */
  defaultMode: 'light' as ThemeMode,

  /**
   * Default accent color
   */
  defaultAccent: 'sky' as AccentColor,

  /**
   * Whether to respect system color scheme preference
   * If true, will use system preference when no user preference is stored
   */
  respectSystemPreference: true,

  /**
   * localStorage key for theme mode
   */
  storageKeyMode: 'theme',

  /**
   * localStorage key for accent color
   */
  storageKeyAccent: 'theme-accent',
} as const

/**
 * Type guard to check if a value is a valid theme mode
 */
export function isValidThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && themeModes.includes(value as ThemeMode)
}

/**
 * Type guard to check if a value is a valid accent color
 */
export function isValidAccentColor(value: unknown): value is AccentColor {
  return typeof value === 'string' && accentColors.includes(value as AccentColor)
}

/**
 * Get the color palette for a given accent
 */
export function getAccentPalette(accent: AccentColor) {
  return accentPalettes[accent]
}
