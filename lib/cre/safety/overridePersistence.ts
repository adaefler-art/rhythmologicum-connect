import type { SupabaseClient } from '@supabase/supabase-js'
import { loadSafetyPolicy } from '@/lib/cre/safety/policyEngine'
import { buildEffectiveSafety, validatePolicyOverride } from '@/lib/cre/safety/overrideHelpers'
import { loadActiveClinicalReasoningConfig } from '@/lib/cre/reasoning/configStore'
import { generateReasoningPack } from '@/lib/cre/reasoning/engine'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'
import type { EscalationLevel, ChatAction, PolicyOverride, SafetyEvaluation } from '@/lib/types/clinicalIntake'
import type { Json } from '@/lib/types/supabase'

const ALLOWED_LEVELS = ['A', 'B', 'C'] as const
const ALLOWED_ACTIONS = ['warn', 'require_confirm', 'hard_stop'] as const

const isValidLevel = (value: string | null | undefined) =>
  value === null || value === undefined || ALLOWED_LEVELS.includes(value as (typeof ALLOWED_LEVELS)[number])

const isValidAction = (value: string | null | undefined) =>
  value === null || value === undefined || ALLOWED_ACTIONS.includes(value as (typeof ALLOWED_ACTIONS)[number])

export const setPolicyOverride = async (params: {
  supabase: SupabaseClient
  intakeId: string
  organizationId: string | null
  structuredData: Record<string, unknown>
  overrideLevel?: string | null
  overrideAction?: string | null
  reason?: string | null
  updatedBy: { id: string; email?: string | null }
}) => {
  const {
    supabase,
    intakeId,
    organizationId,
    structuredData,
    overrideLevel,
    overrideAction,
    reason,
    updatedBy,
  } = params

  if (!isValidLevel(overrideLevel) || !isValidAction(overrideAction)) {
    return { ok: false, error: 'Invalid override values' }
  }

  const validation = validatePolicyOverride({ overrideLevel, overrideAction, reason })
  if (!validation.ok) {
    return { ok: false, error: validation.message }
  }

  const policyOverride: PolicyOverride | null = overrideLevel || overrideAction
    ? {
        override_level: (overrideLevel ?? null) as EscalationLevel | null,
        override_action: (overrideAction ?? null) as ChatAction | null,
        reason: reason?.trim() ?? '',
        created_by: updatedBy.id,
        created_by_email: updatedBy.email ?? null,
        created_at: new Date().toISOString(),
      }
    : null

  const policy = loadSafetyPolicy({ organizationId, funnelId: null })
  const { safety } = buildEffectiveSafety({
    structuredData,
    policyOverride,
    policy,
  })

  const nextStructuredData = {
    ...structuredData,
    safety,
  } as StructuredIntakeData

  const activeReasoning = await loadActiveClinicalReasoningConfig({ supabase })
  if (activeReasoning) {
    nextStructuredData.reasoning = generateReasoningPack(
      nextStructuredData,
      activeReasoning.config_json,
    )
  }

  const { data: updated, error: updateError } = await supabase
    .from('clinical_intakes')
    .update({
      structured_data: (nextStructuredData as unknown as Json),
      policy_override: policyOverride,
      updated_by: updatedBy.id,
    })
    .eq('id', intakeId)
    .select('id, structured_data, policy_override, updated_at')
    .single()

  if (updateError) {
    return { ok: false, error: 'Failed to update policy override', detail: updateError }
  }

  return {
    ok: true,
    data: {
      updated,
      safety: safety as SafetyEvaluation,
      policyOverride,
    },
  }
}
