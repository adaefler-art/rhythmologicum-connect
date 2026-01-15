/**
 * E6.4.8: Pilot Flow Events - Telemetry Types
 * 
 * Type definitions for minimal telemetry system.
 * PHI-safe event tracking for pilot observability.
 */

/**
 * Event types for pilot flow state transitions
 */
export type PilotEventType =
  | 'TRIAGE_SUBMITTED'
  | 'TRIAGE_ROUTED'
  | 'FUNNEL_STARTED'
  | 'FUNNEL_RESUMED'
  | 'FUNNEL_COMPLETED'
  | 'WORKUP_STARTED'
  | 'WORKUP_NEEDS_MORE_DATA'
  | 'WORKUP_READY_FOR_REVIEW'
  | 'ESCALATION_OFFER_SHOWN'
  | 'ESCALATION_OFFER_CLICKED'

/**
 * Actor role for event attribution
 */
export type EventActorRole = 'patient' | 'clinician' | 'admin' | 'system'

/**
 * PHI-safe event payload
 * 
 * Allowlist approach: only specific keys are permitted.
 * No free text, no raw symptoms, no prompt dumps.
 */
export type PilotEventPayload = {
  payloadVersion: 1
  
  // Triage-specific fields
  nextAction?: string // e.g., "funnel", "escalation"
  tier?: string // e.g., "high", "medium", "low"
  
  // Workup-specific fields
  missingDataCount?: number
  
  // Escalation-specific fields
  redFlag?: boolean
  offerType?: string // e.g., "video_consultation", "doctor_appointment"
  
  // Funnel-specific fields
  funnelSlug?: string
  stepId?: string
  stepIndex?: number
  
  // General metadata
  previousStatus?: string
  newStatus?: string
  durationMs?: number
  
  // Additional stable identifiers (no PHI)
  [key: string]: unknown
}

/**
 * Pilot flow event record
 */
export type PilotFlowEvent = {
  id: string
  created_at: string
  
  org_id?: string
  patient_id?: string
  actor_role?: EventActorRole
  
  correlation_id: string
  
  event_type: PilotEventType
  entity_type: string
  entity_id: string
  
  from_state?: string
  to_state?: string
  
  payload_json: PilotEventPayload
  payload_hash?: string
}

/**
 * Input for creating a new pilot flow event
 */
export type CreatePilotEventInput = {
  correlationId: string
  eventType: PilotEventType
  entityType: string
  entityId: string
  
  orgId?: string
  patientId?: string
  actorRole?: EventActorRole
  
  fromState?: string
  toState?: string
  
  payload?: Omit<PilotEventPayload, 'payloadVersion'>
}

/**
 * Query options for retrieving pilot flow events
 */
export type PilotEventQueryOptions = {
  patientId?: string
  correlationId?: string
  entityType?: string
  entityId?: string
  eventType?: PilotEventType
  limit?: number
  offset?: number
}
