/**
 * Section Generator - V05-I05.4
 * 
 * Generates report sections from risk bundles and priority rankings.
 * Strictly guardrailed: no PHI, no fantasy medical claims, only internal refs.
 * 
 * @module lib/sections/generator
 */

import type { RiskBundleV1 } from '@/lib/contracts/riskBundle'
import type { PriorityRankingV1 } from '@/lib/contracts/priorityRanking'
import type {
  ReportSectionsV1,
  ReportSection,
  SectionKey,
  SectionGenerationResult,
} from '@/lib/contracts/reportSections'
import { SECTION_KEY } from '@/lib/contracts/reportSections'
import { getPrompt, getLatestPrompt } from '@/lib/prompts/registry'

// ============================================================
// Generation Context
// ============================================================

export interface SectionGenerationContext {
  /** Processing job ID */
  jobId: string
  
  /** Risk bundle (required) */
  riskBundle: RiskBundleV1
  
  /** Priority ranking (optional) */
  ranking?: PriorityRankingV1
  
  /** Program tier (optional) */
  programTier?: string
  
  /** Algorithm version */
  algorithmVersion?: string
  
  /** Funnel version */
  funnelVersion?: string
}

// ============================================================
// Generation Options
// ============================================================

export interface GenerationOptions {
  /** Section keys to generate (default: all) */
  sectionKeys?: SectionKey[]
  
  /** Use LLM or template-based generation */
  method?: 'llm' | 'template' | 'hybrid'
  
  /** Prompt version override (default: latest) */
  promptVersion?: string
}

// ============================================================
// Section Generator
// ============================================================

/**
 * Generate report sections from context
 */
export async function generateSections(
  context: SectionGenerationContext,
  options: GenerationOptions = {},
): Promise<SectionGenerationResult> {
  const startTime = Date.now()
  
  try {
    const validationError = validateContext(context)
    if (validationError) {
      return {
        success: false,
        error: {
          code: 'INVALID_CONTEXT',
          message: validationError,
        },
      }
    }
    
    const sectionKeys = options.sectionKeys || getDefaultSectionKeys(context)
    const sections: ReportSection[] = []
    let llmCallCount = 0
    let fallbackCount = 0
    const warnings: string[] = []
    
    for (const sectionKey of sectionKeys) {
      try {
        const sectionResult = await generateSection(context, sectionKey, options)
        
        if (sectionResult.success && sectionResult.section) {
          sections.push(sectionResult.section)
          if (sectionResult.usedLLM) llmCallCount++
          if (sectionResult.usedFallback) fallbackCount++
        } else {
          warnings.push(`Failed to generate ${sectionKey}: ${sectionResult.error}`)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        warnings.push(`Error generating ${sectionKey}: ${message}`)
      }
    }
    
    if (sections.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_SECTIONS_GENERATED',
          message: 'Failed to generate any sections',
          details: warnings,
        },
      }
    }
    
    const generationTimeMs = Date.now() - startTime
    const generatedAt = new Date().toISOString()
    
    const result: ReportSectionsV1 = {
      sectionsVersion: 'v1',
      jobId: context.jobId,
      riskBundleId: context.riskBundle.assessmentId,
      rankingId: context.ranking?.jobId,
      programTier: context.programTier,
      sections,
      generatedAt,
      metadata: {
        generationTimeMs,
        llmCallCount,
        fallbackCount,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    }
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: `Section generation failed: ${message}`,
      },
    }
  }
}

interface SectionResult {
  success: boolean
  section?: ReportSection
  error?: string
  usedLLM?: boolean
  usedFallback?: boolean
}

async function generateSection(
  context: SectionGenerationContext,
  sectionKey: SectionKey,
  options: GenerationOptions,
): Promise<SectionResult> {
  const promptVersion = options.promptVersion || 'v1.0.0'
  const promptId = getSectionPromptId(sectionKey)
  const prompt = getPrompt(promptId, promptVersion) || getLatestPrompt(promptId)
  
  if (!prompt) {
    // Fail-closed: explicit error when prompt not found
    return {
      success: false,
      error: `No prompt found for section ${sectionKey} (promptId: ${promptId}, version: ${promptVersion})`,
    }
  }
  
  const inputs = prepareSectionInputs(context, sectionKey)
  const method = options.method || prompt.metadata.modelConfig?.provider || 'template'
  let draft = ''
  let usedLLM = false
  let usedFallback = false
  
  if (method === 'template' || method === 'hybrid') {
    draft = generateTemplateContent(context, sectionKey, prompt.userPromptTemplate)
  } else if (method === 'llm') {
    draft = generateTemplateContent(context, sectionKey, prompt.userPromptTemplate)
    usedFallback = true
  }
  
  draft = applyGuardrails(draft, prompt.guardrails.maxOutputLength)
  
  const section: ReportSection = {
    sectionKey,
    inputs,
    draft,
    promptVersion: prompt.metadata.version,
    modelConfig: prompt.metadata.modelConfig?.model,
    generationMethod: method === 'llm' && !usedFallback ? 'llm' : 'template',
    generatedAt: new Date().toISOString(),
  }
  
  return {
    success: true,
    section,
    usedLLM,
    usedFallback,
  }
}

