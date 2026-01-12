/**
 * Type definitions for design tokens
 * 
 * Provides TypeScript types and Zod schemas for runtime validation
 * of design token values. This ensures type safety and enables
 * validation when loading tokens from external sources.
 */

import { z } from 'zod'

/**
 * Spacing scale values
 */
export const SpacingSchema = z.object({
  xs: z.string(),
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
  '2xl': z.string(),
  '3xl': z.string(),
})

export type Spacing = z.infer<typeof SpacingSchema>

/**
 * Typography scale
 */
export const TypographySchema = z.object({
  fontSize: z.object({
    xs: z.string(),
    sm: z.string(),
    base: z.string(),
    lg: z.string(),
    xl: z.string(),
    '2xl': z.string(),
    '3xl': z.string(),
    '4xl': z.string(),
  }),
  lineHeight: z.object({
    tight: z.string(),
    normal: z.string(),
    relaxed: z.string(),
    loose: z.string(),
  }),
  fontWeight: z.object({
    normal: z.string(),
    medium: z.string(),
    semibold: z.string(),
    bold: z.string(),
  }),
})

export type Typography = z.infer<typeof TypographySchema>

/**
 * Border radius scale
 */
export const RadiiSchema = z.object({
  none: z.string(),
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
  '2xl': z.string(),
  full: z.string(),
})

export type Radii = z.infer<typeof RadiiSchema>

/**
 * Shadow scale
 */
export const ShadowsSchema = z.object({
  none: z.string(),
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
  '2xl': z.string(),
  inner: z.string(),
})

export type Shadows = z.infer<typeof ShadowsSchema>

/**
 * Motion/animation tokens
 */
export const MotionSchema = z.object({
  duration: z.object({
    instant: z.string(),
    fast: z.string(),
    normal: z.string(),
    moderate: z.string(),
    slow: z.string(),
  }),
  easing: z.object({
    linear: z.string(),
    ease: z.string(),
    easeIn: z.string(),
    easeOut: z.string(),
    easeInOut: z.string(),
    smooth: z.string(),
    snappy: z.string(),
    spring: z.string(),
  }),
  spring: z.object({
    default: z.object({
      type: z.literal('spring'),
      stiffness: z.number(),
      damping: z.number(),
    }),
    gentle: z.object({
      type: z.literal('spring'),
      stiffness: z.number(),
      damping: z.number(),
    }),
    bouncy: z.object({
      type: z.literal('spring'),
      stiffness: z.number(),
      damping: z.number(),
    }),
  }),
})

export type Motion = z.infer<typeof MotionSchema>

/**
 * Color palette (10-shade scale)
 */
export const ColorPaletteSchema = z.object({
  50: z.string(),
  100: z.string(),
  200: z.string(),
  300: z.string(),
  400: z.string(),
  500: z.string(),
  600: z.string(),
  700: z.string(),
  800: z.string(),
  900: z.string(),
})

export type ColorPalette = z.infer<typeof ColorPaletteSchema>

/**
 * Semantic colors
 */
export const SemanticColorsSchema = z.object({
  success: z.string(),
  warning: z.string(),
  error: z.string(),
  info: z.string(),
})

export type SemanticColors = z.infer<typeof SemanticColorsSchema>

/**
 * Background colors
 */
export const BackgroundColorsSchema = z.object({
  light: z.string(),
  lightGradientFrom: z.string(),
  lightGradientTo: z.string(),
  dark: z.string(),
  darkGradientFrom: z.string(),
  darkGradientTo: z.string(),
})

export type BackgroundColors = z.infer<typeof BackgroundColorsSchema>

/**
 * Complete color system
 */
export const ColorsSchema = z.object({
  primary: ColorPaletteSchema,
  neutral: ColorPaletteSchema,
  semantic: SemanticColorsSchema,
  background: BackgroundColorsSchema,
})

export type Colors = z.infer<typeof ColorsSchema>

/**
 * Layout constraints
 */
export const LayoutSchema = z.object({
  contentMaxWidth: z.string(),
  patientMaxWidth: z.string(),
  articleMaxWidth: z.string(),
})

export type Layout = z.infer<typeof LayoutSchema>

/**
 * Base tokens (theme-independent)
 */
export const BaseTokensSchema = z.object({
  spacing: SpacingSchema,
  typography: TypographySchema,
  radii: RadiiSchema,
  shadows: ShadowsSchema,
  motion: MotionSchema,
  layout: LayoutSchema,
})

export type BaseTokens = z.infer<typeof BaseTokensSchema>

/**
 * Theme-specific tokens
 */
export const ThemeTokensSchema = z.object({
  colors: ColorsSchema,
})

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>

/**
 * Complete token set (base + theme)
 */
export const DesignTokensSchema = BaseTokensSchema.merge(ThemeTokensSchema)

export type DesignTokens = z.infer<typeof DesignTokensSchema>

/**
 * Theme configuration
 */
export const ThemeConfigSchema = z.object({
  mode: z.enum(['light', 'dark']).default('light'),
  brandOverrides: z
    .object({
      primary: ColorPaletteSchema.partial().optional(),
      semantic: SemanticColorsSchema.partial().optional(),
    })
    .optional(),
})

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>

/**
 * Brand override configuration
 */
export type BrandOverrides = {
  primary?: Partial<ColorPalette>
  semantic?: Partial<SemanticColors>
}
