/**
 * Design Tokens - Entry Point
 * 
 * Central export point for the semantic token system.
 * Provides a `getTokens(themeConfig)` function that returns a deterministic
 * token object based on theme configuration.
 * 
 * This is the source of truth for all design tokens in the application.
 * No component should reference raw color values or hardcoded dimensions
 * except within the token definition files themselves.
 */

import { baseTokens } from './tokens.base'
import { lightTheme } from './tokens.light'
import { darkTheme } from './tokens.dark'
import { getBrandOverrides } from './tokens.brand'
import type { DesignTokens, ThemeConfig, Colors, BrandOverrides } from './tokenTypes'

/**
 * Deep merge helper for partial color overrides
 * 
 * Merges brand overrides into base theme colors at the palette level.
 * Only merges defined values, preserving undefined/null values from base.
 */
function mergeColors(base: Colors, overrides?: BrandOverrides): Colors {
  if (!overrides) return base

  return {
    primary: { ...base.primary, ...(overrides.primary || {}) },
    neutral: base.neutral,
    semantic: { ...base.semantic, ...(overrides.semantic || {}) },
    background: base.background,
  }
}

/**
 * Get complete design tokens based on theme configuration
 * 
 * This function is deterministic - given the same config, it always returns
 * the same token object. This ensures consistency and predictability.
 * 
 * @param config - Theme configuration (mode, brand overrides)
 * @returns Complete design token set
 * 
 * @example
 * // Default light theme
 * const tokens = getTokens()
 * 
 * @example
 * // Dark theme
 * const tokens = getTokens({ mode: 'dark' })
 * 
 * @example
 * // Light theme with brand overrides
 * const tokens = getTokens({
 *   mode: 'light',
 *   brandOverrides: {
 *     primary: { 500: '#8b5cf6', 600: '#7c3aed' }
 *   }
 * })
 * 
 * @example
 * // Using a predefined brand
 * import { sleepBrandOverrides } from './tokens.brand'
 * const tokens = getTokens({
 *   mode: 'light',
 *   brandOverrides: sleepBrandOverrides
 * })
 */
export function getTokens(config?: ThemeConfig): DesignTokens {
  // Default to light theme if no config provided
  const mode = config?.mode ?? 'light'

  // Select base theme colors based on mode
  const baseTheme = mode === 'dark' ? darkTheme : lightTheme

  // Apply brand overrides if provided
  const colors = mergeColors(baseTheme.colors, config?.brandOverrides)

  // Combine base tokens with theme-specific colors
  return {
    ...baseTokens,
    colors,
  }
}

/**
 * Default tokens (light theme, no overrides)
 * 
 * Pre-computed token set for the most common case.
 * Use this when you don't need dynamic theming.
 */
export const defaultTokens = getTokens()

// Re-export everything for convenient imports
export { baseTokens } from './tokens.base'
export { lightTheme, lightColors } from './tokens.light'
export { darkTheme, darkColors } from './tokens.dark'
export { getBrandOverrides, sleepBrandOverrides, customBrandOverrides } from './tokens.brand'
export * from './tokenTypes'

// Export individual token categories for selective imports
export const { spacing, typography, radii, shadows, motion, layout } = baseTokens
export const { colors } = defaultTokens
