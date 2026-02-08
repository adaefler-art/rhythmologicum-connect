/**
 * Diagnosis Contract - E76.4
 * 
 * Versioned schema for diagnosis runs and artifacts.
 * Defines the structure for diagnosis execution worker that fetches context packs,
 * calls LLM/MCP, validates output, and persists artifacts.
 * 
 * @module lib/contracts/diagnosis
 */

import { z } from 'zod'

// ============================================================
// Diagnosis Run Status (Enum)
// ============================================================

/**
 * Valid diagnosis run statuses
 * Lifecycle: queued → running → completed|failed
 */
export const DIAGNOSIS_RUN_STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type DiagnosisRunStatus = typeof DIAGNOSIS_RUN_STATUS[keyof typeof DIAGNOSIS_RUN_STATUS]

/**
 * Check if a status is terminal (completed or failed)
 */
export function isTerminalStatus(status: DiagnosisRunStatus): boolean {
  return status === DIAGNOSIS_RUN_STATUS.COMPLETED || status === DIAGNOSIS_RUN_STATUS.FAILED
}

// ============================================================
// Error Codes
// ============================================================

/**
 * Standard error codes for diagnosis run failures
 */
export const DIAGNOSIS_ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  LLM_ERROR: 'LLM_ERROR',
  CONTEXT_PACK_ERROR: 'CONTEXT_PACK_ERROR',
  MCP_ERROR: 'MCP_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  DIAGNOSIS_PERSIST_UNCONFIGURED: 'DIAGNOSIS_PERSIST_UNCONFIGURED',
  DIAGNOSIS_PERSIST_FAILED: 'DIAGNOSIS_PERSIST_FAILED',
  COMPLETED_NO_RESULT: 'COMPLETED_NO_RESULT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type DiagnosisErrorCode = typeof DIAGNOSIS_ERROR_CODE[keyof typeof DIAGNOSIS_ERROR_CODE]

// ============================================================
// Artifact Types
// ============================================================

/**
 * Types of artifacts that can be stored
 */
export const ARTIFACT_TYPE = {
  DIAGNOSIS_JSON: 'diagnosis_json',
  CONTEXT_PACK: 'context_pack',
  MCP_RESPONSE: 'mcp_response',
} as const

export type ArtifactType = typeof ARTIFACT_TYPE[keyof typeof ARTIFACT_TYPE]

// ============================================================
// Risk Levels
// ============================================================

/**
 * Risk levels from LLM diagnosis
 */
export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

export type RiskLevel = typeof RISK_LEVEL[keyof typeof RISK_LEVEL]

// ============================================================
// Zod Schemas
// ============================================================

/**
 * Schema for diagnosis run error details
 */
export const DiagnosisErrorDetailsSchema = z.object({
  code: z.enum([
    DIAGNOSIS_ERROR_CODE.VALIDATION_ERROR,
    DIAGNOSIS_ERROR_CODE.LLM_ERROR,
    DIAGNOSIS_ERROR_CODE.CONTEXT_PACK_ERROR,
    DIAGNOSIS_ERROR_CODE.MCP_ERROR,
    DIAGNOSIS_ERROR_CODE.NETWORK_ERROR,
    DIAGNOSIS_ERROR_CODE.TIMEOUT_ERROR,
    DIAGNOSIS_ERROR_CODE.DIAGNOSIS_PERSIST_UNCONFIGURED,
    DIAGNOSIS_ERROR_CODE.DIAGNOSIS_PERSIST_FAILED,
    DIAGNOSIS_ERROR_CODE.COMPLETED_NO_RESULT,
    DIAGNOSIS_ERROR_CODE.UNKNOWN_ERROR,
  ]),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
  timestamp: z.string().datetime(),
})

export type DiagnosisErrorDetails = z.infer<typeof DiagnosisErrorDetailsSchema>

/**
 * Schema for diagnosis result from LLM
 */
export const DiagnosisResultSchema = z.object({
  primary_findings: z.array(z.string()).min(1),
  risk_level: z.enum([
    RISK_LEVEL.LOW,
    RISK_LEVEL.MEDIUM,
    RISK_LEVEL.HIGH,
    RISK_LEVEL.CRITICAL,
  ]),
  recommendations: z.array(z.string()).min(1),
  confidence_score: z.number().min(0).max(1),
  supporting_evidence: z.array(z.string()).optional(),
  differential_considerations: z.array(z.string()).optional(),
})

