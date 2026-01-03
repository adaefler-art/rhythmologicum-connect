/**
 * Document Extraction Types and Schemas (V05-I04.2)
 * 
 * Type definitions and Zod schemas for AI document extraction pipeline
 */

import { z } from 'zod'
import type { ExtractorVersion } from '@/lib/contracts/registry'

/**
 * Evidence pointer for confidence metadata
 * PHI-safe reference to where data was found in the document
 */
export const EvidencePointerSchema = z.object({
  page: z.number().optional(),
  section: z.string().optional(),
  confidence_score: z.number().min(0).max(1),
})

export type EvidencePointer = z.infer<typeof EvidencePointerSchema>

/**
 * Lab value extraction schema
 */
export const LabValueSchema = z.object({
  test_name: z.string(),
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  reference_range: z.string().optional(),
  date: z.string().optional(),
})

export type LabValue = z.infer<typeof LabValueSchema>

/**
 * Medication extraction schema
 */
export const MedicationSchema = z.object({
  name: z.string(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  route: z.string().optional(),
})

export type Medication = z.infer<typeof MedicationSchema>

/**
 * Generic extracted data schema
 * Can be extended with additional fields as needed
 */
export const ExtractedDataSchema = z.object({
  lab_values: z.array(LabValueSchema).optional(),
  medications: z.array(MedicationSchema).optional(),
  vital_signs: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  diagnoses: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export type ExtractedData = z.infer<typeof ExtractedDataSchema>

/**
 * Confidence metadata schema
 * Per-field confidence scores with PHI-safe evidence pointers
 */
export const ConfidenceMetadataSchema = z.object({
  overall_confidence: z.number().min(0).max(1),
  field_confidence: z.record(z.string(), z.number().min(0).max(1)),
  evidence: z.record(z.string(), EvidencePointerSchema),
  extraction_timestamp: z.string(),
})

export type ConfidenceMetadata = z.infer<typeof ConfidenceMetadataSchema>

/**
 * Extraction result schema
 * Complete result from the extraction pipeline
 */
export const ExtractionResultSchema = z.object({
  extractor_version: z.string(),
  input_hash: z.string(),
  extracted_data: ExtractedDataSchema,
  confidence: ConfidenceMetadataSchema,
  extracted_at: z.string(),
})

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>

/**
 * Extraction request schema
 */
export const ExtractionRequestSchema = z.object({
  document_id: z.string().uuid(),
  force_reextract: z.boolean().optional().default(false),
})

export type ExtractionRequest = z.infer<typeof ExtractionRequestSchema>

/**
 * Extraction response schema (API response)
 */
export const ExtractionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    document_id: z.string().uuid(),
    extractor_version: z.string(),
    input_hash: z.string(),
    extraction_created: z.boolean(),
    extracted_data: ExtractedDataSchema.optional(),
    confidence: ConfidenceMetadataSchema.optional(),
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
})

export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>

/**
 * Validates extracted data against schema
 */
export function validateExtractedData(data: unknown): {
  valid: boolean
  data?: ExtractedData
  error?: string
} {
  try {
    const validated = ExtractedDataSchema.parse(data)
    return { valid: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      }
    }
    return { valid: false, error: String(error) }
  }
}

/**
 * Validates confidence metadata against schema
 */
export function validateConfidenceMetadata(data: unknown): {
  valid: boolean
  data?: ConfidenceMetadata
  error?: string
} {
  try {
    const validated = ConfidenceMetadataSchema.parse(data)
    return { valid: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      }
    }
    return { valid: false, error: String(error) }
  }
}

/**
 * Extracts structured data from document using AI
 * This is a placeholder - actual implementation will use Anthropic Claude
 */
export interface ExtractionPayload {
  documentId: string
  storagePath: string
  mimeType: string
  extractorVersion: ExtractorVersion
  parsedText?: string // If available from previous parsing step
}

/**
 * Error codes for extraction pipeline
 */
export const EXTRACTION_ERROR = {
  INVALID_STATE: 'INVALID_STATE',
  NOT_PARSED: 'NOT_PARSED',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  IDEMPOTENCY_VIOLATION: 'IDEMPOTENCY_VIOLATION',
} as const

export type ExtractionErrorCode = typeof EXTRACTION_ERROR[keyof typeof EXTRACTION_ERROR]

// ============================================================
// Confirmation Types (V05-I04.3)
// ============================================================

/**
 * Status for a confirmed field
 */
export const FIELD_STATUS = {
  ACCEPTED: 'accepted', // Patient accepted extracted value as-is
  EDITED: 'edited', // Patient corrected the extracted value
  REJECTED: 'rejected', // Patient marked field as not applicable/unknown
} as const

export type FieldStatus = typeof FIELD_STATUS[keyof typeof FIELD_STATUS]

/**
 * Per-field confirmation metadata
 */
export const FieldConfirmationSchema = z.object({
  status: z.enum(['accepted', 'edited', 'rejected']),
  original_value: z.union([z.string(), z.number(), z.record(z.any()), z.array(z.any())]).optional(),
  confirmed_value: z.union([z.string(), z.number(), z.record(z.any()), z.array(z.any())]).optional(),
  confirmed_at: z.string(),
})

export type FieldConfirmation = z.infer<typeof FieldConfirmationSchema>

/**
 * Complete confirmation data structure
 * Mirrors extracted_data but adds per-field status tracking
 */
export const ConfirmationDataSchema = z.object({
  lab_values: z.array(LabValueSchema).optional(),
  medications: z.array(MedicationSchema).optional(),
  vital_signs: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  diagnoses: z.array(z.string()).optional(),
  notes: z.string().optional(),
  // Per-field confirmation metadata
  field_confirmations: z.record(z.string(), FieldConfirmationSchema),
})

export type ConfirmationData = z.infer<typeof ConfirmationDataSchema>

/**
 * Request schema for saving confirmations
 */
export const SaveConfirmationRequestSchema = z.object({
  document_id: z.string().uuid(),
  confirmed_data: ConfirmationDataSchema,
})

export type SaveConfirmationRequest = z.infer<typeof SaveConfirmationRequestSchema>

/**
 * Response schema for confirmation operations
 */
export const ConfirmationResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      document_id: z.string().uuid(),
      confirmed_at: z.string(),
    })
    .optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
})

export type ConfirmationResponse = z.infer<typeof ConfirmationResponseSchema>

/**
 * Helper to determine if a field has low confidence
 */
export function isLowConfidence(score: number, threshold = 0.7): boolean {
  return score < threshold
}

/**
 * Helper to get confirmation status summary
 */
export function getConfirmationSummary(confirmations: Record<string, FieldConfirmation>) {
  const statuses = Object.values(confirmations)
  return {
    total: statuses.length,
    accepted: statuses.filter(c => c.status === FIELD_STATUS.ACCEPTED).length,
    edited: statuses.filter(c => c.status === FIELD_STATUS.EDITED).length,
    rejected: statuses.filter(c => c.status === FIELD_STATUS.REJECTED).length,
  }
}
