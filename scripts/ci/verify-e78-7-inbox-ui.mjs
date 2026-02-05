#!/usr/bin/env node

/**
 * E78.7 Verification Script - Inbox UI Refactor
 * 
 * Verifies the refactored Inbox UI implementation against requirements.
 * 
 * Rules verified (R-E78.7-XXX):
 * - R-E78.7-001: Page uses /api/clinician/triage API endpoint
 * - R-E78.7-002: No client-side multi-fetch logic
 * - R-E78.7-003: No diagnostic/health check code
 * - R-E78.7-004: Active/Archive toggle present
 * - R-E78.7-005: Search box component present
 * - R-E78.7-006: Status filter present
 * - R-E78.7-007: Attention level filter present
 * - R-E78.7-008: Table has Patient column
 * - R-E78.7-009: Table has Funnel/Episode column
 * - R-E78.7-010: Table has Status column with case_state
 * - R-E78.7-011: Table has Reasons column with attention badges
 * - R-E78.7-012: Table has Next Action column
 * - R-E78.7-013: Table has Last Activity column
 * - R-E78.7-014: No Risk/Score/Result columns visible
 * - R-E78.7-015: Row actions dropdown present
 * - R-E78.7-016: Flag action in dropdown
 * - R-E78.7-017: Snooze action in dropdown
 * - R-E78.7-018: Close action in dropdown
 * - R-E78.7-019: Reopen action in dropdown
 * - R-E78.7-020: Note action in dropdown
 * - R-E78.7-021: Dark theme compliance (no pure white/black)
 * - R-E78.7-022: Page title is "Inbox" not "Triage"
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

async function readPageFile() {
	try {
		const pagePath = path.join(
			__dirname,
			'../../apps/rhythm-studio-ui/app/clinician/triage/page.tsx'
		)
		return await readFile(pagePath, 'utf-8')
	} catch (error) {
		log(`❌ Fatal: Could not read page file: ${error.message}`, 'red')
		process.exit(2)
	}
}

/**
 * E78.7-001: Check that page uses /api/clinician/triage API endpoint
 */
function checkApiEndpoint(content) {
	const hasApiCall = content.includes('/api/clinician/triage')
	const hasFetch = content.includes('fetch(`/api/clinician/triage')
	
	logCheck(
		'E78.7-001',
		'R-E78.7-001',
		'Page uses /api/clinician/triage API endpoint',
		hasApiCall && hasFetch,
		!hasApiCall ? 'API endpoint not found' : !hasFetch ? 'fetch call not found' : null
	)
}

/**
 * E78.7-002: Check no client-side multi-fetch logic
 */
