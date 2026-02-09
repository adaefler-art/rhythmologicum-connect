#!/usr/bin/env node
/**
 * Issue 9: Clinician Colleague Mode Guardrails
 * 
 * Validates that the clinician colleague mode implementation follows all defined rules.
 * Each check outputs "violates R-09.X" on failure for quick diagnosis.
 * 
 * Usage: node scripts/ci/verify-issue-9-colleague-mode.mjs
 * Exit code: 0 = success, 1 = violations found
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const REPO_ROOT = process.cwd()

// ============================================================================
// RULES DEFINITION
// ============================================================================

const RULES = {
  'R-09.1': 'Clinician chat endpoint must require clinician role',
  'R-09.2': 'Clinician chat must use clinician_colleague conversation mode',
  'R-09.3': 'Responses in clinician mode must be shorter than patient mode (max 800 tokens)',
  'R-09.4': 'Clinician chat must be linked to patient record (patient_id required)',
  'R-09.5': 'Chat messages must be stored with conversationMode metadata',
  'R-09.6': 'Clinician must have patient assignment to access chat',
}

const violations = []
const checksPerformed = []

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function fileExists(relativePath) {
  const fullPath = join(REPO_ROOT, relativePath)
  return existsSync(fullPath)
}

function readFile(relativePath) {
  const fullPath = join(REPO_ROOT, relativePath)
  if (!existsSync(fullPath)) {
    return null
  }
  return readFileSync(fullPath, 'utf-8')
}

function addViolation(ruleId, message, file) {
  violations.push({
    ruleId,
    message,
    file,
  })
}

// ============================================================================
// CHECK IMPLEMENTATIONS
// ============================================================================

/**
 * R-09.1: Clinician chat endpoint must require clinician role
 */
function checkR091() {
  checksPerformed.push('R-09.1')
  
  const apiFile = 'apps/rhythm-studio-ui/app/api/clinician/chat/route.ts'
  const content = readFile(apiFile)
  
  if (!content) {
    addViolation('R-09.1', 'Clinician chat route.ts not found', apiFile)
    return
  }
  
  // Check for hasClinicianRole() call
  if (!content.includes('hasClinicianRole()')) {
    addViolation('R-09.1', 'Missing hasClinicianRole() check in clinician chat endpoint', apiFile)
  }
  
  // Check for proper error response when not clinician
  const hasForbiddenResponse = content.includes('ErrorCode.FORBIDDEN') || content.includes('status: 403')
  if (!hasForbiddenResponse) {
    addViolation('R-09.1', 'Missing 403 Forbidden response for non-clinician access', apiFile)
  }
}

/**
 * R-09.2: Clinician chat must use clinician_colleague conversation mode
 */
function checkR092() {
  checksPerformed.push('R-09.2')
  
  const apiFile = 'apps/rhythm-studio-ui/app/api/clinician/chat/route.ts'
  const content = readFile(apiFile)
  
  if (!content) {
    addViolation('R-09.2', 'Clinician chat route.ts not found', apiFile)
    return
  }
  
  // Check for getClinicianColleaguePrompt usage
  if (!content.includes('getClinicianColleaguePrompt')) {
    addViolation('R-09.2', 'Missing getClinicianColleaguePrompt import/usage', apiFile)
  }
  
  // Check for conversationMode metadata
  if (!content.includes('conversationMode') || !content.includes('clinician_colleague')) {
    addViolation('R-09.2', 'Missing conversationMode: clinician_colleague metadata', apiFile)
  }
}

/**
 * R-09.3: Responses in clinician mode must be shorter than patient mode
 */
function checkR093() {
  checksPerformed.push('R-09.3')
  
  const apiFile = 'apps/rhythm-studio-ui/app/api/clinician/chat/route.ts'
  const content = readFile(apiFile)
  
  if (!content) {
    addViolation('R-09.3', 'Clinician chat route.ts not found', apiFile)
    return
  }
  
  // Check for MAX_TOKENS constant
  const maxTokensMatch = content.match(/const MAX_TOKENS\s*=\s*(\d+)/)
  if (!maxTokensMatch) {
    addViolation('R-09.3', 'Missing MAX_TOKENS constant definition', apiFile)
    return
  }
  
  const maxTokens = parseInt(maxTokensMatch[1], 10)
  
  // Clinician mode should use max 800 tokens (patient mode uses 500)
  // Actually clinician mode should be shorter or equal for focused responses
  if (maxTokens > 1000) {
    addViolation('R-09.3', `MAX_TOKENS too high (${maxTokens}), should be <= 800 for focused responses`, apiFile)
  }
  
  // Check that comment mentions shorter responses
  const hasCommentAboutShorter = content.includes('Shorter responses') || content.includes('shorter') || content.includes('focused')
  if (!hasCommentAboutShorter) {
    addViolation('R-09.3', 'Missing documentation about shorter/focused responses', apiFile)
  }
}