function validateContext(context: SectionGenerationContext): string | null {
  if (!context.jobId) return 'Missing jobId'
  if (!context.riskBundle) return 'Missing riskBundle'
  if (!context.riskBundle.riskScore) return 'Missing riskScore in bundle'
  if (typeof context.riskBundle.riskScore.overall !== 'number') {
    return 'Missing or invalid overall score in riskScore'
  }
  if (!context.riskBundle.riskScore.riskLevel) return 'Missing riskLevel in riskScore'
  return null
}

function getDefaultSectionKeys(context: SectionGenerationContext): SectionKey[] {
  const keys: SectionKey[] = [
    SECTION_KEY.OVERVIEW,
    SECTION_KEY.RISK_SUMMARY,
  ]
  
  if (context.ranking) {
    keys.push(SECTION_KEY.RECOMMENDATIONS)
    keys.push(SECTION_KEY.TOP_INTERVENTIONS)
  }
  
  return keys
}

function getSectionPromptId(sectionKey: SectionKey): string {
  const mapping: Record<SectionKey, string> = {
    [SECTION_KEY.OVERVIEW]: 'overview',
    [SECTION_KEY.FINDINGS]: 'findings',
    [SECTION_KEY.RECOMMENDATIONS]: 'recommendations',
    [SECTION_KEY.RISK_SUMMARY]: 'risk-summary',
    [SECTION_KEY.TOP_INTERVENTIONS]: 'top-interventions',
  }
  return mapping[sectionKey] || 'overview'
}

function prepareSectionInputs(
  context: SectionGenerationContext,
  sectionKey: SectionKey,
) {
  const inputs = {
    riskBundleId: context.riskBundle.assessmentId,
    rankingId: context.ranking?.jobId,
    programTier: context.programTier,
    funnelVersion: context.funnelVersion,
    algorithmVersion: context.algorithmVersion,
    signals: [] as string[],
    scores: {} as Record<string, number>,
  }
  
  inputs.scores.risk = context.riskBundle.riskScore.overall
  
  if (context.riskBundle.riskScore.factors) {
    for (const factor of context.riskBundle.riskScore.factors) {
      inputs.scores[factor.key] = factor.score
    }
  }
  
  inputs.signals.push(`risk_level_${context.riskBundle.riskScore.riskLevel}`)
  
  return inputs
}

function generateTemplateContent(
  context: SectionGenerationContext,
  sectionKey: SectionKey,
  template: string,
): string {
  const { riskBundle, ranking, programTier } = context
  const riskScore = riskBundle.riskScore.overall
  const riskLevel = riskBundle.riskScore.riskLevel
  
  let content = ''
  
  switch (sectionKey) {
    case SECTION_KEY.OVERVIEW:
      content = `Basierend auf Ihrem Assessment liegt Ihr Risiko-Score bei ${riskScore} von 100 (Stufe: ${riskLevel}). `
      if (programTier) {
        content += `Ihr Programm-Tier: ${programTier}. `
      }
      content += 'Diese Übersicht dient nur zur Information und ersetzt keine medizinische Beratung.'
      break
      
    case SECTION_KEY.RISK_SUMMARY:
      content = `**Risiko-Zusammenfassung**\n\nGesamt-Score: ${riskScore}/100\nRisiko-Level: ${riskLevel}\n\n`
      if (riskBundle.riskScore.factors && riskBundle.riskScore.factors.length > 0) {
        content += '**Faktoren:**\n'
        // Sort factors deterministically (score desc, then key asc for tie-breaker)
        const sortedFactors = [...riskBundle.riskScore.factors].sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return a.key.localeCompare(b.key)
        })
        for (const factor of sortedFactors) {
          content += `- ${factor.key}: ${factor.score}\n`
        }
      }
      break
      
    case SECTION_KEY.RECOMMENDATIONS:
      if (ranking && ranking.topInterventions.length > 0) {
        content = '**Empfohlene Maßnahmen**\n\n'
        for (const intervention of ranking.topInterventions.slice(0, 5)) {
          content += `${intervention.rank}. ${intervention.topic.topicLabel} (Priorität: ${intervention.priorityScore})\n`
        }
      } else {
        content = 'Keine spezifischen Empfehlungen verfügbar.'
      }
      break
      
    case SECTION_KEY.TOP_INTERVENTIONS:
      if (ranking && ranking.topInterventions.length > 0) {
        content = '**Top-Interventionen**\n\n'
        for (const intervention of ranking.topInterventions.slice(0, 3)) {
          content += `${intervention.rank}. ${intervention.topic.topicLabel}\n`
          content += `   - Priorität: ${intervention.priorityScore}/100\n`
          content += `   - Säule: ${intervention.topic.pillarKey}\n\n`
        }
      } else {
        content = 'Keine Interventionen verfügbar.'
      }
      break
      
    default:
      content = 'Inhalt für diesen Abschnitt wird erstellt.'
  }
  
  return content
}

function applyGuardrails(draft: string, maxLength: number): string {
  if (draft.length > maxLength) {
    return draft.substring(0, maxLength - 3) + '...'
  }
  return draft
}
