/**
 * Shipment Contract - V05-I08.3
 * 
 * Defines the schema for device shipment tracking with return and reminder management.
 * 
 * Key guarantees:
 * - Complete lifecycle tracking: ordered → shipped → in_transit → delivered → returned
 * - Return tracking with separate tracking numbers
 * - Reminder management for overdue shipments
 * - Event log for full audit trail
 * 
 * @module lib/contracts/shipment
 */

import { z } from 'zod'

// ============================================================
// Shipment Status
// ============================================================

export const SHIPMENT_STATUS = {
  ORDERED: 'ordered',
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
} as const

export type ShipmentStatus = typeof SHIPMENT_STATUS[keyof typeof SHIPMENT_STATUS]

export const ShipmentStatusSchema = z.enum([
  SHIPMENT_STATUS.ORDERED,
  SHIPMENT_STATUS.SHIPPED,
  SHIPMENT_STATUS.IN_TRANSIT,
  SHIPMENT_STATUS.DELIVERED,
  SHIPMENT_STATUS.RETURNED,
  SHIPMENT_STATUS.CANCELLED,
])

// ============================================================
// Shipment Event Types
// ============================================================

export const SHIPMENT_EVENT_TYPE = {
  STATUS_CHANGED: 'status_changed',
  TRACKING_UPDATED: 'tracking_updated',
  REMINDER_SENT: 'reminder_sent',
  NOTE_ADDED: 'note_added',
  RETURN_REQUESTED: 'return_requested',
  RETURN_SHIPPED: 'return_shipped',
} as const

export type ShipmentEventType = typeof SHIPMENT_EVENT_TYPE[keyof typeof SHIPMENT_EVENT_TYPE]

export const ShipmentEventTypeSchema = z.enum([
  SHIPMENT_EVENT_TYPE.STATUS_CHANGED,
  SHIPMENT_EVENT_TYPE.TRACKING_UPDATED,
  SHIPMENT_EVENT_TYPE.REMINDER_SENT,
  SHIPMENT_EVENT_TYPE.NOTE_ADDED,
  SHIPMENT_EVENT_TYPE.RETURN_REQUESTED,
  SHIPMENT_EVENT_TYPE.RETURN_SHIPPED,
])

// ============================================================
// Device Shipment Schema
// ============================================================

export const DeviceShipmentSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  task_id: z.string().uuid().nullable(),
  organization_id: z.string().uuid(),
  created_by_user_id: z.string().uuid().nullable(),
  
  // Shipment Details
  device_type: z.string(),
  device_serial_number: z.string().nullable(),
  
  // Tracking Information
  tracking_number: z.string().nullable(),
  carrier: z.string().nullable(),
  shipping_address: z.string().nullable(),
  
  // Status
  status: ShipmentStatusSchema,
  
  // Dates
  ordered_at: z.string(), // ISO datetime
  shipped_at: z.string().nullable(),
  delivered_at: z.string().nullable(),
  expected_delivery_at: z.string().nullable(),
  return_requested_at: z.string().nullable(),
  returned_at: z.string().nullable(),
  
  // Return Tracking
  return_tracking_number: z.string().nullable(),
  return_carrier: z.string().nullable(),
  return_reason: z.string().nullable(),
  
  // Reminder Tracking
  reminder_sent_at: z.string().nullable(),
  last_reminder_at: z.string().nullable(),
  reminder_count: z.number().int().min(0),
  
  // Notes
  notes: z.string().nullable(),
  
  // Metadata
  metadata: z.record(z.string(), z.any()),
  
  // Timestamps
  created_at: z.string(),
  updated_at: z.string(),
})

export type DeviceShipment = z.infer<typeof DeviceShipmentSchema>

// ============================================================
// Shipment Event Schema
// ============================================================

export const ShipmentEventSchema = z.object({
  id: z.string().uuid(),
  shipment_id: z.string().uuid(),
  created_by_user_id: z.string().uuid().nullable(),
  
  // Event Details
  event_type: z.string(),
  event_status: ShipmentStatusSchema.nullable(),
  event_description: z.string().nullable(),
  
  // Event Metadata
  location: z.string().nullable(),
  carrier: z.string().nullable(),
  tracking_number: z.string().nullable(),
  metadata: z.record(z.string(), z.any()),
  
  // Timestamps
  event_at: z.string(),
  created_at: z.string(),
})

export type ShipmentEvent = z.infer<typeof ShipmentEventSchema>

// ============================================================
// Create Shipment Request
// ============================================================

