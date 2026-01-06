/**
 * Shipment Reminder Service - V05-I08.3
 * 
 * Handles automatic reminder generation for overdue shipments
 * 
 * Features:
 * - Identifies overdue shipments needing reminders
 * - Creates notifications for staff and patients
 * - Tracks reminder history to prevent spam
 * - Integrates with existing notification service
 * 
 * Server-only module
 */

import 'server-only'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { createNotification } from '@/lib/notifications/notificationService.server'
import { logInfo, logError } from '@/lib/logging/logger'
import type { DeviceShipment } from '@/lib/contracts/shipment'
import { shouldSendReminder } from '@/lib/contracts/shipment'

// ============================================================
// TYPES
// ============================================================

type SendReminderResult = {
  success: boolean
  remindersSent: number
  errors: string[]
}

type ShipmentReminderInput = {
  shipmentId: string
  patientUserId: string
  clinicianUserId?: string
  deviceType: string
  status: string
  expectedDeliveryDate: string
}

type OverdueShipmentRow = {
  id: string
  patient_id: string
  created_by_user_id: string | null
  device_type: string
  status: string
  expected_delivery_at: string | null
  last_reminder_at: string | null
  reminder_count: number | null
  patient_profiles: { user_id: string } | null
}

// ============================================================
// REMINDER SENDING
// ============================================================

/**
 * Process all overdue shipments and send reminders
 * 
 * This should be called by a scheduled job (e.g., daily cron)
 */
export async function processShipmentReminders(): Promise<SendReminderResult> {
  const supabase = createAdminSupabaseClient()
  const result: SendReminderResult = {
    success: true,
    remindersSent: 0,
    errors: [],
  }

  try {
    // Find overdue shipments that need reminders
    const { data: rawShipments, error: queryError } = await supabase
      .from('device_shipments')
      .select(
        `
        id,
        patient_id,
        created_by_user_id,
        device_type,
        status,
        expected_delivery_at,
        last_reminder_at,
        reminder_count,
        patient_profiles!device_shipments_patient_id_fkey (
          user_id
        )
      `
      )
      .not('expected_delivery_at', 'is', null)
      .lt('expected_delivery_at', new Date().toISOString())
      .not('status', 'in', '(delivered,returned,cancelled)')

    const shipments = (rawShipments ?? []) as OverdueShipmentRow[]

    if (queryError) {
      logError('Failed to query overdue shipments', {}, queryError)
      result.success = false
      result.errors.push('Failed to query shipments')
      return result
    }

    if (shipments.length === 0) {
      logInfo('No overdue shipments found')
      return result
    }

    // Filter shipments that actually need reminders (time-based logic)
    const shipmentsNeedingReminders = shipments.filter((shipment) => {
      const mockShipment = {
        id: shipment.id,
        expected_delivery_at: shipment.expected_delivery_at,
        last_reminder_at: shipment.last_reminder_at,
        status: shipment.status,
      } as unknown as DeviceShipment

      return shouldSendReminder(mockShipment)
    })

    logInfo('Processing shipment reminders', {
      totalOverdue: shipments.length,
      needingReminders: shipmentsNeedingReminders.length,
    })

    // Send reminders for each shipment
    for (const shipment of shipmentsNeedingReminders) {
      try {
        if (!shipment.patient_profiles?.user_id) {
          logError('Shipment missing patient user id for reminder', { shipmentId: shipment.id })
          result.errors.push(`Shipment ${shipment.id} missing patient user id`)
          continue
        }

        if (!shipment.expected_delivery_at) {
          logError('Shipment missing expected delivery date for reminder', { shipmentId: shipment.id })
          result.errors.push(`Shipment ${shipment.id} missing expected delivery date`)
          continue
        }

        const reminderInput: ShipmentReminderInput = {
          shipmentId: shipment.id,
          patientUserId: shipment.patient_profiles.user_id,
          clinicianUserId: shipment.created_by_user_id || undefined,
          deviceType: shipment.device_type,
          status: shipment.status,
          expectedDeliveryDate: shipment.expected_delivery_at,
        }

        const sent = await sendShipmentReminder(reminderInput)
        if (sent) {
          result.remindersSent++
        } else {
          result.errors.push(`Failed to send reminder for shipment ${shipment.id}`)
        }
      } catch (err) {
        logError('Error sending reminder for shipment', { shipmentId: shipment.id }, err)
        result.errors.push(`Error processing shipment ${shipment.id}`)
      }
    }

    logInfo('Shipment reminders processed', {
      sent: result.remindersSent,
      errors: result.errors.length,
    })

    return result
  } catch (err) {
    logError('Error in processShipmentReminders', {}, err)
    result.success = false
    result.errors.push('Internal error processing reminders')
    return result
  }
}

/**
 * Send reminder for a specific shipment
 */
