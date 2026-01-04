/**
 * PDF Generation Contract - V05-I05.8
 * 
 * Defines the schema for PDF generation from approved report sections.
 * Ensures deterministic output, PHI-free storage, and secure access.
 * 
 * @module lib/contracts/pdfGeneration
 */

import { z } from 'zod'

// ============================================================
// PDF Generation Status
// ============================================================

/**
 * PDF generation status enum
 */
export const PDF_STATUS = {
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type PdfStatus = (typeof PDF_STATUS)[keyof typeof PDF_STATUS]

// ============================================================
// PDF Metadata Schema
// ============================================================

/**
 * Metadata stored with generated PDF
 * All fields are PHI-free
 */
export const PdfMetadataSchema = z.object({
  /** File size in bytes */
  fileSizeBytes: z.number().int().min(0),

  /** Generation timestamp */
  generatedAt: z.string().datetime(),

  /** PDF generation version (for tracking algorithm changes) */
  version: z.string().min(1).max(100),

  /** SHA-256 hash of PDF content (for determinism verification) */
  contentHash: z.string().min(64).max(64),

  /** Number of pages */
  pageCount: z.number().int().min(1),

  /** Report sections version used */
  sectionsVersion: z.string().min(1).max(100).optional(),

  /** Any non-fatal warnings during generation */
  warnings: z.array(z.string().max(500)).optional(),
}).strict()

export type PdfMetadata = z.infer<typeof PdfMetadataSchema>

// ============================================================
// PDF Generation Input
// ============================================================

/**
 * Input for PDF generation
 * References approved report sections
 */
export const PdfGenerationInputSchema = z.object({
  /** Processing job ID */
  jobId: z.string().uuid(),

  /** Assessment ID (for ownership verification) */
  assessmentId: z.string().uuid(),

  /** Report sections (must be approved) */
  sectionsData: z.any(), // ReportSectionsV1 from reportSections.ts

  /** Patient profile data (minimal, for header only - no PHI) */
  patientData: z
    .object({
      /** Patient initials only (no full name) */
      initials: z.string().min(1).max(10).optional(),

      /** Assessment date */
      assessmentDate: z.string().datetime(),
    })
    .optional(),

  /** Generation options */
  options: z
    .object({
      /** Include page numbers */
      includePageNumbers: z.boolean().default(true),

      /** Include generation timestamp */
      includeTimestamp: z.boolean().default(true),

      /** Include disclaimer */
      includeDisclaimer: z.boolean().default(true),
    })
    .optional()
    .default({
      includePageNumbers: true,
      includeTimestamp: true,
      includeDisclaimer: true,
    }),
}).strict()

export type PdfGenerationInput = z.infer<typeof PdfGenerationInputSchema>

// ============================================================
// PDF Generation Result
// ============================================================

/**
 * Result of PDF generation
 */
export const PdfGenerationResultSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.object({
      /** Storage path (PHI-free) */
      pdfPath: z.string().min(1).max(500),

      /** PDF metadata */
      metadata: PdfMetadataSchema,

      /** Generation duration in milliseconds */
      generationTimeMs: z.number().int().min(0),
    }),
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

export type PdfGenerationResult = z.infer<typeof PdfGenerationResultSchema>

// ============================================================
// Signed URL Request/Response
// ============================================================

/**
 * Request for signed URL
 */
export const SignedUrlRequestSchema = z.object({
  /** Assessment ID (for ownership verification) */
  assessmentId: z.string().uuid(),

  /** URL expiry in seconds (default: 1 hour, max: 24 hours) */
  expiresIn: z.number().int().min(60).max(86400).default(3600),
})

export type SignedUrlRequest = z.infer<typeof SignedUrlRequestSchema>

/**
 * Signed URL response
 */
export const SignedUrlResponseSchema = z.object({
  /** Signed URL for PDF download */
  url: z.string().url(),

  /** Expiry timestamp */
  expiresAt: z.string().datetime(),

  /** PDF metadata (for display) */
  metadata: PdfMetadataSchema.pick({
    fileSizeBytes: true,
    pageCount: true,
    generatedAt: true,
  }),
})

export type SignedUrlResponse = z.infer<typeof SignedUrlResponseSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Type guard for successful PDF generation
 */
export function isSuccessPdfResult(
  result: PdfGenerationResult,
): result is Extract<PdfGenerationResult, { success: true }> {
  return result.success === true
}

/**
 * Type guard for failed PDF generation
 */
export function isErrorPdfResult(
  result: PdfGenerationResult,
): result is Extract<PdfGenerationResult, { success: false }> {
  return result.success === false
}

/**
 * Validate PDF generation input
 */
export function validatePdfGenerationInput(data: unknown): {
  valid: boolean
  data?: PdfGenerationInput
  error?: string
} {
  const result = PdfGenerationInputSchema.safeParse(data)
  if (result.success) {
    return { valid: true, data: result.data }
  }
  return {
    valid: false,
    error: `Validation failed: ${result.error.issues.map((e) => e.message).join(', ')}`,
  }
}

/**
 * Validate signed URL request
 */
export function validateSignedUrlRequest(data: unknown): {
  valid: boolean
  data?: SignedUrlRequest
  error?: string
} {
  const result = SignedUrlRequestSchema.safeParse(data)
  if (result.success) {
    return { valid: true, data: result.data }
  }
  return {
    valid: false,
    error: `Validation failed: ${result.error.issues.map((e) => e.message).join(', ')}`,
  }
}
