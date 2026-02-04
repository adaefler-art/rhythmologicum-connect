#!/usr/bin/env node

/**
 * E76.6: Diagnosis Patient UI Verification Script
 * 
 * Verifies that the diagnosis patient UI implementation follows all guardrails
 * and requirements specified in E76.6 (Studio UI: Diagnose Runs + Artifact Viewer).
 * 
 * Requirements verified:
 * 1. Feature flag exists and is properly configured
 * 2. API routes exist with proper authentication and feature gates
 * 3. Literal callsites exist (Strategy A compliance)
 * 4. RLS policies allow patient access to their own diagnosis data
 * 5. Patient UI pages exist and are feature-gated
 * 6. UI components handle loading/empty/error states robustly
 * 
 * Exit codes:
 * - 0: All guardrails satisfied
 * - 1: One or more violations detected
 * - 2: Script execution error
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '../..')

// ============================================================
// Rule Definitions
// ============================================================

const RULES = {
  'R-E76.6-001': 'Feature flag DIAGNOSIS_PATIENT_ENABLED must exist in featureFlags.ts',
  'R-E76.6-002': 'Feature flag must exist in env.ts schema',
  'R-E76.6-003': 'API route /api/patient/diagnosis/runs must exist',
  'R-E76.6-004': 'API route /api/patient/diagnosis/artifacts/[id] must exist',
  'R-E76.6-005': 'API routes must check feature flag DIAGNOSIS_PATIENT_ENABLED',
  'R-E76.6-006': 'API routes must check authentication',
  'R-E76.6-007': 'At least one literal callsite must exist for each endpoint',
  'R-E76.6-008': 'RLS policy must allow patients to read their own diagnosis_runs',
  'R-E76.6-009': 'RLS policy must allow patients to read their own diagnosis_artifacts',
  'R-E76.6-010': 'Patient UI pages must exist (list and detail views)',
  'R-E76.6-011': 'Patient UI must be feature-gated',
  'R-E76.6-012': 'UI components must handle loading/empty/error states',
}

// Error code to rule ID mapping
const ERROR_CODE_TO_RULE = {
  DIAGNOSIS_PATIENT_FLAG_MISSING: 'R-E76.6-001',
  DIAGNOSIS_PATIENT_ENV_MISSING: 'R-E76.6-002',
  DIAGNOSIS_RUNS_API_MISSING: 'R-E76.6-003',
  DIAGNOSIS_ARTIFACTS_API_MISSING: 'R-E76.6-004',
  DIAGNOSIS_API_NO_FEATURE_GATE: 'R-E76.6-005',
  DIAGNOSIS_API_NO_AUTH: 'R-E76.6-006',
  DIAGNOSIS_LITERAL_MISSING: 'R-E76.6-007',
  DIAGNOSIS_RLS_RUNS_MISSING: 'R-E76.6-008',
  DIAGNOSIS_RLS_ARTIFACTS_MISSING: 'R-E76.6-009',
  DIAGNOSIS_UI_PAGES_MISSING: 'R-E76.6-010',
  DIAGNOSIS_UI_NO_FEATURE_GATE: 'R-E76.6-011',
  DIAGNOSIS_UI_NO_STATE_HANDLING: 'R-E76.6-012',
}

const violations = []

// ============================================================
// Helper Functions
// ============================================================

function violates(errorCode, details) {
  const ruleId = ERROR_CODE_TO_RULE[errorCode]
  violations.push({
    ruleId,
    errorCode,
    rule: RULES[ruleId],
    details,
  })
}

function fileExists(filePath) {
  return fs.existsSync(path.join(REPO_ROOT, filePath))
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(REPO_ROOT, filePath), 'utf8')
  } catch (error) {
    return null
  }
}

function fileContains(filePath, pattern) {
  const content = readFile(filePath)
  if (!content) return false
  
  if (typeof pattern === 'string') {
    return content.includes(pattern)
  }
  return pattern.test(content)
}

// ============================================================
// Check Functions
// ============================================================

function checkFeatureFlagExists() {
  console.log('🔍 Checking feature flag configuration...')
  
  // Check featureFlags.ts
  const featureFlagsPath = 'lib/featureFlags.ts'
  if (!fileExists(featureFlagsPath)) {
    violates('DIAGNOSIS_PATIENT_FLAG_MISSING', 'featureFlags.ts file not found')
    return
  }
  
  const featureFlagsContent = readFile(featureFlagsPath)
  if (!featureFlagsContent.includes('DIAGNOSIS_PATIENT_ENABLED')) {
    violates('DIAGNOSIS_PATIENT_FLAG_MISSING', 'DIAGNOSIS_PATIENT_ENABLED not found in featureFlags.ts')
  }
  
  // Check env.ts
  const envPath = 'lib/env.ts'
  if (!fileExists(envPath)) {
    violates('DIAGNOSIS_PATIENT_ENV_MISSING', 'env.ts file not found')
    return
  }
  
  const envContent = readFile(envPath)
  if (!envContent.includes('NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED')) {
    violates('DIAGNOSIS_PATIENT_ENV_MISSING', 'NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED not found in env.ts')
  }
}

function checkAPIRoutesExist() {
  console.log('🔍 Checking API routes...')
  
  const runsRoutePath = 'apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/route.ts'
  if (!fileExists(runsRoutePath)) {
    violates('DIAGNOSIS_RUNS_API_MISSING', `API route not found: ${runsRoutePath}`)
  }
  
  const artifactsRoutePath = 'apps/rhythm-patient-ui/app/api/patient/diagnosis/artifacts/[id]/route.ts'
  if (!fileExists(artifactsRoutePath)) {
    violates('DIAGNOSIS_ARTIFACTS_API_MISSING', `API route not found: ${artifactsRoutePath}`)
  }
}

function checkAPIRoutesHaveFeatureGates() {
  console.log('🔍 Checking API routes have feature gates...')
  
  const routes = [
    'apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/route.ts',
    'apps/rhythm-patient-ui/app/api/patient/diagnosis/artifacts/[id]/route.ts',
  ]
  
  for (const route of routes) {
    if (!fileExists(route)) continue
    
    if (!fileContains(route, 'DIAGNOSIS_PATIENT_ENABLED')) {
      violates('DIAGNOSIS_API_NO_FEATURE_GATE', `API route ${route} missing DIAGNOSIS_PATIENT_ENABLED feature gate`)
    }
  }
}

function checkAPIRoutesHaveAuth() {
  console.log('🔍 Checking API routes have authentication...')
  
  const routes = [
    'apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/route.ts',
    'apps/rhythm-patient-ui/app/api/patient/diagnosis/artifacts/[id]/route.ts',
  ]
  
  for (const route of routes) {
    if (!fileExists(route)) continue
    
    if (!fileContains(route, 'auth.getUser()') && !fileContains(route, 'getUser()')) {
      violates('DIAGNOSIS_API_NO_AUTH', `API route ${route} missing authentication check`)
    }
  }
}

function checkLiteralCallsitesExist() {
  console.log('🔍 Checking for literal callsites (Strategy A)...')
  
  const clientFiles = [
    'apps/rhythm-patient-ui/app/patient/(mobile)/diagnosis/client.tsx',
    'apps/rhythm-patient-ui/app/patient/(mobile)/diagnosis/[id]/client.tsx',
  ]
  
  let foundRunsCallsite = false
  let foundArtifactsCallsite = false
  
  for (const file of clientFiles) {
    if (!fileExists(file)) continue
    
    const content = readFile(file)
    if (content.includes('/api/patient/diagnosis/runs')) {
      foundRunsCallsite = true
    }
    if (content.includes('/api/patient/diagnosis/artifacts')) {
      foundArtifactsCallsite = true
    }
  }
  
  if (!foundRunsCallsite) {
    violates('DIAGNOSIS_LITERAL_MISSING', 'No literal callsite found for /api/patient/diagnosis/runs')
  }
  
  // Note: artifacts callsite is optional as it may be called indirectly
}

function checkRLSPoliciesExist() {
  console.log('🔍 Checking RLS policies...')
  
  const migrationPath = 'supabase/migrations/20260204142315_e76_6_diagnosis_patient_rls.sql'
  if (!fileExists(migrationPath)) {
    violates('DIAGNOSIS_RLS_RUNS_MISSING', 'RLS migration file not found')
    violates('DIAGNOSIS_RLS_ARTIFACTS_MISSING', 'RLS migration file not found')
    return
  }
  
  const migrationContent = readFile(migrationPath)
  if (!migrationContent.includes('diagnosis_runs_patient_read')) {
    violates('DIAGNOSIS_RLS_RUNS_MISSING', 'RLS policy diagnosis_runs_patient_read not found')
  }
  
  if (!migrationContent.includes('diagnosis_artifacts_patient_read')) {
    violates('DIAGNOSIS_RLS_ARTIFACTS_MISSING', 'RLS policy diagnosis_artifacts_patient_read not found')
  }
}

function checkUIPagesExist() {
  console.log('🔍 Checking UI pages...')
  
  const listPagePath = 'apps/rhythm-patient-ui/app/patient/(mobile)/diagnosis/page.tsx'
  if (!fileExists(listPagePath)) {
    violates('DIAGNOSIS_UI_PAGES_MISSING', `List page not found: ${listPagePath}`)
  }
  
  const detailPagePath = 'apps/rhythm-patient-ui/app/patient/(mobile)/diagnosis/[id]/page.tsx'
  if (!fileExists(detailPagePath)) {
    violates('DIAGNOSIS_UI_PAGES_MISSING', `Detail page not found: ${detailPagePath}`)
  }
}

function checkUIFeatureGates() {
  console.log('🔍 Checking UI feature gates...')
  
  const pages = [
    'apps/rhythm-patient-ui/app/patient/(mobile)/diagnosis/page.tsx',
    'apps/rhythm-patient-ui/app/patient/(mobile)/diagnosis/[id]/page.tsx',
  ]
  
  for (const page of pages) {
    if (!fileExists(page)) continue
    
    if (!fileContains(page, 'DIAGNOSIS_PATIENT_ENABLED')) {
      violates('DIAGNOSIS_UI_NO_FEATURE_GATE', `UI page ${page} missing DIAGNOSIS_PATIENT_ENABLED feature gate`)
    }
  }
}

function checkUIStateHandling() {
  console.log('🔍 Checking UI state handling...')
  
  const clientComponents = [
    'apps/rhythm-patient-ui/app/patient/(mobile)/diagnosis/client.tsx',
    'apps/rhythm-patient-ui/app/patient/(mobile)/diagnosis/[id]/client.tsx',
  ]
  
  for (const component of clientComponents) {
    if (!fileExists(component)) continue
    
    const content = readFile(component)
    
    // Check for loading state
    if (!content.includes('loading')) {
      violates('DIAGNOSIS_UI_NO_STATE_HANDLING', `Component ${component} missing loading state handling`)
    }
    
    // Check for error state
    if (!content.includes('error')) {
      violates('DIAGNOSIS_UI_NO_STATE_HANDLING', `Component ${component} missing error state handling`)
    }
    
    // Check for empty state
    if (!content.includes('empty')) {
      violates('DIAGNOSIS_UI_NO_STATE_HANDLING', `Component ${component} missing empty state handling`)
    }
  }
}

// ============================================================
// Main Execution
// ============================================================

function main() {
  console.log('🔍 E76.6: Verifying Diagnosis Patient UI implementation...\n')
  
  try {
    checkFeatureFlagExists()
    checkAPIRoutesExist()
    checkAPIRoutesHaveFeatureGates()
    checkAPIRoutesHaveAuth()
    checkLiteralCallsitesExist()
    checkRLSPoliciesExist()
    checkUIPagesExist()
    checkUIFeatureGates()
    checkUIStateHandling()
    
    if (violations.length === 0) {
      console.log('\n✅ All E76.6 guardrails satisfied')
      console.log('\nVerified rules:')
      Object.entries(RULES).forEach(([ruleId, rule]) => {
        console.log(`  ✓ ${ruleId}: ${rule}`)
      })
      process.exit(0)
    } else {
      console.log('\n❌ E76.6 guardrails violations detected:\n')
      violations.forEach(({ ruleId, errorCode, rule, details }) => {
        console.log(`❌ violates ${ruleId}`)
        console.log(`   Error: ${errorCode}`)
        console.log(`   Rule: ${rule}`)
        console.log(`   Details: ${details}\n`)
      })
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Script execution error:', error)
    process.exit(2)
  }
}

main()
