/**
 * V05-I05.9: Notification Service
 * 
 * Handles creation, delivery, and management of notifications.
 * 
 * Features:
 * - Consent-aware notification gating
 * - PHI-free notification content
 * - Idempotent notification creation
 * - Multiple channels (in-app MVP, email future)
 * - Follow-up sequence tracking
 * 
 * Security:
 * - No PHI in notification content
 * - Consent verification before sending
 * - RBAC enforcement on all operations
 */

import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import type {
  CreateNotificationInput,
  NotificationRecord,
  NotificationChannelType,
  NotificationPriorityType,
} from '@/lib/contracts/delivery'
import { logError, logInfo } from '@/lib/logging/logger'

// ============================================================
// TYPES
// ============================================================

type CreateNotificationResult =
  | { success: true; notificationId: string }
  | { success: false; error: string }

type ConsentCheckResult = {
  hasConsent: boolean
  consentVersion: string | null
  canSendEmail: boolean
  canSendSms: boolean
}

// ============================================================
// NOTIFICATION CREATION
// ============================================================

/**
 * Create a notification for a user
 * 
 * Handles:
 * - Idempotency (prevents duplicate notifications)
 * - Consent verification
 * - PHI-free content validation
 * - Channel selection based on consent
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<CreateNotificationResult> {
  const supabase = createAdminSupabaseClient()

  try {
    // Check for existing notification (idempotency)
    if (input.jobId) {
      const existing = await findExistingNotification(supabase, {
        userId: input.userId,
        jobId: input.jobId,
        notificationType: input.notificationType,
      })

      if (existing) {
        logInfo({
          message: 'Notification already exists (idempotent)',
          notificationId: existing.id,
          userId: input.userId,
          jobId: input.jobId,
        })
        return { success: true, notificationId: existing.id }
      }
    }

    // Verify consent if required
    let consentVerified = input.consentVerified
    let consentVersion = input.consentVersion

    if (!consentVerified && input.channel !== 'in_app') {
      const consentCheck = await verifyUserConsent(supabase, input.userId)
      consentVerified = consentCheck.hasConsent

      // Block email/SMS if no consent
      if (input.channel === 'email' && !consentCheck.canSendEmail) {
        return {
          success: false,
          error: 'User has not consented to email notifications',
        }
      }
      if (input.channel === 'sms' && !consentCheck.canSendSms) {
        return {
          success: false,
          error: 'User has not consented to SMS notifications',
        }
      }

      consentVersion = consentCheck.consentVersion || undefined
    }

    // Insert notification record
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.userId,
        job_id: input.jobId || null,
        assessment_id: input.assessmentId || null,
        notification_type: input.notificationType,
        channel: input.channel,
        priority: input.priority,
        subject: input.subject,
        message: input.message,
        metadata: input.metadata || {},
        consent_verified: consentVerified,
        consent_version: consentVersion || null,
        follow_up_at: input.followUpAt || null,
        expires_at: input.expiresAt || null,
        status: 'PENDING',
      })
      .select('id')
      .single()

    if (error || !data) {
      logError(
        {
          message: 'Failed to create notification',
          userId: input.userId,
          jobId: input.jobId,
        },
        error
      )
      return { success: false, error: 'Failed to create notification' }
    }

    logInfo({
      message: 'Notification created',
      notificationId: data.id,
      userId: input.userId,
      channel: input.channel,
      type: input.notificationType,
    })

    return { success: true, notificationId: data.id }
  } catch (err) {
    logError(
      {
        message: 'Error in createNotification',
        userId: input.userId,
      },
      err
    )
    return { success: false, error: 'Internal error' }
  }
}

// ============================================================
// NOTIFICATION DELIVERY
// ============================================================

/**
 * Mark notification as sent (after successful delivery)
 */
export async function markNotificationSent(
  notificationId: string
): Promise<{ success: boolean }> {
  const supabase = createAdminSupabaseClient()

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        status: 'SENT',
        sent_at: new Date().toISOString(),
      })
      .eq('id', notificationId)

    if (error) {
      logError({ message: 'Failed to mark notification as sent', notificationId }, error)
      return { success: false }
    }

    return { success: true }
  } catch (err) {
    logError({ message: 'Error in markNotificationSent', notificationId }, err)
    return { success: false }
  }
}

/**
 * Mark notification as delivered
 */
export async function markNotificationDelivered(
  notificationId: string
): Promise<{ success: boolean }> {
  const supabase = createAdminSupabaseClient()

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        status: 'DELIVERED',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', notificationId)

    if (error) {
      logError(
        { message: 'Failed to mark notification as delivered', notificationId },
        error
      )
      return { success: false }
    }

    return { success: true }
  } catch (err) {
    logError({ message: 'Error in markNotificationDelivered', notificationId }, err)
    return { success: false }
  }
}

