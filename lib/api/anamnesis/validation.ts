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
  'other',
] as const

export type EntryType = (typeof ENTRY_TYPES)[number]

/**
 * Maximum size for JSONB content field (in bytes)
 * Conservative limit to prevent excessive storage and performance issues
 */
export const MAX_JSONB_SIZE_BYTES = 1024 * 1024 // 1MB

/**
 * Zod schema for anamnesis entry creation
 */
export const createAnamnesisEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or less'),
  content: z.record(z.unknown()).default({}),
  entry_type: z.enum(ENTRY_TYPES).optional(),
  tags: z.array(z.string()).optional().default([]),
  change_reason: z.string().optional(),
})

/**
 * Zod schema for anamnesis entry version creation
 */
export const createVersionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or less'),
  content: z.record(z.unknown()).default({}),
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
  validateContentSize(validated.content)
  return validated
}
