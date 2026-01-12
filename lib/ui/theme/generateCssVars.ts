/**
 * Generate CSS Variables from Semantic Tokens
 * 
 * This utility converts the semantic token system into CSS custom properties
 * that can be used by Tailwind and components. It ensures a single source of
 * truth for design tokens without duplication.
 * 
 * Usage:
 * - This file is used to generate CSS variable declarations
 * - The output is used in app/globals.css
 * - Can also be used for runtime theme application
 */

import { baseTokens } from '../tokens/tokens.base'
import { lightColors } from '../tokens/tokens.light'
import { darkColors } from '../tokens/tokens.dark'
import type { Colors, BaseTokens } from '../tokens/tokenTypes'

/**
 * Convert a color palette to CSS variable declarations
 */
function colorsToCssVars(colors: Colors, prefix = ''): Record<string, string> {
  const vars: Record<string, string> = {}

  // Primary colors
  Object.entries(colors.primary).forEach(([shade, value]) => {
    vars[`${prefix}--color-primary-${shade}`] = value
  })

  // Neutral colors
  Object.entries(colors.neutral).forEach(([shade, value]) => {
    vars[`${prefix}--color-neutral-${shade}`] = value
  })

  // Semantic colors
  vars[`${prefix}--color-success`] = colors.semantic.success
  vars[`${prefix}--color-warning`] = colors.semantic.warning
  vars[`${prefix}--color-error`] = colors.semantic.error
  vars[`${prefix}--color-info`] = colors.semantic.info

  // Background colors
  vars[`${prefix}--color-bg-light`] = colors.background.light
  vars[`${prefix}--color-bg-light-gradient-from`] = colors.background.lightGradientFrom
  vars[`${prefix}--color-bg-light-gradient-to`] = colors.background.lightGradientTo
  vars[`${prefix}--color-bg-dark`] = colors.background.dark
  vars[`${prefix}--color-bg-dark-gradient-from`] = colors.background.darkGradientFrom
  vars[`${prefix}--color-bg-dark-gradient-to`] = colors.background.darkGradientTo

  return vars
}

/**
 * Convert base tokens to CSS variable declarations
 */
function baseTokensToCssVars(tokens: BaseTokens, prefix = ''): Record<string, string> {
  const vars: Record<string, string> = {}

  // Spacing
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    vars[`${prefix}--spacing-${key}`] = value
  })

  // Typography - Font Sizes
  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    vars[`${prefix}--font-size-${key}`] = value
  })

  // Typography - Line Heights
  Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
    vars[`${prefix}--line-height-${key}`] = value
  })

  // Typography - Font Weights
  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    vars[`${prefix}--font-weight-${key}`] = value
  })

  // Radii
  Object.entries(tokens.radii).forEach(([key, value]) => {
    vars[`${prefix}--radius-${key}`] = value
  })

  // Shadows
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    vars[`${prefix}--shadow-${key}`] = value
  })

  // Motion - Durations
  Object.entries(tokens.motion.duration).forEach(([key, value]) => {
    vars[`${prefix}--duration-${key}`] = value
  })

  // Motion - Easing
  Object.entries(tokens.motion.easing).forEach(([key, value]) => {
    vars[`${prefix}--easing-${key}`] = value
  })

  // Layout
  Object.entries(tokens.layout).forEach(([key, value]) => {
    vars[`${prefix}--layout-${key}`] = value
  })

  return vars
}

/**
 * Generate CSS variable declarations as a string
 */
export function generateCssVarsString(
  vars: Record<string, string>,
  indent = '  '
): string {
  return Object.entries(vars)
    .map(([key, value]) => `${indent}${key}: ${value};`)
    .join('\n')
}

/**
 * Get light theme CSS variables
 */
export function getLightThemeCssVars(): Record<string, string> {
  return {
    ...baseTokensToCssVars(baseTokens),
    ...colorsToCssVars({ ...lightColors, background: lightColors.background }),
  }
}

/**
 * Get dark theme CSS variables
 */
export function getDarkThemeCssVars(): Record<string, string> {
  return colorsToCssVars({ ...darkColors, background: darkColors.background })
}

/**
 * Apply CSS variables to an element at runtime
 * Useful for dynamic theming (e.g., brand overrides)
 */
export function applyCssVars(
  element: HTMLElement,
  vars: Record<string, string>
): void {
  Object.entries(vars).forEach(([key, value]) => {
    element.style.setProperty(key, value)
  })
}

/**
 * Generate complete CSS for :root and .dark selectors
 * This can be used to generate the CSS file content
 */
export function generateThemeCss(): string {
  const lightVars = getLightThemeCssVars()
  const darkVars = getDarkThemeCssVars()

  const rootCss = `:root {\n${generateCssVarsString(lightVars)}\n}`
  const darkCss = `.dark {\n${generateCssVarsString(darkVars)}\n}`
  const darkDataThemeCss = `[data-theme="dark"] {\n${generateCssVarsString(darkVars)}\n}`

  return `${rootCss}\n\n${darkCss}\n\n${darkDataThemeCss}`
}
