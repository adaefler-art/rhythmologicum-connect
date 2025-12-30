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
 */
export const FUNNEL_SLUG_ALIASES: Record<string, string> = {
  [FUNNEL_SLUG.STRESS]: FUNNEL_SLUG.STRESS_ASSESSMENT,
  [FUNNEL_SLUG.STRESS_CHECK]: FUNNEL_SLUG.STRESS_ASSESSMENT,
  [FUNNEL_SLUG.STRESS_CHECK_V2]: FUNNEL_SLUG.STRESS_ASSESSMENT,
}

/**
 * Resolves a funnel slug to its canonical form
 */
export function getCanonicalFunnelSlug(slug: string): string {
  return FUNNEL_SLUG_ALIASES[slug] || slug
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
