/**
 * Tests for semantic token system
 * 
 * Validates that the token system works as expected:
 * - getTokens returns deterministic results
 * - Theme variants work correctly
 * - Brand overrides are applied properly
 * - All token schemas validate correctly
 */

import {
  getTokens,
  defaultTokens,
  baseTokens,
  lightTheme,
  darkTheme,
  sleepBrandOverrides,
  spacing,
  typography,
  radii,
  shadows,
  motion,
  colors,
} from '../index'
import {
  BaseTokensSchema,
  DesignTokensSchema,
  ThemeConfigSchema,
  ColorsSchema,
} from '../tokenTypes'

describe('Token System', () => {
  describe('getTokens()', () => {
    it('returns deterministic results for the same config', () => {
      const tokens1 = getTokens()
      const tokens2 = getTokens()

      expect(tokens1).toEqual(tokens2)
    })

    it('returns light theme by default', () => {
      const tokens = getTokens()

      expect(tokens.colors).toEqual(lightTheme.colors)
    })

    it('returns dark theme when mode is dark', () => {
      const tokens = getTokens({ mode: 'dark' })

      expect(tokens.colors).toEqual(darkTheme.colors)
    })

    it('includes base tokens in all themes', () => {
      const lightTokens = getTokens({ mode: 'light' })
      const darkTokens = getTokens({ mode: 'dark' })

      expect(lightTokens.spacing).toEqual(baseTokens.spacing)
      expect(lightTokens.typography).toEqual(baseTokens.typography)
      expect(lightTokens.radii).toEqual(baseTokens.radii)
      expect(lightTokens.shadows).toEqual(baseTokens.shadows)
      expect(lightTokens.motion).toEqual(baseTokens.motion)
      expect(lightTokens.layout).toEqual(baseTokens.layout)

      expect(darkTokens.spacing).toEqual(baseTokens.spacing)
      expect(darkTokens.typography).toEqual(baseTokens.typography)
    })

    it('applies brand overrides correctly', () => {
      const customPrimary = '#ff0000'
      const tokens = getTokens({
        mode: 'light',
        brandOverrides: {
          primary: { 500: customPrimary },
        },
      })

      expect(tokens.colors.primary[500]).toBe(customPrimary)
      // Other shades should remain unchanged
      expect(tokens.colors.primary[600]).toBe(lightTheme.colors.primary[600])
    })

    it('applies predefined brand overrides', () => {
      const tokens = getTokens({
        mode: 'light',
        brandOverrides: sleepBrandOverrides,
      })

      expect(tokens.colors.primary[500]).toBe(sleepBrandOverrides.primary?.[500])
      expect(tokens.colors.semantic.info).toBe(sleepBrandOverrides.semantic?.info)
    })

    it('does not mutate original theme objects', () => {
      const originalPrimary = { ...lightTheme.colors.primary }

      getTokens({
        mode: 'light',
        brandOverrides: {
          primary: { 500: '#ff0000' },
        },
      })

      expect(lightTheme.colors.primary).toEqual(originalPrimary)
    })
  })

  describe('Base Tokens', () => {
    it('exports spacing tokens', () => {
      expect(spacing.xs).toBe('0.5rem')
      expect(spacing.md).toBe('1rem')
      expect(spacing.xl).toBe('2rem')
    })

    it('exports typography tokens', () => {
      expect(typography.fontSize.base).toBe('1rem')
      expect(typography.fontSize['2xl']).toBe('1.5rem')
      expect(typography.lineHeight.normal).toBe('1.5')
      expect(typography.fontWeight.bold).toBe('700')
    })

    it('exports radii tokens', () => {
      expect(radii.sm).toBe('0.375rem')
      expect(radii.md).toBe('0.5rem')
      expect(radii.full).toBe('9999px')
    })

    it('exports shadow tokens', () => {
      expect(shadows.none).toBe('none')
      expect(shadows.sm).toContain('rgb(0 0 0 / 0.05)')
      expect(shadows.md).toContain('rgb(0 0 0 / 0.1)')
    })

    it('exports motion tokens', () => {
      expect(motion.duration.fast).toBe('150ms')
      expect(motion.duration.normal).toBe('200ms')
      expect(motion.easing.smooth).toContain('cubic-bezier')
      expect(motion.spring.default.type).toBe('spring')
    })
  })

  describe('Color Tokens', () => {
    it('exports color tokens', () => {
      expect(colors.primary[500]).toBe('#0ea5e9')
      expect(colors.neutral[500]).toBe('#64748b')
      expect(colors.semantic.success).toBe('#10b981')
      expect(colors.semantic.error).toBe('#ef4444')
    })

    it('light theme has correct primary colors', () => {
      expect(lightTheme.colors.primary[500]).toBe('#0ea5e9')
      expect(lightTheme.colors.primary[600]).toBe('#0284c7')
    })

    it('dark theme has inverted/adjusted colors', () => {
      // Dark mode uses lighter variants
      expect(darkTheme.colors.primary[500]).toBe('#38bdf8')
      // Semantic colors are brighter in dark mode
      expect(darkTheme.colors.semantic.success).toBe('#34d399')
    })
  })

  describe('Default Exports', () => {
    it('exports defaultTokens', () => {
      expect(defaultTokens).toBeDefined()
      expect(defaultTokens.spacing).toBeDefined()
      expect(defaultTokens.colors).toBeDefined()
    })

    it('defaultTokens match light theme with no overrides', () => {
      const expectedTokens = getTokens({ mode: 'light' })
      expect(defaultTokens).toEqual(expectedTokens)
    })
  })

  describe('Schema Validation', () => {
    it('validates base tokens schema', () => {
      const result = BaseTokensSchema.safeParse(baseTokens)
      expect(result.success).toBe(true)
    })

    it('validates complete design tokens schema', () => {
      const tokens = getTokens()
      const result = DesignTokensSchema.safeParse(tokens)
      expect(result.success).toBe(true)
    })

    it('validates light theme colors', () => {
      const result = ColorsSchema.safeParse(lightTheme.colors)
      expect(result.success).toBe(true)
    })

    it('validates dark theme colors', () => {
      const result = ColorsSchema.safeParse(darkTheme.colors)
      expect(result.success).toBe(true)
    })

    it('validates theme config schema', () => {
      const config = { mode: 'light' as const }
      const result = ThemeConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('rejects invalid theme config', () => {
      const config = { mode: 'invalid' }
      const result = ThemeConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })
  })

  describe('Type Safety', () => {
    it('enforces correct spacing keys', () => {
      // This is a compile-time check, but we can verify runtime behavior
      const spacingKeys = Object.keys(spacing)
      expect(spacingKeys).toContain('xs')
      expect(spacingKeys).toContain('md')
      expect(spacingKeys).toContain('xl')
      expect(spacingKeys).toContain('2xl')
      expect(spacingKeys).toContain('3xl')
    })

    it('enforces correct color palette keys', () => {
      const primaryKeys = Object.keys(colors.primary).map(Number)
      expect(primaryKeys).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900])
    })
  })

  describe('No Raw Values in Components (Convention)', () => {
    it('tokens provide all necessary values', () => {
      // Verify that we have comprehensive token coverage
      // so components don't need raw values

      // Spacing
      expect(spacing).toHaveProperty('xs')
      expect(spacing).toHaveProperty('sm')
      expect(spacing).toHaveProperty('md')
      expect(spacing).toHaveProperty('lg')
      expect(spacing).toHaveProperty('xl')

      // Colors - all required palettes
      expect(colors).toHaveProperty('primary')
      expect(colors).toHaveProperty('neutral')
      expect(colors).toHaveProperty('semantic')
      expect(colors).toHaveProperty('background')

      // Typography - all necessary scales
      expect(typography.fontSize).toHaveProperty('xs')
      expect(typography.fontSize).toHaveProperty('base')
      expect(typography.fontSize).toHaveProperty('4xl')
      expect(typography.lineHeight).toHaveProperty('normal')
      expect(typography.fontWeight).toHaveProperty('bold')

      // Radii - all common sizes
      expect(radii).toHaveProperty('sm')
      expect(radii).toHaveProperty('md')
      expect(radii).toHaveProperty('full')

      // Shadows - elevation scale
      expect(shadows).toHaveProperty('sm')
      expect(shadows).toHaveProperty('md')
      expect(shadows).toHaveProperty('lg')
    })
  })
})
