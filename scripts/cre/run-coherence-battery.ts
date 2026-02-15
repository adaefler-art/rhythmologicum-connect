#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateRedFlags } from '../../lib/cre/safety/redFlags'
import {
  applySafetyPolicy,
  getEffectiveSafetyState,
  loadSafetyPolicy,
} from '../../lib/cre/safety/policyEngine'
import { buildEffectiveSafety } from '../../lib/cre/safety/overrideHelpers'
import { generateReasoningPack } from '../../lib/cre/reasoning/engine'
import { getSeedClinicalReasoningConfig } from '../../lib/cre/reasoning/configStore'
import {
  generateFollowupQuestions,
  mergeClinicianRequestedItemsIntoFollowup,
} from '../../lib/cre/followup/generator'
import { validateClinicalIntakeReviewInput } from '../../lib/clinicalIntake/reviewWorkflow'
import { buildClinicalIntakeExportPayload } from '../../lib/clinicalIntake/exportPayload'
import { renderClinicalIntakeSummaryPdf } from '../../lib/clinicalIntake/exportPdf'
import type {
  PolicyOverride,
  StructuredIntakeData,
  SafetyTriggeredRule,
  ClinicalFollowupQuestion,
} from '../../lib/types/clinicalIntake'
import type { Json } from '../../lib/types/supabase'

type ScenarioReviewStep = {
  status: 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
  review_notes?: string
  requested_items?: string[]
  apply_patient_patch_after?: boolean
}

type ScenarioFixture = {
  id: string
  title: string
  conversation: Array<{ id: string; content: string }>
  intake: StructuredIntakeData
  review_flow?: {
    steps: ScenarioReviewStep[]
    patient_patch?: Record<string, unknown>
  }
  override?: PolicyOverride
  expected: {
    safety?: {
      effective_level?: string | null
      effective_action?: string | null
      forbid_level_a?: boolean
      forbid_hard_stop?: boolean
    }
    reasoning?: {
      risk_level?: 'low' | 'medium' | 'high'
      must_include_differentials?: string[]
    }
    followup?: {
      min_next_questions?: number
      required_sources?: Array<'reasoning' | 'gap_rule' | 'clinician_request'>
      must_include_substrings?: string[]
    }
    review?: {
      transitions?: string[]
      final_status?: string
    }
    export?: {
      pdf_magic?: boolean
      expect_policy_override?: boolean
      policy_override_level?: string | null
      policy_override_action?: string | null
      current_review_status?: string | null
    }
  }
}

type ReviewRecord = {
  id: string
  intake_id: string
  status: 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
  review_notes: string | null
  requested_items: string[] | null
  reviewed_by: string
  is_current: boolean
  created_at: string
  updated_at: string
}

type ScenarioActual = {
  safety: {
    effective_level: string | null
    effective_action: string | null
    triggered_rules: string[]
  }
  reasoning: {
    risk_level: 'low' | 'medium' | 'high'
    differential_labels: string[]
  }
  followup: {
    next_questions_count: number
    next_questions: ClinicalFollowupQuestion[]
  }
  review: {
    transitions: string[]
    final_status: string | null
  }
  export: {
    policy_override_level: string | null
    policy_override_action: string | null
    current_review_status: string | null
    pdf_magic: boolean
    pdf_content_type: string
  }
}

type ScenarioResult = {
  id: string
  title: string
  expected: ScenarioFixture['expected']
  actual: ScenarioActual
  mismatches: string[]
  passed: boolean
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '../..')
const FIXTURE_DIR = path.join(
  REPO_ROOT,
  'apps',
  'rhythm-studio-ui',
  'tests',
  'fixtures',
  'cre-scenarios',
)
const REPORT_PATH = path.join(REPO_ROOT, 'docs', 'cre', 'coherence', 'latest.md')
const REPORT_JSON_PATH = path.join(REPO_ROOT, 'docs', 'cre', 'coherence', 'latest.json')
const MODE = process.env.CRE_COHERENCE_MODE ?? 'mock'
const DEBUG = process.env.CRE_COHERENCE_DEBUG === '1'
const SHOULD_WRITE_MARKDOWN_REPORT = process.env.CI === 'true' || process.env.CRE_WRITE_LATEST_MD === '1'
const NOW_ISO = '2026-02-14T12:00:00.000Z'
const REVIEWER_ID = 'coherence-reviewer'

function readFixtures(): ScenarioFixture[] {
  const entries = fs
    .readdirSync(FIXTURE_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b))

  return entries.map((entry) => {
    const fullPath = path.join(FIXTURE_DIR, entry)
    const raw = fs.readFileSync(fullPath, 'utf8')
    return JSON.parse(raw) as ScenarioFixture
  })
}

