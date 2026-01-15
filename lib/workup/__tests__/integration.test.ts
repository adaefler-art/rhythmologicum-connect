/**
 * Integration Tests for Workup Flow (E6.4.5)
 *
 * Tests the complete workup flow from assessment completion to workup check.
 */

import { performWorkupCheck, getRulesetVersion } from '../index'
import { createEvidencePack } from '../helpers'
import type { EvidencePack } from '@/lib/types/workup'

// Mock the Supabase client
jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

describe('Workup Integration Flow', () => {
  describe('performWorkupCheck', () => {
    it('should perform complete workup check with all components', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3,
          stress_q2: 2,
          sleep_q1: 4,
          sleep_q2: 3,
        },
      }

      const result = performWorkupCheck(evidencePack)

      // Should return complete result
      expect(result).toHaveProperty('isSufficient')
      expect(result).toHaveProperty('missingDataFields')
      expect(result).toHaveProperty('followUpQuestions')
      expect(result).toHaveProperty('evidencePackHash')

      // Hash should be stable
      expect(result.evidencePackHash).toHaveLength(64)

      // Should be sufficient (all data present)
      expect(result.isSufficient).toBe(true)
      expect(result.missingDataFields).toHaveLength(0)
      expect(result.followUpQuestions).toHaveLength(0)
    })

    it('should identify missing data and generate follow-ups', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          // Only stress questions, missing sleep
          stress_q1: 3,
          stress_q2: 2,
        },
      }

      const result = performWorkupCheck(evidencePack)

      // Should be insufficient
      expect(result.isSufficient).toBe(false)

      // Should identify missing sleep data
      expect(result.missingDataFields).toContain('sleep_quality')

      // Should generate follow-up questions
      expect(result.followUpQuestions.length).toBeGreaterThan(0)
      expect(result.followUpQuestions[0]).toHaveProperty('id')
      expect(result.followUpQuestions[0]).toHaveProperty('questionText')
      expect(result.followUpQuestions[0]).toHaveProperty('inputType')
      expect(result.followUpQuestions[0]).toHaveProperty('priority')
    })

    it('should handle funnels without rulesets gracefully', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'unknown-funnel',
        answers: {},
      }

      const result = performWorkupCheck(evidencePack)

      // Should consider data sufficient if no ruleset exists
      expect(result.isSufficient).toBe(true)
      expect(result.missingDataFields).toHaveLength(0)
      expect(result.followUpQuestions).toHaveLength(0)
    })
  })

  describe('getRulesetVersion', () => {
    it('should return ruleset version for stress-assessment', () => {
      const version = getRulesetVersion('stress-assessment')
      expect(version).toBe('1.0.0')
    })

    it('should return null for unknown funnel', () => {
      const version = getRulesetVersion('unknown-funnel')
      expect(version).toBeNull()
    })
  })

  describe('State transitions (AC1)', () => {
    it('should transition from in_progress to needs_more_data when data is missing', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3, // Only one question answered
        },
      }

      const result = performWorkupCheck(evidencePack)

      // Should transition to needs_more_data
      expect(result.isSufficient).toBe(false)
      expect(result.missingDataFields.length).toBeGreaterThan(0)
    })

    it('should transition from in_progress to ready_for_review when data is complete', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3,
          stress_q2: 2,
          sleep_q1: 4,
          sleep_q2: 3,
        },
      }

      const result = performWorkupCheck(evidencePack)

      // Should transition to ready_for_review
      expect(result.isSufficient).toBe(true)
      expect(result.missingDataFields).toHaveLength(0)
    })

    it('should be deterministic - state transitions are predictable (AC1)', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3,
        },
      }

      // Run multiple times
      const result1 = performWorkupCheck(evidencePack)
      const result2 = performWorkupCheck(evidencePack)
      const result3 = performWorkupCheck(evidencePack)

      // Results should be identical
      expect(result1.isSufficient).toBe(result2.isSufficient)
      expect(result1.isSufficient).toBe(result3.isSufficient)

      expect(result1.missingDataFields).toEqual(result2.missingDataFields)
      expect(result1.missingDataFields).toEqual(result3.missingDataFields)

      expect(result1.evidencePackHash).toBe(result2.evidencePackHash)
      expect(result1.evidencePackHash).toBe(result3.evidencePackHash)
    })
  })

  describe('Follow-up questions (AC2)', () => {
    it('should contain at least 1 follow-up when data is missing (AC2)', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {},
      }

      const result = performWorkupCheck(evidencePack)

      // AC2: needs_more_data contains at least 1 follow-up question
      expect(result.isSufficient).toBe(false)
      expect(result.followUpQuestions.length).toBeGreaterThanOrEqual(1)

      // Each follow-up should have required fields
      result.followUpQuestions.forEach((question) => {
        expect(question.id).toBeTruthy()
        expect(question.fieldKey).toBeTruthy()
        expect(question.questionText).toBeTruthy()
        expect(question.inputType).toBeTruthy()
        expect(typeof question.priority).toBe('number')
      })
    })
  })

  describe('No diagnosis output (AC3)', () => {
    it('should not include any diagnostic text in results (AC3)', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {},
      }

      const result = performWorkupCheck(evidencePack)

      // Convert result to JSON string to check for diagnostic keywords
      const resultJson = JSON.stringify(result).toLowerCase()

      // Should NOT contain diagnostic terms
      const diagnosticTerms = [
        'diagnose',
        'diagnosis',
        'krankheit',
        'störung',
        'syndrom',
        'behandlung',
        'therapie',
        'medikament',
        'arbeitsdiagnose',
        'differentialdiagnose',
      ]

      diagnosticTerms.forEach((term) => {
        expect(resultJson).not.toContain(term)
      })

      // Should only contain data collection language
      expect(result.followUpQuestions.every((q) => q.questionText.length > 0)).toBe(true)
      expect(result.missingDataFields.every((f) => f.length > 0)).toBe(true)
    })
  })

  describe('Evidence hash stability (AC4)', () => {
    it('should produce stable hash for same inputs (AC4)', () => {
      const evidencePack1: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3,
          sleep_q1: 4,
        },
      }

      const evidencePack2: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          sleep_q1: 4, // Different order
          stress_q1: 3,
        },
      }

      const result1 = performWorkupCheck(evidencePack1)
      const result2 = performWorkupCheck(evidencePack2)

      // AC4: Same input → same hash
      expect(result1.evidencePackHash).toBe(result2.evidencePackHash)
    })
  })
})
