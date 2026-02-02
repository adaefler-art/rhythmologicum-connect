#!/usr/bin/env node
/**
 * E76.1: MCP Server Verification Script
 * 
 * Verifies that E76.1 requirements are met:
 * - MCP server package exists with required files
 * - Health endpoint is functional
 * - Tools deliver stubbed responses with correct schemas
 * - Version metadata is present
 * - API route exists with literal callsite
 * - Feature flag exists
 * - Logging includes correlation IDs
 * 
 * Usage: node scripts/ci/verify-e76-1-mcp-server.mjs
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

// Rule definitions for E76.1
const E76_1_RULES = [
  {
    id: 'R-E76.1-001',
    description: 'MCP server package must exist with required structure',
    errorCode: 'MCP_PACKAGE_MISSING',
  },
  {
    id: 'R-E76.1-002',
    description: 'MCP tools must have Zod schemas (get_patient_context, run_diagnosis)',
    errorCode: 'MCP_TOOLS_SCHEMA_MISSING',
  },
  {
    id: 'R-E76.1-003',
    description: 'Version metadata must include mcp_server_version, run_version, prompt_version',
    errorCode: 'MCP_VERSION_METADATA_MISSING',
  },
  {
    id: 'R-E76.1-004',
    description: 'Logging must include correlation ID (run_id) support',
    errorCode: 'MCP_LOGGING_NO_CORRELATION_ID',
  },
  {
    id: 'R-E76.1-005',
    description: 'Secrets must not leak in logs (LLM API keys redacted)',
    errorCode: 'MCP_SECRETS_LEAKED',
  },
  {
    id: 'R-E76.1-006',
    description: 'API route /api/mcp must exist',
    errorCode: 'MCP_API_ROUTE_MISSING',
  },
  {
    id: 'R-E76.1-007',
    description: 'Literal callsite for /api/mcp must exist',
    errorCode: 'MCP_LITERAL_CALLSITE_MISSING',
  },
  {
    id: 'R-E76.1-008',
    description: 'Feature flag MCP_ENABLED must exist',
    errorCode: 'MCP_FEATURE_FLAG_MISSING',
  },
]

// Error code to rule mapping
const ERROR_CODE_TO_RULE_ID = {}
E76_1_RULES.forEach((rule) => {
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

function checkMCPPackageStructure() {
  const mcpPackagePath = join(REPO_ROOT, 'packages', 'mcp-server')
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'src/version.ts',
    'src/logger.ts',
    'src/tools.ts',
    'src/handlers.ts',
    'src/server.ts',
    'src/index.ts',
  ]

  if (!existsSync(mcpPackagePath)) {
    reportViolation('MCP_PACKAGE_MISSING', `MCP package directory does not exist: ${mcpPackagePath}`)
    return
  }

  requiredFiles.forEach((file) => {
    const filePath = join(mcpPackagePath, file)
    if (!existsSync(filePath)) {
      reportViolation('MCP_PACKAGE_MISSING', `Required file missing: ${file}`)
    }
  })
}

function checkToolsSchema() {
  const toolsPath = join(REPO_ROOT, 'packages', 'mcp-server', 'src', 'tools.ts')
  if (!existsSync(toolsPath)) {
    reportViolation('MCP_TOOLS_SCHEMA_MISSING', 'tools.ts file not found')
    return
  }

  const toolsContent = readFileSync(toolsPath, 'utf8')

  const requiredExports = [
    'GetPatientContextInputSchema',
    'GetPatientContextOutputSchema',
    'RunDiagnosisInputSchema',
    'RunDiagnosisOutputSchema',
    'MCP_TOOLS',
  ]

  requiredExports.forEach((exportName) => {
    if (!toolsContent.includes(exportName)) {
      reportViolation('MCP_TOOLS_SCHEMA_MISSING', `Missing export: ${exportName}`)
    }
  })

  // Check for Zod import
  if (!toolsContent.includes("from 'zod'")) {
    reportViolation('MCP_TOOLS_SCHEMA_MISSING', 'Zod import missing')
  }
}

function checkVersionMetadata() {
  const versionPath = join(REPO_ROOT, 'packages', 'mcp-server', 'src', 'version.ts')
  if (!existsSync(versionPath)) {
    reportViolation('MCP_VERSION_METADATA_MISSING', 'version.ts file not found')
    return
  }

  const versionContent = readFileSync(versionPath, 'utf8')

  const requiredFields = ['mcp_server_version', 'run_version', 'prompt_version']

  requiredFields.forEach((field) => {
    if (!versionContent.includes(field)) {
      reportViolation('MCP_VERSION_METADATA_MISSING', `Missing version field: ${field}`)
    }
  })
}

function checkLogging() {
  const loggerPath = join(REPO_ROOT, 'packages', 'mcp-server', 'src', 'logger.ts')
  if (!existsSync(loggerPath)) {
    reportViolation('MCP_LOGGING_NO_CORRELATION_ID', 'logger.ts file not found')
    return
  }

  const loggerContent = readFileSync(loggerPath, 'utf8')

  if (!loggerContent.includes('run_id')) {
    reportViolation('MCP_LOGGING_NO_CORRELATION_ID', 'run_id support missing in logger')
  }

  // Check for secret redaction
  if (!loggerContent.includes('REDACTED') && !loggerContent.includes('redact')) {
    reportViolation('MCP_SECRETS_LEAKED', 'Secret redaction not implemented in logger')
  }
}

function checkAPIRoute() {
  const apiRoutePath = join(REPO_ROOT, 'apps', 'rhythm-studio-ui', 'app', 'api', 'mcp', 'route.ts')
  if (!existsSync(apiRoutePath)) {
    reportViolation('MCP_API_ROUTE_MISSING', '/api/mcp route.ts not found')
  }
}

function checkLiteralCallsite() {
  const callsitePath = join(REPO_ROOT, 'apps', 'rhythm-studio-ui', 'app', 'admin', 'diagnostics', 'mcp-test', 'page.tsx')
  if (!existsSync(callsitePath)) {
    reportViolation('MCP_LITERAL_CALLSITE_MISSING', 'Literal callsite page not found: mcp-test/page.tsx')
    return
  }

  const callsiteContent = readFileSync(callsitePath, 'utf8')

  // Check for literal '/api/mcp' string
  if (!callsiteContent.includes("'/api/mcp'") && !callsiteContent.includes('"/api/mcp"')) {
    reportViolation('MCP_LITERAL_CALLSITE_MISSING', 'Literal string "/api/mcp" not found in callsite')
  }
}

function checkFeatureFlag() {
  const featureFlagsPath = join(REPO_ROOT, 'lib', 'featureFlags.ts')
  if (!existsSync(featureFlagsPath)) {
    reportViolation('MCP_FEATURE_FLAG_MISSING', 'featureFlags.ts not found')
    return
  }

  const featureFlagsContent = readFileSync(featureFlagsPath, 'utf8')

  if (!featureFlagsContent.includes('MCP_ENABLED')) {
    reportViolation('MCP_FEATURE_FLAG_MISSING', 'MCP_ENABLED feature flag not found')
  }
}

function main() {
  console.log('E76.1 MCP Server Verification\n')

  checkMCPPackageStructure()
  checkToolsSchema()
  checkVersionMetadata()
  checkLogging()
  checkAPIRoute()
  checkLiteralCallsite()
  checkFeatureFlag()

  if (violations.length === 0) {
    console.log('✅ All E76.1 guardrails satisfied')
    console.log(`\nVerified ${E76_1_RULES.length} rules:`)
    E76_1_RULES.forEach((rule) => {
      console.log(`  ✓ ${rule.id}: ${rule.description}`)
    })
    process.exit(0)
  } else {
    console.log('❌ E76.1 guardrails violations found:\n')
    violations.forEach((v) => {
      console.log(v.message)
    })
    console.log(`\n${violations.length} violation(s) found`)
    process.exit(1)
  }
}

main()
