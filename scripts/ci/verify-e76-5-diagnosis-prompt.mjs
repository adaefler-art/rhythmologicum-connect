#!/usr/bin/env node
/**
 * E76.5: Diagnosis Prompt Schema Verification Script
 * 
 * Verifies that E76.5 requirements are met:
 * - Diagnosis prompt output schema (v1) exists in contracts
 * - Diagnosis prompt exists in prompt registry with correct version
 * - API route /api/studio/diagnosis/prompt exists
 * - Literal callsite exists in test page
 * - Feature flag DIAGNOSIS_PROMPT_ENABLED exists
 * - Schema includes required fields: summary, patient_context_used, differential_diagnoses, recommended_next_steps, urgent_red_flags, disclaimer
 * - Prompt includes medical advice guardrails
 * 
 * Usage: node scripts/ci/verify-e76-5-diagnosis-prompt.mjs
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

// Rule definitions for E76.5
const E76_5_RULES = [
  {
    id: 'R-E76.5-001',
    description: 'Diagnosis prompt output schema (v1) must exist at lib/contracts/diagnosis-prompt.ts',
    errorCode: 'DIAGNOSIS_PROMPT_SCHEMA_MISSING',
  },
  {
    id: 'R-E76.5-002',
    description: 'Schema must include all required fields (summary, patient_context_used, differential_diagnoses, recommended_next_steps, urgent_red_flags, disclaimer)',
    errorCode: 'DIAGNOSIS_PROMPT_SCHEMA_INCOMPLETE',
  },
  {
    id: 'R-E76.5-003',
    description: 'Diagnosis prompt must exist in lib/prompts/registry.ts with version v1.0.0',
    errorCode: 'DIAGNOSIS_PROMPT_MISSING',
  },
  {
    id: 'R-E76.5-004',
    description: 'Prompt must include medical advice guardrails in system prompt',
    errorCode: 'DIAGNOSIS_PROMPT_NO_GUARDRAILS',
  },
  {
    id: 'R-E76.5-005',
    description: 'API route /api/studio/diagnosis/prompt must exist',
    errorCode: 'DIAGNOSIS_PROMPT_API_MISSING',
  },
  {
    id: 'R-E76.5-006',
    description: 'Literal callsite for /api/studio/diagnosis/prompt must exist',
    errorCode: 'DIAGNOSIS_PROMPT_LITERAL_MISSING',
  },
  {
    id: 'R-E76.5-007',
    description: 'Feature flag DIAGNOSIS_PROMPT_ENABLED must exist',
    errorCode: 'DIAGNOSIS_PROMPT_FEATURE_FLAG_MISSING',
  },
  {
    id: 'R-E76.5-008',
    description: 'API route must check authorization (clinician/admin only)',
    errorCode: 'DIAGNOSIS_PROMPT_NO_AUTHORIZATION',
  },
  {
    id: 'R-E76.5-009',
    description: 'Prompt bundle version and prompt version constants must be defined',
    errorCode: 'DIAGNOSIS_PROMPT_VERSION_MISSING',
  },
  {
    id: 'R-E76.5-010',
    description: 'Schema must include validation helpers',
    errorCode: 'DIAGNOSIS_PROMPT_VALIDATION_HELPERS_MISSING',
  },
]

// Error code to rule mapping
const ERROR_CODE_TO_RULE_ID = {}
E76_5_RULES.forEach((rule) => {
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

function checkDiagnosisPromptSchemaExists() {
  const schemaPath = join(REPO_ROOT, 'lib', 'contracts', 'diagnosis-prompt.ts')
  if (!existsSync(schemaPath)) {
    reportViolation(
      'DIAGNOSIS_PROMPT_SCHEMA_MISSING',
      `File not found: ${schemaPath}`,
    )
    return
  }

  try {
    const content = readFileSync(schemaPath, 'utf8')

    // Check for required exports
    const requiredExports = [
      'DiagnosisPromptOutputV1Schema',
      'DIAGNOSIS_PROMPT_BUNDLE_VERSION',
      'DIAGNOSIS_PROMPT_VERSION',
      'DIAGNOSIS_SCHEMA_VERSION',
      'validateDiagnosisPromptOutputV1',
    ]

    for (const exportName of requiredExports) {
      if (!content.includes(exportName)) {
        if (exportName === 'validateDiagnosisPromptOutputV1') {
          reportViolation(
            'DIAGNOSIS_PROMPT_VALIDATION_HELPERS_MISSING',
            `Schema missing validation helper: ${exportName}`,
          )
        } else if (exportName.includes('VERSION')) {
          reportViolation(
            'DIAGNOSIS_PROMPT_VERSION_MISSING',
            `Schema missing version constant: ${exportName}`,
          )
        } else {
          reportViolation(
            'DIAGNOSIS_PROMPT_SCHEMA_MISSING',
            `Schema missing required export: ${exportName}`,
          )
        }
      }
    }

    // Check for required schema fields
    const requiredFields = [
      'summary',
      'patient_context_used',
      'differential_diagnoses',
      'recommended_next_steps',
      'urgent_red_flags',
      'disclaimer',
    ]

    for (const field of requiredFields) {
      if (!content.includes(field)) {
        reportViolation(
          'DIAGNOSIS_PROMPT_SCHEMA_INCOMPLETE',
          `Schema missing required field: ${field}`,
        )
      }
    }

    // Check for Zod imports
    if (!content.includes("import { z } from 'zod'")) {
      reportViolation(
        'DIAGNOSIS_PROMPT_SCHEMA_MISSING',
        'Schema does not import Zod for validation',
      )
    }

    // Check for validation helpers
    const validationHelpers = [
      'hasValidDisclaimer',
      'hasEmergentRedFlags',
      'getHighestPriorityRecommendation',
      'getMostConfidentDifferential',
    ]

    for (const helper of validationHelpers) {
      if (!content.includes(helper)) {
        reportViolation(
          'DIAGNOSIS_PROMPT_VALIDATION_HELPERS_MISSING',
          `Schema missing validation helper function: ${helper}`,
        )
      }
    }
  } catch (error) {
    reportViolation(
      'DIAGNOSIS_PROMPT_SCHEMA_MISSING',
      `Error reading schema: ${error.message}`,
    )
  }
}

function checkDiagnosisPromptExists() {
  const registryPath = join(REPO_ROOT, 'lib', 'prompts', 'registry.ts')
  if (!existsSync(registryPath)) {
    reportViolation(
      'DIAGNOSIS_PROMPT_MISSING',
      `File not found: ${registryPath}`,
    )
    return
  }

  try {
    const content = readFileSync(registryPath, 'utf8')

    // Check for diagnosis prompt entry
    if (!content.includes("'diagnosis-v1.0.0'")) {
      reportViolation(
        'DIAGNOSIS_PROMPT_MISSING',
        'Prompt registry does not contain diagnosis-v1.0.0 entry',
      )
      return
    }

    // Check for system prompt with guardrails
    const guardrailChecks = [
      'NOT providing medical advice',
      'for clinician review ONLY',
      'NOT make final diagnoses',
      'NOT prescribe treatments',
      'NOT replace clinical judgment',
    ]

    for (const check of guardrailChecks) {
      if (!content.includes(check)) {
        reportViolation(
          'DIAGNOSIS_PROMPT_NO_GUARDRAILS',
          `Prompt missing guardrail text: "${check}"`,
        )
      }
    }

    // Check for metadata fields
    if (!content.includes('promptId') || !content.includes('version') || !content.includes('description')) {
      reportViolation(
        'DIAGNOSIS_PROMPT_MISSING',
        'Prompt missing required metadata fields',
      )
    }

    // Check for model config
    if (!content.includes('modelConfig') || !content.includes('provider')) {
      reportViolation(
        'DIAGNOSIS_PROMPT_MISSING',
        'Prompt missing model configuration',
      )
    }
  } catch (error) {
    reportViolation(
      'DIAGNOSIS_PROMPT_MISSING',
      `Error reading prompt registry: ${error.message}`,
    )
  }
}

function checkDiagnosisPromptAPIRouteExists() {
  const routePath = join(
    REPO_ROOT,
    'apps',
    'rhythm-studio-ui',
    'app',
    'api',
    'studio',
    'diagnosis',
    'prompt',
    'route.ts',
  )
  
  if (!existsSync(routePath)) {
    reportViolation(
      'DIAGNOSIS_PROMPT_API_MISSING',
      `File not found: ${routePath}`,
    )
    return
  }

  try {
    const content = readFileSync(routePath, 'utf8')

    // Check for GET and POST exports
    if (!content.includes('export async function GET')) {
      reportViolation(
        'DIAGNOSIS_PROMPT_API_MISSING',
        'API route does not export GET handler',
      )
    }

    if (!content.includes('export async function POST')) {
      reportViolation(
        'DIAGNOSIS_PROMPT_API_MISSING',
        'API route does not export POST handler',
      )
    }

    // Check for authorization
    if (!content.includes('clinician') && !content.includes('admin')) {
      reportViolation(
        'DIAGNOSIS_PROMPT_NO_AUTHORIZATION',
        'API route does not check for clinician/admin role',
      )
    }

    // Check for feature flag
    if (!content.includes('DIAGNOSIS_PROMPT_ENABLED')) {
      reportViolation(
        'DIAGNOSIS_PROMPT_API_MISSING',
        'API route does not check DIAGNOSIS_PROMPT_ENABLED feature flag',
      )
    }

    // Check for schema validation usage
    if (!content.includes('validateDiagnosisPromptOutputV1')) {
      reportViolation(
        'DIAGNOSIS_PROMPT_API_MISSING',
        'API route does not use validateDiagnosisPromptOutputV1',
      )
    }
  } catch (error) {
    reportViolation(
      'DIAGNOSIS_PROMPT_API_MISSING',
      `Error reading API route: ${error.message}`,
    )
  }
}

function checkDiagnosisPromptLiteralCallsiteExists() {
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
      'DIAGNOSIS_PROMPT_LITERAL_MISSING',
      `Test page not found: ${testPagePath}`,
    )
    return
  }

  try {
    const content = readFileSync(testPagePath, 'utf8')

    // Check for literal callsite
    if (!content.includes("'/api/studio/diagnosis/prompt'")) {
      reportViolation(
        'DIAGNOSIS_PROMPT_LITERAL_MISSING',
        'Test page does not contain literal string /api/studio/diagnosis/prompt',
      )
    }

    // Check for fetch call
    if (!content.includes('fetch')) {
      reportViolation(
        'DIAGNOSIS_PROMPT_LITERAL_MISSING',
        'Test page does not make fetch call to diagnosis prompt endpoint',
      )
    }

    // Check for E76.5 reference
    if (!content.includes('E76.5')) {
      reportViolation(
        'DIAGNOSIS_PROMPT_LITERAL_MISSING',
        'Test page does not reference E76.5',
      )
    }
  } catch (error) {
    reportViolation(
      'DIAGNOSIS_PROMPT_LITERAL_MISSING',
      `Error reading test page: ${error.message}`,
    )
  }
}

function checkDiagnosisPromptFeatureFlagExists() {
  const featureFlagsPath = join(REPO_ROOT, 'lib', 'featureFlags.ts')
  
  if (!existsSync(featureFlagsPath)) {
    reportViolation(
      'DIAGNOSIS_PROMPT_FEATURE_FLAG_MISSING',
      `File not found: ${featureFlagsPath}`,
    )
    return
  }

  try {
    const content = readFileSync(featureFlagsPath, 'utf8')

    // Check for DIAGNOSIS_PROMPT_ENABLED flag
    if (!content.includes('DIAGNOSIS_PROMPT_ENABLED')) {
      reportViolation(
        'DIAGNOSIS_PROMPT_FEATURE_FLAG_MISSING',
        'Feature flags file does not define DIAGNOSIS_PROMPT_ENABLED',
      )
    }

    // Check for environment variable
    if (!content.includes('NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED')) {
      reportViolation(
        'DIAGNOSIS_PROMPT_FEATURE_FLAG_MISSING',
        'Feature flags file does not reference NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED',
      )
    }
  } catch (error) {
    reportViolation(
      'DIAGNOSIS_PROMPT_FEATURE_FLAG_MISSING',
      `Error reading feature flags: ${error.message}`,
    )
  }
}

// Run all checks
async function runVerification() {
  console.log('🔍 E76.5: Verifying Diagnosis Prompt Schema implementation...\n')

  checkDiagnosisPromptSchemaExists()
  checkDiagnosisPromptExists()
  checkDiagnosisPromptAPIRouteExists()
  checkDiagnosisPromptLiteralCallsiteExists()
  checkDiagnosisPromptFeatureFlagExists()

  if (violations.length > 0) {
    console.error('❌ E76.5 guardrails violations found:\n')
    violations.forEach((v) => {
      console.error(`  ${v.message}`)
    })
    console.error(`\n${violations.length} violation(s) detected`)
    process.exit(1)
  } else {
    console.log('✅ All E76.5 guardrails satisfied\n')
    console.log(`Verified ${E76_5_RULES.length} rules:`)
    E76_5_RULES.forEach((rule) => {
      console.log(`  ✓ ${rule.id}: ${rule.description}`)
    })
    process.exit(0)
  }
}

runVerification().catch((error) => {
  console.error('Script error:', error)
  process.exit(2)
})
