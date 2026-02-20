import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/types/supabase'

type ReviewStatus = 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'

type ReviewRecord = {
  id: string
  intake_id: string
  status: ReviewStatus
  review_notes: string | null
  requested_items: string[] | null
  reviewed_by: string
  is_current: boolean
  created_at: string
  updated_at: string
}

type IntakeRecord = {
  id: string
  user_id: string
  patient_id: string | null
  version_number: number
  clinical_summary: string | null
  structured_data: Record<string, unknown>
  policy_override: Json | null
  trigger_reason: string | null
  last_updated_from_messages: string[] | null
  created_at: string
  updated_at: string
}

export type ClinicalIntakeExportPayload = {
  metadata: {
    generated_at: string
    patient_ref: string
    intake_id: string
    intake_version: number
    trigger_reason: string | null
    created_at: string
    updated_at: string
  }
  clinical_summary: string | null
  structured_highlights: {
    chief_complaint: string | null
    timeline: string[]
    history: string[]
    relevant_negatives: string[]
    medication: string[]
    psychosocial_factors: string[]
  }
  safety: {
    effective_policy_result: {
      escalation_level: string | null
      chat_action: string | null
      patient_banner_text: string | null
    }
    triggered_rules: Array<{
      rule_id: string
      title: string
      level: string
      short_reason: string
      excerpts: Array<{
        source: string
        source_id: string
        excerpt: string
      }>
    }>
    policy_override: Json | null
    policy_override_audit: Array<{
      created_by: string | null
      created_at: string | null
      reason: string | null
      override_level: string | null
      override_action: string | null
    }>
  }
  review: {
    current: {
      status: ReviewStatus
      review_notes: string | null
      requested_items: string[]
      reviewed_by: string
      created_at: string
      updated_at: string
    } | null
    audit: Array<{
      status: ReviewStatus
      review_notes: string | null
      requested_items: string[]
      reviewed_by: string
      created_at: string
      updated_at: string
    }>
  }
  attachments: {
    evidence_refs: string[]
    message_refs: string[]
  }
  reasoning: {
    risk_estimation: {
      score: number | null
      level: string | null
      components: {
        verified_red_flags: number | null
        chronicity_signal: number | null
        anxiety_signal: number | null
      }
    }
    differentials: Array<{
      label: string
      likelihood: string
      matched_triggers: string[]
    }>
    open_questions: Array<{
      condition_label: string
      text: string
      priority: number | null
    }>
    recommended_next_steps: string[]
    uncertainties: string[]
    uncertainty_items: Array<{
      code: string
      message: string
      severity: string
    }>
    conflicts: Array<{
      code: string
      message: string
      severity: string
      related_fields: string[]
    }>
    safety_alignment: {
      blocked_by_safety: boolean
      effective_level: string | null
      rationale: string | null
    }
    adapter: {
      domain: string | null
      version: string | null
    }
  }
  followup: {
    next_questions: Array<{
      id: string
      question: string
      why: string
      priority: number | null
      source: string | null
    }>
    queue: Array<{
      id: string
      question: string
      why: string
      priority: number | null
      source: string | null
    }>
    asked_question_ids: string[]
    program_readiness: {
      is_program_ready: boolean
      readiness_state: string | null
      lifecycle_state: string | null
      active_block_id: string | null
      open_block_ids: string[]
      completed_block_ids: string[]
      generated_at: string | null
    }
    lifecycle: {
      state: string | null
      completed_question_ids: string[]
      skipped_question_ids: string[]
      resumed_at: string | null
      completed_at: string | null
    }
  }
  language_normalization: {
    version: string | null
    turns: Array<{
      turn_id: string
      detected_language: string
      original_phrase: string
      ambiguity_score: number | null
      clarification_required: boolean
      clarification_prompt: string | null
      mapped_entities: Array<{
        entity_type: string
        canonical: string
        source_phrase: string
        confidence: number | null
      }>
    }>
    pending_clarifications: Array<{
      turn_id: string
      prompt: string
      ambiguity_score: number | null
      created_at: string | null
    }>
  }
  audit: {
    reviewer_identities: string[]
    intake_created_at: string
    intake_updated_at: string
  }
}

const getText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const getStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

const getNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const getBoolean = (value: unknown): boolean => value === true

const toObjectArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : []

