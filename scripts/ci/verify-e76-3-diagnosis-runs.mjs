#!/usr/bin/env node
/**
 * E76.3: Diagnosis Runs API Verification Script
 * 
 * Verifies that E76.3 requirements are met:
 * - All API endpoints exist with proper structure
 * - All endpoints have literal callsites in the repo
 * - Database migration exists with required tables
 * - RLS policies are defined
 * - Feature flag exists in UI component
 * - Rules vs. Checks Matrix is present
 * 
 * Usage: node scripts/ci/verify-e76-3-diagnosis-runs.mjs
 * Exit codes:
 *   0 - All guardrails satisfied
 *   1 - Violations found (outputs "violates R-E76.3-XXX")
 *   2 - Script error
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '..', '..')

// Rule definitions for E76.3
const E76_3_RULES = [
  {
    id: 'R-E76.3-001',
    description: 'All 5 API endpoints must exist',
    errorCode: 'ENDPOINT_MISSING',
  },
  {
    id: 'R-E76.3-002',
    description: 'All endpoints must have literal fetch() callsites',
    errorCode: 'NO_LITERAL_CALLSITE',
  },
  {
    id: 'R-E76.3-003',
    description: 'Database migration must exist',
    errorCode: 'MIGRATION_MISSING',
  },
  {
    id: 'R-E76.3-004',
    description: 'Migration must create 3 tables (diagnosis_runs, diagnosis_run_artifacts, diagnosis_artifacts)',
    errorCode: 'TABLES_MISSING',
  },
  {
    id: 'R-E76.3-005',
    description: 'Migration must define RLS policies',
    errorCode: 'RLS_POLICIES_MISSING',
  },
  {
    id: 'R-E76.3-006',
    description: 'Feature flag must exist in UI component',
    errorCode: 'FEATURE_FLAG_MISSING',
  },
  {
    id: 'R-E76.3-007',
    description: 'Rules vs. Checks Matrix must exist',
    errorCode: 'MATRIX_MISSING',
  },
]

const violations = []

console.log('🔍 E76.3: Diagnosis Runs API Verification\n')

// Check 1: Verify all 5 API endpoints exist
console.log('📋 R-E76.3-001: Checking API endpoints exist...')
const endpoints = [
  'apps/rhythm-studio-ui/app/api/studio/patients/[patientId]/diagnosis-runs/route.ts',
  'apps/rhythm-studio-ui/app/api/studio/diagnosis-runs/[runId]/route.ts',
  'apps/rhythm-studio-ui/app/api/studio/diagnosis-runs/[runId]/artifacts/route.ts',
  'apps/rhythm-studio-ui/app/api/studio/diagnosis-artifacts/[artifactId]/route.ts',
]

const missingEndpoints = []
for (const endpoint of endpoints) {
  const path = join(REPO_ROOT, endpoint)
  if (!existsSync(path)) {
    missingEndpoints.push(endpoint)
  }
}

if (missingEndpoints.length > 0) {
  violations.push({
    rule: 'R-E76.3-001',
    code: 'ENDPOINT_MISSING',
    message: `Missing endpoints: ${missingEndpoints.join(', ')}`,
  })
  console.log(`❌ FAIL: Missing ${missingEndpoints.length} endpoints`)
} else {
  console.log(`✅ PASS: All ${endpoints.length} endpoints exist`)
}

// Check 2: Verify literal callsites exist
console.log('\n📋 R-E76.3-002: Checking literal callsites...')
const componentPath = join(
  REPO_ROOT,
  'apps/rhythm-studio-ui/components/studio/DiagnosisRunsPanel.tsx'
)

if (!existsSync(componentPath)) {
  violations.push({
    rule: 'R-E76.3-002',
    code: 'NO_LITERAL_CALLSITE',
    message: 'DiagnosisRunsPanel.tsx component does not exist',
  })
  console.log('❌ FAIL: Component file missing')
} else {
  const componentContent = readFileSync(componentPath, 'utf-8')
  
  const expectedCallsites = [
    '/api/studio/patients/${patientId}/diagnosis-runs',
    '/api/studio/diagnosis-runs/${runId}',
    '/api/studio/diagnosis-runs/${runId}/artifacts',
    '/api/studio/diagnosis-artifacts/${artifactId}',
  ]
  
  const missingCallsites = expectedCallsites.filter((callsite) => {
    return !componentContent.includes(callsite)
  })
  
  if (missingCallsites.length > 0) {
    violations.push({
      rule: 'R-E76.3-002',
      code: 'NO_LITERAL_CALLSITE',
      message: `Missing literal callsites: ${missingCallsites.join(', ')}`,
    })
    console.log(`❌ FAIL: Missing ${missingCallsites.length} callsites`)
  } else {
    console.log(`✅ PASS: All ${expectedCallsites.length} literal callsites found`)
  }
}

// Check 3: Verify migration exists
console.log('\n📋 R-E76.3-003: Checking database migration exists...')
const migrationPath = join(
  REPO_ROOT,
  'supabase/migrations/20260203123708_e76_3_diagnosis_runs_api.sql'
)

if (!existsSync(migrationPath)) {
  violations.push({
    rule: 'R-E76.3-003',
    code: 'MIGRATION_MISSING',
    message: 'Migration file 20260203123708_e76_3_diagnosis_runs_api.sql does not exist',
  })
  console.log('❌ FAIL: Migration file missing')
} else {
  console.log('✅ PASS: Migration file exists')
  
  // Check 4: Verify tables are created
  console.log('\n📋 R-E76.3-004: Checking tables are created...')
  const migrationContent = readFileSync(migrationPath, 'utf-8')
  
  const requiredTables = ['diagnosis_runs', 'diagnosis_run_artifacts', 'diagnosis_artifacts']
  const missingTables = requiredTables.filter((table) => {
    return !migrationContent.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)
  })
  
  if (missingTables.length > 0) {
    violations.push({
      rule: 'R-E76.3-004',
      code: 'TABLES_MISSING',
      message: `Missing table definitions: ${missingTables.join(', ')}`,
    })
    console.log(`❌ FAIL: Missing ${missingTables.length} tables`)
  } else {
    console.log(`✅ PASS: All ${requiredTables.length} tables defined`)
  }
  
  // Check 5: Verify RLS policies
  console.log('\n📋 R-E76.3-005: Checking RLS policies...')
  const rlsEnabled = requiredTables.every((table) => {
    return migrationContent.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)
  })
  
  const hasPolicies = migrationContent.includes('CREATE POLICY')
  
  if (!rlsEnabled || !hasPolicies) {
    violations.push({
      rule: 'R-E76.3-005',
      code: 'RLS_POLICIES_MISSING',
      message: 'RLS not enabled on all tables or policies missing',
    })
    console.log('❌ FAIL: RLS policies incomplete')
  } else {
    // Count policies
    const policyCount = (migrationContent.match(/CREATE POLICY/g) || []).length
    console.log(`✅ PASS: RLS enabled and ${policyCount} policies defined`)
  }
}

// Check 6: Verify feature flag
console.log('\n📋 R-E76.3-006: Checking feature flag...')
if (existsSync(componentPath)) {
  const componentContent = readFileSync(componentPath, 'utf-8')
  
  if (!componentContent.includes('enableDiagnosisRuns')) {
    violations.push({
      rule: 'R-E76.3-006',
      code: 'FEATURE_FLAG_MISSING',
      message: 'Feature flag enableDiagnosisRuns not found in component',
    })
    console.log('❌ FAIL: Feature flag missing')
  } else {
    console.log('✅ PASS: Feature flag enableDiagnosisRuns found')
  }
}

// Check 7: Verify Rules vs. Checks Matrix
console.log('\n📋 R-E76.3-007: Checking Rules vs. Checks Matrix...')
const matrixPath = join(REPO_ROOT, 'docs/e7/E76_3_RULES_VS_CHECKS_MATRIX.md')

if (!existsSync(matrixPath)) {
  violations.push({
    rule: 'R-E76.3-007',
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
      rule: 'R-E76.3-007',
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
  console.log('✅ All E76.3 guardrails satisfied')
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