function deepMerge<T>(target: T, patch: Record<string, unknown>): T {
  const out = Array.isArray(target) ? [...target] : { ...(target as Record<string, unknown>) }

  for (const [key, value] of Object.entries(patch)) {
    const current = (out as Record<string, unknown>)[key]

    if (Array.isArray(value)) {
      ;(out as Record<string, unknown>)[key] = [...value]
      continue
    }

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      ;(out as Record<string, unknown>)[key] = deepMerge(
        current as Record<string, unknown>,
        value as Record<string, unknown>,
      )
      continue
    }

    ;(out as Record<string, unknown>)[key] = value
  }

  return out as T
}

function computeClinicalState(params: {
  intake: StructuredIntakeData
  conversation: Array<{ id: string; content: string }>
}): StructuredIntakeData {
  const policy = loadSafetyPolicy({ organizationId: null, funnelId: null })
  const reasoningConfig = getSeedClinicalReasoningConfig()

  const safety = evaluateRedFlags({
    structuredData: params.intake,
    verbatimChatMessages: params.conversation,
  })

  const policyResult = applySafetyPolicy({
    triggeredRules: (safety.triggered_rules ?? []).filter((rule) => rule.verified),
    policy,
  })

  const effective = getEffectiveSafetyState({ policyResult, override: null })

  const next: StructuredIntakeData = {
    ...params.intake,
    red_flags: safety.red_flags.map((flag) => flag.id),
    safety: {
      ...safety,
      policy_result: policyResult,
      effective_policy_result: policyResult,
      effective_level: effective.escalationLevel,
      effective_action: effective.chatAction,
      override: null,
    },
  }

  next.reasoning = generateReasoningPack(next, reasoningConfig)
  next.followup = generateFollowupQuestions({
    structuredData: next,
    now: new Date(NOW_ISO),
  })

  return next
}

function applyOverride(
  intake: StructuredIntakeData,
  override: PolicyOverride,
): StructuredIntakeData {
  const policy = loadSafetyPolicy({ organizationId: null, funnelId: null })
  const reasoningConfig = getSeedClinicalReasoningConfig()
  const built = buildEffectiveSafety({
    structuredData: intake as unknown as Record<string, unknown>,
    policyOverride: override,
    policy,
  })

  const next: StructuredIntakeData = {
    ...intake,
    safety: built.safety,
  }

  next.reasoning = generateReasoningPack(next, reasoningConfig)
  next.followup = generateFollowupQuestions({
    structuredData: next,
    now: new Date(NOW_ISO),
  })

  return next
}

function buildReviewTimeline(params: {
  intakeId: string
  reviewFlow?: ScenarioFixture['review_flow']
  currentStructuredData: StructuredIntakeData
  conversation: Array<{ id: string; content: string }>
}): {
  reviewAudit: ReviewRecord[]
  structuredData: StructuredIntakeData
} {
  const reviewAudit: ReviewRecord[] = []
  let structuredData = params.currentStructuredData

  const steps = params.reviewFlow?.steps ?? []

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index]
    const validation = validateClinicalIntakeReviewInput(step)

    if (!validation.ok) {
      throw new Error(
        `Review step ${index + 1} invalid for ${params.intakeId}: ${validation.message}`,
      )
    }

    if (validation.data.status === 'needs_more_info' && validation.data.requested_items?.length) {
      structuredData = mergeClinicianRequestedItemsIntoFollowup({
        structuredData,
        requestedItems: validation.data.requested_items,
        now: new Date(NOW_ISO),
      })

      if (step.apply_patient_patch_after && params.reviewFlow?.patient_patch) {
        const mergedPatched = deepMerge(
          structuredData,
          params.reviewFlow.patient_patch,
        )
        structuredData = computeClinicalState({
          intake: mergedPatched,
          conversation: params.conversation,
        })
      }
    }

    reviewAudit.forEach((entry) => {
      entry.is_current = false
    })

    const createdAt = new Date(Date.parse(NOW_ISO) + index * 60_000).toISOString()

    reviewAudit.push({
      id: `${params.intakeId}-review-${index + 1}`,
      intake_id: params.intakeId,
      status: validation.data.status,
      review_notes: validation.data.review_notes,
      requested_items: validation.data.requested_items,
      reviewed_by: REVIEWER_ID,
      is_current: true,
      created_at: createdAt,
      updated_at: createdAt,
    })
  }

  return { reviewAudit, structuredData }
}

