/**
 * Tests for Data Sufficiency Checker (E6.4.5 - AC1, AC2)
 *
 * Verifies that data sufficiency rules are deterministic and testable.
 * Tests given input → expected missing_data mapping.
 */

import {
  checkDataSufficiency,
  getRulesetForFunnel,
  determineWorkupStatus,
  STRESS_ASSESSMENT_RULESET_V1,
} from '../dataSufficiency'
import type { EvidencePack } from '@/lib/types/workup'

describe('Data Sufficiency Checker', () => {
  describe('getRulesetForFunnel', () => {
    it('should return stress assessment ruleset for stress-assessment slug', () => {
      const ruleset = getRulesetForFunnel('stress-assessment')
      expect(ruleset).toBe(STRESS_ASSESSMENT_RULESET_V1)
      expect(ruleset?.funnelSlug).toBe('stress-assessment')
      expect(ruleset?.version).toBe('1.0.0')
    })

    it('should return stress assessment ruleset for stress alias', () => {
      const ruleset = getRulesetForFunnel('stress')
      expect(ruleset).toBe(STRESS_ASSESSMENT_RULESET_V1)
    })

    it('should handle case-insensitive and whitespace in slug', () => {
      const ruleset = getRulesetForFunnel('  STRESS-ASSESSMENT  ')
      expect(ruleset).toBe(STRESS_ASSESSMENT_RULESET_V1)
    })

    it('should return null for unknown funnel', () => {
      const ruleset = getRulesetForFunnel('unknown-funnel')
      expect(ruleset).toBeNull()
    })
  })

  describe('checkDataSufficiency', () => {
    it('should return sufficient when all rules pass', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          // Sleep questions answered
          sleep_q1: 3,
          sleep_q2: 4,
          // Stress questions answered
          stress_q1: 2,
          stress_q2: 3,
        },
      }

      const result = checkDataSufficiency(evidencePack)

      expect(result.isSufficient).toBe(true)
      expect(result.missingDataFields).toHaveLength(0)
      expect(result.followUpQuestions).toHaveLength(0)
      expect(result.evidencePackHash).toBeTruthy()
    })

    it('should detect missing sleep quality data', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          // Only stress questions, no sleep questions
          stress_q1: 2,
          stress_q2: 3,
        },
      }

      const result = checkDataSufficiency(evidencePack)

      expect(result.isSufficient).toBe(false)
      expect(result.missingDataFields).toContain('sleep_quality')
      expect(result.followUpQuestions.length).toBeGreaterThan(0)

      // Find sleep quality follow-up
      const sleepFollowUp = result.followUpQuestions.find(
        (q) => q.fieldKey === 'sleep_quality',
      )
      expect(sleepFollowUp).toBeDefined()
      expect(sleepFollowUp?.questionText).toContain('Schlafqualität')
    })

    it('should detect missing stress trigger data', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          // Only sleep questions, no stress questions
          sleep_q1: 3,
          sleep_q2: 4,
        },
      }

      const result = checkDataSufficiency(evidencePack)

      expect(result.isSufficient).toBe(false)
      expect(result.missingDataFields).toContain('stress_triggers')
      expect(result.followUpQuestions.length).toBeGreaterThan(0)

      // Find stress triggers follow-up
      const stressFollowUp = result.followUpQuestions.find(
        (q) => q.fieldKey === 'stress_triggers',
      )
      expect(stressFollowUp).toBeDefined()
      expect(stressFollowUp?.questionText).toContain('Stress')
    })

    it('should detect multiple missing data fields', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          // No answers at all
        },
      }

      const result = checkDataSufficiency(evidencePack)

      expect(result.isSufficient).toBe(false)
      expect(result.missingDataFields).toContain('sleep_quality')
      expect(result.missingDataFields).toContain('stress_triggers')
      expect(result.followUpQuestions).toHaveLength(2)
    })

    it('should sort follow-up questions by priority', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {},
      }

      const result = checkDataSufficiency(evidencePack)

      // Verify questions are sorted by priority (highest first)
      for (let i = 0; i < result.followUpQuestions.length - 1; i++) {
        expect(result.followUpQuestions[i].priority).toBeGreaterThanOrEqual(
          result.followUpQuestions[i + 1].priority,
        )
      }
    })

    it('should consider data sufficient if no ruleset exists', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'unknown-funnel',
        answers: {},
      }

      const result = checkDataSufficiency(evidencePack)

      expect(result.isSufficient).toBe(true)
      expect(result.missingDataFields).toHaveLength(0)
      expect(result.followUpQuestions).toHaveLength(0)
    })

    it('should be deterministic - same input produces same output', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 2,
        },
      }

      const result1 = checkDataSufficiency(evidencePack)
      const result2 = checkDataSufficiency(evidencePack)

      expect(result1.isSufficient).toBe(result2.isSufficient)
      expect(result1.missingDataFields).toEqual(result2.missingDataFields)
      expect(result1.followUpQuestions).toEqual(result2.followUpQuestions)
      expect(result1.evidencePackHash).toBe(result2.evidencePackHash)
    })
  })

  describe('determineWorkupStatus', () => {
    it('should return ready_for_review when data is sufficient', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          sleep_q1: 3,
          stress_q1: 2,
        },
      }

      const status = determineWorkupStatus(evidencePack)
      expect(status).toBe('ready_for_review')
    })

    it('should return needs_more_data when data is insufficient', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {},
      }

      const status = determineWorkupStatus(evidencePack)
      expect(status).toBe('needs_more_data')
    })
  })
})
