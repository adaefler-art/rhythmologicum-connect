/**
 * Mobile UI v2 Typography Tokens
 * 
 * Extracted from design package: docs/rhythm_mobile_v2
 * Font sizes, weights, and line heights for mobile UI
 */

export const mobileTypography = {
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const

export type MobileFontSizeToken = keyof typeof mobileTypography.fontSize
export type MobileFontWeightToken = keyof typeof mobileTypography.fontWeight
export type MobileLineHeightToken = keyof typeof mobileTypography.lineHeight
