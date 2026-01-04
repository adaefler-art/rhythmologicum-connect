/**
 * Safety Check Evaluator - V05-I05.6
 * 
 * AI-powered safety assessment of report sections using Anthropic Claude.
 * This is Medical Validation Layer 2, complementing Layer 1 rules-based validation.
 * 
 * Key guarantees:
 * - PHI-free: Only redacted content sent to LLM
 * - Versioned: Tracks prompt version used
 * - Guardrailed: Strict safety assessment only, no diagnoses
 * - Fail-closed: LLM unavailable → UNKNOWN + review required
 * - Auditable: Full structured output logged
 * 
 * @module lib/safety/evaluator
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import { getPrompt } from '@/lib/prompts/registry'
import type { ReportSectionsV1 } from '@/lib/contracts/reportSections'
import {
  SAFETY_ACTION,
  SAFETY_SEVERITY,
  SafetyCheckResultV1Schema,
  type SafetyCheckResultV1,
  type SafetyFinding,
  type SafetyCheckResult,
} from '@/lib/contracts/safetyCheck'

// ============================================================
// Types
// ============================================================

export interface SafetyEvaluationContext {
  /** Report sections to evaluate */
  sections: ReportSectionsV1
  
  /** Prompt version to use (default: latest) */
  promptVersion?: string
  
  /** Override model config */
  modelConfig?: {
    provider?: 'anthropic' | 'openai' | 'template'
    model?: string
    temperature?: number
    maxTokens?: number
  }
}

interface RedactedSectionContent {
  sectionKey: string
  draft: string
  promptVersion: string
  generationMethod: string
}

// ============================================================
// Anthropic Client
// ============================================================

const anthropicApiKey = env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_TOKEN
const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null

// ============================================================
// PHI Redaction
// ============================================================

/**
 * Redact PHI from section inputs before sending to LLM
 * Only keeps section keys, drafts, and metadata
 */
function redactSectionsForLLM(sections: ReportSectionsV1): RedactedSectionContent[] {
  return sections.sections.map((section) => ({
    sectionKey: section.sectionKey,
    draft: section.draft,
    promptVersion: section.promptVersion,
    generationMethod: section.generationMethod,
  }))
}

/**
 * Format redacted sections as text for LLM prompt
 */
function formatSectionsForPrompt(redacted: RedactedSectionContent[]): string {
  return redacted
    .map(
      (s) =>
        `### Section: ${s.sectionKey}\n` +
        `Generated via: ${s.generationMethod} (prompt ${s.promptVersion})\n\n` +
        `${s.draft}\n`,
    )
    .join('\n---\n\n')
}

// ============================================================
// LLM Execution
// ============================================================

/**
 * Call Anthropic API for safety assessment
 */
async function callAnthropicSafetyCheck(
  systemPrompt: string,
  userPrompt: string,
  modelConfig: { model: string; temperature: number; maxTokens: number },
): Promise<{ content: string; usage: { promptTokens: number; completionTokens: number } }> {
  if (!anthropic) {
    throw new Error('Anthropic API client not initialized (missing API key)')
  }

  const response = await anthropic.messages.create({
    model: modelConfig.model,
    max_tokens: modelConfig.maxTokens,
    temperature: modelConfig.temperature,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const contentBlock = response.content[0]
  if (contentBlock.type !== 'text') {
    throw new Error('Expected text response from Anthropic API')
  }

  return {
    content: contentBlock.text,
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
    },
  }
}

/**
 * Parse LLM response into structured findings
 */
function parseLLMResponse(content: string): {
  safetyScore: number
  overallSeverity: string
  recommendedAction: string
  findings: Array<{
    category: string
    severity: string
    sectionKey?: string
    reason: string
    suggestedAction: string
  }>
  summaryReasoning: string
} {
  // Try to extract JSON from response (may be wrapped in markdown code blocks)
  let jsonContent = content.trim()
  
  // Remove markdown code blocks if present
  const jsonMatch = jsonContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    jsonContent = jsonMatch[1]
  }
  
  const parsed = JSON.parse(jsonContent)
  
  return {
    safetyScore: parsed.safetyScore,
    overallSeverity: parsed.overallSeverity,
    recommendedAction: parsed.recommendedAction,
    findings: parsed.findings || [],
    summaryReasoning: parsed.summaryReasoning || '',
  }
}

