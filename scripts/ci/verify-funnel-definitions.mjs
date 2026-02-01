#!/usr/bin/env node
/**
 * E74.1: CI Check for Funnel Definition Schema Validation
 * 
 * This script validates all funnel_versions in the database against
 * the canonical schema v1. It reports any violations with deterministic
 * error codes and references to rule IDs.
 * 
 * Usage: node scripts/ci/verify-funnel-definitions.mjs
 * 
 * Exit codes:
 * 0 - All funnel definitions are valid
 * 1 - One or more funnel definitions are invalid
 * 2 - Script error (config, database connection, etc.)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

// Import validator functions - using dynamic import for ES modules
const validatorModule = await import('../../lib/validators/funnelDefinition.ts')
const { validateFunnelVersion, formatValidationErrors, VALIDATION_ERROR_CODES } = validatorModule

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validation rules mapped to error codes
// Each rule ID corresponds to a specific validation check
const RULE_IDS = {
  'R-E74-001': 'Schema version must be v1',
  'R-E74-002': 'Schema must be valid according to Zod schema',
  'R-E74-003': 'Steps array must exist and not be empty',
  'R-E74-004': 'Each step must have a unique ID',
  'R-E74-005': 'Each step must have a title',
  'R-E74-006': 'Each step must have at least one question',
  'R-E74-007': 'Each question must have a unique ID',
  'R-E74-008': 'Each question must have a unique key',
  'R-E74-009': 'Each question must have a type',
  'R-E74-010': 'Each question must have a label',
  'R-E74-011': 'Radio and checkbox questions must have options',
  'R-E74-012': 'Conditional logic must reference existing questions',
  'R-E74-013': 'Conditional logic must not forward-reference questions',
  'R-E74-014': 'Pages array must exist and not be empty',
  'R-E74-015': 'Each page must have a unique slug',
  'R-E74-016': 'Each page must have a title',
  'R-E74-017': 'Each page must have at least one section',
  'R-E74-018': 'Asset keys must be unique',
}

// Map error codes to rule IDs
const ERROR_CODE_TO_RULE_ID = {
  [VALIDATION_ERROR_CODES.DEF_MISSING_SCHEMA_VERSION]: 'R-E74-001',
  [VALIDATION_ERROR_CODES.DEF_INVALID_SCHEMA_VERSION]: 'R-E74-001',
  [VALIDATION_ERROR_CODES.DEF_INVALID_SCHEMA]: 'R-E74-002',
  [VALIDATION_ERROR_CODES.DEF_MISSING_STEPS]: 'R-E74-003',
  [VALIDATION_ERROR_CODES.DEF_EMPTY_STEPS]: 'R-E74-003',
  [VALIDATION_ERROR_CODES.DEF_MISSING_STEP_ID]: 'R-E74-004',
  [VALIDATION_ERROR_CODES.DEF_DUPLICATE_STEP_ID]: 'R-E74-004',
  [VALIDATION_ERROR_CODES.DEF_MISSING_STEP_TITLE]: 'R-E74-005',
  [VALIDATION_ERROR_CODES.DEF_MISSING_QUESTIONS]: 'R-E74-006',
  [VALIDATION_ERROR_CODES.DEF_EMPTY_QUESTIONS]: 'R-E74-006',
  [VALIDATION_ERROR_CODES.DEF_MISSING_QUESTION_ID]: 'R-E74-007',
  [VALIDATION_ERROR_CODES.DEF_DUPLICATE_QUESTION_ID]: 'R-E74-007',
  [VALIDATION_ERROR_CODES.DEF_MISSING_QUESTION_KEY]: 'R-E74-008',
  [VALIDATION_ERROR_CODES.DEF_DUPLICATE_QUESTION_KEY]: 'R-E74-008',
  [VALIDATION_ERROR_CODES.DEF_MISSING_QUESTION_TYPE]: 'R-E74-009',
  [VALIDATION_ERROR_CODES.DEF_INVALID_QUESTION_TYPE]: 'R-E74-009',
  [VALIDATION_ERROR_CODES.DEF_MISSING_QUESTION_LABEL]: 'R-E74-010',
  [VALIDATION_ERROR_CODES.DEF_MISSING_OPTIONS_FOR_CHOICE]: 'R-E74-011',
  [VALIDATION_ERROR_CODES.DEF_EMPTY_OPTIONS_FOR_CHOICE]: 'R-E74-011',
  [VALIDATION_ERROR_CODES.DEF_INVALID_CONDITIONAL_REFERENCE]: 'R-E74-012',
  [VALIDATION_ERROR_CODES.DEF_CONDITIONAL_FORWARD_REFERENCE]: 'R-E74-013',
  [VALIDATION_ERROR_CODES.DEF_MISSING_PAGES]: 'R-E74-014',
  [VALIDATION_ERROR_CODES.DEF_EMPTY_PAGES]: 'R-E74-014',
  [VALIDATION_ERROR_CODES.DEF_MISSING_PAGE_SLUG]: 'R-E74-015',
  [VALIDATION_ERROR_CODES.DEF_DUPLICATE_PAGE_SLUG]: 'R-E74-015',
  [VALIDATION_ERROR_CODES.DEF_MISSING_PAGE_TITLE]: 'R-E74-016',
  [VALIDATION_ERROR_CODES.DEF_MISSING_SECTIONS]: 'R-E74-017',
  [VALIDATION_ERROR_CODES.DEF_EMPTY_SECTIONS]: 'R-E74-017',
  [VALIDATION_ERROR_CODES.DEF_DUPLICATE_ASSET_KEY]: 'R-E74-018',
}

/**
 * Main validation function
 */
