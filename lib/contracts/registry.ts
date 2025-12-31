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
// Funnel Slugs
// ============================================================

/**
 * Valid funnel slugs
 * The canonical slug is the primary identifier
 * Legacy aliases are maintained for backward compatibility
 */
export const FUNNEL_SLUG = {
  STRESS_ASSESSMENT: 'stress-assessment',
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
