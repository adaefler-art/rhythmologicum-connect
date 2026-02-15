import 'server-only'

import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

export const PATIENT_EVENT_TYPES = [
  'session_start',
  'session_end',
  'followup_question_shown',
  'followup_answered',
  'followup_skipped',
  'intake_regen_triggered',
  'hard_stop_triggered',
  'override_set',
  'review_created',
  'upload_requested',
  'upload_received',
] as const

export type PatientEventType = (typeof PATIENT_EVENT_TYPES)[number]

type TrackEventInput = {
  patientId?: string | null
  intakeId?: string | null
  eventType: PatientEventType
  payload?: Record<string, unknown>
  requestId?: string | null
  createdAt?: string
}

const sanitizePayload = (payload?: Record<string, unknown>) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {}
  }
  return payload
}

export async function trackEvent(input: TrackEventInput): Promise<string | null> {
  try {
    const admin = createAdminSupabaseClient()

    const { data, error } = await admin
      .from('patient_events' as any)
      .insert({
        patient_id: input.patientId ?? null,
        intake_id: input.intakeId ?? null,
        event_type: input.eventType,
        payload: sanitizePayload(input.payload),
        request_id: input.requestId ?? null,
        created_at: input.createdAt ?? undefined,
      })
      .select('id')
      .single()

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        return null
      }
      console.warn('[telemetry/trackEvent] Failed to persist patient event', {
        eventType: input.eventType,
        intakeId: input.intakeId,
        patientId: input.patientId,
        error: error.message,
      })
      return null
    }

    return (data as { id?: string } | null)?.id ?? null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (
      message.includes('SUPABASE_SERVICE_ROLE_KEY is not configured') ||
      message.includes('NEXT_PUBLIC_SUPABASE_URL is not configured')
    ) {
      return null
    }

    console.warn('[telemetry/trackEvent] Unexpected error while persisting patient event', {
      eventType: input.eventType,
      intakeId: input.intakeId,
      patientId: input.patientId,
      error: message,
    })
    return null
  }
}