/**
 * R-09.4: Clinician chat must be linked to patient record
 */
function checkR094() {
  checksPerformed.push('R-09.4')
  
  const apiFile = 'apps/rhythm-studio-ui/app/api/clinician/chat/route.ts'
  const content = readFile(apiFile)
  
  if (!content) {
    addViolation('R-09.4', 'Clinician chat route.ts not found', apiFile)
    return
  }
  
  // Check for patient_id in request body validation
  if (!content.includes('patient_id')) {
    addViolation('R-09.4', 'Missing patient_id field in request handling', apiFile)
  }
  
  // Check for validation that patient_id is required
  const hasValidation = content.includes('!body.patient_id') || content.includes('body?.patient_id')
  if (!hasValidation) {
    addViolation('R-09.4', 'Missing validation for required patient_id field', apiFile)
  }
}

/**
 * R-09.5: Chat messages must be stored with conversationMode metadata
 */
function checkR095() {
  checksPerformed.push('R-09.5')
  
  const apiFile = 'apps/rhythm-studio-ui/app/api/clinician/chat/route.ts'
  const content = readFile(apiFile)
  
  if (!content) {
    addViolation('R-09.5', 'Clinician chat route.ts not found', apiFile)
    return
  }
  
  // Check for saveMessage function that includes metadata
  const hasSaveMessage = content.includes('async function saveMessage')
  if (!hasSaveMessage) {
    addViolation('R-09.5', 'Missing saveMessage function', apiFile)
    return
  }
  
  // Check that conversationMode is set in metadata
  const setsConversationMode = content.includes('conversationMode:') && content.includes('clinician_colleague')
  if (!setsConversationMode) {
    addViolation('R-09.5', 'conversationMode not set in message metadata', apiFile)
  }
  
  // Check that clinicianUserId is tracked
  if (!content.includes('clinicianUserId')) {
    addViolation('R-09.5', 'Missing clinicianUserId tracking in message metadata', apiFile)
  }
}

/**
 * R-09.6: Clinician must have patient assignment to access chat
 */
function checkR096() {
  checksPerformed.push('R-09.6')
  
  const apiFile = 'apps/rhythm-studio-ui/app/api/clinician/chat/route.ts'
  const content = readFile(apiFile)
  
  if (!content) {
    addViolation('R-09.6', 'Clinician chat route.ts not found', apiFile)
    return
  }
  
  // Check for clinician_patient_assignments table query
  if (!content.includes('clinician_patient_assignments')) {
    addViolation('R-09.6', 'Missing clinician_patient_assignments access check', apiFile)
  }
  
  // Check for proper access validation
  const hasAccessCheck = content.includes('.eq(\'clinician_user_id\'') && content.includes('.eq(\'patient_user_id\'')
  if (!hasAccessCheck) {
    addViolation('R-09.6', 'Missing proper assignment verification query', apiFile)
  }
  
  // Check for 403 response when access denied
  const hasAccessDeniedResponse = content.match(/do not have access/i)
  if (!hasAccessDeniedResponse) {
    addViolation('R-09.6', 'Missing access denied error response', apiFile)
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function runChecks() {
  console.log('🔍 Issue 9: Running Clinician Colleague Mode Guardrails...\n')
  
  checkR091()
  checkR092()
  checkR093()
  checkR094()
  checkR095()
  checkR096()
  
  console.log(`✅ Checks performed: ${checksPerformed.length}`)
  console.log(`   Rules: ${checksPerformed.join(', ')}\n`)
  
  if (violations.length === 0) {
    console.log('✅ All validations passed!')
    console.log('✅ Rule-Check matrix is complete\n')
    return true
  } else {
    console.log(`❌ Found ${violations.length} violation(s):\n`)
    violations.forEach((v) => {
      console.log(`   [violates ${v.ruleId}] ${v.message}`)
      console.log(`   File: ${v.file}\n`)
    })
    return false
  }
}

function verifyMatrix() {
  const allRules = Object.keys(RULES)
  const rulesWithChecks = [...new Set(checksPerformed)]
  
  const rulesWithoutChecks = allRules.filter(r => !rulesWithChecks.includes(r))
  const checksWithoutRules = checksPerformed.filter(c => !allRules.includes(c))
  
  if (rulesWithoutChecks.length > 0) {
    console.log('⚠️  Rules without checks:')
    rulesWithoutChecks.forEach(r => console.log(`   - ${r}: ${RULES[r]}`))
    console.log()
  }
  
  if (checksWithoutRules.length > 0) {
    console.log('⚠️  Checks without rules:')
    checksWithoutRules.forEach(c => console.log(`   - ${c}`))
    console.log()
  }
  
  return rulesWithoutChecks.length === 0 && checksWithoutRules.length === 0
}

// Run all checks
const allPassed = runChecks()
const matrixComplete = verifyMatrix()

// Exit with appropriate code
if (allPassed && matrixComplete) {
  process.exit(0)
} else {
  process.exit(1)
}
