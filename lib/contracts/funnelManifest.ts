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
import { isValidUrl } from '@/lib/utils/urlSecurity'

function normalizeQuestionType(value: unknown): unknown {
  if (typeof value !== 'string') return value

  const normalized = value.toLowerCase().trim()
  if (Object.values(QUESTION_TYPE).includes(normalized as QuestionType)) {
    return normalized
  }

  // Compatibility layer for older/looser DB values.
  // Keep this mapping narrow + deterministic so QuestionRenderer still receives only registry types.
  const aliases: Record<string, QuestionType> = {
    // single choice
    'single_choice': QUESTION_TYPE.RADIO,
    'single-choice': QUESTION_TYPE.RADIO,
    'select_one': QUESTION_TYPE.RADIO,
    'select-one': QUESTION_TYPE.RADIO,
    'multiple_choice': QUESTION_TYPE.RADIO,

    // multiple select
    'multi_choice': QUESTION_TYPE.CHECKBOX,
    'multi-choice': QUESTION_TYPE.CHECKBOX,
    'select_many': QUESTION_TYPE.CHECKBOX,
    'select-many': QUESTION_TYPE.CHECKBOX,
    'multiple_select': QUESTION_TYPE.CHECKBOX,
    'multiple-select': QUESTION_TYPE.CHECKBOX,

    // text
    'short_text': QUESTION_TYPE.TEXT,
    'short-text': QUESTION_TYPE.TEXT,
    'string': QUESTION_TYPE.TEXT,

    // textarea
    'long_text': QUESTION_TYPE.TEXTAREA,
    'long-text': QUESTION_TYPE.TEXTAREA,
    'paragraph': QUESTION_TYPE.TEXTAREA,

    // number
    'integer': QUESTION_TYPE.NUMBER,
    'float': QUESTION_TYPE.NUMBER,
    'decimal': QUESTION_TYPE.NUMBER,

    // scale/rating
    'likert': QUESTION_TYPE.SCALE,
    'likert_scale': QUESTION_TYPE.SCALE,
    'likert-scale': QUESTION_TYPE.SCALE,
    'rating': QUESTION_TYPE.SCALE,

    // slider/range
    'range': QUESTION_TYPE.SLIDER,
  }

  return aliases[normalized] ?? normalized
}

// IMPORTANT: keep this optional at the *object key* level.
// Using `.transform()` directly can turn it into a required key with `string | undefined`.
const nullableString = z
  .preprocess((value) => (value === null ? undefined : value), z.string().optional())
  .optional()

// ============================================================
// Questionnaire Config Schema
// ============================================================

/**
 * V05-I06.4 Security: Safe URL validator for Zod schemas
 * Rejects javascript:, data:, vbscript:, file: and other dangerous protocols
 */
const safeUrlValidator = z.string().refine(
  (url) => {
    // Empty/undefined is OK for optional fields
    if (!url || url.trim() === '') return true
    return isValidUrl(url, false)
  },
  {
    message: 'URL must use http:, https:, mailto:, tel:, or be a relative path. Dangerous protocols (javascript:, data:, vbscript:, file:) are not allowed.',
  }
)

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
  helpText: nullableString,
})

export type QuestionOption = z.infer<typeof QuestionOptionSchema>

/**
 * Individual question in questionnaire
 */
export const QuestionConfigSchema = z.object({
  id: z.string(),
  key: z.string(),
  type: z.preprocess(
    normalizeQuestionType,
    z.enum([
      QUESTION_TYPE.RADIO,
      QUESTION_TYPE.CHECKBOX,
      QUESTION_TYPE.TEXT,
      QUESTION_TYPE.TEXTAREA,
      QUESTION_TYPE.NUMBER,
      QUESTION_TYPE.SCALE,
      QUESTION_TYPE.SLIDER,
    ] as [QuestionType, ...QuestionType[]]),
  ),
  label: z.string(),
  helpText: nullableString,
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
 * 
 * V05-I06.2 Hardening: Added strict bounds and validation
 * V05-I06.4 Security: Added URL validation for content fields
 * - key: max 200 chars (prevent DoS)
 * - contentRef: max 2048 chars (URL/path length limit)
 * - orderIndex: non-negative integer (deterministic sorting)
 * - content.url, content.href: validated against dangerous protocols
 * - No unknown keys allowed (strict mode via .strict())
 */
export const ContentSectionSchema = z
  .object({
    key: z.string().min(1).max(200),
    type: z.enum([
      SECTION_TYPE.HERO,
      SECTION_TYPE.TEXT,
      SECTION_TYPE.IMAGE,
      SECTION_TYPE.VIDEO,
      SECTION_TYPE.MARKDOWN,
      SECTION_TYPE.CTA,
      SECTION_TYPE.DIVIDER,
    ] as [SectionType, ...SectionType[]]),
    contentRef: z.string().max(2048).optional(),
    content: z.record(z.string(), z.any()).optional(),
    orderIndex: z.number().int().nonnegative().optional(),
  })
  .strict()
  .refine(
    (section) => {
      // Validate URLs in content object for security
      if (!section.content) return true
      
      // Check href field (CTA blocks)
      if ('href' in section.content && typeof section.content.href === 'string') {
        if (!isValidUrl(section.content.href, false)) {
          return false
        }
      }
      
      // Check url field (Image, Video blocks)
      if ('url' in section.content && typeof section.content.url === 'string') {
        if (!isValidUrl(section.content.url, false)) {
          return false
        }
      }
      
      // Check backgroundImage field (Hero blocks)
      if ('backgroundImage' in section.content && typeof section.content.backgroundImage === 'string') {
        if (section.content.backgroundImage && !isValidUrl(section.content.backgroundImage, false)) {
          return false
        }
      }
      
      return true
    },
    {
      message: 'Content URLs must use safe protocols (http:, https:, mailto:, tel:, or relative paths). Dangerous protocols (javascript:, data:, vbscript:, file:) are not allowed.',
    }
  )

export type ContentSection = z.infer<typeof ContentSectionSchema>

/**
 * Content page definition
 * 
 * V05-I06.2 Hardening: Added strict bounds
 * - slug: max 200 chars, alphanumeric + hyphens
 * - title: max 500 chars
 * - description: max 2000 chars
 * - sections: max 100 sections per page
 * - No unknown keys allowed (strict mode)
 */
export const ContentPageSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    title: z.string().min(1).max(500),
    description: z.string().max(2000).optional(),
    sections: z.array(ContentSectionSchema).max(100),
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .strict()

export type ContentPage = z.infer<typeof ContentPageSchema>

/**
 * Complete content manifest
 * 
 * V05-I06.2 Hardening: Added strict bounds
 * - version: max 20 chars
 * - pages: max 50 pages per manifest
 * - assets: max 200 assets per manifest
 * - asset key: max 200 chars
 * - asset url: max 2048 chars
 * - No unknown keys allowed (strict mode)
 */
export const FunnelContentManifestSchema = z
  .object({
    version: z.string().max(20).default('1.0'),
    pages: z.array(ContentPageSchema).max(50),
    assets: z
      .array(
        z
          .object({
            key: z.string().min(1).max(200),
            type: z.enum(['image', 'video', 'audio', 'document']),
            url: safeUrlValidator.min(1).max(2048),
            metadata: z.record(z.string(), z.any()).optional(),
          })
          .strict(),
      )
      .max(200)
      .optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .strict()

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
