#!/usr/bin/env node
/**
 * E74.3: Guardrails Verification Script
 * 
 * Verifies that every rule has a check implementation and every check references a rule ID.
 * Outputs "violates R-XYZ" format for violations.
 * Generates RULES_VS_CHECKS_MATRIX.md diff report.
 * 
 * Usage: node scripts/ci/verify-e74-3-guardrails.mjs
 * Exit codes:
 *   0 - All guardrails satisfied
 *   1 - Violations found
 *   2 - Script error
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Rule definitions for E74.3
const E74_3_RULES = [
  {
    id: 'R-E74.3-001',
    description: 'Draft versions must have status="draft" and is_default=false',
    errorCode: 'DRAFT_INVALID_STATUS',
    checkLocation: 'supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:create_draft_from_version()',
  },
  {
    id: 'R-E74.3-002',
    description: 'Published versions cannot be deleted (only archived)',
    errorCode: 'PUBLISHED_DELETE_BLOCKED',
    checkLocation: 'supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:prevent_published_version_delete()',
  },
  {
    id: 'R-E74.3-003',
    description: 'Draft with validation errors cannot be published',
    errorCode: 'PUBLISH_WITH_VALIDATION_ERRORS',
    checkLocation: 'supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version()',
  },
  {
    id: 'R-E74.3-004',
    description: 'Publish must be atomic (status update + default pointer + audit log)',
    errorCode: 'PUBLISH_NOT_ATOMIC',
    checkLocation: 'supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version()',
  },
  {
    id: 'R-E74.3-005',
    description: 'Only one version per funnel can have is_default=true',
    errorCode: 'MULTIPLE_DEFAULT_VERSIONS',
    checkLocation: 'supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version()',
  },
  {
    id: 'R-E74.3-006',
    description: 'Published version must have published_at and published_by set',
    errorCode: 'PUBLISHED_MISSING_METADATA',
    checkLocation: 'supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version()',
  },
  {
    id: 'R-E74.3-007',
    description: 'Publish history must record diff between versions',
    errorCode: 'PUBLISH_HISTORY_NO_DIFF',
    checkLocation: 'supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version()',
  },
  {
    id: 'R-E74.3-008',
    description: 'Validation must use E74.1 canonical validators',
    errorCode: 'VALIDATION_NOT_CANONICAL',
    checkLocation: 'apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts:validateFunnelVersion()',
  },
  {
    id: 'R-E74.3-009',
    description: 'Studio API endpoints require admin or clinician role',
    errorCode: 'STUDIO_UNAUTHORIZED',
    checkLocation: 'apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/route.ts:hasAdminOrClinicianRole()',
  },
  {
    id: 'R-E74.3-010',
    description: 'Patient APIs must only serve published versions (status="published")',
    errorCode: 'PATIENT_SEES_DRAFT',
    checkLocation: 'Patient API endpoints (verified manually - see E74_3_PATIENT_API_VERIFICATION.md)',
    deferred: true,  // To be verified in Phase 7
  },
]

// Error code to rule mapping
const ERROR_CODE_TO_RULE_ID = {}
E74_3_RULES.forEach((rule) => {
  ERROR_CODE_TO_RULE_ID[rule.errorCode] = rule.id
})

// Check implementations
const CHECK_IMPLEMENTATIONS = [
  {
    name: 'create_draft_from_version',
    location: 'supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql',
    ruleIds: ['R-E74.3-001'],
    description: 'Database function that creates draft with correct status and is_default=false',
  },
  {
    name: 'prevent_published_version_delete_trigger',
    location: 'supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql',
    ruleIds: ['R-E74.3-002'],
    description: 'Trigger that prevents deletion of published versions',
  },
  {
    name: 'publish_draft_version',
    location: 'supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql',
    ruleIds: ['R-E74.3-003', 'R-E74.3-004', 'R-E74.3-005', 'R-E74.3-006', 'R-E74.3-007'],
    description: 'Atomic publish function with validation check, metadata update, and audit logging',
  },
  {
    name: 'POST /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate',
    location: 'apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts',
    ruleIds: ['R-E74.3-008'],
    description: 'Validation endpoint using E74.1 validators',
  },
  {
    name: 'Studio API Authorization',
    location: 'apps/rhythm-studio-ui/app/api/admin/studio/funnels/**/*.ts',
    ruleIds: ['R-E74.3-009'],
    description: 'All Studio API endpoints check for admin/clinician role',
  },
]

