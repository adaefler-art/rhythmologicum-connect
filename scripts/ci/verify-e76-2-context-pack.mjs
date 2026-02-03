#!/usr/bin/env node
/**
 * E76.2: Context Pack Builder Verification Script
 * 
 * Verifies that E76.2 requirements are met:
 * - Context pack builder module exists
 * - Anamnesis retrieval with max 30 limit
 * - Funnel runs retrieval with max 2 per funnel limit
 * - inputs_hash calculation is present
 * - API route /api/mcp/context-pack exists
 * - Literal callsite exists
 * - Authorization checks in place
 * 
 * Usage: node scripts/ci/verify-e76-2-context-pack.mjs
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

// Rule definitions for E76.2
const E76_2_RULES = [
  {
    id: 'R-E76.2-001',
    description: 'Context pack builder module must exist at lib/mcp/contextPackBuilder.ts',
    errorCode: 'CONTEXT_PACK_BUILDER_MISSING',
  },
  {
    id: 'R-E76.2-002',
    description: 'Context pack must limit anamnesis entries to max 30',
    errorCode: 'ANAMNESIS_LIMIT_MISSING',
  },
  {
    id: 'R-E76.2-003',
    description: 'Context pack must limit funnel runs to max 2 per funnel',
    errorCode: 'FUNNEL_RUNS_LIMIT_MISSING',
  },
  {
    id: 'R-E76.2-004',
    description: 'Context pack must calculate stable inputs_hash',
    errorCode: 'INPUTS_HASH_MISSING',
  },
  {
    id: 'R-E76.2-005',
    description: 'API route /api/mcp/context-pack must exist',
    errorCode: 'CONTEXT_PACK_API_ROUTE_MISSING',
  },
  {
    id: 'R-E76.2-006',
    description: 'Literal callsite for /api/mcp/context-pack must exist',
    errorCode: 'CONTEXT_PACK_LITERAL_CALLSITE_MISSING',
  },
  {
    id: 'R-E76.2-007',
    description: 'API route must check authorization (clinician/admin only)',
    errorCode: 'CONTEXT_PACK_NO_AUTHORIZATION',
  },
  {
    id: 'R-E76.2-008',
    description: 'MCP tool schema must be updated for new context pack structure',
    errorCode: 'MCP_TOOL_SCHEMA_NOT_UPDATED',
  },
]

// Error code to rule mapping
const ERROR_CODE_TO_RULE_ID = {}
E76_2_RULES.forEach((rule) => {
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

function checkContextPackBuilderExists() {
  const builderPath = join(REPO_ROOT, 'lib', 'mcp', 'contextPackBuilder.ts')
  if (!existsSync(builderPath)) {
    reportViolation(
      'CONTEXT_PACK_BUILDER_MISSING',
      `File not found: ${builderPath}`,
    )
    return
  }

  const content = readFileSync(builderPath, 'utf-8')

  // Check for MAX_ANAMNESIS_ENTRIES = 30
  if (!content.includes('MAX_ANAMNESIS_ENTRIES') || !content.includes('= 30')) {
    reportViolation(
      'ANAMNESIS_LIMIT_MISSING',
      'MAX_ANAMNESIS_ENTRIES = 30 not found in context pack builder',
    )
  }

  // Check for MAX_RUNS_PER_FUNNEL = 2
  if (!content.includes('MAX_RUNS_PER_FUNNEL') || !content.includes('= 2')) {
    reportViolation(
      'FUNNEL_RUNS_LIMIT_MISSING',
      'MAX_RUNS_PER_FUNNEL = 2 not found in context pack builder',
    )
  }

  // Check for inputs_hash calculation
  if (
    !content.includes('calculateInputsHash') ||
    !content.includes("createHash('sha256')")
  ) {
    reportViolation(
      'INPUTS_HASH_MISSING',
      'inputs_hash calculation with SHA256 not found',
    )
  }

  // Check for buildPatientContextPack function
  if (!content.includes('export async function buildPatientContextPack')) {
    reportViolation(
      'CONTEXT_PACK_BUILDER_MISSING',
      'buildPatientContextPack function not exported',
    )
  }
}

function checkAPIRouteExists() {
  const routePath = join(
    REPO_ROOT,
    'apps',
    'rhythm-studio-ui',
    'app',
    'api',
    'mcp',
    'context-pack',
    'route.ts',
  )

  if (!existsSync(routePath)) {
    reportViolation(
      'CONTEXT_PACK_API_ROUTE_MISSING',
      `File not found: ${routePath}`,
    )
    return
  }

  const content = readFileSync(routePath, 'utf-8')

  // Check for authorization
  if (
    !content.includes('clinician') &&
    !content.includes('admin') &&
    !content.includes('isAuthorized')
  ) {
    reportViolation(
      'CONTEXT_PACK_NO_AUTHORIZATION',
      'API route does not check for clinician/admin authorization',
    )
  }

  // Check for buildPatientContextPack usage
  if (!content.includes('buildPatientContextPack')) {
    reportViolation(
      'CONTEXT_PACK_API_ROUTE_MISSING',
      'API route does not call buildPatientContextPack',
    )
  }
}

function checkLiteralCallsiteExists() {
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
      'CONTEXT_PACK_LITERAL_CALLSITE_MISSING',
      `Test page not found: ${testPagePath}`,
    )
    return
  }

  const content = readFileSync(testPagePath, 'utf-8')

  // Check for literal /api/mcp/context-pack string
  if (!content.includes("'/api/mcp/context-pack'")) {
    reportViolation(
      'CONTEXT_PACK_LITERAL_CALLSITE_MISSING',
      "Literal string '/api/mcp/context-pack' not found in test page",
    )
  }

  // Check for testContextPack function or similar
  if (!content.includes('testContextPack') && !content.includes('context-pack')) {
    reportViolation(
      'CONTEXT_PACK_LITERAL_CALLSITE_MISSING',
      'No test function for context pack endpoint found',
    )
  }
}

function checkMCPToolSchemaUpdated() {
  const toolsPath = join(REPO_ROOT, 'packages', 'mcp-server', 'src', 'tools.ts')

  if (!existsSync(toolsPath)) {
    reportViolation('MCP_TOOL_SCHEMA_NOT_UPDATED', `File not found: ${toolsPath}`)
    return
  }

  const content = readFileSync(toolsPath, 'utf-8')

  // Check for updated schema fields
  const requiredFields = [
    'anamnesis',
    'funnel_runs',
    'current_measures',
    'inputs_hash',
  ]

  for (const field of requiredFields) {
    if (!content.includes(field)) {
      reportViolation(
        'MCP_TOOL_SCHEMA_NOT_UPDATED',
        `MCP tool schema missing field: ${field}`,
      )
    }
  }

  // Check for E76.2 comment
  if (!content.includes('E76.2')) {
    reportViolation(
      'MCP_TOOL_SCHEMA_NOT_UPDATED',
      'MCP tool schema not documented as updated for E76.2',
    )
  }
}

function checkEndpointAllowlist() {
  const allowlistPath = join(REPO_ROOT, 'docs', 'api', 'endpoint-allowlist.json')

  if (!existsSync(allowlistPath)) {
    // Allowlist is optional, not a violation
    return
  }

  const content = readFileSync(allowlistPath, 'utf-8')

  if (!content.includes('/api/mcp/context-pack')) {
    console.log(
      'Note: /api/mcp/context-pack not in allowlist (may need to be added if orphan check fails)',
    )
  }
}

// Run all checks
function runChecks() {
  console.log('Running E76.2 Context Pack Builder verification...\n')

  checkContextPackBuilderExists()
  checkAPIRouteExists()
  checkLiteralCallsiteExists()
  checkMCPToolSchemaUpdated()
  checkEndpointAllowlist()

  if (violations.length === 0) {
    console.log('✅ All E76.2 guardrails satisfied\n')
    console.log(`Verified ${E76_2_RULES.length} rules:`)
    E76_2_RULES.forEach((rule) => {
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
    E76_2_RULES.forEach((rule) => {
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
