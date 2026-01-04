/**
 * V05-I05.9: Delivery Contracts
 * 
 * Type-safe contracts for delivery system with status-driven state machine,
 * consent-aware notifications, and idempotent delivery.
 * 
 * State Machine: NOT_READY → READY → DELIVERED (or FAILED)
 * 
 * Requirements:
 * - Delivery only if processing completed AND PDF ready
 * - RBAC/Ownership enforced on all operations
 * - Consent-aware notification gating
 * - PHI-free logging and notifications
 * - Idempotent delivery (no duplicate notifications)
 */

import { z } from 'zod'

// ============================================================
// DELIVERY STATUS ENUM
// ============================================================

/**
 * Delivery state machine states
 */
export const DeliveryStatus = {
  NOT_READY: 'NOT_READY', // Processing not complete or PDF not ready
  READY: 'READY', // Approved + PDF ready, awaiting delivery
  DELIVERED: 'DELIVERED', // Successfully delivered
  FAILED: 'FAILED', // Delivery failed (will retry)
} as const

export type DeliveryStatusType = (typeof DeliveryStatus)[keyof typeof DeliveryStatus]

// ============================================================
// NOTIFICATION ENUMS
// ============================================================

/**
 * Notification types
 */
export const NotificationType = {
  REPORT_READY: 'REPORT_READY', // Report is ready for download
  REVIEW_REQUESTED: 'REVIEW_REQUESTED', // Manual review requested
  ACTION_RECOMMENDED: 'ACTION_RECOMMENDED', // Clinical action recommended
  REPORT_UPDATED: 'REPORT_UPDATED', // Report was updated
  FOLLOW_UP_REMINDER: 'FOLLOW_UP_REMINDER', // Follow-up reminder
} as const

export type NotificationTypeType = (typeof NotificationType)[keyof typeof NotificationType]

/**
 * Notification status (delivery lifecycle)
 */
export const NotificationStatus = {
  PENDING: 'PENDING', // Created, not yet sent
  SENT: 'SENT', // Sent to delivery channel
  DELIVERED: 'DELIVERED', // Confirmed delivered
  READ: 'READ', // User has read the notification
  FAILED: 'FAILED', // Delivery failed
  CANCELLED: 'CANCELLED', // Cancelled before sending
} as const

export type NotificationStatusType =
  (typeof NotificationStatus)[keyof typeof NotificationStatus]

/**
 * Notification channels
 */
export const NotificationChannel = {
  IN_APP: 'in_app', // In-app notification (MVP)
  EMAIL: 'email', // Email notification (future)
  SMS: 'sms', // SMS notification (future)
} as const

export type NotificationChannelType =
  (typeof NotificationChannel)[keyof typeof NotificationChannel]

/**
 * Notification priority
 */
export const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

export type NotificationPriorityType =
  (typeof NotificationPriority)[keyof typeof NotificationPriority]

// ============================================================
// SCHEMAS
// ============================================================

/**
 * Delivery metadata schema (PHI-free)
 */
export const DeliveryMetadataSchema = z
  .object({
    notificationIds: z.array(z.string().uuid()).optional(),
    attemptTimestamps: z.array(z.string().datetime()).optional(),
    errors: z
      .array(
        z.object({
          code: z.string().max(50),
          message: z.string().max(200),
          timestamp: z.string().datetime(),
        })
      )
      .max(10)
      .optional(),
    lastAttemptAt: z.string().datetime().optional(),
  })
  .strict()

export type DeliveryMetadata = z.infer<typeof DeliveryMetadataSchema>

/**
 * Notification metadata schema (PHI-free, for actions/links)
 */
export const NotificationMetadataSchema = z
  .object({
    downloadUrl: z.string().url().max(500).optional(),
    expiresAt: z.string().datetime().optional(),
    actionUrl: z.string().url().max(500).optional(),
    actionLabel: z.string().max(100).optional(),
    reportType: z.string().max(50).optional(),
    pillarKey: z.string().max(50).optional(),
  })
  .strict()

export type NotificationMetadata = z.infer<typeof NotificationMetadataSchema>

/**
 * Delivery status check input
 */
export const DeliveryStatusInputSchema = z.object({
  jobId: z.string().uuid(),
})

export type DeliveryStatusInput = z.infer<typeof DeliveryStatusInputSchema>

/**
 * Delivery status check result
 */
export const DeliveryStatusResultSchema = z.object({
  jobId: z.string().uuid(),
  assessmentId: z.string().uuid(),
  deliveryStatus: z.enum(['NOT_READY', 'READY', 'DELIVERED', 'FAILED']),
  deliveryTimestamp: z.string().datetime().nullable(),
  deliveryAttempt: z.number().int().min(0).max(5),
  metadata: DeliveryMetadataSchema,
  canDeliver: z.boolean(), // Can delivery be triggered now?
  blockingReasons: z.array(z.string()).optional(), // Why delivery is blocked
})

export type DeliveryStatusResult = z.infer<typeof DeliveryStatusResultSchema>

/**
 * Trigger delivery input
 */
export const TriggerDeliveryInputSchema = z
  .object({
    jobId: z.string().uuid(),
    force: z.boolean().optional(), // Force delivery even if already delivered (admin only)
  })
  .strict()

