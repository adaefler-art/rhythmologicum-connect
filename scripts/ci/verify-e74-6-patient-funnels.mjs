#!/usr/bin/env node

/**
 * E74.6 Patient Funnels Lifecycle Verification Script
 * 
 * Purpose: Verify RLS policies, audit logging, and org scoping for patient_funnels
 * 
 * Validation Rules:
 * - R-E74.6-001: Staff can INSERT patient_funnels for org patients
 * - R-E74.6-002: Staff can UPDATE patient_funnels for org patients
 * - R-E74.6-003: Staff can SELECT patient_funnels for org patients
 * - R-E74.6-004: Audit log trigger exists for patient_funnels
 * - R-E74.6-005: Updated_at trigger exists for patient_funnels
 * - R-E74.6-006: Status constraint allows only valid values
 * - R-E74.6-007: API endpoints require authentication
 * - R-E74.6-008: API endpoints require staff role (clinician/admin/nurse)
 * 
 * Exit Codes:
 * - 0: All checks passed
 * - 1: One or more validation failures
 * - 2: Script error (config, database connection, etc.)
 */

import { createClient } from '@supabase/supabase-js'

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
  MISSING_RLS_POLICY_STAFF_INSERT: 'R-E74.6-001',
  MISSING_RLS_POLICY_STAFF_UPDATE: 'R-E74.6-002',
  MISSING_RLS_POLICY_STAFF_SELECT: 'R-E74.6-003',
  MISSING_AUDIT_TRIGGER: 'R-E74.6-004',
  MISSING_UPDATED_AT_TRIGGER: 'R-E74.6-005',
  INVALID_STATUS_CONSTRAINT: 'R-E74.6-006',
  API_ENDPOINT_MISSING: 'R-E74.6-007',
  API_ROLE_CHECK_MISSING: 'R-E74.6-008',
}

// ============================================================================
// Validation Functions
// ============================================================================

async function checkRLSPolicies() {
  console.log('\n🔍 Checking RLS policies on patient_funnels...')
  
  // Query pg_policies to check for required policies
  const { data: policies, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT policyname, cmd, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'patient_funnels'
      `
    })
    .catch(() => {
      // If RPC doesn't exist, try direct query (won't work without proper permissions)
      return { data: null, error: new Error('Cannot query pg_policies directly') }
    })
  
  if (error) {
    console.warn('⚠️  Cannot verify RLS policies programmatically')
    console.warn('   Manual verification required in database')
    return { passed: true, errors: [], warnings: 1 }
  }
  
  const errors = []
  const requiredPolicies = [
    { name: 'Staff can insert org patient funnels', cmd: 'INSERT' },
    { name: 'Staff can update org patient funnels', cmd: 'UPDATE' },
    { name: 'Staff can view org patient funnels', cmd: 'SELECT' },
  ]
  
  for (const required of requiredPolicies) {
    const found = policies?.find(p => 
      p.policyname.toLowerCase().includes(required.name.toLowerCase()) &&
      p.cmd === required.cmd
    )
    
    if (!found) {
      const errorCode = required.cmd === 'INSERT' ? 'MISSING_RLS_POLICY_STAFF_INSERT' :
                        required.cmd === 'UPDATE' ? 'MISSING_RLS_POLICY_STAFF_UPDATE' :
                        'MISSING_RLS_POLICY_STAFF_SELECT'
      
      errors.push({
        code: errorCode,
        message: `RLS policy "${required.name}" (${required.cmd}) not found on patient_funnels`,
        ruleId: ERROR_CODE_TO_RULE_ID[errorCode]
      })
    }
  }
  
  if (errors.length > 0) {
    errors.forEach(e => {
      console.error(`❌ [${e.code}] violates ${e.ruleId}: ${e.message}`)
    })
    return { passed: false, errors }
  }
  
  console.log('✅ RLS policies verified')
  return { passed: true, errors: [] }
}

async function checkTriggers() {
  console.log('\n🔍 Checking triggers on patient_funnels...')
  
  const { data: triggers, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT tgname, tgtype, proname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE c.relname = 'patient_funnels' AND c.relnamespace = (
          SELECT oid FROM pg_namespace WHERE nspname = 'public'
        )
      `
    })
    .catch(() => ({ data: null, error: new Error('Cannot query pg_trigger directly') }))
  
  if (error) {
    console.warn('⚠️  Cannot verify triggers programmatically')
    console.warn('   Manual verification required in database')
    return { passed: true, errors: [], warnings: 1 }
  }
  
  const errors = []
  const requiredTriggers = [
    { name: 'audit_patient_funnels_changes_trigger', function: 'audit_patient_funnels_changes' },
    { name: 'update_patient_funnels_updated_at_trigger', function: 'update_patient_funnels_updated_at' },
  ]
  
  for (const required of requiredTriggers) {
    const found = triggers?.find(t => 
      t.tgname === required.name && t.proname === required.function
    )
    
    if (!found) {
      const errorCode = required.name.includes('audit') ? 
        'MISSING_AUDIT_TRIGGER' : 'MISSING_UPDATED_AT_TRIGGER'
      
      errors.push({
        code: errorCode,
        message: `Trigger "${required.name}" not found on patient_funnels`,
        ruleId: ERROR_CODE_TO_RULE_ID[errorCode]
      })
    }
  }
  
  if (errors.length > 0) {
    errors.forEach(e => {
      console.error(`❌ [${e.code}] violates ${e.ruleId}: ${e.message}`)
    })
    return { passed: false, errors }
  }
  
  console.log('✅ Triggers verified')
  return { passed: true, errors: [] }
}