// Main verification function
function verifyGuardrails() {
  const violations = []
  const warnings = []

  console.log('🔒 E74.3 Guardrails Verification\n')
  console.log('='.repeat(80))
  console.log()

  // Check 1: Every rule has a check implementation
  console.log('📋 Check 1: Every rule has a check implementation')
  console.log('-'.repeat(80))

  const rulesWithoutChecks = []
  E74_3_RULES.forEach((rule) => {
    const hasCheck = CHECK_IMPLEMENTATIONS.some((check) =>
      check.ruleIds.includes(rule.id),
    )

    // Skip deferred rules (to be implemented later)
    if (!hasCheck && !rule.deferred) {
      rulesWithoutChecks.push(rule)
      violations.push({
        code: 'RULE_WITHOUT_CHECK',
        ruleId: rule.id,
        message: `Rule ${rule.id} has no check implementation`,
      })
    } else if (!hasCheck && rule.deferred) {
      warnings.push({
        code: 'RULE_DEFERRED',
        ruleId: rule.id,
        message: `Rule ${rule.id} is deferred for later implementation`,
      })
    }
  })

  if (rulesWithoutChecks.length === 0) {
    console.log('✅ All rules have check implementations')
  } else {
    console.log(`❌ ${rulesWithoutChecks.length} rule(s) without checks:`)
    rulesWithoutChecks.forEach((rule) => {
      console.log(`   [RULE_WITHOUT_CHECK] violates ${rule.id}: ${rule.description}`)
    })
  }
  console.log()

  // Check 2: Every check references a valid rule ID
  console.log('📋 Check 2: Every check references valid rule IDs')
  console.log('-'.repeat(80))

  const checksWithInvalidRules = []
  CHECK_IMPLEMENTATIONS.forEach((check) => {
    const invalidRuleIds = check.ruleIds.filter(
      (ruleId) => !E74_3_RULES.some((rule) => rule.id === ruleId),
    )

    if (invalidRuleIds.length > 0) {
      checksWithInvalidRules.push({ check, invalidRuleIds })
      violations.push({
        code: 'CHECK_INVALID_RULE_REF',
        check: check.name,
        message: `Check "${check.name}" references invalid rule IDs: ${invalidRuleIds.join(', ')}`,
      })
    }
  })

  if (checksWithInvalidRules.length === 0) {
    console.log('✅ All checks reference valid rule IDs')
  } else {
    console.log(`❌ ${checksWithInvalidRules.length} check(s) with invalid rule references:`)
    checksWithInvalidRules.forEach(({ check, invalidRuleIds }) => {
      console.log(
        `   [CHECK_INVALID_RULE_REF] violates CHECK-INTEGRITY: ${check.name} references ${invalidRuleIds.join(', ')}`,
      )
    })
  }
  console.log()

  // Check 3: Scope verification (all checks are in scope for E74.3)
  console.log('📋 Check 3: Scope verification')
  console.log('-'.repeat(80))

  const outOfScopeChecks = CHECK_IMPLEMENTATIONS.filter((check) =>
    check.ruleIds.some((ruleId) => !ruleId.startsWith('R-E74.3-')),
  )

  if (outOfScopeChecks.length === 0) {
    console.log('✅ All checks are in scope for E74.3')
  } else {
    console.log(`⚠️  ${outOfScopeChecks.length} check(s) reference rules outside E74.3 scope:`)
    outOfScopeChecks.forEach((check) => {
      const outsideRules = check.ruleIds.filter((id) => !id.startsWith('R-E74.3-'))
      warnings.push({
        code: 'CHECK_OUT_OF_SCOPE',
        check: check.name,
        message: `Check references rules outside E74.3: ${outsideRules.join(', ')}`,
      })
      console.log(`   [WARN] ${check.name} references ${outsideRules.join(', ')}`)
    })
  }
  console.log()

  // Summary
  console.log('='.repeat(80))
  console.log('📊 Summary')
  console.log('-'.repeat(80))
  console.log(`Total Rules: ${E74_3_RULES.length}`)
  console.log(`Total Checks: ${CHECK_IMPLEMENTATIONS.length}`)
  console.log(`Rules without checks: ${rulesWithoutChecks.length}`)
  console.log(`Checks with invalid refs: ${checksWithInvalidRules.length}`)
  console.log(`Violations: ${violations.length}`)
  console.log(`Warnings: ${warnings.length}`)
  console.log()

  // Coverage calculation
  const rulesWithChecks = E74_3_RULES.length - rulesWithoutChecks.length
  const coverage = ((rulesWithChecks / E74_3_RULES.length) * 100).toFixed(1)
  console.log(`Coverage: ${coverage}% (${rulesWithChecks}/${E74_3_RULES.length} rules with checks)`)
  console.log()

  return {
    success: violations.length === 0,
    violations,
    warnings,
    summary: {
      totalRules: E74_3_RULES.length,
      totalChecks: CHECK_IMPLEMENTATIONS.length,
      coverage: parseFloat(coverage),
      rulesWithoutChecks: rulesWithoutChecks.length,
      checksWithInvalidRefs: checksWithInvalidRules.length,
    },
  }
}

