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
