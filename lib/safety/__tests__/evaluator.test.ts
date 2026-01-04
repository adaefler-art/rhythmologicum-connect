/**
 * Safety Check Evaluator Tests - V05-I05.6
 */

import { SAFETY_ACTION, SAFETY_SEVERITY } from '@/lib/contracts/safetyCheck'
import type { ReportSectionsV1 } from '@/lib/contracts/reportSections'

// Create a shared mock for messages.create
const mockCreate = jest.fn()

// Mock env module first
jest.mock('@/lib/env', () => ({
  env: {
    ANTHROPIC_API_KEY: 'test-api-key',
    ANTHROPIC_API_TOKEN: undefined,
  },
}))

// Mock Anthropic SDK - return the same mock instance every time
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }))
})

// Import evaluator after mocks are set up
import { evaluateSafety, isSafetyCheckPassing, requiresReview } from '@/lib/safety/evaluator'

describe('Safety Check Evaluator', () => {
  const mockSections: ReportSectionsV1 = {
    sectionsVersion: 'v1',
    jobId: '323e4567-e89b-12d3-a456-426614174000',
    riskBundleId: '423e4567-e89b-12d3-a456-426614174000',
    programTier: 'tier-1-essential',
    sections: [
      {
        sectionKey: 'overview',
        inputs: {
          riskBundleId: '423e4567-e89b-12d3-a456-426614174000',
          programTier: 'tier-1-essential',
          signals: ['risk_level_moderate'],
          scores: { risk: 65 },
        },
        draft: 'Your risk assessment shows a moderate stress level (65/100). This is informational only and not a diagnosis.',
        promptVersion: 'v1.0.0',
        generationMethod: 'template',
        generatedAt: '2026-01-04T08:00:00.000Z',
      },
      {
        sectionKey: 'recommendations',
        inputs: {
          riskBundleId: '423e4567-e89b-12d3-a456-426614174000',
        },
        draft: 'Consider stress management techniques such as breathing exercises and regular physical activity.',
        promptVersion: 'v1.0.0',
        generationMethod: 'template',
        generatedAt: '2026-01-04T08:00:01.000Z',
      },
    ],
    generatedAt: '2026-01-04T08:00:02.000Z',
    metadata: {
      generationTimeMs: 150,
      llmCallCount: 0,
      fallbackCount: 0,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('evaluateSafety', () => {
    it('should successfully evaluate safe content', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              safetyScore: 95,
              overallSeverity: 'low',
              recommendedAction: 'PASS',
              findings: [
                {
                  category: 'tone_appropriateness',
                  severity: 'low',
                  sectionKey: 'overview',
                  reason: 'Could be slightly more empathetic',
                  suggestedAction: 'PASS',
                },
              ],
              summaryReasoning: 'Content is generally safe with minor tone improvements possible',
            }),
          },
        ],
        usage: {
          input_tokens: 500,
          output_tokens: 150,
        },
      })

      const result = await evaluateSafety({ sections: mockSections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.safetyScore).toBe(95)
        expect(result.data.recommendedAction).toBe(SAFETY_ACTION.PASS)
        expect(result.data.findings).toHaveLength(1)
        expect(result.data.metadata.fallbackUsed).toBe(false)
      }
    })

    it('should handle LLM response in markdown code block', async () => {
      const jsonResponse = {
        safetyScore: 90,
        overallSeverity: 'none',
        recommendedAction: 'PASS',
        findings: [],
        summaryReasoning: 'No safety concerns identified',
      }
      
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: '```json\n' + JSON.stringify(jsonResponse) + '\n```',
          },
        ],
        usage: {
          input_tokens: 500,
          output_tokens: 100,
        },
      })

      const result = await evaluateSafety({ sections: mockSections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.safetyScore).toBe(90)
        expect(result.data.recommendedAction).toBe(SAFETY_ACTION.PASS)
      }
    })

    it('should identify critical safety issues', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              safetyScore: 30,
              overallSeverity: 'critical',
              recommendedAction: 'BLOCK',
              findings: [
                {
                  category: 'contraindication',
                  severity: 'critical',
                  sectionKey: 'recommendations',
                  reason: 'Recommendation may contradict stated risk level',
                  suggestedAction: 'BLOCK',
                },
              ],
              summaryReasoning: 'Critical safety issue detected requiring immediate review',
            }),
          },
        ],
        usage: {
          input_tokens: 500,
          output_tokens: 200,
        },
      })

      const result = await evaluateSafety({ sections: mockSections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.safetyScore).toBe(30)
        expect(result.data.recommendedAction).toBe(SAFETY_ACTION.BLOCK)
        expect(result.data.findings).toHaveLength(1)
        expect(result.data.findings[0].severity).toBe(SAFETY_SEVERITY.CRITICAL)
      }
    })

    it('should fail-closed when LLM API call fails', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API rate limit exceeded'))

      const result = await evaluateSafety({ sections: mockSections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.recommendedAction).toBe(SAFETY_ACTION.UNKNOWN)
        expect(result.data.overallSeverity).toBe(SAFETY_SEVERITY.CRITICAL)
        expect(result.data.metadata.fallbackUsed).toBe(true)
        expect(result.data.findings).toHaveLength(1)
        expect(result.data.findings[0].reason).toContain('LLM safety check unavailable')
      }
    })

    it('should fail-closed when LLM response cannot be parsed', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON { invalid syntax',
          },
        ],
        usage: {
          input_tokens: 500,
          output_tokens: 50,
        },
      })

      const result = await evaluateSafety({ sections: mockSections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.recommendedAction).toBe(SAFETY_ACTION.UNKNOWN)
        expect(result.data.overallSeverity).toBe(SAFETY_SEVERITY.CRITICAL)
        expect(result.data.metadata.fallbackUsed).toBe(true)
        expect(result.data.findings).toHaveLength(1)
        expect(result.data.findings[0].reason).toContain('Failed to parse')
      }
    })

    it('should return error when prompt not found', async () => {
      const result = await evaluateSafety({
        sections: mockSections,
        promptVersion: 'v99.99.99',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Safety check prompt not found')
        expect(result.code).toBe('PROMPT_NOT_FOUND')
      }
    })

    it('should use provided model config', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              safetyScore: 100,
              overallSeverity: 'none',
              recommendedAction: 'PASS',
              findings: [],
              summaryReasoning: 'All clear',
            }),
          },
        ],
        usage: {
          input_tokens: 500,
          output_tokens: 100,
        },
      })

      const result = await evaluateSafety({
        sections: mockSections,
        modelConfig: {
          model: 'claude-opus-4-5-20250929',
          temperature: 0.5,
          maxTokens: 8192,
        },
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.modelConfig?.model).toBe('claude-opus-4-5-20250929')
        expect(result.data.modelConfig?.temperature).toBe(0.5)
        expect(result.data.modelConfig?.maxTokens).toBe(8192)
      }
    })

    it('should record token usage in metadata', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              safetyScore: 85,
              overallSeverity: 'low',
              recommendedAction: 'PASS',
              findings: [],
              summaryReasoning: 'Content is safe',
            }),
          },
        ],
        usage: {
          input_tokens: 1234,
          output_tokens: 567,
        },
      })

      const result = await evaluateSafety({ sections: mockSections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata.tokenUsage?.promptTokens).toBe(1234)
        expect(result.data.metadata.tokenUsage?.completionTokens).toBe(567)
        expect(result.data.metadata.tokenUsage?.totalTokens).toBe(1801)
        expect(result.data.metadata.llmCallCount).toBe(1)
      }
    })

    it('should validate result against schema', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              safetyScore: 75,
              overallSeverity: 'medium',
              recommendedAction: 'FLAG',
              findings: [
                {
                  category: 'consistency',
                  severity: 'medium',
                  sectionKey: 'overview',
                  reason: 'Some inconsistent terminology',
                  suggestedAction: 'FLAG',
                },
              ],
              summaryReasoning: 'Minor consistency issues noted',
            }),
          },
        ],
        usage: {
          input_tokens: 500,
          output_tokens: 150,
        },
      })

      const result = await evaluateSafety({ sections: mockSections })

      expect(result.success).toBe(true)
      if (result.success) {
        // Schema validation happens internally - if it passes, result structure is valid
        expect(result.data.safetyVersion).toBe('v1')
        expect(result.data.jobId).toBe(mockSections.jobId)
        expect(result.data.sectionsId).toBeDefined()
        expect(result.data.promptVersion).toBe('v1.0.0')
        expect(result.data.evaluatedAt).toBeDefined()
      }
    })
  })

  describe('isSafetyCheckPassing', () => {
    it('should return true for PASS action', () => {
      const result: any = {
        recommendedAction: SAFETY_ACTION.PASS,
      }
      expect(isSafetyCheckPassing(result)).toBe(true)
    })

    it('should return false for FLAG action', () => {
      const result: any = {
        recommendedAction: SAFETY_ACTION.FLAG,
      }
      expect(isSafetyCheckPassing(result)).toBe(false)
    })

    it('should return false for BLOCK action', () => {
      const result: any = {
        recommendedAction: SAFETY_ACTION.BLOCK,
      }
      expect(isSafetyCheckPassing(result)).toBe(false)
    })

    it('should return false for UNKNOWN action', () => {
      const result: any = {
        recommendedAction: SAFETY_ACTION.UNKNOWN,
      }
      expect(isSafetyCheckPassing(result)).toBe(false)
    })
  })

  describe('requiresReview', () => {
    it('should return true for BLOCK action', () => {
      const result: any = {
        recommendedAction: SAFETY_ACTION.BLOCK,
      }
      expect(requiresReview(result)).toBe(true)
    })

    it('should return true for UNKNOWN action', () => {
      const result: any = {
        recommendedAction: SAFETY_ACTION.UNKNOWN,
      }
      expect(requiresReview(result)).toBe(true)
    })

    it('should return false for PASS action', () => {
      const result: any = {
        recommendedAction: SAFETY_ACTION.PASS,
      }
      expect(requiresReview(result)).toBe(false)
    })

    it('should return false for FLAG action', () => {
      const result: any = {
        recommendedAction: SAFETY_ACTION.FLAG,
      }
      expect(requiresReview(result)).toBe(false)
    })
  })
})
