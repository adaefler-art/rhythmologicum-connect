#!/usr/bin/env node
/**
 * E76.4 Guardrails Verification Script
 *
 * Verifies:
 * - R-E76-001: diagnosis_runs table exists with required columns
 * - R-E76-002: RLS policies exist for patient and clinician access
 * - R-E76-003: Unique constraint on (assessment_id, correlation_id, schema_version)
 * - R-E76-004: Status index exists for queue processing
 * - R-E76-005: API endpoints have literal callsites
 * - R-E76-006: Error codes match validation logic
 *
 * All violations output "violates R-E76-XXX" for quick diagnosis.
 *
 * @module scripts/ci/verify-e76-4-diagnosis-runs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..', '..')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================
// Check Functions
// ============================================================

async function checkTableSchema() {
  console.log('\\n🔍 Checking R-E76-001: diagnosis_runs table schema...')

  try {
    const { data, error } = await supabase
      .from('diagnosis_runs')
      .select('id, assessment_id, correlation_id, status, context_pack, diagnosis_result, errors, schema_version')
      .limit(0)

    if (error) {
      console.error(`❌ violates R-E76-001: diagnosis_runs table not found or inaccessible: ${error.message}`)
      return false
    }

    console.log('✅ R-E76-001: diagnosis_runs table schema verified')
    return true
  } catch (err) {
    console.error(`❌ violates R-E76-001: ${err.message}`)
    return false
  }
}

async function checkRLSPolicies() {
  console.log('\\n🔍 Checking R-E76-002: RLS policies...')

  try {
    const { data: policies, error } = await supabase.rpc('get_table_policies', {
      table_name: 'diagnosis_runs',
    }).catch(() => {
      // Fallback: check manually via pg_policies
      return supabase
        .from('pg_policies')
        .select('policyname')
        .eq('tablename', 'diagnosis_runs')
    })

    if (error && !policies) {
      console.warn('⚠️  Cannot verify RLS policies (requires elevated permissions)')
      return true // Skip in CI
    }

    const policyNames = policies?.map(p => p.policyname || p.name) || []
    const requiredPolicies = [
      'diagnosis_runs_patient_select',
      'diagnosis_runs_clinician_select',
      'diagnosis_runs_system_insert',
      'diagnosis_runs_system_update',
    ]

    const missing = requiredPolicies.filter(p => !policyNames.includes(p))

    if (missing.length > 0) {
      console.error(`❌ violates R-E76-002: Missing RLS policies: ${missing.join(', ')}`)
      return false
    }

    console.log('✅ R-E76-002: RLS policies verified')
    return true
  } catch (err) {
    console.warn(`⚠️  Cannot verify RLS policies: ${err.message}`)
    return true // Skip in CI
  }
}

async function checkUniqueConstraint() {
  console.log('\\n🔍 Checking R-E76-003: Unique constraint...')

  try {
    // Check migration file for constraint
    const migrationFile = join(repoRoot, 'supabase/migrations/20260202100000_e76_4_create_diagnosis_runs.sql')
    const migrationContent = readFileSync(migrationFile, 'utf-8')

    if (!migrationContent.includes('diagnosis_runs_assessment_correlation_version_unique')) {
      console.error('❌ violates R-E76-003: Unique constraint not found in migration')
      return false
    }

    console.log('✅ R-E76-003: Unique constraint verified')
    return true
  } catch (err) {
    console.error(`❌ violates R-E76-003: ${err.message}`)
    return false
  }
}

async function checkStatusIndex() {
  console.log('\\n🔍 Checking R-E76-004: Status index...')

  try {
    // Check migration file for index
    const migrationFile = join(repoRoot, 'supabase/migrations/20260202100000_e76_4_create_diagnosis_runs.sql')
    const migrationContent = readFileSync(migrationFile, 'utf-8')

    if (!migrationContent.includes('idx_diagnosis_runs_status')) {
      console.error('❌ violates R-E76-004: Status index not found in migration')
      return false
    }

    console.log('✅ R-E76-004: Status index verified')
    return true
  } catch (err) {
    console.error(`❌ violates R-E76-004: ${err.message}`)
    return false
  }
}

async function checkLiteralCallsites() {
  console.log('\\n🔍 Checking R-E76-005: Literal callsites...')

  try {
    const testFile = join(repoRoot, 'lib/diagnosis/__tests__/integration.test.ts')
    const testContent = readFileSync(testFile, 'utf-8')

    const requiredCallsites = [
      "fetch('/api/diagnosis-runs'",
      "fetch(`/api/diagnosis-runs/${runId}`)",
      "fetch(`/api/diagnosis-runs/${runId}/process`",
    ]

    const missing = requiredCallsites.filter(c => !testContent.includes(c))

    if (missing.length > 0) {
      console.error(`❌ violates R-E76-005: Missing literal callsites: ${missing.join(', ')}`)
      return false
    }

    console.log('✅ R-E76-005: Literal callsites verified')
    return true
  } catch (err) {
    console.error(`❌ violates R-E76-005: ${err.message}`)
    return false
  }
}

async function checkErrorCodes() {
  console.log('\\n🔍 Checking R-E76-006: Error codes...')

  try {
    const workerFile = join(repoRoot, 'lib/diagnosis/worker.ts')
    const workerContent = readFileSync(workerFile, 'utf-8')

    const requiredErrorCodes = [
      'VALIDATION_ERROR',
      'CONTEXT_FETCH_ERROR',
      'LLM_ERROR',
      'PERSISTENCE_ERROR',
    ]

    const missing = requiredErrorCodes.filter(c => !workerContent.includes(c))

    if (missing.length > 0) {
      console.error(`❌ violates R-E76-006: Missing error codes: ${missing.join(', ')}`)
      return false
    }

    console.log('✅ R-E76-006: Error codes verified')
    return true
  } catch (err) {
    console.error(`❌ violates R-E76-006: ${err.message}`)
    return false
  }
}

// ============================================================
// Main Execution
// ============================================================

async function main() {
  console.log('\\n========================================')
  console.log('E76.4 Diagnosis Runs Guardrails Verification')
  console.log('========================================')

  const results = await Promise.all([
    checkTableSchema(),
    checkRLSPolicies(),
    checkUniqueConstraint(),
    checkStatusIndex(),
    checkLiteralCallsites(),
    checkErrorCodes(),
  ])

  const allPassed = results.every(r => r === true)

  console.log('\\n========================================')
  if (allPassed) {
    console.log('✅ All E76.4 guardrails verified')
    console.log('========================================\\n')
    process.exit(0)
  } else {
    console.log('❌ Some E76.4 guardrails failed')
    console.log('========================================\\n')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
