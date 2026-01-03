/**
 * Report Sections Contract - V05-I05.4
 * 
 * Defines the schema for modular, versioned report sections generated from
 * risk bundles and priority rankings. Sections are guardrailed to prevent
 * PHI exposure and fantasy medical claims.
 * 
 * @module lib/contracts/reportSections
 */

import { z } from 'zod'

// ============================================================
// Section Keys (Registry)
// ============================================================

/**
 * Valid section keys for report sections
 * Each section has a specific purpose and guardrails
 */
export const SECTION_KEY = {
  OVERVIEW: 'overview',
  FINDINGS: 'findings',
  RECOMMENDATIONS: 'recommendations',
  RISK_SUMMARY: 'risk_summary',
  TOP_INTERVENTIONS: 'top_interventions',
} as const

export type SectionKey = typeof SECTION_KEY[keyof typeof SECTION_KEY]

// Section key schema
export const SectionKeySchema = z.enum([
  SECTION_KEY.OVERVIEW,
  SECTION_KEY.FINDINGS,
  SECTION_KEY.RECOMMENDATIONS,
  SECTION_KEY.RISK_SUMMARY,
  SECTION_KEY.TOP_INTERVENTIONS,
])

// ============================================================
// Section Citation/Reference
// ============================================================

/**
 * Internal reference to source data (no external URLs)
 * Citations must only reference internal, allowlisted sources
 */
export const SectionCitationSchema = z.object({
  /** Reference type (internal only) */
  refType: z.enum(['risk_factor', 'intervention_topic', 'tier_guideline', 'internal_content']),
  
  /** Reference ID (UUID or canonical key) */
  refId: z.string().min(1).max(200),
  
  /** Optional human-readable label */
  refLabel: z.string().min(1).max(500).optional(),
})

export type SectionCitation = z.infer<typeof SectionCitationSchema>

// ============================================================
// Section Inputs
// ============================================================

/**
 * Inputs used to generate a section
 * Must be PHI-free: only derived codes/scores/IDs
 */
export const SectionInputsSchema = z.object({
  /** Risk bundle ID reference */
  riskBundleId: z.string().uuid().optional(),
  
  /** Priority ranking ID reference */
  rankingId: z.string().uuid().optional(),
  
  /** Program tier (if applicable) */
  programTier: z.string().min(1).max(100).optional(),
  
  /** Funnel version reference */
  funnelVersion: z.string().min(1).max(100).optional(),
  
  /** Algorithm version reference */
  algorithmVersion: z.string().min(1).max(100).optional(),
  
  /** Derived codes/signals only (no free text, no PHI) */
  signals: z.array(z.string().min(1).max(200)).optional(),
  
  /** Numeric scores only (no text) */
  scores: z.record(z.string(), z.number()).optional(),
})

export type SectionInputs = z.infer<typeof SectionInputsSchema>

// ============================================================
// Single Section
// ============================================================

/**
 * A single report section with metadata
 */
export const ReportSectionSchema = z.object({
  /** Section identifier (from registry) */
  sectionKey: SectionKeySchema,
  
  /** Inputs used to generate this section (PHI-free) */
  inputs: SectionInputsSchema,
  
  /** Generated draft content (markdown or plain text) */
  draft: z.string().min(0).max(10000), // Max 10k chars per section
  
  /** Internal citations/references only */
  citations: z.array(SectionCitationSchema).optional(),
  
  /** Prompt version used to generate this section */
  promptVersion: z.string().min(1).max(100),
  
  /** Model configuration reference (optional) */
  modelConfig: z.string().min(1).max(200).optional(),
  
  /** Generation method: llm or template */
  generationMethod: z.enum(['llm', 'template', 'hybrid']),
  
  /** Timestamp when section was generated */
  generatedAt: z.string().datetime(),
})

export type ReportSection = z.infer<typeof ReportSectionSchema>

// ============================================================
// Report Sections V1 (Complete Bundle)
// ============================================================

/**
 * Complete report sections for a processing job
 * Version: v1
 */
export const ReportSectionsV1Schema = z.object({
  /** Schema version */
  sectionsVersion: z.literal('v1'),
  
  /** Processing job ID reference */
  jobId: z.string().uuid(),
  
  /** Risk bundle ID reference */
  riskBundleId: z.string().uuid(),
  
  /** Priority ranking ID reference (optional) */
  rankingId: z.string().uuid().optional(),
  
  /** Program tier (if applicable) */
  programTier: z.string().min(1).max(100).optional(),
  
  /** Array of sections */
  sections: z.array(ReportSectionSchema).min(1).max(20),
  
  /** Overall generation timestamp */
  generatedAt: z.string().datetime(),
  
  /** Overall generation metadata */
  metadata: z.object({
    /** Total generation time in milliseconds */
    generationTimeMs: z.number().int().min(0).optional(),
    
    /** Number of LLM calls made */
    llmCallCount: z.number().int().min(0).optional(),
    
    /** Number of fallbacks used */
    fallbackCount: z.number().int().min(0).optional(),
    
    /** Any non-fatal warnings */
    warnings: z.array(z.string().max(500)).optional(),
  }).optional(),
})

export type ReportSectionsV1 = z.infer<typeof ReportSectionsV1Schema>

// ============================================================
// Generation Result
// ============================================================

/**
 * Result of section generation
 */
export const SectionGenerationResultSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: ReportSectionsV1Schema,
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string().min(1).max(100),
      message: z.string().min(1).max(1000),
      details: z.any().optional(),
    }),
  }),
])

export type SectionGenerationResult = z.infer<typeof SectionGenerationResultSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Type guard for successful generation result
 */
export function isSuccessResult(
  result: SectionGenerationResult,
): result is Extract<SectionGenerationResult, { success: true }> {
  return result.success === true
}

/**
 * Type guard for error generation result
 */
export function isErrorResult(
  result: SectionGenerationResult,
): result is Extract<SectionGenerationResult, { success: false }> {
  return result.success === false
}

/**
 * Validate report sections against schema
 */
export function validateReportSections(data: unknown): SectionGenerationResult {
  try {
    const validated = ReportSectionsV1Schema.parse(data)
    return {
      success: true,
      data: validated,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid report sections schema',
          details: error.errors,
        },
      }
    }
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown validation error',
      },
    }
  }
}

/**
 * Get section by key from report sections
 */
export function getSectionByKey(
  sections: ReportSectionsV1,
  key: SectionKey,
): ReportSection | undefined {
  return sections.sections.find((s) => s.sectionKey === key)
}

/**
 * Check if report sections contains a specific section key
 */
export function hasSection(sections: ReportSectionsV1, key: SectionKey): boolean {
  return sections.sections.some((s) => s.sectionKey === key)
}

/**
 * Get all section keys from report sections
 */
export function getSectionKeys(sections: ReportSectionsV1): SectionKey[] {
  return sections.sections.map((s) => s.sectionKey)
}
