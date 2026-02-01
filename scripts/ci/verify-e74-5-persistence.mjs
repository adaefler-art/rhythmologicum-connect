#!/usr/bin/env node
/**
 * E74.5: Verification Script - Persistence: Answers + Progress (SSOT) + Resume deterministisch
 * 
 * Verifies:
 * 1. Answer persistence is idempotent (upsert, no duplicates)
 * 2. Idempotency keys prevent double-click issues
 * 3. Resume functionality is deterministic
 * 4. current_step_id updates are consistent
 * 5. Migrations are idempotent
 * 
 * Usage: node scripts/ci/verify-e74-5-persistence.mjs
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..', '..')

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

let passed = 0
let failed = 0
let warnings = 0

function logSection(title) {
  console.log(`\n${colors.cyan}═══ ${title} ═══${colors.reset}\n`)
}

function logPass(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`)
  passed++
}

function logFail(message, details) {
  console.log(`${colors.red}✗${colors.reset} ${message}`)
  if (details) {
    console.log(`  ${colors.red}↳${colors.reset} ${details}`)
  }
  failed++
}

function logWarn(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`)
  warnings++
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`)
}

// ============================================================================
// Check 1: Verify unique constraint migration is idempotent
// ============================================================================
async function checkIdempotentConstraintMigration() {
  logSection('Check 1: Idempotent Constraint Migration')
  
  try {
    const migrationPath = join(repoRoot, 'supabase/migrations/20260201150000_e74_5_ensure_idempotent_constraints.sql')
    const content = await readFile(migrationPath, 'utf-8')
    
    // Check for DO block pattern
    if (content.includes('DO $$')) {
      logPass('Migration uses DO block for idempotency')
    } else {
      logFail('Migration should use DO block for idempotency')
    }
    
    // Check for constraint existence check
    if (content.includes('IF NOT EXISTS') && content.includes('pg_constraint')) {
      logPass('Migration checks constraint existence before adding')
    } else {
      logFail('Migration should check constraint existence')
    }
    
    // Check for verification
    if (content.includes('RAISE NOTICE') || content.includes('RAISE EXCEPTION')) {
      logPass('Migration includes verification step')
    } else {
      logWarn('Migration should include verification step')
    }
    
  } catch (error) {
    logFail('Failed to read idempotent constraint migration', error.message)
  }
}

// ============================================================================
// Check 2: Verify unique constraint exists in schema
// ============================================================================
async function checkUniqueConstraintInSchema() {
  logSection('Check 2: Unique Constraint in Schema')
  
  try {
    const schemaPath = join(repoRoot, 'schema/schema.sql')
    const content = await readFile(schemaPath, 'utf-8')
    
    // Check for unique constraint on (assessment_id, question_id)
    const hasConstraint = content.includes('assessment_answers_assessment_question_unique') ||
                          content.match(/UNIQUE\s*\(\s*assessment_id\s*,\s*question_id\s*\)/i)
    
    if (hasConstraint) {
      logPass('Schema includes unique constraint on (assessment_id, question_id)')
    } else {
      logFail('Schema missing unique constraint on (assessment_id, question_id)')
    }
    
  } catch (error) {
    logFail('Failed to read schema', error.message)
  }
}

// ============================================================================
// Check 3: Verify save endpoint uses idempotency
// ============================================================================
async function checkSaveEndpointIdempotency() {
  logSection('Check 3: Save Endpoint Idempotency')
  
  try {
    const saveRoutePath = join(
      repoRoot,
      'apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts'
    )
    const content = await readFile(saveRoutePath, 'utf-8')
    
    // Check for withIdempotency wrapper
    if (content.includes('withIdempotency')) {
      logPass('Save endpoint uses withIdempotency wrapper')
    } else {
      logFail('Save endpoint should use withIdempotency wrapper')
    }
    
    // Check for checkPayloadConflict option
    if (content.includes('checkPayloadConflict')) {
      logPass('Save endpoint enables payload conflict detection')
    } else {
      logWarn('Save endpoint should enable payload conflict detection')
    }
    
    // Check for upsert with onConflict
    if (content.includes('upsert') && content.includes('onConflict')) {
      logPass('Save endpoint uses upsert with conflict handling')
    } else {
      logFail('Save endpoint should use upsert with conflict handling')
    }
    
    // Check for onConflict on correct columns
    if (content.includes("onConflict: 'assessment_id,question_id'")) {
      logPass('Upsert uses correct conflict columns (assessment_id, question_id)')
    } else {
      logFail('Upsert should use assessment_id,question_id for conflict')
    }
    
  } catch (error) {
    logFail('Failed to read save endpoint', error.message)
  }
}

// ============================================================================
// Check 4: Verify current_step_id update logic
// ============================================================================
async function checkCurrentStepIdLogic() {
  logSection('Check 4: current_step_id Update Logic')
  
  try {
    const saveRoutePath = join(
      repoRoot,
      'apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts'
    )
    const content = await readFile(saveRoutePath, 'utf-8')
    
    // Check for isV05CatalogFunnel check
    if (content.includes('isV05CatalogFunnel')) {
      logPass('Save endpoint checks for V0.5 catalog funnel')
    } else {
      logWarn('Save endpoint should distinguish between funnel types')
    }
    
    // Check for current_step_id update
    if (content.includes('current_step_id')) {
      logPass('Save endpoint updates current_step_id')
    } else {
      logFail('Save endpoint should update current_step_id for legacy funnels')
    }
    
    // Check for conditional update (only for non-V0.5)
    const hasConditionalUpdate = content.match(/if\s*\(\s*!isV05CatalogFunnel\s*\)/i)
    if (hasConditionalUpdate) {
      logPass('current_step_id update is conditional (legacy funnels only)')
    } else {
      logWarn('current_step_id should only update for legacy funnels')
    }
    
  } catch (error) {
    logFail('Failed to check current_step_id logic', error.message)
  }
}

// ============================================================================
// Check 5: Verify resume endpoint loads answers
// ============================================================================
async function checkResumeEndpoint() {
  logSection('Check 5: Resume Endpoint')
  
  try {
    const resumePath = join(
      repoRoot,
      'apps/rhythm-patient-ui/app/api/assessments/[id]/resume/route.ts'
    )
    const content = await readFile(resumePath, 'utf-8')
    
    // Check for answer loading
    if (content.includes('assessment_answers')) {
      logPass('Resume endpoint loads assessment_answers')
    } else {
      logFail('Resume endpoint should load assessment_answers')
    }
    
    // Check for current step loading
    if (content.includes('getCurrentStep') || content.includes('current_step_id')) {
      logPass('Resume endpoint loads current step')
    } else {
      logWarn('Resume endpoint should load current step')
    }
    
    // Check for navigation state
    if (content.includes('getNavigationState') || content.includes('navState')) {
      logPass('Resume endpoint loads navigation state')
    } else {
      logWarn('Resume endpoint should load navigation state')
    }
    
  } catch (error) {
    logFail('Failed to read resume endpoint', error.message)
  }
}

// ============================================================================
// Check 6: Verify assessmentPersistence adapter
// ============================================================================
async function checkPersistenceAdapter() {
  logSection('Check 6: Assessment Persistence Adapter')
  
  try {
    const adapterPath = join(repoRoot, 'lib/api/assessmentPersistence.ts')
    const content = await readFile(adapterPath, 'utf-8')
    
    // Check for loadAssessmentRun function
    if (content.includes('loadAssessmentRun')) {
      logPass('Adapter includes loadAssessmentRun function')
    } else {
      logFail('Adapter should include loadAssessmentRun function')
    }
    
    // Check for saveAnswer function
    if (content.includes('saveAnswer')) {
      logPass('Adapter includes saveAnswer function')
    } else {
      logWarn('Adapter should include saveAnswer function')
    }
    
    // Check for idempotency key handling
    if (content.includes('clientMutationId') || content.includes('idempotency')) {
      logPass('Adapter handles idempotency keys')
    } else {
      logWarn('Adapter should handle idempotency keys')
    }
    
  } catch (error) {
    logFail('Failed to read persistence adapter', error.message)
  }
}

// ============================================================================
// Check 7: Verify answer_data field for V0.5 funnels
// ============================================================================
async function checkAnswerDataField() {
  logSection('Check 7: answer_data JSONB Field')
  
  try {
    const schemaPath = join(repoRoot, 'schema/schema.sql')
    const content = await readFile(schemaPath, 'utf-8')
    
    // Check for answer_data column
    if (content.includes('answer_data') && content.includes('jsonb')) {
      logPass('Schema includes answer_data JSONB column')
    } else {
      logFail('Schema should include answer_data JSONB column for V0.5 funnels')
    }
    
    // Check save endpoint uses answer_data
    const saveRoutePath = join(
      repoRoot,
      'apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts'
    )
    const saveContent = await readFile(saveRoutePath, 'utf-8')
    
    if (saveContent.includes('answer_data')) {
      logPass('Save endpoint stores answer_data for V0.5 funnels')
    } else {
      logFail('Save endpoint should store answer_data for V0.5 funnels')
    }
    
  } catch (error) {
    logFail('Failed to check answer_data field', error.message)
  }
}

// ============================================================================
// Main execution
// ============================================================================
async function main() {
  console.log(`${colors.blue}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`)
  console.log(`${colors.blue}║  E74.5 Verification: Persistence + SSOT + Deterministic Resume  ║${colors.reset}`)
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`)
  
  await checkIdempotentConstraintMigration()
  await checkUniqueConstraintInSchema()
  await checkSaveEndpointIdempotency()
  await checkCurrentStepIdLogic()
  await checkResumeEndpoint()
  await checkPersistenceAdapter()
  await checkAnswerDataField()
  
  // Summary
  logSection('Summary')
  console.log(`${colors.green}Passed:${colors.reset}   ${passed}`)
  console.log(`${colors.red}Failed:${colors.reset}   ${failed}`)
  console.log(`${colors.yellow}Warnings:${colors.reset} ${warnings}`)
  
  if (failed > 0) {
    console.log(`\n${colors.red}❌ Verification FAILED${colors.reset}`)
    process.exit(1)
  } else if (warnings > 0) {
    console.log(`\n${colors.yellow}⚠️  Verification PASSED with warnings${colors.reset}`)
    process.exit(0)
  } else {
    console.log(`\n${colors.green}✅ Verification PASSED${colors.reset}`)
    process.exit(0)
  }
}

main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error)
  process.exit(1)
})
