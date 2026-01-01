/**
 * Funnel Plugin Manifest Schemas (V05-I02.2)
 * 
 * This file defines the versioned "Plugin Manifest" structure for funnels.
 * All funnel versions store their configuration in JSONB fields validated by these schemas.
 * 
 * **NO MAGIC STRINGS**: All question types, section types, and step types come from registry.
 * 
 * Structure:
 * - FunnelQuestionnaireConfigSchema: Steps, questions, validation logic
 * - FunnelContentManifestSchema: Content pages, sections, assets
 * - Algorithm bundle version: String pointer to algorithm version
 * - Prompt version: String for content/report generation
 */

import { z } from 'zod'
import { NODE_TYPE, QUESTION_TYPE, type NodeType, type QuestionType } from './registry'

// ============================================================
// Questionnaire Config Schema
// ============================================================

/**
 * Validation rule for question
 */
export const QuestionValidationSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  message: z.string().optional(),
})

export type QuestionValidation = z.infer<typeof QuestionValidationSchema>

/**
 * Option for radio/checkbox questions
 */
export const QuestionOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  helpText: z.string().optional(),
})

export type QuestionOption = z.infer<typeof QuestionOptionSchema>

/**
 * Individual question in questionnaire
 */
export const QuestionConfigSchema = z.object({
  id: z.string(),
  key: z.string(),
  type: z.enum([
    QUESTION_TYPE.RADIO,
    QUESTION_TYPE.CHECKBOX,
    QUESTION_TYPE.TEXT,
    QUESTION_TYPE.TEXTAREA,
    QUESTION_TYPE.NUMBER,
    QUESTION_TYPE.SCALE,
    QUESTION_TYPE.SLIDER,
  ] as [QuestionType, ...QuestionType[]]),
  label: z.string(),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(QuestionOptionSchema).optional(),
  validation: QuestionValidationSchema.optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
})

export type QuestionConfig = z.infer<typeof QuestionConfigSchema>

/**
 * Conditional logic for step/question visibility
 */
export const ConditionalLogicSchema = z.object({
  type: z.enum(['show', 'hide', 'skip']),
  conditions: z.array(
    z.object({
      questionId: z.string(),
      operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn']),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    }),
  ),
  logic: z.enum(['and', 'or']).default('and'),
})

export type ConditionalLogic = z.infer<typeof ConditionalLogicSchema>

/**
 * Step in questionnaire flow
 */
export const QuestionnaireStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(QuestionConfigSchema),
  conditionalLogic: ConditionalLogicSchema.optional(),
})

export type QuestionnaireStep = z.infer<typeof QuestionnaireStepSchema>

/**
 * Complete questionnaire configuration
 */
export const FunnelQuestionnaireConfigSchema = z.object({
  version: z.string().default('1.0'),
  steps: z.array(QuestionnaireStepSchema),
  conditionalLogic: z.array(ConditionalLogicSchema).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type FunnelQuestionnaireConfig = z.infer<typeof FunnelQuestionnaireConfigSchema>

// ============================================================
// Content Manifest Schema
// ============================================================

/**
 * Section types for content pages
 * These are the allowed types for sections within content pages
 */
export const SECTION_TYPE = {
  HERO: 'hero',
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  MARKDOWN: 'markdown',
  CTA: 'cta',
  DIVIDER: 'divider',
} as const

export type SectionType = typeof SECTION_TYPE[keyof typeof SECTION_TYPE]

/**
 * Content section within a page
 */
export const ContentSectionSchema = z.object({
  key: z.string(),
  type: z.enum([
    SECTION_TYPE.HERO,
    SECTION_TYPE.TEXT,
    SECTION_TYPE.IMAGE,
    SECTION_TYPE.VIDEO,
    SECTION_TYPE.MARKDOWN,
    SECTION_TYPE.CTA,
    SECTION_TYPE.DIVIDER,
  ] as [SectionType, ...SectionType[]]),
  contentRef: z.string().optional(),
  content: z.record(z.string(), z.any()).optional(),
  orderIndex: z.number().optional(),
})

export type ContentSection = z.infer<typeof ContentSectionSchema>

/**
 * Content page definition
 */
export const ContentPageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  sections: z.array(ContentSectionSchema),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type ContentPage = z.infer<typeof ContentPageSchema>

/**
 * Complete content manifest
 */
export const FunnelContentManifestSchema = z.object({
  version: z.string().default('1.0'),
  pages: z.array(ContentPageSchema),
  assets: z
    .array(
      z.object({
        key: z.string(),
        type: z.enum(['image', 'video', 'audio', 'document']),
        url: z.string(),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    )
    .optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type FunnelContentManifest = z.infer<typeof FunnelContentManifestSchema>

// ============================================================
// Complete Plugin Manifest
// ============================================================

/**
 * Complete funnel plugin manifest
 * This represents all configuration data for a funnel version
 */
export const FunnelPluginManifestSchema = z.object({
  questionnaire_config: FunnelQuestionnaireConfigSchema,
  content_manifest: FunnelContentManifestSchema,
  algorithm_bundle_version: z.string(),
  prompt_version: z.string(),
})

export type FunnelPluginManifest = z.infer<typeof FunnelPluginManifestSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Type guard to check if a value is a valid section type
 */
export function isValidSectionType(value: unknown): value is SectionType {
  return typeof value === 'string' && Object.values(SECTION_TYPE).includes(value as SectionType)
}

/**
 * Validates and parses questionnaire config from JSONB
 * @throws ZodError if validation fails
 */
export function parseQuestionnaireConfig(
  json: unknown,
): FunnelQuestionnaireConfig {
  return FunnelQuestionnaireConfigSchema.parse(json)
}

/**
 * Safely parses questionnaire config with error handling
 * @returns Parsed config or null if invalid
 */
export function safeParseQuestionnaireConfig(
  json: unknown,
): FunnelQuestionnaireConfig | null {
  const result = FunnelQuestionnaireConfigSchema.safeParse(json)
  return result.success ? result.data : null
}

/**
 * Validates and parses content manifest from JSONB
 * @throws ZodError if validation fails
 */
export function parseContentManifest(json: unknown): FunnelContentManifest {
  return FunnelContentManifestSchema.parse(json)
}

/**
 * Safely parses content manifest with error handling
 * @returns Parsed manifest or null if invalid
 */
export function safeParseContentManifest(json: unknown): FunnelContentManifest | null {
  const result = FunnelContentManifestSchema.safeParse(json)
  return result.success ? result.data : null
}

/**
 * Validates and parses complete plugin manifest
 * @throws ZodError if validation fails
 */
export function parsePluginManifest(json: unknown): FunnelPluginManifest {
  return FunnelPluginManifestSchema.parse(json)
}

/**
 * Safely parses complete plugin manifest with error handling
 * @returns Parsed manifest or null if invalid
 */
export function safeParsePluginManifest(json: unknown): FunnelPluginManifest | null {
  const result = FunnelPluginManifestSchema.safeParse(json)
  return result.success ? result.data : null
}