function validateScenario(
  fixture: ScenarioFixture,
  actual: ScenarioActual,
): string[] {
  const mismatches: string[] = []
  const expected = fixture.expected

  const expectSafety = expected.safety
  if (expectSafety) {
    if (expectSafety.effective_level !== undefined && actual.safety.effective_level !== expectSafety.effective_level) {
      mismatches.push(
        `safety.effective_level expected ${String(expectSafety.effective_level)} but got ${String(actual.safety.effective_level)}`,
      )
    }

    if (expectSafety.effective_action !== undefined && actual.safety.effective_action !== expectSafety.effective_action) {
      mismatches.push(
        `safety.effective_action expected ${String(expectSafety.effective_action)} but got ${String(actual.safety.effective_action)}`,
      )
    }

    if (expectSafety.forbid_level_a && actual.safety.effective_level === 'A') {
      mismatches.push('safety.forbid_level_a violated (got level A)')
    }

    if (expectSafety.forbid_hard_stop && actual.safety.effective_action === 'hard_stop') {
      mismatches.push('safety.forbid_hard_stop violated (got hard_stop)')
    }
  }

  const expectReasoning = expected.reasoning
  if (expectReasoning) {
    if (expectReasoning.risk_level && actual.reasoning.risk_level !== expectReasoning.risk_level) {
      mismatches.push(
        `reasoning.risk_level expected ${expectReasoning.risk_level} but got ${actual.reasoning.risk_level}`,
      )
    }

    for (const differential of expectReasoning.must_include_differentials ?? []) {
      const matched = actual.reasoning.differential_labels.some((label) =>
        label.toLowerCase().includes(differential.toLowerCase()),
      )
      if (!matched) {
        mismatches.push(`reasoning differential missing substring: ${differential}`)
      }
    }
  }

  const expectFollowup = expected.followup
  if (expectFollowup) {
    if (
      typeof expectFollowup.min_next_questions === 'number' &&
      actual.followup.next_questions_count < expectFollowup.min_next_questions
    ) {
      mismatches.push(
        `followup.next_questions_count expected >= ${expectFollowup.min_next_questions} but got ${actual.followup.next_questions_count}`,
      )
    }

    const sources = new Set(actual.followup.next_questions.map((q) => q.source))
    for (const source of expectFollowup.required_sources ?? []) {
      if (!sources.has(source)) {
        mismatches.push(`followup required source missing: ${source}`)
      }
    }

    const followupText = actual.followup.next_questions
      .map((q) => q.question.toLowerCase())
      .join(' | ')

    for (const substring of expectFollowup.must_include_substrings ?? []) {
      if (!followupText.includes(substring.toLowerCase())) {
        mismatches.push(`followup question missing substring: ${substring}`)
      }
    }
  }

  const expectReview = expected.review
  if (expectReview) {
    if (expectReview.transitions) {
      const expectedTransitions = JSON.stringify(expectReview.transitions)
      const actualTransitions = JSON.stringify(actual.review.transitions)
      if (expectedTransitions !== actualTransitions) {
        mismatches.push(`review.transitions expected ${expectedTransitions} but got ${actualTransitions}`)
      }
    }

    if (expectReview.final_status !== undefined && actual.review.final_status !== expectReview.final_status) {
      mismatches.push(
        `review.final_status expected ${String(expectReview.final_status)} but got ${String(actual.review.final_status)}`,
      )
    }
  }

  const expectExport = expected.export
  if (expectExport) {
    if (expectExport.pdf_magic !== undefined && actual.export.pdf_magic !== expectExport.pdf_magic) {
      mismatches.push(`export.pdf_magic expected ${expectExport.pdf_magic} but got ${actual.export.pdf_magic}`)
    }

    if (
      expectExport.expect_policy_override === true &&
      !(actual.export.policy_override_level || actual.export.policy_override_action)
    ) {
      mismatches.push('export policy_override expected but missing')
    }

    if (
      expectExport.expect_policy_override === false &&
      (actual.export.policy_override_level || actual.export.policy_override_action)
    ) {
      mismatches.push('export policy_override not expected but present')
    }

    if (
      expectExport.policy_override_level !== undefined &&
      actual.export.policy_override_level !== expectExport.policy_override_level
    ) {
      mismatches.push(
        `export.policy_override_level expected ${String(expectExport.policy_override_level)} but got ${String(actual.export.policy_override_level)}`,
      )
    }

    if (
      expectExport.policy_override_action !== undefined &&
      actual.export.policy_override_action !== expectExport.policy_override_action
    ) {
      mismatches.push(
        `export.policy_override_action expected ${String(expectExport.policy_override_action)} but got ${String(actual.export.policy_override_action)}`,
      )
    }

    if (
      expectExport.current_review_status !== undefined &&
      actual.export.current_review_status !== expectExport.current_review_status
    ) {
      mismatches.push(
        `export.current_review_status expected ${String(expectExport.current_review_status)} but got ${String(actual.export.current_review_status)}`,
      )
    }
  }

  return mismatches
}

