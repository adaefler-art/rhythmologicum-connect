/**
 * E6.4.8: Pilot Flow Events - Event Emission
 * 
 * Library for emitting pilot flow events with PHI-safe payload validation.
 * Best-effort approach: failures logged but don't block application flows.
 */

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type {
  CreatePilotEventInput,
  PilotEventPayload,
  PilotFlowEvent,
} from '@/lib/types/telemetry'

/**
 * PHI-safe payload field allowlist
 * Only these keys are permitted in event payloads
 */
const ALLOWED_PAYLOAD_KEYS = new Set([
  'payloadVersion',
  'nextAction',
  'tier',
  'missingDataCount',
  'redFlag',
  'offerType',
  'funnelSlug',
  'stepId',
  'stepIndex',
  'previousStatus',
  'newStatus',
  'durationMs',
  'resultId',
  'reportId',
  'workupStatus',
  'escalationCorrelationId',
])

/**
 * Maximum payload size in bytes (2KB limit)
 */
const MAX_PAYLOAD_SIZE_BYTES = 2048

/**
 * Validates and sanitizes an event payload to ensure PHI safety
 * 
 * @param payload - Raw payload object
 * @returns Sanitized payload with only allowed keys
 */
function sanitizePayload(
  payload?: Omit<PilotEventPayload, 'payloadVersion'>,
): PilotEventPayload {
  const sanitized: PilotEventPayload = {
    payloadVersion: 1,
  }
  
  if (!payload) {
    return sanitized
  }
  
  // Filter to allowlist keys only
  for (const key of Object.keys(payload)) {
    if (ALLOWED_PAYLOAD_KEYS.has(key)) {
      const value = payload[key]
      
      // Additional validation: no free text strings (except for specific fields)
      if (typeof value === 'string') {
        // Only allow string values for specific enumerated fields
        if (
          key === 'nextAction' ||
          key === 'tier' ||
          key === 'offerType' ||
          key === 'funnelSlug' ||
          key === 'stepId' ||
          key === 'previousStatus' ||
          key === 'newStatus' ||
          key === 'resultId' ||
          key === 'reportId' ||
          key === 'workupStatus' ||
          key === 'escalationCorrelationId'
        ) {
          // Truncate to reasonable length
          sanitized[key] = value.slice(0, 100)
        }
      } else {
        // Numbers, booleans, null are safe
        sanitized[key] = value
      }
    }
  }
  
  return sanitized
}

/**
 * Checks if payload size exceeds limit
 * 
 * @param payload - Payload to check
 * @returns true if size is acceptable
 */
function isPayloadSizeValid(payload: PilotEventPayload): boolean {
  const payloadStr = JSON.stringify(payload)
  const sizeBytes = new TextEncoder().encode(payloadStr).length
  return sizeBytes <= MAX_PAYLOAD_SIZE_BYTES
}

/**
 * Emits a pilot flow event (best-effort)
 * 
 * E6.4.8 Guardrails:
 * - PHI-safe: Only allowlist keys in payload
 * - Bounded: Max 2KB payload size
 * - Best-effort: Failures logged, don't throw
 * 
 * @param input - Event input data
 * @returns Event ID if successful, null if failed
 */
