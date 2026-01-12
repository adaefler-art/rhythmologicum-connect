/**
 * Brand token overrides
 * 
 * Provides a mechanism to override default theme colors with brand-specific
 * accent colors. This allows for partial customization without replacing
 * the entire color system.
 * 
 * Overrides are applied as Partial types, meaning you can override
 * individual shades or the entire palette.
 */

import type { BrandOverrides } from './tokenTypes'

/**
 * Default brand overrides (empty - uses base theme colors)
 * 
 * This can be customized per organization or funnel to provide
 * brand-specific accent colors while maintaining the core design system.
 * 
 * @example
 * // Custom brand with purple accent
 * export const customBrandOverrides: BrandOverrides = {
 *   primary: {
 *     500: '#8b5cf6', // purple-500
 *     600: '#7c3aed', // purple-600
 *   },
 *   semantic: {
 *     info: '#8b5cf6', // Match purple theme
 *   },
 * }
 */
export const defaultBrandOverrides: BrandOverrides = {}

/**
 * Example: Sleep assessment brand variant (purple tones)
 * 
 * Uncomment and use this for sleep-specific funnels or assessments
 */
export const sleepBrandOverrides: BrandOverrides = {
  primary: {
    50: '#faf5ff', // purple-50
    100: '#f3e8ff', // purple-100
    200: '#e9d5ff', // purple-200
    300: '#d8b4fe', // purple-300
    400: '#c084fc', // purple-400
    500: '#a855f7', // purple-500 - primary
    600: '#9333ea', // purple-600 - primary dark
    700: '#7e22ce', // purple-700
    800: '#6b21a8', // purple-800
    900: '#581c87', // purple-900
  },
  semantic: {
    info: '#a855f7', // Match purple theme for info
  },
}

/**
 * Example: Custom organization brand
 * 
 * Shows how to override specific shades while keeping others
 */
export const customBrandOverrides: BrandOverrides = {
  primary: {
    // Only override the main shades used in UI
    500: '#0ea5e9', // sky-500 (default, can be changed)
    600: '#0284c7', // sky-600 (default, can be changed)
  },
}

/**
 * Get brand overrides by identifier
 * 
 * @param brandId - Brand identifier (e.g., 'default', 'sleep', 'custom')
 * @returns Brand override configuration
 */
export function getBrandOverrides(brandId?: string): BrandOverrides {
  switch (brandId) {
    case 'sleep':
      return sleepBrandOverrides
    case 'custom':
      return customBrandOverrides
    case 'default':
    default:
      return defaultBrandOverrides
  }
}