async function runScenario(fixture: ScenarioFixture): Promise<ScenarioResult> {
  const intakeId = `coh-${fixture.id.toLowerCase()}`
  const patientUserId = `patient-${fixture.id.toLowerCase()}`

  let structuredData = computeClinicalState({
    intake: fixture.intake,
    conversation: fixture.conversation,
  })

  if (fixture.override) {
    structuredData = applyOverride(structuredData, fixture.override)
  }

  const review = buildReviewTimeline({
    intakeId,
    reviewFlow: fixture.review_flow,
    currentStructuredData: structuredData,
    conversation: fixture.conversation,
  })

  structuredData = review.structuredData

  const intakeRecord = {
    id: intakeId,
    user_id: patientUserId,
    patient_id: `profile-${fixture.id.toLowerCase()}`,
    version_number: 1,
    clinical_summary: fixture.title,
    structured_data: structuredData as unknown as Record<string, unknown>,
    policy_override: (fixture.override ?? null) as unknown as Json,
    trigger_reason: 'manual',
    last_updated_from_messages: fixture.conversation.map((entry) => entry.id),
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  }

  const payload = buildClinicalIntakeExportPayload({
    intake: intakeRecord,
    reviewAudit: review.reviewAudit,
    generatedAt: NOW_ISO,
  })

  const pdfBuffer = await renderClinicalIntakeSummaryPdf(payload)
  const pdfMagic = Buffer.from(pdfBuffer).subarray(0, 4).toString('utf8') === '%PDF'

  const actual: ScenarioActual = {
    safety: {
      effective_level: structuredData.safety?.effective_level ?? null,
      effective_action: structuredData.safety?.effective_action ?? null,
      triggered_rules: (structuredData.safety?.triggered_rules ?? []).map(
        (rule: SafetyTriggeredRule) => `${rule.rule_id}:${rule.level}:${rule.verified ? 'verified' : 'unverified'}`,
      ),
    },
    reasoning: {
      risk_level: structuredData.reasoning?.risk_estimation.level ?? 'low',
      differential_labels: structuredData.reasoning?.differentials.map((entry) => entry.label) ?? [],
    },
    followup: {
      next_questions_count: structuredData.followup?.next_questions.length ?? 0,
      next_questions: structuredData.followup?.next_questions ?? [],
    },
    review: {
      transitions: review.reviewAudit.map((entry) => entry.status),
      final_status: review.reviewAudit[review.reviewAudit.length - 1]?.status ?? null,
    },
    export: {
      policy_override_level:
        payload.safety.policy_override_audit[0]?.override_level ?? null,
      policy_override_action:
        payload.safety.policy_override_audit[0]?.override_action ?? null,
      current_review_status: payload.review.current?.status ?? null,
      pdf_magic: pdfMagic,
      pdf_content_type: 'application/pdf',
    },
  }

  const mismatches = validateScenario(fixture, actual)

  if (DEBUG) {
    console.log(`\n[coherence-debug] ${fixture.id} ${fixture.title}`)
    console.log('safety.effective_policy_result', {
      escalation_level: structuredData.safety?.effective_policy_result?.escalation_level ?? null,
      chat_action: structuredData.safety?.effective_policy_result?.chat_action ?? null,
    })
    console.log('triggered_rules', (structuredData.safety?.triggered_rules ?? []).map((rule) => ({
      rule_id: rule.rule_id,
      level: rule.level,
      verified: rule.verified,
      evidence_ids: rule.evidence.map((ev) => ev.source_id),
    })))
    console.log('reasoning.risk_estimation', structuredData.reasoning?.risk_estimation ?? null)
    console.log('followup.next_questions', {
      asked_question_ids: structuredData.followup?.asked_question_ids ?? [],
      next_questions: structuredData.followup?.next_questions ?? [],
    })
    console.log('review.state', {
      transitions: review.reviewAudit.map((entry) => entry.status),
      current: review.reviewAudit.find((entry) => entry.is_current) ?? null,
    })
    console.log('export.keys', {
      safety: Object.keys(payload.safety ?? {}),
      review: Object.keys(payload.review ?? {}),
      audit: Object.keys(payload.audit ?? {}),
    })
  }

  return {
    id: fixture.id,
    title: fixture.title,
    expected: fixture.expected,
    actual,
    mismatches,
    passed: mismatches.length === 0,
  }
}

