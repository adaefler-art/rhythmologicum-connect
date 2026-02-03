#!/usr/bin/env node
/**
 * E76.4: Diagnosis Worker Execution Verification Script
 * 
 * Verifies that E76.4 requirements are met:
 * - Worker API endpoint exists (/api/studio/diagnosis-runs/{runId}/execute)
 * - Endpoint has literal callsite in the repo
 * - Feature flag exists (NEXT_PUBLIC_FEATURE_DIAGNOSIS_WORKER_ENABLED)
 * - Rules vs. Checks Matrix is present
 * 
 * Usage: node scripts/ci/verify-e76-4-worker.mjs
 * Exit codes:
 *   0 - All guardrails satisfied
 *   1 - Violations found (outputs "violates R-E76.4-XXX")
 *   2 - Script error
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '..', '..')

// Rule definitions for E76.4
const E76_4_RULES = [
  {
    id: 'R-E76.4-001',
    description: 'Worker API endpoint must exist',
    errorCode: 'ENDPOINT_MISSING',
  },
  {
    id: 'R-E76.4-002',
    description: 'Endpoint must have literal fetch() callsite',
    errorCode: 'NO_LITERAL_CALLSITE',
  },
  {
    id: 'R-E76.4-003',
    description: 'Feature flag DIAGNOSIS_WORKER_ENABLED must exist',
    errorCode: 'FEATURE_FLAG_MISSING',
  },
  {
    id: 'R-E76.4-004',
    description: 'Rules vs. Checks Matrix must exist',
    errorCode: 'MATRIX_MISSING',
  },
  {
    id: 'R-E76.4-005',
    description: 'Endpoint must validate run status is queued before execution',
    errorCode: 'STATUS_VALIDATION_MISSING',
  },
  {
    id: 'R-E76.4-006',
    description: 'Endpoint must transition run to running status',
    errorCode: 'RUNNING_TRANSITION_MISSING',
  },
  {
    id: 'R-E76.4-007',
    description: 'Endpoint must call context pack builder',
    errorCode: 'CONTEXT_PACK_MISSING',
  },
  {
    id: 'R-E76.4-008',
    description: 'Endpoint must validate diagnosis JSON schema',
    errorCode: 'VALIDATION_MISSING',
  },
  {
    id: 'R-E76.4-009',
    description: 'Endpoint must persist artifact on success',
    errorCode: 'ARTIFACT_PERSIST_MISSING',
  },
  {
    id: 'R-E76.4-010',
    description: 'Endpoint must set status to failed on error with error_info',
    errorCode: 'ERROR_HANDLING_MISSING',
  },
]

const violations = []

console.log('🔍 E76.4: Diagnosis Worker Execution Verification\n')

// Check 1: Verify worker endpoint exists
console.log('📋 R-E76.4-001: Checking worker endpoint exists...')
const endpointPath = join(
  REPO_ROOT,
  'apps/rhythm-studio-ui/app/api/studio/diagnosis-runs/[runId]/execute/route.ts'
)

if (!existsSync(endpointPath)) {
  violations.push({
    rule: 'R-E76.4-001',
    code: 'ENDPOINT_MISSING',
    message: 'Worker endpoint route.ts does not exist',
  })
  console.log('❌ FAIL: Endpoint file missing')
} else {
  console.log('✅ PASS: Worker endpoint exists')

  // Read endpoint content for further checks
  const endpointContent = readFileSync(endpointPath, 'utf-8')

  // Check 5: Validate status check
  console.log('\n📋 R-E76.4-005: Checking status validation...')
  if (!endpointContent.includes("status !== 'queued'")) {
    violations.push({
      rule: 'R-E76.4-005',
      code: 'STATUS_VALIDATION_MISSING',
      message: 'Missing queued status validation before execution',
    })
    console.log('❌ FAIL: Status validation missing')
  } else {
    console.log('✅ PASS: Status validation found')
  }

  // Check 6: Validate running transition
  console.log('\n📋 R-E76.4-006: Checking running transition...')
  if (!endpointContent.includes("status: 'running'")) {
    violations.push({
      rule: 'R-E76.4-006',
      code: 'RUNNING_TRANSITION_MISSING',
      message: 'Missing transition to running status',
    })
    console.log('❌ FAIL: Running transition missing')
  } else {
    console.log('✅ PASS: Running transition found')
  }

  // Check 7: Validate context pack call
  console.log('\n📋 R-E76.4-007: Checking context pack builder call...')
  if (!endpointContent.includes('buildPatientContextPack')) {
    violations.push({
      rule: 'R-E76.4-007',
      code: 'CONTEXT_PACK_MISSING',
      message: 'Missing buildPatientContextPack call',
    })
    console.log('❌ FAIL: Context pack builder call missing')
  } else {
    console.log('✅ PASS: Context pack builder call found')
  }

  // Check 8: Validate diagnosis schema validation
  console.log('\n📋 R-E76.4-008: Checking diagnosis validation...')
  if (!endpointContent.includes('validateDiagnosisResult')) {
    violations.push({
      rule: 'R-E76.4-008',
      code: 'VALIDATION_MISSING',
      message: 'Missing diagnosis schema validation',
    })
    console.log('❌ FAIL: Diagnosis validation missing')
  } else {
    console.log('✅ PASS: Diagnosis validation found')
  }

  // Check 9: Validate artifact persistence
  console.log('\n📋 R-E76.4-009: Checking artifact persistence...')
  if (!endpointContent.includes('diagnosis_artifacts')) {
    violations.push({
      rule: 'R-E76.4-009',
      code: 'ARTIFACT_PERSIST_MISSING',
      message: 'Missing artifact persistence logic',
    })
    console.log('❌ FAIL: Artifact persistence missing')
  } else {
    console.log('✅ PASS: Artifact persistence found')
  }

  // Check 10: Validate error handling
  console.log('\n📋 R-E76.4-010: Checking error handling...')
  if (!endpointContent.includes("status: 'failed'") || !endpointContent.includes('error_info')) {
    violations.push({
      rule: 'R-E76.4-010',
      code: 'ERROR_HANDLING_MISSING',
      message: 'Missing failed status with error_info',
    })
    console.log('❌ FAIL: Error handling incomplete')
  } else {
    console.log('✅ PASS: Error handling found')
  }
}

// Check 2: Verify literal callsite exists
console.log('\n📋 R-E76.4-002: Checking literal callsite...')
const componentPath = join(
  REPO_ROOT,
  'apps/rhythm-studio-ui/components/studio/DiagnosisRunsPanel.tsx'
)

if (!existsSync(componentPath)) {
  violations.push({
    rule: 'R-E76.4-002',
    code: 'NO_LITERAL_CALLSITE',
    message: 'DiagnosisRunsPanel.tsx component does not exist',
  })
  console.log('❌ FAIL: Component file missing')
} else {
  const componentContent = readFileSync(componentPath, 'utf-8')

  const expectedCallsite = '/api/studio/diagnosis-runs/${runId}/execute'

  if (!componentContent.includes(expectedCallsite)) {
    violations.push({
      rule: 'R-E76.4-002',
      code: 'NO_LITERAL_CALLSITE',
      message: `Missing literal callsite: ${expectedCallsite}`,
    })
    console.log('❌ FAIL: Literal callsite missing')
  } else {
    console.log('✅ PASS: Literal callsite found')
  }
}

// Check 3: Verify feature flag exists
console.log('\n📋 R-E76.4-003: Checking feature flag...')
const featureFlagsPath = join(REPO_ROOT, 'lib/featureFlags.ts')

if (!existsSync(featureFlagsPath)) {
  violations.push({
    rule: 'R-E76.4-003',
    code: 'FEATURE_FLAG_MISSING',
    message: 'featureFlags.ts file does not exist',
  })
  console.log('❌ FAIL: Feature flags file missing')
} else {
  const featureFlagsContent = readFileSync(featureFlagsPath, 'utf-8')

  if (!featureFlagsContent.includes('DIAGNOSIS_WORKER_ENABLED')) {
    violations.push({
      rule: 'R-E76.4-003',
      code: 'FEATURE_FLAG_MISSING',
      message: 'DIAGNOSIS_WORKER_ENABLED feature flag not found',
    })
    console.log('❌ FAIL: Feature flag missing')
  } else {
    console.log('✅ PASS: Feature flag DIAGNOSIS_WORKER_ENABLED found')
  }
}

// Check 4: Verify Rules vs. Checks Matrix
console.log('\n📋 R-E76.4-004: Checking Rules vs. Checks Matrix...')
const matrixPath = join(REPO_ROOT, 'docs/e7/E76_4_RULES_VS_CHECKS_MATRIX.md')

if (!existsSync(matrixPath)) {
  violations.push({
    rule: 'R-E76.4-004',
    code: 'MATRIX_MISSING',
    message: 'Rules vs. Checks Matrix document does not exist',
  })
  console.log('❌ FAIL: Matrix document missing')
} else {
  const matrixContent = readFileSync(matrixPath, 'utf-8')

  // Verify it contains required sections
  const requiredSections = ['Matrix Overview', 'Diff Report', 'Coverage Summary']
  const missingSections = requiredSections.filter((section) => !matrixContent.includes(section))

  if (missingSections.length > 0) {
    violations.push({
      rule: 'R-E76.4-004',
      code: 'MATRIX_INCOMPLETE',
      message: `Matrix missing sections: ${missingSections.join(', ')}`,
    })
    console.log(`❌ FAIL: Matrix incomplete (missing ${missingSections.length} sections)`)
  } else {
    console.log('✅ PASS: Rules vs. Checks Matrix complete')
  }
}

// Summary
console.log('\n' + '='.repeat(60))
if (violations.length === 0) {
  console.log('✅ All E76.4 guardrails satisfied')
  console.log('='.repeat(60))
  process.exit(0)
} else {
  console.log(`❌ Found ${violations.length} violation(s):\n`)
  violations.forEach((v) => {
    console.log(`  violates ${v.rule} (${v.code}): ${v.message}`)
  })
  console.log('\n' + '='.repeat(60))
  process.exit(1)
}
