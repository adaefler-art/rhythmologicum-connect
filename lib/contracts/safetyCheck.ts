/**
 * Safety Check Contract - V05-I05.6
 * 
 * Defines the schema for Medical Validation Layer 2: AI-powered safety check
 * This is a guardrailed, PHI-free, auditable safety assessment layer that
 * complements Layer 1 (rules-based validation).
 * 
 * Key guarantees:
 * - PHI-free: No patient identifiers, only redacted section content
 * - Versioned: Tracks prompt version and model configuration
 * - Guardrailed: Strictly safety assessment, no diagnoses/recommendations
 * - Fail-closed: Unavailable → UNKNOWN + review required (not PASS)
 * - Auditable: Full structured output logged
 * 
 * @module lib/contracts/safetyCheck
 */

import { z } from 'zod'

// ============================================================
// Safety Check Action
// ============================================================

/**
 * Recommended action based on safety check
 * - PASS: Safe to proceed to next stage
 * - FLAG: Has concerns, review recommended but not required
 * - BLOCK: Has critical safety issues, review required
 * - UNKNOWN: Safety check failed/unavailable, review required
 */
export const SAFETY_ACTION = {
  PASS: 'PASS',
  FLAG: 'FLAG',
  BLOCK: 'BLOCK',
  UNKNOWN: 'UNKNOWN',
} as const

export type SafetyAction = typeof SAFETY_ACTION[keyof typeof SAFETY_ACTION]

export const SafetyActionSchema = z.enum([
  SAFETY_ACTION.PASS,
  SAFETY_ACTION.FLAG,
  SAFETY_ACTION.BLOCK,
  SAFETY_ACTION.UNKNOWN,
])

// ============================================================
// Safety Severity
// ============================================================

/**
 * Severity level for safety findings
 * - none: No safety concerns
 * - low: Minor concerns, informational
 * - medium: Moderate concerns, should review
 * - high: Serious concerns, must review
 * - critical: Critical safety issues, must block
 */
export const SAFETY_SEVERITY = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

export type SafetySeverity = typeof SAFETY_SEVERITY[keyof typeof SAFETY_SEVERITY]

export const SafetySeveritySchema = z.enum([
  SAFETY_SEVERITY.NONE,
  SAFETY_SEVERITY.LOW,
  SAFETY_SEVERITY.MEDIUM,
  SAFETY_SEVERITY.HIGH,
  SAFETY_SEVERITY.CRITICAL,
])

// ============================================================
// Safety Finding
// ============================================================

/**
 * Individual safety finding from AI evaluation
 * PHI-free: contains only references and coded reasons
 */
export const SafetyFindingSchema = z.object({
  /** Unique finding ID */
  findingId: z.string().uuid(),
  
  /** Finding category (coded) */
  category: z.enum([
    'consistency',
    'medical_plausibility',
    'contraindication',
    'tone_appropriateness',
    'information_quality',
    'other',
  ]),
  
  /** Severity level */
  severity: SafetySeveritySchema,
  
  /** Section key where finding was identified (optional) */
  sectionKey: z.string().min(1).max(100).optional(),
  
  /** Human-readable reason (no PHI) */
  reason: z.string().min(1).max(2000),
  
  /** Recommended action for this finding */
  suggestedAction: SafetyActionSchema,
  
  /** Additional PHI-free context */
  context: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  
  /** Timestamp when finding was identified */
  identifiedAt: z.string().datetime(),
}).strict()

export type SafetyFinding = z.infer<typeof SafetyFindingSchema>

// ============================================================
// Safety Check Result V1
// ============================================================

/**
 * Complete safety check result from AI evaluation
 * Version: v1
 */
export const SafetyCheckResultV1Schema = z.object({
  /** Schema version */
  safetyVersion: z.literal('v1'),
  
  /** Processing job ID reference */
  jobId: z.string().uuid(),
  
  /** Report sections ID reference */
  sectionsId: z.string().uuid(),
  
  /** Prompt version used for evaluation */
  promptVersion: z.string().min(1).max(100),
  
  /** Model configuration used */
  modelConfig: z.object({
    provider: z.enum(['anthropic', 'openai', 'template']),
    model: z.string().min(1).max(100).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().optional(),
  }).optional(),
  
  /** Overall safety score (0-100, higher = safer) */
  safetyScore: z.number().int().min(0).max(100),
  
  /** Overall severity level */
  overallSeverity: SafetySeveritySchema,
  
  /** Recommended action */
  recommendedAction: SafetyActionSchema,
  
  /** Individual safety findings */
  findings: z.array(SafetyFindingSchema),
  
  /** Summary reasoning (PHI-free) */
  summaryReasoning: z.string().min(0).max(5000),
  
  /** Timestamp when check was performed */
  evaluatedAt: z.string().datetime(),
  
  /** Metadata */
  metadata: z.object({
    /** Evaluation time in milliseconds */
    evaluationTimeMs: z.number().int().nonnegative(),
    
    /** Number of LLM calls made */
    llmCallCount: z.number().int().nonnegative(),
    
    /** Number of sections evaluated */
    sectionsEvaluatedCount: z.number().int().nonnegative(),
    
    /** Token usage (if available) */
    tokenUsage: z.object({
      promptTokens: z.number().int().nonnegative(),
      completionTokens: z.number().int().nonnegative(),
      totalTokens: z.number().int().nonnegative(),
    }).optional(),
    
    /** Was fallback used? */
    fallbackUsed: z.boolean(),
    
    /** Any warnings during evaluation */
    warnings: z.array(z.string()).optional(),
  }),
}).strict()