export type TriggerDeliveryInput = z.infer<typeof TriggerDeliveryInputSchema>

/**
 * Trigger delivery result
 */
export const TriggerDeliveryResultSchema = z.discriminatedUnion('success', [
  z
    .object({
      success: z.literal(true),
      jobId: z.string().uuid(),
      deliveryStatus: z.enum(['DELIVERED']),
      deliveryTimestamp: z.string().datetime(),
      notificationIds: z.array(z.string().uuid()).max(10),
    })
    .strict(),
  z
    .object({
      success: z.literal(false),
      error: z.string().max(500),
      code: z.string().max(50),
      retryable: z.boolean(),
    })
    .strict(),
])

export type TriggerDeliveryResult = z.infer<typeof TriggerDeliveryResultSchema>

/**
 * Create notification input
 */
export const CreateNotificationInputSchema = z
  .object({
    userId: z.string().uuid(),
    jobId: z.string().uuid().optional(),
    assessmentId: z.string().uuid().optional(),
    notificationType: z.enum([
      'REPORT_READY',
      'REVIEW_REQUESTED',
      'ACTION_RECOMMENDED',
      'REPORT_UPDATED',
      'FOLLOW_UP_REMINDER',
    ]),
    channel: z.enum(['in_app', 'email', 'sms']).default('in_app'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    subject: z.string().min(1).max(200),
    message: z.string().min(1).max(2000),
    metadata: NotificationMetadataSchema.optional(),
    consentVerified: z.boolean().default(false),
    consentVersion: z.string().max(20).optional(),
    followUpAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
  })
  .strict()

export type CreateNotificationInput = z.infer<typeof CreateNotificationInputSchema>

/**
 * Notification record (from database)
 */
export const NotificationRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  jobId: z.string().uuid().nullable(),
  assessmentId: z.string().uuid().nullable(),
  notificationType: z.string(),
  status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED']),
  channel: z.enum(['in_app', 'email', 'sms']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  subject: z.string(),
  message: z.string(),
  metadata: NotificationMetadataSchema,
  consentVerified: z.boolean(),
  consentVersion: z.string().nullable(),
  sentAt: z.string().datetime().nullable(),
  deliveredAt: z.string().datetime().nullable(),
  readAt: z.string().datetime().nullable(),
  failedAt: z.string().datetime().nullable(),
  errorMessage: z.string().nullable(),
  followUpAt: z.string().datetime().nullable(),
  followUpCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
})

export type NotificationRecord = z.infer<typeof NotificationRecordSchema>

/**
 * Mark notification as read input
 */
export const MarkNotificationReadInputSchema = z.object({
  notificationId: z.string().uuid(),
})

export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadInputSchema>

/**
 * List notifications input (with filters)
 */
export const ListNotificationsInputSchema = z.object({
  userId: z.string().uuid().optional(), // Filter by user (admin/clinician only)
  status: z
    .enum(['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED'])
    .optional(),
  channel: z.enum(['in_app', 'email', 'sms']).optional(),
  unreadOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export type ListNotificationsInput = z.infer<typeof ListNotificationsInputSchema>

/**
 * List notifications result
 */
export const ListNotificationsResultSchema = z.object({
  notifications: z.array(NotificationRecordSchema),
  total: z.number().int().min(0),
  unreadCount: z.number().int().min(0),
  hasMore: z.boolean(),
})

export type ListNotificationsResult = z.infer<typeof ListNotificationsResultSchema>

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate delivery status input
 */
export function validateDeliveryStatusInput(input: unknown): DeliveryStatusInput {
  return DeliveryStatusInputSchema.parse(input)
}

/**
 * Validate trigger delivery input
 */
export function validateTriggerDeliveryInput(input: unknown): TriggerDeliveryInput {
  return TriggerDeliveryInputSchema.parse(input)
}

/**
 * Validate create notification input
 */
export function validateCreateNotificationInput(input: unknown): CreateNotificationInput {
  return CreateNotificationInputSchema.parse(input)
}

/**
 * Validate mark notification as read input
 */
export function validateMarkNotificationReadInput(input: unknown): MarkNotificationReadInput {
  return MarkNotificationReadInputSchema.parse(input)
}

/**
 * Validate list notifications input
 */
export function validateListNotificationsInput(input: unknown): ListNotificationsInput {
  return ListNotificationsInputSchema.parse(input)
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Check if delivery result is success
 */
export function isDeliverySuccess(
  result: TriggerDeliveryResult
): result is Extract<TriggerDeliveryResult, { success: true }> {
  return result.success === true
}

/**
 * Check if delivery result is failure
 */
export function isDeliveryFailure(
  result: TriggerDeliveryResult
): result is Extract<TriggerDeliveryResult, { success: false }> {
  return result.success === false
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Maximum delivery attempts before permanent failure
 */
export const MAX_DELIVERY_ATTEMPTS = 5

/**
 * Default notification expiration (7 days)
 */
export const DEFAULT_NOTIFICATION_EXPIRY_DAYS = 7

/**
 * Default follow-up delay (3 days)
 */
export const DEFAULT_FOLLOW_UP_DELAY_DAYS = 3
