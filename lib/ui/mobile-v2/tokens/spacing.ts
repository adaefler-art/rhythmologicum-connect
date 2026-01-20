/**
 * Mobile UI v2 Spacing Tokens
 * 
 * Extracted from design package: docs/rhythm_mobile_v2
 * Single source of truth for spacing scale
 */

export const mobileSpacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.5rem', // 24px
  '2xl': '2rem', // 32px
  '3xl': '3rem', // 48px
} as const

export type MobileSpacingToken = keyof typeof mobileSpacing