export type DiagnosisResult = z.infer<typeof DiagnosisResultSchema>

/**
 * Schema for full diagnosis artifact data
 */
export const DiagnosisArtifactDataSchema = z.object({
  run_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  diagnosis_result: DiagnosisResultSchema,
  metadata: z.object({
    mcp_run_id: z.string().optional(),
    run_version: z.string().optional(),
    prompt_version: z.string().optional(),
    executed_at: z.string().datetime(),
    processing_time_ms: z.number().optional(),
  }),
})

export type DiagnosisArtifactData = z.infer<typeof DiagnosisArtifactDataSchema>

/**
 * Schema for diagnosis run database record
 */
export const DiagnosisRunSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  clinician_id: z.string().uuid(),
  status: z.enum([
    DIAGNOSIS_RUN_STATUS.QUEUED,
    DIAGNOSIS_RUN_STATUS.RUNNING,
    DIAGNOSIS_RUN_STATUS.COMPLETED,
    DIAGNOSIS_RUN_STATUS.FAILED,
  ]),
  inputs_hash: z.string(),
  context_pack_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
  error_details: z.record(z.string(), z.any()).nullable(),
  mcp_run_id: z.string().nullable(),
  processing_time_ms: z.number().nullable(),
  retry_count: z.number().min(0).max(10),
  max_retries: z.number().min(1).max(10),
})

export type DiagnosisRun = z.infer<typeof DiagnosisRunSchema>

/**
 * Schema for diagnosis artifact database record
 */
export const DiagnosisArtifactSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  artifact_type: z.enum([
    ARTIFACT_TYPE.DIAGNOSIS_JSON,
    ARTIFACT_TYPE.CONTEXT_PACK,
    ARTIFACT_TYPE.MCP_RESPONSE,
  ]),
  artifact_data: z.record(z.string(), z.any()),
  schema_version: z.string(),
  created_at: z.string().datetime(),
  created_by: z.string().uuid(),
  risk_level: z.enum([
    RISK_LEVEL.LOW,
    RISK_LEVEL.MEDIUM,
    RISK_LEVEL.HIGH,
    RISK_LEVEL.CRITICAL,
  ]).nullable(),
  confidence_score: z.number().min(0).max(1).nullable(),
  primary_findings: z.array(z.string()).nullable(),
  recommendations_count: z.number().nullable(),
  metadata: z.record(z.string(), z.any()),
})

export type DiagnosisArtifact = z.infer<typeof DiagnosisArtifactSchema>

/**
 * Schema for creating a new diagnosis run
 */
export const CreateDiagnosisRunSchema = z.object({
  patient_id: z.string().uuid(),
  clinician_id: z.string().uuid(),
  inputs_hash: z.string(),
  max_retries: z.number().min(1).max(10).default(3),
})

export type CreateDiagnosisRun = z.infer<typeof CreateDiagnosisRunSchema>

/**
 * Schema for updating diagnosis run status
 */
export const UpdateDiagnosisRunSchema = z.object({
  status: z.enum([
    DIAGNOSIS_RUN_STATUS.QUEUED,
    DIAGNOSIS_RUN_STATUS.RUNNING,
    DIAGNOSIS_RUN_STATUS.COMPLETED,
    DIAGNOSIS_RUN_STATUS.FAILED,
  ]).optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  error_details: z.record(z.string(), z.any()).optional(),
  mcp_run_id: z.string().optional(),
  processing_time_ms: z.number().optional(),
  retry_count: z.number().min(0).max(10).optional(),
})

export type UpdateDiagnosisRun = z.infer<typeof UpdateDiagnosisRunSchema>

// ============================================================
// Constants
// ============================================================

/**
 * Default schema version for diagnosis artifacts
 */
export const DEFAULT_SCHEMA_VERSION = 'v1'

/**
 * Default maximum retries for failed diagnosis runs
 */
export const DEFAULT_MAX_RETRIES = 3

/**
 * Maximum processing time before timeout (milliseconds)
 */
export const DIAGNOSIS_TIMEOUT_MS = 300000 // 5 minutes

/**
 * Minimum confidence score for valid diagnosis
 */
export const MIN_CONFIDENCE_SCORE = 0.5
