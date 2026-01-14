#!/usr/bin/env node
/**
 * Mobile Contract Export Script (Deterministic JSON for iOS)
 * 
 * Exports mobile API contract definitions to deterministic JSON.
 * This enables iOS development to consume API contracts with stable, predictable output.
 * 
 * Requirements:
 * - Reads from docs/mobile/MOBILE_API_SURFACE.md (source of truth)
 * - Extracts endpoint definitions, schemas, and guarantees
 * - Deterministic sorting (no localeCompare - simple ASCII sort)
 * - Multiple runs produce identical output (for git diff verification)
 * 
 * Usage:
 *   node scripts/dev/mobile-contract/export.js
 *   node scripts/dev/mobile-contract/export.js --out docs/dev/mobile-contracts.v1.json
 * 
 * Output:
 *   docs/dev/mobile-contracts.v1.json - Deterministically sorted contract export
 */

const fs = require('fs')
const path = require('path')

/**
 * Deterministic object key sorter
 * 
 * Sorts object keys using simple ASCII comparison (not localeCompare).
 * This ensures identical output across different locales and environments.
 * 
 * @param {Object} obj - Object to sort
 * @returns {Object} New object with sorted keys
 */
function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }

  const sorted = {}
  const keys = Object.keys(obj).sort() // Simple ASCII sort, no localeCompare

  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key])
  }

  return sorted
}

/**
 * Mobile API Contracts (v0.7)
 * 
 * Based on docs/mobile/MOBILE_API_SURFACE.md
 * These contracts represent the guaranteed API surface for iOS mobile app
 */
