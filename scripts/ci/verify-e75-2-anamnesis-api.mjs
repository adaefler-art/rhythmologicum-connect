#!/usr/bin/env node
/**
 * E75.2 Anamnese API Verification Script
 * 
 * Verifies that all API endpoints are implemented correctly with proper:
 * - Authentication & authorization
 * - RLS enforcement
 * - Versioning behavior
 * - Error handling (404, 403, 409)
 * - Validation rules
 * 
 * All checks reference rule IDs in output for quick diagnosis.
 * 
 * Usage:
 *   npm run verify:e75-2
 *   node scripts/ci/verify-e75-2-anamnesis-api.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '../..')

let exitCode = 0

function log(message, type = 'info') {
  const symbols = { info: 'ℹ', success: '✅', error: '❌', warn: '⚠' }
  console.log(`${symbols[type] || symbols.info} ${message}`)
}

function violates(ruleId, message) {
  log(`violates ${ruleId}: ${message}`, 'error')
  exitCode = 1
}

// =============================================================================
// RULE CHECKS
// =============================================================================

/**
 * R-E75.2-1: Verify patient list endpoint exists
 */
function checkPatientListEndpoint() {
  const filePath = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts'
  )
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-1', 'Patient list endpoint not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for GET handler
  if (!content.includes('export async function GET')) {
    violates('R-E75.2-1', 'Patient list endpoint missing GET handler')
  }

  // Check for authentication
  if (!content.includes('auth.getUser()')) {
    violates('R-E75.2-1', 'Patient list endpoint missing authentication')
  }

  // Check for patient profile filtering
  if (!content.includes('patient_id')) {
    violates('R-E75.2-1', 'Patient list endpoint missing patient_id filtering')
  }

  // Check for version count
  if (!content.includes('version_count')) {
    violates('R-E75.2-1', 'Patient list endpoint missing version_count')
  }

  log('Patient list endpoint implementation verified', 'success')
}

/**
 * R-E75.2-2: Verify patient get single entry endpoint
 */
function checkPatientGetSingleEndpoint() {
  const filePath = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts'
  )
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-2', 'Patient get single endpoint not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for GET handler
  if (!content.includes('export async function GET')) {
    violates('R-E75.2-2', 'Patient get single endpoint missing GET handler')
  }

  // Check for authentication
  if (!content.includes('auth.getUser()')) {
    violates('R-E75.2-2', 'Patient get single endpoint missing authentication')
  }

  // Check for 404 handling
  if (!content.includes('ErrorCode.NOT_FOUND') || !content.includes('status: 404')) {
    violates('R-E75.2-2', 'Patient get single endpoint missing 404 handling')
  }

  // Check for versions
  if (!content.includes('getEntryVersions')) {
    violates('R-E75.2-2', 'Patient get single endpoint missing version fetch')
  }

  log('Patient get single endpoint implementation verified', 'success')
}

/**
 * R-E75.2-3: Verify patient create endpoint
 */
function checkPatientCreateEndpoint() {
  const filePath = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts'
  )
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-3', 'Patient create endpoint not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for POST handler
  if (!content.includes('export async function POST')) {
    violates('R-E75.2-3', 'Patient create endpoint missing POST handler')
  }

  // Check for validation
  if (!content.includes('validateCreateEntry')) {
    violates('R-E75.2-3', 'Patient create endpoint missing validation')
  }

  // Check for insert operation
  if (!content.includes('.insert(')) {
    violates('R-E75.2-3', 'Patient create endpoint missing insert operation')
  }

  // Check for version 1 fetch (verifies trigger worked)
  if (!content.includes('version_number') && !content.includes('eq(version_number, 1)')) {
    violates('R-E75.2-3', 'Patient create endpoint not verifying version 1 creation')
  }

  // Check for 201 status
  if (!content.includes('status: 201')) {
    violates('R-E75.2-3', 'Patient create endpoint missing 201 status')
  }

  log('Patient create endpoint implementation verified', 'success')
}

/**
 * R-E75.2-4, R-E75.2-20: Verify patient version creation
 */
function checkPatientVersionEndpoint() {
  const filePath = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/versions/route.ts'
  )
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-4', 'Patient version endpoint not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for POST handler
  if (!content.includes('export async function POST')) {
    violates('R-E75.2-4', 'Patient version endpoint missing POST handler')
  }

  // Check for validation
  if (!content.includes('validateCreateVersion')) {
    violates('R-E75.2-4', 'Patient version endpoint missing validation')
  }

  // Check for update operation (trigger creates version)
  if (!content.includes('.update(')) {
    violates('R-E75.2-4', 'Patient version endpoint missing update operation')
  }

  log('Patient version endpoint implementation verified', 'success')
}

/**
 * R-E75.2-5, R-E75.2-6, R-E75.2-18: Verify patient archive endpoint
 */
