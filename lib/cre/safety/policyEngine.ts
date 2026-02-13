import safetyPolicy from '@/config/cre/safety-policy.v1.json'
import type { EscalationLevel, SafetyOverride, SafetyPolicyResult, SafetyTriggeredRule } from '@/lib/types/clinicalIntake'

export type ChatAction = 'none' | 'warn' | 'require_confirm' | 'hard_stop'

export type SafetyPolicyConfig = {
  version: string
  defaults: {
    escalationBySeverity: Record<EscalationLevel, EscalationLevel>
    chatActionBySeverity: Record<EscalationLevel, ChatAction>
    studioBadgeByLevel: Record<EscalationLevel | 'None', string>
    patientBannerTextByAction: Record<ChatAction, string>
  }
  rules: Record<
    string,
    {
      escalationLevel?: EscalationLevel
      chatAction?: ChatAction
      studioBadge?: string
      patientBannerText?: string
    }
  >
  orgOverrides?: Record<string, Partial<SafetyPolicyConfig>>
  funnelOverrides?: Record<string, Partial<SafetyPolicyConfig>>
}

const ACTION_PRIORITY: ChatAction[] = ['none', 'warn', 'require_confirm', 'hard_stop']
const LEVEL_PRIORITY: Array<EscalationLevel | 'None'> = ['None', 'C', 'B', 'A']

const getActionRank = (action: ChatAction) => ACTION_PRIORITY.indexOf(action)
const getLevelRank = (level: EscalationLevel | 'None') => LEVEL_PRIORITY.indexOf(level)

const mergePolicy = (base: SafetyPolicyConfig, override?: Partial<SafetyPolicyConfig>) => {
  if (!override) return base
  return {
    ...base,
    ...override,
    defaults: {
      ...base.defaults,
      ...(override.defaults ?? {}),
      escalationBySeverity: {
        ...base.defaults.escalationBySeverity,
        ...(override.defaults?.escalationBySeverity ?? {}),
      },
      chatActionBySeverity: {
        ...base.defaults.chatActionBySeverity,
        ...(override.defaults?.chatActionBySeverity ?? {}),
      },
      studioBadgeByLevel: {
        ...base.defaults.studioBadgeByLevel,
        ...(override.defaults?.studioBadgeByLevel ?? {}),
      },
      patientBannerTextByAction: {
        ...base.defaults.patientBannerTextByAction,
        ...(override.defaults?.patientBannerTextByAction ?? {}),
      },
    },
    rules: {
      ...base.rules,
      ...(override.rules ?? {}),
    },
  }
}

export const loadSafetyPolicy = (params: { organizationId?: string | null; funnelId?: string | null }) => {
  const base = safetyPolicy as SafetyPolicyConfig
  const orgOverride = params.organizationId ? base.orgOverrides?.[params.organizationId] : undefined
  const funnelOverride = params.funnelId ? base.funnelOverrides?.[params.funnelId] : undefined

  return mergePolicy(mergePolicy(base, orgOverride), funnelOverride)
}

export const applySafetyPolicy = (params: {
  triggeredRules: SafetyTriggeredRule[]
  policy: SafetyPolicyConfig
}): SafetyPolicyResult => {
  const { triggeredRules, policy } = params
  if (triggeredRules.length === 0) {
    return {
      policy_version: policy.version,
      escalation_level: null,
      chat_action: 'none',
      studio_badge: policy.defaults.studioBadgeByLevel.None,
      patient_banner_text: policy.defaults.patientBannerTextByAction.none,
    }
  }

  let effectiveLevel: EscalationLevel | 'None' = 'None'
  let effectiveAction: ChatAction = 'none'
  let effectiveBadge = ''
  let effectiveBanner = ''

  triggeredRules.forEach((rule) => {
    const override = policy.rules[rule.rule_id]
    const severity =
      rule.severity ??
      (rule.level === 'A' || rule.level === 'B' || rule.level === 'C' ? rule.level : 'B')
    const level = override?.escalationLevel ?? policy.defaults.escalationBySeverity[severity]
    const action = override?.chatAction ?? policy.defaults.chatActionBySeverity[level]

    if (getLevelRank(level) > getLevelRank(effectiveLevel)) {
      effectiveLevel = level
      effectiveBadge = override?.studioBadge ?? policy.defaults.studioBadgeByLevel[level]
    }

    if (getActionRank(action) > getActionRank(effectiveAction)) {
      effectiveAction = action
      effectiveBanner = override?.patientBannerText ?? policy.defaults.patientBannerTextByAction[action]
    }
  })

  return {
    policy_version: policy.version,
    escalation_level: effectiveLevel === 'None' ? null : effectiveLevel,
    chat_action: effectiveAction,
    studio_badge: effectiveBadge || policy.defaults.studioBadgeByLevel.None,
    patient_banner_text: effectiveBanner,
  }
}

export const getEffectiveSafetyState = (params: {
  policyResult?: SafetyPolicyResult | null
  override?: SafetyOverride | null
}) => {
  const { policyResult, override } = params
  const escalation = override?.level_override ?? policyResult?.escalation_level ?? null
  const chatAction = override?.chat_action_override ?? policyResult?.chat_action ?? 'none'

  return {
    escalationLevel: escalation,
    chatAction,
  }
}