function renderMarkdown(results: ScenarioResult[]): string {
  const generatedAt = new Date().toISOString()
  const passed = results.filter((entry) => entry.passed).length
  const failed = results.length - passed

  const lines: string[] = []
  lines.push('# Clinical Coherence Report')
  lines.push('')
  lines.push(`- Generated: ${generatedAt}`)
  lines.push(`- Mode: ${MODE} (seed reasoning config, deterministic timestamps)`)
  lines.push(`- Scenarios: ${results.length}`)
  lines.push(`- Passed: ${passed}`)
  lines.push(`- Failed: ${failed}`)
  lines.push('')
  lines.push('## Scenario Matrix')
  lines.push('')
  lines.push('| Scenario | Expected | Actual | Status |')
  lines.push('|---|---|---|---|')

  for (const result of results) {
    const expSafety = result.expected.safety
    const expReview = result.expected.review
    const expectedCompact = [
      expSafety
        ? `Safety ${String(expSafety.effective_level ?? 'n/a')}/${String(expSafety.effective_action ?? 'n/a')}`
        : null,
      expReview ? `Review ${expReview.final_status ?? 'n/a'}` : null,
    ]
      .filter(Boolean)
      .join('<br>')

    const actualCompact = [
      `Safety ${String(result.actual.safety.effective_level ?? 'n/a')}/${String(result.actual.safety.effective_action ?? 'n/a')}`,
      `Review ${result.actual.review.final_status ?? 'n/a'}`,
      `PDF ${result.actual.export.pdf_magic ? 'ok' : 'bad'}`,
    ].join('<br>')

    lines.push(
      `| ${result.id} ${result.title} | ${expectedCompact || '-'} | ${actualCompact} | ${result.passed ? '✅' : '❌'} |`,
    )
  }

  lines.push('')
  lines.push('## Mismatch')
  lines.push('')

  const failedEntries = results.filter((entry) => !entry.passed)
  if (failedEntries.length === 0) {
    lines.push('No mismatches detected.')
  } else {
    for (const entry of failedEntries) {
      lines.push(`### ${entry.id} ${entry.title}`)
      lines.push('')
      for (const mismatch of entry.mismatches) {
        lines.push(`- ${mismatch}`)
      }
      lines.push('')
      lines.push('```json')
      lines.push(JSON.stringify({ expected: entry.expected, actual: entry.actual }, null, 2))
      lines.push('```')
      lines.push('')
    }
  }

  return lines.join('\n')
}

async function main() {
  const fixtures = readFixtures()
  if (fixtures.length < 8 || fixtures.length > 12) {
    throw new Error(`Fixture count must be 8-12, found ${fixtures.length}`)
  }

  const results: ScenarioResult[] = []

  for (const fixture of fixtures) {
    const result = await runScenario(fixture)
    results.push(result)
  }

  const markdown = renderMarkdown(results)
  const reportDir = path.dirname(REPORT_PATH)
  fs.mkdirSync(reportDir, { recursive: true })

  const jsonReport = {
    generatedAt: new Date().toISOString(),
    mode: MODE,
    summary: {
      total: results.length,
      passed: results.filter((entry) => entry.passed).length,
      failed: results.filter((entry) => !entry.passed).length,
    },
    results,
  }

  fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify(jsonReport, null, 2), 'utf8')

  if (SHOULD_WRITE_MARKDOWN_REPORT) {
    fs.writeFileSync(REPORT_PATH, markdown, 'utf8')
  }

  const failed = results.filter((entry) => !entry.passed)

  console.log(`CRE coherence battery complete: ${results.length - failed.length}/${results.length} passed`)
  if (SHOULD_WRITE_MARKDOWN_REPORT) {
    console.log(`Report: ${path.relative(REPO_ROOT, REPORT_PATH)}`)
  } else {
    console.log(
      `Markdown report not written (set CRE_WRITE_LATEST_MD=1 for local writes).`,
    )
  }
  console.log(`Report JSON: ${path.relative(REPO_ROOT, REPORT_JSON_PATH)}`)

  if (failed.length > 0) {
    console.error('Coherence mismatches found:')
    for (const scenario of failed) {
      console.error(`- ${scenario.id} ${scenario.title}`)
      for (const mismatch of scenario.mismatches) {
        console.error(`  - ${mismatch}`)
      }
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Failed to run coherence battery:', error)
  process.exit(1)
})
