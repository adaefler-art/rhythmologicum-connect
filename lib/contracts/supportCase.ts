/**
 * Support Case Contract - V05-I08.4
 * 
 * Defines the schema for support case management with escalation workflow.
 * Supports categories: technical, medical, administrative, billing, general
 * 
 * Key guarantees:
 * - RBAC: Role-based access (patient/nurse/clinician/admin)
 * - Auditable: Full case lifecycle tracking
 * - Escalation: Creates task + audit entry when escalated
 * - PHI-safe: Subject/description can contain PHI (handled by RLS)
 * 
 * @module lib/contracts/supportCase
 */

import { z } from 'zod'

// ============================================================
// Support Case Status
// ============================================================

export const SUPPORT_CASE_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const

export type SupportCaseStatus = typeof SUPPORT_CASE_STATUS[keyof typeof SUPPORT_CASE_STATUS]

export const SupportCaseStatusSchema = z.enum([
  SUPPORT_CASE_STATUS.OPEN,
  SUPPORT_CASE_STATUS.IN_PROGRESS,
  SUPPORT_CASE_STATUS.ESCALATED,
  SUPPORT_CASE_STATUS.RESOLVED,
  SUPPORT_CASE_STATUS.CLOSED,
])

// ============================================================
// Support Case Priority
// ============================================================

export const SUPPORT_CASE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

export type SupportCasePriority = typeof SUPPORT_CASE_PRIORITY[keyof typeof SUPPORT_CASE_PRIORITY]

export const SupportCasePrioritySchema = z.enum([
  SUPPORT_CASE_PRIORITY.LOW,
  SUPPORT_CASE_PRIORITY.MEDIUM,
  SUPPORT_CASE_PRIORITY.HIGH,
  SUPPORT_CASE_PRIORITY.URGENT,
])

// ============================================================
// Support Case Category
// ============================================================

export const SUPPORT_CASE_CATEGORY = {
  TECHNICAL: 'technical',
  MEDICAL: 'medical',
  ADMINISTRATIVE: 'administrative',
  BILLING: 'billing',
  GENERAL: 'general',
  OTHER: 'other',
} as const

export type SupportCaseCategory = typeof SUPPORT_CASE_CATEGORY[keyof typeof SUPPORT_CASE_CATEGORY]

export const SupportCaseCategorySchema = z.enum([
  SUPPORT_CASE_CATEGORY.TECHNICAL,
  SUPPORT_CASE_CATEGORY.MEDICAL,
  SUPPORT_CASE_CATEGORY.ADMINISTRATIVE,
  SUPPORT_CASE_CATEGORY.BILLING,
  SUPPORT_CASE_CATEGORY.GENERAL,
  SUPPORT_CASE_CATEGORY.OTHER,
])

// ============================================================
// Support Case Schema
// ============================================================

export const SupportCaseSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  organization_id: z.string().uuid().nullable(),
  created_by_user_id: z.string().uuid().nullable(),
  assigned_to_user_id: z.string().uuid().nullable(),
  escalated_task_id: z.string().uuid().nullable(),
  
  category: SupportCaseCategorySchema,
  priority: SupportCasePrioritySchema,
  status: SupportCaseStatusSchema,
  
  subject: z.string(),
  description: z.string().nullable(),
  notes: z.string().nullable(),
  resolution_notes: z.string().nullable(),
  
  metadata: z.record(z.string(), z.any()),
  
  escalated_at: z.string().nullable(),
  escalated_by_user_id: z.string().uuid().nullable(),
  
  created_at: z.string(),
  updated_at: z.string().nullable(),
  resolved_at: z.string().nullable(),
  closed_at: z.string().nullable(),
})

export type SupportCase = z.infer<typeof SupportCaseSchema>

// ============================================================
// Create Support Case Request
// ============================================================

