/**
 * Medical Validation Contract - V05-I05.5
 * 
 * Defines the schema for Medical Validation Layer 1: rules-based checks
 * for contraindications and plausibility. This is deterministic, testable,
 * and fail-closed.
 * 
 * Key guarantees:
 * - Deterministic: same inputs → same flags
 * - Versioned: tracks validation rules engine version
 * - Fail-closed: unknown rule keys / missing rule set → validation FAIL
 * - PHI-free: no patient identifiers, only references (jobId, sectionKey, ruleId)
 * 
 * @module lib/contracts/medicalValidation
 */

import { z } from 'zod'

// ============================================================
// Validation Severity Levels
// ============================================================

/**
 * Severity levels for validation flags
 * - info: Informational, no action required
 * - warning: Should be reviewed but not blocking
 * - critical: Blocks progression, requires review
 */
export const VALIDATION_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const

export type ValidationSeverity = typeof VALIDATION_SEVERITY[keyof typeof VALIDATION_SEVERITY]

export const ValidationSeveritySchema = z.enum([
  VALIDATION_SEVERITY.INFO,
  VALIDATION_SEVERITY.WARNING,
  VALIDATION_SEVERITY.CRITICAL,
])

// ============================================================
// Validation Flag Types
// ============================================================

/**
 * Types of validation flags
 * - contraindication: Recommendation conflicts with risk signals
 * - plausibility: Contradictory statements or claims
 * - out_of_bounds: Values or claims outside acceptable ranges
 */
export const VALIDATION_FLAG_TYPE = {
  CONTRAINDICATION: 'contraindication',
  PLAUSIBILITY: 'plausibility',
  OUT_OF_BOUNDS: 'out_of_bounds',
} as const

export type ValidationFlagType = typeof VALIDATION_FLAG_TYPE[keyof typeof VALIDATION_FLAG_TYPE]

export const ValidationFlagTypeSchema = z.enum([
  VALIDATION_FLAG_TYPE.CONTRAINDICATION,
  VALIDATION_FLAG_TYPE.PLAUSIBILITY,
  VALIDATION_FLAG_TYPE.OUT_OF_BOUNDS,
])

// ============================================================
// Validation Flag
// ============================================================

/**
 * A single validation flag raised during validation
 * PHI-free: contains only references, not patient data
 */
export const ValidationFlagSchema = z.object({
  /** Unique flag ID (for tracking/dismissal) */
  flagId: z.string().uuid(),
  
  /** Rule that triggered this flag */
  ruleId: z.string().min(1).max(200),
  
  /** Rule version (for reproducibility) */
  ruleVersion: z.string().min(1).max(50),
  
  /** Flag type */
  flagType: ValidationFlagTypeSchema,
  
  /** Severity level */
  severity: ValidationSeveritySchema,
  
  /** Section key where flag was raised (if section-specific) */
  sectionKey: z.string().min(1).max(100).optional(),
  
  /** Human-readable reason (coded, not free text) */
  reason: z.string().min(1).max(1000),
  
  /** Additional context (PHI-free) */
  context: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  
  /** Timestamp when flag was raised */
  flaggedAt: z.string().datetime(),
}).strict()

export type ValidationFlag = z.infer<typeof ValidationFlagSchema>

// ============================================================
// Section Validation Result
// ============================================================

/**
 * Validation result for a single section
 */
export const SectionValidationResultSchema = z.object({
  /** Section key */
  sectionKey: z.string().min(1).max(100),
  
  /** Pass/fail for this section */
  passed: z.boolean(),
  
  /** Flags raised for this section */
  flags: z.array(ValidationFlagSchema),
  
  /** Highest severity level in this section's flags */
  maxSeverity: ValidationSeveritySchema.optional(),
}).strict()

export type SectionValidationResult = z.infer<typeof SectionValidationResultSchema>

// ============================================================
// Overall Validation Status
// ============================================================

/**
 * Overall validation status
 * - pass: No critical flags, progression allowed
 * - flag: Has warnings/info, review recommended
 * - fail: Has critical flags, review required
 */
export const VALIDATION_STATUS = {
  PASS: 'pass',
  FLAG: 'flag',
  FAIL: 'fail',
} as const

