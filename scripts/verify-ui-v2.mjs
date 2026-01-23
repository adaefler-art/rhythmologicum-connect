#!/usr/bin/env node

/**
 * UI v2 Verification Script
 * 
 * This script enforces architectural constraints for Mobile UI v2:
 * 1. All patient pages must be under (mobile) route group (unless allowlisted)
 * 2. No forbidden width patterns (max-w-*, container, mx-auto) in (mobile) pages
 * 3. No legacy layout/container imports in (mobile) pages
 * 
 * Exit codes:
 * 0 - All checks passed
 * 1 - Violations found
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration
const PATIENT_UI_ROOT = join(__dirname, '../apps/rhythm-patient-ui/app/patient')
const MOBILE_ROUTE_GROUP = join(PATIENT_UI_ROOT, '(mobile)')
const CONTENT_ROUTE_ROOT = join(__dirname, '../apps/rhythm-patient-ui/app/content')

// Allowlisted routes (can exist outside (mobile) route group)
const ALLOWLISTED_ROUTES = [
  'onboarding',
  'documents',
  '(legacy)',
  'components',
  'PatientLayoutClient.tsx',
  'PatientDesignTokensProvider.tsx',
  'layout.tsx',
  'loading.tsx',
  'error.tsx',
  'page.tsx',
]

// Forbidden patterns in (mobile) pages
const FORBIDDEN_WIDTH_PATTERNS = [
  /className="[^"]*\bmax-w-(?!none\b)[^"]*"/,
  /className="[^"]*\bcontainer\b[^"]*"/,
  /className="[^"]*\bmx-auto\b[^"]*"/,
  /className='[^']*\bmax-w-(?!none\b)[^']*'/,
  /className='[^']*\bcontainer\b[^']*'/,
  /className='[^']*\bmx-auto\b[^']*'/,
]

// Forbidden imports in (mobile) pages
const FORBIDDEN_IMPORTS = [
  /import.*from.*['"].*\/components\/Layout['"]/,
  /import.*from.*['"].*\/components\/Container['"]/,
]

const FORBIDDEN_CONTENT_IMPORTS = [
  /import.*from.*['"]@\/lib\/ui(?!\/mobile-v2)['"]/, 
  /MobileHeader/, 
  ...FORBIDDEN_IMPORTS,
]

// Allowlisted files in (mobile) that can have width constraints (for special cases)
const MOBILE_WIDTH_ALLOWLIST = [
  '__tests__',
  '.test.',
  'dev/ui-v2', // Dev inspection page
]

const CONTENT_WIDTH_ALLOWLIST = [
  '__tests__',
  '.test.',
]

let violations = []

/**
 * Walk directory recursively
 */
function* walkDir(dir) {
  const files = readdirSync(dir)
  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    if (stat.isDirectory()) {
      yield* walkDir(filePath)
    } else {
      yield filePath
    }
  }
}

/**
 * Check 1: Patient pages outside (mobile) route group
 */
function checkPagesOutsideMobile() {
  console.log('🔍 Check 1: Patient pages outside (mobile) route group...')
  
  const patientFiles = readdirSync(PATIENT_UI_ROOT)
  
  for (const file of patientFiles) {
    const filePath = join(PATIENT_UI_ROOT, file)
    const stat = statSync(filePath)
    
    // Skip allowlisted items
    if (ALLOWLISTED_ROUTES.includes(file)) {
      continue
    }
    
    // Skip (mobile) route group itself
    if (file === '(mobile)') {
      continue
    }
    
    // Check for directories (potential route directories)
    if (stat.isDirectory()) {
      violations.push({
        type: 'PAGE_OUTSIDE_MOBILE',
        file: relative(PATIENT_UI_ROOT, filePath),
        message: `Patient route directory "${file}" exists outside (mobile) route group`,
      })
    }
  }
}

/**
 * Check 2: Forbidden width patterns in (mobile) pages
 */
function checkForbiddenWidthPatterns() {
  console.log('🔍 Check 2: Forbidden width patterns in (mobile) pages...')
  
  for (const filePath of walkDir(MOBILE_ROUTE_GROUP)) {
    // Skip allowlisted files
    const relPath = relative(MOBILE_ROUTE_GROUP, filePath)
    if (MOBILE_WIDTH_ALLOWLIST.some(pattern => relPath.includes(pattern))) {
      continue
    }
    
    // Only check .tsx and .ts files
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
      continue
    }
    
    const content = readFileSync(filePath, 'utf-8')
    
    for (const pattern of FORBIDDEN_WIDTH_PATTERNS) {
      if (pattern.test(content)) {
        const lines = content.split('\n')
        const matchingLines = lines
          .map((line, idx) => ({ line, idx: idx + 1 }))
          .filter(({ line }) => pattern.test(line))
        
        for (const { line, idx } of matchingLines) {
          violations.push({
            type: 'FORBIDDEN_WIDTH_PATTERN',
            file: relative(PATIENT_UI_ROOT, filePath),
            line: idx,
            message: `Forbidden width pattern found: ${line.trim()}`,
          })
        }
      }
    }
  }
}

