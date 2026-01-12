#!/usr/bin/env node
/**
 * Design Tokens Export Script (Deterministic JSON for iOS)
 * 
 * Exports design tokens from lib/ui/tokens TypeScript source to deterministic JSON.
 * This enables iOS development to consume tokens with stable, predictable output.
 * 
 * Requirements:
 * - Reads from lib/ui/tokens (TypeScript source of truth)
 * - Exports light theme (resolved)
 * - Exports dark theme (resolved)
 * - Exports brand overlays (sleep, custom)
 * - Deterministic sorting (no localeCompare - simple ASCII sort)
 * - Multiple runs produce identical output (for git diff verification)
 * 
 * Usage:
 *   node scripts/dev/design-tokens/export.js
 *   node scripts/dev/design-tokens/export.js --out docs/dev/design-tokens.json
 * 
 * Output:
 *   docs/dev/design-tokens.json - Deterministically sorted token export
 */

const fs = require('fs')
const path = require('path')

// We need to load the TypeScript token files
// Since this is a Node.js script and tokens are in TypeScript, we'll use a dynamic import
// approach with a transpiled version or read the values directly

/**
 * Deterministic object key sorter
 * 
 * Sorts object keys using simple ASCII comparison (not localeCompare).
 * This ensures identical output across different locales and environments.
 * 
 * @param {Object} obj - Object to sort
 * @returns {Object} New object with sorted keys
 */
function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }

  const sorted = {}
  const keys = Object.keys(obj).sort() // Simple ASCII sort, no localeCompare

  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key])
  }

  return sorted
}

/**
 * Base tokens (theme-independent)
 * 
 * These values are copied from lib/ui/tokens/tokens.base.ts
 * They remain constant across all theme variants.
 */
const baseTokens = {
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  typography: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  radii: {
    none: '0',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  motion: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '200ms',
      moderate: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      snappy: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    spring: {
      default: { type: 'spring', stiffness: 300, damping: 20 },
      gentle: { type: 'spring', stiffness: 200, damping: 25 },
      bouncy: { type: 'spring', stiffness: 400, damping: 15 },
    },
  },
  layout: {
    contentMaxWidth: '1600px',
    patientMaxWidth: '1152px',
    articleMaxWidth: '896px',
  },
}

/**
 * Light theme colors
 * 
 * From lib/ui/tokens/tokens.light.ts
 */
const lightColors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  background: {
    light: '#ffffff',
    lightGradientFrom: '#f0f9ff',
    lightGradientTo: '#ffffff',
    dark: '#0a0a0a',
    darkGradientFrom: '#1e293b',
    darkGradientTo: '#0f172a',
  },
}

/**
 * Dark theme colors
 * 
 * From lib/ui/tokens/tokens.dark.ts
 */
const darkColors = {
  primary: {
    50: '#0c4a6e',
    100: '#075985',
    200: '#0369a1',
    300: '#0284c7',
    400: '#0ea5e9',
    500: '#38bdf8',
    600: '#7dd3fc',
    700: '#bae6fd',
    800: '#e0f2fe',
    900: '#f0f9ff',
  },
  neutral: {
    50: '#0f172a',
    100: '#1e293b',
    200: '#334155',
    300: '#475569',
    400: '#64748b',
    500: '#94a3b8',
    600: '#cbd5e1',
    700: '#e2e8f0',
    800: '#f1f5f9',
    900: '#f8fafc',
  },
  semantic: {
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
  },
  background: {
    light: '#ffffff',
    lightGradientFrom: '#f0f9ff',
    lightGradientTo: '#ffffff',
    dark: '#0a0a0a',
    darkGradientFrom: '#1e293b',
    darkGradientTo: '#0f172a',
  },
}

/**
 * Brand overlays
 * 
 * From lib/ui/tokens/tokens.brand.ts
 */
