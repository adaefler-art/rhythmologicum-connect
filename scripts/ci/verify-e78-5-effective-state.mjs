#!/usr/bin/env node
/**
 * E78.5 — Auto + HITL Merge: Effective State Verification Script
 * 
 * Validates that all components of E78.5 are correctly implemented:
 * - Database migration exists and is correct
 * - View integration with HITL actions
 * - Effective state fields present
 * - API filtering for snooze/close
 * - Audit trail completeness
 * 
 * Exit codes:
 * - 0: All checks passed
 * - 1: One or more checks failed
 * - 2: Script error
 * 
 * Usage:
 *   npm run verify:e78-5
 *   node scripts/ci/verify-e78-5-effective-state.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '../..')

// ANSI colors
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'

let passed = 0
let failed = 0
let warnings = 0

function log(message, color = RESET) {
	console.log(`${color}${message}${RESET}`)
}

function check(name, test, warningOnly = false) {
	try {
		const result = test()
		if (result) {
			log(`✅ ${name}`, GREEN)
			passed++
			return true
		} else {
			if (warningOnly) {
				log(`⚠️  ${name}`, YELLOW)
				warnings++
				return false
			} else {
				log(`❌ ${name} - violates ${extractRuleId(name)}`, RED)
				failed++
				return false
			}
		}
	} catch (error) {
		if (warningOnly) {
			log(`⚠️  ${name}: ${error.message}`, YELLOW)
			warnings++
			return false
		} else {
			log(`❌ ${name}: ${error.message} - violates ${extractRuleId(name)}`, RED)
			failed++
			return false
		}
	}
}

function extractRuleId(name) {
	const match = name.match(/R-E78\.5-\d+/)
	return match ? match[0] : 'unknown-rule'
}

function fileExists(filePath) {
	return fs.existsSync(path.join(ROOT, filePath))
}

function fileContains(filePath, pattern) {
	const fullPath = path.join(ROOT, filePath)
	if (!fs.existsSync(fullPath)) return false
	const content = fs.readFileSync(fullPath, 'utf-8')
	return typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content)
}

// Header
log('\n' + '━'.repeat(80), BLUE)
log(`${BOLD}🔍 E78.5 Effective State Integration Verification${RESET}`, BLUE)
log('━'.repeat(80) + '\n', BLUE)

// Database Migration Checks
log(`\n${BOLD}📦 Database Migration (10 checks)${RESET}`)

check(
	'R-E78.5-001: Migration file exists',
	() => fileExists('supabase/migrations/20260207042600_e78_5_effective_state_integration.sql')
)

check(
	'R-E78.5-002: Migration contains latest_snooze CTE',
	() => fileContains('supabase/migrations/20260207042600_e78_5_effective_state_integration.sql', 'latest_snooze AS')
)

check(
	'R-E78.5-003: Migration contains latest_close_reopen CTE',
	() => fileContains('supabase/migrations/20260207042600_e78_5_effective_state_integration.sql', 'latest_close_reopen AS')
)

check(
	'R-E78.5-004: Migration contains latest_manual_flag CTE',
	() => fileContains('supabase/migrations/20260207042600_e78_5_effective_state_integration.sql', 'latest_manual_flag AS')
)

check(
	'R-E78.5-005: Migration contains latest_acknowledge CTE',
	() => fileContains('supabase/migrations/20260207042600_e78_5_effective_state_integration.sql', 'latest_acknowledge AS')
)

check(
	'R-E78.5-006: Migration computes snoozed_until field',
	() => fileContains('supabase/migrations/20260207042600_e78_5_effective_state_integration.sql', /snoozed_until_str.*::timestamptz/)
)

check(
	'R-E78.5-007: Migration computes is_manually_closed field',
	() => fileContains('supabase/migrations/20260207042600_e78_5_effective_state_integration.sql', 'is_manually_closed')
)

check(
	'R-E78.5-008: Migration computes manual_flag_severity field',
	() => fileContains('supabase/migrations/20260207042600_e78_5_effective_state_integration.sql', 'manual_flag_severity')
)

check(
	'R-E78.5-009: Migration computes acknowledged_at field',
	() => fileContains('supabase/migrations/20260207042600_e78_5_effective_state_integration.sql', /la\.acknowledged_at/)
)

check(
	'R-E78.5-010: Migration integrates manual_flag into attention_items',
	() => fileContains('supabase/migrations/20260207042600_e78_5_effective_state_integration.sql', /'manual_flag'::text END/)
)

// Schema.sql Checks
log(`\n${BOLD}📝 Schema.sql (8 checks)${RESET}`)

check(
	'R-E78.5-011: schema.sql contains triage_cases_v1 view',
	() => fileContains('schema/schema.sql', /CREATE OR REPLACE VIEW.*triage_cases_v1/)
)

check(
	'R-E78.5-012: schema.sql contains latest_snooze CTE',
	() => fileContains('schema/schema.sql', 'latest_snooze AS')
)

check(
	'R-E78.5-013: schema.sql contains latest_close_reopen CTE',
	() => fileContains('schema/schema.sql', 'latest_close_reopen AS')
)

check(
	'R-E78.5-014: schema.sql contains latest_manual_flag CTE',
	() => fileContains('schema/schema.sql', 'latest_manual_flag AS')
)

check(
	'R-E78.5-015: schema.sql contains latest_acknowledge CTE',
	() => fileContains('schema/schema.sql', 'latest_acknowledge AS')
)

check(
	'R-E78.5-016: schema.sql contains snoozed_until field',
	() => fileContains('schema/schema.sql', /snoozed_until/)
)

check(
	'R-E78.5-017: schema.sql contains is_manually_closed field',
	() => fileContains('schema/schema.sql', 'is_manually_closed')
)

check(
	'R-E78.5-018: schema.sql view comment references E78.5',
	() => fileContains('schema/schema.sql', /COMMENT ON VIEW.*triage_cases_v1.*E78\.5/)
)

// API Integration Checks
log(`\n${BOLD}🌐 API Integration (5 checks)${RESET}`)

check(
	'R-E78.5-019: Triage API exists',
	() => fileExists('apps/rhythm-studio-ui/app/api/clinician/triage/route.ts')
)

check(
	'R-E78.5-020: Triage API filters snoozed cases when activeOnly',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/route.ts', /snoozed_until/)
)

check(
	'R-E78.5-021: Triage API references R-E78.5-007 rule for closed filtering',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/route.ts', 'R-E78.5-007')
)

check(
	'R-E78.5-022: Triage API references R-E78.5-008 rule for snooze filtering',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/route.ts', 'R-E78.5-008')
)

check(
	'R-E78.5-023: Triage API uses is_active for filtering',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/route.ts', /eq\('is_active',\s*true\)/)
)

// Audit Trail Checks
log(`\n${BOLD}📋 Audit Trail (5 checks)${RESET}`)

check(
	'R-E78.5-024: triage_case_actions table exists in schema',
	() => fileContains('schema/schema.sql', 'CREATE TABLE IF NOT EXISTS "public"."triage_case_actions"')
)

check(
	'R-E78.5-025: triage_case_actions has snooze action type',
	() => fileContains('schema/schema.sql', /'snooze'/)
)

check(
	'R-E78.5-026: triage_case_actions has close action type',
	() => fileContains('schema/schema.sql', /'close'/)
)

check(
	'R-E78.5-027: triage_case_actions has manual_flag action type',
	() => fileContains('schema/schema.sql', /'manual_flag'/)
)

check(
	'R-E78.5-028: triage_case_actions has acknowledge action type',
	() => fileContains('schema/schema.sql', /'acknowledge'/)
)

// View Logic Checks
log(`\n${BOLD}🔄 View Logic (7 checks)${RESET}`)

check(
	'R-E78.5-029: View handles manual close override in case_state',
	() => fileContains('schema/schema.sql', /WHEN lcr\.action_type = 'close' THEN 'resolved'/)
)

check(
	'R-E78.5-030: View includes manual_flag in attention_level computation',
	() => fileContains('schema/schema.sql', /'manual_flag'.*THEN 'warn'/)
)

check(
	'R-E78.5-031: View sets is_active=false for manually closed cases',
	() => fileContains('schema/schema.sql', /lcr\.action_type = 'close' THEN false/)
)

check(
	'R-E78.5-032: View joins latest_snooze CTE',
	() => fileContains('schema/schema.sql', /LEFT JOIN latest_snooze ls ON/)
)

check(
	'R-E78.5-033: View joins latest_close_reopen CTE',
	() => fileContains('schema/schema.sql', /LEFT JOIN latest_close_reopen lcr ON/)
)

check(
	'R-E78.5-034: View joins latest_manual_flag CTE',
	() => fileContains('schema/schema.sql', /LEFT JOIN latest_manual_flag lmf ON/)
)

check(
	'R-E78.5-035: View joins latest_acknowledge CTE',
	() => fileContains('schema/schema.sql', /LEFT JOIN latest_acknowledge la ON/)
)

// Summary
log('\n' + '━'.repeat(80), BLUE)
log(`${BOLD}📊 Summary${RESET}`, BLUE)
log('━'.repeat(80), BLUE)
log(`✅ Passed: ${passed}`, GREEN)
log(`❌ Failed: ${failed}`, failed > 0 ? RED : GREEN)
log(`⚠️  Warnings: ${warnings}`, warnings > 0 ? YELLOW : GREEN)
log('')

if (failed > 0) {
	log(`${BOLD}❌ Verification FAILED${RESET}`, RED)
	log(`${failed} critical check(s) did not pass.`, RED)
	log('Review the violations above and fix them before proceeding.', YELLOW)
	process.exit(1)
} else {
	log(`${BOLD}✅ Verification PASSED${RESET}`, GREEN)
	log(`All ${passed} checks passed successfully.`, GREEN)
	if (warnings > 0) {
		log(`⚠️  ${warnings} warning(s) found. Review them when possible.`, YELLOW)
	}
	process.exit(0)
}