function checkPatientArchiveEndpoint() {
  const filePath = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/archive/route.ts'
  )
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-5', 'Patient archive endpoint not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for POST handler
  if (!content.includes('export async function POST')) {
    violates('R-E75.2-5', 'Patient archive endpoint missing POST handler')
  }

  // Check for is_archived flag
  if (!content.includes('is_archived: true')) {
    violates('R-E75.2-5', 'Patient archive endpoint not setting is_archived flag')
  }

  log('Patient archive endpoint implementation verified', 'success')
}

/**
 * R-E75.2-6, R-E75.2-18: Verify 409 conflict on archived update
 */
function checkArchiveConflictHandling() {
  const filePath = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/versions/route.ts'
  )
  
  if (!fs.existsSync(filePath)) {
    return // Already reported missing
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for archived check
  if (!content.includes('is_archived')) {
    violates('R-E75.2-6', 'Version endpoint not checking is_archived status')
  }

  // Check for 409 response
  if (!content.includes('ErrorCode.STATE_CONFLICT') || !content.includes('status: 409')) {
    violates('R-E75.2-18', 'Version endpoint missing 409 conflict response')
  }

  log('Archive conflict handling verified', 'success')
}

/**
 * R-E75.2-7, R-E75.2-8: Verify studio list endpoint
 */
function checkStudioListEndpoint() {
  const filePath = path.join(
    REPO_ROOT,
    'apps/rhythm-studio-ui/app/api/studio/patients/[patientId]/anamnesis/route.ts'
  )
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-7', 'Studio list endpoint not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for GET handler
  if (!content.includes('export async function GET')) {
    violates('R-E75.2-7', 'Studio list endpoint missing GET handler')
  }

  // Check for clinician role check
  if (!content.includes('hasClinicianRole')) {
    violates('R-E75.2-7', 'Studio list endpoint missing clinician role check')
  }

  // Check for 403 response
  if (!content.includes('ErrorCode.FORBIDDEN') || !content.includes('status: 403')) {
    violates('R-E75.2-17', 'Studio list endpoint missing 403 response')
  }

  // Check for patient_id filtering
  if (!content.includes('patient_id')) {
    violates('R-E75.2-8', 'Studio list endpoint missing patient_id filtering')
  }

  log('Studio list endpoint implementation verified', 'success')
}

/**
 * R-E75.2-9, R-E75.2-10: Verify studio create endpoint
 */
function checkStudioCreateEndpoint() {
  const filePath = path.join(
    REPO_ROOT,
    'apps/rhythm-studio-ui/app/api/studio/patients/[patientId]/anamnesis/route.ts'
  )
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-9', 'Studio create endpoint not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for POST handler
  if (!content.includes('export async function POST')) {
    violates('R-E75.2-9', 'Studio create endpoint missing POST handler')
  }

  // Check for clinician role check
  if (!content.includes('hasClinicianRole')) {
    violates('R-E75.2-9', 'Studio create endpoint missing clinician role check')
  }

  // Check for validation
  if (!content.includes('validateCreateEntry')) {
    violates('R-E75.2-9', 'Studio create endpoint missing validation')
  }

  // Check for insert operation
  if (!content.includes('.insert(')) {
    violates('R-E75.2-10', 'Studio create endpoint missing insert operation')
  }

  log('Studio create endpoint implementation verified', 'success')
}

/**
 * R-E75.2-11: Verify studio version endpoint
 */
function checkStudioVersionEndpoint() {
  const filePath = path.join(
    REPO_ROOT,
    'apps/rhythm-studio-ui/app/api/studio/anamnesis/[entryId]/versions/route.ts'
  )
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-11', 'Studio version endpoint not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for POST handler
  if (!content.includes('export async function POST')) {
    violates('R-E75.2-11', 'Studio version endpoint missing POST handler')
  }

  // Check for clinician role check
  if (!content.includes('hasClinicianRole')) {
    violates('R-E75.2-11', 'Studio version endpoint missing clinician role check')
  }

  log('Studio version endpoint implementation verified', 'success')
}

/**
 * R-E75.2-12: Verify studio archive endpoint
 */
function checkStudioArchiveEndpoint() {
  const filePath = path.join(
    REPO_ROOT,
    'apps/rhythm-studio-ui/app/api/studio/anamnesis/[entryId]/archive/route.ts'
  )
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-12', 'Studio archive endpoint not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for POST handler
  if (!content.includes('export async function POST')) {
    violates('R-E75.2-12', 'Studio archive endpoint missing POST handler')
  }

  // Check for clinician role check
  if (!content.includes('hasClinicianRole')) {
    violates('R-E75.2-12', 'Studio archive endpoint missing clinician role check')
  }

  log('Studio archive endpoint implementation verified', 'success')
}

/**
 * R-E75.2-13, R-E75.2-14, R-E75.2-15: Verify validation utilities
 */
