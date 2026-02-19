/**
 * E6.6.3 — Triage Engine v1 Tests
 *
 * Validates:
 * - AC1: Same input → same output (determinism)
 * - AC2: Red flag always dominates (ESCALATE)
 * - AC3: No medical diagnosis text; rationale is generic routing rationale
 * - AC4: ≥10 representative test cases
 */

import {
  runTriageEngine,
  normalizeInput,
  detectRedFlagsInInput,
  classifyTier,
  determineNextAction,
  determineSafetyRoute,
  generateRationale,
  TRIAGE_RULESET_VERSION,
} from '../engine'
import { TRIAGE_TIER, TRIAGE_NEXT_ACTION, UC1_SAFETY_ROUTE } from '@/lib/api/contracts/triage'

describe('Triage Engine v1 - E6.6.3', () => {
  // ============================================================
  // AC1: Determinism Tests (same input → same output)
  // ============================================================

  describe('AC1: Determinism', () => {
    it('should return identical results for identical input', () => {
      const input = {
        inputText: 'Ich fühle mich sehr gestresst',
        correlationId: 'test-123',
      }

      const result1 = runTriageEngine(input)
      const result2 = runTriageEngine(input)

      expect(result1).toEqual(result2)
    })

    it('should return identical results for identical input with different whitespace', () => {
      const input1 = {
        inputText: 'Ich   fühle  mich    gestresst',
        correlationId: 'test-123',
      }
      const input2 = {
        inputText: 'Ich fühle mich gestresst',
        correlationId: 'test-123',
      }

      const result1 = runTriageEngine(input1)
      const result2 = runTriageEngine(input2)

      expect(result1.tier).toBe(result2.tier)
      expect(result1.nextAction).toBe(result2.nextAction)
      expect(result1.redFlags).toEqual(result2.redFlags)
    })

    it('should return identical results for case variations', () => {
      const input1 = {
        inputText: 'STRESS UND SCHLAFPROBLEME',
        correlationId: 'test-123',
      }
      const input2 = {
        inputText: 'stress und schlafprobleme',
        correlationId: 'test-123',
      }

      const result1 = runTriageEngine(input1)
      const result2 = runTriageEngine(input2)

      expect(result1.tier).toBe(result2.tier)
      expect(result1.nextAction).toBe(result2.nextAction)
    })
  })

  // ============================================================
  // AC2: Red Flag Dominance Tests
  // ============================================================

  describe('AC2: Red Flag Dominance', () => {
    it('should escalate for emergency keyword even with info keywords', () => {
      const input = {
        inputText: 'Was ist Suizid? Ich will mehr wissen.',
        correlationId: 'test-123',
      }

      const result = runTriageEngine(input)

      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
      expect(result.redFlags).toContain('answer_pattern')
      expect(result.safetyRoute).toBe(UC1_SAFETY_ROUTE.NOTRUF)
    })

    it('should escalate for emergency keyword even with assessment keywords', () => {
      const input = {
        inputText: 'Ich habe Stress und Schlafprobleme und will mich umbringen',
        correlationId: 'test-123',
      }

      const result = runTriageEngine(input)

      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
      expect(result.redFlags.length).toBeGreaterThan(0)
      expect(result.safetyRoute).toBe(UC1_SAFETY_ROUTE.NOTRUF)
    })

    it('should always prioritize red flags over classification', () => {
      const inputs = [
        'Ich denke an Selbstmord',
        'Notfall - kann nicht atmen',
        'Selbstverletzung - brauche Hilfe',
      ]

      inputs.forEach((text) => {
        const result = runTriageEngine({ inputText: text })
        expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
        expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
        expect(result.safetyRoute).toBe(UC1_SAFETY_ROUTE.NOTRUF)
      })
    })

    it('should detect English emergency keywords', () => {
      const input = {
        inputText: 'I want to kill myself',
        correlationId: 'test-123',
      }

      const result = runTriageEngine(input)

      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
      expect(result.redFlags).toContain('answer_pattern')
      expect(result.safetyRoute).toBe(UC1_SAFETY_ROUTE.NOTRUF)
    })

    it('should escalate for clinical red flags from catalog (CHEST_PAIN)', () => {
      const input = {
        inputText: 'Ich habe starke Brustschmerzen',
        correlationId: 'test-123',
      }

      const result = runTriageEngine(input)

      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
      expect(result.redFlags).toContain('answer_pattern')
      expect(result.safetyRoute).toBe(UC1_SAFETY_ROUTE.NOTAUFNAHME)
    })

    it('should escalate for clinical red flags from catalog (SEVERE_DYSPNEA)', () => {
      const input = {
        inputText: 'Ich kann nicht atmen',
        correlationId: 'test-123',
      }

      const result = runTriageEngine(input)

      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
      expect(result.redFlags).toContain('answer_pattern')
      expect(result.safetyRoute).toBe(UC1_SAFETY_ROUTE.NOTRUF)
    })

    it('should escalate for clinical red flags from catalog (SYNCOPE)', () => {
      const input = {
        inputText: 'Ich bin ohnmächtig geworden',
        correlationId: 'test-123',
      }

      const result = runTriageEngine(input)

      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
      expect(result.redFlags).toContain('answer_pattern')
      expect(result.safetyRoute).toBe(UC1_SAFETY_ROUTE.NOTAUFNAHME)
    })
  })

  // ============================================================
  // AC3: Generic Routing Rationale (No Medical Diagnosis)
  // ============================================================

  describe('AC3: Generic Routing Rationale', () => {
    it('should provide generic rationale for INFO tier', () => {
      const input = {
        inputText: 'Was ist Stress?',
        correlationId: 'test-123',
      }

      const result = runTriageEngine(input)

      expect(result.tier).toBe(TRIAGE_TIER.INFO)
      expect(result.rationale).not.toContain('Diagnose')
      expect(result.rationale).not.toContain('diagnosis')
      expect(result.rationale).toContain('informativ')
      expect(result.safetyRoute).toBe(UC1_SAFETY_ROUTE.STANDARD_INTAKE)
    })

    it('should provide generic rationale for ASSESSMENT tier', () => {
      const input = {
        inputText: 'Ich fühle mich sehr gestresst',
        correlationId: 'test-123',
      }

      const result = runTriageEngine(input)

      expect(result.tier).toBe(TRIAGE_TIER.ASSESSMENT)
      expect(result.rationale).not.toContain('Diagnose')
      expect(result.rationale).not.toContain('diagnosis')
      expect(result.rationale).toContain('Fragebogen')
      expect(result.safetyRoute).toBe(UC1_SAFETY_ROUTE.STANDARD_INTAKE)
    })

    it('should provide generic rationale for ESCALATE tier', () => {
      const input = {
        inputText: 'Ich denke an Selbstmord',
        correlationId: 'test-123',
      }

      const result = runTriageEngine(input)

      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
      expect(result.rationale).not.toContain('Diagnose')
      expect(result.rationale).not.toContain('diagnosis')
      expect(result.rationale).toContain('Notfall')
      expect(result.safetyRoute).toBe(UC1_SAFETY_ROUTE.NOTRUF)
    })
  })

  // ============================================================
  // AC4: Representative Test Cases (≥10 cases)
  // ============================================================

  describe('AC4: Representative Test Cases', () => {
    const testCases = [
      {
        name: 'INFO: Simple question',
        input: 'Was ist Stress?',
        expectedTier: TRIAGE_TIER.INFO,
        expectedAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        expectedRedFlags: [],
      },
      {
        name: 'INFO: How does something work',
        input: 'Wie funktioniert Entspannung?',
        expectedTier: TRIAGE_TIER.INFO,
        expectedAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        expectedRedFlags: [],
      },
      {
        name: 'ASSESSMENT: Stress symptoms',
        input: 'Ich habe starken Stress bei der Arbeit',
        expectedTier: TRIAGE_TIER.ASSESSMENT,
        expectedAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        expectedRedFlags: [],
      },
      {
        name: 'ASSESSMENT: Sleep problems',
        input: 'Ich habe Schlafprobleme seit mehreren Wochen',
        expectedTier: TRIAGE_TIER.ASSESSMENT,
        expectedAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        expectedRedFlags: [],
      },
      {
        name: 'ASSESSMENT: Anxiety',
        input: 'Ich fühle mich ständig ängstlich und besorgt',
        expectedTier: TRIAGE_TIER.ASSESSMENT,
        expectedAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        expectedRedFlags: [],
      },
      {
        name: 'ASSESSMENT: Exhaustion',
        input: 'Ich bin völlig erschöpft und überfordert',
        expectedTier: TRIAGE_TIER.ASSESSMENT,
        expectedAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        expectedRedFlags: [],
      },
      {
        name: 'ASSESSMENT: Default case',
        input: 'Ich brauche Hilfe mit meiner Situation',
        expectedTier: TRIAGE_TIER.ASSESSMENT,
        expectedAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        expectedRedFlags: [],
      },
      {
        name: 'ESCALATE: Suicidal ideation (German)',
        input: 'Ich denke an Selbstmord',
        expectedTier: TRIAGE_TIER.ESCALATE,
        expectedAction: TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
        expectedRedFlags: ['answer_pattern'],
      },
      {
        name: 'ESCALATE: Self-harm',
        input: 'Ich verletze mich selbst',
        expectedTier: TRIAGE_TIER.ESCALATE,
        expectedAction: TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
        expectedRedFlags: ['answer_pattern'],
      },
      {
        name: 'ESCALATE: Emergency (English)',
        input: 'I cant breathe - emergency',
        expectedTier: TRIAGE_TIER.ESCALATE,
        expectedAction: TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
        expectedRedFlags: ['answer_pattern'],
      },
      {
        name: 'ESCALATE: Panic attack',
        input: 'Ich habe eine Panikattacke',
        expectedTier: TRIAGE_TIER.ESCALATE,
        expectedAction: TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
        expectedRedFlags: ['answer_pattern'],
      },
      {
        name: 'ESCALATE: Suicidal ideation (English)',
        input: 'I want to end my life',
        expectedTier: TRIAGE_TIER.ESCALATE,
        expectedAction: TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
        expectedRedFlags: ['answer_pattern'],
      },
    ]

    testCases.forEach((testCase) => {
      it(`should correctly classify: ${testCase.name}`, () => {
        const input = {
          inputText: testCase.input,
          correlationId: 'test-123',
        }

        const result = runTriageEngine(input)

        expect(result.tier).toBe(testCase.expectedTier)
        expect(result.nextAction).toBe(testCase.expectedAction)
        expect(result.redFlags).toEqual(testCase.expectedRedFlags)
        expect(result.version).toBe('v1')
        expect(result.correlationId).toBe('test-123')
      })
    })

    it('routes urgent non-emergency input to DRINGENDER_TERMIN', () => {
      const result = runTriageEngine({
        inputText: 'Ich brauche dringend heute noch einen Termin wegen starker Belastung',
      })

      expect(result.tier).toBe(TRIAGE_TIER.ASSESSMENT)
      expect(result.safetyRoute).toBe(UC1_SAFETY_ROUTE.DRINGENDER_TERMIN)
    })
  })

  // ============================================================
  // Unit Tests: Individual Functions
  // ============================================================

  describe('normalizeInput', () => {
    it('should convert to lowercase', () => {
      expect(normalizeInput('STRESS UND ANGST')).toBe('stress und angst')
    })

    it('should trim whitespace', () => {
      expect(normalizeInput('  stress  ')).toBe('stress')
    })

    it('should collapse multiple spaces', () => {
      expect(normalizeInput('ich   habe    stress')).toBe('ich habe stress')
    })

    it('should handle all normalizations together', () => {
      expect(normalizeInput('  ICH   HABE  STRESS  ')).toBe('ich habe stress')
    })
  })

  describe('detectRedFlagsInInput', () => {
    it('should detect German emergency keywords', () => {
      const flags = detectRedFlagsInInput('ich denke an suizid')
      expect(flags).toContain('answer_pattern')
    })

    it('should detect English emergency keywords', () => {
      const flags = detectRedFlagsInInput('i want to kill myself')
      expect(flags).toContain('answer_pattern')
    })

    it('should return empty array for no red flags', () => {
      const flags = detectRedFlagsInInput('ich habe stress')
      expect(flags).toEqual([])
    })

    it('should detect only one flag type even with multiple keywords', () => {
      const flags = detectRedFlagsInInput('suizid und selbstmord')
      expect(flags).toEqual(['answer_pattern'])
    })
  })

  describe('classifyTier', () => {
    it('should classify info keywords as INFO', () => {
      expect(classifyTier('was ist stress')).toBe(TRIAGE_TIER.INFO)
      expect(classifyTier('wie funktioniert das')).toBe(TRIAGE_TIER.INFO)
    })

    it('should classify assessment keywords as ASSESSMENT', () => {
      expect(classifyTier('ich habe stress')).toBe(TRIAGE_TIER.ASSESSMENT)
      expect(classifyTier('ich habe schlafprobleme')).toBe(TRIAGE_TIER.ASSESSMENT)
      expect(classifyTier('ich bin erschöpft')).toBe(TRIAGE_TIER.ASSESSMENT)
    })

    it('should default to ASSESSMENT for unknown patterns', () => {
      expect(classifyTier('ich brauche hilfe')).toBe(TRIAGE_TIER.ASSESSMENT)
    })

    it('should prioritize INFO over ASSESSMENT when both present', () => {
      expect(classifyTier('was ist stress und burnout')).toBe(TRIAGE_TIER.INFO)
    })
  })

  describe('determineSafetyRoute', () => {
    it('returns STANDARD_INTAKE for non-urgent informational route', () => {
      const route = determineSafetyRoute(TRIAGE_TIER.INFO, 'was ist stress', [])
      expect(route).toBe(UC1_SAFETY_ROUTE.STANDARD_INTAKE)
    })
  })

  describe('determineNextAction', () => {
    it('should map INFO to SHOW_CONTENT', () => {
      expect(determineNextAction(TRIAGE_TIER.INFO)).toBe(TRIAGE_NEXT_ACTION.SHOW_CONTENT)
    })

    it('should map ASSESSMENT to START_FUNNEL_A', () => {
      expect(determineNextAction(TRIAGE_TIER.ASSESSMENT)).toBe(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
    })

    it('should map ESCALATE to SHOW_ESCALATION', () => {
      expect(determineNextAction(TRIAGE_TIER.ESCALATE)).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
    })
  })

  describe('generateRationale', () => {
    it('should generate escalation rationale when red flags present', () => {
      const rationale = generateRationale(TRIAGE_TIER.ESCALATE, ['answer_pattern'])
      expect(rationale).toContain('Notfall')
      expect(rationale).not.toContain('Diagnose')
    })

    it('should generate INFO rationale', () => {
      const rationale = generateRationale(TRIAGE_TIER.INFO, [])
      expect(rationale).toContain('informativ')
      expect(rationale).not.toContain('Diagnose')
    })

    it('should generate ASSESSMENT rationale', () => {
      const rationale = generateRationale(TRIAGE_TIER.ASSESSMENT, [])
      expect(rationale).toContain('Fragebogen')
      expect(rationale).not.toContain('Diagnose')
    })

    it('should never contain medical diagnosis language', () => {
      const tiers = [TRIAGE_TIER.INFO, TRIAGE_TIER.ASSESSMENT, TRIAGE_TIER.ESCALATE]
      tiers.forEach((tier) => {
        const rationale = generateRationale(tier, [])
        expect(rationale).not.toContain('Diagnose')
        expect(rationale).not.toContain('diagnosis')
        expect(rationale).not.toContain('krank')
        expect(rationale).not.toContain('disease')
      })
    })
  })

  // ============================================================
  // Rule Ordering Tests
  // ============================================================

  describe('Rule Ordering', () => {
    it('should check red flags before tier classification', () => {
      // Even though "was ist" is an info keyword, "suizid" should trigger escalation
      const result = runTriageEngine({
        inputText: 'was ist suizid',
      })

      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
    })

    it('should check info keywords before assessment keywords', () => {
      // "was ist" should take precedence over "stress"
      const result = runTriageEngine({
        inputText: 'was ist stress',
      })

      expect(result.tier).toBe(TRIAGE_TIER.INFO)
    })

    it('should apply rules in fixed order regardless of input order', () => {
      const result1 = runTriageEngine({
        inputText: 'stress was ist das',
      })
      const result2 = runTriageEngine({
        inputText: 'was ist stress',
      })

      // Both should be INFO because "was ist" is checked first
      expect(result1.tier).toBe(result2.tier)
      expect(result1.tier).toBe(TRIAGE_TIER.INFO)
    })
  })

  // ============================================================
  // Version and Metadata Tests
  // ============================================================

  describe('Version and Metadata', () => {
    it('should include correct schema version', () => {
      const result = runTriageEngine({
        inputText: 'ich habe stress',
      })

      expect(result.version).toBe('v1')
    })

    it('should include correlation ID when provided', () => {
      const result = runTriageEngine({
        inputText: 'ich habe stress',
        correlationId: 'test-correlation-123',
      })

      expect(result.correlationId).toBe('test-correlation-123')
    })

    it('should handle missing correlation ID', () => {
      const result = runTriageEngine({
        inputText: 'ich habe stress',
      })

      expect(result.correlationId).toBeUndefined()
    })

    it('should have ruleset version defined', () => {
      expect(TRIAGE_RULESET_VERSION).toBeDefined()
      expect(typeof TRIAGE_RULESET_VERSION).toBe('string')
    })
  })
})
