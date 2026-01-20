/**
 * Mobile UI v2 Shadow Tokens
 * 
 * Extracted from design package: docs/rhythm_mobile_v2
 * Consistent shadow system for elevation
 */

export const mobileShadows = {
  sm: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
  md: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)',
} as const

export type MobileShadowToken = keyof typeof mobileShadows
