#!/usr/bin/env node
/**
 * E75.3 Anamnese Timeline UI Verification Script
 * 
 * Verifies that the patient-facing Anamnese Timeline UI is implemented correctly with:
 * - Route structure (timeline list + detail view)
 * - Mobile-v2 component usage
 * - Proper state handling (loading/empty/error)
 * - Add/Edit/Archive functionality
 * - Navigation integration
 * - UI v2 compliance
 * 
 * All checks reference rule IDs in output for quick diagnosis.
 * 
 * Usage:
 *   npm run verify:e75-3
 *   node scripts/ci/verify-e75-3-ui.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '../..')

let exitCode = 0
let checksPassed = 0
let totalChecks = 0

function log(message, type = 'info') {
  const symbols = { info: 'ℹ', success: '✅', error: '❌', warn: '⚠' }
  console.log(`${symbols[type] || symbols.info} ${message}`)
}

function violates(ruleId, message) {
  log(`violates ${ruleId}: ${message}`, 'error')
  exitCode = 1
}

function checkPass(checkId, message) {
  log(`${checkId}: ${message}`, 'success')
  checksPassed++
}

function checkStart(message) {
  console.log(`\n🔍 ${message}`)
  totalChecks++
}

// =============================================================================
// CHECK 1: Route files exist
// =============================================================================

function checkRouteFilesExist() {
  checkStart('CHECK-1: Verifying route files exist')

  const requiredFiles = [
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/page.tsx',
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/client.tsx',
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/page.tsx',
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/client.tsx',
  ]

  let allFilesExist = true

  for (const file of requiredFiles) {
    const filePath = path.join(REPO_ROOT, file)
    if (!fs.existsSync(filePath)) {
      violates('R-E75.3-1, R-E75.3-2', `Missing required file: ${file}`)
      allFilesExist = false
    }
  }

  if (allFilesExist) {
    checkPass('CHECK-1', 'All route files exist (R-E75.3-1, R-E75.3-2)')
  }
}

// =============================================================================
// CHECK 2: Mobile-v2 imports only
// =============================================================================

function checkMobileV2Imports() {
  checkStart('CHECK-2: Verifying mobile-v2 component usage')

  const clientFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/client.tsx'
  )

  if (!fs.existsSync(clientFile)) {
    violates('R-E75.3-3', 'Timeline client file not found')
    return
  }

  const content = fs.readFileSync(clientFile, 'utf8')

  // Check for mobile-v2 component imports
  const requiredImports = [
    '@/lib/ui/mobile-v2',
    'Card',
    'Button',
    'Badge',
    'EmptyState',
    'ErrorState',
    'LoadingSkeleton',
  ]

  let hasAllImports = true

  for (const imp of requiredImports) {
    if (!content.includes(imp)) {
      violates('R-E75.3-3', `Missing import: ${imp}`)
      hasAllImports = false
    }
  }

  // Check for icon imports from v2
  if (!content.includes('@/lib/ui/mobile-v2/icons')) {
    violates('R-E75.3-3', 'Missing mobile-v2 icons import')
    hasAllImports = false
  }

  // Check NO direct lucide-react imports (should use v2 abstraction)
  if (content.includes('from \'lucide-react\'')) {
    violates('R-E75.3-3, R-E75.3-14', 'Direct lucide-react import found (use mobile-v2/icons)')
    hasAllImports = false
  }

  if (hasAllImports) {
    checkPass('CHECK-2', 'Mobile-v2 components imported correctly (R-E75.3-3)')
  }
}

// =============================================================================
// CHECK 3: Entry grouping logic
// =============================================================================

function checkEntryGrouping() {
  checkStart('CHECK-3: Verifying entry grouping by entry_type')

  const clientFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/client.tsx'
  )

  if (!fs.existsSync(clientFile)) {
    violates('R-E75.3-4', 'Timeline client file not found')
    return
  }

  const content = fs.readFileSync(clientFile, 'utf8')

  // Check for grouping logic
  if (!content.includes('groupedEntries') || !content.includes('.reduce(')) {
    violates('R-E75.3-4', 'Entry grouping logic not found')
    return
  }

  // Check for ENTRY_TYPE_LABELS mapping
  if (!content.includes('ENTRY_TYPE_LABELS')) {
    violates('R-E75.3-4', 'ENTRY_TYPE_LABELS mapping not found')
    return
  }

  // Check for German labels
  const germanLabels = ['Symptome', 'Medikamente', 'Allergien']
  let hasGermanLabels = true

  for (const label of germanLabels) {
    if (!content.includes(label)) {
      violates('R-E75.3-4', `Missing German label: ${label}`)
      hasGermanLabels = false
    }
  }

  if (hasGermanLabels) {
    checkPass('CHECK-3', 'Entry grouping and German labels implemented (R-E75.3-4)')
  }
}

// =============================================================================
// CHECK 4: UI state handling (loading/empty/error)
// =============================================================================

function checkUIStates() {
  checkStart('CHECK-4: Verifying deterministic UI states')

  const clientFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/client.tsx'
  )

  if (!fs.existsSync(clientFile)) {
    violates('R-E75.3-5, R-E75.3-6, R-E75.3-7', 'Timeline client file not found')
    return
  }

  const content = fs.readFileSync(clientFile, 'utf8')

  // Check for FetchState discriminated union
  if (!content.includes('type FetchState')) {
    violates('R-E75.3-5, R-E75.3-6, R-E75.3-7', 'FetchState type not found')
    return
  }

  // Check for loading state
  if (!content.includes('status: \'loading\'') || !content.includes('<LoadingSkeleton')) {
    violates('R-E75.3-5', 'Loading state not properly handled')
    return
  }

  // Check for empty state
  if (!content.includes('<EmptyState')) {
    violates('R-E75.3-6', 'EmptyState component not used')
    return
  }

  // Check for error state
  if (!content.includes('status: \'error\'') || !content.includes('<ErrorState')) {
    violates('R-E75.3-7', 'Error state not properly handled')
    return
  }

  checkPass('CHECK-4', 'Deterministic UI states implemented (R-E75.3-5, R-E75.3-6, R-E75.3-7)')
}

// =============================================================================
// CHECK 5: Add entry functionality
// =============================================================================

function checkAddEntryFunctionality() {
  checkStart('CHECK-5: Verifying add entry functionality')

  const clientFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/client.tsx'
  )

  if (!fs.existsSync(clientFile)) {
    violates('R-E75.3-8', 'Timeline client file not found')
    return
  }

  const content = fs.readFileSync(clientFile, 'utf8')

  // Check for AddEntryModal component
  if (!content.includes('function AddEntryModal')) {
    violates('R-E75.3-8', 'AddEntryModal component not found')
    return
  }

  // Check for POST request
  if (!content.includes('method: \'POST\'') || !content.includes('/api/patient/anamnesis')) {
    violates('R-E75.3-8', 'POST request to /api/patient/anamnesis not found')
    return
  }

  // Check for form fields
  if (!content.includes('title') || !content.includes('entry_type')) {
    violates('R-E75.3-8', 'Required form fields (title, entry_type) not found')
    return
  }

  checkPass('CHECK-5', 'Add entry functionality implemented (R-E75.3-8)')
}

// =============================================================================
// CHECK 6: Edit entry functionality
// =============================================================================

function checkEditEntryFunctionality() {
  checkStart('CHECK-6: Verifying edit entry functionality')

  const detailFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/client.tsx'
  )

  if (!fs.existsSync(detailFile)) {
    violates('R-E75.3-9', 'Detail client file not found')
    return
  }

  const content = fs.readFileSync(detailFile, 'utf8')

  // Check for EditEntryModal component
  if (!content.includes('function EditEntryModal')) {
    violates('R-E75.3-9', 'EditEntryModal component not found')
    return
  }

  // Check for PATCH request
  if (!content.includes('method: \'PATCH\'')) {
    violates('R-E75.3-9', 'PATCH request not found in edit functionality')
    return
  }

  // Check for pre-population with entry data
  if (!content.includes('entry.title') || !content.includes('entry.entry_type')) {
    violates('R-E75.3-9', 'Form not pre-populated with entry data')
    return
  }

  checkPass('CHECK-6', 'Edit entry functionality implemented (R-E75.3-9)')
}

// =============================================================================
// CHECK 7: Archive functionality
// =============================================================================

function checkArchiveFunctionality() {
  checkStart('CHECK-7: Verifying archive functionality')

  const detailFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/client.tsx'
  )

  if (!fs.existsSync(detailFile)) {
    violates('R-E75.3-10', 'Detail client file not found')
    return
  }

  const content = fs.readFileSync(detailFile, 'utf8')

  // Check for handleArchive function
  if (!content.includes('handleArchive')) {
    violates('R-E75.3-10', 'handleArchive function not found')
    return
  }

  // Check for archive confirmation
  if (!content.includes('showArchiveConfirm') || !content.includes('Eintrag archivieren?')) {
    violates('R-E75.3-10', 'Archive confirmation modal not found')
    return
  }

  // Check for POST to archive endpoint
  if (!content.includes('/archive')) {
    violates('R-E75.3-10', 'POST to archive endpoint not found')
    return
  }

  checkPass('CHECK-7', 'Archive functionality implemented (R-E75.3-10)')
}

// =============================================================================
// CHECK 8: PATCH endpoint exists
// =============================================================================

function checkPatchEndpoint() {
  checkStart('CHECK-8: Verifying PATCH endpoint exists')

  const apiFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts'
  )

  if (!fs.existsSync(apiFile)) {
    violates('R-E75.3-11', 'API route file not found')
    return
  }

  const content = fs.readFileSync(apiFile, 'utf8')

  // Check for PATCH export
  if (!content.includes('export async function PATCH')) {
    violates('R-E75.3-11', 'PATCH endpoint not exported')
    return
  }

  // Check for validation
  if (!content.includes('validateCreateVersion')) {
    violates('R-E75.3-11', 'PATCH endpoint missing validation')
    return
  }

  // Check for update logic
  if (!content.includes('.update(')) {
    violates('R-E75.3-11', 'PATCH endpoint missing update logic')
    return
  }

  checkPass('CHECK-8', 'PATCH endpoint implemented (R-E75.3-11)')
}

// =============================================================================
// CHECK 9: Navigation config
// =============================================================================

function checkNavigationConfig() {
  checkStart('CHECK-9: Verifying navigation configuration')

  const menuFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/navigation/menuConfig.ts'
  )

  const navFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/utils/navigation.ts'
  )

  if (!fs.existsSync(menuFile) || !fs.existsSync(navFile)) {
    violates('R-E75.3-12', 'Navigation config files not found')
    return
  }

  const menuContent = fs.readFileSync(menuFile, 'utf8')
  const navContent = fs.readFileSync(navFile, 'utf8')

  // Check for anamnese menu item
  if (!menuContent.includes('anamnese') || !menuContent.includes('Timeline')) {
    violates('R-E75.3-12', 'Anamnese menu item not found in menuConfig')
    return
  }

  // Check for ANAMNESE_TIMELINE route
  if (!navContent.includes('ANAMNESE_TIMELINE') || !navContent.includes('/patient/anamnese-timeline')) {
    violates('R-E75.3-12', 'ANAMNESE_TIMELINE canonical route not found')
    return
  }

  checkPass('CHECK-9', 'Navigation configuration complete (R-E75.3-12)')
}

// =============================================================================
// CHECK 10: Version history display
// =============================================================================

function checkVersionHistoryDisplay() {
  checkStart('CHECK-10: Verifying version history display')

  const detailFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/client.tsx'
  )

  if (!fs.existsSync(detailFile)) {
    violates('R-E75.3-15', 'Detail client file not found')
    return
  }

  const content = fs.readFileSync(detailFile, 'utf8')

  // Check for version history section
  if (!content.includes('Versionshistorie')) {
    violates('R-E75.3-15', 'Version history section not found')
    return
  }

  // Check for version mapping
  if (!content.includes('versions.map') || !content.includes('version_number')) {
    violates('R-E75.3-15', 'Version mapping logic not found')
    return
  }

  checkPass('CHECK-10', 'Version history display implemented (R-E75.3-15)')
}

// =============================================================================
// CHECK 11: Badge variant mapping
// =============================================================================

function checkBadgeVariants() {
  checkStart('CHECK-11: Verifying entry type badge variant mapping')

  const clientFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/client.tsx'
  )

  if (!fs.existsSync(clientFile)) {
    violates('R-E75.3-16', 'Timeline client file not found')
    return
  }

  const content = fs.readFileSync(clientFile, 'utf8')

  // Check for ENTRY_TYPE_COLORS mapping
  if (!content.includes('ENTRY_TYPE_COLORS')) {
    violates('R-E75.3-16', 'ENTRY_TYPE_COLORS mapping not found')
    return
  }

  // Check for specific color mappings
  const requiredMappings = [
    'symptoms: \'danger\'',
    'medications: \'success\'',
    'allergies: \'warning\'',
  ]

  let hasAllMappings = true

  for (const mapping of requiredMappings) {
    if (!content.includes(mapping)) {
      violates('R-E75.3-16', `Missing badge variant mapping: ${mapping}`)
      hasAllMappings = false
    }
  }

  if (hasAllMappings) {
    checkPass('CHECK-11', 'Badge variant mapping implemented (R-E75.3-16)')
  }
}

// =============================================================================
// CHECK 12: Filter tabs logic
// =============================================================================

function checkFilterTabs() {
  checkStart('CHECK-12: Verifying filter tabs implementation')

  const clientFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/client.tsx'
  )

  if (!fs.existsSync(clientFile)) {
    violates('R-E75.3-17', 'Timeline client file not found')
    return
  }

  const content = fs.readFileSync(clientFile, 'utf8')

  // Check for filter state
  if (!content.includes('filter, setFilter') || !content.includes('\'all\' | \'active\' | \'archived\'')) {
    violates('R-E75.3-17', 'Filter state not properly typed')
    return
  }

  // Check for filter logic
  if (!content.includes('filteredEntries') || !content.includes('is_archived')) {
    violates('R-E75.3-17', 'Filter logic not implemented')
    return
  }

  // Check for filter buttons
  if (!content.includes('Aktiv') || !content.includes('Archiviert') || !content.includes('Alle')) {
    violates('R-E75.3-17', 'Filter buttons not found')
    return
  }

  checkPass('CHECK-12', 'Filter tabs implemented (R-E75.3-17)')
}

// =============================================================================
// CHECK 13: Dashboard-first policy
// =============================================================================

function checkDashboardFirstPolicy() {
  checkStart('CHECK-13: Verifying dashboard-first policy enforcement')

  const timelinePageFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/page.tsx'
  )

  const detailPageFile = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/page.tsx'
  )

  if (!fs.existsSync(timelinePageFile) || !fs.existsSync(detailPageFile)) {
    violates('R-E75.3-18', 'Page files not found')
    return
  }

  const timelineContent = fs.readFileSync(timelinePageFile, 'utf8')
  const detailContent = fs.readFileSync(detailPageFile, 'utf8')

  // Check both files for enforceDashboardFirst
  if (!timelineContent.includes('enforceDashboardFirst')) {
    violates('R-E75.3-18', 'Timeline page missing enforceDashboardFirst')
    return
  }

  if (!detailContent.includes('enforceDashboardFirst')) {
    violates('R-E75.3-18', 'Detail page missing enforceDashboardFirst')
    return
  }

  checkPass('CHECK-13', 'Dashboard-first policy enforced (R-E75.3-18)')
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

function main() {
  console.log('🚀 E75.3 Anamnese Timeline UI Verification\n')
  console.log('=' .repeat(60))

  checkRouteFilesExist()
  checkMobileV2Imports()
  checkEntryGrouping()
  checkUIStates()
  checkAddEntryFunctionality()
  checkEditEntryFunctionality()
  checkArchiveFunctionality()
  checkPatchEndpoint()
  checkNavigationConfig()
  checkVersionHistoryDisplay()
  checkBadgeVariants()
  checkFilterTabs()
  checkDashboardFirstPolicy()

  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Results: ${checksPassed}/${totalChecks} checks passed\n`)

  if (exitCode === 0) {
    log('All E75.3 rules verified ✅', 'success')
  } else {
    log('Some E75.3 rules failed ❌', 'error')
    console.log('\n💡 Fix violations to ensure full compliance with E75.3 requirements.')
  }

  process.exit(exitCode)
}

main()
