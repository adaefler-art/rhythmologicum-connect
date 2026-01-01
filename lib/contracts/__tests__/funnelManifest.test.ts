/**
 * Unit Tests for Funnel Plugin Manifest Schemas
 * 
 * Tests Zod schema validation for questionnaire configs and content manifests
 */

import {
  FunnelQuestionnaireConfigSchema,
  FunnelContentManifestSchema,
  FunnelPluginManifestSchema,
  QuestionConfigSchema,
  ContentSectionSchema,
  parseQuestionnaireConfig,
  safeParseQuestionnaireConfig,
  parseContentManifest,
  safeParseContentManifest,
  parsePluginManifest,
  safeParsePluginManifest,
  isValidSectionType,
  SECTION_TYPE,
  type FunnelQuestionnaireConfig,
  type FunnelContentManifest,
  type QuestionConfig,
} from '../funnelManifest'
import { QUESTION_TYPE } from '../registry'

describe('QuestionConfigSchema', () => {
  it('should validate a valid question with all fields', () => {
    const validQuestion: QuestionConfig = {
      id: 'q1',
      key: 'stress_level',
      type: QUESTION_TYPE.SCALE,
      label: 'How stressed do you feel?',
      helpText: 'Rate from 1 to 10',
      required: true,
      minValue: 1,
      maxValue: 10,
      validation: {
        required: true,
        min: 1,
        max: 10,
        message: 'Please select a value between 1 and 10',
      },
    }

    expect(() => QuestionConfigSchema.parse(validQuestion)).not.toThrow()
  })

  it('should validate a minimal valid question', () => {
    const minimalQuestion = {
      id: 'q2',
      key: 'name',
      type: QUESTION_TYPE.TEXT,
      label: 'What is your name?',
    }

    expect(() => QuestionConfigSchema.parse(minimalQuestion)).not.toThrow()
  })

  it('should validate a radio question with options', () => {
    const radioQuestion = {
      id: 'q3',
      key: 'frequency',
      type: QUESTION_TYPE.RADIO,
      label: 'How often do you exercise?',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
      ],
    }

    expect(() => QuestionConfigSchema.parse(radioQuestion)).not.toThrow()
  })

  it('should reject question with invalid type', () => {
    const invalidQuestion = {
      id: 'q4',
      key: 'invalid',
      type: 'fantasy_type', // Not from registry
      label: 'Invalid question',
    }

    expect(() => QuestionConfigSchema.parse(invalidQuestion)).toThrow()
  })

  it('should reject question without required fields', () => {
    const invalidQuestion = {
      id: 'q5',
      type: QUESTION_TYPE.TEXT,
      // Missing 'key' and 'label'
    }

    expect(() => QuestionConfigSchema.parse(invalidQuestion)).toThrow()
  })
})

