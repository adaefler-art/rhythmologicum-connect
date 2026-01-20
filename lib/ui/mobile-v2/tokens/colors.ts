/**
 * Mobile UI v2 Color Tokens
 * 
 * Extracted from design package: docs/rhythm_mobile_v2
 * Single source of truth for mobile UI colors
 * Scoped to mobile-v2 to avoid interference with Studio UI
 */

export const mobileColors = {
  // Primary gradient colors (Blue to Purple)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#4a90e2',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Secondary purple accent
  secondary: {
    500: '#6c63ff',
    600: '#5850e6',
  },

  // Status colors
  success: {
    50: '#dcfce7',
    100: '#bbf7d0',
    500: '#5cb85c',
    600: '#22c55e',
  },

  warning: {
    50: '#fef9c3',
    100: '#fef08a',
    500: '#f0ad4e',
    600: '#eab308',
  },

  danger: {
    50: '#fee2e2',
    100: '#fecaca',
    500: '#d9534f',
    600: '#ef4444',
  },

  orange: {
    50: '#ffedd5',
    100: '#fed7aa',
    500: '#f97316',
  },

  // Neutral grays
  neutral: {
    50: '#f7f9fc',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const

export type MobileColorToken = keyof typeof mobileColors