export async function sendShipmentReminder(input: ShipmentReminderInput): Promise<boolean> {
  const supabase = createAdminSupabaseClient()

  try {
    // CRITICAL: Atomically check and update reminder tracking FIRST
    // This prevents race conditions where concurrent runs send duplicate notifications
    const updateTimestamp = new Date().toISOString()
    
    const { data: shouldSend, error: rpcError } = await supabase.rpc(
      'increment_reminder_count_atomic',
      {
        p_shipment_id: input.shipmentId,
        p_reminder_timestamp: updateTimestamp,
      }
    )

    if (rpcError) {
      logError('Failed to check reminder cooldown atomically', { 
        shipmentId: input.shipmentId 
      }, rpcError)
      return false
    }
    
    if (shouldSend === false) {
      // Another process already sent a reminder within cooldown period
      logInfo('Reminder skipped - already sent by another process or within cooldown', { 
        shipmentId: input.shipmentId 
      })
      return true // Return true since reminder was handled (no error)
    }

    // Only send notifications if atomic update succeeded
    // Create patient notification
    const patientNotification = await createNotification({
      userId: input.patientUserId,
      channel: 'in_app',
      notificationType: 'SHIPMENT_OVERDUE',
      priority: 'medium',
      subject: 'Geräteversand überfällig',
      message: generatePatientReminderMessage(input.deviceType, input.expectedDeliveryDate),
      metadata: {
        shipmentId: input.shipmentId,
        deviceType: input.deviceType,
        status: input.status,
      },
      consentVerified: true, // In-app notifications don't require external consent
    })

    if (!patientNotification.success) {
      logError('Failed to create patient notification', {
        shipmentId: input.shipmentId,
        userId: input.patientUserId,
      })
      return false
    }

    // Create clinician notification if available
    if (input.clinicianUserId) {
      const clinicianNotification = await createNotification({
        userId: input.clinicianUserId,
        channel: 'in_app',
        notificationType: 'SHIPMENT_OVERDUE_STAFF',
        priority: 'low',
        subject: 'Geräteversand überfällig',
        message: generateStaffReminderMessage(input.deviceType, input.expectedDeliveryDate),
        metadata: {
          shipmentId: input.shipmentId,
          deviceType: input.deviceType,
          status: input.status,
        },
        consentVerified: true,
      })

      if (!clinicianNotification.success) {
        logError('Failed to create clinician notification', {
          shipmentId: input.shipmentId,
          userId: input.clinicianUserId,
        })
        // Don't fail the whole reminder if clinician notification fails
      }
    }

    // Create shipment event
    await supabase.from('shipment_events').insert({
      shipment_id: input.shipmentId,
      event_type: 'reminder_sent',
      event_description: 'Automatische Erinnerung wegen überfälliger Lieferung gesendet',
      metadata: {
        notificationId: patientNotification.notificationId,
      },
    })

    logInfo('Shipment reminder sent', {
      shipmentId: input.shipmentId,
      patientUserId: input.patientUserId,
    })

    return true
  } catch (err) {
    logError('Error in sendShipmentReminder', { shipmentId: input.shipmentId }, err)
    return false
  }
}

// ============================================================
// MESSAGE GENERATION
// ============================================================

/**
 * Generate PHI-free reminder message for patients
 */
function generatePatientReminderMessage(deviceType: string, expectedDate: string): string {
  const formattedDate = new Date(expectedDate).toLocaleDateString('de-DE')

  return `Ihr ${deviceType} sollte am ${formattedDate} geliefert werden, ist aber noch nicht eingetroffen. Bitte prüfen Sie den Versandstatus oder kontaktieren Sie uns bei Fragen.`
}

/**
 * Generate PHI-free reminder message for staff
 */
function generateStaffReminderMessage(deviceType: string, expectedDate: string): string {
  const formattedDate = new Date(expectedDate).toLocaleDateString('de-DE')

  return `Eine ${deviceType}-Lieferung ist seit ${formattedDate} überfällig. Bitte Status prüfen und ggf. nachverfolgen.`
}

// ============================================================
// MANUAL REMINDER
// ============================================================

/**
 * Manually send a reminder for a specific shipment
 * (For use in UI or API endpoint)
 */
export async function sendManualShipmentReminder(shipmentId: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient()

  try {
    // Fetch shipment details
    const { data: shipment, error: queryError } = await supabase
      .from('device_shipments')
      .select(
        `
        id,
        device_type,
        status,
        expected_delivery_at,
        created_by_user_id,
        patient_profiles!device_shipments_patient_id_fkey (
          user_id
        )
      `
      )
      .eq('id', shipmentId)
      .single()

    if (queryError || !shipment) {
      logError('Shipment not found for manual reminder', { shipmentId })
      return false
    }

    const reminderInput: ShipmentReminderInput = {
      shipmentId: shipment.id,
      patientUserId: shipment.patient_profiles.user_id,
      clinicianUserId: shipment.created_by_user_id || undefined,
      deviceType: shipment.device_type,
      status: shipment.status,
      expectedDeliveryDate: shipment.expected_delivery_at || new Date().toISOString(),
    }

    return await sendShipmentReminder(reminderInput)
  } catch (err) {
    logError('Error in sendManualShipmentReminder', { shipmentId }, err)
    return false
  }
}