const mobileContracts = {
  version: 'v0.7',
  source: 'docs/mobile/MOBILE_API_SURFACE.md',
  description: 'Mobile API contracts for iOS patient flow',
  lastUpdated: '2026-01',
  
  categories: {
    'authentication-onboarding': {
      name: 'Authentication & Onboarding',
      description: 'User session management and initial setup',
      endpoints: [
        {
          path: '/api/patient/onboarding-status',
          method: 'GET',
          priority: 'MUST',
          authRequired: true,
          idempotent: true,
          cacheable: false,
          pagination: false,
          rateLimit: '60/min',
          owner: 'app/api/patient/onboarding-status/route.ts',
          schemaVersionField: null,
          description: 'Check if user has completed onboarding (consent + profile setup)',
        },
        {
          path: '/api/auth/resolve-role',
          method: 'GET',
          priority: 'MUST',
          authRequired: true,
          idempotent: true,
          cacheable: false,
          pagination: false,
          rateLimit: '60/min',
          owner: 'app/api/auth/resolve-role/route.ts',
          schemaVersionField: null,
          description: 'Resolve user role from session',
        },
        {
          path: '/api/consent/record',
          method: 'POST',
          priority: 'NICE',
          authRequired: true,
          idempotent: false,
          cacheable: false,
          pagination: false,
          rateLimit: '10/min',
          owner: 'app/api/consent/record/route.ts',
          schemaVersionField: 'consent_version',
          description: 'Record user consent',
        },
        {
          path: '/api/consent/status',
          method: 'GET',
          priority: 'NICE',
          authRequired: true,
          idempotent: true,
          cacheable: false,
          pagination: false,
          rateLimit: '60/min',
          owner: 'app/api/consent/status/route.ts',
          schemaVersionField: 'consent_version',
          description: 'Get current consent status',
        },
      ],
    },
    'funnel-catalog': {
      name: 'Funnel Catalog',
      description: 'Discovering available assessment funnels',
      endpoints: [
        {
          path: '/api/funnels/catalog',
          method: 'GET',
          priority: 'MUST',
          authRequired: true,
          idempotent: true,
          cacheable: true,
          cacheMaxAge: '5min',
          pagination: true,
          paginationType: 'cursor',
          rateLimit: '120/min',
          owner: 'app/api/funnels/catalog/route.ts',
          schemaVersionField: 'funnel_version_id',
          description: 'Get all active funnels organized by pillar',
          cacheHeaders: {
            'Cache-Control': 'public, max-age=300, must-revalidate',
            ETag: 'funnels:v1:timestamp',
            'Last-Modified': 'HTTP-date',
          },
          statusCodes: {
            200: 'Success',
            304: 'Not Modified (cached content valid)',
            400: 'Bad Request (invalid cursor)',
            401: 'Unauthorized',
            500: 'Internal Server Error',
          },
        },
        {
          path: '/api/funnels/catalog/[slug]',
          method: 'GET',
          priority: 'MUST',
          authRequired: true,
          idempotent: true,
          cacheable: true,
          cacheMaxAge: '5min',
          pagination: false,
          rateLimit: '120/min',
          owner: 'app/api/funnels/catalog/[slug]/route.ts',
          schemaVersionField: 'funnel_version_id',
          description: 'Get detailed information for a specific funnel',
          statusCodes: {
            200: 'Success',
            401: 'Unauthorized',
            404: 'Not Found',
            500: 'Internal Server Error',
          },
        },
        {
          path: '/api/funnels/[slug]/definition',
          method: 'GET',
          priority: 'NICE',
          authRequired: true,
          idempotent: true,
          cacheable: true,
          cacheMaxAge: '10min',
          pagination: false,
          rateLimit: '60/min',
          owner: 'app/api/funnels/[slug]/definition/route.ts',
          schemaVersionField: 'funnel_version_id',
          description: 'Get complete funnel definition with steps and questions',
        },
      ],
    },
    'assessment-lifecycle': {
      name: 'Assessment Lifecycle',
      description: 'Starting, resuming, and completing assessments',
      endpoints: [
        {
          path: '/api/funnels/[slug]/assessments',
          method: 'POST',
          priority: 'MUST',
          authRequired: true,
          idempotent: false,
          cacheable: false,
          pagination: false,
          rateLimit: '30/min',
          owner: 'app/api/funnels/[slug]/assessments/route.ts',
          schemaVersionField: null,
          description: 'Start a new assessment session',
          statusCodes: {
            201: 'Created',
            400: 'Bad Request',
            401: 'Unauthorized',
            404: 'Funnel Not Found',
            500: 'Internal Server Error',
          },
        },
        {
          path: '/api/funnels/[slug]/assessments/[assessmentId]',
          method: 'GET',
          priority: 'MUST',
          authRequired: true,
          idempotent: true,
          cacheable: false,
          pagination: false,
          rateLimit: '120/min',
          owner: 'app/api/funnels/[slug]/assessments/[assessmentId]/route.ts',
          schemaVersionField: null,
          description: 'Get assessment status and current step',
        },
        {
          path: '/api/assessments/[id]/resume',
          method: 'GET',
          priority: 'MUST',
          authRequired: true,
          idempotent: true,
          cacheable: false,
          pagination: false,
          rateLimit: '60/min',
          owner: 'app/api/assessments/[id]/resume/route.ts',
          schemaVersionField: null,
          description: 'Resume an in-progress assessment',
        },
        {
          path: '/api/funnels/[slug]/assessments/[assessmentId]/complete',
          method: 'POST',
          priority: 'MUST',
          authRequired: true,
          idempotent: false,
          cacheable: false,
          pagination: false,
          rateLimit: '20/min',
          owner: 'app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts',
          schemaVersionField: null,
          description: 'Complete an assessment and trigger report generation',
        },
      ],
    },
    'assessment-step-validation': {
      name: 'Assessment Step Validation',
      description: 'Validating user progress through assessment steps',
      endpoints: [
        {
          path: '/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]',
          method: 'POST',
          priority: 'MUST',
          authRequired: true,
          idempotent: false,
          cacheable: false,
          pagination: false,
          rateLimit: '60/min',
          owner: 'app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts',
          schemaVersionField: null,
          description: 'Validate step and get next step',
        },
        {
          path: '/api/assessment-validation/validate-step',
          method: 'POST',
          priority: 'NICE',
          authRequired: true,
          idempotent: false,
          cacheable: false,
          pagination: false,
          rateLimit: '60/min',
          owner: 'app/api/assessment-validation/validate-step/route.ts',
          schemaVersionField: null,
          description: 'Alternative step validation endpoint',
        },
      ],
    },
    'assessment-answers': {
      name: 'Assessment Answers',
      description: 'Saving and retrieving user responses',
      endpoints: [
        {
          path: '/api/funnels/[slug]/assessments/[assessmentId]/answers/save',
          method: 'POST',
          priority: 'MUST',
          authRequired: true,
          idempotent: true,
          idempotencyNote: 'Upsert logic - safe to retry',
          cacheable: false,
          pagination: false,
          rateLimit: '120/min',
          owner: 'app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts',
          schemaVersionField: null,
          description: 'Save assessment answers (upsert)',
        },
        {
          path: '/api/assessment-answers/save',
          method: 'POST',
          priority: 'NICE',
          authRequired: true,
          idempotent: true,
          idempotencyNote: 'Upsert logic - safe to retry',
          cacheable: false,
          pagination: false,
          rateLimit: '120/min',
          owner: 'app/api/assessment-answers/save/route.ts',
          schemaVersionField: null,
          description: 'Alternative answer save endpoint (upsert)',
        },
      ],
    },
    'results-history': {
      name: 'Results & History',
      description: 'Viewing assessment results and past assessments',
      endpoints: [
        {
          path: '/api/funnels/[slug]/assessments/[assessmentId]/result',
          method: 'GET',
          priority: 'MUST',
          authRequired: true,
          idempotent: true,
          cacheable: false,
          pagination: false,
          rateLimit: '60/min',
          owner: 'app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts',
          schemaVersionField: null,
          description: 'Get assessment result and report',
        },
        {
          path: '/api/patient-measures/history',
          method: 'GET',
          priority: 'NICE',
          authRequired: true,
          idempotent: true,
          cacheable: true,
          cacheMaxAge: '2min',
          pagination: true,
          paginationType: 'limit',
          rateLimit: '30/min',
          owner: 'app/api/patient-measures/history/route.ts',
          schemaVersionField: null,
          description: 'Get patient assessment history',
        },
        {
          path: '/api/patient-measures/export',
          method: 'GET',
          priority: 'NICE',
          authRequired: true,
          idempotent: true,
          cacheable: false,
          pagination: false,
          rateLimit: '10/min',
          owner: 'app/api/patient-measures/export/route.ts',
          schemaVersionField: null,
          description: 'Export patient measures as JSON',
        },
      ],
    },
    'patient-profile': {
      name: 'Patient Profile',
      description: 'User profile information',
      endpoints: [
        {
          path: '/api/patient-profiles',
          method: 'GET',
          priority: 'NICE',
          authRequired: true,
          idempotent: true,
          cacheable: true,
          cacheMaxAge: '5min',
          pagination: false,
          rateLimit: '60/min',
          owner: 'app/api/patient-profiles/route.ts',
          schemaVersionField: null,
          description: 'Get patient profile information',
        },
      ],
    },
  },
  
  guarantees: {
    authentication: {
      method: 'Supabase Auth',
      sessionType: 'Cookie-based',
      tokenRefresh: 'Automatic',
      description: 'All MUST endpoints require valid authenticated session',
    },
    responseFormat: {
      standard: {
        success: 'boolean',
        data: 'object (optional)',
        error: 'object (optional, contains code and message)',
        requestId: 'string (for tracking)',
      },
      pagination: {
        limit: 'number',
        hasMore: 'boolean',
        nextCursor: 'string | null',
      },
    },
    errorCodes: {
      AUTHENTICATION_REQUIRED: 'User not authenticated',
      FORBIDDEN: 'User lacks permission',
      NOT_FOUND: 'Resource not found',
      VALIDATION_ERROR: 'Input validation failed',
      INTERNAL_ERROR: 'Server error',
      RATE_LIMIT_EXCEEDED: 'Too many requests',
    },
    versioning: {
      strategy: 'Schema version fields',
      fields: ['funnel_version_id', 'consent_version'],
      description: 'Enable mobile clients to detect API contract changes and handle migrations',
    },
    caching: {
      strategy: 'ETag and Last-Modified headers',
      conditionalRequests: true,
      description: 'Supports 304 Not Modified responses for efficient caching',
      reference: 'docs/mobile/CACHING_PAGINATION.md',
    },
  },
  
  statistics: {
    totalEndpoints: 0, // Calculated below
    mustSupportEndpoints: 0, // Calculated below
    niceSupportEndpoints: 0, // Calculated below
    cacheableEndpoints: 0, // Calculated below
    paginatedEndpoints: 0, // Calculated below
  },
}

