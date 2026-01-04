/**
 * Contract Registry - Canonical Identifiers
 * 
 * This file serves as the single source of truth for all critical string identifiers
 * used throughout the application. All new identifiers MUST be added here to prevent
 * "fantasy names" and ensure consistency.
 * 
 * **IMPORTANT**: This file is protected by CODEOWNERS. Any changes require review.
 * 
 * Usage:
 * ```typescript
 * import { ASSESSMENT_STATUS, FUNNEL_SLUG, USER_ROLE } from '@/lib/contracts/registry'
 * 
 * const status: AssessmentStatus = ASSESSMENT_STATUS.IN_PROGRESS
 * const funnel: FunnelSlug = FUNNEL_SLUG.STRESS_ASSESSMENT
 * ```
 */

// ============================================================
// Assessment Statuses
// ============================================================

/**
 * Valid statuses for assessments
 */
export const ASSESSMENT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export type AssessmentStatus = typeof ASSESSMENT_STATUS[keyof typeof ASSESSMENT_STATUS]

// ============================================================
// Content Page Statuses
// ============================================================

/**
 * Valid statuses for content pages
 */
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export type ContentStatus = typeof CONTENT_STATUS[keyof typeof CONTENT_STATUS]

// ============================================================
// Pillar Keys (7-Pillar Model)
// ============================================================

/**
 * Valid pillar keys for funnel taxonomy (7-Pillar Wellness Model)
 */
export const PILLAR_KEY = {
  NUTRITION: 'nutrition',
  MOVEMENT: 'movement',
  SLEEP: 'sleep',
  MENTAL_HEALTH: 'mental-health',
  SOCIAL: 'social',
  MEANING: 'meaning',
  PREVENTION: 'prevention',
} as const

export type PillarKey = typeof PILLAR_KEY[keyof typeof PILLAR_KEY]

// ============================================================
// Funnel Slugs
// ============================================================

/**
 * Valid funnel slugs
 * The canonical slug is the primary identifier
 * Legacy aliases are maintained for backward compatibility
 */
export const FUNNEL_SLUG = {
  STRESS_ASSESSMENT: 'stress-assessment',
  CARDIOVASCULAR_AGE: 'cardiovascular-age',
  SLEEP_QUALITY: 'sleep-quality',
  HEART_HEALTH_NUTRITION: 'heart-health-nutrition',
  // Legacy aliases - deprecated but maintained for compatibility
  STRESS: 'stress',
  STRESS_CHECK: 'stress-check',
  STRESS_CHECK_V2: 'stress-check-v2',
} as const

export type FunnelSlug = typeof FUNNEL_SLUG[keyof typeof FUNNEL_SLUG]

/**
 * Maps legacy funnel slugs to their canonical equivalents
 * Uses lowercase keys for case-insensitive matching
 */
export const FUNNEL_SLUG_ALIASES: Record<string, string> = {
  'stress': FUNNEL_SLUG.STRESS_ASSESSMENT,
  'stress-check': FUNNEL_SLUG.STRESS_ASSESSMENT,
  'stress-check-v2': FUNNEL_SLUG.STRESS_ASSESSMENT,
}

/**
 * Resolves a funnel slug to its canonical form
 * Normalizes input by trimming and converting to lowercase for deterministic matching
 * 
 * @param slug - The funnel slug to resolve (case-insensitive, whitespace trimmed)
 * @returns The canonical slug or the normalized input if no mapping exists
 */
export function getCanonicalFunnelSlug(slug: string): string {
  const normalized = slug.toLowerCase().trim()
  return FUNNEL_SLUG_ALIASES[normalized] || normalized
}

// ============================================================
// Node/Step Types
// ============================================================

/**
 * Valid node/step types for funnel steps
 * These correspond to the 'type' field in the funnel_steps table
 */
export const NODE_TYPE = {
  QUESTION_STEP: 'question_step',
  FORM: 'form',
  INFO_STEP: 'info_step',
  INFO: 'info',
  CONTENT_PAGE: 'content_page',
  SUMMARY: 'summary',
  OTHER: 'other',
} as const

export type NodeType = typeof NODE_TYPE[keyof typeof NODE_TYPE]

// ============================================================
// User Roles
// ============================================================

/**
 * Valid user roles
 * These are stored in auth.users.raw_app_meta_data.role
 */
export const USER_ROLE = {
  PATIENT: 'patient',
  CLINICIAN: 'clinician',
  ADMIN: 'admin',
  NURSE: 'nurse',
} as const

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE]

// ============================================================
// Question Types
// ============================================================

