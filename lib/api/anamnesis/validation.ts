/**
 * E75.2: Anamnesis Entry Validation Utilities
 * 
 * Provides validation for anamnesis entries including:
 * - Entry type validation
 * - JSONB content schema validation
 * - Size limits for JSONB fields
 */

import { z } from 'zod'

/**
 * Valid entry types for anamnesis entries
 * Must match database CHECK constraint
 */
export const ENTRY_TYPES = [
  'medical_history',
  'symptoms',
  'medications',
  'allergies',
  'family_history',
  'lifestyle',
  'intake',
  'funnel_summary',
  'other',
] as const

export type EntryType = (typeof ENTRY_TYPES)[number]

/**
 * Maximum size for JSONB content field (in bytes)
 * Conservative limit to prevent excessive storage and performance issues
 */
export const MAX_JSONB_SIZE_BYTES = 1024 * 1024 // 1MB

export const MAX_INTAKE_NARRATIVE_LENGTH = 4000
export const MAX_INTAKE_CHIEF_COMPLAINT_LENGTH = 200
export const MAX_INTAKE_EVIDENCE_ITEMS = 20
export const MAX_INTAKE_EVIDENCE_REF_LENGTH = 200
export const MAX_INTAKE_OPEN_QUESTIONS = 10
export const MAX_INTAKE_OPEN_QUESTION_LENGTH = 200
export const MAX_INTAKE_RED_FLAGS = 10
export const MAX_INTAKE_RED_FLAG_LENGTH = 200
export const MAX_INTAKE_TIMELINE_ITEM_LENGTH = 200
export const MAX_INTAKE_KEY_SYMPTOMS = 10
export const MAX_INTAKE_KEY_SYMPTOM_LENGTH = 120
export const MIN_INTAKE_SHORT_SUMMARY_ITEMS = 5
export const MAX_INTAKE_SHORT_SUMMARY_ITEMS = 7
export const MAX_INTAKE_SHORT_SUMMARY_LENGTH = 200
export const MAX_INTAKE_RELEVANT_NEGATIVES = 5
export const MAX_INTAKE_MED_ITEMS = 10
export const MAX_INTAKE_RELEVANT_NEGATIVE_LENGTH = 200
export const MAX_INTAKE_MED_LENGTH = 200
export const MAX_INTAKE_INTERPRETED_OPEN_QUESTIONS = 5
export const MAX_INTAKE_INTERPRETED_OPEN_QUESTION_LENGTH = 200
export const MAX_INTAKE_RED_FLAG_ITEMS = 5

export const interpretedClinicalSummaryObjectSchema = z.object({
  short_summary: z
    .array(z.string().max(MAX_INTAKE_SHORT_SUMMARY_LENGTH, 'Short summary item is too long'))
    .min(MIN_INTAKE_SHORT_SUMMARY_ITEMS, 'Too few short summary items')
    .max(MAX_INTAKE_SHORT_SUMMARY_ITEMS, 'Too many short summary items')
    .default([]),
  narrative_history: z
    .string()
    .max(MAX_INTAKE_NARRATIVE_LENGTH, 'Narrative history is too long')
    .default(''),
  open_questions: z
    .array(
      z
        .string()
        .max(MAX_INTAKE_INTERPRETED_OPEN_QUESTION_LENGTH, 'Open question is too long'),
    )
    .max(MAX_INTAKE_INTERPRETED_OPEN_QUESTIONS, 'Too many open questions')
    .default([]),
  relevant_negatives: z
    .array(
      z
        .string()
        .max(MAX_INTAKE_RELEVANT_NEGATIVE_LENGTH, 'Relevant negative is too long'),
    )
    .max(MAX_INTAKE_RELEVANT_NEGATIVES, 'Too many relevant negatives')
    .default([]),
  meds: z
    .array(z.string().max(MAX_INTAKE_MED_LENGTH, 'Medication entry is too long'))
    .max(MAX_INTAKE_MED_ITEMS, 'Too many medications')
    .default([]),
  red_flags: z
    .object({
      present: z.boolean().default(false),
      items: z
        .array(z.string().max(MAX_INTAKE_RED_FLAG_LENGTH, 'Red flag item is too long'))
        .max(MAX_INTAKE_RED_FLAG_ITEMS, 'Too many red flag items')
        .default([]),
    })
    .default({ present: false, items: [] }),
})

export const interpretedClinicalSummarySchema = interpretedClinicalSummaryObjectSchema.optional()

const structuredIntakeDataSchema = z
  .object({
    chief_complaint: z
      .string()
      .max(MAX_INTAKE_CHIEF_COMPLAINT_LENGTH, 'Chief complaint is too long')
      .optional()
      .default(''),
    narrative_summary: z
      .string()
      .max(MAX_INTAKE_NARRATIVE_LENGTH, 'Narrative summary is too long')
      .optional()
      .default(''),
    structured: z
      .object({
        timeline: z
          .array(z.string().max(MAX_INTAKE_TIMELINE_ITEM_LENGTH, 'Timeline item is too long'))
          .optional()
          .default([]),
        key_symptoms: z
          .array(z.string().max(MAX_INTAKE_KEY_SYMPTOM_LENGTH, 'Key symptom is too long'))
          .max(MAX_INTAKE_KEY_SYMPTOMS, 'Too many key symptoms')
          .optional()
          .default([]),
      })
      .optional()
      .default({ timeline: [], key_symptoms: [] }),
    red_flags: z
      .array(z.string().max(MAX_INTAKE_RED_FLAG_LENGTH, 'Red flag is too long'))
      .max(MAX_INTAKE_RED_FLAGS, 'Too many red flags')
      .optional()
      .default([]),
    open_questions: z
      .array(z.string().max(MAX_INTAKE_OPEN_QUESTION_LENGTH, 'Open question is too long'))
      .max(MAX_INTAKE_OPEN_QUESTIONS, 'Too many open questions')
      .optional()
      .default([]),
    evidence_refs: z
      .array(z.string().max(MAX_INTAKE_EVIDENCE_REF_LENGTH, 'Evidence ref is too long'))
      .max(MAX_INTAKE_EVIDENCE_ITEMS, 'Too many evidence refs')
      .optional()
      .default([]),
  })
  .optional()

