/**
 * Unit Tests for Funnel Version Loader
 * 
 * Tests the manifest validation and error handling logic
 */

import {
  FunnelNotFoundError,
  FunnelVersionNotFoundError,
  ManifestValidationError,
  validateQuestionnaireConfig,
  validateContentManifest,
  type FunnelVersionRow,
} from '../loadFunnelVersion'
import { QUESTION_TYPE } from '@/lib/contracts/registry'
import { SECTION_TYPE } from '@/lib/contracts/funnelManifest'

// Mock Supabase (since we're testing validation logic, not DB access)
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  })),
}))

describe('Error Classes', () => {
  describe('FunnelNotFoundError', () => {
    it('should create error with funnel slug', () => {
      const error = new FunnelNotFoundError('test-funnel')
      expect(error.message).toBe('Funnel not found: test-funnel')
      expect(error.name).toBe('FunnelNotFoundError')
    })
  })

  describe('FunnelVersionNotFoundError', () => {
    it('should create error with funnel ID and version', () => {
      const error = new FunnelVersionNotFoundError('funnel-123', '1.0.0')
      expect(error.message).toBe('Funnel version not found: funnel-123@1.0.0')
      expect(error.name).toBe('FunnelVersionNotFoundError')
    })

    it('should create error for missing default version', () => {
      const error = new FunnelVersionNotFoundError('funnel-123')
      expect(error.message).toBe('No default version found for funnel: funnel-123')
      expect(error.name).toBe('FunnelVersionNotFoundError')
    })
  })

  describe('ManifestValidationError', () => {
    it('should create error with message', () => {
      const error = new ManifestValidationError('Invalid config')
      expect(error.message).toBe('Manifest validation failed: Invalid config')
      expect(error.name).toBe('ManifestValidationError')
    })

    it('should store cause if provided', () => {
      const cause = new Error('Root cause')
      const error = new ManifestValidationError('Invalid config', cause)
      expect(error.cause).toBe(cause)
    })
  })
})

describe('validateQuestionnaireConfig', () => {
  it('should validate valid questionnaire config', () => {
    const validConfig = {
      version: '1.0',
      steps: [
        {
          id: 'step1',
          title: 'Test Step',
          questions: [
            {
              id: 'q1',
              key: 'test_question',
              type: QUESTION_TYPE.TEXT,
              label: 'Test Question',
              required: true,
            },
          ],
        },
      ],
    }

    const result = validateQuestionnaireConfig(validConfig)
    expect(result.version).toBe('1.0')
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0].questions).toHaveLength(1)
  })

  it('should apply default version if not provided', () => {
    const configWithoutVersion = {
      steps: [
        {
          id: 'step1',
          title: 'Test',
          questions: [
            {
              id: 'q1',
              key: 'test',
              type: QUESTION_TYPE.TEXT,
              label: 'Test',
            },
          ],
        },
      ],
    }

    const result = validateQuestionnaireConfig(configWithoutVersion)
    expect(result.version).toBe('1.0')
  })

  it('should reject invalid questionnaire config', () => {
    const invalidConfig = {
      steps: 'not an array',
    }

    expect(() => validateQuestionnaireConfig(invalidConfig)).toThrow(ManifestValidationError)
  })

  it('should reject config with invalid question type', () => {
    const configWithInvalidType = {
      version: '1.0',
      steps: [
        {
          id: 'step1',
          title: 'Test',
          questions: [
            {
              id: 'q1',
              key: 'test',
              type: 'fantasy_type', // Not from registry
              label: 'Test',
            },
          ],
        },
      ],
    }

    expect(() => validateQuestionnaireConfig(configWithInvalidType)).toThrow(
      ManifestValidationError,
    )
  })

  it('should validate config with conditional logic', () => {
    const configWithLogic = {
      version: '1.0',
      steps: [
        {
          id: 'step1',
          title: 'Step 1',
          questions: [
            {
              id: 'q1',
              key: 'has_stress',
              type: QUESTION_TYPE.RADIO,
              label: 'Stressed?',
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
            },
          ],
        },
        {
          id: 'step2',
          title: 'Step 2',
          questions: [
            {
              id: 'q2',
              key: 'stress_level',
              type: QUESTION_TYPE.SCALE,
              label: 'How stressed?',
              minValue: 1,
              maxValue: 10,
            },
          ],
          conditionalLogic: {
            type: 'show',
            conditions: [
              {
                questionId: 'q1',
                operator: 'eq',
                value: 'yes',
              },
            ],
            logic: 'and',
          },
        },
      ],
    }

    const result = validateQuestionnaireConfig(configWithLogic)
    expect(result.steps).toHaveLength(2)
    expect(result.steps[1].conditionalLogic).toBeDefined()
  })
})

