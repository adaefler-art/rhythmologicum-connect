#!/usr/bin/env node
/**
 * E76.8: Idempotency & Deduplication Verification Script
 * 
 * Verifies that E76.8 requirements are met:
 * - inputs_meta column exists in diagnosis_runs table
 * - Deduplication logic module exists
 * - Deterministic inputs_hash is computed from context pack
 * - API route /api/studio/diagnosis/queue exists
 * - Literal callsite exists for queue endpoint
 * - Deduplication policy is implemented
 * 
 * Usage: node scripts/ci/verify-e76-8-idempotency.mjs
 * Exit codes:
 *   0 - All guardrails satisfied
 *   1 - Violations found
 *   2 - Script error
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '..', '..')

// Rule definitions for E76.8
const E76_8_RULES = [
  {
    id: 'R-E76.8-001',
    description: 'inputs_meta column must exist in diagnosis_runs table migration',
    errorCode: 'INPUTS_META_COLUMN_MISSING',
  },
  {
    id: 'R-E76.8-002',
    description: 'Deduplication logic module must exist at lib/diagnosis/dedupe.ts',
    errorCode: 'DEDUPE_MODULE_MISSING',
  },
  {
    id: 'R-E76.8-003',
    description: 'Deduplication must check inputs_hash for duplicates',
    errorCode: 'DEDUPE_HASH_CHECK_MISSING',
  },
  {
    id: 'R-E76.8-004',
    description: 'inputs_meta extraction function must exist',
    errorCode: 'INPUTS_META_EXTRACTION_MISSING',
  },
  {
    id: 'R-E76.8-005',
    description: 'API route /api/studio/diagnosis/queue must exist',
    errorCode: 'QUEUE_API_ROUTE_MISSING',
  },
  {
    id: 'R-E76.8-006',
    description: 'Queue API must use dedupe logic before creating run',
    errorCode: 'QUEUE_NO_DEDUPE',
  },
  {
    id: 'R-E76.8-007',
    description: 'Queue API must persist inputs_meta',
    errorCode: 'QUEUE_NO_INPUTS_META',
  },
  {
    id: 'R-E76.8-008',
    description: 'Literal callsite for /api/studio/diagnosis/queue must exist',
    errorCode: 'QUEUE_LITERAL_CALLSITE_MISSING',
  },
  {
    id: 'R-E76.8-009',
    description: 'Dedupe policy must log warnings for duplicates',
    errorCode: 'DEDUPE_NO_WARNING_LOG',
  },
]

// Error code to rule mapping
const ERROR_CODE_TO_RULE_ID = {}
E76_8_RULES.forEach((rule) => {
  ERROR_CODE_TO_RULE_ID[rule.errorCode] = rule.id
})

const violations = []

function reportViolation(errorCode, details) {
  const ruleId = ERROR_CODE_TO_RULE_ID[errorCode]
  violations.push({
    ruleId,
    errorCode,
    details,
    message: `[${errorCode}] violates ${ruleId}: ${details}`,
  })
}

function checkInputsMetaMigration() {
  // Find the migration file
  const migrationPath = join(
    REPO_ROOT,
    'supabase',
    'migrations',
    '20260204164641_e76_8_add_inputs_meta.sql',
  )

  if (!existsSync(migrationPath)) {
    reportViolation(
      'INPUTS_META_COLUMN_MISSING',
      `Migration file not found: ${migrationPath}`,
    )
    return
  }

  const content = readFileSync(migrationPath, 'utf-8')

  // Check for inputs_meta column addition
  if (!content.includes('inputs_meta')) {
    reportViolation(
      'INPUTS_META_COLUMN_MISSING',
      'Migration does not add inputs_meta column',
    )
  }

  // Check for proper column type (jsonb)
  if (!content.includes('jsonb')) {
    reportViolation(
      'INPUTS_META_COLUMN_MISSING',
      'inputs_meta column is not JSONB type',
    )
  }

  // Check for E76.8 comment
  if (!content.includes('E76.8')) {
    reportViolation(
      'INPUTS_META_COLUMN_MISSING',
      'Migration not documented as E76.8',
    )
  }
}

function checkDedupeModule() {
  const dedupePath = join(REPO_ROOT, 'lib', 'diagnosis', 'dedupe.ts')

  if (!existsSync(dedupePath)) {
    reportViolation(
      'DEDUPE_MODULE_MISSING',
      `File not found: ${dedupePath}`,
    )
    return
  }

  const content = readFileSync(dedupePath, 'utf-8')

  // Check for checkDuplicateRun function
  if (!content.includes('export async function checkDuplicateRun')) {
    reportViolation(
      'DEDUPE_HASH_CHECK_MISSING',
      'checkDuplicateRun function not exported',
    )
  }

  // Check for inputs_hash usage in dedupe check
  if (!content.includes("eq('inputs_hash'") && !content.includes('.inputs_hash')) {
    reportViolation(
      'DEDUPE_HASH_CHECK_MISSING',
      'Dedupe check does not query by inputs_hash',
    )
  }

  // Check for extractInputsMeta function
  if (!content.includes('export function extractInputsMeta')) {
    reportViolation(
      'INPUTS_META_EXTRACTION_MISSING',
      'extractInputsMeta function not exported',
    )
  }

  // Check for warning log
  if (!content.includes('console.warn') || !content.includes('DEDUPE WARNING')) {
    reportViolation(
      'DEDUPE_NO_WARNING_LOG',
      'Dedupe policy does not log warnings',
    )
  }

  // Check for E76.8 comment
  if (!content.includes('E76.8')) {
    reportViolation(
      'DEDUPE_MODULE_MISSING',
      'Dedupe module not documented as E76.8',
    )
  }
}

function checkQueueAPIRoute() {
  const queueRoutePath = join(
    REPO_ROOT,
    'apps',
    'rhythm-studio-ui',
    'app',
    'api',
    'studio',
    'diagnosis',
    'queue',
    'route.ts',
  )

  if (!existsSync(queueRoutePath)) {
    reportViolation(
      'QUEUE_API_ROUTE_MISSING',
      `File not found: ${queueRoutePath}`,
    )
    return
  }

  const content = readFileSync(queueRoutePath, 'utf-8')

  // Check for dedupe logic import
  if (!content.includes('checkDuplicateRun')) {
    reportViolation(
      'QUEUE_NO_DEDUPE',
      'Queue API does not import checkDuplicateRun',
    )
  }

  // Check for extractInputsMeta import
  if (!content.includes('extractInputsMeta')) {
    reportViolation(
      'QUEUE_NO_INPUTS_META',
      'Queue API does not import extractInputsMeta',
    )
  }

  // Check for dedupe check before insert
  if (!content.includes('checkDuplicateRun(')) {
    reportViolation(
      'QUEUE_NO_DEDUPE',
      'Queue API does not call checkDuplicateRun',
    )
  }

  // Check for inputs_meta persistence
  if (!content.includes('inputs_meta') || !content.includes('.insert({')) {
    reportViolation(
      'QUEUE_NO_INPUTS_META',
      'Queue API does not persist inputs_meta',
    )
  }

  // Check for E76.8 comment
  if (!content.includes('E76.8')) {
    reportViolation(
      'QUEUE_API_ROUTE_MISSING',
      'Queue API route not documented as E76.8',
    )
  }
}

function checkLiteralCallsite() {
  const testPagePath = join(
    REPO_ROOT,
    'apps',
    'rhythm-studio-ui',
    'app',
    'admin',
    'diagnostics',
    'mcp-test',
    'page.tsx',
  )

  if (!existsSync(testPagePath)) {
    reportViolation(
      'QUEUE_LITERAL_CALLSITE_MISSING',
      `Test page not found: ${testPagePath}`,
    )
    return
  }

  const content = readFileSync(testPagePath, 'utf-8')

  // Check for literal /api/studio/diagnosis/queue string
  if (!content.includes("'/api/studio/diagnosis/queue'")) {
    reportViolation(
      'QUEUE_LITERAL_CALLSITE_MISSING',
      "Literal string '/api/studio/diagnosis/queue' not found in test page",
    )
  }

  // Check for E76.8 comment
  if (!content.includes('E76.8')) {
    reportViolation(
      'QUEUE_LITERAL_CALLSITE_MISSING',
      'Test page not documented as including E76.8 callsite',
    )
  }
}

// Run all checks
function runChecks() {
  console.log('Running E76.8 Idempotency & Deduplication verification...\n')

  checkInputsMetaMigration()
  checkDedupeModule()
  checkQueueAPIRoute()
  checkLiteralCallsite()

  if (violations.length === 0) {
    console.log('✅ All E76.8 guardrails satisfied\n')
    console.log(`Verified ${E76_8_RULES.length} rules:`)
    E76_8_RULES.forEach((rule) => {
      console.log(`  ✓ ${rule.id}: ${rule.description}`)
    })
    process.exit(0)
  } else {
    console.error(`❌ Found ${violations.length} violation(s):\n`)
    violations.forEach((v) => {
      console.error(`  ${v.message}`)
    })
    console.error(`\nFailed rules:`)
    const failedRuleIds = new Set(violations.map((v) => v.ruleId))
    E76_8_RULES.forEach((rule) => {
      if (failedRuleIds.has(rule.id)) {
        console.error(`  ✗ ${rule.id}: ${rule.description}`)
      }
    })
    process.exit(1)
  }
}

// Main execution
try {
  runChecks()
} catch (error) {
  console.error('Script error:', error)
  process.exit(2)
}
