/**
 * Design Tokens for Rhythmologicum Connect
 * 
 * Centralized design system tokens for spacing, typography, motion, and theming.
 * This file serves as the single source of truth for all design values used
 * across the funnel UI components.
 * 
 * Token Categories:
 * - Spacing: Consistent spacing scale for margins, padding, and gaps
 * - Typography: Font sizes, line heights, and font weights
 * - Radii: Border radius values for different component sizes
 * - Shadows: Box shadow definitions for depth and elevation
 * - Motion: Animation durations and easing functions
 * - Colors: Theme-aware color system (supports future theme variants)
 * 
 * Usage:
 * Import and use these tokens in your components instead of hardcoded values:
 * 
 * @example
 * import { spacing, typography, motion } from '@/lib/design-tokens'
 * 
 * <div className="px-4 py-3"> // Before
 * <div style={{ padding: `${spacing.md} ${spacing.lg}` }}> // After
 */

/**
 * Spacing Scale
 * 
 * Consistent spacing values following a logical scale.
 * Maps to common Tailwind spacing values but defined explicitly.
 */
export const spacing = {
  // Extra small - tight spacing
  xs: '0.5rem', // 8px - minimal gaps
  // Small - compact spacing
  sm: '0.75rem', // 12px - compact elements
  // Medium - standard spacing
  md: '1rem', // 16px - default spacing
  // Large - comfortable spacing
  lg: '1.5rem', // 24px - sections, cards
  // Extra large - generous spacing
  xl: '2rem', // 32px - major sections
  // 2X large - spacious layout
  '2xl': '3rem', // 48px - page sections
  // 3X large - maximum spacing
  '3xl': '4rem', // 64px - hero sections
} as const

/**
 * Typography Scale
 * 
 * Font sizes, line heights, and weights for consistent typography.
 */
export const typography = {
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
} as const

/**
 * Border Radius Scale
 * 
 * Rounded corner values for different component types.
 */
export const radii = {
  none: '0',
  sm: '0.375rem', // 6px - subtle rounding
  md: '0.5rem', // 8px - default buttons, inputs
  lg: '0.75rem', // 12px - cards, panels
  xl: '1rem', // 16px - prominent cards
  '2xl': '1.5rem', // 24px - mobile cards, hero elements
  full: '9999px', // Pill shape, circles
} as const

/**
 * Shadow Scale
 * 
 * Box shadow definitions for depth and elevation.
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // Subtle depth
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // Standard elevation
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // Prominent cards
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', // Floating elements
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)', // Maximum elevation
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)', // Inset shadow
} as const

/**
 * Motion/Animation Tokens
 * 
 * Consistent animation durations and easing functions.
 */
export const motion = {
  duration: {
    instant: '0ms', // No animation
    fast: '150ms', // Quick interactions
    normal: '200ms', // Standard transitions
    moderate: '300ms', // Comfortable animations
    slow: '500ms', // Deliberate animations
  },
  easing: {
    // Standard easing curves
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Custom cubic-bezier curves
    smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Smooth, natural
    snappy: 'cubic-bezier(0.4, 0.0, 0.6, 1)', // Quick start, slow end
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like bounce
  },
  // Framer Motion spring configurations
  spring: {
    default: { type: 'spring', stiffness: 300, damping: 20 },
    gentle: { type: 'spring', stiffness: 200, damping: 25 },
    bouncy: { type: 'spring', stiffness: 400, damping: 15 },
  },
} as const

/**
 * Color Theme Structure
 * 
 * Defines color tokens that can be overridden by theme variants.
 * This structure supports the `funnels.default_theme` field.
 * 
 * Theme Structure:
 * - Primary: Main brand color (sky-500 by default)
 * - Secondary: Supporting color
 * - Accent: Highlight color for CTAs
 * - Neutral: Grays for backgrounds and text
 * - Semantic: Success, warning, error, info states
 * 
 * Future Enhancement:
 * Theme variants can be loaded based on funnel.default_theme:
 * - 'stress': Blue/Sky tones (default)
 * - 'sleep': Purple/Indigo tones
 * - 'custom': User-defined colors
 */