export type ValidationStatus = typeof VALIDATION_STATUS[keyof typeof VALIDATION_STATUS]

export const ValidationStatusSchema = z.enum([
  VALIDATION_STATUS.PASS,
  VALIDATION_STATUS.FLAG,
  VALIDATION_STATUS.FAIL,
])

// ============================================================
// Medical Validation Result V1
// ============================================================

/**
 * Complete medical validation result for a processing job
 * Version: v1
 */
export const MedicalValidationResultV1Schema = z.object({
  /** Schema version */
  validationVersion: z.literal('v1'),
  
  /** Validation rules engine version */
  engineVersion: z.string().min(1).max(50),
  
  /** Processing job ID reference */
  jobId: z.string().uuid(),
  
  /** Report sections ID reference */
  sectionsId: z.string().uuid().optional(),
  
  /** Overall validation status */
  overallStatus: ValidationStatusSchema,
  
  /** Per-section validation results */
  sectionResults: z.array(SectionValidationResultSchema),
  
  /** All flags raised (aggregated from sections + overall) */
  flags: z.array(ValidationFlagSchema),
  
  /** Overall passed (no critical flags) */
  overallPassed: z.boolean(),
  
  /** Metadata */
  metadata: z.object({
    /** Validation duration in milliseconds */
    validationTimeMs: z.number().int().min(0),
    
    /** Number of rules evaluated */
    rulesEvaluatedCount: z.number().int().min(0),
    
    /** Number of flags raised */
    flagsRaisedCount: z.number().int().min(0),
    
    /** Number of critical flags */
    criticalFlagsCount: z.number().int().min(0),
    
    /** Number of warnings */
    warningFlagsCount: z.number().int().min(0),
    
    /** Number of info flags */
    infoFlagsCount: z.number().int().min(0),
  }).strict(),
  
  /** Timestamp when validation was performed */
  validatedAt: z.string().datetime(),
}).strict()

export type MedicalValidationResultV1 = z.infer<typeof MedicalValidationResultV1Schema>

// ============================================================
// Validation Result (Success/Error)
// ============================================================

/**
 * Validation operation result (for persistence/processing)
 */
export const ValidationResultSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: MedicalValidationResultV1Schema,
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  }),
])

export type ValidationResult = z.infer<typeof ValidationResultSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Validate a MedicalValidationResultV1 object
 */
export function validateMedicalValidationResult(
  data: unknown
): ValidationResult {
  try {
    const validated = MedicalValidationResultV1Schema.parse(data)
    return {
      success: true,
      data: validated,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_SCHEMA_ERROR',
        message: error instanceof Error ? error.message : 'Invalid validation result schema',
      },
    }
  }
}

/**
 * Get flags for a specific section
 */
export function getFlagsForSection(
  result: MedicalValidationResultV1,
  sectionKey: string
): ValidationFlag[] {
  return result.flags.filter(flag => flag.sectionKey === sectionKey)
}

/**
 * Get flags by severity
 */
export function getFlagsBySeverity(
  result: MedicalValidationResultV1,
  severity: ValidationSeverity
): ValidationFlag[] {
  return result.flags.filter(flag => flag.severity === severity)
}

/**
 * Check if validation has critical flags
 */
export function hasCriticalFlags(result: MedicalValidationResultV1): boolean {
  return result.metadata.criticalFlagsCount > 0
}

/**
 * Check if validation has any flags
 */
export function hasAnyFlags(result: MedicalValidationResultV1): boolean {
  return result.metadata.flagsRaisedCount > 0
}

/**
 * Get section validation result by key
 */
export function getSectionResult(
  result: MedicalValidationResultV1,
  sectionKey: string
): SectionValidationResult | undefined {
  return result.sectionResults.find(sr => sr.sectionKey === sectionKey)
}

/**
 * Type guard for success result
 */
export function isSuccessResult(result: ValidationResult): result is { success: true; data: MedicalValidationResultV1 } {
  return result.success === true
}

/**
 * Type guard for error result
 */
export function isErrorResult(result: ValidationResult): result is { success: false; error: { code: string; message: string } } {
  return result.success === false
}