/**
 * Valid question types
 * These correspond to the 'question_type' field in the questions table
 */
export const QUESTION_TYPE = {
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  SCALE: 'scale',
  SLIDER: 'slider',
} as const

export type QuestionType = typeof QUESTION_TYPE[keyof typeof QUESTION_TYPE]

// ============================================================
// Patient Demographics
// ============================================================

/**
 * Valid sex/gender options for patient profiles
 * These correspond to the 'sex' field in the patient_profiles table
 */
export const PATIENT_SEX = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const

export type PatientSex = typeof PATIENT_SEX[keyof typeof PATIENT_SEX]

// ============================================================
// Feature Flag Names
// ============================================================

/**
 * Valid feature flag names (without NEXT_PUBLIC_FEATURE_ prefix)
 */
export const FEATURE_FLAG = {
  AMY_ENABLED: 'AMY_ENABLED',
  CLINICIAN_DASHBOARD_ENABLED: 'CLINICIAN_DASHBOARD_ENABLED',
  CHARTS_ENABLED: 'CHARTS_ENABLED',
} as const

export type FeatureFlag = typeof FEATURE_FLAG[keyof typeof FEATURE_FLAG]

// ============================================================
// Helper Functions
// ============================================================

/**
 * Type guard to check if a value is a valid assessment status
 */
export function isValidAssessmentStatus(value: unknown): value is AssessmentStatus {
  return typeof value === 'string' && Object.values(ASSESSMENT_STATUS).includes(value as AssessmentStatus)
}

/**
 * Type guard to check if a value is a valid content status
 */
export function isValidContentStatus(value: unknown): value is ContentStatus {
  return typeof value === 'string' && Object.values(CONTENT_STATUS).includes(value as ContentStatus)
}

/**
 * Type guard to check if a value is a valid user role
 */
export function isValidUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && Object.values(USER_ROLE).includes(value as UserRole)
}

/**
 * Type guard to check if a value is a valid node type
 */
export function isValidNodeType(value: unknown): value is NodeType {
  return typeof value === 'string' && Object.values(NODE_TYPE).includes(value as NodeType)
}

/**
 * Type guard to check if a value is a valid pillar key
 */
export function isValidPillarKey(value: unknown): value is PillarKey {
  return typeof value === 'string' && Object.values(PILLAR_KEY).includes(value as PillarKey)
}

/**
 * Type guard to check if a value is a valid patient sex option
 */
export function isValidPatientSex(value: unknown): value is PatientSex {
  return typeof value === 'string' && Object.values(PATIENT_SEX).includes(value as PatientSex)
}

// ============================================================
// Audit Log Entity Types
// ============================================================

/**
 * Valid entity types for audit logging
 * These correspond to the 'entity_type' field in the audit_log table
 */
export const AUDIT_ENTITY_TYPE = {
  ASSESSMENT: 'assessment',
  REPORT: 'report',
  TASK: 'task',
  FUNNEL_VERSION: 'funnel_version',
  FUNNEL_CATALOG: 'funnel_catalog',
  CONFIG: 'config',
  CONSENT: 'consent',
  ORGANIZATION: 'organization',
  USER_ORG_MEMBERSHIP: 'user_org_membership',
  CLINICIAN_ASSIGNMENT: 'clinician_assignment',
  DOCUMENT: 'document', // V05-I04.3: Document confirmation tracking
  PROCESSING_JOB: 'processing_job', // V05-I05.1: Processing job orchestration
  REVIEW_RECORD: 'review_record', // V05-I05.7: Medical review records
} as const

export type AuditEntityType = typeof AUDIT_ENTITY_TYPE[keyof typeof AUDIT_ENTITY_TYPE]

// ============================================================
// Audit Log Actions
// ============================================================

/**
 * Valid actions for audit logging
 * These correspond to the 'action' field in the audit_log table
 */
export const AUDIT_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  REQUEST_CHANGES: 'request_changes', // V05-I05.7: Review workflow
  GENERATE: 'generate',
  FLAG: 'flag',
  ASSIGN: 'assign',
  ACTIVATE: 'activate',
  DEACTIVATE: 'deactivate',
  ROLLOUT: 'rollout',
  COMPLETE: 'complete',
} as const

export type AuditAction = typeof AUDIT_ACTION[keyof typeof AUDIT_ACTION]

// ============================================================
// Audit Log Sources
// ============================================================

/**
 * Valid sources for audit logging
 * These correspond to the 'source' field in the audit_log table
 */
export const AUDIT_SOURCE = {
  API: 'api',
  JOB: 'job',
  ADMIN_UI: 'admin-ui',
  SYSTEM: 'system',
} as const