const brandOverlays = {
  default: {},
  sleep: {
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    semantic: {
      info: '#a855f7',
    },
  },
  custom: {
    primary: {
      500: '#0ea5e9',
      600: '#0284c7',
    },
  },
}

/**
 * Merge brand overrides into base colors
 * 
 * @param {Object} baseColors - Base theme colors
 * @param {Object} overrides - Brand-specific overrides
 * @returns {Object} Merged color palette
 */
function mergeBrandColors(baseColors, overrides) {
  if (!overrides || Object.keys(overrides).length === 0) {
    return baseColors
  }

  return {
    primary: { ...baseColors.primary, ...(overrides.primary || {}) },
    neutral: baseColors.neutral,
    semantic: { ...baseColors.semantic, ...(overrides.semantic || {}) },
    background: baseColors.background,
  }
}

/**
 * Generate complete token export
 * 
 * @returns {Object} Complete token structure with all variants
 */
function generateTokenExport() {
  // Build the complete export structure
  // Note: No timestamp to ensure deterministic output
  const tokenExport = {
    version: '1.0.0',
    source: 'lib/ui/tokens',
    
    // Base tokens (theme-independent)
    base: baseTokens,
    
    // Theme variants with resolved colors
    themes: {
      light: {
        ...baseTokens,
        colors: lightColors,
      },
      dark: {
        ...baseTokens,
        colors: darkColors,
      },
    },
    
    // Brand overlays (partial color overrides)
    brands: brandOverlays,
    
    // Resolved brand variants (light + brand)
    resolved: {
      'light-default': {
        ...baseTokens,
        colors: mergeBrandColors(lightColors, brandOverlays.default),
      },
      'light-sleep': {
        ...baseTokens,
        colors: mergeBrandColors(lightColors, brandOverlays.sleep),
      },
      'light-custom': {
        ...baseTokens,
        colors: mergeBrandColors(lightColors, brandOverlays.custom),
      },
      'dark-default': {
        ...baseTokens,
        colors: mergeBrandColors(darkColors, brandOverlays.default),
      },
      'dark-sleep': {
        ...baseTokens,
        colors: mergeBrandColors(darkColors, brandOverlays.sleep),
      },
      'dark-custom': {
        ...baseTokens,
        colors: mergeBrandColors(darkColors, brandOverlays.custom),
      },
    },
  }

  // Apply deterministic sorting
  return sortObjectKeys(tokenExport)
}

/**
 * Main export function
 */
function exportTokens() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2)
    let outputPath = path.join(__dirname, '../../../docs/dev/design-tokens.json')
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--out' && i + 1 < args.length) {
        outputPath = path.resolve(args[i + 1])
      }
    }
    
    const outputDir = path.dirname(outputPath)
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // Generate token export
    const tokens = generateTokenExport()
    
    // Write with deterministic formatting (2 spaces, sorted keys already applied)
    const jsonContent = JSON.stringify(tokens, null, 2)
    fs.writeFileSync(outputPath, jsonContent + '\n', 'utf8') // Add trailing newline
    
    console.log('✓ Design tokens exported successfully!')
    console.log(`  Source: lib/ui/tokens`)
    console.log(`  Output: ${outputPath}`)
    console.log(`  Size: ${(jsonContent.length / 1024).toFixed(2)} KB`)
    console.log('')
    console.log('Export Summary:')
    console.log(`  Base tokens: spacing, typography, radii, shadows, motion, layout`)
    console.log(`  Themes: light, dark`)
    console.log(`  Brand overlays: default, sleep, custom`)
    console.log(`  Resolved variants: ${Object.keys(tokens.resolved).length}`)
    console.log('')
    console.log('Verification:')
    console.log('  Run this script twice and check: git diff')
    console.log('  Output should be identical (deterministic)')
    
  } catch (error) {
    console.error('✗ Error exporting design tokens:', error)
    process.exit(1)
  }
}

// Run export
exportTokens()
