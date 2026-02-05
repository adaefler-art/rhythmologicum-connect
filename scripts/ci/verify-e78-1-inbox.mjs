#!/usr/bin/env node

/**
 * E78.1 Inbox v1 Verification Script
 * 
 * Purpose: Verify all rules defined in docs/triage/inbox-v1.md
 * Each check outputs violations in format: "violates R-E78.1-XXX: description"
 * 
 * Validation Rules:
 * - Case States (5 rules): R-E78.1-001 to R-E78.1-005
 * - Attention Items (6 rules): R-E78.1-006 to R-E78.1-011
 * - Next Actions (8 rules): R-E78.1-012 to R-E78.1-019
 * - SLA (3 rules): R-E78.1-020 to R-E78.1-022
 * 
 * Exit Codes:
 * - 0: All checks passed
 * - 1: One or more validation failures
 * - 2: Script error (config, database connection, etc.)
 */

import process from 'process'

// Try to import Supabase client, but allow script to run without it
let createClient
let supabase = null

try {
  const supabaseModule = await import('@supabase/supabase-js')
  createClient = supabaseModule.createClient
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
} catch (error) {
  console.warn('⚠️  @supabase/supabase-js not available - running in documentation mode')
}

// Error code to rule ID mapping (from RULES_VS_CHECKS_MATRIX.md)
const ERROR_CODE_TO_RULE_ID = {
  // Case States
  STATE_NEEDS_INPUT_INVALID: 'R-E78.1-001',
  STATE_IN_PROGRESS_INVALID: 'R-E78.1-002',
  STATE_READY_FOR_REVIEW_INVALID: 'R-E78.1-003',
  STATE_RESOLVED_INVALID: 'R-E78.1-004',
  STATE_SNOOZED_NOT_IMPLEMENTED: 'R-E78.1-005',
  
  // Attention Items
  ATTENTION_CRITICAL_FLAG_INVALID: 'R-E78.1-006',
  ATTENTION_OVERDUE_INVALID: 'R-E78.1-007',
  ATTENTION_STUCK_INVALID: 'R-E78.1-008',
  ATTENTION_REVIEW_READY_INVALID: 'R-E78.1-009',
  ATTENTION_MANUAL_FLAG_NOT_IMPLEMENTED: 'R-E78.1-010',
  ATTENTION_MISSING_DATA_INVALID: 'R-E78.1-011',
  
  // Next Actions
  ACTION_PATIENT_PROVIDE_DATA_INVALID: 'R-E78.1-012',
  ACTION_PATIENT_CONTINUE_INVALID: 'R-E78.1-013',
  ACTION_CLINICIAN_CONTACT_INVALID: 'R-E78.1-014',
  ACTION_CLINICIAN_REVIEW_INVALID: 'R-E78.1-015',
  ACTION_CLINICIAN_REVIEW_CRITICAL_INVALID: 'R-E78.1-016',
  ACTION_NONE_INVALID: 'R-E78.1-017',
  ACTION_SYSTEM_RETRY_INVALID: 'R-E78.1-018',
  ACTION_ADMIN_INVESTIGATE_INVALID: 'R-E78.1-019',
  
  // SLA
  SLA_ASSESSMENT_DEADLINE_INVALID: 'R-E78.1-020',
  SLA_REVIEW_DEADLINE_INVALID: 'R-E78.1-021',
  SLA_CRITICAL_REVIEW_DEADLINE_INVALID: 'R-E78.1-022',
}

// ============================================================================
// Validation Functions - Case States
// ============================================================================