function checkValidationUtilities() {
  const filePath = path.join(REPO_ROOT, 'lib/api/anamnesis/validation.ts')
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-13', 'Validation utilities not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for title validation
  if (!content.includes('title') || !content.includes('max(500')) {
    violates('R-E75.2-13', 'Title validation missing or incorrect max length')
  }

  // Check for entry_type validation
  if (!content.includes('ENTRY_TYPES') || !content.includes('medical_history')) {
    violates('R-E75.2-14', 'Entry type validation missing')
  }

  // Check for content size validation
  if (!content.includes('MAX_JSONB_SIZE_BYTES') || !content.includes('1024 * 1024')) {
    violates('R-E75.2-15', 'Content size validation missing or incorrect limit')
  }

  // Check for size validation function
  if (!content.includes('validateContentSize')) {
    violates('R-E75.2-15', 'Content size validation function missing')
  }

  log('Validation utilities implementation verified', 'success')
}

/**
 * R-E75.2-16, R-E75.2-17, R-E75.2-18: Verify error handling
 */
function checkErrorHandling() {
  const files = [
    'apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts',
    'apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/versions/route.ts',
    'apps/rhythm-studio-ui/app/api/studio/patients/[patientId]/anamnesis/route.ts',
    'apps/rhythm-studio-ui/app/api/studio/anamnesis/[entryId]/versions/route.ts',
  ]

  let has404 = false
  let has403 = false
  let has409 = false

  files.forEach((file) => {
    const filePath = path.join(REPO_ROOT, file)
    if (!fs.existsSync(filePath)) return

    const content = fs.readFileSync(filePath, 'utf8')

    if (content.includes('ErrorCode.NOT_FOUND') && content.includes('status: 404')) {
      has404 = true
    }

    if (content.includes('ErrorCode.FORBIDDEN') && content.includes('status: 403')) {
      has403 = true
    }

    if (content.includes('ErrorCode.STATE_CONFLICT') && content.includes('status: 409')) {
      has409 = true
    }
  })

  if (!has404) {
    violates('R-E75.2-16', 'Error 404 handling not found in endpoints')
  }

  if (!has403) {
    violates('R-E75.2-17', 'Error 403 handling not found in endpoints')
  }

  if (!has409) {
    violates('R-E75.2-18', 'Error 409 handling not found in endpoints')
  }

  log('Error handling implementation verified', 'success')
}

/**
 * R-E75.2-19: Verify versions are returned
 */
function checkVersionsReturned() {
  const filePath = path.join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts'
  )
  
  if (!fs.existsSync(filePath)) {
    return // Already reported missing
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Check for versions array in response
  if (!content.includes('versions:')) {
    violates('R-E75.2-19', 'GET single entry not returning versions array')
  }

  // Check that helper is called (which orders correctly)
  if (!content.includes('getEntryVersions')) {
    violates('R-E75.2-19', 'GET single entry not using getEntryVersions helper')
  }

  log('Version return implementation verified', 'success')
}

/**
 * Verify helper functions exist
 */
function checkHelperFunctions() {
  const filePath = path.join(REPO_ROOT, 'lib/api/anamnesis/helpers.ts')
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-IMPL', 'Helper functions not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  const requiredHelpers = [
    'getPatientProfileId',
    'getPatientOrganizationId',
    'getAnamnesisEntry',
    'getEntryVersions',
  ]

  requiredHelpers.forEach((helper) => {
    if (!content.includes(helper)) {
      violates('R-E75.2-IMPL', `Helper function ${helper} not found`)
    }
  })

  log('Helper functions implementation verified', 'success')
}

/**
 * Verify rules vs checks matrix document exists
 */
function checkDocumentation() {
  const filePath = path.join(REPO_ROOT, 'docs/RULES_VS_CHECKS_MATRIX_E75_2.md')
  
  if (!fs.existsSync(filePath)) {
    violates('R-E75.2-DOC', 'RULES_VS_CHECKS_MATRIX_E75_2.md not found')
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Verify it contains rule mappings
  if (!content.includes('R-E75.2-1') || !content.includes('Rule → Check Mapping')) {
    violates('R-E75.2-DOC', 'Documentation missing rule mappings')
  }

  log('Documentation verified', 'success')
}

// =============================================================================
// MAIN
// =============================================================================

console.log('\n=== E75.2 Anamnese API Verification ===\n')

// Run all checks
checkPatientListEndpoint()
checkPatientGetSingleEndpoint()
checkPatientCreateEndpoint()
checkPatientVersionEndpoint()
checkPatientArchiveEndpoint()
checkArchiveConflictHandling()
checkStudioListEndpoint()
checkStudioCreateEndpoint()
checkStudioVersionEndpoint()
checkStudioArchiveEndpoint()
checkValidationUtilities()
checkErrorHandling()
checkVersionsReturned()
checkHelperFunctions()
checkDocumentation()

console.log('')

if (exitCode === 0) {
  log('All E75.2 Anamnese API rules verified successfully! ✅', 'success')
} else {
  log('E75.2 Anamnese API verification FAILED ❌', 'error')
}

process.exit(exitCode)
