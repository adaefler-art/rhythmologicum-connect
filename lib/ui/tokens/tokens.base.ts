/**
 * Base design tokens
 * 
 * Theme-independent baseline scales for spacing, typography, radii, shadows,
 * motion, and layout. These values remain consistent across all theme variants.
 * 
 * These tokens are Tailwind-independent but can be consumed by Tailwind configuration.
 */

import type { BaseTokens } from './tokenTypes'

/**
 * Spacing scale
 * 
 * Consistent spacing values following a logical scale.
 * Used for margins, padding, and gaps throughout the application.
 */
export const spacing: BaseTokens['spacing'] = {
  xs: '0.5rem', // 8px - minimal gaps
  sm: '0.75rem', // 12px - compact elements
  md: '1rem', // 16px - default spacing
  lg: '1.5rem', // 24px - sections, cards
  xl: '2rem', // 32px - major sections
  '2xl': '3rem', // 48px - page sections
  '3xl': '4rem', // 64px - hero sections
}

/**
 * Typography scale
 * 
 * Font sizes, line heights, and weights for consistent typography.
 */
export const typography: BaseTokens['typography'] = {
  fontSize: {
    xs: '0.75rem', // 12px - small labels, captions
    sm: '0.875rem', // 14px - secondary text
    base: '1rem', // 16px - body text, inputs
    lg: '1.125rem', // 18px - emphasized text
    xl: '1.25rem', // 20px - small headings
    '2xl': '1.5rem', // 24px - section headings
    '3xl': '1.875rem', // 30px - page titles
    '4xl': '2.25rem', // 36px - hero headings
  },
  lineHeight: {
    tight: '1.25', // Compact text
    normal: '1.5', // Standard reading
    relaxed: '1.625', // Comfortable reading
    loose: '2', // Spacious text
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
}

/**
 * Border radius scale
 * 
 * Rounded corner values for different component types.
 */
export const radii: BaseTokens['radii'] = {
  none: '0',
  sm: '0.375rem', // 6px - subtle rounding
  md: '0.5rem', // 8px - default buttons, inputs
  lg: '0.75rem', // 12px - cards, panels
  xl: '1rem', // 16px - prominent cards
  '2xl': '1.5rem', // 24px - mobile cards, hero elements
  full: '9999px', // Pill shape, circles
}

/**
 * Shadow scale
 * 
 * Box shadow definitions for depth and elevation.
 * Shadows use consistent opacity values for visual coherence.
 */
export const shadows: BaseTokens['shadows'] = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // Subtle depth
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // Standard elevation
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // Prominent cards
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', // Floating elements
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)', // Maximum elevation
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)', // Inset shadow
}

/**
 * Motion/animation tokens
 * 
 * Consistent animation durations and easing functions.
 * Includes standard CSS easing and Framer Motion spring configurations.
 */
export const motion: BaseTokens['motion'] = {
  duration: {
    instant: '0ms', // No animation
    fast: '150ms', // Quick interactions
    normal: '200ms', // Standard transitions
    moderate: '300ms', // Comfortable animations
    slow: '500ms', // Deliberate animations
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Smooth, natural
    snappy: 'cubic-bezier(0.4, 0.0, 0.6, 1)', // Quick start, slow end
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like bounce
  },
  spring: {
    default: { type: 'spring' as const, stiffness: 300, damping: 20 },
    gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
    bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
  },
}

/**
 * Layout constraints
 * 
 * Maximum width values for content containers at different layout levels.
 * Ensures consistent content width across the application.
 */
export const layout: BaseTokens['layout'] = {
  contentMaxWidth: '1600px', // ~100rem - Clinician dashboard, wide tables
  patientMaxWidth: '1152px', // 72rem - Patient-facing content
  articleMaxWidth: '896px', // 56rem - Article-style content
}

/**
 * Combined base tokens
 */
export const baseTokens: BaseTokens = {
  spacing,
  typography,
  radii,
  shadows,
  motion,
  layout,
}
