/**
 * Issue 7: Question Mapping Tests
 * 
 * Unit tests for consultation question mapping configuration
 */

import { describe, it, expect } from '@jest/globals'
import {
  CONSULTATION_QUESTION_MAPPINGS,
  validateMappingConfiguration,
  getMappingForQuestion,
  getAllMappedQuestionIds,
} from '../questionMapping'

describe('CONSULTATION_QUESTION_MAPPINGS', () => {
  it('should have at least one mapping defined', () => {
    expect(CONSULTATION_QUESTION_MAPPINGS).toBeDefined()
    expect(CONSULTATION_QUESTION_MAPPINGS.length).toBeGreaterThan(0)
  })

  it('should have all required fields for each mapping', () => {
    CONSULTATION_QUESTION_MAPPINGS.forEach((mapping, index) => {
      expect(mapping.questionId).toBeDefined()
      expect(typeof mapping.questionId).toBe('string')
      expect(mapping.questionLabel).toBeDefined()
      expect(typeof mapping.questionLabel).toBe('string')
      expect(mapping.description).toBeDefined()
      expect(typeof mapping.description).toBe('string')
      expect(mapping.extractionLogic).toBeDefined()
      expect(typeof mapping.extractionLogic).toBe('function')
    })
  })

  it('should have unique question IDs', () => {
    const questionIds = CONSULTATION_QUESTION_MAPPINGS.map((m) => m.questionId)
    const uniqueIds = new Set(questionIds)
    expect(uniqueIds.size).toBe(questionIds.length)
  })

  it('should have extraction logic that returns number or null', () => {
    const testContent = {
      problemList: ['Problem 1', 'Problem 2', 'Problem 3'],
      objectiveData: { values: { sleep_hours: 7 } },
      redFlagsScreening: { screened: true, positive: ['Flag 1'] },
      hpi: { functionalImpact: 'moderate impact' },
    } as any

    CONSULTATION_QUESTION_MAPPINGS.forEach((mapping) => {
      const result = mapping.extractionLogic(testContent)
      expect(result === null || typeof result === 'number').toBe(true)
      if (typeof result === 'number') {
        expect(Number.isInteger(result)).toBe(true)
      }
    })
  })
})

describe('validateMappingConfiguration', () => {
  it('should pass validation for current configuration', () => {
    const result = validateMappingConfiguration()
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

describe('getMappingForQuestion', () => {
  it('should return mapping for valid question ID', () => {
    const mapping = getMappingForQuestion('stress_level_overall')
    expect(mapping).toBeDefined()
    expect(mapping?.questionId).toBe('stress_level_overall')
  })

  it('should return null for invalid question ID', () => {
    const mapping = getMappingForQuestion('nonexistent_question')
    expect(mapping).toBeNull()
  })
})

describe('getAllMappedQuestionIds', () => {
  it('should return array of all question IDs', () => {
    const questionIds = getAllMappedQuestionIds()
    expect(Array.isArray(questionIds)).toBe(true)
    expect(questionIds.length).toBeGreaterThan(0)
    expect(questionIds).toContain('stress_level_overall')
  })
})
