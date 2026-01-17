/**
 * E6.5.5: Next Step Resolver v1 (Deterministic Priority Rules)
 *
 * Deterministic rule-based resolution of the next step a patient should take.
 * Same inputs always produce the same output.
 *
 * @module lib/nextStep/resolver
 */

import type { NextStep } from '@/lib/api/contracts/patient/dashboard'
import type { OnboardingStatusValue, WorkupStateValue } from '@/lib/api/contracts/patient/dashboard'
import { DEFAULT_PATIENT_FUNNEL, isFunnelPatientReachable } from '@/lib/config/funnelAllowlist'

/**
 * Next Step Rules Version
 * E6.5.5: Version marker for next step resolution rules
 * Increment when changing the priority order or adding/removing rules
 */
export const NEXT_STEP_RULES_VERSION = 1 as const

/**
 * Input data for next step resolution
 * All fields nullable to handle incomplete data
 */
export type NextStepResolverInput = {
  /** Patient onboarding status */
  onboardingStatus: OnboardingStatusValue
  /** Workup summary state */
  workupState: WorkupStateValue
  /** Number of assessments needing more data */
  workupNeedsMoreDataCount: number
  /** Whether patient has any in-progress funnel assessment */
  hasInProgressFunnel: boolean
  /** Slug of the in-progress funnel (if any) */
  inProgressFunnelSlug?: string | null
  /** Whether patient has started any funnel */
  hasStartedAnyFunnel: boolean
  /** Whether any red flags were detected */
  hasRedFlags: boolean
  /** Assessment ID with red flags (for escalation target) */
  redFlagAssessmentId?: string | null
}

/**
 * Next step resolution result
 * E6.5.5 AC3: Minimal output (type, label, target)
 */
export type NextStepResolution = {
  /** Next step object */
  nextStep: NextStep
  /** Rules version used for resolution */
  rulesVersion: typeof NEXT_STEP_RULES_VERSION
}

/**
 * Resolve the next step for a patient based on their current state
 *
 * E6.5.5: Deterministic priority rules (version 1):
 * 1. If onboarding incomplete → complete_onboarding
 * 2. Else if workup needs_more_data → answer_followups
 * 3. Else if funnel in progress → resume_funnel
 * 4. Else if no funnel started → start_funnel (stress-assessment by default)
 * 5. Else if red flag → escalation_offer
 * 6. Else → view_content (fallback)
 *
 * E6.5.5 AC1: Same inputs → same nextStep
 * E6.5.5 AC3: Output is minimal (type, label, target)
 *
 * @param input - Patient state for resolution
 * @returns NextStepResolution with resolved next step and rules version
 */
export function resolveNextStep(input: NextStepResolverInput): NextStepResolution {
  // Rule 1: Onboarding incomplete → complete_onboarding
  if (input.onboardingStatus !== 'completed') {
    return {
      nextStep: {
        type: 'onboarding',
        target: '/patient/onboarding',
        label: 'Onboarding abschließen',
      },
      rulesVersion: NEXT_STEP_RULES_VERSION,
    }
  }

  // Rule 2: Workup needs more data → answer_followups
  if (input.workupState === 'needs_more_data' && input.workupNeedsMoreDataCount > 0) {
    return {
      nextStep: {
        type: 'funnel',
        target: '/patient/history',
        label: 'Nachfragen beantworten',
      },
      rulesVersion: NEXT_STEP_RULES_VERSION,
    }
  }

  // Rule 3: Funnel in progress → resume_funnel (only if patient-reachable)
  if (input.hasInProgressFunnel && input.inProgressFunnelSlug) {
    // Only offer resume if the funnel is patient-reachable
    if (isFunnelPatientReachable(input.inProgressFunnelSlug)) {
      return {
        nextStep: {
          type: 'funnel',
          target: `/patient/funnel/${input.inProgressFunnelSlug}`,
          label: 'Fragebogen fortsetzen',
        },
        rulesVersion: NEXT_STEP_RULES_VERSION,
      }
    }
    // Non-reachable in-progress funnel: fall through to start new or view content
  }

  // Rule 4: No funnel started → start_funnel (uses default from allowlist)
  if (!input.hasStartedAnyFunnel) {
    return {
      nextStep: {
        type: 'funnel',
        target: `/patient/funnel/${DEFAULT_PATIENT_FUNNEL}`,
        label: 'Stress-Assessment starten',
      },
      rulesVersion: NEXT_STEP_RULES_VERSION,
    }
  }

  // Rule 5: Red flag detected → escalation_offer
  if (input.hasRedFlags) {
    const target = input.redFlagAssessmentId
      ? `/patient/escalation?assessmentId=${input.redFlagAssessmentId}`
      : '/patient/escalation'

    return {
      nextStep: {
        type: 'result',
        target,
        label: 'Wichtige Information zu Ihrem Ergebnis',
      },
      rulesVersion: NEXT_STEP_RULES_VERSION,
    }
  }

  // Rule 6: Fallback → view_content
  return {
    nextStep: {
      type: 'content',
      target: '/patient/funnels',
      label: 'Inhalte ansehen',
    },
    rulesVersion: NEXT_STEP_RULES_VERSION,
  }
}

/**
 * Create a default resolver input with safe defaults
 * Useful for testing or when partial data is available
 */
export function createDefaultResolverInput(
  overrides?: Partial<NextStepResolverInput>,
): NextStepResolverInput {
  return {
    onboardingStatus: 'not_started',
    workupState: 'no_data',
    workupNeedsMoreDataCount: 0,
    hasInProgressFunnel: false,
    inProgressFunnelSlug: null,
    hasStartedAnyFunnel: false,
    hasRedFlags: false,
    redFlagAssessmentId: null,
    ...overrides,
  }
}