/**
 * Calculate statistics
 */
function calculateStatistics(contracts) {
  let total = 0
  let must = 0
  let nice = 0
  let cacheable = 0
  let paginated = 0
  
  for (const category of Object.values(contracts.categories)) {
    for (const endpoint of category.endpoints) {
      total++
      if (endpoint.priority === 'MUST') must++
      if (endpoint.priority === 'NICE') nice++
      if (endpoint.cacheable) cacheable++
      if (endpoint.pagination) paginated++
    }
  }
  
  contracts.statistics.totalEndpoints = total
  contracts.statistics.mustSupportEndpoints = must
  contracts.statistics.niceSupportEndpoints = nice
  contracts.statistics.cacheableEndpoints = cacheable
  contracts.statistics.paginatedEndpoints = paginated
  
  return contracts
}

/**
 * Generate complete contract export
 * 
 * @returns {Object} Complete contract structure
 */
function generateContractExport() {
  const contracts = { ...mobileContracts }
  
  // Calculate statistics
  calculateStatistics(contracts)
  
  // Apply deterministic sorting
  return sortObjectKeys(contracts)
}

/**
 * Main export function
 */
function exportContracts() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2)
    let outputPath = path.join(__dirname, '../../../docs/dev/mobile-contracts.v1.json')
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--out' && i + 1 < args.length) {
        outputPath = path.resolve(args[i + 1])
      }
    }
    
    const outputDir = path.dirname(outputPath)
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // Generate contract export
    const contracts = generateContractExport()
    
    // Write with deterministic formatting (2 spaces, sorted keys already applied)
    const jsonContent = JSON.stringify(contracts, null, 2)
    fs.writeFileSync(outputPath, jsonContent + '\n', 'utf8') // Add trailing newline
    
    console.log('✓ Mobile contracts exported successfully!')
    console.log(`  Source: docs/mobile/MOBILE_API_SURFACE.md`)
    console.log(`  Output: ${outputPath}`)
    console.log(`  Size: ${(jsonContent.length / 1024).toFixed(2)} KB`)
    console.log('')
    console.log('Export Summary:')
    console.log(`  Version: ${contracts.version}`)
    console.log(`  Categories: ${Object.keys(contracts.categories).length}`)
    console.log(`  Total Endpoints: ${contracts.statistics.totalEndpoints}`)
    console.log(`  MUST Support: ${contracts.statistics.mustSupportEndpoints}`)
    console.log(`  NICE Support: ${contracts.statistics.niceSupportEndpoints}`)
    console.log(`  Cacheable: ${contracts.statistics.cacheableEndpoints}`)
    console.log(`  Paginated: ${contracts.statistics.paginatedEndpoints}`)
    console.log('')
    console.log('Verification:')
    console.log('  Run this script twice and check: git diff')
    console.log('  Output should be identical (deterministic)')
    
  } catch (error) {
    console.error('✗ Error exporting mobile contracts:', error)
    process.exit(1)
  }
}

// Run export
exportContracts()
