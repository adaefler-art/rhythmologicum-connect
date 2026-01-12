#!/usr/bin/env node
/**
 * Design Tokens JSON Export Script
 * 
 * Exports design tokens from TypeScript source to JSON format for external tooling.
 * This enables token consumption in iOS, Android, Figma, and other design tools.
 * 
 * Usage:
 *   npm run tokens:export
 *   node scripts/design/export-tokens.ts
 * 
 * Output:
 *   public/design-tokens.json - Platform-agnostic token specification
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import design tokens
// Note: We can't directly import .ts in Node without compilation,
// so we'll create the structure directly here based on the canonical spec
const designTokens = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  
  colors: {
    primary: {
      '50': '#f0f9ff',
      '100': '#e0f2fe',
      '200': '#bae6fd',
      '300': '#7dd3fc',
      '400': '#38bdf8',
      '500': '#0ea5e9',
      '600': '#0284c7',
      '700': '#0369a1',
      '800': '#075985',
      '900': '#0c4a6e',
    },
    neutral: {
      '50': '#f8fafc',
      '100': '#f1f5f9',
      '200': '#e2e8f0',
      '300': '#cbd5e1',
      '400': '#94a3b8',
      '500': '#64748b',
      '600': '#475569',
      '700': '#334155',
      '800': '#1e293b',
      '900': '#0f172a',
    },
    semantic: {
      success: '#10b981',
      successLight: '#d1fae5',
      warning: '#f59e0b',
      warningLight: '#fef3c7',
      error: '#ef4444',
      errorLight: '#fee2e2',
      info: '#3b82f6',
      infoLight: '#dbeafe',
    },
    background: {
      light: '#ffffff',
      lightGradientFrom: '#f0f9ff',
      lightGradientTo: '#ffffff',
      dark: '#0a0a0a',
      darkGradientFrom: '#1e293b',
      darkGradientTo: '#0f172a',
    },
  },
  
  typography: {
    fontFamily: {
      sans: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'var(--font-geist-mono), Consolas, Monaco, "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
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
  
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
  },
  
  radii: {
    none: '0',
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
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
  },
  
  layout: {
    contentMaxWidth: '1600px',
    patientMaxWidth: '1152px',
    articleMaxWidth: '896px',
  },
}

/**
 * Convert design tokens to platform-specific formats
 */
function convertToPlatformFormats(tokens: typeof designTokens) {
  return {
    // Web/JSON format (default)
    web: tokens,
    
    // iOS Swift format hints
    ios: {
      note: 'Import design-tokens.json and convert to Swift Color/CGFloat extensions',
      example: 'UIColor(hex: tokens.colors.primary["500"])',
    },
    
    // Android XML format hints  
    android: {
      note: 'Import design-tokens.json and convert to colors.xml / dimens.xml',
      example: '<color name="primary_500">#0ea5e9</color>',
    },
    
    // Figma tokens format
    figma: {
      note: 'Compatible with Figma Tokens plugin format',
      format: 'https://docs.tokens.studio/',
    },
  }
}

/**
 * Main export function
 */
function exportTokens() {
  try {
    // Define output paths
    const outputDir = path.join(__dirname, '../../public')
    const outputPath = path.join(outputDir, 'design-tokens.json')
    const platformOutputPath = path.join(outputDir, 'design-tokens-platforms.json')
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // Export main tokens
    const tokensJson = JSON.stringify(designTokens, null, 2)
    fs.writeFileSync(outputPath, tokensJson, 'utf8')
    
    console.log('✓ Design tokens exported successfully!')
    console.log(`  Output: ${outputPath}`)
    console.log(`  Size: ${(tokensJson.length / 1024).toFixed(2)} KB`)
    
    // Export platform-specific hints
    const platformTokens = convertToPlatformFormats(designTokens)
    const platformJson = JSON.stringify(platformTokens, null, 2)
    fs.writeFileSync(platformOutputPath, platformJson, 'utf8')
    
    console.log('✓ Platform-specific formats generated!')
    console.log(`  Output: ${platformOutputPath}`)
    
    // Print summary
    console.log('\nToken Summary:')
    console.log(`  Colors: ${Object.keys(designTokens.colors).length} palettes`)
    console.log(`  Typography: ${Object.keys(designTokens.typography.fontSize).length} font sizes`)
    console.log(`  Spacing: ${Object.keys(designTokens.spacing).length} levels`)
    console.log(`  Radii: ${Object.keys(designTokens.radii).length} values`)
    console.log(`  Shadows: ${Object.keys(designTokens.shadows).length} elevations`)
    console.log(`  Motion: ${Object.keys(designTokens.motion.duration).length} durations`)
    
    console.log('\nUsage:')
    console.log('  Web:     Import /public/design-tokens.json')
    console.log('  iOS:     Parse JSON and generate Swift extensions')
    console.log('  Android: Parse JSON and generate colors.xml/dimens.xml')
    console.log('  Figma:   Import using Figma Tokens plugin')
    
  } catch (error) {
    console.error('✗ Error exporting design tokens:', error)
    process.exit(1)
  }
}

// Run export
exportTokens()
