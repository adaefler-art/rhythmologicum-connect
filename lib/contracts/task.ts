/**
 * Task Contract - V05-I07.4
 * 
 * Defines the schema for task management with role-based assignment.
 * Supports task types: LDL measurement, video calls, device shipment, etc.
 * 
 * Key guarantees:
 * - RBAC: Role-based assignment (nurse/clinician)
 * - Auditable: Full task lifecycle tracking
 * - Status tracking: pending → in_progress → completed/cancelled
 * 
 * @module lib/contracts/task
 */

import { z } from 'zod'

// ============================================================
// Task Status
// ============================================================

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS]

export const TaskStatusSchema = z.enum([
  TASK_STATUS.PENDING,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.COMPLETED,
  TASK_STATUS.CANCELLED,
])

// ============================================================
// Task Type
// ============================================================

export const TASK_TYPE = {
  LDL_MEASUREMENT: 'ldl_measurement',
  VIDEO_CALL: 'video_call',
  DEVICE_SHIPMENT: 'device_shipment',
  FOLLOW_UP: 'follow_up',
  REVIEW_ASSESSMENT: 'review_assessment',
  CONTACT_PATIENT: 'contact_patient',
  SUPPORT_CASE: 'support_case', // V05-I08.4: Support case escalation
} as const

export type TaskType = typeof TASK_TYPE[keyof typeof TASK_TYPE]

export const TaskTypeSchema = z.enum([
  TASK_TYPE.LDL_MEASUREMENT,
  TASK_TYPE.VIDEO_CALL,
  TASK_TYPE.DEVICE_SHIPMENT,
  TASK_TYPE.FOLLOW_UP,
  TASK_TYPE.REVIEW_ASSESSMENT,
  TASK_TYPE.CONTACT_PATIENT,
  TASK_TYPE.SUPPORT_CASE,
])

// ============================================================
// User Role (for assignment)
// ============================================================

export const USER_ROLE = {
  CLINICIAN: 'clinician',
  NURSE: 'nurse',
  ADMIN: 'admin',
} as const

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE]

export const UserRoleSchema = z.enum([
  USER_ROLE.CLINICIAN,
  USER_ROLE.NURSE,
  USER_ROLE.ADMIN,
])

// ============================================================
// Task Payload Schemas
// ============================================================

/**
 * Payload for LDL measurement task
 */
export const LDLMeasurementPayloadSchema = z.object({
  instructions: z.string().optional(),
  target_date: z.string().optional(), // ISO date string
})

/**
 * Payload for video call task
 */
export const VideoCallPayloadSchema = z.object({
  meeting_link: z.string().url().optional(),
  scheduled_time: z.string().optional(), // ISO datetime string
  duration_minutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
})

/**
 * Payload for device shipment task
 */
export const DeviceShipmentPayloadSchema = z.object({
  device_type: z.string(),
  tracking_number: z.string().optional(),
  shipping_address: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * Generic payload for other task types
 */
export const GenericTaskPayloadSchema = z.object({
  description: z.string().optional(),
  notes: z.string().optional(),
})

// ============================================================
// Task Schema
// ============================================================

export const TaskSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  assessment_id: z.string().uuid().nullable(),
  created_by_role: UserRoleSchema.nullable(),
  assigned_to_role: UserRoleSchema,
  assigned_to_user_id: z.string().uuid().nullable(),
  task_type: TaskTypeSchema,
  payload: z.record(z.string(), z.any()), // JSONB - flexible payload
  status: TaskStatusSchema,
  due_at: z.string().nullable(), // ISO datetime string
  created_at: z.string(),
  updated_at: z.string().nullable(),
})

export type Task = z.infer<typeof TaskSchema>

// ============================================================
// Create Task Request
// ============================================================

export const CreateTaskRequestSchema = z.object({
  patient_id: z.string().uuid(),
  assessment_id: z.string().uuid().optional(),
  assigned_to_role: UserRoleSchema,
  assigned_to_user_id: z.string().uuid().optional(),
  task_type: TaskTypeSchema,
  payload: z.record(z.string(), z.any()).optional(),
  due_at: z.string().optional(), // ISO datetime string
})

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>

// ============================================================
// Update Task Request
// ============================================================

export const UpdateTaskRequestSchema = z.object({
  status: TaskStatusSchema.optional(),
  payload: z.record(z.string(), z.any()).optional(),
  due_at: z.string().nullable().optional(),
})

export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>

// ============================================================
// Task Query Filters
// ============================================================

export const TaskFiltersSchema = z.object({
  patient_id: z.string().uuid().optional(),
  assessment_id: z.string().uuid().optional(),
  assigned_to_role: UserRoleSchema.optional(),
  task_type: TaskTypeSchema.optional(),
  status: TaskStatusSchema.optional(),
})

export type TaskFilters = z.infer<typeof TaskFiltersSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get human-readable task type label
 */
export function getTaskTypeLabel(taskType: TaskType): string {
  switch (taskType) {
    case TASK_TYPE.LDL_MEASUREMENT:
      return 'LDL-Messung'
    case TASK_TYPE.VIDEO_CALL:
      return 'Video-Call'
    case TASK_TYPE.DEVICE_SHIPMENT:
      return 'Geräteversand'
    case TASK_TYPE.FOLLOW_UP:
      return 'Follow-up'
    case TASK_TYPE.REVIEW_ASSESSMENT:
      return 'Assessment prüfen'
    case TASK_TYPE.CONTACT_PATIENT:
      return 'Patient kontaktieren'
    case TASK_TYPE.SUPPORT_CASE:
      return 'Support-Fall'
    default:
      return taskType
  }
}

/**
 * Get human-readable task status label
 */
export function getTaskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case TASK_STATUS.PENDING:
      return 'Ausstehend'
    case TASK_STATUS.IN_PROGRESS:
      return 'In Bearbeitung'
    case TASK_STATUS.COMPLETED:
      return 'Abgeschlossen'
    case TASK_STATUS.CANCELLED:
      return 'Abgebrochen'
    default:
      return status
  }
}

/**
 * Get human-readable user role label
 */
export function getUserRoleLabel(role: UserRole): string {
  switch (role) {
    case USER_ROLE.CLINICIAN:
      return 'Arzt/Ärztin'
    case USER_ROLE.NURSE:
      return 'Pflegekraft'
    case USER_ROLE.ADMIN:
      return 'Administrator'
    default:
      return role
  }
}
