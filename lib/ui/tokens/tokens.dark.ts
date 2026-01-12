/**
 * Dark theme tokens
 * 
 * Semantic color values for dark mode.
 * All raw color values are defined here - no component should reference
 * raw hex/rgb values directly except in theme token files.
 */

import type { ThemeTokens } from './tokenTypes'

/**
 * Dark theme color palette
 * 
 * Dark mode uses inverted neutral scale and adjusted semantic colors
 * for better contrast and readability on dark backgrounds.
 */
export const darkColors: ThemeTokens['colors'] = {
  /**
   * Primary colors (Sky Blue)
   * Slightly brighter variants for better visibility on dark backgrounds
   */
  primary: {
    50: '#0c4a6e', // Inverted for dark mode
    100: '#075985',
    200: '#0369a1',
    300: '#0284c7',
    400: '#0ea5e9',
    500: '#38bdf8', // Primary brand color (lighter than light mode)
    600: '#7dd3fc', // Primary light (hover states)
    700: '#bae6fd',
    800: '#e0f2fe',
    900: '#f0f9ff',
  },

  /**
   * Neutral colors (Slate)
   * Inverted grayscale palette for dark mode
   */
  neutral: {
    50: '#0f172a', // Darkest backgrounds
    100: '#1e293b', // Dark backgrounds
    200: '#334155', // Surface backgrounds
    300: '#475569', // Subtle borders
    400: '#64748b', // Default borders
    500: '#94a3b8', // Secondary text
    600: '#cbd5e1', // Body text
    700: '#e2e8f0', // Primary text
    800: '#f1f5f9', // Strong text
    900: '#f8fafc', // Lightest text
  },

  /**
   * Semantic colors
   * Adjusted for better visibility on dark backgrounds
   */
  semantic: {
    success: '#34d399', // green-400 - brighter for dark mode
    warning: '#fbbf24', // amber-400 - brighter for dark mode
    error: '#f87171', // red-400 - brighter for dark mode
    info: '#60a5fa', // blue-400 - brighter for dark mode
  },

  /**
   * Background colors
   * Dark mode backgrounds and gradients
   */
  background: {
    light: '#ffffff', // Not used in dark theme, but required by schema
    lightGradientFrom: '#f0f9ff', // Not used in dark theme
    lightGradientTo: '#ffffff', // Not used in dark theme
    dark: '#0a0a0a', // Main dark background
    darkGradientFrom: '#1e293b', // slate-800
    darkGradientTo: '#0f172a', // slate-900
  },
}

/**
 * Dark theme tokens (complete)
 */
export const darkTheme: ThemeTokens = {
  colors: darkColors,
}