describe('validateContentManifest', () => {
  it('should validate valid content manifest', () => {
    const validManifest = {
      version: '1.0',
      pages: [
        {
          slug: 'intro',
          title: 'Introduction',
          description: 'Welcome page',
          sections: [
            {
              key: 'hero',
              type: SECTION_TYPE.HERO,
              content: {
                title: 'Test',
              },
            },
          ],
        },
      ],
    }

    const result = validateContentManifest(validManifest)
    expect(result.version).toBe('1.0')
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0].sections).toHaveLength(1)
  })

  it('should apply default version if not provided', () => {
    const manifestWithoutVersion = {
      pages: [],
    }

    const result = validateContentManifest(manifestWithoutVersion)
    expect(result.version).toBe('1.0')
  })

  it('should reject invalid content manifest', () => {
    const invalidManifest = {
      pages: 'not an array',
    }

    expect(() => validateContentManifest(invalidManifest)).toThrow(ManifestValidationError)
  })

  it('should reject manifest with invalid section type', () => {
    const manifestWithInvalidType = {
      version: '1.0',
      pages: [
        {
          slug: 'test',
          title: 'Test',
          sections: [
            {
              key: 'test',
              type: 'fantasy_section_type', // Not from SECTION_TYPE
            },
          ],
        },
      ],
    }

    expect(() => validateContentManifest(manifestWithInvalidType)).toThrow(
      ManifestValidationError,
    )
  })

  it('should validate manifest with assets', () => {
    const manifestWithAssets = {
      version: '1.0',
      pages: [],
      assets: [
        {
          key: 'hero-image',
          type: 'image',
          url: 'https://example.com/hero.jpg',
          metadata: {
            alt: 'Hero image',
          },
        },
      ],
    }

    const result = validateContentManifest(manifestWithAssets)
    expect(result.assets).toHaveLength(1)
    expect(result.assets![0].key).toBe('hero-image')
  })

  it('should validate manifest with multiple pages', () => {
    const manifestWithPages = {
      version: '1.0',
      pages: [
        {
          slug: 'intro',
          title: 'Intro',
          sections: [
            {
              key: 'hero',
              type: SECTION_TYPE.HERO,
            },
          ],
        },
        {
          slug: 'results',
          title: 'Results',
          sections: [
            {
              key: 'summary',
              type: SECTION_TYPE.TEXT,
            },
          ],
        },
      ],
    }

    const result = validateContentManifest(manifestWithPages)
    expect(result.pages).toHaveLength(2)
  })
})

describe('Integration - Type Safety', () => {
  it('should enforce type safety for question types', () => {
    // This test demonstrates that only registry types are accepted
    const validTypes = Object.values(QUESTION_TYPE)

    validTypes.forEach((type) => {
      const config = {
        version: '1.0',
        steps: [
          {
            id: 'step1',
            title: 'Test',
            questions: [
              {
                id: 'q1',
                key: 'test',
                type,
                label: 'Test',
              },
            ],
          },
        ],
      }

      expect(() => validateQuestionnaireConfig(config)).not.toThrow()
    })
  })

  it('should enforce type safety for section types', () => {
    // This test demonstrates that only SECTION_TYPE values are accepted
    const validTypes = Object.values(SECTION_TYPE)

    validTypes.forEach((type) => {
      const manifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test',
            title: 'Test',
            sections: [
              {
                key: 'test',
                type,
              },
            ],
          },
        ],
      }

      expect(() => validateContentManifest(manifest)).not.toThrow()
    })
  })

  it('should reject all fantasy types', () => {
    const fantasyQuestionType = {
      version: '1.0',
      steps: [
        {
          id: 'step1',
          title: 'Test',
          questions: [
            {
              id: 'q1',
              key: 'test',
              type: 'magic_input',
              label: 'Test',
            },
          ],
        },
      ],
    }

    expect(() => validateQuestionnaireConfig(fantasyQuestionType)).toThrow()

    const fantasySectionType = {
      version: '1.0',
      pages: [
        {
          slug: 'test',
          title: 'Test',
          sections: [
            {
              key: 'test',
              type: 'magic_section',
            },
          ],
        },
      ],
    }

    expect(() => validateContentManifest(fantasySectionType)).toThrow()
  })
})