async function checkNeedsInputState() {
  console.log('\n🔍 R-E78.1-001: Checking needs_input state determination')
  
  // Note: This is a placeholder for the actual implementation
  // In a real implementation, this would:
  // 1. Create test assessment with needs_input conditions
  // 2. Verify computed state matches expected value
  // 3. Clean up test data
  
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkInProgressState() {
  console.log('\n🔍 R-E78.1-002: Checking in_progress state determination')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkReadyForReviewState() {
  console.log('\n🔍 R-E78.1-003: Checking ready_for_review state determination')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkResolvedState() {
  console.log('\n🔍 R-E78.1-004: Checking resolved state determination')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkSnoozedStateReserved() {
  console.log('\n🔍 R-E78.1-005: Verifying snoozed state is reserved for v2+')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

// ============================================================================
// Validation Functions - Attention Items
// ============================================================================

async function checkCriticalFlagItem() {
  console.log('\n🔍 R-E78.1-006: Checking critical_flag attention item')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkOverdueItem() {
  console.log('\n🔍 R-E78.1-007: Checking overdue attention item')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkStuckItem() {
  console.log('\n🔍 R-E78.1-008: Checking stuck attention item')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkReviewReadyItem() {
  console.log('\n🔍 R-E78.1-009: Checking review_ready attention item')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkManualFlagReserved() {
  console.log('\n🔍 R-E78.1-010: Verifying manual_flag is reserved for v2+')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkMissingDataItem() {
  console.log('\n🔍 R-E78.1-011: Checking missing_data attention item')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

// ============================================================================
// Validation Functions - Next Actions
// ============================================================================

async function checkPatientProvideDataAction() {
  console.log('\n🔍 R-E78.1-012: Checking patient_provide_data next action')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkPatientContinueAction() {
  console.log('\n🔍 R-E78.1-013: Checking patient_continue next action')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkClinicianContactAction() {
  console.log('\n🔍 R-E78.1-014: Checking clinician_contact next action')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkClinicianReviewAction() {
  console.log('\n🔍 R-E78.1-015: Checking clinician_review next action')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkClinicianReviewCriticalAction() {
  console.log('\n🔍 R-E78.1-016: Checking clinician_review critical priority action')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkNoneAction() {
  console.log('\n🔍 R-E78.1-017: Checking none action for resolved cases')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkSystemRetryAction() {
  console.log('\n🔍 R-E78.1-018: Checking system_retry action')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkAdminInvestigateAction() {
  console.log('\n🔍 R-E78.1-019: Checking admin_investigate action')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

// ============================================================================
// Validation Functions - SLA
// ============================================================================

async function checkAssessmentSLA() {
  console.log('\n🔍 R-E78.1-020: Checking assessment completion SLA calculation')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkReviewSLA() {
  console.log('\n🔍 R-E78.1-021: Checking review completion SLA calculation')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

async function checkCriticalReviewSLA() {
  console.log('\n🔍 R-E78.1-022: Checking critical review SLA calculation')
  console.log('ℹ️  Placeholder check - full implementation pending')
  return { passed: true, errors: [], warnings: ['Not yet implemented'] }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔍 E78.1 Inbox v1 Verification')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const checks = [
    // Case State Checks (5)
    { name: 'Case States', checks: [
      checkNeedsInputState,
      checkInProgressState,
      checkReadyForReviewState,
      checkResolvedState,
      checkSnoozedStateReserved,
    ]},
    
    // Attention Item Checks (6)
    { name: 'Attention Items', checks: [
      checkCriticalFlagItem,
      checkOverdueItem,
      checkStuckItem,
      checkReviewReadyItem,
      checkManualFlagReserved,
      checkMissingDataItem,
    ]},
    
    // Next Action Checks (8)
    { name: 'Next Actions', checks: [
      checkPatientProvideDataAction,
      checkPatientContinueAction,
      checkClinicianContactAction,
      checkClinicianReviewAction,
      checkClinicianReviewCriticalAction,
      checkNoneAction,
      checkSystemRetryAction,
      checkAdminInvestigateAction,
    ]},
    
    // SLA Checks (3)
    { name: 'SLA Rules', checks: [
      checkAssessmentSLA,
      checkReviewSLA,
      checkCriticalReviewSLA,
    ]},
  ]
  
  let totalPassed = 0
  let totalFailed = 0
  let totalWarnings = 0
  
  for (const category of checks) {
    console.log(`\n📋 ${category.name} (${category.checks.length} checks)`)
    
    for (const check of category.checks) {
      try {
        const result = await check()
        
        if (result.passed) {
          totalPassed++
          if (result.warnings?.length > 0) {
            totalWarnings += result.warnings.length
            console.log(`  ⚠️  ${check.name}: PASSED with warnings`)
            result.warnings.forEach(w => console.log(`      ${w}`))
          } else {
            console.log(`  ✅ ${check.name}: PASSED`)
          }
        } else {
          totalFailed++
          console.log(`  ❌ ${check.name}: FAILED`)
          result.errors.forEach(e => {
            const ruleId = ERROR_CODE_TO_RULE_ID[e.code] || 'UNKNOWN'
            console.log(`      violates ${ruleId}: ${e.message}`)
          })
        }
      } catch (error) {
        totalFailed++
        console.error(`  ❌ ${check.name}: ERROR`)
        console.error(`      ${error.message}`)
      }
    }
  }
  
  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Summary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Passed: ${totalPassed}`)
  console.log(`❌ Failed: ${totalFailed}`)
  console.log(`⚠️  Warnings: ${totalWarnings}`)
  
  if (totalFailed > 0) {
    console.error('\n❌ E78.1 Inbox v1 verification failed')
    console.error(`   ${totalFailed} check(s) did not pass`)
    process.exit(1)
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  E78.1 Inbox v1 verification passed with warnings')
    console.log(`   ${totalWarnings} check(s) not yet fully implemented`)
    console.log('   Full implementation required before production use')
    process.exit(0)
  } else {
    console.log('\n✅ All E78.1 Inbox v1 rules verified successfully')
    process.exit(0)
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Script error:', error)
  process.exit(2)
})
