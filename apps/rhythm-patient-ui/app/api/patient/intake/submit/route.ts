import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
  invalidInputResponse,
} from '@/lib/api/responses'
import { withIdempotency } from '@/lib/api/idempotency'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { trackEvent } from '@/lib/telemetry/trackEvent.server'
import { getUc1MissingRequiredFields } from '@/lib/clinicalIntake/uc1Completeness'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

type SubmitRequestBody = {
  intakeId?: string
}

type IntakeRow = {
  id: string
  user_id: string
  status: 'draft' | 'active' | 'superseded' | 'archived'
  metadata: Record<string, unknown> | null
  structured_data: StructuredIntakeData | null
}

/**
 * POST /api/patient/intake/submit
 * Explicitly marks latest/generated intake as submitted (active).
 * Idempotent via Idempotency-Key and status check.
 */
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request)

  let body: SubmitRequestBody | null = null
  try {
    body = (await request.json()) as SubmitRequestBody
  } catch {
    body = {}
  }

  return withIdempotency(
    request,
    {
      endpointPath: '/api/patient/intake/submit',
      checkPayloadConflict: true,
    },
    async () => handleSubmit(correlationId, body ?? {}),
    body ?? {},
  )
}

async function handleSubmit(
  correlationId: string,
  body: SubmitRequestBody,
) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorizedResponse('Authentifizierung erforderlich.', correlationId)
  }

  const intakeId = body.intakeId?.trim() || null

  if (intakeId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(intakeId)) {
    return invalidInputResponse('Ungueltige Intake-ID.', undefined, correlationId)
  }

  let intakeQuery = supabase
    .from('clinical_intakes')
    .select('id, user_id, status, metadata, structured_data')
    .eq('user_id', user.id)

  if (intakeId) {
    intakeQuery = intakeQuery.eq('id', intakeId)
  }

  const { data: intake, error: intakeError } = await intakeQuery
    .order('version_number', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle() as unknown as { data: IntakeRow | null; error: { message: string } | null }

  if (intakeError) {
    return internalErrorResponse('Fehler beim Laden des Intakes.', correlationId)
  }

  if (!intake) {
    return notFoundResponse('Intake', 'Kein uebermittelbarer Intake gefunden.', correlationId)
  }

  const missingRequiredFields = getUc1MissingRequiredFields(
    (intake.structured_data ?? { status: 'draft' }) as StructuredIntakeData,
  )

  if (missingRequiredFields.length > 0) {
    return invalidInputResponse(
      'Intake unvollstaendig. Bitte fehlende Pflichtangaben ergaenzen.',
      {
        missing_fields: missingRequiredFields,
      },
      correlationId,
    )
  }

  const submittedAt = new Date().toISOString()

  if (intake.status === 'active') {
    return successResponse(
      {
        intakeId: intake.id,
        status: intake.status,
        submittedAt,
        alreadySubmitted: true,
      },
      200,
      correlationId,
    )
  }

  const metadataBase = intake.metadata && typeof intake.metadata === 'object' ? intake.metadata : {}
  const metadata = {
    ...metadataBase,
    submitted_at: submittedAt,
    submitted_via: 'patient_dialog',
  }

  const { data: updatedIntake, error: updateError } = await supabase
    .from('clinical_intakes')
    .update({
      status: 'active',
      trigger_reason: 'submitted',
      metadata,
      updated_by: user.id,
    })
    .eq('id', intake.id)
    .eq('user_id', user.id)
    .select('id, status')
    .single() as unknown as {
    data: { id: string; status: 'draft' | 'active' | 'superseded' | 'archived' } | null
    error: { message: string; code?: string } | null
  }

  if (updateError || !updatedIntake) {
    return internalErrorResponse('Fehler beim Uebermitteln des Intakes.', correlationId)
  }

  const { data: patientProfile } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  await trackEvent({
    patientId: patientProfile?.id ?? null,
    intakeId: updatedIntake.id,
    eventType: 'session_end',
    requestId: `${correlationId}:session_end`,
    payload: {
      source: 'patient_intake_submit',
      trigger_reason: 'submitted',
    },
  })

  return successResponse(
    {
      intakeId: updatedIntake.id,
      status: updatedIntake.status,
      submittedAt,
      alreadySubmitted: false,
    },
    200,
    correlationId,
  )
}
