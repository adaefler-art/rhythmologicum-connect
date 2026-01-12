/**
 * Light theme tokens
 * 
 * Semantic color values for light mode.
 * All raw color values are defined here - no component should reference
 * raw hex/rgb values directly except in theme token files.
 */

import type { ThemeTokens } from './tokenTypes'

/**
 * Light theme color palette
 */
export const lightColors: ThemeTokens['colors'] = {
  /**
   * Primary colors (Sky Blue)
   * Main brand color for primary actions and interactive elements
   */
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Primary brand color
    600: '#0284c7', // Primary dark (hover states)
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  /**
   * Neutral colors (Slate)
   * Grayscale palette for backgrounds, borders, and text
   */
  neutral: {
    50: '#f8fafc', // Page backgrounds
    100: '#f1f5f9', // Card backgrounds
    200: '#e2e8f0', // Light borders
    300: '#cbd5e1', // Default borders
    400: '#94a3b8', // Disabled text
    500: '#64748b', // Secondary text
    600: '#475569', // Body text
    700: '#334155', // Primary text
    800: '#1e293b', // Strong text
    900: '#0f172a', // Darkest text
  },

  /**
   * Semantic colors
   * Contextual colors for user feedback and state communication
   */
  semantic: {
    success: '#10b981', // green-500 - success messages, confirmations
    warning: '#f59e0b', // amber-500 - warnings, caution states
    error: '#ef4444', // red-500 - error messages, validation errors
    info: '#3b82f6', // blue-500 - information messages
  },

  /**
   * Background colors
   * Page and container background values
   */
  background: {
    light: '#ffffff',
    lightGradientFrom: '#f0f9ff', // sky-50
    lightGradientTo: '#ffffff',
    dark: '#0a0a0a', // Not used in light theme, but required by schema
    darkGradientFrom: '#1e293b', // Not used in light theme
    darkGradientTo: '#0f172a', // Not used in light theme
  },
}

/**
 * Light theme tokens (complete)
 */
export const lightTheme: ThemeTokens = {
  colors: lightColors,
}