export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f9ff', // sky-50
    100: '#e0f2fe', // sky-100
    200: '#bae6fd', // sky-200
    300: '#7dd3fc', // sky-300
    400: '#38bdf8', // sky-400
    500: '#0ea5e9', // sky-500 - primary
    600: '#0284c7', // sky-600 - primary dark
    700: '#0369a1', // sky-700
    800: '#075985', // sky-800
    900: '#0c4a6e', // sky-900
  },
  // Neutral colors (slate)
  neutral: {
    50: '#f8fafc', // slate-50
    100: '#f1f5f9', // slate-100
    200: '#e2e8f0', // slate-200
    300: '#cbd5e1', // slate-300
    400: '#94a3b8', // slate-400
    500: '#64748b', // slate-500
    600: '#475569', // slate-600
    700: '#334155', // slate-700
    800: '#1e293b', // slate-800
    900: '#0f172a', // slate-900
  },
  // Semantic colors
  semantic: {
    success: '#10b981', // green-500
    warning: '#f59e0b', // amber-500
    error: '#ef4444', // red-500
    info: '#3b82f6', // blue-500
  },
  // Background colors
  background: {
    light: '#ffffff',
    lightGradientFrom: '#f0f9ff', // sky-50
    lightGradientTo: '#ffffff',
    dark: '#0a0a0a',
    darkGradientFrom: '#1e293b', // slate-800
    darkGradientTo: '#0f172a', // slate-900
  },
} as const

/**
 * Component-Specific Token Presets
 * 
 * Pre-configured token combinations for common component patterns.
 */
export const componentTokens = {
  // Mobile Question Card
  mobileQuestionCard: {
    borderRadius: radii['2xl'],
    padding: spacing.lg,
    shadow: shadows.lg,
    headerPaddingX: spacing.md,
    headerPaddingY: spacing.md,
    contentPaddingX: spacing.lg,
    contentPaddingY: spacing.lg,
  },
  // Desktop Question Card
  desktopQuestionCard: {
    borderRadius: radii['2xl'],
    padding: '2rem', // 32px
    shadow: shadows.lg,
    headerPaddingX: spacing.lg,
    headerPaddingY: '1.25rem', // 20px
  },
  // Answer Buttons
  answerButton: {
    borderRadius: radii.xl,
    paddingX: spacing.md,
    paddingY: spacing.md,
    minHeight: '44px', // Touch target
    minWidth: '44px', // Touch target
    gap: '0.25rem', // 4px
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
  },
  // Navigation Buttons
  navigationButton: {
    borderRadius: radii.xl,
    paddingX: spacing.lg,
    paddingY: spacing.md,
    minHeight: '56px', // Larger touch target for primary actions
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    shadow: shadows.md,
    transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
  },
  // Progress Bar
  progressBar: {
    height: '0.5rem', // 8px
    borderRadius: radii.full,
    transition: `width ${motion.duration.moderate} ${motion.easing.easeOut}`,
  },
  // Helper Text / Info Boxes
  infoBox: {
    borderRadius: radii.lg,
    padding: spacing.md,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.relaxed,
  },
} as const

/**
 * Theme Variant Type
 * 
 * Type definition for theme variants.
 * This can be extended to support loading themes from funnel.default_theme.
 */
export type ThemeVariant = 'default' | 'stress' | 'sleep' | 'custom'

/**
 * Get Theme Colors
 * 
 * Helper function to retrieve theme-specific colors.
 * Currently returns default colors, but can be extended to support
 * different themes based on funnel.default_theme.
 * 
 * @param variant - Theme variant name (from funnel.default_theme)
 * @returns Color configuration for the specified theme
 * 
 * @example
 * const themeColors = getThemeColors(funnel.default_theme)
 * // Use themeColors.primary[500] for primary color
 */
export function getThemeColors(variant: ThemeVariant = 'default') {
  // Future enhancement: Load different color schemes based on variant
  // For now, return default colors (stress theme)
  return colors
}

/**
 * Export all tokens as a single object for convenience
 */
export const designTokens = {
  spacing,
  typography,
  radii,
  shadows,
  motion,
  colors,
  componentTokens,
} as const

export default designTokens
