/**
 * E6.4.6: Escalation Audit Logging
 *
 * Audit logging for escalation events (no PHI, correlation IDs only)
 */

import { logAuditEvent } from '@/lib/audit/log'
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE } from '@/lib/contracts/registry'
import type { EscalationOfferType, RedFlagSeverity, RedFlagSource } from '@/lib/types/escalation'

/**
 * Log escalation offer shown to patient
 *
 * @param assessmentId - Assessment ID (entity)
 * @param correlationId - Correlation ID for tracking
 * @param severity - Red flag severity
 * @param source - Red flag source
 */
export async function logEscalationOfferShown(
  assessmentId: string,
  correlationId: string,
  severity: RedFlagSeverity,
  source: RedFlagSource,
) {
  return await logAuditEvent({
    entity_type: AUDIT_ENTITY_TYPE.ASSESSMENT,
    entity_id: assessmentId,
    action: AUDIT_ACTION.FLAG,
    source: AUDIT_SOURCE.SYSTEM,
    metadata: {
      correlation_id: correlationId,
      red_flag_severity: severity,
      red_flag_source: source,
    },
  })
}

/**
 * Log escalation CTA clicked by patient
 *
 * @param assessmentId - Assessment ID (entity)
 * @param userId - User ID (actor)
 * @param correlationId - Correlation ID for tracking
 * @param offerType - Type of escalation offer clicked
 */
export async function logEscalationCtaClicked(
  assessmentId: string,
  userId: string,
  correlationId: string,
  offerType: EscalationOfferType,
) {
  return await logAuditEvent({
    entity_type: AUDIT_ENTITY_TYPE.ASSESSMENT,
    entity_id: assessmentId,
    action: AUDIT_ACTION.ESCALATE,
    source: AUDIT_SOURCE.API,
    actor_user_id: userId,
    metadata: {
      correlation_id: correlationId,
      offer_type: offerType,
    },
  })
}