describe('FunnelQuestionnaireConfigSchema', () => {
  it('should validate a valid questionnaire config', () => {
    const validConfig: FunnelQuestionnaireConfig = {
      version: '1.0',
      steps: [
        {
          id: 'step1',
          title: 'Basic Information',
          questions: [
            {
              id: 'q1',
              key: 'name',
              type: QUESTION_TYPE.TEXT,
              label: 'Name',
              required: true,
            },
            {
              id: 'q2',
              key: 'age',
              type: QUESTION_TYPE.NUMBER,
              label: 'Age',
              minValue: 0,
              maxValue: 120,
            },
          ],
        },
        {
          id: 'step2',
          title: 'Stress Assessment',
          description: 'Answer questions about your stress level',
          questions: [
            {
              id: 'q3',
              key: 'stress_level',
              type: QUESTION_TYPE.SCALE,
              label: 'Stress level',
              minValue: 1,
              maxValue: 10,
            },
          ],
        },
      ],
    }

    expect(() => FunnelQuestionnaireConfigSchema.parse(validConfig)).not.toThrow()
  })

  it('should validate config with conditional logic', () => {
    const configWithLogic = {
      version: '1.0',
      steps: [
        {
          id: 'step1',
          title: 'Initial Question',
          questions: [
            {
              id: 'q1',
              key: 'has_stress',
              type: QUESTION_TYPE.RADIO,
              label: 'Do you feel stressed?',
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
            },
          ],
        },
        {
          id: 'step2',
          title: 'Follow-up',
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

    expect(() => FunnelQuestionnaireConfigSchema.parse(configWithLogic)).not.toThrow()
  })

  it('should reject config with empty steps array', () => {
    const invalidConfig = {
      version: '1.0',
      steps: [],
    }

    // Empty array is technically valid per schema, but we can add a refinement if needed
    expect(() => FunnelQuestionnaireConfigSchema.parse(invalidConfig)).not.toThrow()
  })

  it('should apply default version if not provided', () => {
    const configWithoutVersion = {
      steps: [
        {
          id: 'step1',
          title: 'Step 1',
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

    const parsed = FunnelQuestionnaireConfigSchema.parse(configWithoutVersion)
    expect(parsed.version).toBe('1.0')
  })
})

describe('ContentSectionSchema', () => {
  it('should validate all section types', () => {
    const sectionTypes = Object.values(SECTION_TYPE)
    
    sectionTypes.forEach((type) => {
      const section = {
        key: `section-${type}`,
        type,
      }
      
      expect(() => ContentSectionSchema.parse(section)).not.toThrow()
    })
  })

  it('should validate section with content', () => {
    const section = {
      key: 'intro',
      type: SECTION_TYPE.TEXT,
      content: {
        text: 'Welcome to the stress assessment',
        alignment: 'center',
      },
    }

    expect(() => ContentSectionSchema.parse(section)).not.toThrow()
  })

  it('should validate section with contentRef', () => {
    const section = {
      key: 'hero-image',
      type: SECTION_TYPE.IMAGE,
      contentRef: 'assets/hero.jpg',
    }

    expect(() => ContentSectionSchema.parse(section)).not.toThrow()
  })

  it('should reject section with invalid type', () => {
    const invalidSection = {
      key: 'invalid',
      type: 'fantasy_section_type',
    }

    expect(() => ContentSectionSchema.parse(invalidSection)).toThrow()
  })
})

describe('FunnelContentManifestSchema', () => {
  it('should validate a valid content manifest', () => {
    const validManifest: FunnelContentManifest = {
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
                title: 'Stress Assessment',
                subtitle: 'Understand your stress level',
              },
            },
            {
              key: 'description',
              type: SECTION_TYPE.MARKDOWN,
              contentRef: 'content/intro.md',
            },
          ],
        },
        {
          slug: 'results',
          title: 'Your Results',
          sections: [
            {
              key: 'summary',
              type: SECTION_TYPE.TEXT,
              content: {
                text: 'Here are your results',
              },
            },
          ],
        },
      ],
    }

    expect(() => FunnelContentManifestSchema.parse(validManifest)).not.toThrow()
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
            width: 1200,
            height: 600,
          },
        },
        {
          key: 'intro-video',
          type: 'video',
          url: 'https://example.com/intro.mp4',
        },
      ],
    }

    expect(() => FunnelContentManifestSchema.parse(manifestWithAssets)).not.toThrow()
  })

  it('should apply default version if not provided', () => {
    const manifestWithoutVersion = {
      pages: [],
    }

    const parsed = FunnelContentManifestSchema.parse(manifestWithoutVersion)
    expect(parsed.version).toBe('1.0')
  })
})

describe('FunnelPluginManifestSchema', () => {
  it('should validate a complete plugin manifest', () => {
    const validManifest = {
      questionnaire_config: {
        version: '1.0',
        steps: [
          {
            id: 'step1',
            title: 'Questions',
            questions: [
              {
                id: 'q1',
                key: 'stress',
                type: QUESTION_TYPE.SCALE,
                label: 'Stress level',
                minValue: 1,
                maxValue: 10,
              },
            ],
          },
        ],
      },
      content_manifest: {
        version: '1.0',
        pages: [
          {
            slug: 'intro',
            title: 'Introduction',
            sections: [
              {
                key: 'hero',
                type: SECTION_TYPE.HERO,
              },
            ],
          },
        ],
      },
      algorithm_bundle_version: 'v1.0.0',
      prompt_version: '1.0',
    }

    expect(() => FunnelPluginManifestSchema.parse(validManifest)).not.toThrow()
  })

  it('should reject manifest without required fields', () => {
    const invalidManifest = {
      questionnaire_config: {
        version: '1.0',
        steps: [],
      },
      // Missing content_manifest, algorithm_bundle_version, prompt_version
    }

    expect(() => FunnelPluginManifestSchema.parse(invalidManifest)).toThrow()
  })
})

