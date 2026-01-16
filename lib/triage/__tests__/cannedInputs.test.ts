/**
 * E6.6.9 — Deterministic Triage Test Inputs
 *
 * Validates that all canned input examples produce expected nextAction.
 * Covers all router paths: INFO, ASSESSMENT, ESCALATE
 *
 * Acceptance Criteria:
 * AC1: Each input produces expected nextAction in tests
 * AC2: Dev UI only in non-prod (tested via env checks)
 *
 * @see docs/dev/triage_test_inputs_v1.md
 */

import { runTriageEngine } from '../engine'
import { TRIAGE_TIER, TRIAGE_NEXT_ACTION } from '@/lib/api/contracts/triage'

describe('Triage Test Inputs v1 - Deterministic Canned Examples', () => {
  // ============================================================
  // INFO Tier Examples (nextAction: SHOW_CONTENT)
  // ============================================================

  describe('INFO Tier → SHOW_CONTENT', () => {
    it('Input 1: Basic info query (German) → INFO tier', () => {
      const result = runTriageEngine({
        inputText: 'Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?',
      })

      expect(result.tier).toBe(TRIAGE_TIER.INFO)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_CONTENT)
      expect(result.redFlags).toEqual([])
      expect(result.version).toBe('v1')
    })

    it('Input 2: Info query with "how does" pattern (English) → INFO tier', () => {
      const result = runTriageEngine({
        inputText: 'How does meditation help with anxiety and stress management?',
      })

      expect(result.tier).toBe(TRIAGE_TIER.INFO)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_CONTENT)
      expect(result.redFlags).toEqual([])
      expect(result.version).toBe('v1')
    })

    it('Input 3: Explanation request (German) → INFO tier', () => {
      const result = runTriageEngine({
        inputText: 'Ich möchte gerne mehr wissen über Stressmanagement und Entspannungstechniken.',
      })

      expect(result.tier).toBe(TRIAGE_TIER.INFO)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_CONTENT)
      expect(result.redFlags).toEqual([])
      expect(result.version).toBe('v1')
    })
  })

  // ============================================================
  // ASSESSMENT Tier Examples (nextAction: START_FUNNEL_A)
  // ============================================================

  describe('ASSESSMENT Tier → START_FUNNEL_A', () => {
    it('Input 4: Stress concern (German) → ASSESSMENT tier', () => {
      const result = runTriageEngine({
        inputText:
          'Ich fühle mich sehr gestresst und erschöpft in letzter Zeit. Es fällt mir schwer, mich zu konzentrieren.',
      })

      expect(result.tier).toBe(TRIAGE_TIER.ASSESSMENT)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
      expect(result.redFlags).toEqual([])
      expect(result.version).toBe('v1')
    })

    it('Input 5: Sleep problems (German) → ASSESSMENT tier', () => {
      const result = runTriageEngine({
        inputText:
          'Ich habe seit Wochen Schlafprobleme. Ich kann nicht einschlafen und wache nachts oft auf.',
      })

      expect(result.tier).toBe(TRIAGE_TIER.ASSESSMENT)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
      expect(result.redFlags).toEqual([])
      expect(result.version).toBe('v1')
    })

    it('Input 6: Anxiety and worry (English) → ASSESSMENT tier', () => {
      const result = runTriageEngine({
        inputText:
          "I've been feeling very anxious and worried lately. I'm constantly stressed about work and my health.",
      })

      expect(result.tier).toBe(TRIAGE_TIER.ASSESSMENT)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
      expect(result.redFlags).toEqual([])
      expect(result.version).toBe('v1')
    })

    it('Input 7: Overwhelmed state (German) → ASSESSMENT tier', () => {
      const result = runTriageEngine({
        inputText:
          'Ich bin total überfordert mit allem. Die Arbeit, die Familie, alles ist zu viel. Ich bin ständig müde.',
      })

      expect(result.tier).toBe(TRIAGE_TIER.ASSESSMENT)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
      expect(result.redFlags).toEqual([])
      expect(result.version).toBe('v1')
    })
  })

  // ============================================================
  // ESCALATE Tier Examples (nextAction: SHOW_ESCALATION)
  // ============================================================

  describe('ESCALATE Tier → SHOW_ESCALATION', () => {
    it('Input 8: Suicidal ideation (German) → ESCALATE tier', () => {
      const result = runTriageEngine({
        inputText:
          'Ich habe Suizidgedanken und weiß nicht mehr weiter. Alles fühlt sich hoffnungslos an.',
      })

      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
      expect(result.redFlags).toContain('answer_pattern')
      expect(result.redFlags.length).toBeGreaterThan(0)
      expect(result.version).toBe('v1')
    })

    it('Input 9: Chest pain emergency (German) → ESCALATE tier', () => {
      const result = runTriageEngine({
        inputText:
          'Ich habe seit einer Stunde starke Brustschmerzen und Druck auf der Brust. Mir ist schwindelig.',
      })

      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
      expect(result.redFlags).toContain('answer_pattern')
      expect(result.redFlags.length).toBeGreaterThan(0)
      expect(result.version).toBe('v1')
    })

    it('Input 10: Severe breathing difficulty (English) → ESCALATE tier', () => {
      const result = runTriageEngine({
        inputText: "I can't breathe properly and I'm gasping for air. This is an emergency situation.",
      })

      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
      expect(result.redFlags).toContain('answer_pattern')
      expect(result.redFlags.length).toBeGreaterThan(0)
      expect(result.version).toBe('v1')
    })
  })

  // ============================================================
  // AC1: Verify All Router Paths are Covered
  // ============================================================

  describe('AC1: Router Path Coverage', () => {
    it('should cover all three triage tiers', () => {
      const tiers = new Set<string>()

      // INFO examples
      tiers.add(
        runTriageEngine({
          inputText: 'Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?',
        }).tier,
      )

      // ASSESSMENT examples
      tiers.add(
        runTriageEngine({
          inputText:
            'Ich fühle mich sehr gestresst und erschöpft in letzter Zeit. Es fällt mir schwer, mich zu konzentrieren.',
        }).tier,
      )

      // ESCALATE examples
      tiers.add(
        runTriageEngine({
          inputText:
            'Ich habe Suizidgedanken und weiß nicht mehr weiter. Alles fühlt sich hoffnungslos an.',
        }).tier,
      )

      expect(tiers.size).toBe(3)
      expect(tiers).toContain(TRIAGE_TIER.INFO)
      expect(tiers).toContain(TRIAGE_TIER.ASSESSMENT)
      expect(tiers).toContain(TRIAGE_TIER.ESCALATE)
    })

    it('should cover all nextAction values', () => {
      const nextActions = new Set<string>()

      // SHOW_CONTENT
      nextActions.add(
        runTriageEngine({
          inputText: 'Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?',
        }).nextAction,
      )

      // START_FUNNEL_A
      nextActions.add(
        runTriageEngine({
          inputText:
            'Ich fühle mich sehr gestresst und erschöpft in letzter Zeit. Es fällt mir schwer, mich zu konzentrieren.',
        }).nextAction,
      )

      // SHOW_ESCALATION
      nextActions.add(
        runTriageEngine({
          inputText:
            'Ich habe Suizidgedanken und weiß nicht mehr weiter. Alles fühlt sich hoffnungslos an.',
        }).nextAction,
      )

      expect(nextActions.size).toBe(3)
      expect(nextActions).toContain(TRIAGE_NEXT_ACTION.SHOW_CONTENT)
      expect(nextActions).toContain(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
      expect(nextActions).toContain(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
    })

    it('should have both red flag and non-red flag examples', () => {
      // Non-red flag example
      const infoResult = runTriageEngine({
        inputText: 'Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?',
      })
      expect(infoResult.redFlags).toEqual([])

      // Red flag example
      const escalateResult = runTriageEngine({
        inputText:
          'Ich habe Suizidgedanken und weiß nicht mehr weiter. Alles fühlt sich hoffnungslos an.',
      })
      expect(escalateResult.redFlags.length).toBeGreaterThan(0)
    })
  })

  // ============================================================
  // Determinism: Each input should produce consistent results
  // ============================================================

  describe('Determinism: Consistent results for repeated inputs', () => {
    it('should produce identical results for same input (INFO)', () => {
      const inputText = 'Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?'

      const result1 = runTriageEngine({ inputText })
      const result2 = runTriageEngine({ inputText })

      expect(result1.tier).toBe(result2.tier)
      expect(result1.nextAction).toBe(result2.nextAction)
      expect(result1.redFlags).toEqual(result2.redFlags)
    })

    it('should produce identical results for same input (ASSESSMENT)', () => {
      const inputText =
        'Ich fühle mich sehr gestresst und erschöpft in letzter Zeit. Es fällt mir schwer, mich zu konzentrieren.'

      const result1 = runTriageEngine({ inputText })
      const result2 = runTriageEngine({ inputText })

      expect(result1.tier).toBe(result2.tier)
      expect(result1.nextAction).toBe(result2.nextAction)
      expect(result1.redFlags).toEqual(result2.redFlags)
    })

    it('should produce identical results for same input (ESCALATE)', () => {
      const inputText =
        'Ich habe Suizidgedanken und weiß nicht mehr weiter. Alles fühlt sich hoffnungslos an.'

      const result1 = runTriageEngine({ inputText })
      const result2 = runTriageEngine({ inputText })

      expect(result1.tier).toBe(result2.tier)
      expect(result1.nextAction).toBe(result2.nextAction)
      expect(result1.redFlags).toEqual(result2.redFlags)
    })
  })
})
