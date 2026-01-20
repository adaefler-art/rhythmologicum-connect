/**
 * Mobile UI v2 Border Radius Tokens
 * 
 * Extracted from design package: docs/rhythm_mobile_v2
 * Used for cards, buttons, pills, and other rounded elements
 */

export const mobileBorderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  full: '9999px',
} as const

export type MobileBorderRadiusToken = keyof typeof mobileBorderRadius