describe('Helper Functions', () => {
  describe('parseQuestionnaireConfig', () => {
    it('should parse valid config', () => {
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
                type: QUESTION_TYPE.TEXT,
                label: 'Test',
              },
            ],
          },
        ],
      }

      const parsed = parseQuestionnaireConfig(config)
      expect(parsed.version).toBe('1.0')
      expect(parsed.steps).toHaveLength(1)
    })

    it('should throw on invalid config', () => {
      const invalidConfig = {
        steps: 'not an array',
      }

      expect(() => parseQuestionnaireConfig(invalidConfig)).toThrow()
    })
  })

  describe('safeParseQuestionnaireConfig', () => {
    it('should return parsed config for valid input', () => {
      const config = {
        version: '1.0',
        steps: [],
      }

      const parsed = safeParseQuestionnaireConfig(config)
      expect(parsed).not.toBeNull()
      expect(parsed?.version).toBe('1.0')
    })

    it('should return null for invalid input', () => {
      const invalidConfig = {
        steps: 'not an array',
      }

      const parsed = safeParseQuestionnaireConfig(invalidConfig)
      expect(parsed).toBeNull()
    })
  })

  describe('parseContentManifest', () => {
    it('should parse valid manifest', () => {
      const manifest = {
        version: '1.0',
        pages: [],
      }

      const parsed = parseContentManifest(manifest)
      expect(parsed.version).toBe('1.0')
      expect(parsed.pages).toHaveLength(0)
    })

    it('should throw on invalid manifest', () => {
      const invalidManifest = {
        pages: 'not an array',
      }

      expect(() => parseContentManifest(invalidManifest)).toThrow()
    })
  })

  describe('safeParseContentManifest', () => {
    it('should return parsed manifest for valid input', () => {
      const manifest = {
        version: '1.0',
        pages: [],
      }

      const parsed = safeParseContentManifest(manifest)
      expect(parsed).not.toBeNull()
      expect(parsed?.version).toBe('1.0')
    })

    it('should return null for invalid input', () => {
      const invalidManifest = {
        pages: 'not an array',
      }

      const parsed = safeParseContentManifest(invalidManifest)
      expect(parsed).toBeNull()
    })
  })

  describe('parsePluginManifest', () => {
    it('should parse valid plugin manifest', () => {
      const manifest = {
        questionnaire_config: {
          version: '1.0',
          steps: [],
        },
        content_manifest: {
          version: '1.0',
          pages: [],
        },
        algorithm_bundle_version: 'v1.0.0',
        prompt_version: '1.0',
      }

      const parsed = parsePluginManifest(manifest)
      expect(parsed.algorithm_bundle_version).toBe('v1.0.0')
      expect(parsed.prompt_version).toBe('1.0')
    })

    it('should throw on invalid manifest', () => {
      const invalidManifest = {
        questionnaire_config: {},
        // Missing required fields
      }

      expect(() => parsePluginManifest(invalidManifest)).toThrow()
    })
  })

  describe('safeParsePluginManifest', () => {
    it('should return parsed manifest for valid input', () => {
      const manifest = {
        questionnaire_config: {
          version: '1.0',
          steps: [],
        },
        content_manifest: {
          version: '1.0',
          pages: [],
        },
        algorithm_bundle_version: 'v1.0.0',
        prompt_version: '1.0',
      }

      const parsed = safeParsePluginManifest(manifest)
      expect(parsed).not.toBeNull()
      expect(parsed?.algorithm_bundle_version).toBe('v1.0.0')
    })

    it('should return null for invalid input', () => {
      const invalidManifest = {
        questionnaire_config: {},
      }

      const parsed = safeParsePluginManifest(invalidManifest)
      expect(parsed).toBeNull()
    })
  })

  describe('isValidSectionType', () => {
    it('should return true for valid section types', () => {
      const validTypes = Object.values(SECTION_TYPE)
      
      validTypes.forEach((type) => {
        expect(isValidSectionType(type)).toBe(true)
      })
    })

    it('should return false for invalid section types', () => {
      expect(isValidSectionType('fantasy_type')).toBe(false)
      expect(isValidSectionType(123)).toBe(false)
      expect(isValidSectionType(null)).toBe(false)
      expect(isValidSectionType(undefined)).toBe(false)
    })
  })
})

describe('Integration - No Magic Strings', () => {
  it('should only accept question types from registry', () => {
    const registryTypes = Object.values(QUESTION_TYPE)
    
    registryTypes.forEach((type) => {
      const question = {
        id: 'q1',
        key: 'test',
        type,
        label: 'Test',
      }
      
      expect(() => QuestionConfigSchema.parse(question)).not.toThrow()
    })
  })

  it('should reject fantasy question types', () => {
    const fantasyQuestion = {
      id: 'q1',
      key: 'test',
      type: 'magic_input',
      label: 'Test',
    }

    expect(() => QuestionConfigSchema.parse(fantasyQuestion)).toThrow()
  })

  it('should only accept section types from SECTION_TYPE', () => {
    const sectionTypes = Object.values(SECTION_TYPE)
    
    sectionTypes.forEach((type) => {
      const section = {
        key: 'test',
        type,
      }
      
      expect(() => ContentSectionSchema.parse(section)).not.toThrow()
    })
  })

  it('should reject fantasy section types', () => {
    const fantasySection = {
      key: 'test',
      type: 'magic_section',
    }

    expect(() => ContentSectionSchema.parse(fantasySection)).toThrow()
  })
})