export const CreateShipmentRequestSchema = z.object({
  patient_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  device_type: z.string().min(1, 'Device type is required'),
  device_serial_number: z.string().optional(),
  tracking_number: z.string().optional(),
  carrier: z.string().optional(),
  shipping_address: z.string().optional(),
  expected_delivery_at: z.string().optional(), // ISO datetime
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type CreateShipmentRequest = z.infer<typeof CreateShipmentRequestSchema>

// ============================================================
// Update Shipment Request
// ============================================================

export const UpdateShipmentRequestSchema = z.object({
  status: ShipmentStatusSchema.optional(),
  tracking_number: z.string().optional(),
  carrier: z.string().optional(),
  shipping_address: z.string().optional(),
  device_serial_number: z.string().optional(),
  shipped_at: z.string().nullable().optional(),
  delivered_at: z.string().nullable().optional(),
  expected_delivery_at: z.string().nullable().optional(),
  return_requested_at: z.string().nullable().optional(),
  returned_at: z.string().nullable().optional(),
  return_tracking_number: z.string().nullable().optional(),
  return_carrier: z.string().nullable().optional(),
  return_reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type UpdateShipmentRequest = z.infer<typeof UpdateShipmentRequestSchema>

// ============================================================
// Create Event Request
// ============================================================

export const CreateShipmentEventRequestSchema = z.object({
  event_type: z.string(),
  event_description: z.string().optional(),
  location: z.string().optional(),
  carrier: z.string().optional(),
  tracking_number: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type CreateShipmentEventRequest = z.infer<typeof CreateShipmentEventRequestSchema>

// ============================================================
// Shipment Query Filters
// ============================================================

export const ShipmentFiltersSchema = z.object({
  patient_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  status: ShipmentStatusSchema.optional(),
  device_type: z.string().optional(),
  needs_reminder: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

export type ShipmentFilters = z.infer<typeof ShipmentFiltersSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get human-readable shipment status label (German)
 */
export function getShipmentStatusLabel(status: ShipmentStatus): string {
  switch (status) {
    case SHIPMENT_STATUS.ORDERED:
      return 'Bestellt'
    case SHIPMENT_STATUS.SHIPPED:
      return 'Versendet'
    case SHIPMENT_STATUS.IN_TRANSIT:
      return 'Unterwegs'
    case SHIPMENT_STATUS.DELIVERED:
      return 'Zugestellt'
    case SHIPMENT_STATUS.RETURNED:
      return 'Zurückgesendet'
    case SHIPMENT_STATUS.CANCELLED:
      return 'Storniert'
    default:
      return status
  }
}

/**
 * Get color class for status badge
 */
export function getShipmentStatusColor(status: ShipmentStatus): string {
  switch (status) {
    case SHIPMENT_STATUS.ORDERED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case SHIPMENT_STATUS.SHIPPED:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case SHIPMENT_STATUS.IN_TRANSIT:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    case SHIPMENT_STATUS.DELIVERED:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case SHIPMENT_STATUS.RETURNED:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    case SHIPMENT_STATUS.CANCELLED:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
  }
}

/**
 * Get human-readable event type label (German)
 */
export function getShipmentEventTypeLabel(eventType: string): string {
  switch (eventType) {
    case SHIPMENT_EVENT_TYPE.STATUS_CHANGED:
      return 'Status geändert'
    case SHIPMENT_EVENT_TYPE.TRACKING_UPDATED:
      return 'Tracking aktualisiert'
    case SHIPMENT_EVENT_TYPE.REMINDER_SENT:
      return 'Erinnerung gesendet'
    case SHIPMENT_EVENT_TYPE.NOTE_ADDED:
      return 'Notiz hinzugefügt'
    case SHIPMENT_EVENT_TYPE.RETURN_REQUESTED:
      return 'Rücksendung angefordert'
    case SHIPMENT_EVENT_TYPE.RETURN_SHIPPED:
      return 'Rücksendung versendet'
    default:
      return eventType
  }
}

/**
 * Check if shipment is overdue for delivery
 */
export function isShipmentOverdue(shipment: DeviceShipment): boolean {
  if (!shipment.expected_delivery_at) return false
  if (shipment.status === SHIPMENT_STATUS.DELIVERED) return false
  if (shipment.status === SHIPMENT_STATUS.RETURNED) return false
  if (shipment.status === SHIPMENT_STATUS.CANCELLED) return false
  
  const expectedDate = new Date(shipment.expected_delivery_at)
  const now = new Date()
  
  return now > expectedDate
}

/**
 * Check if shipment needs a reminder
 * (Overdue and no reminder sent in last 7 days)
 */
export function shouldSendReminder(shipment: DeviceShipment): boolean {
  if (!isShipmentOverdue(shipment)) return false
  
  if (!shipment.last_reminder_at) return true
  
  const lastReminder = new Date(shipment.last_reminder_at)
  const now = new Date()
  const daysSinceLastReminder = (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60 * 24)
  
  // Send reminder if more than 7 days since last reminder
  return daysSinceLastReminder >= 7
}

/**
 * Get next valid status transitions
 */
export function getValidStatusTransitions(currentStatus: ShipmentStatus): ShipmentStatus[] {
  switch (currentStatus) {
    case SHIPMENT_STATUS.ORDERED:
      return [SHIPMENT_STATUS.SHIPPED, SHIPMENT_STATUS.CANCELLED]
    case SHIPMENT_STATUS.SHIPPED:
      return [SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.CANCELLED]
    case SHIPMENT_STATUS.IN_TRANSIT:
      return [SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.CANCELLED]
    case SHIPMENT_STATUS.DELIVERED:
      return [SHIPMENT_STATUS.RETURNED]
    case SHIPMENT_STATUS.RETURNED:
      return [] // Terminal state
    case SHIPMENT_STATUS.CANCELLED:
      return [] // Terminal state
    default:
      return []
  }
}