export type SafetyCheckResultV1 = z.infer<typeof SafetyCheckResultV1Schema>

// ============================================================
// Result Wrappers
// ============================================================

export const SuccessResultSchema = z.object({
  success: z.literal(true),
  data: SafetyCheckResultV1Schema,
})

export const ErrorResultSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
})

export type SuccessResult = z.infer<typeof SuccessResultSchema>
export type ErrorResult = z.infer<typeof ErrorResultSchema>
export type SafetyCheckResult = SuccessResult | ErrorResult

// ============================================================
// Validation Functions
// ============================================================

/**
 * Validates a safety check result against the schema
 * Returns the validated result or throws a descriptive error
 */
export function validateSafetyCheckResult(data: unknown): SafetyCheckResultV1 {
  return SafetyCheckResultV1Schema.parse(data)
}

/**
 * Validates a safety finding against the schema
 * Returns the validated finding or throws a descriptive error
 */
export function validateSafetyFinding(data: unknown): SafetyFinding {
  return SafetyFindingSchema.parse(data)
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get findings for a specific section
 */
export function getFindingsForSection(
  result: SafetyCheckResultV1,
  sectionKey: string,
): SafetyFinding[] {
  return result.findings.filter((f) => f.sectionKey === sectionKey)
}

/**
 * Get findings by severity level
 */
export function getFindingsBySeverity(
  result: SafetyCheckResultV1,
  severity: SafetySeverity,
): SafetyFinding[] {
  return result.findings.filter((f) => f.severity === severity)
}

/**
 * Check if result has critical findings
 */
export function hasCriticalFindings(result: SafetyCheckResultV1): boolean {
  return result.findings.some((f) => f.severity === SAFETY_SEVERITY.CRITICAL)
}

/**
 * Check if result has any findings
 */
export function hasAnyFindings(result: SafetyCheckResultV1): boolean {
  return result.findings.length > 0
}

/**
 * Get highest severity level across all findings
 */
export function getMaxSeverity(result: SafetyCheckResultV1): SafetySeverity {
  if (result.findings.length === 0) return SAFETY_SEVERITY.NONE
  
  const severityOrder: SafetySeverity[] = [
    SAFETY_SEVERITY.NONE,
    SAFETY_SEVERITY.LOW,
    SAFETY_SEVERITY.MEDIUM,
    SAFETY_SEVERITY.HIGH,
    SAFETY_SEVERITY.CRITICAL,
  ]
  
  let maxSeverity: SafetySeverity = SAFETY_SEVERITY.NONE
  for (const finding of result.findings) {
    if (severityOrder.indexOf(finding.severity) > severityOrder.indexOf(maxSeverity)) {
      maxSeverity = finding.severity as SafetySeverity
    }
  }
  
  return maxSeverity
}

/**
 * Determine recommended action from findings
 */
export function determineAction(findings: SafetyFinding[]): SafetyAction {
  if (findings.length === 0) return SAFETY_ACTION.PASS
  
  const hasCritical = findings.some((f) => f.severity === SAFETY_SEVERITY.CRITICAL)
  const hasHigh = findings.some((f) => f.severity === SAFETY_SEVERITY.HIGH)
  const hasMedium = findings.some((f) => f.severity === SAFETY_SEVERITY.MEDIUM)
  
  if (hasCritical || hasHigh) return SAFETY_ACTION.BLOCK
  if (hasMedium) return SAFETY_ACTION.FLAG
  
  return SAFETY_ACTION.PASS
}

/**
 * Calculate safety score from findings
 * 100 = perfect, 0 = critical issues
 */
export function calculateSafetyScore(findings: SafetyFinding[]): number {
  if (findings.length === 0) return 100
  
  let score = 100
  
  for (const finding of findings) {
    switch (finding.severity) {
      case SAFETY_SEVERITY.CRITICAL:
        score -= 40
        break
      case SAFETY_SEVERITY.HIGH:
        score -= 25
        break
      case SAFETY_SEVERITY.MEDIUM:
        score -= 15
        break
      case SAFETY_SEVERITY.LOW:
        score -= 5
        break
      case SAFETY_SEVERITY.NONE:
        break
    }
  }
  
  return Math.max(0, score)
}

// ============================================================
// Type Guards
// ============================================================

/**
 * Type guard to check if result is successful
 */
export function isSuccessResult(result: SafetyCheckResult): result is SuccessResult {
  return result.success === true
}

/**
 * Type guard to check if result is an error
 */
export function isErrorResult(result: SafetyCheckResult): result is ErrorResult {
  return result.success === false
}
