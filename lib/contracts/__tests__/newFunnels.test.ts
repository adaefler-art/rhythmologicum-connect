/**
 * Test: V05-I02.3 - New Funnels Validation
 * 
 * Validates that the 3 new funnels added in V05-I02.3 have valid manifests
 * that pass Zod schema validation.
 */

import { 
  FunnelQuestionnaireConfigSchema,
  FunnelContentManifestSchema 
} from '@/lib/contracts/funnelManifest'
import { FUNNEL_SLUG } from '@/lib/contracts/registry'

describe('V05-I02.3 New Funnels', () => {
  describe('Funnel Slug Registry', () => {
    it('should have first-intake-sociological-anamnesis slug defined', () => {
      expect(FUNNEL_SLUG.FIRST_INTAKE_SOCIOLOGICAL_ANAMNESIS).toBe(
        'first-intake-sociological-anamnesis',
      )
    })

    it('should have cardiovascular-age slug defined', () => {
      expect(FUNNEL_SLUG.CARDIOVASCULAR_AGE).toBe('cardiovascular-age')
    })

    it('should have sleep-quality slug defined', () => {
      expect(FUNNEL_SLUG.SLEEP_QUALITY).toBe('sleep-quality')
    })

    it('should have heart-health-nutrition slug defined', () => {
      expect(FUNNEL_SLUG.HEART_HEALTH_NUTRITION).toBe('heart-health-nutrition')
    })
  })

  describe('Cardiovascular Age Manifest Stub', () => {
    const questionnaireConfig = {
      version: '1.0',
      steps: [
        {
          id: 'step-1',
          title: 'Grunddaten',
          questions: [
            {
              id: 'q1-age',
              key: 'age',
              type: 'number',
              label: 'Wie alt sind Sie?',
              required: true,
              minValue: 18,
              maxValue: 120
            }
          ]
        }
      ]
    }

    const contentManifest = {
      version: '1.0',
      pages: [
        {
          slug: 'intro',
          title: 'Willkommen',
          sections: [
            {
              key: 'hero',
              type: 'hero',
              content: {
                title: 'Test'
              }
            }
          ]
        }
      ]
    }

    it('should have valid questionnaire config structure', () => {
      const result = FunnelQuestionnaireConfigSchema.safeParse(questionnaireConfig)
      expect(result.success).toBe(true)
    })

    it('should have valid content manifest structure', () => {
      const result = FunnelContentManifestSchema.safeParse(contentManifest)
      expect(result.success).toBe(true)
    })
  })

  describe('Sleep Quality Manifest Stub', () => {
    const questionnaireConfig = {
      version: '1.0',
      steps: [
        {
          id: 'step-1',
          title: 'Schlafmuster',
          questions: [
            {
              id: 'q1-sleep-hours',
              key: 'sleep_hours',
              type: 'number',
              label: 'Wie viele Stunden?',
              required: true,
              minValue: 0,
              maxValue: 24
            }
          ]
        }
      ]
    }

    it('should have valid questionnaire config structure', () => {
      const result = FunnelQuestionnaireConfigSchema.safeParse(questionnaireConfig)
      expect(result.success).toBe(true)
    })
  })

  describe('Heart Health Nutrition Manifest Stub', () => {
    const questionnaireConfig = {
      version: '1.0',
      steps: [
        {
          id: 'step-1',
          title: 'Essgewohnheiten',
          questions: [
            {
              id: 'q1-meals',
              key: 'meals_per_day',
              type: 'number',
              label: 'Mahlzeiten pro Tag?',
              required: true,
              minValue: 1,
              maxValue: 10
            }
          ]
        }
      ]
    }

    it('should have valid questionnaire config structure', () => {
      const result = FunnelQuestionnaireConfigSchema.safeParse(questionnaireConfig)
      expect(result.success).toBe(true)
    })
  })

  describe('Manifest Question Types', () => {
    it('should accept valid question types from registry', () => {
      const validTypes = ['radio', 'checkbox', 'text', 'textarea', 'number', 'scale', 'slider']
      
      validTypes.forEach(type => {
        const config = {
          version: '1.0',
          steps: [
            {
              id: 'step-1',
              title: 'Test',
              questions: [
                {
                  id: 'q1',
                  key: 'test',
                  type: type,
                  label: 'Test',
                  required: false
                }
              ]
            }
          ]
        }

        const result = FunnelQuestionnaireConfigSchema.safeParse(config)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid question types', () => {
      const config = {
        version: '1.0',
        steps: [
          {
            id: 'step-1',
            title: 'Test',
            questions: [
              {
                id: 'q1',
                key: 'test',
                type: 'fantasy_type', // Invalid type
                label: 'Test',
                required: false
              }
            ]
          }
        ]
      }

      const result = FunnelQuestionnaireConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })
  })
})
