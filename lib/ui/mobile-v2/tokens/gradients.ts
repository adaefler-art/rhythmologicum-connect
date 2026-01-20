/**
 * Mobile UI v2 Gradient Tokens
 * 
 * Extracted from design package: docs/rhythm_mobile_v2
 * Used for primary buttons and accent elements
 */

export const mobileGradients = {
  primary: 'linear-gradient(135deg, #4a90e2 0%, #6c63ff 100%)',
  success: 'linear-gradient(135deg, #5cb85c 0%, #22c55e 100%)',
  warning: 'linear-gradient(135deg, #f0ad4e 0%, #eab308 100%)',
} as const

export type MobileGradientToken = keyof typeof mobileGradients