export const CreateSupportCaseRequestSchema = z.object({
  patient_id: z.string().uuid(),
  category: SupportCaseCategorySchema.optional(),
  priority: SupportCasePrioritySchema.optional(),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type CreateSupportCaseRequest = z.infer<typeof CreateSupportCaseRequestSchema>

// ============================================================
// Update Support Case Request
// ============================================================

export const UpdateSupportCaseRequestSchema = z.object({
  status: SupportCaseStatusSchema.optional(),
  priority: SupportCasePrioritySchema.optional(),
  assigned_to_user_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type UpdateSupportCaseRequest = z.infer<typeof UpdateSupportCaseRequestSchema>

// ============================================================
// Escalate Support Case Request
// ============================================================

export const EscalateSupportCaseRequestSchema = z.object({
  assigned_to_role: z.enum(['clinician', 'admin']),
  assigned_to_user_id: z.string().uuid().optional(),
  escalation_notes: z.string().optional(),
  task_due_at: z.string().optional(), // ISO datetime string
})

export type EscalateSupportCaseRequest = z.infer<typeof EscalateSupportCaseRequestSchema>

// ============================================================
// Support Case Query Filters
// ============================================================

export const SupportCaseFiltersSchema = z.object({
  patient_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  assigned_to_user_id: z.string().uuid().optional(),
  category: SupportCaseCategorySchema.optional(),
  priority: SupportCasePrioritySchema.optional(),
  status: SupportCaseStatusSchema.optional(),
  is_escalated: z.boolean().optional(),
})

export type SupportCaseFilters = z.infer<typeof SupportCaseFiltersSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get human-readable status label (German)
 */
export function getSupportCaseStatusLabel(status: SupportCaseStatus): string {
  switch (status) {
    case SUPPORT_CASE_STATUS.OPEN:
      return 'Offen'
    case SUPPORT_CASE_STATUS.IN_PROGRESS:
      return 'In Bearbeitung'
    case SUPPORT_CASE_STATUS.ESCALATED:
      return 'Eskaliert'
    case SUPPORT_CASE_STATUS.RESOLVED:
      return 'Gelöst'
    case SUPPORT_CASE_STATUS.CLOSED:
      return 'Geschlossen'
    default:
      return status
  }
}

/**
 * Get color class for status badge
 */
export function getSupportCaseStatusColor(status: SupportCaseStatus): string {
  switch (status) {
    case SUPPORT_CASE_STATUS.OPEN:
      return 'bg-blue-100 text-blue-800'
    case SUPPORT_CASE_STATUS.IN_PROGRESS:
      return 'bg-yellow-100 text-yellow-800'
    case SUPPORT_CASE_STATUS.ESCALATED:
      return 'bg-red-100 text-red-800'
    case SUPPORT_CASE_STATUS.RESOLVED:
      return 'bg-green-100 text-green-800'
    case SUPPORT_CASE_STATUS.CLOSED:
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get human-readable priority label (German)
 */
export function getSupportCasePriorityLabel(priority: SupportCasePriority): string {
  switch (priority) {
    case SUPPORT_CASE_PRIORITY.LOW:
      return 'Niedrig'
    case SUPPORT_CASE_PRIORITY.MEDIUM:
      return 'Mittel'
    case SUPPORT_CASE_PRIORITY.HIGH:
      return 'Hoch'
    case SUPPORT_CASE_PRIORITY.URGENT:
      return 'Dringend'
    default:
      return priority
  }
}

/**
 * Get color class for priority badge
 */
export function getSupportCasePriorityColor(priority: SupportCasePriority): string {
  switch (priority) {
    case SUPPORT_CASE_PRIORITY.LOW:
      return 'bg-gray-100 text-gray-800'
    case SUPPORT_CASE_PRIORITY.MEDIUM:
      return 'bg-blue-100 text-blue-800'
    case SUPPORT_CASE_PRIORITY.HIGH:
      return 'bg-orange-100 text-orange-800'
    case SUPPORT_CASE_PRIORITY.URGENT:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get human-readable category label (German)
 */
export function getSupportCaseCategoryLabel(category: SupportCaseCategory): string {
  switch (category) {
    case SUPPORT_CASE_CATEGORY.TECHNICAL:
      return 'Technisch'
    case SUPPORT_CASE_CATEGORY.MEDICAL:
      return 'Medizinisch'
    case SUPPORT_CASE_CATEGORY.ADMINISTRATIVE:
      return 'Administrativ'
    case SUPPORT_CASE_CATEGORY.BILLING:
      return 'Abrechnung'
    case SUPPORT_CASE_CATEGORY.GENERAL:
      return 'Allgemein'
    case SUPPORT_CASE_CATEGORY.OTHER:
      return 'Sonstiges'
    default:
      return category
  }
}

/**
 * Check if a support case can be escalated
 */
export function canEscalateSupportCase(supportCase: SupportCase): boolean {
  return (
    supportCase.status !== SUPPORT_CASE_STATUS.ESCALATED &&
    supportCase.status !== SUPPORT_CASE_STATUS.CLOSED &&
    !supportCase.escalated_task_id
  )
}

/**
 * Check if a support case can be resolved
 */
export function canResolveSupportCase(supportCase: SupportCase): boolean {
  return (
    supportCase.status !== SUPPORT_CASE_STATUS.RESOLVED &&
    supportCase.status !== SUPPORT_CASE_STATUS.CLOSED
  )
}

/**
 * Check if a support case can be closed
 */
export function canCloseSupportCase(supportCase: SupportCase): boolean {
  return supportCase.status !== SUPPORT_CASE_STATUS.CLOSED
}

/**
 * Get valid status transitions for a support case
 */
export function getValidSupportCaseStatusTransitions(
  currentStatus: SupportCaseStatus,
): SupportCaseStatus[] {
  switch (currentStatus) {
    case SUPPORT_CASE_STATUS.OPEN:
      return [
        SUPPORT_CASE_STATUS.IN_PROGRESS,
        SUPPORT_CASE_STATUS.ESCALATED,
        SUPPORT_CASE_STATUS.RESOLVED,
        SUPPORT_CASE_STATUS.CLOSED,
      ]
    case SUPPORT_CASE_STATUS.IN_PROGRESS:
      return [
        SUPPORT_CASE_STATUS.ESCALATED,
        SUPPORT_CASE_STATUS.RESOLVED,
        SUPPORT_CASE_STATUS.CLOSED,
      ]
    case SUPPORT_CASE_STATUS.ESCALATED:
      return [
        SUPPORT_CASE_STATUS.IN_PROGRESS,
        SUPPORT_CASE_STATUS.RESOLVED,
        SUPPORT_CASE_STATUS.CLOSED,
      ]
    case SUPPORT_CASE_STATUS.RESOLVED:
      return [SUPPORT_CASE_STATUS.CLOSED, SUPPORT_CASE_STATUS.OPEN]
    case SUPPORT_CASE_STATUS.CLOSED:
      return [SUPPORT_CASE_STATUS.OPEN] // Can reopen if needed
    default:
      return []
  }
}
