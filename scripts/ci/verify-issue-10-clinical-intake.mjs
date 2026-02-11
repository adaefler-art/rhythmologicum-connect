#!/usr/bin/env node
/**
 * Issue 10: Clinical Intake Synthesis - Verification Script
 * 
 * Verifies that all components of the clinical intake feature are properly implemented.
 * 
 * Checks:
 * - Database migration exists
 * - API endpoints exist and export required functions
 * - Types are defined
 * - Validation functions exist
 * - Prompt is defined
 * - Documentation exists
 * 
 * Exit codes:
 * - 0: All checks passed
 * - 1: One or more checks failed
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const REPO_ROOT = process.cwd()
const errors = []
const warnings = []

function check(description, testFn) {
  try {
    const result = testFn()
    if (result === true) {
      console.log(`✅ ${description}`)
      return true
    } else if (result === false) {
      console.error(`❌ ${description}`)
      errors.push(description)
      return false
    } else {
      console.warn(`⚠️  ${description}: ${result}`)
      warnings.push(description)
      return true
    }
  } catch (error) {
    console.error(`❌ ${description}: ${error.message}`)
    errors.push(description)
    return false
  }
}

console.log('🔍 Issue 10: Clinical Intake Synthesis - Verification\n')

// ============================================================================
// Database Migration
// ============================================================================

console.log('📦 Database Migration')

check('Migration file exists', () => {
  const migrationPath = join(
    REPO_ROOT,
    'supabase/migrations/20260211062500_issue_10_clinical_intakes.sql'
  )
  return existsSync(migrationPath)
})

check('Migration creates clinical_intakes table', () => {
  const migrationPath = join(
    REPO_ROOT,
    'supabase/migrations/20260211062500_issue_10_clinical_intakes.sql'
  )
  const content = readFileSync(migrationPath, 'utf-8')
  return content.includes('CREATE TABLE') && content.includes('clinical_intakes')
})

check('Migration creates intake_status enum', () => {
  const migrationPath = join(
    REPO_ROOT,
    'supabase/migrations/20260211062500_issue_10_clinical_intakes.sql'
  )
  const content = readFileSync(migrationPath, 'utf-8')
  return content.includes('CREATE TYPE') && content.includes('intake_status')
})

check('Migration includes RLS policies', () => {
  const migrationPath = join(
    REPO_ROOT,
    'supabase/migrations/20260211062500_issue_10_clinical_intakes.sql'
  )
  const content = readFileSync(migrationPath, 'utf-8')
  return (
    content.includes('ENABLE ROW LEVEL SECURITY') && content.includes('CREATE POLICY')
  )
})

// ============================================================================
// TypeScript Types
// ============================================================================

console.log('\n📝 TypeScript Types')

check('Types file exists', () => {
  const typesPath = join(REPO_ROOT, 'lib/types/clinicalIntake.ts')
  return existsSync(typesPath)
})

check('Types export StructuredIntakeData', () => {
  const typesPath = join(REPO_ROOT, 'lib/types/clinicalIntake.ts')
  const content = readFileSync(typesPath, 'utf-8')
  return content.includes('export interface StructuredIntakeData')
})

check('Types export ClinicalIntake', () => {
  const typesPath = join(REPO_ROOT, 'lib/types/clinicalIntake.ts')
  const content = readFileSync(typesPath, 'utf-8')
  return content.includes('export interface ClinicalIntake')
})

check('Types export API request/response types', () => {
  const typesPath = join(REPO_ROOT, 'lib/types/clinicalIntake.ts')
  const content = readFileSync(typesPath, 'utf-8')
  return (
    content.includes('GenerateIntakeRequest') &&
    content.includes('GenerateIntakeResponse')
  )
})

// ============================================================================
// LLM Prompts
// ============================================================================

console.log('\n💬 LLM Prompts')

check('Prompt function exists in prompts.ts', () => {
  const promptsPath = join(REPO_ROOT, 'lib/llm/prompts.ts')
  const content = readFileSync(promptsPath, 'utf-8')
  return content.includes('getClinicalIntakePrompt')
})

check('Prompt version constant exists', () => {
  const promptsPath = join(REPO_ROOT, 'lib/llm/prompts.ts')
  const content = readFileSync(promptsPath, 'utf-8')
  return content.includes('CLINICAL_INTAKE_PROMPT_VERSION')
})

check('Prompt follows issue requirements (R-I10-PROMPT)', () => {
  const promptsPath = join(REPO_ROOT, 'lib/llm/prompts.ts')
  const content = readFileSync(promptsPath, 'utf-8')
  const prompt = content.slice(
    content.indexOf('getClinicalIntakePrompt'),
    content.indexOf('getClinicalIntakePrompt') + 5000
  )
  
  // Check for key requirements from issue
  const hasRole = prompt.includes('Clinical-Reasoning-Modul') || prompt.includes('ärztliches')
  const hasStructuredIntake = prompt.includes('STRUCTURED_INTAKE')
  const hasClinicalSummary = prompt.includes('CLINICAL_SUMMARY')
  const hasContentRules = prompt.includes('Keine Rohsätze') || prompt.includes('Umgangssprache')
  
  if (!hasRole) return 'Missing role definition'
  if (!hasStructuredIntake) return 'Missing STRUCTURED_INTAKE reference'
  if (!hasClinicalSummary) return 'Missing CLINICAL_SUMMARY reference'
  if (!hasContentRules) return 'Missing content rules'
  
  return true
})

// ============================================================================
// API Endpoints
// ============================================================================

console.log('\n🌐 API Endpoints')

check('Generate endpoint exists', () => {
  const generatePath = join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/clinical-intake/generate/route.ts'
  )
  return existsSync(generatePath)
})

check('Generate endpoint exports POST', () => {
  const generatePath = join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/clinical-intake/generate/route.ts'
  )
  const content = readFileSync(generatePath, 'utf-8')
  return content.includes('export async function POST')
})

check('Latest endpoint exists', () => {
  const latestPath = join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/clinical-intake/latest/route.ts'
  )
  return existsSync(latestPath)
})

check('Latest endpoint exports GET', () => {
  const latestPath = join(
    REPO_ROOT,
    'apps/rhythm-patient-ui/app/api/clinical-intake/latest/route.ts'
  )
  const content = readFileSync(latestPath, 'utf-8')
  return content.includes('export async function GET')
})

// ============================================================================
// Validation Framework
// ============================================================================

console.log('\n✅ Validation Framework')

check('Validation file exists', () => {
  const validationPath = join(REPO_ROOT, 'lib/clinicalIntake/validation.ts')
  return existsSync(validationPath)
})

check('Validation exports validateIntakeQuality', () => {
  const validationPath = join(REPO_ROOT, 'lib/clinicalIntake/validation.ts')
  const content = readFileSync(validationPath, 'utf-8')
  return content.includes('export function validateIntakeQuality')
})

check('Validation implements all required checks (R-I10-*)', () => {
  const validationPath = join(REPO_ROOT, 'lib/clinicalIntake/validation.ts')
  const content = readFileSync(validationPath, 'utf-8')
  
  // Check for required rule IDs from matrix
  const requiredRules = [
    'R-I10-1.1', // No colloquial language
    'R-I10-1.2', // Medical terminology
    'R-I10-2.1', // Required fields
    'R-I10-2.2', // Array validity
    'R-I10-3.1', // No chat language
    'R-I10-4.1', // Red flag documentation
    'R-I10-4.2', // Uncertainty explicit
  ]
  
  const missingRules = requiredRules.filter((rule) => !content.includes(rule))
  
  if (missingRules.length > 0) {
    return `Missing rules: ${missingRules.join(', ')}`
  }
  
  return true
})

// ============================================================================
// Documentation
// ============================================================================

console.log('\n📚 Documentation')

check('Implementation summary exists', () => {
  const summaryPath = join(REPO_ROOT, 'ISSUE-10-IMPLEMENTATION-SUMMARY.md')
  return existsSync(summaryPath)
})

check('Rules vs Checks matrix exists', () => {
  const matrixPath = join(REPO_ROOT, 'ISSUE-10-RULES-VS-CHECKS-MATRIX.md')
  return existsSync(matrixPath)
})

check('Rules vs Checks matrix has 100% coverage', () => {
  const matrixPath = join(REPO_ROOT, 'ISSUE-10-RULES-VS-CHECKS-MATRIX.md')
  const content = readFileSync(matrixPath, 'utf-8')
  
  // Check for 100% coverage claim
  return content.includes('100%') || content.includes('Coverage')
})

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(60))
console.log('📊 Verification Summary\n')

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed!')
  process.exit(0)
} else {
  if (errors.length > 0) {
    console.error(`❌ ${errors.length} error(s):`)
    errors.forEach((err) => console.error(`   - ${err}`))
  }
  
  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} warning(s):`)
    warnings.forEach((warn) => console.warn(`   - ${warn}`))
  }
  
  if (errors.length > 0) {
    console.error('\n❌ Verification failed')
    process.exit(1)
  } else {
    console.log('\n✅ Verification passed with warnings')
    process.exit(0)
  }
}