// ============================================================
// Main Evaluation Function
// ============================================================

/**
 * Evaluate safety of report sections using AI
 * 
 * @param context - Evaluation context with sections and config
 * @returns SafetyCheckResult (success or error)
 */
export async function evaluateSafety(
  context: SafetyEvaluationContext,
): Promise<SafetyCheckResult> {
  const startTime = Date.now()
  
  try {
    // Load prompt template
    const promptVersion = context.promptVersion || 'v1.0.0'
    const promptTemplate = getPrompt('safety-check', promptVersion)
    
    if (!promptTemplate) {
      return {
        success: false,
        error: `Safety check prompt not found: safety-check-${promptVersion}`,
        code: 'PROMPT_NOT_FOUND',
      }
    }
    
    // Redact PHI from sections
    const redactedSections = redactSectionsForLLM(context.sections)
    const sectionsContent = formatSectionsForPrompt(redactedSections)
    
    // Extract context from sections
    const riskScore = context.sections.sections[0]?.inputs?.scores?.risk ?? 0
    const riskLevel = context.sections.sections[0]?.inputs?.signals?.[0] ?? 'unknown'
    const programTier = context.sections.programTier ?? 'unknown'
    
    // Build prompts
    const systemPrompt = promptTemplate.systemPrompt || ''
    const userPrompt = promptTemplate.userPromptTemplate
      .replace('{{sectionsContent}}', sectionsContent)
      .replace('{{riskScore}}', String(riskScore))
      .replace('{{riskLevel}}', riskLevel)
      .replace('{{programTier}}', programTier)
    
    // Model configuration
    const modelConfig = {
      model:
        context.modelConfig?.model ||
        promptTemplate.metadata.modelConfig?.model ||
        'claude-sonnet-4-5-20250929',
      temperature:
        context.modelConfig?.temperature ?? promptTemplate.metadata.modelConfig?.temperature ?? 0.0,
      maxTokens:
        context.modelConfig?.maxTokens ?? promptTemplate.metadata.modelConfig?.maxTokens ?? 4096,
    }
    
    // Call LLM (fail-closed on error)
    let llmResponse: { content: string; usage: { promptTokens: number; completionTokens: number } }
    try {
      llmResponse = await callAnthropicSafetyCheck(systemPrompt, userPrompt, modelConfig)
    } catch (error) {
      // Fail-closed: LLM unavailable → UNKNOWN + review required
      const evaluationTimeMs = Date.now() - startTime
      
      return {
        success: true,
        data: {
          safetyVersion: 'v1',
          jobId: context.sections.jobId,
          sectionsId: context.sections.jobId, // Using jobId as fallback
          promptVersion,
          modelConfig: {
            provider: 'anthropic',
            model: modelConfig.model,
            temperature: modelConfig.temperature,
            maxTokens: modelConfig.maxTokens,
          },
          safetyScore: 0,
          overallSeverity: SAFETY_SEVERITY.CRITICAL,
          recommendedAction: SAFETY_ACTION.UNKNOWN,
          findings: [
            {
              findingId: crypto.randomUUID(),
              category: 'other',
              severity: SAFETY_SEVERITY.CRITICAL,
              reason: `LLM safety check unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
              suggestedAction: SAFETY_ACTION.UNKNOWN,
              identifiedAt: new Date().toISOString(),
            },
          ],
          summaryReasoning: 'Safety check could not be completed. Manual review required.',
          evaluatedAt: new Date().toISOString(),
          metadata: {
            evaluationTimeMs,
            llmCallCount: 0,
            sectionsEvaluatedCount: redactedSections.length,
            fallbackUsed: true,
            warnings: [`LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          },
        },
      }
    }
    
    // Parse LLM response
    let parsedResponse: ReturnType<typeof parseLLMResponse>
    try {
      parsedResponse = parseLLMResponse(llmResponse.content)
    } catch (parseError) {
      // Failed to parse → UNKNOWN
      const evaluationTimeMs = Date.now() - startTime
      
      return {
        success: true,
        data: {
          safetyVersion: 'v1',
          jobId: context.sections.jobId,
          sectionsId: context.sections.jobId,
          promptVersion,
          modelConfig: {
            provider: 'anthropic',
            model: modelConfig.model,
            temperature: modelConfig.temperature,
            maxTokens: modelConfig.maxTokens,
          },
          safetyScore: 0,
          overallSeverity: SAFETY_SEVERITY.CRITICAL,
          recommendedAction: SAFETY_ACTION.UNKNOWN,
          findings: [
            {
              findingId: crypto.randomUUID(),
              category: 'other',
              severity: SAFETY_SEVERITY.CRITICAL,
              reason: 'Failed to parse LLM safety assessment response',
              suggestedAction: SAFETY_ACTION.UNKNOWN,
              context: {
                parseError:
                  parseError instanceof Error ? parseError.message : 'Unknown parse error',
              },
              identifiedAt: new Date().toISOString(),
            },
          ],
          summaryReasoning: 'Safety check response could not be parsed. Manual review required.',
          evaluatedAt: new Date().toISOString(),
          metadata: {
            evaluationTimeMs,
            llmCallCount: 1,
            sectionsEvaluatedCount: redactedSections.length,
            tokenUsage: {
              promptTokens: llmResponse.usage.promptTokens,
              completionTokens: llmResponse.usage.completionTokens,
              totalTokens:
                llmResponse.usage.promptTokens + llmResponse.usage.completionTokens,
            },
            fallbackUsed: true,
            warnings: [
              `Failed to parse LLM response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            ],
          },
        },
      }
    }
    
    // Convert findings to SafetyFinding format
    const findings: SafetyFinding[] = parsedResponse.findings.map((f) => ({
      findingId: crypto.randomUUID(),
      category: f.category as SafetyFinding['category'],
      severity: f.severity as SafetyFinding['severity'],
      sectionKey: f.sectionKey,
      reason: f.reason,
      suggestedAction: f.suggestedAction as SafetyFinding['suggestedAction'],
      identifiedAt: new Date().toISOString(),
    }))
    
    // Build final result
    const evaluationTimeMs = Date.now() - startTime
    
    const result: SafetyCheckResultV1 = {
      safetyVersion: 'v1',
      jobId: context.sections.jobId,
      sectionsId: context.sections.jobId,
      promptVersion,
      modelConfig: {
        provider: 'anthropic',
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
      },
      safetyScore: parsedResponse.safetyScore,
      overallSeverity: parsedResponse.overallSeverity as SafetyCheckResultV1['overallSeverity'],
      recommendedAction: parsedResponse.recommendedAction as SafetyCheckResultV1['recommendedAction'],
      findings,
      summaryReasoning: parsedResponse.summaryReasoning,
      evaluatedAt: new Date().toISOString(),
      metadata: {
        evaluationTimeMs,
        llmCallCount: 1,
        sectionsEvaluatedCount: redactedSections.length,
        tokenUsage: {
          promptTokens: llmResponse.usage.promptTokens,
          completionTokens: llmResponse.usage.completionTokens,
          totalTokens: llmResponse.usage.promptTokens + llmResponse.usage.completionTokens,
        },
        fallbackUsed: false,
      },
    }
    
    // Validate result against schema
    SafetyCheckResultV1Schema.parse(result)
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    // Unexpected error
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during safety evaluation',
      code: 'EVALUATION_ERROR',
    }
  }
}

/**
 * Convenience function to check if safety evaluation passed
 */
export function isSafetyCheckPassing(result: SafetyCheckResultV1): boolean {
  return result.recommendedAction === SAFETY_ACTION.PASS
}

/**
 * Convenience function to check if safety evaluation requires review
 */
export function requiresReview(result: SafetyCheckResultV1): boolean {
  return (
    result.recommendedAction === SAFETY_ACTION.BLOCK ||
    result.recommendedAction === SAFETY_ACTION.UNKNOWN
  )
}