const getEvidenceRefs = (structuredData: Record<string, unknown>) => {
  const direct = getStringArray(structuredData.evidence_refs)

  const fromObjects = Array.isArray(structuredData.evidence_refs)
    ? structuredData.evidence_refs
        .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
        .map((item) => (item as { ref?: unknown }).ref)
        .filter((ref): ref is string => typeof ref === 'string' && ref.trim().length > 0)
    : []

  return Array.from(new Set([...direct, ...fromObjects]))
}

const pseudonymizePatientRef = (patientUserId: string) => {
  const digest = createHash('sha256').update(patientUserId).digest('hex').slice(0, 12)
  return `PT-${digest}`
}

const mapReviewRecord = (record: ReviewRecord) => ({
  status: record.status,
  review_notes: record.review_notes,
  requested_items: Array.isArray(record.requested_items) ? record.requested_items : [],
  reviewed_by: record.reviewed_by,
  created_at: record.created_at,
  updated_at: record.updated_at,
})

export const fetchIntakeAndReviewAudit = async (params: {
  admin: SupabaseClient<Database>
  intakeId: string
}) => {
  const { admin, intakeId } = params

  const { data: intakeData, error: intakeError } = (await admin
    .from('clinical_intakes')
    .select(
      'id, user_id, patient_id, version_number, clinical_summary, structured_data, policy_override, trigger_reason, last_updated_from_messages, created_at, updated_at',
    )
    .eq('id', intakeId)
    .maybeSingle()) as unknown as {
    data: IntakeRecord | null
    error: { message?: string } | null
  }

  if (intakeError) {
    return { intake: null, reviewAudit: [] as ReviewRecord[], error: intakeError }
  }

  if (!intakeData) {
    return { intake: null, reviewAudit: [] as ReviewRecord[], error: null }
  }

  const { data: reviewData, error: reviewError } = (await admin
    .from('clinical_intake_reviews')
    .select('id, intake_id, status, review_notes, requested_items, reviewed_by, is_current, created_at, updated_at')
    .eq('intake_id', intakeId)
    .order('created_at', { ascending: false })
    .limit(100)) as unknown as {
    data: ReviewRecord[] | null
    error: { message?: string } | null
  }

  if (reviewError) {
    return { intake: null, reviewAudit: [] as ReviewRecord[], error: reviewError }
  }

  return {
    intake: intakeData,
    reviewAudit: reviewData ?? [],
    error: null,
  }
}

