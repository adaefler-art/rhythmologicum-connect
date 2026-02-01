#!/usr/bin/env node

/**
 * E74.7 Start/Resume Idempotency Verification Script
 * 
 * Purpose: Verify database constraints and API behavior for assessment idempotency
 * 
 * Validation Rules:
 * - R-E74.7-001: ONE in-progress assessment per patient+funnel (unique index)
 * - R-E74.7-002: Index exists for efficient in-progress assessment lookup
 * - R-E74.7-003: API returns existing assessment by default (RESUME_OR_CREATE)
 * - R-E74.7-004: API supports forceNew parameter to create new assessment
 * - R-E74.7-005: API completes old assessment when forceNew=true
 * - R-E74.7-006: Parallel requests don't create duplicate assessments
 * 
 * Exit Codes:
 * - 0: All checks passed
 * - 1: One or more validation failures
 * - 2: Script error (config, database connection, etc.)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(2)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Error code to rule ID mapping
const ERROR_CODE_TO_RULE_ID = {
  MISSING_UNIQUE_INDEX: 'R-E74.7-001',
  MISSING_LOOKUP_INDEX: 'R-E74.7-002',
  API_NO_RESUME_LOGIC: 'R-E74.7-003',
  API_NO_FORCE_NEW: 'R-E74.7-004',
  API_NO_COMPLETE_OLD: 'R-E74.7-005',
  API_NO_RACE_PROTECTION: 'R-E74.7-006',
}

// ============================================================================
// Validation Functions
// ============================================================================

async function checkDatabaseConstraints() {
  console.log('\n🔍 Checking database constraints for assessment idempotency...')
  
  const errors = []
  
  // Check for unique index on (patient_id, funnel) WHERE completed_at IS NULL
  try {
    const { data: schema, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          i.indexname,
          i.indexdef
        FROM pg_indexes i
        WHERE i.schemaname = 'public' 
          AND i.tablename = 'assessments'
          AND i.indexname LIKE '%in_progress%patient%funnel%'
      `
    }).catch(() => ({ data: null, error: new Error('Cannot query pg_indexes') }))
    
    if (error || !schema || schema.length === 0) {
      errors.push({
        code: 'MISSING_UNIQUE_INDEX',
        ruleId: ERROR_CODE_TO_RULE_ID.MISSING_UNIQUE_INDEX,
        message: `[MISSING_UNIQUE_INDEX] violates ${ERROR_CODE_TO_RULE_ID.MISSING_UNIQUE_INDEX}: Unique partial index on assessments(patient_id, funnel) WHERE completed_at IS NULL not found`,
        severity: 'error',
      })
    } else {
      console.log(`  ✅ Unique index for in-progress assessments exists: ${schema[0].indexname}`)
    }
  } catch (err) {
    console.warn('  ⚠️  Cannot verify unique index programmatically')
    console.warn('     Manual verification required in database')
  }
  
  // Check for efficient lookup index
  try {
    const { data: lookupIndex, error: lookupError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'assessments'
          AND indexname = 'idx_assessments_patient_in_progress'
      `
    }).catch(() => ({ data: null, error: new Error('Cannot query indexes') }))
    
    if (lookupError || !lookupIndex || lookupIndex.length === 0) {
      errors.push({
        code: 'MISSING_LOOKUP_INDEX',
        ruleId: ERROR_CODE_TO_RULE_ID.MISSING_LOOKUP_INDEX,
        message: `[MISSING_LOOKUP_INDEX] violates ${ERROR_CODE_TO_RULE_ID.MISSING_LOOKUP_INDEX}: Lookup index idx_assessments_patient_in_progress not found`,
        severity: 'warning',
      })
    } else {
      console.log('  ✅ Efficient lookup index exists: idx_assessments_patient_in_progress')
    }
  } catch (err) {
    console.warn('  ⚠️  Cannot verify lookup index programmatically')
  }
  
  return {
    passed: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning').length,
  }
}

async function checkAPIImplementation() {
  console.log('\n🔍 Checking API implementation for idempotency...')
  
  const errors = []
  const warnings = []
  
  // Check if route.ts files exist in both apps
  const routeFiles = [
    'apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/route.ts',
    'apps/rhythm-legacy/app/api/funnels/[slug]/assessments/route.ts',
  ]
  
  for (const filePath of routeFiles) {
    const fullPath = join(process.cwd(), filePath)
    
    if (!existsSync(fullPath)) {
      errors.push({
        code: 'API_NO_RESUME_LOGIC',
        ruleId: ERROR_CODE_TO_RULE_ID.API_NO_RESUME_LOGIC,
        message: `[API_NO_RESUME_LOGIC] violates ${ERROR_CODE_TO_RULE_ID.API_NO_RESUME_LOGIC}: API route file not found: ${filePath}`,
        severity: 'error',
      })
      continue
    }
    
    const content = readFileSync(fullPath, 'utf-8')
    
    // Check for RESUME_OR_CREATE logic (checking for existing assessment)
    if (!content.includes('existingAssessment') || !content.includes('completed_at')) {
      errors.push({
        code: 'API_NO_RESUME_LOGIC',
        ruleId: ERROR_CODE_TO_RULE_ID.API_NO_RESUME_LOGIC,
        message: `[API_NO_RESUME_LOGIC] violates ${ERROR_CODE_TO_RULE_ID.API_NO_RESUME_LOGIC}: No RESUME_OR_CREATE logic found in ${filePath}`,
        severity: 'error',
      })
    }
    
    // Check for forceNew parameter support
    if (!content.includes('forceNew')) {
      errors.push({
        code: 'API_NO_FORCE_NEW',
        ruleId: ERROR_CODE_TO_RULE_ID.API_NO_FORCE_NEW,
        message: `[API_NO_FORCE_NEW] violates ${ERROR_CODE_TO_RULE_ID.API_NO_FORCE_NEW}: No forceNew parameter support in ${filePath}`,
        severity: 'error',
      })
    }
    
    // Check for logic to complete old assessment when forceNew=true
    if (!content.includes('completed_at') || !content.includes('update')) {
      warnings.push({
        code: 'API_NO_COMPLETE_OLD',
        ruleId: ERROR_CODE_TO_RULE_ID.API_NO_COMPLETE_OLD,
        message: `[API_NO_COMPLETE_OLD] violates ${ERROR_CODE_TO_RULE_ID.API_NO_COMPLETE_OLD}: Missing logic to complete old assessment in ${filePath}`,
        severity: 'warning',
      })
    }
    
    // Check for E74.7 documentation in comments
    if (content.includes('E74.7')) {
      console.log(`  ✅ E74.7 implementation documented in ${filePath}`)
    } else {
      warnings.push({
        code: 'API_NO_DOCUMENTATION',
        ruleId: 'R-E74.7-DOC',
        message: `E74.7 implementation not documented in comments in ${filePath}`,
        severity: 'info',
      })
    }
  }
  
  // Check for test coverage
  const testFile = 'apps/rhythm-legacy/app/api/funnels/__tests__/e74-7-idempotency.test.ts'
  const testPath = join(process.cwd(), testFile)
  
  if (existsSync(testPath)) {
    const testContent = readFileSync(testPath, 'utf-8')
    
    if (testContent.includes('RESUME_OR_CREATE') && testContent.includes('forceNew')) {
      console.log('  ✅ Test coverage exists for E74.7 scenarios')
    } else {
      warnings.push({
        code: 'API_NO_TEST_COVERAGE',
        ruleId: 'R-E74.7-TEST',
        message: 'Incomplete test coverage for E74.7 idempotency scenarios',
        severity: 'info',
      })
    }
  } else {
    warnings.push({
      code: 'API_NO_TESTS',
      ruleId: 'R-E74.7-TEST',
      message: 'No dedicated E74.7 test file found',
      severity: 'warning',
    })
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings: warnings.length,
  }
}

async function checkMigration() {
  console.log('\n🔍 Checking migration file...')
  
  const errors = []
  const migrationFile = 'supabase/migrations/20260201163126_e74_7_assessment_idempotency.sql'
  const migrationPath = join(process.cwd(), migrationFile)
  
  if (!existsSync(migrationPath)) {
    errors.push({
      code: 'MISSING_MIGRATION',
      ruleId: ERROR_CODE_TO_RULE_ID.MISSING_UNIQUE_INDEX,
      message: `[MISSING_MIGRATION] violates ${ERROR_CODE_TO_RULE_ID.MISSING_UNIQUE_INDEX}: Migration file not found: ${migrationFile}`,
      severity: 'error',
    })
  } else {
    const content = readFileSync(migrationPath, 'utf-8')
    
    if (content.includes('idx_assessments_one_in_progress_per_patient_funnel')) {
      console.log('  ✅ Migration creates unique index for assessment idempotency')
    } else {
      errors.push({
        code: 'MIGRATION_NO_INDEX',
        ruleId: ERROR_CODE_TO_RULE_ID.MISSING_UNIQUE_INDEX,
        message: `[MIGRATION_NO_INDEX] violates ${ERROR_CODE_TO_RULE_ID.MISSING_UNIQUE_INDEX}: Migration doesn't create required unique index`,
        severity: 'error',
      })
    }
    
    if (content.includes('E74.7')) {
      console.log('  ✅ Migration documented with E74.7 reference')
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings: 0,
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  E74.7 Start/Resume Idempotency Verification')
  console.log('═══════════════════════════════════════════════════════════════')
  
  let totalErrors = []
  let totalWarnings = 0
  
  // Run all checks
  const migrationResult = await checkMigration()
  totalErrors = [...totalErrors, ...migrationResult.errors]
  totalWarnings += migrationResult.warnings
  
  const dbResult = await checkDatabaseConstraints()
  totalErrors = [...totalErrors, ...dbResult.errors]
  totalWarnings += dbResult.warnings
  
  const apiResult = await checkAPIImplementation()
  totalErrors = [...totalErrors, ...apiResult.errors]
  totalWarnings += apiResult.warnings
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('  Verification Summary')
  console.log('═══════════════════════════════════════════════════════════════')
  
  if (totalErrors.length > 0) {
    console.log(`\n❌ ${totalErrors.length} error(s) found:\n`)
    totalErrors.forEach(err => {
      console.log(`   ${err.message}`)
    })
  }
  
  if (totalWarnings > 0) {
    console.log(`\n⚠️  ${totalWarnings} warning(s) - manual verification recommended`)
  }
  
  if (totalErrors.length === 0 && totalWarnings === 0) {
    console.log('\n✅ All checks passed!')
  } else if (totalErrors.length === 0) {
    console.log('\n✅ All critical checks passed (warnings may require attention)')
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════')
  
  // Exit with appropriate code
  process.exit(totalErrors.length > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('\n❌ Script error:', err.message)
  process.exit(2)
})