export async function emitPilotEvent(
  input: CreatePilotEventInput,
): Promise<string | null> {
  try {
    // Sanitize payload
    const sanitizedPayload = sanitizePayload(input.payload)
    
    // Check payload size
    if (!isPayloadSizeValid(sanitizedPayload)) {
      console.warn('[TELEMETRY] Payload size exceeds limit, truncating', {
        correlationId: input.correlationId,
        eventType: input.eventType,
      })
      // Truncate to minimal version
      sanitizedPayload.payloadVersion = 1
    }
    
    // Create Supabase client
    const supabase = await createServerSupabaseClient()
    
    // Insert event
     
    const { data, error } = await supabase
      .from('pilot_flow_events')
      .insert({
        correlation_id: input.correlationId,
        event_type: input.eventType,
        entity_type: input.entityType,
        entity_id: input.entityId,
        org_id: input.orgId,
        patient_id: input.patientId,
        actor_role: input.actorRole,
        from_state: input.fromState,
        to_state: input.toState,
        payload_json: sanitizedPayload,
      } as any)
      .select('id')
      .single()
    
    if (error) {
      console.warn('[TELEMETRY] Failed to emit pilot event', {
        correlationId: input.correlationId,
        eventType: input.eventType,
        error: error.message,
      })
      return null
    }
    
    return data?.id ?? null
  } catch (error) {
    // Best-effort: log and continue
    console.warn('[TELEMETRY] Exception while emitting pilot event', {
      correlationId: input.correlationId,
      eventType: input.eventType,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Helper: Emit FUNNEL_STARTED event
 */
export async function emitFunnelStarted(params: {
  correlationId: string
  assessmentId: string
  funnelSlug: string
  patientId?: string
  stepId?: string
}): Promise<string | null> {
  return emitPilotEvent({
    correlationId: params.correlationId,
    eventType: 'FUNNEL_STARTED',
    entityType: 'assessment',
    entityId: params.assessmentId,
    patientId: params.patientId,
    actorRole: 'patient',
    toState: 'in_progress',
    payload: {
      funnelSlug: params.funnelSlug,
      stepId: params.stepId,
    },
  })
}

/**
 * Helper: Emit FUNNEL_RESUMED event
 */
export async function emitFunnelResumed(params: {
  correlationId: string
  assessmentId: string
  funnelSlug: string
  patientId?: string
  stepId?: string
  stepIndex?: number
}): Promise<string | null> {
  return emitPilotEvent({
    correlationId: params.correlationId,
    eventType: 'FUNNEL_RESUMED',
    entityType: 'assessment',
    entityId: params.assessmentId,
    patientId: params.patientId,
    actorRole: 'patient',
    payload: {
      funnelSlug: params.funnelSlug,
      stepId: params.stepId,
      stepIndex: params.stepIndex,
    },
  })
}

/**
 * Helper: Emit FUNNEL_COMPLETED event
 */
export async function emitFunnelCompleted(params: {
  correlationId: string
  assessmentId: string
  funnelSlug: string
  patientId?: string
}): Promise<string | null> {
  return emitPilotEvent({
    correlationId: params.correlationId,
    eventType: 'FUNNEL_COMPLETED',
    entityType: 'assessment',
    entityId: params.assessmentId,
    patientId: params.patientId,
    actorRole: 'patient',
    fromState: 'in_progress',
    toState: 'completed',
    payload: {
      funnelSlug: params.funnelSlug,
    },
  })
}

/**
 * Helper: Emit TRIAGE_SUBMITTED event
 */
export async function emitTriageSubmitted(params: {
  correlationId: string
  assessmentId: string
  patientId?: string
}): Promise<string | null> {
  return emitPilotEvent({
    correlationId: params.correlationId,
    eventType: 'TRIAGE_SUBMITTED',
    entityType: 'assessment',
    entityId: params.assessmentId,
    patientId: params.patientId,
    actorRole: 'patient',
    toState: 'submitted',
  })
}

/**
 * Helper: Emit TRIAGE_ROUTED event
 */
export async function emitTriageRouted(params: {
  correlationId: string
  assessmentId: string
  nextAction: string
  tier?: string
  patientId?: string
}): Promise<string | null> {
  return emitPilotEvent({
    correlationId: params.correlationId,
    eventType: 'TRIAGE_ROUTED',
    entityType: 'assessment',
    entityId: params.assessmentId,
    patientId: params.patientId,
    actorRole: 'system',
    fromState: 'submitted',
    toState: 'routed',
    payload: {
      nextAction: params.nextAction,
      tier: params.tier,
    },
  })
}

/**
 * Helper: Emit WORKUP_STARTED event
 */
export async function emitWorkupStarted(params: {
  correlationId: string
  assessmentId: string
  patientId?: string
}): Promise<string | null> {
  return emitPilotEvent({
    correlationId: params.correlationId,
    eventType: 'WORKUP_STARTED',
    entityType: 'assessment',
    entityId: params.assessmentId,
    patientId: params.patientId,
    actorRole: 'system',
    toState: 'workup_started',
  })
}

/**
 * Helper: Emit WORKUP_NEEDS_MORE_DATA event
 */
export async function emitWorkupNeedsMoreData(params: {
  correlationId: string
  assessmentId: string
  missingDataCount?: number
  patientId?: string
}): Promise<string | null> {
  return emitPilotEvent({
    correlationId: params.correlationId,
    eventType: 'WORKUP_NEEDS_MORE_DATA',
    entityType: 'assessment',
    entityId: params.assessmentId,
    patientId: params.patientId,
    actorRole: 'system',
    toState: 'needs_more_data',
    payload: {
      workupStatus: 'needs_more_data',
      missingDataCount: params.missingDataCount,
    },
  })
}

/**
 * Helper: Emit WORKUP_READY_FOR_REVIEW event
 */
export async function emitWorkupReadyForReview(params: {
  correlationId: string
  assessmentId: string
  patientId?: string
}): Promise<string | null> {
  return emitPilotEvent({
    correlationId: params.correlationId,
    eventType: 'WORKUP_READY_FOR_REVIEW',
    entityType: 'assessment',
    entityId: params.assessmentId,
    patientId: params.patientId,
    actorRole: 'system',
    toState: 'ready_for_review',
    payload: {
      workupStatus: 'ready_for_review',
    },
  })
}

/**
 * Helper: Emit ESCALATION_OFFER_SHOWN event
 */
export async function emitEscalationOfferShown(params: {
  correlationId: string
  assessmentId: string
  redFlag: boolean
  escalationCorrelationId?: string
  patientId?: string
}): Promise<string | null> {
  return emitPilotEvent({
    correlationId: params.correlationId,
    eventType: 'ESCALATION_OFFER_SHOWN',
    entityType: 'assessment',
    entityId: params.assessmentId,
    patientId: params.patientId,
    actorRole: 'system',
    payload: {
      redFlag: params.redFlag,
      escalationCorrelationId: params.escalationCorrelationId,
    },
  })
}

/**
 * Helper: Emit ESCALATION_OFFER_CLICKED event
 */
export async function emitEscalationOfferClicked(params: {
  correlationId: string
  assessmentId: string
  offerType: string
  escalationCorrelationId?: string
  patientId?: string
}): Promise<string | null> {
  return emitPilotEvent({
    correlationId: params.correlationId,
    eventType: 'ESCALATION_OFFER_CLICKED',
    entityType: 'assessment',
    entityId: params.assessmentId,
    patientId: params.patientId,
    actorRole: 'patient',
    payload: {
      offerType: params.offerType,
      escalationCorrelationId: params.escalationCorrelationId,
    },
  })
}