export const buildClinicalIntakeExportPayload = (params: {
  intake: IntakeRecord
  reviewAudit: ReviewRecord[]
  generatedAt?: string
}) => {
  const { intake, reviewAudit } = params
  const generatedAt = params.generatedAt ?? new Date().toISOString()
  const structuredData = intake.structured_data ?? {}
  const hpi =
    structuredData.history_of_present_illness &&
    typeof structuredData.history_of_present_illness === 'object' &&
    !Array.isArray(structuredData.history_of_present_illness)
      ? (structuredData.history_of_present_illness as Record<string, unknown>)
      : {}

  const safety =
    structuredData.safety && typeof structuredData.safety === 'object' && !Array.isArray(structuredData.safety)
      ? (structuredData.safety as Record<string, unknown>)
      : {}

  const policyResult =
    safety.effective_policy_result &&
    typeof safety.effective_policy_result === 'object' &&
    !Array.isArray(safety.effective_policy_result)
      ? (safety.effective_policy_result as Record<string, unknown>)
      : safety.policy_result && typeof safety.policy_result === 'object' && !Array.isArray(safety.policy_result)
        ? (safety.policy_result as Record<string, unknown>)
        : {}

  const triggeredRules = Array.isArray(safety.triggered_rules)
    ? safety.triggered_rules
        .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
        .map((item) => {
          const rule = item as Record<string, unknown>
          const evidence = Array.isArray(rule.evidence)
            ? rule.evidence
                .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
                .map((entry) => {
                  const ev = entry as Record<string, unknown>
                  return {
                    source: getText(ev.source) || 'unknown',
                    source_id: getText(ev.source_id) || 'n/a',
                    excerpt: getText(ev.excerpt) || 'n/a',
                  }
                })
                .slice(0, 3)
            : []

          return {
            rule_id: getText(rule.rule_id) || getText(rule.id) || 'unknown',
            title: getText(rule.title) || getText(rule.rule_id) || 'Rule',
            level: getText(rule.level) || getText(rule.severity) || 'n/a',
            short_reason: getText(rule.short_reason) || getText(rule.rationale) || '',
            excerpts: evidence,
          }
        })
    : []

  const policyOverride = intake.policy_override
  const policyOverrideObject =
    policyOverride && typeof policyOverride === 'object' && !Array.isArray(policyOverride)
      ? (policyOverride as Record<string, unknown>)
      : null

  const currentReview = reviewAudit.find((row) => row.is_current) ?? reviewAudit[0] ?? null
  const reasoning =
    structuredData.reasoning && typeof structuredData.reasoning === 'object' && !Array.isArray(structuredData.reasoning)
      ? (structuredData.reasoning as Record<string, unknown>)
      : {}
  const followup =
    structuredData.followup && typeof structuredData.followup === 'object' && !Array.isArray(structuredData.followup)
      ? (structuredData.followup as Record<string, unknown>)
      : {}
  const followupLifecycle =
    followup.lifecycle && typeof followup.lifecycle === 'object' && !Array.isArray(followup.lifecycle)
      ? (followup.lifecycle as Record<string, unknown>)
      : {}
  const followupProgramReadiness =
    followup.program_readiness &&
    typeof followup.program_readiness === 'object' &&
    !Array.isArray(followup.program_readiness)
      ? (followup.program_readiness as Record<string, unknown>)
      : {}
  const languageNormalization =
    structuredData.language_normalization &&
    typeof structuredData.language_normalization === 'object' &&
    !Array.isArray(structuredData.language_normalization)
      ? (structuredData.language_normalization as Record<string, unknown>)
      : {}
  const riskEstimation =
    reasoning.risk_estimation && typeof reasoning.risk_estimation === 'object' && !Array.isArray(reasoning.risk_estimation)
      ? (reasoning.risk_estimation as Record<string, unknown>)
      : {}
  const riskComponents =
    riskEstimation.components && typeof riskEstimation.components === 'object' && !Array.isArray(riskEstimation.components)
      ? (riskEstimation.components as Record<string, unknown>)
      : {}
  const safetyAlignment =
    reasoning.safety_alignment && typeof reasoning.safety_alignment === 'object' && !Array.isArray(reasoning.safety_alignment)
      ? (reasoning.safety_alignment as Record<string, unknown>)
      : {}
  const adapter =
    reasoning.adapter && typeof reasoning.adapter === 'object' && !Array.isArray(reasoning.adapter)
      ? (reasoning.adapter as Record<string, unknown>)
      : {}

  const payload: ClinicalIntakeExportPayload = {
    metadata: {
      generated_at: generatedAt,
      patient_ref: pseudonymizePatientRef(intake.user_id),
      intake_id: intake.id,
      intake_version: intake.version_number,
      trigger_reason: intake.trigger_reason,
      created_at: intake.created_at,
      updated_at: intake.updated_at,
    },
    clinical_summary: intake.clinical_summary,
    structured_highlights: {
      chief_complaint: getText(structuredData.chief_complaint) || null,
      timeline: [getText(hpi.onset), getText(hpi.duration), getText(hpi.course)].filter(Boolean),
      history: getStringArray(structuredData.past_medical_history),
      relevant_negatives: getStringArray(structuredData.relevant_negatives),
      medication: getStringArray(structuredData.medication),
      psychosocial_factors: getStringArray(structuredData.psychosocial_factors),
    },
    safety: {
      effective_policy_result: {
        escalation_level: getText(policyResult.escalation_level) || null,
        chat_action: getText(policyResult.chat_action) || getText(safety.effective_action) || null,
        patient_banner_text: getText(policyResult.patient_banner_text) || null,
      },
      triggered_rules: triggeredRules,
      policy_override: policyOverride,
      policy_override_audit: policyOverrideObject
        ? [
            {
              created_by: getText(policyOverrideObject.created_by) || null,
              created_at: getText(policyOverrideObject.created_at) || null,
              reason: getText(policyOverrideObject.reason) || null,
              override_level: getText(policyOverrideObject.override_level) || null,
              override_action: getText(policyOverrideObject.override_action) || null,
            },
          ]
        : [],
    },
    review: {
      current: currentReview ? mapReviewRecord(currentReview) : null,
      audit: reviewAudit.map((record) => mapReviewRecord(record)),
    },
    attachments: {
      evidence_refs: getEvidenceRefs(structuredData),
      message_refs: Array.isArray(intake.last_updated_from_messages)
        ? intake.last_updated_from_messages.filter((item) => typeof item === 'string')
        : [],
    },
    reasoning: {
      risk_estimation: {
        score: getNumber(riskEstimation.score),
        level: getText(riskEstimation.level) || null,
        components: {
          verified_red_flags: getNumber(riskComponents.verified_red_flags),
          chronicity_signal: getNumber(riskComponents.chronicity_signal),
          anxiety_signal: getNumber(riskComponents.anxiety_signal),
        },
      },
      differentials: toObjectArray(reasoning.differentials).map((entry) => ({
        label: getText(entry.label),
        likelihood: getText(entry.likelihood),
        matched_triggers: getStringArray(entry.matched_triggers),
      })),
      open_questions: toObjectArray(reasoning.open_questions).map((entry) => ({
        condition_label: getText(entry.condition_label),
        text: getText(entry.text),
        priority: getNumber(entry.priority),
      })),
      recommended_next_steps: getStringArray(reasoning.recommended_next_steps),
      uncertainties: getStringArray(reasoning.uncertainties),
      uncertainty_items: toObjectArray(reasoning.uncertainty_items).map((entry) => ({
        code: getText(entry.code),
        message: getText(entry.message),
        severity: getText(entry.severity),
      })),
      conflicts: toObjectArray(reasoning.conflicts).map((entry) => ({
        code: getText(entry.code),
        message: getText(entry.message),
        severity: getText(entry.severity),
        related_fields: getStringArray(entry.related_fields),
      })),
      safety_alignment: {
        blocked_by_safety: getBoolean(safetyAlignment.blocked_by_safety),
        effective_level: getText(safetyAlignment.effective_level) || null,
        rationale: getText(safetyAlignment.rationale) || null,
      },
      adapter: {
        domain: getText(adapter.domain) || null,
        version: getText(adapter.version) || null,
      },
    },
    followup: {
      next_questions: toObjectArray(followup.next_questions).map((entry) => ({
        id: getText(entry.id),
        question: getText(entry.question),
        why: getText(entry.why),
        priority: getNumber(entry.priority),
        source: getText(entry.source) || null,
      })),
      queue: toObjectArray(followup.queue).map((entry) => ({
        id: getText(entry.id),
        question: getText(entry.question),
        why: getText(entry.why),
        priority: getNumber(entry.priority),
        source: getText(entry.source) || null,
      })),
      asked_question_ids: getStringArray(followup.asked_question_ids),
      program_readiness: {
        is_program_ready: getBoolean(followupProgramReadiness.is_program_ready),
        readiness_state: getText(followupProgramReadiness.readiness_state) || null,
        lifecycle_state: getText(followupProgramReadiness.lifecycle_state) || null,
        active_block_id: getText(followupProgramReadiness.active_block_id) || null,
        open_block_ids: getStringArray(followupProgramReadiness.open_block_ids),
        completed_block_ids: getStringArray(followupProgramReadiness.completed_block_ids),
        generated_at: getText(followupProgramReadiness.generated_at) || null,
      },
      lifecycle: {
        state: getText(followupLifecycle.state) || null,
        completed_question_ids: getStringArray(followupLifecycle.completed_question_ids),
        skipped_question_ids: getStringArray(followupLifecycle.skipped_question_ids),
        resumed_at: getText(followupLifecycle.resumed_at) || null,
        completed_at: getText(followupLifecycle.completed_at) || null,
      },
    },
    language_normalization: {
      version: getText(languageNormalization.version) || null,
      turns: toObjectArray(languageNormalization.turns).map((entry) => ({
        turn_id: getText(entry.turn_id),
        detected_language: getText(entry.detected_language),
        original_phrase: getText(entry.original_phrase),
        ambiguity_score: getNumber(entry.ambiguity_score),
        clarification_required: getBoolean(entry.clarification_required),
        clarification_prompt: getText(entry.clarification_prompt) || null,
        mapped_entities: toObjectArray(entry.mapped_entities).map((entity) => ({
          entity_type: getText(entity.entity_type),
          canonical: getText(entity.canonical),
          source_phrase: getText(entity.source_phrase),
          confidence: getNumber(entity.confidence),
        })),
      })),
      pending_clarifications: toObjectArray(languageNormalization.pending_clarifications).map((entry) => ({
        turn_id: getText(entry.turn_id),
        prompt: getText(entry.prompt),
        ambiguity_score: getNumber(entry.ambiguity_score),
        created_at: getText(entry.created_at) || null,
      })),
    },
    audit: {
      reviewer_identities: Array.from(new Set(reviewAudit.map((record) => record.reviewed_by))).filter(
        Boolean,
      ),
      intake_created_at: intake.created_at,
      intake_updated_at: intake.updated_at,
    },
  }

  return payload
}
