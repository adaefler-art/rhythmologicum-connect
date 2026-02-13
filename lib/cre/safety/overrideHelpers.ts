import { applySafetyPolicy, getEffectiveSafetyState, type SafetyPolicyConfig } from '@/lib/cre/safety/policyEngine'
import type {
  PolicyOverride,
  SafetyEvaluation,
  SafetyOverride,
  SafetyPolicyResult,
  SafetyTriggeredRule,
} from '@/lib/types/clinicalIntake'

const defaultSafety: SafetyEvaluation = {
  red_flag_present: false,
  escalation_level: null,
  red_flags: [],
}

export const mapTriggeredRules = (safety: SafetyEvaluation): SafetyTriggeredRule[] =>
  safety.triggered_rules ??
  safety.red_flags?.map((flag) => ({
    rule_id: flag.rule_id,
    title: flag.rule_id,
    level: flag.level,
    short_reason: flag.rationale,
    evidence: (flag.evidence_message_ids ?? []).map((id) => ({
      source: 'chat',
      source_id: id,
      excerpt: '',
    })),
    verified: true,
    unverified: false,
    severity: flag.level,
    policy_version: flag.policy_version,
  })) ?? []

export const mapPolicyOverrideToSafetyOverride = (
  policyOverride?: PolicyOverride | null,
): SafetyOverride | null => {
  if (!policyOverride) return null

  return {
    level_override: policyOverride.override_level ?? null,
    chat_action_override: policyOverride.override_action ?? null,
    reason: policyOverride.reason,
    by_user_id: policyOverride.created_by_email ?? policyOverride.created_by,
    at: policyOverride.created_at,
  }
}

export const computeEffectivePolicy = (params: {
  policyResult: SafetyPolicyResult
  policyOverride?: PolicyOverride | null
}) => {
  const { policyResult, policyOverride } = params
  const safetyOverride = mapPolicyOverrideToSafetyOverride(policyOverride)
  const effective = getEffectiveSafetyState({ policyResult, override: safetyOverride })

  return {
    effective_level: effective.escalationLevel,
    effective_action: effective.chatAction,
    effective_policy_result: {
      policy_version: policyResult.policy_version,
      escalation_level: effective.escalationLevel,
      chat_action: effective.chatAction,
      studio_badge: policyResult.studio_badge,
      patient_banner_text: policyResult.patient_banner_text,
    } satisfies SafetyPolicyResult,
    safetyOverride,
  }
}

export const validatePolicyOverride = (params: {
  overrideLevel?: string | null
  overrideAction?: string | null
  reason?: string | null
}) => {
  const { overrideLevel, overrideAction, reason } = params
  const hasOverride = Boolean(overrideLevel || overrideAction)
  if (hasOverride && !reason?.trim()) {
    return { ok: false, message: 'Override reason is required' }
  }

  return { ok: true }
}

export const buildEffectiveSafety = (params: {
  structuredData: Record<string, unknown>
  policyOverride?: PolicyOverride | null
  policy: SafetyPolicyConfig
}) => {
  const { structuredData, policyOverride, policy } = params
  const safety = (structuredData?.safety as SafetyEvaluation | undefined) ?? defaultSafety
  const triggeredRules = mapTriggeredRules(safety)
  const policyTriggeredRules = triggeredRules.filter((rule) => rule.verified)
  const policyResult = applySafetyPolicy({ triggeredRules: policyTriggeredRules, policy })
  const { effective_level, effective_action, effective_policy_result, safetyOverride } =
    computeEffectivePolicy({ policyResult, policyOverride })

  return {
    safety: {
      ...safety,
      triggered_rules: triggeredRules,
      policy_result: policyResult,
      override: safetyOverride,
      effective_level,
      effective_action,
      effective_policy_result,
    } satisfies SafetyEvaluation,
    triggeredRules,
    policyResult,
    safetyOverride,
  }
}
