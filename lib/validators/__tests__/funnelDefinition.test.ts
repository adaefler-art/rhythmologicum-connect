/**
 * E74.1: Tests for Canonical Funnel Definition Validator
 */

import { describe, it, expect } from '@jest/globals'
import {
  validateQuestionnaireConfig,
  validateContentManifest,
  formatValidationErrors,
  VALIDATION_ERROR_CODES,
} from '../funnelDefinition'

describe('E74.1: Funnel Definition Validator', () => {
  describe('Schema Version Validation', () => {
    it('should reject missing schema_version', () => {
      const config = {
        version: '1.0',
        steps: [
          {
            id: 'step-1',
            title: 'Step 1',
            questions: [
              {
                id: 'q1',
                key: 'question_1',
                type: 'text',
                label: 'Question 1',
              },
            ],
          },
        ],
      }

      const result = validateQuestionnaireConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe(VALIDATION_ERROR_CODES.DEF_MISSING_SCHEMA_VERSION)
    })

    it('should accept valid schema_version v1', () => {
      const config = {
        schema_version: 'v1',
        version: '1.0',
        steps: [
          {
            id: 'step-1',
            title: 'Step 1',
            questions: [
              {
                id: 'q1',
                key: 'question_1',
                type: 'text',
                label: 'Question 1',
              },
            ],
          },
        ],
      }

      const result = validateQuestionnaireConfig(config)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Questionnaire Config Validation', () => {
    it('should reject empty steps array', () => {
      const config = {
        schema_version: 'v1',
        version: '1.0',
        steps: [],
      }

      const result = validateQuestionnaireConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === VALIDATION_ERROR_CODES.DEF_EMPTY_STEPS)).toBe(true)
    })

    it('should reject duplicate step IDs', () => {
      const config = {
        schema_version: 'v1',
        version: '1.0',
        steps: [
          {
            id: 'step-1',
            title: 'Step 1',
            questions: [
              {
                id: 'q1',
                key: 'question_1',
                type: 'text',
                label: 'Question 1',
              },
            ],
          },
          {
            id: 'step-1',
            title: 'Step 1 Duplicate',
            questions: [
              {
                id: 'q2',
                key: 'question_2',
                type: 'text',
                label: 'Question 2',
              },
            ],
          },
        ],
      }

      const result = validateQuestionnaireConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === VALIDATION_ERROR_CODES.DEF_DUPLICATE_STEP_ID)).toBe(true)
    })
  })

  describe('Content Manifest Validation', () => {
    it('should accept valid content manifest', () => {
      const manifest = {
        schema_version: 'v1',
        version: '1.0',
        pages: [
          {
            slug: 'intro',
            title: 'Introduction',
            sections: [
              {
                key: 'hero',
                type: 'hero',
              },
            ],
          },
        ],
      }

      const result = validateContentManifest(manifest)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Error Formatting', () => {
    it('should format errors with rule codes', () => {
      const config = {
        schema_version: 'v1',
        version: '1.0',
        steps: [],
      }

      const result = validateQuestionnaireConfig(config)
      const formatted = formatValidationErrors(result.errors)

      expect(formatted).toContain('DEF_EMPTY_STEPS')
      expect(formatted).toContain('steps')
    })
  })
})
