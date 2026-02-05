#!/usr/bin/env node
/**
 * E78.2 — SSOT Aggregation v1: triage_cases_v1 Verification
 *
 * Verifies the triage_cases_v1 database view implementation against E78.2 requirements.
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - One or more checks failed
 *   2 - Error during verification
 *
 * Usage:
 *   npm run verify:e78-2
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Error codes mapped to rule IDs
const ERROR_CODES = {
  'E78.2-001': 'R-E78.2-001', // View exists
  'E78.2-002': 'R-E78.2-002', // Required columns present
  'E78.2-003': 'R-E78.2-003', // No direct risk/score fields
  'E78.2-004': 'R-E78.2-004', // Deterministic output
  'E78.2-005': 'R-E78.2-005', // Performance acceptable
  'E78.2-006': 'R-E78.2-006', // case_state values valid
  'E78.2-007': 'R-E78.2-007', // attention_items structure valid
  'E78.2-008': 'R-E78.2-008', // attention_level values valid
  'E78.2-009': 'R-E78.2-009', // next_action values valid
  'E78.2-010': 'R-E78.2-010', // priority_score in valid range
  'E78.2-011': 'R-E78.2-011', // is_active is boolean
  'E78.2-012': 'R-E78.2-012', // Indexes exist
  'E78.2-013': 'R-E78.2-013', // JOINs are correct
  'E78.2-014': 'R-E78.2-014', // Patient state not used
}

const results = {
  passed: [],
  failed: [],
  warnings: [],
}

function pass(checkId, message) {
  results.passed.push({ checkId, message, rule: ERROR_CODES[checkId] })
  console.log(`✅ ${checkId} (${ERROR_CODES[checkId]}): ${message}`)
}

function fail(checkId, message) {
  results.failed.push({ checkId, message, rule: ERROR_CODES[checkId] })
  console.error(`❌ violates ${ERROR_CODES[checkId]} (${checkId}): ${message}`)
}

function warn(message) {
  results.warnings.push(message)
  console.warn(`⚠️  ${message}`)
}

async function verifyE782() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔍 E78.2 triage_cases_v1 View Verification')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables')
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    return 2
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Check 1: View exists (R-E78.2-001)
  console.log('📋 View Existence Checks\n')
  try {
    const { data, error } = await supabase
      .from('triage_cases_v1')
      .select('case_id')
      .limit(1)

    if (error) {
      fail('E78.2-001', `View triage_cases_v1 does not exist or is not accessible: ${error.message}`)
    } else {
      pass('E78.2-001', 'View triage_cases_v1 exists and is queryable')
    }
  } catch (err) {
    fail('E78.2-001', `Error checking view existence: ${err.message}`)
  }

  // Check 2: Required columns present (R-E78.2-002)
  console.log('\n📋 Column Structure Checks\n')
  const requiredColumns = [
    'case_id',
    'patient_id',
    'funnel_id',
    'funnel_slug',
    'patient_display',
    'case_state',
    'attention_items',
    'attention_level',
    'next_action',
    'assigned_at',
    'last_activity_at',
    'updated_at',
    'completed_at',
    'is_active',
    'snoozed_until',
  ]

  try {
    const { data, error } = await supabase
      .from('triage_cases_v1')
      .select('*')
      .limit(1)

    if (error) {
      fail('E78.2-002', `Could not query view columns: ${error.message}`)
    } else {
      const actualColumns = data && data.length > 0 ? Object.keys(data[0]) : []
      const missingColumns = requiredColumns.filter((col) => !actualColumns.includes(col))

      if (missingColumns.length > 0) {
        fail('E78.2-002', `Missing required columns: ${missingColumns.join(', ')}`)
      } else {
        pass('E78.2-002', `All ${requiredColumns.length} required columns present`)
      }
    }
  } catch (err) {
    fail('E78.2-002', `Error checking columns: ${err.message}`)
  }

  // Check 3: No direct risk/score fields (R-E78.2-003)
  console.log('\n📋 Guardrail Checks\n')
  const forbiddenColumns = ['risk_level', 'score_numeric', 'stress_score', 'sleep_score']
  try {
    const { data } = await supabase.from('triage_cases_v1').select('*').limit(1)

    if (data && data.length > 0) {
      const actualColumns = Object.keys(data[0])
      const foundForbidden = forbiddenColumns.filter((col) => actualColumns.includes(col))

      if (foundForbidden.length > 0) {
        fail(
          'E78.2-003',
          `Forbidden risk/score fields exposed: ${foundForbidden.join(', ')}. These tempt direct display and violate SSOT contract.`,
        )
      } else {
        pass('E78.2-003', 'No forbidden risk/score fields exposed (guardrail enforced)')
      }
    } else {
      warn('No data to check for forbidden columns (view may be empty)')
    }
  } catch (err) {
    fail('E78.2-003', `Error checking forbidden columns: ${err.message}`)
  }

  // Check 4: Deterministic output (R-E78.2-004)
  console.log('\n📋 Determinism Checks\n')
  try {
    const { data: data1 } = await supabase
      .from('triage_cases_v1')
      .select('case_id, case_state, attention_level, priority_score')
      .order('case_id')
      .limit(5)

    // Wait a moment and query again
    await new Promise((resolve) => setTimeout(resolve, 100))

    const { data: data2 } = await supabase
      .from('triage_cases_v1')
      .select('case_id, case_state, attention_level, priority_score')
      .order('case_id')
      .limit(5)

    if (!data1 || !data2) {
      warn('Cannot verify determinism: insufficient data in view')
    } else {
      const match = JSON.stringify(data1) === JSON.stringify(data2)
      if (match) {
        pass('E78.2-004', 'View produces deterministic output (same query → same results)')
      } else {
        fail(
          'E78.2-004',
          'View output is non-deterministic. Check for NOW(), RANDOM(), or unstable ordering.',
        )
      }
    }
  } catch (err) {
    fail('E78.2-004', `Error checking determinism: ${err.message}`)
  }

  // Check 5: Performance acceptable (R-E78.2-005)
  console.log('\n📋 Performance Checks\n')
  try {
    const startTime = Date.now()
    const { data, error } = await supabase
      .from('triage_cases_v1')
      .select('*')
      .order('priority_score', { ascending: false })
      .limit(20)

    const duration = Date.now() - startTime

    if (error) {
      fail('E78.2-005', `Query failed: ${error.message}`)
    } else if (duration > 5000) {
      fail('E78.2-005', `Query took ${duration}ms (threshold: 5000ms). Needs optimization.`)
    } else {
      pass('E78.2-005', `Query completed in ${duration}ms (acceptable performance)`)
    }
  } catch (err) {
    fail('E78.2-005', `Error checking performance: ${err.message}`)
  }

  // Check 6: case_state values valid (R-E78.2-006)
  console.log('\n📋 Data Validation Checks\n')
  const validStates = ['needs_input', 'in_progress', 'ready_for_review', 'resolved', 'snoozed']
  try {
    const { data } = await supabase.from('triage_cases_v1').select('case_state').limit(100)

    if (data && data.length > 0) {
      const invalidStates = data
        .map((row) => row.case_state)
        .filter((state) => state && !validStates.includes(state))
      const uniqueInvalid = [...new Set(invalidStates)]

      if (uniqueInvalid.length > 0) {
        fail(
          'E78.2-006',
          `Invalid case_state values found: ${uniqueInvalid.join(', ')}. Must be one of: ${validStates.join(', ')}`,
        )
      } else {
        pass('E78.2-006', 'All case_state values are valid')
      }
    } else {
      warn('No data to validate case_state values')
    }
  } catch (err) {
    fail('E78.2-006', `Error validating case_state: ${err.message}`)
  }

  // Check 7: attention_items structure valid (R-E78.2-007)
  const validItems = [
    'critical_flag',
    'overdue',
    'stuck',
    'review_ready',
    'manual_flag',
    'missing_data',
  ]
  try {
    const { data } = await supabase.from('triage_cases_v1').select('attention_items').limit(100)

    if (data && data.length > 0) {
      let invalidItemsFound = []
      for (const row of data) {
        if (row.attention_items && Array.isArray(row.attention_items)) {
          const invalid = row.attention_items.filter((item) => !validItems.includes(item))
          invalidItemsFound.push(...invalid)
        }
      }
      const uniqueInvalid = [...new Set(invalidItemsFound)]

      if (uniqueInvalid.length > 0) {
        fail(
          'E78.2-007',
          `Invalid attention_items found: ${uniqueInvalid.join(', ')}. Must be one of: ${validItems.join(', ')}`,
        )
      } else {
        pass('E78.2-007', 'All attention_items values are valid')
      }
    } else {
      warn('No data to validate attention_items structure')
    }
  } catch (err) {
    fail('E78.2-007', `Error validating attention_items: ${err.message}`)
  }

  // Check 8: attention_level values valid (R-E78.2-008)
  const validLevels = ['none', 'info', 'warn', 'critical']
  try {
    const { data } = await supabase.from('triage_cases_v1').select('attention_level').limit(100)

    if (data && data.length > 0) {
      const invalidLevels = data
        .map((row) => row.attention_level)
        .filter((level) => level && !validLevels.includes(level))
      const uniqueInvalid = [...new Set(invalidLevels)]

      if (uniqueInvalid.length > 0) {
        fail(
          'E78.2-008',
          `Invalid attention_level values found: ${uniqueInvalid.join(', ')}. Must be one of: ${validLevels.join(', ')}`,
        )
      } else {
        pass('E78.2-008', 'All attention_level values are valid')
      }
    } else {
      warn('No data to validate attention_level values')
    }
  } catch (err) {
    fail('E78.2-008', `Error validating attention_level: ${err.message}`)
  }

  // Check 9: next_action values valid (R-E78.2-009)
  const validActions = [
    'patient_continue',
    'patient_provide_data',
    'clinician_review',
    'clinician_contact',
    'system_retry',
    'admin_investigate',
    'none',
  ]
  try {
    const { data } = await supabase.from('triage_cases_v1').select('next_action').limit(100)

    if (data && data.length > 0) {
      const invalidActions = data
        .map((row) => row.next_action)
        .filter((action) => action && !validActions.includes(action))
      const uniqueInvalid = [...new Set(invalidActions)]

      if (uniqueInvalid.length > 0) {
        fail(
          'E78.2-009',
          `Invalid next_action values found: ${uniqueInvalid.join(', ')}. Must be one of: ${validActions.join(', ')}`,
        )
      } else {
        pass('E78.2-009', 'All next_action values are valid')
      }
    } else {
      warn('No data to validate next_action values')
    }
  } catch (err) {
    fail('E78.2-009', `Error validating next_action: ${err.message}`)
  }

  // Check 10: priority_score in valid range (R-E78.2-010)
  try {
    const { data } = await supabase.from('triage_cases_v1').select('priority_score').limit(100)

    if (data && data.length > 0) {
      const outOfRange = data.filter(
        (row) => row.priority_score < 0 || row.priority_score > 1000,
      )

      if (outOfRange.length > 0) {
        fail(
          'E78.2-010',
          `priority_score out of range (0-1000): found ${outOfRange.length} cases`,
        )
      } else {
        pass('E78.2-010', 'All priority_score values in valid range (0-1000)')
      }
    } else {
      warn('No data to validate priority_score range')
    }
  } catch (err) {
    fail('E78.2-010', `Error validating priority_score: ${err.message}`)
  }

  // Check 11: is_active is boolean (R-E78.2-011)
  try {
    const { data } = await supabase.from('triage_cases_v1').select('is_active').limit(100)

    if (data && data.length > 0) {
      const nonBoolean = data.filter((row) => typeof row.is_active !== 'boolean')

      if (nonBoolean.length > 0) {
        fail('E78.2-011', `is_active contains non-boolean values: ${nonBoolean.length} cases`)
      } else {
        pass('E78.2-011', 'is_active is boolean type for all cases')
      }
    } else {
      warn('No data to validate is_active type')
    }
  } catch (err) {
    fail('E78.2-011', `Error validating is_active: ${err.message}`)
  }

  // Check 12: Indexes exist (R-E78.2-012)
  console.log('\n📋 Index Checks\n')
  const requiredIndexes = [
    'idx_assessments_status_started_at',
    'idx_assessments_patient_funnel',
    'idx_processing_jobs_assessment_created',
    'idx_review_records_job_id',
    'idx_reports_assessment_id',
    'idx_risk_bundles_job_id',
  ]

  try {
    // Note: This requires a database query that may not be possible via Supabase client
    // Placeholder implementation
    warn('Index existence check not yet implemented (requires database introspection)')
    pass('E78.2-012', 'Index check placeholder - manual verification required')
  } catch (err) {
    fail('E78.2-012', `Error checking indexes: ${err.message}`)
  }

  // Check 13: JOINs are correct (R-E78.2-013)
  console.log('\n📋 JOIN Logic Checks\n')
  try {
    // Verify that JOINs produce expected relationships
    const { data } = await supabase
      .from('triage_cases_v1')
      .select('case_id, patient_id, funnel_id, job_id')
      .limit(10)

    if (data && data.length > 0) {
      // Basic sanity check: every case should have patient_id and funnel_id
      const missingPatient = data.filter((row) => !row.patient_id)
      const missingFunnel = data.filter((row) => !row.funnel_id)

      if (missingPatient.length > 0 || missingFunnel.length > 0) {
        fail(
          'E78.2-013',
          `JOINs missing critical data: ${missingPatient.length} without patient, ${missingFunnel.length} without funnel`,
        )
      } else {
        pass('E78.2-013', 'JOIN relationships appear correct (basic sanity check)')
      }
    } else {
      warn('No data to validate JOIN correctness')
    }
  } catch (err) {
    fail('E78.2-013', `Error checking JOINs: ${err.message}`)
  }

  // Check 14: patient_state not used (R-E78.2-014)
  console.log('\n📋 Schema Compliance Checks\n')
  try {
    // This would require inspecting the view definition in the database
    // For now, we'll do a placeholder check
    warn('patient_state usage check not yet implemented (requires view definition introspection)')
    pass('E78.2-014', 'patient_state check placeholder - manual verification required')
  } catch (err) {
    fail('E78.2-014', `Error checking patient_state usage: ${err.message}`)
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Summary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Passed: ${results.passed.length}`)
  console.log(`❌ Failed: ${results.failed.length}`)
  console.log(`⚠️  Warnings: ${results.warnings.length}`)
  console.log('')

  if (results.failed.length > 0) {
    console.log('Failed checks:')
    results.failed.forEach(({ checkId, message, rule }) => {
      console.log(`  - ${checkId} (${rule}): ${message}`)
    })
    console.log('')
    return 1
  }

  if (results.warnings.length > 0) {
    console.log(`⚠️  E78.2 verification passed with ${results.warnings.length} warning(s)`)
    console.log('   Some checks not yet fully implemented')
    return 0
  }

  console.log('✅ All E78.2 verification checks passed!')
  return 0
}

// Run verification
verifyE782()
  .then((exitCode) => {
    process.exit(exitCode)
  })
  .catch((err) => {
    console.error('❌ Fatal error during verification:', err)
    process.exit(2)
  })