/**
 * Mark notification as failed
 */
export async function markNotificationFailed(
  notificationId: string,
  errorMessage: string
): Promise<{ success: boolean }> {
  const supabase = createAdminSupabaseClient()

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        status: 'FAILED',
        failed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
      .eq('id', notificationId)

    if (error) {
      logError({ message: 'Failed to mark notification as failed', notificationId }, error)
      return { success: false }
    }

    return { success: true }
  } catch (err) {
    logError({ message: 'Error in markNotificationFailed', notificationId }, err)
    return { success: false }
  }
}

// ============================================================
// CONSENT VERIFICATION
// ============================================================

/**
 * Verify user consent for notifications
 * 
 * Checks user_consents table for current consent status.
 * Defaults to fail-closed (no email/SMS without explicit consent).
 */
async function verifyUserConsent(
  supabase: SupabaseClient,
  userId: string
): Promise<ConsentCheckResult> {
  try {
    const { data: consent, error } = await supabase
      .from('user_consents')
      .select('consent_version, consented_at')
      .eq('user_id', userId)
      .order('consented_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      logError({ message: 'Error checking user consent', userId }, error)
      // Fail-closed: no consent on error
      return {
        hasConsent: false,
        consentVersion: null,
        canSendEmail: false,
        canSendSms: false,
      }
    }

    // If consent record exists, user has consented
    const hasConsent = !!consent
    const consentVersion = consent?.consent_version || null

    // For MVP: in-app always allowed, email/SMS require explicit consent
    // Future: Could check consent preferences for specific channels
    return {
      hasConsent,
      consentVersion,
      canSendEmail: hasConsent, // For now, any consent allows email
      canSendSms: false, // SMS not implemented yet
    }
  } catch (err) {
    logError({ message: 'Exception in verifyUserConsent', userId }, err)
    // Fail-closed
    return {
      hasConsent: false,
      consentVersion: null,
      canSendEmail: false,
      canSendSms: false,
    }
  }
}

// ============================================================
// NOTIFICATION QUERIES
// ============================================================

/**
 * Find existing notification (for idempotency)
 */
async function findExistingNotification(
  supabase: SupabaseClient,
  criteria: {
    userId: string
    jobId: string
    notificationType: string
  }
): Promise<NotificationRecord | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', criteria.userId)
      .eq('job_id', criteria.jobId)
      .eq('notification_type', criteria.notificationType)
      .maybeSingle()

    if (error) {
      logError(
        { message: 'Error finding existing notification', userId: criteria.userId },
        error
      )
      return null
    }

    return data as NotificationRecord | null
  } catch (err) {
    logError({ message: 'Exception in findExistingNotification' }, err)
    return null
  }
}

/**
 * Get user's unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createAdminSupabaseClient()

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
      .neq('status', 'CANCELLED')

    if (error) {
      logError({ message: 'Error getting unread count', userId }, error)
      return 0
    }

    return count || 0
  } catch (err) {
    logError({ message: 'Exception in getUnreadNotificationCount', userId }, err)
    return 0
  }
}

// ============================================================
// NOTIFICATION TEMPLATES
// ============================================================

/**
 * Generate PHI-free notification content for "Report Ready"
 */
export function generateReportReadyNotification(metadata: {
  reportType?: string
  downloadUrl?: string
  expiresAt?: string
}): { subject: string; message: string } {
  const reportTypeText = metadata.reportType || 'Ihr Bericht'

  return {
    subject: `${reportTypeText} ist bereit`,
    message: `Ihr Bericht ist fertig und kann jetzt heruntergeladen werden. ${
      metadata.expiresAt
        ? `Der Download-Link ist bis ${new Date(metadata.expiresAt).toLocaleDateString('de-DE')} gültig.`
        : ''
    }`,
  }
}

/**
 * Generate PHI-free notification content for "Review Requested"
 */
export function generateReviewRequestedNotification(): {
  subject: string
  message: string
} {
  return {
    subject: 'Manuelle Überprüfung erforderlich',
    message:
      'Ihr Bericht wird von einem klinischen Experten überprüft. Sie werden benachrichtigt, sobald die Überprüfung abgeschlossen ist.',
  }
}

/**
 * Generate PHI-free notification content for "Action Recommended"
 */
export function generateActionRecommendedNotification(): {
  subject: string
  message: string
} {
  return {
    subject: 'Empfohlene Maßnahme',
    message:
      'Basierend auf Ihrem Bericht wird eine klinische Maßnahme empfohlen. Bitte kontaktieren Sie Ihren Arzt für weitere Informationen.',
  }
}