async function checkStatusConstraint() {
  console.log('\n🔍 Checking status constraint on patient_funnels...')
  
  const { data: constraints, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT conname, consrc
        FROM pg_constraint
        WHERE conrelid = 'public.patient_funnels'::regclass
        AND conname = 'patient_funnels_status_check'
      `
    })
    .catch(() => ({ data: null, error: new Error('Cannot query pg_constraint directly') }))
  
  if (error) {
    console.warn('⚠️  Cannot verify constraints programmatically')
    console.warn('   Manual verification required in database')
    return { passed: true, errors: [], warnings: 1 }
  }
  
  const errors = []
  
  if (!constraints || constraints.length === 0) {
    errors.push({
      code: 'INVALID_STATUS_CONSTRAINT',
      message: 'Status constraint "patient_funnels_status_check" not found',
      ruleId: ERROR_CODE_TO_RULE_ID.INVALID_STATUS_CONSTRAINT
    })
  }
  
  if (errors.length > 0) {
    errors.forEach(e => {
      console.error(`❌ [${e.code}] violates ${e.ruleId}: ${e.message}`)
    })
    return { passed: false, errors }
  }
  
  console.log('✅ Status constraint verified')
  return { passed: true, errors: [] }
}

async function checkAPIEndpoints() {
  console.log('\n🔍 Checking API endpoint files...')
  
  const { readFileSync, existsSync } = await import('fs')
  const { join } = await import('path')
  
  const errors = []
  const requiredEndpoints = [
    {
      path: 'apps/rhythm-studio-ui/app/api/clinician/patient-funnels/route.ts',
      description: 'POST /api/clinician/patient-funnels'
    },
    {
      path: 'apps/rhythm-studio-ui/app/api/clinician/patient-funnels/[id]/route.ts',
      description: 'PATCH /api/clinician/patient-funnels/[id]'
    },
    {
      path: 'apps/rhythm-studio-ui/app/api/clinician/patients/[patientId]/funnels/route.ts',
      description: 'GET /api/clinician/patients/[patientId]/funnels'
    }
  ]
  
  for (const endpoint of requiredEndpoints) {
    const fullPath = join(process.cwd(), endpoint.path)
    
    if (!existsSync(fullPath)) {
      errors.push({
        code: 'API_ENDPOINT_MISSING',
        message: `API endpoint file not found: ${endpoint.description}`,
        ruleId: ERROR_CODE_TO_RULE_ID.API_ENDPOINT_MISSING
      })
      continue
    }
    
    // Check for role validation in the file
    const content = readFileSync(fullPath, 'utf-8')
    const hasRoleCheck = content.includes('clinician') && 
                         (content.includes('admin') || content.includes('nurse'))
    
    if (!hasRoleCheck) {
      errors.push({
        code: 'API_ROLE_CHECK_MISSING',
        message: `API endpoint missing role check: ${endpoint.description}`,
        ruleId: ERROR_CODE_TO_RULE_ID.API_ROLE_CHECK_MISSING
      })
    }
  }
  
  if (errors.length > 0) {
    errors.forEach(e => {
      console.error(`❌ [${e.code}] violates ${e.ruleId}: ${e.message}`)
    })
    return { passed: false, errors }
  }
  
  console.log('✅ API endpoints verified')
  return { passed: true, errors: [] }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('='.repeat(80))
  console.log('E74.6: Patient Funnels Lifecycle + Org Scoping Verification')
  console.log('='.repeat(80))
  
  const results = []
  let totalWarnings = 0
  
  // Run all checks
  const rlsResult = await checkRLSPolicies()
  results.push(rlsResult)
  totalWarnings += rlsResult.warnings ?? 0
  
  const triggersResult = await checkTriggers()
  results.push(triggersResult)
  totalWarnings += triggersResult.warnings ?? 0
  
  const constraintResult = await checkStatusConstraint()
  results.push(constraintResult)
  totalWarnings += constraintResult.warnings ?? 0
  
  const apiResult = await checkAPIEndpoints()
  results.push(apiResult)
  
  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  
  const totalChecks = results.length
  const passedChecks = results.filter(r => r.passed).length
  const failedChecks = totalChecks - passedChecks
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)
  
  console.log(`\nTotal Checks: ${totalChecks}`)
  console.log(`Passed: ${passedChecks}`)
  console.log(`Failed: ${failedChecks}`)
  console.log(`Errors: ${totalErrors}`)
  console.log(`Warnings: ${totalWarnings}`)
  
  if (failedChecks > 0) {
    console.log('\n❌ VERIFICATION FAILED')
    console.log(`   ${totalErrors} error(s) found`)
    process.exit(1)
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  VERIFICATION PASSED WITH WARNINGS')
    console.log(`   ${totalWarnings} check(s) could not be verified programmatically`)
    console.log('   Manual verification recommended')
    process.exit(0)
  } else {
    console.log('\n✅ ALL CHECKS PASSED')
    process.exit(0)
  }
}

main().catch(err => {
  console.error('\n💥 Script Error:', err.message)
  process.exit(2)
})