function checkNoMultiFetch(content) {
	const hasSupabaseFrom = content.includes('supabase.from(')
	const hasMultipleQueries = content.match(/supabase\.from\(/g)?.length > 0
	
	logCheck(
		'E78.7-002',
		'R-E78.7-002',
		'No client-side multi-fetch logic present',
		!hasSupabaseFrom,
		hasSupabaseFrom ? `Found ${content.match(/supabase\.from\(/g)?.length || 0} supabase.from() calls` : null
	)
}

/**
 * E78.7-003: Check no diagnostic/health check code
 */
function checkNoDiagnostics(content) {
	const hasDiagnosis = content.includes('TriageDiagnosis')
	const hasHealthCheck = content.includes('/api/triage/health')
	const hasTriageLog = content.includes('triage-diagnose')
	
	logCheck(
		'E78.7-003',
		'R-E78.7-003',
		'No diagnostic/health check code present',
		!hasDiagnosis && !hasHealthCheck && !hasTriageLog,
		hasDiagnosis ? 'TriageDiagnosis type found' : hasHealthCheck ? 'Health check API call found' : hasTriageLog ? 'Diagnostic logging found' : null
	)
}

/**
 * E78.7-004: Check Active/Archive toggle present
 */
function checkActiveArchiveToggle(content) {
	const hasShowActive = content.includes('showActive')
	const hasActiveButton = content.includes('Aktiv')
	const hasArchiveButton = content.includes('Archiv')
	const hasToggle = content.includes('setShowActive')
	
	logCheck(
		'E78.7-004',
		'R-E78.7-004',
		'Active/Archive toggle present',
		hasShowActive && hasActiveButton && hasArchiveButton && hasToggle,
		!hasShowActive ? 'showActive state not found' : !hasToggle ? 'toggle handler not found' : null
	)
}

/**
 * E78.7-005: Check search box component present
 */
function checkSearchBox(content) {
	const hasSearchInput = content.includes('searchInput')
	const hasSearchQuery = content.includes('searchQuery')
	const hasSearchPlaceholder = content.includes('suchen')
	const hasSearchButton = content.includes('Suchen')
	
	logCheck(
		'E78.7-005',
		'R-E78.7-005',
		'Search box component present',
		hasSearchInput && hasSearchQuery && hasSearchPlaceholder,
		!hasSearchInput ? 'searchInput state not found' : !hasSearchQuery ? 'searchQuery state not found' : null
	)
}

/**
 * E78.7-006: Check status filter present
 */
function checkStatusFilter(content) {
	const hasStatusFilter = content.includes('statusFilter')
	const hasStatusSelect = content.includes('Alle Status')
	const hasCaseStates = content.includes('needs_input') && content.includes('in_progress')
	
	logCheck(
		'E78.7-006',
		'R-E78.7-006',
		'Status filter present',
		hasStatusFilter && hasStatusSelect && hasCaseStates,
		!hasStatusFilter ? 'statusFilter state not found' : !hasStatusSelect ? 'Status select dropdown not found' : null
	)
}

/**
 * E78.7-007: Check attention level filter present
 */
function checkAttentionFilter(content) {
	const hasAttentionFilter = content.includes('attentionFilter')
	const hasAttentionSelect = content.includes('Alle Prioritäten')
	const hasAttentionLevels = content.includes('critical') && content.includes('warn')
	
	logCheck(
		'E78.7-007',
		'R-E78.7-007',
		'Attention level filter present',
		hasAttentionFilter && hasAttentionSelect && hasAttentionLevels,
		!hasAttentionFilter ? 'attentionFilter state not found' : !hasAttentionSelect ? 'Attention select dropdown not found' : null
	)
}

/**
 * E78.7-008: Check table has Patient column
 */
function checkPatientColumn(content) {
	const hasPatientHeader = content.includes("header: 'Patient:in'")
	const hasPatientDisplay = content.includes('patient_display')
	
	logCheck(
		'E78.7-008',
		'R-E78.7-008',
		'Table has Patient column',
		hasPatientHeader && hasPatientDisplay,
		!hasPatientHeader ? 'Patient header not found' : !hasPatientDisplay ? 'patient_display field not found' : null
	)
}

/**
 * E78.7-009: Check table has Funnel/Episode column
 */
function checkFunnelColumn(content) {
	const hasFunnelHeader = content.includes("header: 'Funnel / Episode'")
	const hasFunnelSlug = content.includes('funnel_slug')
	
	logCheck(
		'E78.7-009',
		'R-E78.7-009',
		'Table has Funnel/Episode column',
		hasFunnelHeader && hasFunnelSlug,
		!hasFunnelHeader ? 'Funnel/Episode header not found' : !hasFunnelSlug ? 'funnel_slug field not found' : null
	)
}

/**
 * E78.7-010: Check table has Status column with case_state
 */
function checkStatusColumn(content) {
	const hasStatusHeader = content.includes("header: 'Status'")
	const hasCaseState = content.includes('case_state')
	const hasGetCaseStateBadge = content.includes('getCaseStateBadge')
	
	logCheck(
		'E78.7-010',
		'R-E78.7-010',
		'Table has Status column with case_state',
		hasStatusHeader && hasCaseState && hasGetCaseStateBadge,
		!hasStatusHeader ? 'Status header not found' : !hasCaseState ? 'case_state field not found' : null
	)
}

/**
 * E78.7-011: Check table has Reasons column with attention badges
 */
function checkReasonsColumn(content) {
	const hasReasonsHeader = content.includes("header: 'Gründe'")
	const hasAttentionLevel = content.includes('attention_level')
	const hasGetAttentionBadge = content.includes('getAttentionBadge')
	const hasAttentionItems = content.includes('attention_items')
	
	logCheck(
		'E78.7-011',
		'R-E78.7-011',
		'Table has Reasons column with attention badges',
		hasReasonsHeader && hasAttentionLevel && hasGetAttentionBadge,
		!hasReasonsHeader ? 'Gründe header not found' : !hasAttentionLevel ? 'attention_level field not found' : null
	)
}

/**
 * E78.7-012: Check table has Next Action column
 */
function checkNextActionColumn(content) {
	const hasNextActionHeader = content.includes("header: 'Nächste Aktion'")
	const hasNextAction = content.includes('next_action')
	const hasGetNextActionLabel = content.includes('getNextActionLabel')
	
	logCheck(
		'E78.7-012',
		'R-E78.7-012',
		'Table has Next Action column',
		hasNextActionHeader && hasNextAction && hasGetNextActionLabel,
		!hasNextActionHeader ? 'Nächste Aktion header not found' : !hasNextAction ? 'next_action field not found' : null
	)
}

/**
 * E78.7-013: Check table has Last Activity column
 */
function checkLastActivityColumn(content) {
	const hasLastActivityHeader = content.includes("header: 'Letzte Aktivität'")
	const hasLastActivityAt = content.includes('last_activity_at')
	
	logCheck(
		'E78.7-013',
		'R-E78.7-013',
		'Table has Last Activity column',
		hasLastActivityHeader && hasLastActivityAt,
		!hasLastActivityHeader ? 'Letzte Aktivität header not found' : !hasLastActivityAt ? 'last_activity_at field not found' : null
	)
}

/**
 * E78.7-014: Check no Risk/Score/Result columns
 */
function checkNoRiskScoreColumns(content) {
	const hasResultHeader = content.includes("header: 'Result'")
	const hasRiskLevel = content.includes('risk_level')
	const hasRiskScore = content.includes('risk_score')
	
	logCheck(
		'E78.7-014',
		'R-E78.7-014',
		'No Risk/Score/Result columns visible',
		!hasResultHeader && !hasRiskLevel && !hasRiskScore,
		hasResultHeader ? 'Result header found (should be removed)' : hasRiskLevel ? 'risk_level field found' : hasRiskScore ? 'risk_score field found' : null
	)
}

/**
 * E78.7-015: Check row actions dropdown present
 */
function checkRowActionsDropdown(content) {
	const hasActionsHeader = content.includes("header: 'Aktionen'")
	const hasMoreHorizontal = content.includes('MoreHorizontal')
	const hasOpenDropdown = content.includes('openDropdownId')
	
	logCheck(
		'E78.7-015',
		'R-E78.7-015',
		'Row actions dropdown present',
		hasActionsHeader && hasMoreHorizontal && hasOpenDropdown,
		!hasActionsHeader ? 'Aktionen header not found' : !hasMoreHorizontal ? 'MoreHorizontal icon not found' : null
	)
}

/**
 * E78.7-016: Check Flag action in dropdown
 */
function checkFlagAction(content) {
	const hasFlagAction = content.includes("handleRowAction('flag'")
	const hasFlagIcon = content.includes('<Flag')
	const hasFlagLabel = content.includes('Markieren')
	
	logCheck(
		'E78.7-016',
		'R-E78.7-016',
		'Flag action in dropdown',
		hasFlagAction && hasFlagIcon && hasFlagLabel,
		!hasFlagAction ? 'Flag action handler not found' : !hasFlagIcon ? 'Flag icon not found' : null
	)
}

/**
 * E78.7-017: Check Snooze action in dropdown
 */
function checkSnoozeAction(content) {
	const hasSnoozeAction = content.includes("handleRowAction('snooze'")
	const hasSnoozeLabel = content.includes('Zurückstellen')
	
	logCheck(
		'E78.7-017',
		'R-E78.7-017',
		'Snooze action in dropdown',
		hasSnoozeAction && hasSnoozeLabel,
		!hasSnoozeAction ? 'Snooze action handler not found' : !hasSnoozeLabel ? 'Zurückstellen label not found' : null
	)
}

/**
 * E78.7-018: Check Close action in dropdown
 */
function checkCloseAction(content) {
	const hasCloseAction = content.includes("handleRowAction('close'")
	const hasCloseLabel = content.includes('Schließen')
	const hasCheckCircle = content.includes('<CheckCircle')
	
	logCheck(
		'E78.7-018',
		'R-E78.7-018',
		'Close action in dropdown',
		hasCloseAction && hasCloseLabel && hasCheckCircle,
		!hasCloseAction ? 'Close action handler not found' : !hasCloseLabel ? 'Schließen label not found' : null
	)
}

/**
 * E78.7-019: Check Reopen action in dropdown
 */
function checkReopenAction(content) {
	const hasReopenAction = content.includes("handleRowAction('reopen'")
	const hasReopenLabel = content.includes('Wiedereröffnen')
	const hasRotateCcw = content.includes('<RotateCcw')
	
	logCheck(
		'E78.7-019',
		'R-E78.7-019',
		'Reopen action in dropdown',
		hasReopenAction && hasReopenLabel && hasRotateCcw,
		!hasReopenAction ? 'Reopen action handler not found' : !hasReopenLabel ? 'Wiedereröffnen label not found' : null
	)
}

/**
 * E78.7-020: Check Note action in dropdown
 */
function checkNoteAction(content) {
	const hasNoteAction = content.includes("handleRowAction('note'")
	const hasNoteLabel = content.includes('Notiz hinzufügen')
	const hasStickyNote = content.includes('<StickyNote')
	
	logCheck(
		'E78.7-020',
		'R-E78.7-020',
		'Note action in dropdown',
		hasNoteAction && hasNoteLabel && hasStickyNote,
		!hasNoteAction ? 'Note action handler not found' : !hasNoteLabel ? 'Notiz hinzufügen label not found' : null
	)
}

/**
 * E78.7-021: Check dark theme compliance
 */
function checkDarkTheme(content) {
	const hasDarkClasses = content.includes('dark:')
	const noPureWhite = !content.match(/#fff\b|#ffffff\b|rgb\(255,\s*255,\s*255\)/i)
	const noPureBlack = !content.match(/#000\b|#000000\b|rgb\(0,\s*0,\s*0\)/i)
	
	logCheck(
		'E78.7-021',
		'R-E78.7-021',
		'Dark theme compliance (no pure white/black)',
		hasDarkClasses && noPureWhite && noPureBlack,
		!hasDarkClasses ? 'No dark: classes found' : !noPureWhite ? 'Pure white color found' : !noPureBlack ? 'Pure black color found' : null
	)
}

/**
 * E78.7-022: Check page title is "Inbox"
 */
function checkPageTitle(content) {
	const hasInboxTitle = content.match(/>\s*Inbox\s*</)
	const noTriageTitle = !content.match(/Triage\s*\/\s*Übersicht/)
	
	logCheck(
		'E78.7-022',
		'R-E78.7-022',
		'Page title is "Inbox" not "Triage"',
		hasInboxTitle && noTriageTitle,
		!hasInboxTitle ? 'Inbox title not found' : !noTriageTitle ? 'Old "Triage / Übersicht" title still present' : null
	)
}

/**
 * Main verification function
 */
async function runVerification() {
	log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')
	log('🔍 E78.7 Inbox UI Refactor Verification', 'cyan')
	log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')
	
	const content = await readPageFile()
	
	logSection('API Integration (3 checks)')
	checkApiEndpoint(content)
	checkNoMultiFetch(content)
	checkNoDiagnostics(content)
	
	logSection('Filter Controls (4 checks)')
	checkActiveArchiveToggle(content)
	checkSearchBox(content)
	checkStatusFilter(content)
	checkAttentionFilter(content)
	
	logSection('Table Columns (6 checks)')
	checkPatientColumn(content)
	checkFunnelColumn(content)
	checkStatusColumn(content)
	checkReasonsColumn(content)
	checkNextActionColumn(content)
	checkLastActivityColumn(content)
	
	logSection('Removed Features (1 check)')
	checkNoRiskScoreColumns(content)
	
	logSection('Row Actions (6 checks)')
	checkRowActionsDropdown(content)
	checkFlagAction(content)
	checkSnoozeAction(content)
	checkCloseAction(content)
	checkReopenAction(content)
	checkNoteAction(content)
	
	logSection('UI/UX Requirements (2 checks)')
	checkDarkTheme(content)
	checkPageTitle(content)
	
	// Summary
	log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')
	log('📊 Summary', 'cyan')
	log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')
	
	log(`✅ Passed: ${results.passed}`, results.passed > 0 ? 'green' : 'reset')
	log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset')
	
	if (results.warnings > 0) {
		log(`⚠️  Warnings: ${results.warnings}`, 'yellow')
	}
	
	if (results.failed === 0) {
		log('\n✅ E78.7 Inbox UI refactor verification PASSED', 'green')
		log('   All requirements met', 'green')
		process.exit(0)
	} else {
		log('\n❌ E78.7 Inbox UI refactor verification FAILED', 'red')
		log(`   ${results.failed} check(s) failed`, 'red')
		log('   Please address the failed checks above', 'yellow')
		process.exit(1)
	}
}

// Run verification
runVerification().catch((error) => {
	log(`\n❌ Fatal error: ${error.message}`, 'red')
	console.error(error)
	process.exit(2)
})
