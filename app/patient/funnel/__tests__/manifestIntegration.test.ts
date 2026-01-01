/**
 * Integration Test for Manifest in Patient Flow
 * 
 * Tests that the stress funnel intro page loads and displays manifest data
 */

import { loadFunnelVersion, FunnelNotFoundError, validateQuestionnaireConfig, validateContentManifest } from '@/lib/funnels/loadFunnelVersion'
import { QUESTION_TYPE } from '@/lib/contracts/registry'
import { SECTION_TYPE } from '@/lib/contracts/funnelManifest'

// Mock Supabase for tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn((column: string, value: any) => {
          const chainable = {
            eq: jest.fn(() => chainable),
            single: jest.fn(() => {
              if (table === 'funnels_catalog') {
                return {
                  data: {
                    id: 'funnel-123',
                    slug: 'stress-assessment',
                    title: 'Stress Assessment',
                    pillar_id: 'mental-health',
                    description: 'Test funnel',
                    is_active: true,
                  },
                  error: null,
                }
              } else if (table === 'funnel_versions') {
                return {
                  data: {
                    id: 'version-123',
                    funnel_id: 'funnel-123',
                    version: '1.0.0',
                    questionnaire_config: {
                      version: '1.0',
                      steps: [
                        {
                          id: 'step-1',
                          title: 'Stress Level',
                          questions: [
                            {
                              id: 'q1',
                              key: 'stress_level',
                              type: QUESTION_TYPE.SCALE,
                              label: 'How stressed?',
                              required: true,
                              minValue: 1,
                              maxValue: 10,
                            },
                          ],
                        },
                        {
                          id: 'step-2',
                          title: 'Sleep Quality',
                          questions: [
                            {
                              id: 'q2',
                              key: 'sleep_quality',
                              type: QUESTION_TYPE.SCALE,
                              label: 'Sleep quality?',
                              required: true,
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
                          title: 'Welcome',
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
                    is_default: true,
                    rollout_percent: 100,
                    created_at: '2026-01-01T00:00:00Z',
                    updated_at: null,
                  },
                  error: null,
                }
              }
              return { data: null, error: { message: 'Not found' } }
            }),
          }
          return chainable
        }),
      })),
    })),
  })),
}))

// Set environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

describe('Manifest Integration - Stress Funnel', () => {
  it('should load stress-assessment manifest with valid structure', async () => {
    const funnelVersion = await loadFunnelVersion('stress-assessment')

    // Verify basic structure
    expect(funnelVersion).toBeDefined()
    expect(funnelVersion.version).toBe('1.0.0')
    expect(funnelVersion.funnelId).toBe('funnel-123')
    expect(funnelVersion.manifest).toBeDefined()
  })

  it('should have valid questionnaire_config with steps', async () => {
    const funnelVersion = await loadFunnelVersion('stress-assessment')
    const { questionnaire_config } = funnelVersion.manifest

    // Verify questionnaire config structure
    expect(questionnaire_config).toBeDefined()
    expect(questionnaire_config.version).toBe('1.0')
    expect(questionnaire_config.steps).toBeDefined()
    expect(Array.isArray(questionnaire_config.steps)).toBe(true)
    expect(questionnaire_config.steps).toHaveLength(2)

    // Each step should have required fields
    questionnaire_config.steps.forEach((step) => {
      expect(step.id).toBeDefined()
      expect(step.title).toBeDefined()
      expect(Array.isArray(step.questions)).toBe(true)
    })
  })

  it('should have valid content_manifest with pages', async () => {
    const funnelVersion = await loadFunnelVersion('stress-assessment')
    const { content_manifest } = funnelVersion.manifest

    // Verify content manifest structure
    expect(content_manifest).toBeDefined()
    expect(content_manifest.version).toBe('1.0')
    expect(content_manifest.pages).toBeDefined()
    expect(Array.isArray(content_manifest.pages)).toBe(true)
    expect(content_manifest.pages).toHaveLength(1)
  })

  it('should have algorithm_bundle_version and prompt_version', async () => {
    const funnelVersion = await loadFunnelVersion('stress-assessment')
    const { algorithm_bundle_version, prompt_version } = funnelVersion.manifest

    // Verify version fields are present
    expect(algorithm_bundle_version).toBe('v1.0.0')
    expect(typeof algorithm_bundle_version).toBe('string')
    expect(algorithm_bundle_version.length).toBeGreaterThan(0)

    expect(prompt_version).toBe('1.0')
    expect(typeof prompt_version).toBe('string')
    expect(prompt_version.length).toBeGreaterThan(0)
  })
})

describe('Manifest Data Structure for Patient Flow', () => {
  it('should provide data structure compatible with intro page', async () => {
    const funnelVersion = await loadFunnelVersion('stress-assessment')

    // Build the data structure used by intro page
    const manifestData = {
      version: funnelVersion.version,
      funnelId: funnelVersion.funnelId,
      algorithmVersion: funnelVersion.manifest.algorithm_bundle_version,
      promptVersion: funnelVersion.manifest.prompt_version,
      steps: funnelVersion.manifest.questionnaire_config.steps,
      contentPages: funnelVersion.manifest.content_manifest.pages,
    }

    // Verify all fields are present
    expect(manifestData.version).toBe('1.0.0')
    expect(manifestData.funnelId).toBe('funnel-123')
    expect(manifestData.algorithmVersion).toBe('v1.0.0')
    expect(manifestData.promptVersion).toBe('1.0')
    expect(Array.isArray(manifestData.steps)).toBe(true)
    expect(manifestData.steps).toHaveLength(2)
    expect(Array.isArray(manifestData.contentPages)).toBe(true)
    expect(manifestData.contentPages).toHaveLength(1)
  })

  it('should validate questionnaire config structure', () => {
    const validConfig = {
      version: '1.0',
      steps: [
        {
          id: 'step-1',
          title: 'Test Step',
          questions: [
            {
              id: 'q1',
              key: 'test',
              type: QUESTION_TYPE.SCALE,
              label: 'Test question',
              required: true,
              minValue: 1,
              maxValue: 10,
            },
          ],
        },
      ],
    }

    const validated = validateQuestionnaireConfig(validConfig)
    expect(validated).toBeDefined()
    expect(validated.steps).toHaveLength(1)
  })

  it('should validate content manifest structure', () => {
    const validManifest = {
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
    }

    const validated = validateContentManifest(validManifest)
    expect(validated).toBeDefined()
    expect(validated.pages).toHaveLength(1)
  })
})

