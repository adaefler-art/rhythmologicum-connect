#!/usr/bin/env node
/**
 * Design Tokens JSON Export Script (JavaScript version)
 * 
 * Exports design tokens from canonical spec to JSON format for external tooling.
 * This enables token consumption in iOS, Android, Figma, and other design tools.
 * 
 * Usage:
 *   npm run tokens:export
 *   node scripts/design/export-tokens.js
 * 
 * Output:
 *   public/design-tokens.json - Platform-agnostic token specification
 */

const fs = require('fs')
const path = require('path')

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
  
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
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
  },
  
  layout: {
    contentMaxWidth: '1600px',
    patientMaxWidth: '1152px',
    articleMaxWidth: '896px',
  },
}

function convertToPlatformFormats(tokens) {
  return {
    web: tokens,
    ios: {
      note: 'Import design-tokens.json and convert to Swift Color/CGFloat extensions',
      example: 'UIColor(hex: tokens.colors.primary["500"])',
    },
    android: {
      note: 'Import design-tokens.json and convert to colors.xml / dimens.xml',
      example: '<color name="primary_500">#0ea5e9</color>',
    },
    figma: {
      note: 'Compatible with Figma Tokens plugin format',
      format: 'https://docs.tokens.studio/',
    },
  }
}

function exportTokens() {
  try {
    const outputDir = path.join(__dirname, '../../public')
    const outputPath = path.join(outputDir, 'design-tokens.json')
    const platformOutputPath = path.join(outputDir, 'design-tokens-platforms.json')
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const tokensJson = JSON.stringify(designTokens, null, 2)
    fs.writeFileSync(outputPath, tokensJson, 'utf8')
    
    console.log('✓ Design tokens exported successfully!')
    console.log(`  Output: ${outputPath}`)
    console.log(`  Size: ${(tokensJson.length / 1024).toFixed(2)} KB`)
    
    const platformTokens = convertToPlatformFormats(designTokens)
    const platformJson = JSON.stringify(platformTokens, null, 2)
    fs.writeFileSync(platformOutputPath, platformJson, 'utf8')
    
    console.log('✓ Platform-specific formats generated!')
    console.log(`  Output: ${platformOutputPath}`)
    
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

exportTokens()