export type AuditSource = typeof AUDIT_SOURCE[keyof typeof AUDIT_SOURCE]

// ============================================================
// Audit Type Guards
// ============================================================

/**
 * Type guard to check if a value is a valid audit entity type
 */
export function isValidAuditEntityType(value: unknown): value is AuditEntityType {
  return typeof value === 'string' && Object.values(AUDIT_ENTITY_TYPE).includes(value as AuditEntityType)
}

/**
 * Type guard to check if a value is a valid audit action
 */
export function isValidAuditAction(value: unknown): value is AuditAction {
  return typeof value === 'string' && Object.values(AUDIT_ACTION).includes(value as AuditAction)
}

/**
 * Type guard to check if a value is a valid audit source
 */
export function isValidAuditSource(value: unknown): value is AuditSource {
  return typeof value === 'string' && Object.values(AUDIT_SOURCE).includes(value as AuditSource)
}

// ============================================================
// Program Tier Levels (TV05_01D)
// ============================================================

/**
 * Valid program tier levels based on Thomas' journey model
 * These map the 3-tier patient journey to platform capabilities
 */
export const PROGRAM_TIER = {
  /**
   * Tier 1 (Essential): Basic stress/resilience assessment
   * Focus: Initial assessment, baseline data collection
   */
  TIER_1_ESSENTIAL: 'tier-1-essential',
  
  /**
   * Tier 2.5 (Enhanced): Extended monitoring with nurse touchpoints
   * Focus: Regular check-ins, progress tracking
   */
  TIER_2_5_ENHANCED: 'tier-2-5-enhanced',
  
  /**
   * Tier 2 (Comprehensive): Full program with intensive support
   * Focus: Comprehensive care, multiple pillars, frequent touchpoints
   */
  TIER_2_COMPREHENSIVE: 'tier-2-comprehensive',
} as const

export type ProgramTier = typeof PROGRAM_TIER[keyof typeof PROGRAM_TIER]

/**
 * Type guard to check if a value is a valid program tier
 */
export function isValidProgramTier(value: unknown): value is ProgramTier {
  return typeof value === 'string' && Object.values(PROGRAM_TIER).includes(value as ProgramTier)
}

// ============================================================
// Document Extraction Versions (V05-I04.2)
// ============================================================

/**
 * Valid extractor versions for AI document extraction
 * Format: vMAJOR.MINOR.PATCH
 * Update when extraction logic or prompts change
 */
export const EXTRACTOR_VERSION = {
  /**
   * v1.0.0: Initial extraction pipeline
   * - Basic lab value extraction
   * - Medication list extraction
   * - Confidence scoring
   */
  V1_0_0: 'v1.0.0',
} as const

export type ExtractorVersion = typeof EXTRACTOR_VERSION[keyof typeof EXTRACTOR_VERSION]

/**
 * Current extractor version (latest)
 */
export const CURRENT_EXTRACTOR_VERSION = EXTRACTOR_VERSION.V1_0_0

/**
 * Type guard to check if a value is a valid extractor version
 */
export function isValidExtractorVersion(value: unknown): value is ExtractorVersion {
  return typeof value === 'string' && Object.values(EXTRACTOR_VERSION).includes(value as ExtractorVersion)
}

// ============================================================
// Processing Stages & Status (V05-I05.1)
// ============================================================

/**
 * Valid processing stages for job orchestrator
 * Jobs progress deterministically through these stages
 */
export const PROCESSING_STAGE = {
  PENDING: 'pending',
  RISK: 'risk',
  RANKING: 'ranking',
  CONTENT: 'content',
  VALIDATION: 'validation',
  REVIEW: 'review',
  PDF: 'pdf',
  DELIVERY: 'delivery',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type ProcessingStage = typeof PROCESSING_STAGE[keyof typeof PROCESSING_STAGE]

/**
 * Valid processing statuses for job orchestrator
 */
export const PROCESSING_STATUS = {
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type ProcessingStatus = typeof PROCESSING_STATUS[keyof typeof PROCESSING_STATUS]

/**
 * Type guard to check if a value is a valid processing stage
 */
export function isValidProcessingStage(value: unknown): value is ProcessingStage {
  return typeof value === 'string' && Object.values(PROCESSING_STAGE).includes(value as ProcessingStage)
}

/**
 * Type guard to check if a value is a valid processing status
 */
export function isValidProcessingStatus(value: unknown): value is ProcessingStatus {
  return typeof value === 'string' && Object.values(PROCESSING_STATUS).includes(value as ProcessingStatus)
}
