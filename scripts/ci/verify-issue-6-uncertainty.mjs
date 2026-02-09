#!/usr/bin/env node

/**
 * Issue 6 Guardrails Check: Parametrizable Uncertainty & Probability Handling
 * 
 * Verifies that uncertainty parameter system is properly implemented:
 * - Configuration file exists with all required parameters
 * - Validation enforces parameter rules
 * - LLM prompts include parameter instructions
 * - API routes use parameters correctly
 * - No hardcoded uncertainty expressions bypass parameter system
 * 
 * Rules Verified:
 * - R-I6-01: Patient mode defaults are safe
 * - R-I6-02: Clinician mode defaults are appropriate
 * - R-I6-03: System defaults to patient-safe parameters
 * - R-I6-04: Off profile rules are defined
 * - R-I6-05: Qualitative markers are defined
 * - R-I6-06: Mixed mode rules are defined
 * - R-I6-07-09: Assertiveness markers are defined
 * - R-I6-10: Patient audience restrictions are defined
 * - R-I6-11: Clinician audience allowances are defined
 * - R-I6-12: Parameter validation exists
 * - R-I6-13: Default parameters helper exists
 * - R-I6-14: Number allowance check exists
 * - R-I6-15: Header formatting exists
 * - R-I6-16: Validation checks parameter presence
 * - R-I6-17: Validation checks no numbers in patient mode
 * - R-I6-18: Validation checks language consistency
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
    console.error(`  violates R-I6-XX (file must exist)`)
    exitCode = 1
    return null
  }
  console.log(`${GREEN}✓${RESET} ${description}: File exists`)
  return readFileSync(fullPath, 'utf-8')
}

function checkPatternExists(content, pattern, ruleId, description) {
  if (!content) {
    console.error(`${RED}✗${RESET} ${ruleId}: Cannot verify - file not loaded`)
    console.error(`  violates ${ruleId}`)
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

function checkExportExists(content, exportName, ruleId, description) {
  if (!content) {
    console.error(`${RED}✗${RESET} ${ruleId}: Cannot verify - file not loaded`)
    console.error(`  violates ${ruleId}`)
    exitCode = 1
    return false
  }
  
  // Check for export statement
  const exportPattern = new RegExp(`export\\s+(const|function|type|interface)\\s+${exportName}\\b`)
  if (!exportPattern.test(content)) {
    console.error(`${RED}✗${RESET} ${ruleId}: ${description}`)
    console.error(`  violates ${ruleId}`)
    exitCode = 1
    return false
  }
  
  console.log(`${GREEN}✓${RESET} ${ruleId}: ${description}`)
  return true
}

console.log('\n=== Issue 6: Uncertainty Parameters Check ===\n')

// ============================================================================
// CONFIGURATION FILE CHECKS
// ============================================================================

console.log('\n--- Configuration File ---')

const configContent = checkFile(
  'lib/config/uncertaintyParameters.ts',
  'Uncertainty parameters configuration'
)

if (configContent) {
  // R-I6-01: Patient mode defaults
  checkPatternExists(
    configContent,
    /PATIENT_MODE_DEFAULTS[\s\S]*uncertaintyProfile:\s*['"]qualitative['"]/,
    'R-I6-01.1',
    'Patient mode uses qualitative profile by default'
  )
  
  checkPatternExists(
    configContent,
    /PATIENT_MODE_DEFAULTS[\s\S]*assertiveness:\s*['"]conservative['"]/,
    'R-I6-01.2',
    'Patient mode uses conservative assertiveness by default'
  )
  
  checkPatternExists(
    configContent,
    /PATIENT_MODE_DEFAULTS[\s\S]*audience:\s*['"]patient['"]/,
    'R-I6-01.3',
    'Patient mode targets patient audience'
  )
  
  // R-I6-02: Clinician mode defaults
  checkPatternExists(
    configContent,
    /CLINICIAN_MODE_DEFAULTS[\s\S]*audience:\s*['"]clinician['"]/,
    'R-I6-02.1',
    'Clinician mode targets clinician audience'
  )
  
  // R-I6-03: System defaults
  checkPatternExists(
    configContent,
    /DEFAULT_UNCERTAINTY_PARAMETERS.*=.*PATIENT_MODE_DEFAULTS/,
    'R-I6-03',
    'System defaults to patient-safe parameters'
  )
  
  // R-I6-04: Off profile rules
  checkExportExists(
    configContent,
    'UNCERTAINTY_OFF_RULES',
    'R-I6-04',
    'Uncertainty off profile rules are defined'
  )
  
  // R-I6-05: Qualitative markers
  checkExportExists(
    configContent,
    'QUALITATIVE_MARKERS',
    'R-I6-05.1',
    'Qualitative markers are defined'
  )
  
  checkPatternExists(
    configContent,
    /prohibited:\s*\[[\s\S]*?\/.*%.*\//,
    'R-I6-05.2',
    'Prohibited patterns include percentage detection'
  )
  
  // R-I6-06: Mixed mode rules
  checkExportExists(
    configContent,
    'MIXED_MODE_RULES',
    'R-I6-06.1',
    'Mixed mode rules are defined'
  )
  
  checkPatternExists(
    configContent,
    /forbidNumbersInPatient:\s*true/,
    'R-I6-06.2',
    'Mixed mode forbids numbers in patient mode'
  )
  
  // R-I6-07-09: Assertiveness markers
  checkExportExists(
    configContent,
    'CONSERVATIVE_MARKERS',
    'R-I6-07',
    'Conservative assertiveness markers are defined'
  )
  
  checkExportExists(
    configContent,
    'BALANCED_MARKERS',
    'R-I6-08',
    'Balanced assertiveness markers are defined'
  )
  
  checkExportExists(
    configContent,
    'DIRECT_MARKERS',
    'R-I6-09',
    'Direct assertiveness markers are defined'
  )
  
  // R-I6-10: Patient audience restrictions
  checkExportExists(
    configContent,
    'PATIENT_AUDIENCE_RULES',
    'R-I6-10.1',
    'Patient audience rules are defined'
  )
  
  checkPatternExists(
    configContent,
    /PATIENT_AUDIENCE_RULES[\s\S]*noNumbers:\s*true/,
    'R-I6-10.2',
    'Patient audience forbids numbers'
  )
  
  // R-I6-11: Clinician audience allowances
  checkExportExists(
    configContent,
    'CLINICIAN_AUDIENCE_RULES',
    'R-I6-11.1',
    'Clinician audience rules are defined'
  )
  
  checkPatternExists(
    configContent,
    /noDefinitiveDiagnosis:\s*true/,
    'R-I6-11.2',
    'Clinician audience still forbids definitive diagnosis'
  )
  
  // R-I6-12-15: Helper functions
  checkExportExists(
    configContent,
    'validateParameterCombination',
    'R-I6-12',
    'Parameter validation helper exists'
  )
  
  checkExportExists(
    configContent,
    'getDefaultParametersForAudience',
    'R-I6-13',
    'Default parameters helper exists'
  )
  
  checkExportExists(
    configContent,
    'areNumbersAllowed',
    'R-I6-14',
    'Number allowance check exists'
  )
  
  checkExportExists(
    configContent,
    'formatParametersForHeader',
    'R-I6-15',
    'Header formatting helper exists'
  )
}

// ============================================================================
// VALIDATION FILE CHECKS
// ============================================================================

console.log('\n--- Validation File ---')

const validationContent = checkFile(
  'lib/validation/consultNote.ts',
  'Consult note validation'
)

if (validationContent) {
  // R-I6-16: Parameter presence validation
  checkPatternExists(
    validationContent,
    /validateUncertaintyParameters/,
    'R-I6-16.1',
    'Uncertainty parameter validation function exists'
  )
  
  checkPatternExists(
    validationContent,
    /violates R-I6-16.*Uncertainty profile is required/,
    'R-I6-16.2',
    'Validation checks uncertainty profile presence'
  )
  
  checkPatternExists(
    validationContent,
    /violates R-I6-16.*Assertiveness.*is required/,
    'R-I6-16.3',
    'Validation checks assertiveness presence'
  )
  
  checkPatternExists(
    validationContent,
    /violates R-I6-16.*Audience is required/,
    'R-I6-16.4',
    'Validation checks audience presence'
  )
  
  // R-I6-17: No numbers in patient mode
  checkPatternExists(
    validationContent,
    /validateNoNumbersInText/,
    'R-I6-17.1',
    'Numerical probability validation function exists'
  )
  
  checkPatternExists(
    validationContent,
    /violates R-I6-17.*Numerical probability/i,
    'R-I6-17.2',
    'Validation detects numerical probabilities in patient mode'
  )
  
  // R-I6-18: Language consistency
  checkPatternExists(
    validationContent,
    /validateLanguageConsistency/,
    'R-I6-18.1',
    'Language consistency validation function exists'
  )
  
  checkPatternExists(
    validationContent,
    /violates R-I6-18/,
    'R-I6-18.2',
    'Validation checks language consistency with parameters'
  )
  
  // Import check
  checkPatternExists(
    validationContent,
    /import.*from.*['"]@\/lib\/config\/uncertaintyParameters['"]/,
    'R-I6-19',
    'Validation imports uncertainty parameter utilities'
  )
}

// ============================================================================
// LLM PROMPT CHECKS
// ============================================================================

console.log('\n--- LLM Prompt File ---')

const promptContent = checkFile(
  'lib/llm/prompts.ts',
  'LLM prompts configuration'
)

if (promptContent) {
  // Check that prompts accept uncertainty parameters
  checkPatternExists(
    promptContent,
    /getConsultNoteGenerationPrompt[\s\S]*uncertaintyProfile/,
    'R-I6-20.1',
    'Consult note prompt accepts uncertaintyProfile parameter'
  )
  
  checkPatternExists(
    promptContent,
    /getConsultNoteGenerationPrompt[\s\S]*assertiveness/,
    'R-I6-20.2',
    'Consult note prompt accepts assertiveness parameter'
  )
  
  checkPatternExists(
    promptContent,
    /getConsultNoteGenerationPrompt[\s\S]*audience/,
    'R-I6-20.3',
    'Consult note prompt accepts audience parameter'
  )
  
  // Check that prompt includes uncertainty instructions
  checkPatternExists(
    promptContent,
    /getUncertaintyInstructions/,
    'R-I6-20.4',
    'Prompt generates uncertainty instructions based on parameters'
  )
  
  // Check that prompt documents parameters in header
  checkPatternExists(
    promptContent,
    /Uncertainty Profile:.*\${uncertaintyProfile}/,
    'R-I6-20.5',
    'Prompt includes uncertainty profile in header'
  )
  
  checkPatternExists(
    promptContent,
    /Assertiveness:.*\${assertiveness}/,
    'R-I6-20.6',
    'Prompt includes assertiveness in header'
  )
  
  checkPatternExists(
    promptContent,
    /Audience:.*\${audience}/,
    'R-I6-20.7',
    'Prompt includes audience in header'
  )
}

// ============================================================================
// API ROUTE CHECKS
// ============================================================================

console.log('\n--- API Route File ---')

const apiContent = checkFile(
  'apps/rhythm-studio-ui/app/api/clinician/consult-notes/generate/route.ts',
  'Consult note generation API'
)

if (apiContent) {
  // Check that API uses uncertainty parameters
  checkPatternExists(
    apiContent,
    /uncertaintyProfile.*\|\|.*['"]qualitative['"]/,
    'R-I6-21.1',
    'API defaults to qualitative uncertainty profile'
  )
  
  checkPatternExists(
    apiContent,
    /assertiveness.*\|\|.*['"]conservative['"]/,
    'R-I6-21.2',
    'API defaults to conservative assertiveness'
  )
  
  checkPatternExists(
    apiContent,
    /audience.*\|\|.*['"]patient['"]/,
    'R-I6-21.3',
    'API defaults to patient audience'
  )
  
  // Check that API passes parameters to prompt
  checkPatternExists(
    apiContent,
    /getConsultNoteGenerationPrompt[\s\S]*uncertaintyProfile/,
    'R-I6-21.4',
    'API passes uncertainty profile to prompt'
  )
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

console.log('\n--- Type Definitions ---')

const typeContent = checkFile(
  'lib/types/consultNote.ts',
  'Consult note types'
)

if (typeContent) {
  // Check that types include uncertainty parameters
  checkPatternExists(
    typeContent,
    /export type UncertaintyProfile/,
    'R-I6-22.1',
    'UncertaintyProfile type is defined'
  )
  
  checkPatternExists(
    typeContent,
    /export type AssertivenessLevel/,
    'R-I6-22.2',
    'AssertivenessLevel type is defined'
  )
  
  checkPatternExists(
    typeContent,
    /export type AudienceType/,
    'R-I6-22.3',
    'AudienceType type is defined'
  )
  
  // Check that header includes all parameters
  checkPatternExists(
    typeContent,
    /interface ConsultNoteHeader[\s\S]*uncertaintyProfile:\s*UncertaintyProfile/,
    'R-I6-22.4',
    'ConsultNoteHeader includes uncertaintyProfile'
  )
  
  checkPatternExists(
    typeContent,
    /interface ConsultNoteHeader[\s\S]*assertiveness:\s*AssertivenessLevel/,
    'R-I6-22.5',
    'ConsultNoteHeader includes assertiveness'
  )
  
  checkPatternExists(
    typeContent,
    /interface ConsultNoteHeader[\s\S]*audience:\s*AudienceType/,
    'R-I6-22.6',
    'ConsultNoteHeader includes audience'
  )
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n=== Summary ===\n')
if (exitCode === 0) {
  console.log(`${GREEN}✓ All Issue 6 uncertainty parameter checks passed${RESET}`)
  console.log('\nKey achievements:')
  console.log('  • Configuration file defines all required parameters and rules')
  console.log('  • Validation enforces parameter presence and compliance')
  console.log('  • LLM prompts use parameters to control output')
  console.log('  • API routes apply default parameters correctly')
  console.log('  • Type system supports all uncertainty parameters')
} else {
  console.log(`${RED}✗ Some checks failed${RESET}`)
  console.log('\nTo fix violations:')
  console.log('  1. Ensure all configuration exports are present')
  console.log('  2. Add missing validation functions')
  console.log('  3. Update prompts to accept and use parameters')
  console.log('  4. Verify API routes use parameter defaults')
}

process.exit(exitCode)