/**
 * Check 3: Forbidden imports in (mobile) pages
 */
function checkForbiddenImports() {
  console.log('🔍 Check 3: Forbidden legacy imports in (mobile) pages...')
  
  for (const filePath of walkDir(MOBILE_ROUTE_GROUP)) {
    // Only check .tsx and .ts files
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
      continue
    }
    
    const content = readFileSync(filePath, 'utf-8')
    
    for (const pattern of FORBIDDEN_IMPORTS) {
      if (pattern.test(content)) {
        violations.push({
          type: 'FORBIDDEN_IMPORT',
          file: relative(PATIENT_UI_ROOT, filePath),
          message: `Forbidden legacy import detected`,
        })
      }
    }
  }
}

/**
 * Check 4: Content routes use Mobile v2 layout and no legacy patterns
 */
function checkContentRoutes() {
  console.log('🔍 Check 4: Content routes use v2 layout and no legacy patterns...')

  if (!existsSync(CONTENT_ROUTE_ROOT)) {
    return
  }

  const layoutPath = join(CONTENT_ROUTE_ROOT, 'layout.tsx')
  try {
    const layoutContent = readFileSync(layoutPath, 'utf-8')
    if (!layoutContent.includes('MobileShellV2')) {
      violations.push({
        type: 'CONTENT_LAYOUT_MISSING_SHELL',
        file: relative(PATIENT_UI_ROOT, layoutPath),
        message: 'Content layout must wrap with MobileShellV2',
      })
    }
    if (!layoutContent.includes('PatientDesignTokensProvider')) {
      violations.push({
        type: 'CONTENT_LAYOUT_MISSING_TOKENS',
        file: relative(PATIENT_UI_ROOT, layoutPath),
        message: 'Content layout must apply patient design tokens',
      })
    }
  } catch (error) {
    violations.push({
      type: 'CONTENT_LAYOUT_MISSING',
      file: relative(PATIENT_UI_ROOT, layoutPath),
      message: 'Content layout.tsx is required for v2 wrapper',
    })
  }

  for (const filePath of walkDir(CONTENT_ROUTE_ROOT)) {
    const relPath = relative(CONTENT_ROUTE_ROOT, filePath)
    if (CONTENT_WIDTH_ALLOWLIST.some(pattern => relPath.includes(pattern))) {
      continue
    }

    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
      continue
    }

    const content = readFileSync(filePath, 'utf-8')

    for (const pattern of FORBIDDEN_WIDTH_PATTERNS) {
      if (pattern.test(content)) {
        const lines = content.split('\n')
        const matchingLines = lines
          .map((line, idx) => ({ line, idx: idx + 1 }))
          .filter(({ line }) => pattern.test(line))

        for (const { line, idx } of matchingLines) {
          violations.push({
            type: 'CONTENT_FORBIDDEN_WIDTH_PATTERN',
            file: relative(PATIENT_UI_ROOT, filePath),
            line: idx,
            message: `Forbidden width pattern found: ${line.trim()}`,
          })
        }
      }
    }

    for (const pattern of FORBIDDEN_CONTENT_IMPORTS) {
      if (pattern.test(content)) {
        violations.push({
          type: 'CONTENT_FORBIDDEN_IMPORT',
          file: relative(PATIENT_UI_ROOT, filePath),
          message: 'Forbidden legacy import detected in /content',
        })
      }
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Running UI v2 verification...\n')
  
  try {
    checkPagesOutsideMobile()
    checkForbiddenWidthPatterns()
    checkForbiddenImports()
    checkContentRoutes()
    
    if (violations.length === 0) {
      console.log('\n✅ All checks passed! Mobile UI v2 constraints are satisfied.')
      process.exit(0)
    } else {
      console.log(`\n❌ Found ${violations.length} violation(s):\n`)
      
      for (const violation of violations) {
        console.log(`  [${violation.type}] ${violation.file}`)
        if (violation.line) {
          console.log(`    Line ${violation.line}: ${violation.message}`)
        } else {
          console.log(`    ${violation.message}`)
        }
        console.log()
      }
      
      console.log('💡 Fix these violations to maintain Mobile UI v2 architectural integrity.')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Verification script failed:', error.message)
    process.exit(1)
  }
}

main()