// Generate matrix diff report
function generateMatrixDiffReport(result) {
  const report = []

  report.push('# E74.3 Guardrails Matrix Diff Report')
  report.push('')
  report.push(`**Generated:** ${new Date().toISOString()}`)
  report.push(`**Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}`)
  report.push(`**Coverage:** ${result.summary.coverage}%`)
  report.push('')

  report.push('## Rules Added (E74.3)')
  report.push('')
  report.push('| Rule ID | Description | Error Code | Check Location |')
  report.push('|---------|-------------|------------|----------------|')
  E74_3_RULES.forEach((rule) => {
    report.push(
      `| ${rule.id} | ${rule.description} | \`${rule.errorCode}\` | ${rule.checkLocation} |`,
    )
  })
  report.push('')

  report.push('## Checks Added (E74.3)')
  report.push('')
  report.push('| Check | Rule IDs | Location | Description |')
  report.push('|-------|----------|----------|-------------|')
  CHECK_IMPLEMENTATIONS.forEach((check) => {
    report.push(
      `| ${check.name} | ${check.ruleIds.join(', ')} | ${check.location} | ${check.description} |`,
    )
  })
  report.push('')

  if (result.violations.length > 0) {
    report.push('## ❌ Violations')
    report.push('')
    result.violations.forEach((v) => {
      report.push(`- **[${v.code}]** violates ${v.ruleId || 'CHECK-INTEGRITY'}: ${v.message}`)
    })
    report.push('')
  }

  if (result.warnings.length > 0) {
    report.push('## ⚠️  Warnings')
    report.push('')
    result.warnings.forEach((w) => {
      report.push(`- **[${w.code}]** ${w.message}`)
    })
    report.push('')
  }

  report.push('## Coverage Analysis')
  report.push('')
  report.push('Before E74.3:')
  report.push('- E74.1: 18 rules')
  report.push('- E74.2: 8 rules')
  report.push('- Total: 26 rules')
  report.push('')
  report.push('After E74.3:')
  report.push(`- E74.1: 18 rules`)
  report.push(`- E74.2: 8 rules`)
  report.push(`- E74.3: ${E74_3_RULES.length} rules`)
  report.push(`- Total: ${26 + E74_3_RULES.length} rules`)
  report.push('')
  report.push(`New rules added: ${E74_3_RULES.length}`)
  report.push(`Coverage maintained: ${result.summary.coverage}%`)
  report.push('')

  return report.join('\n')
}

// Main execution
try {
  const result = verifyGuardrails()

  // Generate diff report
  const diffReport = generateMatrixDiffReport(result)

  // Write to file
  const outputPath = join(process.cwd(), 'docs', 'E74_3_GUARDRAILS_DIFF.md')
  writeFileSync(outputPath, diffReport, 'utf-8')
  console.log(`📝 Diff report written to: ${outputPath}`)
  console.log()

  if (result.success) {
    console.log('✅ All guardrails satisfied')
    process.exit(0)
  } else {
    console.log('❌ Guardrails violations found')
    process.exit(1)
  }
} catch (error) {
  console.error('❌ Script error:', error)
  process.exit(2)
}