async function main() {
  console.log('🔍 E74.1: Verifying Funnel Definition Schemas...\n')

  // Check environment variables
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Error: Missing Supabase environment variables')
    console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(2)
  }

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Fetch all funnel versions
  const { data: versions, error } = await supabase
    .from('funnel_versions')
    .select('id, funnel_id, version, questionnaire_config, content_manifest')

  if (error) {
    console.error('❌ Error fetching funnel versions:', error.message)
    process.exit(2)
  }

  if (!versions || versions.length === 0) {
    console.log('ℹ️  No funnel versions found in database')
    process.exit(0)
  }

  console.log(`Found ${versions.length} funnel version(s) to validate\n`)

  let totalErrors = 0
  const invalidVersions = []

  // Validate each version
  for (const version of versions) {
    console.log(`Validating funnel version: ${version.id} (v${version.version})`)

    const result = validateFunnelVersion({
      questionnaire_config: version.questionnaire_config,
      content_manifest: version.content_manifest,
    })

    if (!result.valid) {
      invalidVersions.push(version.id)
      console.error(`❌ INVALID - ${result.errors.length} error(s) found:`)

      result.errors.forEach((err) => {
        const ruleId = ERROR_CODE_TO_RULE_ID[err.code] || 'R-UNKNOWN'
        const pathStr = err.path ? err.path.join('.') : 'root'
        console.error(`   [${err.code}] violates ${ruleId}: ${pathStr} - ${err.message}`)
        totalErrors++
      })

      console.error('')
    } else {
      console.log('✅ VALID\n')
    }
  }

  // Summary
  console.log('━'.repeat(80))
  console.log('Summary:')
  console.log(`  Total versions checked: ${versions.length}`)
  console.log(`  Valid: ${versions.length - invalidVersions.length}`)
  console.log(`  Invalid: ${invalidVersions.length}`)
  console.log(`  Total errors: ${totalErrors}`)

  if (invalidVersions.length > 0) {
    console.error('\n❌ VALIDATION FAILED')
    console.error('The following funnel versions have invalid definitions:')
    invalidVersions.forEach((id) => console.error(`  - ${id}`))
    console.error('\nPlease fix the errors before publishing.')
    process.exit(1)
  }

  console.log('\n✅ All funnel definitions are valid!')
  process.exit(0)
}

// Run the script
main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(2)
})
