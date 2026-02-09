#!/usr/bin/env node

/**
 * Issue 4 Guardrails Check: "Anamnese" → "Patient Record" Terminology
 * 
 * Verifies that UI-facing text uses "Patient Record" instead of "Anamnese"
 * across navigation, labels, headings, and user-visible messages.
 * 
 * Rules Verified:
 * - R-I4-1: Navigation labels use "Patient Record"
 * - R-I4-2: UI component headings use "Patient Record"
 * - R-I4-3: Modal/dialog titles use "Patient Record"
 * - R-I4-4: User-facing error messages use "Patient Record"
 * - R-I4-5: Tab labels use "Patient Record"
 * 
 * Out of Scope:
 * - Database table/column names (intentionally keep as anamnesis_*)
 * - API route paths (intentionally keep as /anamnesis)
 * - Internal variable names
 * - File/folder names
 * - Function names
 * 
 * Exit codes:
 * - 0: All checks pass
 * - 1: One or more checks fail
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '../..')

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

let exitCode = 0

function checkFile(filePath, description) {
  const fullPath = join(rootDir, filePath)
  if (!existsSync(fullPath)) {
    console.error(`${RED}✗${RESET} ${description}: File not found`)
    console.error(`  Expected: ${filePath}`)
    exitCode = 1
    return null
  }
  console.log(`${GREEN}✓${RESET} ${description}: File exists`)
  return readFileSync(fullPath, 'utf-8')
}

function checkNoAnamnese(content, ruleId, description, allowedContexts = []) {
  if (!content) {
    console.error(`${RED}✗${RESET} ${ruleId}: Cannot verify - file not loaded`)
    exitCode = 1
    return false
  }
  
  // Split content into lines for better error reporting
  const lines = content.split('\n')
  const violations = []
  
  lines.forEach((line, index) => {
    // Skip if line is in allowed contexts (comments about technical terms, etc.)
    const isAllowed = allowedContexts.some(ctx => line.includes(ctx))
    if (isAllowed) return
    
    // Check for "Anamnese" in UI-facing contexts
    const uiFacingPatterns = [
      /label:\s*['"](.*Anamnese.*)['"]/i,  // label: "Anamnese"
      /title\s*=\s*['"](.*Anamnese.*)['"]/i,  // title="Anamnese"
      /placeholder\s*=\s*['"](.*Anamnese.*)['"]/i,  // placeholder="..."
      /<h[1-6][^>]*>(.*Anamnese.*)<\/h[1-6]>/i,  // <h1>Anamnese</h1>
      /message\s*=\s*['"](.*Anamnese.*)['"]/i,  // message="..."
      /text-[^"']*>(.*Anamnese[^<]*)</i,  // Text in JSX
    ]
    
    uiFacingPatterns.forEach(pattern => {
      const match = line.match(pattern)
      if (match) {
        violations.push({
          line: index + 1,
          content: line.trim(),
          match: match[1] || match[0]
        })
      }
    })
  })
  
  if (violations.length > 0) {
    console.error(`${RED}✗${RESET} ${ruleId}: ${description}`)
    console.error(`  violates ${ruleId}`)
    violations.forEach(v => {
      console.error(`  Line ${v.line}: ${v.content}`)
    })
    exitCode = 1
    return false
  }
  
  console.log(`${GREEN}✓${RESET} ${ruleId}: ${description}`)
  return true
}

function checkPatternExists(content, pattern, ruleId, description) {
  if (!content) {
    console.error(`${RED}✗${RESET} ${ruleId}: Cannot verify - file not loaded`)
    exitCode = 1
    return false
  }
  
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  if (!regex.test(content)) {
    console.error(`${RED}✗${RESET} ${ruleId}: ${description}`)
    console.error(`  violates ${ruleId}`)
    exitCode = 1
    return false
  }
  
  console.log(`${GREEN}✓${RESET} ${ruleId}: ${description}`)
  return true
}

console.log('\n=== Issue 4: Terminology Check ===\n')

// R-I4-1: Navigation labels
console.log('\nR-I4-1: Navigation labels use "Patient Record"')
const navContent = checkFile(
  'lib/utils/roleBasedRouting.ts',
  'Navigation routing configuration'
)

if (navContent) {
  checkPatternExists(
    navContent,
    /label:\s*['"]Patient Record['"]/,
    'R-I4-1.1',
    'Clinician nav includes "Patient Record" label'
  )
  
  checkNoAnamnese(
    navContent,
    'R-I4-1.2',
    'No "Anamnese" in navigation labels',
    ['// Comment', '/* Comment', 'href:', 'anamnesis'] // Allow in hrefs and comments
  )
}

// R-I4-2: Patient UI component headings
console.log('\nR-I4-2: Patient UI uses "Patient Record"')
const patientTimelineContent = checkFile(
  'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/client.tsx',
  'Patient timeline client component'
)

if (patientTimelineContent) {
  checkPatternExists(
    patientTimelineContent,
    /Patient Record Timeline/,
    'R-I4-2.1',
    'Timeline heading uses "Patient Record Timeline"'
  )
  
  checkNoAnamnese(
    patientTimelineContent,
    'R-I4-2.2',
    'No "Anamnese" in user-visible text',
    ['// E75', '/**', 'anamnese-timeline', 'anamnesis', 'AnamneseTimeline', '[Anamnese'] // Allow in comments, paths, component names
  )
}

// R-I4-3: Clinician UI component headings and modals
console.log('\nR-I4-3: Clinician UI uses "Patient Record"')
const anamnesisSection = checkFile(
  'apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx',
  'Clinician anamnesis section component'
)

if (anamnesisSection) {
  checkPatternExists(
    anamnesisSection,
    /Patient Record/,
    'R-I4-3.1',
    'Section headings use "Patient Record"'
  )
  
  checkNoAnamnese(
    anamnesisSection,
    'R-I4-3.2',
    'No "Anamnese" in user-visible UI text',
    [
      '/**', '//', '/*', // Comments
      'AnamnesisSection', 'AnamnesisEntry', 'AnamnesisVersion', // Component/type names
      'anamnesis/', 'getAnamnesis', 'postAnamnesis', // API/function names
      'ENTRY_TYPE', 'entry_type', // Field names
      'Familienanamnese', // Medical term in dropdown (German medical terminology is OK in certain contexts)
    ]
  )
}

// R-I4-4: Tab labels
console.log('\nR-I4-4: Tab labels use "Patient Record"')
const patientPageContent = checkFile(
  'apps/rhythm-studio-ui/app/clinician/patient/[id]/page.tsx',
  'Clinician patient detail page'
)

if (patientPageContent) {
  checkPatternExists(
    patientPageContent,
    /<TabTrigger value="anamnese">Patient Record<\/TabTrigger>/,
    'R-I4-4.1',
    'Tab trigger uses "Patient Record"'
  )
  
  checkNoAnamnese(
    patientPageContent,
    'R-I4-4.2',
    'No "Anamnese" in tab labels',
    ['// ', '/* ', 'value="anamnese"', 'Patient Record'] // Allow in comments and values
  )
}

// R-I4-5: Test expectations updated
console.log('\nR-I4-5: Test expectations use "Patient Record"')
const navTestContent = checkFile(
  'lib/utils/__tests__/roleBasedRouting.menus.test.ts',
  'Navigation menu tests'
)

if (navTestContent) {
  checkPatternExists(
    navTestContent,
    /toBe\(['"]Patient Record['"]\)/,
    'R-I4-5.1',
    'Test expects "Patient Record" label'
  )
  
  checkNoAnamnese(
    navTestContent,
    'R-I4-5.2',
    'No "Anamnese" in test expectations',
    ['anamnesis', '//'] // Allow in hrefs and comments
  )
}

console.log('\n=== Summary ===\n')
if (exitCode === 0) {
  console.log(`${GREEN}✓ All Issue 4 terminology checks passed${RESET}`)
} else {
  console.log(`${RED}✗ Some checks failed${RESET}`)
  console.log(`\nTo fix violations:`)
  console.log(`  1. Replace UI-facing "Anamnese" text with "Patient Record"`)
  console.log(`  2. Keep database/API names unchanged (anamnesis_*, /anamnesis)`)
  console.log(`  3. Component names can stay (AnamnesisSection, etc.)`)
}

process.exit(exitCode)
