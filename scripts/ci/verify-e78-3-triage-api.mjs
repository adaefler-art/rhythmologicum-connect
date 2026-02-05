#!/usr/bin/env node

/**
 * E78.3 Verification Script - Clinician Triage API
 * 
 * Verifies the /api/clinician/triage endpoint implementation
 * against the specification and guardrails.
 * 
 * Rules verified (R-E78.3-XXX):
 * - R-E78.3-001: Endpoint requires authentication
 * - R-E78.3-002: Endpoint requires clinician/admin role
 * - R-E78.3-003: activeOnly defaults to true
 * - R-E78.3-004: Search query (q) works for patient name/funnel slug
 * - R-E78.3-005: status parameter validates case_state values
 * - R-E78.3-006: attention parameter validates attention_level values
 * - R-E78.3-007: Default sorting by priority_score DESC, assigned_at ASC
 * - R-E78.3-008: RLS policies enforce org-scoping
 * - R-E78.3-009: Response follows standard API contract
 * - R-E78.3-010: Invalid query parameters return 400 validation error
 * 
 * Exit codes:
 * 0 - All checks passed
 * 1 - One or more checks failed
 * 2 - Fatal error (script error, file not found, etc.)
 */

import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Colors for output
const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
}

// Check results
const results = {
	passed: 0,
	failed: 0,
	warnings: 0,
	checks: [],
}

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`)
}

function logCheck(checkId, ruleId, description, passed, details = null) {
	const emoji = passed ? '✅' : '❌'
	const status = passed ? 'PASS' : 'FAIL'
	
	results.checks.push({ checkId, ruleId, description, passed, details })
	
	if (passed) {
		results.passed++
		log(`${emoji} ${checkId} (${ruleId}): ${description}`, 'green')
	} else {
		results.failed++
		log(`${emoji} ${checkId} (${ruleId}): ${description}`, 'red')
		if (details) {
			log(`   Details: ${details}`, 'yellow')
		}
		log(`   ❌ violates ${ruleId} (${checkId})`, 'red')
	}
}

function logWarning(message) {
	results.warnings++
	log(`⚠️  ${message}`, 'yellow')
}

function logSection(title) {
	log(`\n📋 ${title}`, 'cyan')
}

async function readRouteFile() {
	try {
		const routePath = path.join(
			__dirname,
			'../../apps/rhythm-studio-ui/app/api/clinician/triage/route.ts'
		)
		return await readFile(routePath, 'utf-8')
	} catch (error) {
		log(`❌ Fatal: Could not read route file: ${error.message}`, 'red')
		process.exit(2)
	}
}

/**
 * E78.3-001: Check that endpoint requires authentication
 */
function checkAuthentication(content) {
	logSection('Authentication Checks')
	
	const hasAuthCheck = content.includes('supabase.auth.getUser()')
	const hasUnauthorizedResponse = content.includes('unauthorizedResponse')
	const hasAuthError = content.includes('authError')
	
	const passed = hasAuthCheck && hasUnauthorizedResponse && hasAuthError
	
	logCheck(
		'E78.3-001',
		'R-E78.3-001',
		'Endpoint requires authentication',
		passed,
		!passed ? 'Missing auth check or unauthorized response' : null
	)
}

/**
 * E78.3-002: Check that endpoint requires clinician/admin role
 */
function checkAuthorization(content) {
	const hasRoleCheck = content.includes('hasAdminOrClinicianRole')
	const hasForbiddenResponse = content.includes('forbiddenResponse')
	
	const passed = hasRoleCheck && hasForbiddenResponse
	
	logCheck(
		'E78.3-002',
		'R-E78.3-002',
		'Endpoint enforces clinician/admin role requirement',
		passed,
		!passed ? 'Missing role check or forbidden response' : null
	)
}

/**
 * E78.3-003: Check that activeOnly defaults to true
 */
function checkActiveOnlyDefault(content) {
	logSection('Query Parameter Checks')
	
	// Check for default true logic
	const hasDefaultTrue = content.includes('activeOnly = activeOnlyParam === null ? true')
	const hasActiveFilter = content.includes("eq('is_active', true)")
	
	const passed = hasDefaultTrue && hasActiveFilter
	
	logCheck(
		'E78.3-003',
		'R-E78.3-003',
		'activeOnly parameter defaults to true',
		passed,
		!passed ? 'Missing default true logic or is_active filter' : null
	)
}

/**
 * E78.3-004: Check search query implementation
 */
function checkSearchQuery(content) {
	const hasSearchParam = content.includes("searchParams.get('q')")
	const hasPatientSearch = content.includes('patient_display')
	const hasFunnelSearch = content.includes('funnel_slug')
	const hasOrFilter = content.includes('.or(')
	
	const passed = hasSearchParam && hasPatientSearch && hasFunnelSearch && hasOrFilter
	
	logCheck(
		'E78.3-004',
		'R-E78.3-004',
		'Search query (q) searches patient name/id and funnel slug',
		passed,
		!passed ? 'Missing search implementation across patient_display and funnel_slug' : null
	)
}

/**
 * E78.3-005: Check status parameter validation
 */
function checkStatusValidation(content) {
	const hasStatusParam = content.includes("searchParams.get('status')")
	const hasValidStates = content.includes('VALID_CASE_STATES')
	const hasValidation = content.includes('VALID_CASE_STATES.includes')
	const hasValidationError = content.includes('validationErrorResponse')
	
	const passed = hasStatusParam && hasValidStates && hasValidation && hasValidationError
	
	logCheck(
		'E78.3-005',
		'R-E78.3-005',
		'status parameter validates case_state values',
		passed,
		!passed ? 'Missing status validation or error response' : null
	)
}

/**
 * E78.3-006: Check attention parameter validation
 */
function checkAttentionValidation(content) {
	const hasAttentionParam = content.includes("searchParams.get('attention')")
	const hasValidLevels = content.includes('VALID_ATTENTION_LEVELS')
	const hasValidation = content.includes('VALID_ATTENTION_LEVELS.includes')
	const hasValidationError = content.includes('validationErrorResponse')
	
	const passed = hasAttentionParam && hasValidLevels && hasValidation && hasValidationError
	
	logCheck(
		'E78.3-006',
		'R-E78.3-006',
		'attention parameter validates attention_level values',
		passed,
		!passed ? 'Missing attention validation or error response' : null
	)
}

/**
 * E78.3-007: Check default sorting implementation
 */
function checkDefaultSorting(content) {
	logSection('Sorting Checks')
	
	const hasPrioritySort = content.includes("order('priority_score', { ascending: false })")
	const hasAssignedAtSort = content.includes("order('assigned_at', { ascending: true })")
	
	const passed = hasPrioritySort && hasAssignedAtSort
	
	logCheck(
		'E78.3-007',
		'R-E78.3-007',
		'Default sorting by priority_score DESC, assigned_at ASC',
		passed,
		!passed ? 'Missing or incorrect sorting implementation' : null
	)
}

/**
 * E78.3-008: Check RLS documentation
 */
function checkRLSDocumentation(content) {
	logSection('Security Checks')
	
	// Check for RLS documentation in comments
	const hasRLSComment = content.includes('RLS policies') || content.includes('org-scoping')
	const hasSecuritySection = content.includes('Security:')
	
	const passed = hasRLSComment && hasSecuritySection
	
	logCheck(
		'E78.3-008',
		'R-E78.3-008',
		'RLS policies documented (enforced by database)',
		passed,
		!passed ? 'Missing RLS/org-scoping documentation' : null
	)
}

/**
 * E78.3-009: Check standard API response contract
 */
function checkResponseContract(content) {
	logSection('Response Contract Checks')
	
	const hasSuccessResponse = content.includes('successResponse')
	const hasCasesField = content.includes('cases:')
	const hasFiltersField = content.includes('filters:')
	const hasCountField = content.includes('count:')
	const hasRequestId = content.includes('requestId')
	
	const passed = hasSuccessResponse && hasCasesField && hasFiltersField && hasCountField && hasRequestId
	
	logCheck(
		'E78.3-009',
		'R-E78.3-009',
		'Response follows standard API contract',
		passed,
		!passed ? 'Missing standard response fields (cases, filters, count, requestId)' : null
	)
}

/**
 * E78.3-010: Check invalid parameter handling
 */
function checkInvalidParameters(content) {
	const hasValidationError = content.includes('validationErrorResponse')
	const hasStatusValidation = content.includes('Invalid status parameter')
	const hasAttentionValidation = content.includes('Invalid attention parameter')
	
	const passed = hasValidationError && hasStatusValidation && hasAttentionValidation
	
	logCheck(
		'E78.3-010',
		'R-E78.3-010',
		'Invalid query parameters return 400 validation error',
		passed,
		!passed ? 'Missing validation error responses for invalid parameters' : null
	)
}

/**
 * E78.3-011: Check error handling and logging
 */
function checkErrorHandling(content) {
	logSection('Error Handling Checks')
	
	const hasErrorClassification = content.includes('classifySupabaseError')
	const hasLogging = content.includes('logError')
	const hasRequestIdPropagation = content.includes('withRequestId')
	const hasTryCatch = content.includes('try {') && content.includes('} catch')
	
	const passed = hasErrorClassification && hasLogging && hasRequestIdPropagation && hasTryCatch
	
	logCheck(
		'E78.3-011',
		'R-E78.3-011',
		'Error handling and logging properly implemented',
		passed,
		!passed ? 'Missing error classification, logging, or request ID propagation' : null
	)
}

/**
 * E78.3-012: Check view usage
 */
function checkViewUsage(content) {
	logSection('Data Source Checks')
	
	const usesView = content.includes("from('triage_cases_v1')")
	const noDirectTables = !content.includes("from('assessments')") || content.split("from('").length === 2
	
	const passed = usesView && noDirectTables
	
	logCheck(
		'E78.3-012',
		'R-E78.3-012',
		'Uses triage_cases_v1 view (SSOT)',
		passed,
		!passed ? 'Not using triage_cases_v1 view or querying base tables directly' : null
	)
}

async function main() {
	log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue')
	log('🔍 E78.3 Clinician Triage API Verification', 'blue')
	log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue')

	const content = await readRouteFile()

	// Run all checks
	checkAuthentication(content)
	checkAuthorization(content)
	checkActiveOnlyDefault(content)
	checkSearchQuery(content)
	checkStatusValidation(content)
	checkAttentionValidation(content)
	checkDefaultSorting(content)
	checkRLSDocumentation(content)
	checkResponseContract(content)
	checkInvalidParameters(content)
	checkErrorHandling(content)
	checkViewUsage(content)

	// Print summary
	log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue')
	log('📊 Summary', 'blue')
	log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue')

	log(`✅ Passed: ${results.passed}`, 'green')
	log(`❌ Failed: ${results.failed}`, 'red')
	if (results.warnings > 0) {
		log(`⚠️  Warnings: ${results.warnings}`, 'yellow')
	}

	if (results.failed === 0) {
		if (results.warnings > 0) {
			log('\n⚠️  E78.3 verification passed with warning(s)', 'yellow')
			log('   Some non-critical checks flagged issues\n', 'yellow')
			process.exit(0)
		} else {
			log('\n✅ E78.3 verification PASSED', 'green')
			log('   All checks successful!\n', 'green')
			process.exit(0)
		}
	} else {
		log('\n❌ E78.3 verification FAILED', 'red')
		log(`   ${results.failed} check(s) failed\n`, 'red')
		process.exit(1)
	}
}

main().catch((error) => {
	log(`\n❌ Fatal error: ${error.message}`, 'red')
	console.error(error)
	process.exit(2)
})