const intakeContentSchema = z.object({
  status: z.string().min(1, 'Status is required').max(40, 'Status is too long'),
  interpreted_clinical_summary: interpretedClinicalSummarySchema,
  structured_intake_data: structuredIntakeDataSchema,
  chiefComplaint: z
    .string()
    .max(MAX_INTAKE_CHIEF_COMPLAINT_LENGTH, 'Chief complaint is too long')
    .optional()
    .default(''),
  narrativeSummary: z
    .string()
    .max(MAX_INTAKE_NARRATIVE_LENGTH, 'Narrative summary is too long')
    .optional()
    .default(''),
  structured: z
    .object({
      timeline: z
        .array(z.string().max(MAX_INTAKE_TIMELINE_ITEM_LENGTH, 'Timeline item is too long'))
        .optional()
        .default([]),
      keySymptoms: z
        .array(z.string().max(MAX_INTAKE_KEY_SYMPTOM_LENGTH, 'Key symptom is too long'))
        .max(MAX_INTAKE_KEY_SYMPTOMS, 'Too many key symptoms')
        .optional()
        .default([]),
    })
    .optional()
    .default({ timeline: [], keySymptoms: [] }),
  redFlags: z
    .array(z.string().max(MAX_INTAKE_RED_FLAG_LENGTH, 'Red flag is too long'))
    .max(MAX_INTAKE_RED_FLAGS, 'Too many red flags')
    .optional()
    .default([]),
  openQuestions: z
    .array(z.string().max(MAX_INTAKE_OPEN_QUESTION_LENGTH, 'Open question is too long'))
    .max(MAX_INTAKE_OPEN_QUESTIONS, 'Too many open questions')
    .optional()
    .default([]),
  evidenceRefs: z
    .array(z.string().max(MAX_INTAKE_EVIDENCE_REF_LENGTH, 'Evidence ref is too long'))
    .max(MAX_INTAKE_EVIDENCE_ITEMS, 'Too many evidence refs')
    .optional()
    .default([]),
})

/**
 * Zod schema for anamnesis entry creation
 */
export const createAnamnesisEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or less'),
  content: z.record(z.string(), z.unknown()).default({}),
  entry_type: z.enum(ENTRY_TYPES).optional(),
  tags: z.array(z.string()).optional().default([]),
  change_reason: z.string().optional(),
})

/**
 * Zod schema for anamnesis entry version creation
 */
export const createVersionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or less'),
  content: z.record(z.string(), z.unknown()).default({}),
  entry_type: z.enum(ENTRY_TYPES).optional(),
  tags: z.array(z.string()).optional(),
  change_reason: z.string().optional(),
})

/**
 * Type for create entry request body
 */
export type CreateAnamnesisEntryRequest = z.infer<typeof createAnamnesisEntrySchema>

/**
 * Type for create version request body
 */
export type CreateVersionRequest = z.infer<typeof createVersionSchema>

/**
 * Validates JSONB content size
 * 
 * @param content - JSONB content object
 * @returns true if size is within limits
 * @throws Error if content exceeds size limit
 */
export function validateContentSize(content: Record<string, unknown>): boolean {
  const contentString = JSON.stringify(content)
  const sizeInBytes = Buffer.byteLength(contentString, 'utf8')

  if (sizeInBytes > MAX_JSONB_SIZE_BYTES) {
    throw new Error(
      `Content size (${sizeInBytes} bytes) exceeds maximum allowed size (${MAX_JSONB_SIZE_BYTES} bytes)`
    )
  }

  return true
}

/**
 * Validates entry type against allowed types
 * 
 * @param entryType - Entry type to validate
 * @returns true if valid
 */
export function validateEntryType(entryType: string | undefined | null): boolean {
  if (!entryType) return true // Optional field
  return ENTRY_TYPES.includes(entryType as EntryType)
}

/**
 * Validates and sanitizes anamnesis entry data
 * 
 * @param data - Raw entry data from request
 * @returns Validated and sanitized entry data
 * @throws z.ZodError if validation fails
 */
export function validateCreateEntry(data: unknown): CreateAnamnesisEntryRequest {
  const validated = createAnamnesisEntrySchema.parse(data)
  if (validated.entry_type === 'intake') {
    const hasContent = Object.keys(validated.content || {}).length > 0
    if (hasContent) {
      intakeContentSchema.parse(validated.content)
    }
  }
  validateContentSize(validated.content)
  return validated
}

/**
 * Validates and sanitizes version creation data
 * 
 * @param data - Raw version data from request
 * @returns Validated and sanitized version data
 * @throws z.ZodError if validation fails
 */
export function validateCreateVersion(data: unknown): CreateVersionRequest {
  const validated = createVersionSchema.parse(data)
  if (validated.entry_type === 'intake') {
    intakeContentSchema.parse(validated.content)
  }
  validateContentSize(validated.content)
  return validated
}
