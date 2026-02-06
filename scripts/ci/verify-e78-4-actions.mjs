#!/usr/bin/env node
/**
 * E78.4 — HITL Actions v1: Verification Script
 * 
 * Validates that all components of E78.4 are correctly implemented:
 * - Database migration exists
 * - Table schema matches specification
 * - RLS policies are configured
 * - API endpoints exist
 * - Shared utilities are present
 * 
 * Exit codes:
 * - 0: All checks passed
 * - 1: One or more checks failed
 * - 2: Script error
 * 
 * Usage:
 *   npm run verify:e78-4
 *   node scripts/ci/verify-e78-4-actions.mjs
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
				log(`❌ ${name}`, RED)
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
			log(`❌ ${name}: ${error.message}`, RED)
			failed++
			return false
		}
	}
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
log(`${BOLD}🔍 E78.4 HITL Actions v1 Verification${RESET}`, BLUE)
log('━'.repeat(80) + '\n', BLUE)

// Database Migration Checks
log(`\n${BOLD}📦 Database Migration (8 checks)${RESET}`)

check(
	'R-E78.4-001: Migration file exists',
	() => fileExists('supabase/migrations/20260205193700_e78_4_create_triage_case_actions.sql')
)

check(
	'R-E78.4-002: Enum type triage_action_type created',
	() => fileContains('supabase/migrations/20260205193700_e78_4_create_triage_case_actions.sql', 'CREATE TYPE public.triage_action_type')
)

check(
	'R-E78.4-003: Table triage_case_actions created',
	() => fileContains('supabase/migrations/20260205193700_e78_4_create_triage_case_actions.sql', 'CREATE TABLE IF NOT EXISTS public.triage_case_actions')
)

check(
	'R-E78.4-004: Index on assessment_id',
	() => fileContains('supabase/migrations/20260205193700_e78_4_create_triage_case_actions.sql', 'idx_triage_case_actions_assessment_id')
)

check(
	'R-E78.4-005: Index on patient_id',
	() => fileContains('supabase/migrations/20260205193700_e78_4_create_triage_case_actions.sql', 'idx_triage_case_actions_patient_id')
)

check(
	'R-E78.4-006: Index on created_at',
	() => fileContains('supabase/migrations/20260205193700_e78_4_create_triage_case_actions.sql', 'idx_triage_case_actions_created_at')
)

check(
	'R-E78.4-007: RLS policy for clinician read',
	() => fileContains('supabase/migrations/20260205193700_e78_4_create_triage_case_actions.sql', 'triage_case_actions_read_clinician')
)

check(
	'R-E78.4-008: RLS policy for clinician insert',
	() => fileContains('supabase/migrations/20260205193700_e78_4_create_triage_case_actions.sql', 'triage_case_actions_insert_clinician')
)

// Schema.sql Checks
log(`\n${BOLD}📄 Schema.sql (6 checks)${RESET}`)

check(
	'Schema includes triage_action_type enum',
	() => fileContains('schema/schema.sql', 'CREATE TYPE "public"."triage_action_type"')
)

check(
	'Schema includes triage_case_actions table',
	() => fileContains('schema/schema.sql', 'CREATE TABLE IF NOT EXISTS "public"."triage_case_actions"')
)

check(
	'Schema includes all indexes',
	() => fileContains('schema/schema.sql', 'idx_triage_case_actions_assessment_id') &&
		fileContains('schema/schema.sql', 'idx_triage_case_actions_patient_id') &&
		fileContains('schema/schema.sql', 'idx_triage_case_actions_created_at')
)

check(
	'Schema includes primary key constraint',
	() => fileContains('schema/schema.sql', 'triage_case_actions_pkey')
)

check(
	'Schema includes foreign key constraints',
	() => fileContains('schema/schema.sql', 'triage_case_actions_created_by_fkey') &&
		fileContains('schema/schema.sql', 'triage_case_actions_patient_id_fkey') &&
		fileContains('schema/schema.sql', 'triage_case_actions_assessment_id_fkey')
)

check(
	'Schema includes RLS policies',
	() => fileContains('schema/schema.sql', 'triage_case_actions_read_clinician') &&
		fileContains('schema/schema.sql', 'triage_case_actions_insert_clinician')
)

// API Endpoints Checks
log(`\n${BOLD}🔌 API Endpoints (6 checks)${RESET}`)

check(
	'R-E78.4-020: POST /ack endpoint exists',
	() => fileExists('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/ack/route.ts')
)

check(
	'R-E78.4-022: POST /snooze endpoint exists',
	() => fileExists('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/snooze/route.ts')
)

check(
	'R-E78.4-024: POST /close endpoint exists',
	() => fileExists('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/close/route.ts')
)

check(
	'R-E78.4-026: POST /reopen endpoint exists',
	() => fileExists('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/reopen/route.ts')
)

check(
	'R-E78.4-028: POST /flag endpoint exists',
	() => fileExists('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/flag/route.ts')
)

check(
	'R-E78.4-031: POST /note endpoint exists',
	() => fileExists('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/note/route.ts')
)

// Shared Utilities Checks
log(`\n${BOLD}🛠️  Shared Utilities (4 checks)${RESET}`)

check(
	'R-E78.4-009: Shared actions module exists',
	() => fileExists('apps/rhythm-studio-ui/app/api/clinician/triage/cases/_shared/actions.ts')
)

check(
	'R-E78.4-011: executeTriageAction function implemented',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/cases/_shared/actions.ts', 'export async function executeTriageAction')
)

check(
	'R-E78.4-011: getLatestAction function implemented',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/cases/_shared/actions.ts', 'export async function getLatestAction')
)

check(
	'R-E78.4-012: TriageActionType type defined',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/cases/_shared/actions.ts', 'export type TriageActionType')
)

// Endpoint Implementation Checks
log(`\n${BOLD}✅ Endpoint Implementations (6 checks)${RESET}`)

check(
	'R-E78.4-021: Ack endpoint has idempotency check',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/ack/route.ts', 'checkIdempotency')
)

check(
	'R-E78.4-023: Snooze endpoint has payload validation',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/snooze/route.ts', 'validatePayload')
)

check(
	'R-E78.4-025: Close endpoint has idempotency check',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/close/route.ts', 'checkIdempotency')
)

check(
	'R-E78.4-027: Reopen endpoint has idempotency check',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/reopen/route.ts', 'checkIdempotency')
)

check(
	'R-E78.4-029: Flag endpoint has payload validation',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/flag/route.ts', 'validatePayload')
)

check(
	'R-E78.4-032: Note endpoint has payload validation',
	() => fileContains('apps/rhythm-studio-ui/app/api/clinician/triage/cases/[caseId]/note/route.ts', 'validatePayload')
)

// Documentation Checks
log(`\n${BOLD}📚 Documentation (1 check)${RESET}`)

check(
	'RULES_VS_CHECKS_MATRIX document exists',
	() => fileExists('docs/triage/RULES_VS_CHECKS_MATRIX_E78_4.md')
)

// Summary
log('\n' + '━'.repeat(80), BLUE)
log(`${BOLD}📊 Summary${RESET}`, BLUE)
log('━'.repeat(80), BLUE)
log(`✅ Passed: ${passed}`, GREEN)
log(`❌ Failed: ${failed}`, RED)
log(`⚠️  Warnings: ${warnings}`, YELLOW)

if (failed === 0) {
	log('\n✅ E78.4 HITL Actions v1 verification passed', GREEN)
	if (warnings > 0) {
		log(`⚠️  ${warnings} warning(s) - review recommended`, YELLOW)
	}
	process.exit(0)
} else {
	log('\n❌ E78.4 HITL Actions v1 verification failed', RED)
	log(`   ${failed} check(s) failed`, RED)
	process.exit(1)
}
