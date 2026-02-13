import { z } from 'zod'
import type { SafetyTriggeredRule, StructuredIntakeData } from '@/lib/types/clinicalIntake'

export const ALLOWED_INTAKE_EVIDENCE_FIELDS = [
  'structured_data.history_of_present_illness.duration',
  'structured_data.uncertainties',
] as const

type AllowedIntakeFieldPath = (typeof ALLOWED_INTAKE_EVIDENCE_FIELDS)[number]

type EvidenceItem = SafetyTriggeredRule['evidence'][number]

type IntakeEvidenceCandidate = {
  source: 'intake'
  source_id: string
  excerpt: string
  field_path?: AllowedIntakeFieldPath
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const isUuid = (value: string) => UUID_REGEX.test(value)

export const safetyEvidenceItemSchema = z.union([
  z.object({
    source: z.literal('chat'),
    source_id: z.string().min(1),
    excerpt: z.string().min(1),
    field_path: z.undefined().optional(),
  }),
  z.object({
    source: z.literal('intake'),
    source_id: z.string().uuid(),
    excerpt: z.string().min(1),
    field_path: z.enum(ALLOWED_INTAKE_EVIDENCE_FIELDS).optional(),
  }),
])

export const isAllowedIntakeEvidenceFieldPath = (
  value: string | undefined,
): value is AllowedIntakeFieldPath =>
  Boolean(value && (ALLOWED_INTAKE_EVIDENCE_FIELDS as readonly string[]).includes(value))

const sanitizeEvidenceItems = (items: EvidenceItem[], intakeId: string): EvidenceItem[] =>
  items.filter((item) => {
    if (item.source === 'intake') {
      if (!isUuid(item.source_id)) return false
      if (item.source_id !== intakeId) return false
      if (item.field_path && !isAllowedIntakeEvidenceFieldPath(item.field_path)) return false
      return Boolean(item.excerpt && item.excerpt.trim())
    }

    return Boolean(item.source_id && item.excerpt && item.excerpt.trim())
  })

const buildIntakeEvidenceCandidates = (
  ruleId: string,
  structuredData: StructuredIntakeData,
  intakeId: string,
): IntakeEvidenceCandidate[] => {
  if (ruleId === 'SFTY-2.1-R-CHEST-PAIN-20M') {
    const duration = structuredData.history_of_present_illness?.duration
    if (typeof duration === 'string' && duration.trim()) {
      return [
        {
          source: 'intake',
          source_id: intakeId,
          excerpt: duration.trim(),
          field_path: 'structured_data.history_of_present_illness.duration',
        },
      ]
    }
  }

  if (ruleId === 'SFTY-2.1-R-UNCERTAINTY-2PLUS') {
    const firstUncertainty = structuredData.uncertainties?.find(
      (entry) => typeof entry === 'string' && entry.trim(),
    )
    if (typeof firstUncertainty === 'string' && firstUncertainty.trim()) {
      return [
        {
          source: 'intake',
          source_id: intakeId,
          excerpt: firstUncertainty.trim(),
          field_path: 'structured_data.uncertainties',
        },
      ]
    }
  }

  return []
}

const dedupeEvidence = (items: EvidenceItem[]): EvidenceItem[] => {
  const seen = new Set<string>()
  const result: EvidenceItem[] = []

  items.forEach((item) => {
    const key = [item.source, item.source_id, item.field_path ?? '', item.excerpt].join('|')
    if (seen.has(key)) return
    seen.add(key)
    result.push(item)
  })

  return result
}

export const attachIntakeEvidenceAfterSave = (params: {
  intakeId: string
  structuredData: StructuredIntakeData
  triggeredRules: SafetyTriggeredRule[]
}): SafetyTriggeredRule[] => {
  const { intakeId, structuredData, triggeredRules } = params

  if (!isUuid(intakeId)) {
    return triggeredRules
  }

  return triggeredRules.map((rule) => {
    const baseEvidence = sanitizeEvidenceItems(rule.evidence, intakeId)
    const intakeEvidence = buildIntakeEvidenceCandidates(rule.rule_id, structuredData, intakeId)

    if (intakeEvidence.length === 0) {
      return {
        ...rule,
        evidence: baseEvidence,
      }
    }

    return {
      ...rule,
      evidence: dedupeEvidence([...baseEvidence, ...intakeEvidence]),
    }
  })
}
