#!/usr/bin/env node

/**
 * E75.4 Guardrails Check: Clinician Anamnese UI Implementation
 * 
 * Verifies that the Anamnese tab and UI components are properly implemented
 * with correct access control and integration.
 * 
 * Rules Verified:
 * - R-E75.4-1: Anamnese tab exists in clinician patient detail page
 * - R-E75.4-2: AnamnesisSection component properly integrated
 * - R-E75.4-3: Add/Edit/Archive dialogs are implemented
 * - R-E75.4-4: Component uses correct API endpoints
 * - R-E75.4-5: Access control based on patient assignment
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

function checkContent(content, pattern, ruleId, description) {
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

console.log('\n=== E75.4 Guardrails Check: Clinician Anamnese UI ===\n')

// R-E75.4-1: Anamnese tab exists in clinician patient detail page
const pageContent = checkFile(
  'apps/rhythm-studio-ui/app/clinician/patient/[id]/page.tsx',
  'R-E75.4-1: Patient detail page'
)

if (pageContent) {
  checkContent(
    pageContent,
    /<TabTrigger value="anamnese">Anamnese<\/TabTrigger>/,
    'R-E75.4-1',
    'Anamnese tab trigger exists'
  )
  
  checkContent(
    pageContent,
    /<TabContent value="anamnese">/,
    'R-E75.4-1',
    'Anamnese tab content exists'
  )
}

// R-E75.4-2: AnamnesisSection component properly integrated
const componentContent = checkFile(
  'apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx',
  'R-E75.4-2: AnamnesisSection component'
)

if (componentContent) {
  checkContent(
    componentContent,
    /export function AnamnesisSection/,
    'R-E75.4-2',
    'AnamnesisSection component is exported'
  )
  
  checkContent(
    componentContent,
    /patientId.*string/,
    'R-E75.4-2',
    'Component accepts patientId prop'
  )
}

if (pageContent) {
  checkContent(
    pageContent,
    /import.*AnamnesisSection.*from.*\.\/AnamnesisSection/,
    'R-E75.4-2',
    'AnamnesisSection imported in page'
  )
  
  checkContent(
    pageContent,
    /<AnamnesisSection patientId=\{patientId\}/,
    'R-E75.4-2',
    'AnamnesisSection used in Anamnese tab'
  )
}

// R-E75.4-3: Add/Edit/Archive dialogs are implemented
if (componentContent) {
  checkContent(
    componentContent,
    /isAddDialogOpen/,
    'R-E75.4-3',
    'Add dialog state exists'
  )
  
  checkContent(
    componentContent,
    /isEditDialogOpen/,
    'R-E75.4-3',
    'Edit dialog state exists'
  )
  
  checkContent(
    componentContent,
    /handleAddEntry/,
    'R-E75.4-3',
    'Add entry handler exists'
  )
  
  checkContent(
    componentContent,
    /handleEditEntry/,
    'R-E75.4-3',
    'Edit entry handler exists'
  )
  
  checkContent(
    componentContent,
    /handleArchiveEntry/,
    'R-E75.4-3',
    'Archive entry handler exists'
  )
}

// R-E75.4-4: Component uses correct API endpoints
if (componentContent) {
  checkContent(
    componentContent,
    /\/api\/studio\/patients\/\$\{patientId\}\/anamnesis/,
    'R-E75.4-4',
    'Uses correct GET/POST endpoint for list/create'
  )
  
  checkContent(
    componentContent,
    /\/api\/studio\/anamnesis\/\$\{.*\}\/versions/,
    'R-E75.4-4',
    'Uses correct endpoint for creating versions (edit)'
  )
  
  checkContent(
    componentContent,
    /\/api\/studio\/anamnesis\/\$\{.*\}\/archive/,
    'R-E75.4-4',
    'Uses correct endpoint for archiving'
  )
}

// R-E75.4-5: Access control messaging
if (componentContent) {
  checkContent(
    componentContent,
    /nicht zugewiesen|nicht gefunden/i,
    'R-E75.4-5',
    'Displays appropriate error for unassigned patients'
  )
  
  checkContent(
    componentContent,
    /Keine Berechtigung/i,
    'R-E75.4-5',
    'Displays appropriate error for forbidden access'
  )
}

console.log('\n=== Summary ===')
if (exitCode === 0) {
  console.log(`${GREEN}All E75.4 guardrails checks passed!${RESET}\n`)
} else {
  console.log(`${RED}Some E75.4 guardrails checks failed.${RESET}\n`)
}

process.exit(exitCode)
