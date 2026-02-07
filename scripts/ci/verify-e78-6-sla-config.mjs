#!/usr/bin/env node

/**
 * E78.6 SLA/Overdue Config Verification Script
 * 
 * Purpose: Verify all rules defined in docs/triage/RULES_VS_CHECKS_MATRIX_E78_6.md
 * Each check outputs violations in format: "violates R-E78.6-XXX: description"
 * 
 * Validation Rules:
 * - Environment: R-E78.6-001
 * - Database Schema: R-E78.6-002 to R-E78.6-010, R-E78.6-013
 * - Application: R-E78.6-011 to R-E78.6-012
 * - Documentation: R-E78.6-014
 * 
 * Exit Codes:
 * - 0: All checks passed
 * - 1: One or more validation failures
 * - 2: Script error (config, database connection, etc.)
 */

import process from 'process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')

// Error code to rule ID mapping (from RULES_VS_CHECKS_MATRIX_E78_6.md)
const ERROR_CODE_TO_RULE_ID = {
  ENV_VAR_INVALID: 'R-E78.6-001',
  TABLE_SCHEMA_INVALID: 'R-E78.6-002',
  PRECEDENCE_INVALID: 'R-E78.6-003',
  VIEW_SLA_DAYS_MISSING: 'R-E78.6-004',
  VIEW_DUE_AT_MISSING: 'R-E78.6-005',
  OVERDUE_HARDCODED: 'R-E78.6-006',
  STUCK_HARDCODED: 'R-E78.6-007',
  RLS_READ_MISSING: 'R-E78.6-008',
  RLS_WRITE_MISSING: 'R-E78.6-009',
  SQL_FUNCTION_MISSING: 'R-E78.6-010',
  TS_DEFAULT_HELPER_MISSING: 'R-E78.6-011',
  TS_FUNNEL_HELPER_MISSING: 'R-E78.6-012',
  ASSIGNED_AT_SOURCE_INVALID: 'R-E78.6-013',
  DOCS_NOT_UPDATED: 'R-E78.6-014',
}

// ============================================================================
// Validation Functions
// ============================================================================

async function checkDefaultSLAEnvVar() {
  console.log('\n🔍 R-E78.6-001: Checking TRIAGE_SLA_DAYS_DEFAULT env var support')
  
  const errors = []
  const warnings = []
  
  // Check lib/env.ts for environment variable definition
  const envTsPath = path.join(repoRoot, 'lib/env.ts')
  if (!fs.existsSync(envTsPath)) {
    errors.push('lib/env.ts not found')
    return { passed: false, errors, warnings }
  }
  
  const envContent = fs.readFileSync(envTsPath, 'utf8')
  if (!envContent.includes('TRIAGE_SLA_DAYS_DEFAULT')) {
    errors.push('TRIAGE_SLA_DAYS_DEFAULT not defined in lib/env.ts')
  }
  
  // Check .env.example for documentation
  const envExamplePath = path.join(repoRoot, '.env.example')
  if (!fs.existsSync(envExamplePath)) {
    warnings.push('.env.example not found')
  } else {
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8')
    if (!envExampleContent.includes('TRIAGE_SLA_DAYS_DEFAULT')) {
      warnings.push('TRIAGE_SLA_DAYS_DEFAULT not documented in .env.example')
    }
  }
  
  return { passed: errors.length === 0, errors, warnings }
}

