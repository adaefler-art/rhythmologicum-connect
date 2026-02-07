#!/usr/bin/env node
/**
 * E76.4: Diagnosis Execution Worker Verification Script
 * 
 * Verifies that E76.4 requirements are met:
 * - Diagnosis runs and artifacts tables exist in schema
 * - Diagnosis contract with types and schemas exists
 * - Worker module exists with execution logic
 * - API route /api/studio/diagnosis/execute exists
 * - Literal callsite exists in test page
 * - Feature flag exists
 * - Schema validation for diagnosis JSON is present
 * - Error handling for invalid results is implemented
 * 
 * Usage: node scripts/ci/verify-e76-4-diagnosis-worker.mjs
 * Exit codes:
 *   0 - All guardrails satisfied
 *   1 - Violations found
 *   2 - Script error
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '..', '..')

// Rule definitions for E76.4
const E76_4_RULES = [
  {
    id: 'R-E76.4-001',
    description: 'Database migration for diagnosis_runs and diagnosis_artifacts must exist',
    errorCode: 'DIAGNOSIS_MIGRATION_MISSING',
  },
  {
    id: 'R-E76.4-002',
    description: 'Diagnosis contract with types and schemas must exist at lib/contracts/diagnosis.ts',
    errorCode: 'DIAGNOSIS_CONTRACT_MISSING',
  },
  {
    id: 'R-E76.4-003',
    description: 'Worker module must exist at lib/diagnosis/worker.ts',
    errorCode: 'DIAGNOSIS_WORKER_MISSING',
  },
  {
    id: 'R-E76.4-004',
    description: 'Worker must implement schema validation for diagnosis result',
    errorCode: 'DIAGNOSIS_VALIDATION_MISSING',
  },
  {
    id: 'R-E76.4-005',
    description: 'Worker must handle VALIDATION_ERROR for invalid results',
    errorCode: 'VALIDATION_ERROR_HANDLING_MISSING',
  },
  {
    id: 'R-E76.4-006',
    description: 'Worker must implement concurrency prevention (status check)',
    errorCode: 'CONCURRENCY_PREVENTION_MISSING',
  },
  {
    id: 'R-E76.4-007',
    description: 'API route /api/studio/diagnosis/execute must exist',
    errorCode: 'DIAGNOSIS_EXECUTE_API_MISSING',
  },
  {
    id: 'R-E76.4-008',
    description: 'Literal callsite for /api/studio/diagnosis/execute must exist',
    errorCode: 'DIAGNOSIS_EXECUTE_LITERAL_MISSING',
  },
  {
    id: 'R-E76.4-009',
    description: 'Feature flag DIAGNOSIS_ENABLED must exist',
    errorCode: 'DIAGNOSIS_FEATURE_FLAG_MISSING',
  },
  {
    id: 'R-E76.4-010',
    description: 'API route must check authorization (clinician/admin only)',
    errorCode: 'DIAGNOSIS_EXECUTE_NO_AUTHORIZATION',
  },
]

// Error code to rule mapping
const ERROR_CODE_TO_RULE_ID = {}
E76_4_RULES.forEach((rule) => {
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

function checkDiagnosisMigrationExists() {
  const migrationPattern = /e76_4_diagnosis_runs_and_artifacts\.sql$/
  const migrationsDir = join(REPO_ROOT, 'supabase', 'migrations')
  
  if (!existsSync(migrationsDir)) {
    reportViolation(
      'DIAGNOSIS_MIGRATION_MISSING',
      `Migrations directory not found: ${migrationsDir}`,
    )
    return
  }

  try {
    const files = readdirSync(migrationsDir)
    const migrationExists = files.some((file) => migrationPattern.test(file))

    if (!migrationExists) {
      reportViolation(
        'DIAGNOSIS_MIGRATION_MISSING',
        `No migration file matching pattern ${migrationPattern} found in ${migrationsDir}`,
      )
      return
    }

    // Find the migration file and check it contains required tables
    const migrationFile = files.find((file) => migrationPattern.test(file))
    const migrationPath = join(migrationsDir, migrationFile)
    const content = readFileSync(migrationPath, 'utf8')

    const runsTableRegex = /CREATE TABLE IF NOT EXISTS\s+(("public"|public)\.)?"?diagnosis_runs"?/i
    if (!runsTableRegex.test(content)) {
      reportViolation(
        'DIAGNOSIS_MIGRATION_MISSING',
        'Migration does not create diagnosis_runs table',
      )
    }

    const artifactsTableRegex = /CREATE TABLE IF NOT EXISTS\s+(("public"|public)\.)?"?diagnosis_artifacts"?/i
    if (!artifactsTableRegex.test(content)) {
      reportViolation(
        'DIAGNOSIS_MIGRATION_MISSING',
        'Migration does not create diagnosis_artifacts table',
      )
    }

    if (!content.includes('diagnosis_run_status')) {
      reportViolation(
        'DIAGNOSIS_MIGRATION_MISSING',
        'Migration does not define diagnosis_run_status enum',
      )
    }
  } catch (error) {
    reportViolation(
      'DIAGNOSIS_MIGRATION_MISSING',
      `Error checking migration: ${error.message}`,
    )
  }
}

function checkDiagnosisContractExists() {
  const contractPath = join(REPO_ROOT, 'lib', 'contracts', 'diagnosis.ts')
  if (!existsSync(contractPath)) {
    reportViolation(
      'DIAGNOSIS_CONTRACT_MISSING',
      `File not found: ${contractPath}`,
    )
    return
  }

  try {
    const content = readFileSync(contractPath, 'utf8')

    // Check for required types and schemas
    const requiredExports = [
      'DIAGNOSIS_RUN_STATUS',
      'DIAGNOSIS_ERROR_CODE',
      'DiagnosisResultSchema',
      'DiagnosisRunSchema',
      'DiagnosisArtifactSchema',
    ]

    for (const exportName of requiredExports) {
      if (!content.includes(exportName)) {
        reportViolation(
          'DIAGNOSIS_CONTRACT_MISSING',
          `Contract missing required export: ${exportName}`,
        )
      }
    }

    // Check for Zod imports
    if (!content.includes("import { z } from 'zod'")) {
      reportViolation(
        'DIAGNOSIS_CONTRACT_MISSING',
        'Contract does not import Zod for schema validation',
      )
    }
  } catch (error) {
    reportViolation(
      'DIAGNOSIS_CONTRACT_MISSING',
      `Error reading contract: ${error.message}`,
    )
  }
}

function checkDiagnosisWorkerExists() {
  const workerPath = join(REPO_ROOT, 'lib', 'diagnosis', 'worker.ts')
  if (!existsSync(workerPath)) {
    reportViolation(
      'DIAGNOSIS_WORKER_MISSING',
      `File not found: ${workerPath}`,
    )
    return
  }

  try {
    const content = readFileSync(workerPath, 'utf8')

    // Check for main export function
    if (!content.includes('export async function executeDiagnosisRun')) {
      reportViolation(
        'DIAGNOSIS_WORKER_MISSING',
        'Worker does not export executeDiagnosisRun function',
      )
    }

    // Check for schema validation
    if (!content.includes('DiagnosisResultSchema.parse')) {
      reportViolation(
        'DIAGNOSIS_VALIDATION_MISSING',
        'Worker does not validate diagnosis result with DiagnosisResultSchema',
      )
    }

    // Check for VALIDATION_ERROR handling
    if (!content.includes('VALIDATION_ERROR')) {
      reportViolation(
        'VALIDATION_ERROR_HANDLING_MISSING',
        'Worker does not handle VALIDATION_ERROR for invalid results',
      )
    }

    // Check for concurrency prevention (status check)
    if (!content.includes('DIAGNOSIS_RUN_STATUS.QUEUED')) {
      reportViolation(
        'CONCURRENCY_PREVENTION_MISSING',
        'Worker does not check for queued status before processing',
      )
    }

    // Check for context pack integration
    if (!content.includes('buildPatientContextPack')) {
      reportViolation(
        'DIAGNOSIS_WORKER_MISSING',
        'Worker does not integrate with context pack builder',
      )
    }

    // Check for MCP integration
    if (!content.includes('run_diagnosis')) {
      reportViolation(
        'DIAGNOSIS_WORKER_MISSING',
        'Worker does not call MCP run_diagnosis tool',
      )
    }

    // Check for artifact persistence
    if (!content.includes('.from(\'diagnosis_artifacts\')')) {
      reportViolation(
        'DIAGNOSIS_WORKER_MISSING',
        'Worker does not persist diagnosis artifacts',
      )
    }
  } catch (error) {
    reportViolation(
      'DIAGNOSIS_WORKER_MISSING',
      `Error reading worker: ${error.message}`,
    )
  }
}

function checkDiagnosisExecuteAPIRouteExists() {
  const routePath = join(
    REPO_ROOT,
    'apps',
    'rhythm-studio-ui',
    'app',
    'api',
    'studio',
    'diagnosis',
    'execute',
    'route.ts',
  )
  
  if (!existsSync(routePath)) {
    reportViolation(
      'DIAGNOSIS_EXECUTE_API_MISSING',
      `File not found: ${routePath}`,
    )
    return
  }

  try {
    const content = readFileSync(routePath, 'utf8')

    // Check for POST export
    if (!content.includes('export async function POST')) {
      reportViolation(
        'DIAGNOSIS_EXECUTE_API_MISSING',
        'API route does not export POST handler',
      )
    }

    // Check for authorization
    if (!content.includes('clinician') && !content.includes('admin')) {
      reportViolation(
        'DIAGNOSIS_EXECUTE_NO_AUTHORIZATION',
        'API route does not check for clinician/admin role',
      )
    }

    // Check for worker integration
    if (!content.includes('executeDiagnosisRun')) {
      reportViolation(
        'DIAGNOSIS_EXECUTE_API_MISSING',
        'API route does not call executeDiagnosisRun from worker',
      )
    }

    // Check for feature flag
    if (!content.includes('NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED')) {
      reportViolation(
        'DIAGNOSIS_EXECUTE_API_MISSING',
        'API route does not check DIAGNOSIS_ENABLED feature flag',
      )
    }
  } catch (error) {
    reportViolation(
      'DIAGNOSIS_EXECUTE_API_MISSING',
      `Error reading API route: ${error.message}`,
    )
  }
}

function checkDiagnosisExecuteLiteralCallsiteExists() {
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
      'DIAGNOSIS_EXECUTE_LITERAL_MISSING',
      `Test page not found: ${testPagePath}`,
    )
    return
  }

  try {
    const content = readFileSync(testPagePath, 'utf8')

    // Check for literal callsite
    if (!content.includes("'/api/studio/diagnosis/execute'")) {
      reportViolation(
        'DIAGNOSIS_EXECUTE_LITERAL_MISSING',
        'Test page does not contain literal string /api/studio/diagnosis/execute',
      )
    }

    // Check for fetch call
    if (!content.includes('fetch')) {
      reportViolation(
        'DIAGNOSIS_EXECUTE_LITERAL_MISSING',
        'Test page does not make fetch call to diagnosis execute endpoint',
      )
    }
  } catch (error) {
    reportViolation(
      'DIAGNOSIS_EXECUTE_LITERAL_MISSING',
      `Error reading test page: ${error.message}`,
    )
  }
}

function checkDiagnosisFeatureFlagExists() {
  const featureFlagsPath = join(REPO_ROOT, 'lib', 'featureFlags.ts')
  
  if (!existsSync(featureFlagsPath)) {
    reportViolation(
      'DIAGNOSIS_FEATURE_FLAG_MISSING',
      `File not found: ${featureFlagsPath}`,
    )
    return
  }

  try {
    const content = readFileSync(featureFlagsPath, 'utf8')

    // Check for DIAGNOSIS_ENABLED flag
    if (!content.includes('DIAGNOSIS_ENABLED')) {
      reportViolation(
        'DIAGNOSIS_FEATURE_FLAG_MISSING',
        'Feature flags file does not define DIAGNOSIS_ENABLED',
      )
    }

    // Check for environment variable
    if (!content.includes('NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED')) {
      reportViolation(
        'DIAGNOSIS_FEATURE_FLAG_MISSING',
        'Feature flags file does not reference NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED',
      )
    }
  } catch (error) {
    reportViolation(
      'DIAGNOSIS_FEATURE_FLAG_MISSING',
      `Error reading feature flags: ${error.message}`,
    )
  }
}

// Run all checks
async function runVerification() {
  console.log('🔍 E76.4: Verifying Diagnosis Execution Worker implementation...\n')

  checkDiagnosisMigrationExists()
  checkDiagnosisContractExists()
  checkDiagnosisWorkerExists()
  checkDiagnosisExecuteAPIRouteExists()
  checkDiagnosisExecuteLiteralCallsiteExists()
  checkDiagnosisFeatureFlagExists()

  if (violations.length > 0) {
    console.error('❌ E76.4 guardrails violations found:\n')
    violations.forEach((v) => {
      console.error(`  ${v.message}`)
    })
    console.error(`\n${violations.length} violation(s) detected`)
    process.exit(1)
  } else {
    console.log('✅ All E76.4 guardrails satisfied\n')
    console.log(`Verified ${E76_4_RULES.length} rules:`)
    E76_4_RULES.forEach((rule) => {
      console.log(`  ✓ ${rule.id}: ${rule.description}`)
    })
    process.exit(0)
  }
}

runVerification().catch((error) => {
  console.error('Script error:', error)
  process.exit(2)
})
