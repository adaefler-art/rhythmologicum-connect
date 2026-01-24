/**
 * E6.5.5: Unit Tests for Next Step Resolver v1
 *
 * Tests all priority rule branches and deterministic behavior.
 * E6.5.5 AC1: Same inputs → same nextStep
 * E6.5.5 AC2: Unit tests cover all branches
 * E6.5.5 AC3: nextStep output is minimal (type, label, target)
 */

import {
  resolveNextStep,
  createDefaultResolverInput,
  NEXT_STEP_RULES_VERSION,
  type NextStepResolverInput,
} from '../resolver'

describe('E6.5.5: Next Step Resolver v1', () => {
  describe('Version Marker', () => {
    it('should have rules version constant set to 1', () => {
      expect(NEXT_STEP_RULES_VERSION).toBe(1)
    })

    it('should include rulesVersion in resolution result', () => {
      const input = createDefaultResolverInput()
      const result = resolveNextStep(input)

      expect(result.rulesVersion).toBe(1)
      expect(result.rulesVersion).toBe(NEXT_STEP_RULES_VERSION)
    })
  })

  describe('Rule 1: Onboarding Incomplete → complete_onboarding', () => {
    it('should return onboarding step when status is not_started', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'not_started',
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.type).toBe('onboarding')
      expect(result.nextStep.target).toBe('/patient/onboarding')
      expect(result.nextStep.label).toBe('Onboarding abschließen')
    })

    it('should return onboarding step when status is in_progress', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'in_progress',
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.type).toBe('onboarding')
      expect(result.nextStep.target).toBe('/patient/onboarding')
      expect(result.nextStep.label).toBe('Onboarding abschließen')
    })

    it('should prioritize onboarding over all other rules', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'not_started',
        workupState: 'needs_more_data',
        workupNeedsMoreDataCount: 5,
        hasInProgressFunnel: true,
        inProgressFunnelSlug: 'stress-assessment',
        hasRedFlags: true,
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.type).toBe('onboarding')
      expect(result.nextStep.target).toBe('/patient/onboarding')
    })
  })

  describe('Rule 2: Workup Needs More Data → answer_followups', () => {
    it('should return followup step when workup needs more data', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'needs_more_data',
        workupNeedsMoreDataCount: 3,
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.type).toBe('funnel')
      expect(result.nextStep.target).toBe('/patient/history')
      expect(result.nextStep.label).toBe('Nachfragen beantworten')
    })

    it('should not trigger if workupNeedsMoreDataCount is 0', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'needs_more_data',
        workupNeedsMoreDataCount: 0,
        hasStartedAnyFunnel: false,
      })

      const result = resolveNextStep(input)

      // Should skip to rule 4 (start_funnel)
      expect(result.nextStep.type).toBe('funnel')
      expect(result.nextStep.target).toBe('/patient/assess/stress-assessment/flow')
    })

    it('should not trigger if workupState is not needs_more_data', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'ready_for_review',
        workupNeedsMoreDataCount: 3,
        hasStartedAnyFunnel: false,
      })

      const result = resolveNextStep(input)

      // Should skip to rule 4 (start_funnel)
      expect(result.nextStep.type).toBe('funnel')
      expect(result.nextStep.target).toBe('/patient/assess/stress-assessment/flow')
    })

    it('should prioritize workup over in-progress funnel', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'needs_more_data',
        workupNeedsMoreDataCount: 2,
        hasInProgressFunnel: true,
        inProgressFunnelSlug: 'resilience-assessment',
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.type).toBe('funnel')
      expect(result.nextStep.target).toBe('/patient/history')
      expect(result.nextStep.label).toBe('Nachfragen beantworten')
    })
  })

  describe('Rule 3: Funnel In Progress → resume_funnel', () => {
    it('should return resume funnel step when funnel is in progress', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'no_data',
        hasInProgressFunnel: true,
        inProgressFunnelSlug: 'stress-assessment',
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.type).toBe('funnel')
      expect(result.nextStep.target).toBe('/patient/assess/stress-assessment/flow')
      expect(result.nextStep.label).toBe('Fragebogen fortsetzen')
    })

    it('should use the correct funnel slug in target URL', () => {
      // Use stress-assessment which is in the allowlist
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'no_data',
        hasInProgressFunnel: true,
        inProgressFunnelSlug: 'stress-assessment',
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.target).toBe('/patient/assess/stress-assessment/flow')
    })

    it('should fall through to next rule for non-reachable in-progress funnel', () => {
      // resilience-assessment is not in the allowlist, so should fall through
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'no_data',
        hasInProgressFunnel: true,
        inProgressFunnelSlug: 'resilience-assessment',
        hasStartedAnyFunnel: true, // already started, so won't trigger rule 4
      })

      const result = resolveNextStep(input)

      // Falls through to Rule 6 (fallback - view content)
      expect(result.nextStep.type).toBe('content')
      expect(result.nextStep.target).toBe('/patient/assess')
    })

    it('should not trigger if hasInProgressFunnel is false', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'no_data',
        hasInProgressFunnel: false,
        inProgressFunnelSlug: null,
        hasStartedAnyFunnel: false,
      })

      const result = resolveNextStep(input)

      // Should skip to rule 4 (start_funnel)
      expect(result.nextStep.type).toBe('funnel')
      expect(result.nextStep.target).toBe('/patient/assess/stress-assessment/flow')
    })

    it('should not trigger if inProgressFunnelSlug is null', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'no_data',
        hasInProgressFunnel: true,
        inProgressFunnelSlug: null,
        hasStartedAnyFunnel: false,
      })

      const result = resolveNextStep(input)

      // Should skip to rule 4 (start_funnel)
      expect(result.nextStep.type).toBe('funnel')
      expect(result.nextStep.target).toBe('/patient/assess/stress-assessment/flow')
    })
  })

  describe('Rule 4: No Funnel Started → start_funnel', () => {
    it('should return start funnel step when no funnel has been started', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'no_data',
        hasInProgressFunnel: false,
        hasStartedAnyFunnel: false,
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.type).toBe('funnel')
      expect(result.nextStep.target).toBe('/patient/assess/stress-assessment/flow')
      expect(result.nextStep.label).toBe('Stress-Assessment starten')
    })

    it('should default to stress-assessment funnel', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        hasStartedAnyFunnel: false,
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.target).toContain('stress-assessment')
    })

    it('should not trigger if patient has started any funnel', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'no_data',
        hasInProgressFunnel: false,
        hasStartedAnyFunnel: true,
        hasRedFlags: false,
      })

      const result = resolveNextStep(input)

      // Should skip to rule 6 (view_content fallback)
      expect(result.nextStep.type).toBe('content')
      expect(result.nextStep.target).toBe('/patient/assess')
    })
  })

  describe('Rule 5: Red Flag Detected → escalation_offer', () => {
    it('should return escalation step when red flags are detected', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'no_data',
        hasInProgressFunnel: false,
        hasStartedAnyFunnel: true,
        hasRedFlags: true,
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.type).toBe('result')
      expect(result.nextStep.target).toBe('/patient/escalation')
      expect(result.nextStep.label).toBe('Wichtige Information zu Ihrem Ergebnis')
    })

    it('should include assessmentId in target when provided', () => {
      const assessmentId = 'abc-123-def-456'
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'no_data',
        hasInProgressFunnel: false,
        hasStartedAnyFunnel: true,
        hasRedFlags: true,
        redFlagAssessmentId: assessmentId,
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.target).toBe(`/patient/escalation?assessmentId=${assessmentId}`)
    })

    it('should not trigger if hasRedFlags is false', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'no_data',
        hasInProgressFunnel: false,
        hasStartedAnyFunnel: true,
        hasRedFlags: false,
      })

      const result = resolveNextStep(input)

      // Should skip to rule 6 (view_content fallback)
      expect(result.nextStep.type).toBe('content')
      expect(result.nextStep.target).toBe('/patient/assess')
    })
  })

  describe('Rule 6: Fallback → view_content', () => {
    it('should return content step when no other rules match', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'ready_for_review',
        hasInProgressFunnel: false,
        hasStartedAnyFunnel: true,
        hasRedFlags: false,
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.type).toBe('content')
      expect(result.nextStep.target).toBe('/patient/assess')
      expect(result.nextStep.label).toBe('Inhalte ansehen')
    })

    it('should be the final fallback when all funnels completed and no issues', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        workupState: 'no_data',
        workupNeedsMoreDataCount: 0,
        hasInProgressFunnel: false,
        hasStartedAnyFunnel: true,
        hasRedFlags: false,
      })

      const result = resolveNextStep(input)

      expect(result.nextStep.type).toBe('content')
    })
  })

  describe('E6.5.5 AC1: Deterministic Behavior', () => {
    it('should return the same output for the same inputs', () => {
      const input: NextStepResolverInput = {
        onboardingStatus: 'completed',
        workupState: 'needs_more_data',
        workupNeedsMoreDataCount: 2,
        hasInProgressFunnel: false,
        inProgressFunnelSlug: null,
        hasStartedAnyFunnel: true,
        hasRedFlags: false,
        redFlagAssessmentId: null,
      }

      const result1 = resolveNextStep(input)
      const result2 = resolveNextStep(input)
      const result3 = resolveNextStep(input)

      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
      expect(result1.nextStep.type).toBe('funnel')
      expect(result1.nextStep.target).toBe('/patient/history')
    })

    it('should return consistent results across multiple calls', () => {
      const inputs = [
        createDefaultResolverInput({ onboardingStatus: 'not_started' }),
        createDefaultResolverInput({
          onboardingStatus: 'completed',
          workupState: 'needs_more_data',
          workupNeedsMoreDataCount: 1,
        }),
        createDefaultResolverInput({
          onboardingStatus: 'completed',
          hasInProgressFunnel: true,
          inProgressFunnelSlug: 'stress-assessment',
        }),
      ]

      inputs.forEach((input) => {
        const results = [resolveNextStep(input), resolveNextStep(input), resolveNextStep(input)]

        // All results should be identical
        expect(results[0]).toEqual(results[1])
        expect(results[1]).toEqual(results[2])
      })
    })
  })

  describe('E6.5.5 AC3: Minimal Output', () => {
    it('should return only type, label, and target in nextStep', () => {
      const input = createDefaultResolverInput()
      const result = resolveNextStep(input)

      expect(Object.keys(result.nextStep).sort()).toEqual(['label', 'target', 'type'])
    })

    it('should have string type for all nextStep fields', () => {
      const input = createDefaultResolverInput()
      const result = resolveNextStep(input)

      expect(typeof result.nextStep.type).toBe('string')
      expect(typeof result.nextStep.label).toBe('string')
      expect(result.nextStep.target === null || typeof result.nextStep.target === 'string').toBe(
        true,
      )
    })

    it('should have rulesVersion in resolution result', () => {
      const input = createDefaultResolverInput()
      const result = resolveNextStep(input)

      expect(result).toHaveProperty('rulesVersion')
      expect(result).toHaveProperty('nextStep')
      expect(Object.keys(result).sort()).toEqual(['nextStep', 'rulesVersion'])
    })
  })

  describe('createDefaultResolverInput', () => {
    it('should create input with safe defaults', () => {
      const input = createDefaultResolverInput()

      expect(input.onboardingStatus).toBe('not_started')
      expect(input.workupState).toBe('no_data')
      expect(input.workupNeedsMoreDataCount).toBe(0)
      expect(input.hasInProgressFunnel).toBe(false)
      expect(input.inProgressFunnelSlug).toBe(null)
      expect(input.hasStartedAnyFunnel).toBe(false)
      expect(input.hasRedFlags).toBe(false)
      expect(input.redFlagAssessmentId).toBe(null)
    })

    it('should allow overriding default values', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        hasInProgressFunnel: true,
        inProgressFunnelSlug: 'resilience-assessment',
      })

      expect(input.onboardingStatus).toBe('completed')
      expect(input.hasInProgressFunnel).toBe(true)
      expect(input.inProgressFunnelSlug).toBe('resilience-assessment')
      expect(input.workupState).toBe('no_data') // Default preserved
    })

    it('should allow partial overrides', () => {
      const input = createDefaultResolverInput({
        workupNeedsMoreDataCount: 5,
      })

      expect(input.workupNeedsMoreDataCount).toBe(5)
      expect(input.onboardingStatus).toBe('not_started')
      expect(input.hasRedFlags).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle all fields being in default state', () => {
      const input = createDefaultResolverInput()
      const result = resolveNextStep(input)

      // Default state should trigger rule 1 (onboarding)
      expect(result.nextStep.type).toBe('onboarding')
    })

    it('should handle completed state with no activity', () => {
      const input = createDefaultResolverInput({
        onboardingStatus: 'completed',
        hasStartedAnyFunnel: false,
      })

      const result = resolveNextStep(input)

      // Should trigger rule 4 (start_funnel)
      expect(result.nextStep.type).toBe('funnel')
      expect(result.nextStep.target).toBe('/patient/assess/stress-assessment/flow')
    })

    it('should handle multiple competing priorities correctly', () => {
      // When multiple conditions are true, priority order should be respected
      const input = createDefaultResolverInput({
        onboardingStatus: 'in_progress', // Rule 1
        workupState: 'needs_more_data', // Rule 2
        workupNeedsMoreDataCount: 3,
        hasInProgressFunnel: true, // Rule 3
        inProgressFunnelSlug: 'stress-assessment',
        hasRedFlags: true, // Rule 5
      })

      const result = resolveNextStep(input)

      // Rule 1 (onboarding) should win
      expect(result.nextStep.type).toBe('onboarding')
    })
  })
})