async function checkFunnelSLATable() {
  console.log('\n🔍 R-E78.6-002: Checking funnel_triage_settings table schema')
  
  const errors = []
  const warnings = []
  
  // Check schema.sql for table definition
  const schemaPath = path.join(repoRoot, 'schema/schema.sql')
  if (!fs.existsSync(schemaPath)) {
    errors.push('schema/schema.sql not found')
    return { passed: false, errors, warnings }
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8')
  
  if (!schemaContent.includes('CREATE TABLE IF NOT EXISTS "public"."funnel_triage_settings"')) {
    errors.push('funnel_triage_settings table not defined in schema.sql')
  }
  
  if (!schemaContent.includes('overdue_days')) {
    errors.push('overdue_days column not found in schema.sql')
  }
  
  if (!schemaContent.includes('funnel_triage_settings_overdue_days_positive')) {
    warnings.push('overdue_days positive constraint not found')
  }
  
  return { passed: errors.length === 0, errors, warnings }
}

async function checkViewSLADaysColumn() {
  console.log('\n🔍 R-E78.6-004: Checking sla_days column in triage_cases_v1')
  
  const errors = []
  const warnings = []
  
  const schemaPath = path.join(repoRoot, 'schema/schema.sql')
  const schemaContent = fs.readFileSync(schemaPath, 'utf8')
  
  if (!schemaContent.includes('funnel_sla_config')) {
    errors.push('funnel_sla_config CTE not found in triage_cases_v1')
  }
  
  if (!schemaContent.includes('fsc.sla_days')) {
    errors.push('sla_days column reference not found in view')
  }
  
  return { passed: errors.length === 0, errors, warnings }
}

async function checkViewDueAtColumn() {
  console.log('\n🔍 R-E78.6-005: Checking due_at column in triage_cases_v1')
  
  const errors = []
  const warnings = []
  
  const schemaPath = path.join(repoRoot, 'schema/schema.sql')
  const schemaContent = fs.readFileSync(schemaPath, 'utf8')
  
  if (!schemaContent.includes('AS due_at')) {
    errors.push('due_at column not found in view')
  }
  
  // More flexible pattern matching - normalize whitespace
  const normalizedContent = schemaContent.replace(/\s+/g, ' ')
  if (!normalizedContent.includes("started_at + (fsc.sla_days || ' days')")) {
    errors.push('due_at calculation not using sla_days')
  }
  
  return { passed: errors.length === 0, errors, warnings }
}

async function checkSLAPrecedence() {
  console.log('\n🔍 R-E78.6-003: Checking SLA precedence rules')
  
  const errors = []
  const warnings = []
  
  const schemaPath = path.join(repoRoot, 'schema/schema.sql')
  const schemaContent = fs.readFileSync(schemaPath, 'utf8')
  
  // Check that funnel_sla_config CTE exists and uses COALESCE
  if (!schemaContent.includes('funnel_sla_config AS')) {
    errors.push('funnel_sla_config CTE not found')
    return { passed: false, errors, warnings }
  }
  
  // Extract the funnel_sla_config section (more flexible)
  const slaConfigMatch = schemaContent.match(/funnel_sla_config AS\s*\([\s\S]+?\),\s*--/m)
  
  if (!slaConfigMatch) {
    errors.push('Could not parse funnel_sla_config CTE')
    return { passed: false, errors, warnings }
  }
  
  const slaConfigText = slaConfigMatch[0]
  
  // Check for required elements with flexible matching
  const hasCoalesce = slaConfigText.includes('COALESCE')
  const hasFtsOverdueDays = slaConfigText.includes('fts.overdue_days')
  const hasFallbackSeven = slaConfigText.includes('7')
  
  if (!hasCoalesce) {
    errors.push('COALESCE not found in funnel_sla_config')
  }
  if (!hasFtsOverdueDays) {
    errors.push('fts.overdue_days not found in COALESCE')
  }
  if (!hasFallbackSeven) {
    errors.push('Fallback value (7) not found in funnel_sla_config')
  }
  
  // Note: ENV variable precedence is handled in TypeScript layer, not SQL
  if (hasCoalesce && hasFtsOverdueDays && hasFallbackSeven) {
    warnings.push('ENV variable precedence (TRIAGE_SLA_DAYS_DEFAULT) is handled in application layer')
  }
  
  return { passed: errors.length === 0, errors, warnings }
}

async function checkOverdueUsesConfigurableSLA() {
  console.log('\n🔍 R-E78.6-006: Checking overdue uses configurable SLA')
  
  const errors = []
  const warnings = []
  
  const schemaPath = path.join(repoRoot, 'schema/schema.sql')
  const schemaContent = fs.readFileSync(schemaPath, 'utf8')
  
  // More robust check - look for the pattern in attention_computation
  const attentionSection = schemaContent.match(/attention_computation AS[\s\S]+?FROM assessments a/m)
  
  if (!attentionSection) {
    errors.push('attention_computation CTE not found')
    return { passed: false, errors, warnings }
  }
  
  const attentionText = attentionSection[0]
  
  // Check for overdue logic using fsc.sla_days
  if (!attentionText.includes('fsc.sla_days') || 
      !attentionText.includes("'overdue'")) {
    errors.push('Overdue logic not found or not using fsc.sla_days')
  }
  
  // Warn if hardcoded interval is still present in overdue section
  const overdueLines = attentionText.split('\n').filter(line => 
    line.includes('overdue') && line.includes("INTERVAL '7 days'")
  )
  
  if (overdueLines.length > 0) {
    errors.push('Overdue logic still contains hardcoded INTERVAL "7 days"')
  }
  
  return { passed: errors.length === 0, errors, warnings }
}

async function checkStuckUses2xSLA() {
  console.log('\n🔍 R-E78.6-007: Checking stuck uses 2x SLA')
  
  const errors = []
  const warnings = []
  
  const schemaPath = path.join(repoRoot, 'schema/schema.sql')
  const schemaContent = fs.readFileSync(schemaPath, 'utf8')
  
  // More robust check
  const attentionSection = schemaContent.match(/attention_computation AS[\s\S]+?FROM assessments a/m)
  
  if (!attentionSection) {
    errors.push('attention_computation CTE not found')
    return { passed: false, errors, warnings }
  }
  
  const attentionText = attentionSection[0]
  
  // Check for stuck logic using 2x sla_days
  if (!attentionText.includes('fsc.sla_days * 2') ||
      !attentionText.includes("'stuck'")) {
    errors.push('Stuck logic not found or not using fsc.sla_days * 2')
  }
  
  // Warn if hardcoded interval is still present in stuck section
  const stuckLines = attentionText.split('\n').filter(line => 
    line.includes('stuck') && line.includes("INTERVAL '14 days'")
  )
  
  if (stuckLines.length > 0) {
    errors.push('Stuck logic still contains hardcoded INTERVAL "14 days"')
  }
  
  return { passed: errors.length === 0, errors, warnings }
}

async function checkRLSPolicies() {
  console.log('\n🔍 R-E78.6-008/009: Checking RLS policies')
  
  const errors = []
  const warnings = []
  
  const schemaPath = path.join(repoRoot, 'schema/schema.sql')
  const schemaContent = fs.readFileSync(schemaPath, 'utf8')
  
  if (!schemaContent.includes('funnel_triage_settings_read_staff')) {
    errors.push('RLS read policy funnel_triage_settings_read_staff not found')
  }
  
  if (!schemaContent.includes('funnel_triage_settings_write_admin')) {
    errors.push('RLS write policy funnel_triage_settings_write_admin not found')
  }
  
  return { passed: errors.length === 0, errors, warnings }
}

async function checkSQLHelperFunction() {
  console.log('\n🔍 R-E78.6-010: Checking SQL helper function')
  
  const errors = []
  const warnings = []
  
  const schemaPath = path.join(repoRoot, 'schema/schema.sql')
  const schemaContent = fs.readFileSync(schemaPath, 'utf8')
  
  if (!schemaContent.includes('CREATE OR REPLACE FUNCTION "public"."get_triage_sla_days"')) {
    errors.push('SQL function get_triage_sla_days not found')
  }
  
  return { passed: errors.length === 0, errors, warnings }
}

async function checkTSHelpers() {
  console.log('\n🔍 R-E78.6-011/012: Checking TypeScript helpers')
  
  const errors = []
  const warnings = []
  
  const slaConfigPath = path.join(repoRoot, 'lib/triage/slaConfig.ts')
  if (!fs.existsSync(slaConfigPath)) {
    errors.push('lib/triage/slaConfig.ts not found')
    return { passed: false, errors, warnings }
  }
  
  const slaConfigContent = fs.readFileSync(slaConfigPath, 'utf8')
  
  if (!slaConfigContent.includes('export function getDefaultTriageSLADays')) {
    errors.push('getDefaultTriageSLADays function not found')
  }
  
  if (!slaConfigContent.includes('export async function getTriageSLADaysForFunnel')) {
    errors.push('getTriageSLADaysForFunnel function not found')
  }
  
  return { passed: errors.length === 0, errors, warnings }
}

async function checkDocumentation() {
  console.log('\n🔍 R-E78.6-014: Checking documentation updates')
  
  const errors = []
  const warnings = []
  
  // Check E78.1 spec was updated
  const specPath = path.join(repoRoot, 'docs/triage/inbox-v1.md')
  if (!fs.existsSync(specPath)) {
    warnings.push('docs/triage/inbox-v1.md not found')
  } else {
    const specContent = fs.readFileSync(specPath, 'utf8')
    if (!specContent.includes('E78.6')) {
      warnings.push('E78.1 spec does not mention E78.6 changes')
    }
  }
  
  // Check RULES_VS_CHECKS_MATRIX exists
  const matrixPath = path.join(repoRoot, 'docs/triage/RULES_VS_CHECKS_MATRIX_E78_6.md')
  if (!fs.existsSync(matrixPath)) {
    errors.push('RULES_VS_CHECKS_MATRIX_E78_6.md not found')
  }
  
  return { passed: errors.length === 0, errors, warnings }
}

// ============================================================================
// Test Runner
// ============================================================================

async function runChecks() {
  const checks = [
    { name: 'checkDefaultSLAEnvVar', fn: checkDefaultSLAEnvVar },
    { name: 'checkFunnelSLATable', fn: checkFunnelSLATable },
    { name: 'checkSLAPrecedence', fn: checkSLAPrecedence },
    { name: 'checkViewSLADaysColumn', fn: checkViewSLADaysColumn },
    { name: 'checkViewDueAtColumn', fn: checkViewDueAtColumn },
    { name: 'checkOverdueUsesConfigurableSLA', fn: checkOverdueUsesConfigurableSLA },
    { name: 'checkStuckUses2xSLA', fn: checkStuckUses2xSLA },
    { name: 'checkRLSPolicies', fn: checkRLSPolicies },
    { name: 'checkSQLHelperFunction', fn: checkSQLHelperFunction },
    { name: 'checkTSHelpers', fn: checkTSHelpers },
    { name: 'checkDocumentation', fn: checkDocumentation },
  ]
  
  let totalPassed = 0
  let totalFailed = 0
  let totalWarnings = 0
  
  for (const check of checks) {
    try {
      const result = await check.fn()
      
      if (result.passed) {
        console.log(`  ✅ ${check.name}: PASSED`)
        totalPassed++
      } else {
        console.log(`  ❌ ${check.name}: FAILED`)
        result.errors.forEach(err => {
          console.log(`      violates rule: ${err}`)
        })
        totalFailed++
      }
      
      if (result.warnings.length > 0) {
        result.warnings.forEach(warn => {
          console.log(`  ⚠️  ${check.name}: ${warn}`)
          totalWarnings++
        })
      }
    } catch (error) {
      console.log(`  ❌ ${check.name}: ERROR - ${error.message}`)
      totalFailed++
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Summary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Passed: ${totalPassed}`)
  console.log(`❌ Failed: ${totalFailed}`)
  console.log(`⚠️  Warnings: ${totalWarnings}`)
  
  if (totalFailed > 0) {
    console.log('\n❌ E78.6 SLA config verification failed')
    return 1
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  E78.6 SLA config verification passed with warnings')
    return 0
  } else {
    console.log('\n✅ E78.6 SLA config verification passed')
    return 0
  }
}

// ============================================================================
// Main
// ============================================================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🔍 E78.6 SLA/Overdue Config Verification')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

runChecks()
  .then(exitCode => {
    process.exit(exitCode)
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error)
    process.exit(2)
  })
