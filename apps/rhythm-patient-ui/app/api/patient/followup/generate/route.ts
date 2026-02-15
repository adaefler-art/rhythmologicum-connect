import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { appendAskedQuestionIds, generateFollowupQuestions } from '@/lib/cre/followup/generator'
import { validateClinicalFollowup } from '@/lib/cre/followup/schema'
import { trackEvent } from '@/lib/telemetry/trackEvent.server'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'
import type { Json } from '@/lib/types/supabase'

const requestSchema = z
  .object({
    patientId: z.string().uuid().optional(),
    intakeId: z.string().uuid().optional(),
    asked_question_id: z.string().min(1).optional(),
    asked_question_ids: z.array(z.string().min(1)).optional(),
    asked_answer_text: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.patientId || value.intakeId), {
    message: 'patientId or intakeId is required',
  })

type IntakeRecord = {
  id: string
  user_id: string
  patient_id: string | null
  structured_data: Record<string, unknown>
}

const isFollowupBlockedBySafety = (structuredData: StructuredIntakeData) => {
  const safety = structuredData.safety
  if (!safety) return false

  const effectiveLevel =
    safety.effective_level ??
    safety.effective_policy_result?.escalation_level ??
    safety.policy_result?.escalation_level ??
    null

  const effectiveAction =
    safety.effective_action ??
    safety.effective_policy_result?.chat_action ??
    safety.policy_result?.chat_action ??
    'none'

  return effectiveLevel === 'A' || effectiveAction === 'hard_stop'
}

const getAskedQuestionIds = (body: z.infer<typeof requestSchema>) => {
  const all = [
    ...(body.asked_question_id ? [body.asked_question_id] : []),
    ...(body.asked_question_ids ?? []),
  ]

  return Array.from(new Set(all.map((item) => item.trim()).filter(Boolean)))
}

const looksLikeUploadQuestionId = (questionId: string) => {
  const normalized = questionId.toLowerCase()
  return (
    normalized.includes('upload') ||
    normalized.includes('hochlad') ||
    normalized.includes('arztbrief')
  )
}

const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : []

const applyAskedAnswerToStructuredData = (params: {
  structuredData: StructuredIntakeData
  askedQuestionIds: string[]
  answerText?: string
}): StructuredIntakeData => {
  const answer = params.answerText?.trim()
  if (!answer || params.askedQuestionIds.length === 0) {
    return params.structuredData
  }

  const next = { ...params.structuredData }
  const hpi = { ...(next.history_of_present_illness ?? {}) }

  for (const questionId of params.askedQuestionIds) {
    if (questionId === 'gap:chief-complaint') {
      next.chief_complaint = answer
    }

    if (questionId === 'gap:onset') {
      hpi.onset = answer
    }

    if (questionId === 'gap:duration') {
      hpi.duration = answer
    }

    if (questionId === 'gap:course') {
      hpi.course = answer
    }

    if (questionId === 'gap:medication') {
      const medication = asStringArray(next.medication)
      if (!medication.includes(answer)) {
        next.medication = [...medication, answer]
      }
    }

    if (questionId === 'gap:psychosocial') {
      const psychosocial = asStringArray(next.psychosocial_factors)
      if (!psychosocial.includes(answer)) {
        next.psychosocial_factors = [...psychosocial, answer]
      }
    }
  }

  if (Object.keys(hpi).length > 0) {
    next.history_of_present_illness = hpi
  }

  return next
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    const parseResult = requestSchema.safeParse(await req.json())
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message ?? 'Invalid request body',
          },
        },
        { status: 400 },
      )
    }

    const body = parseResult.data

    const askedQuestionIds = getAskedQuestionIds(body)
    const requestIdHeader = req.headers.get('x-request-id')

    let intakeRecord: IntakeRecord | null = null

    if (body.intakeId) {
      const { data, error } = (await supabase
        .from('clinical_intakes')
        .select('id, user_id, patient_id, structured_data')
        .eq('id', body.intakeId)
        .eq('user_id', user.id)
        .maybeSingle()) as { data: IntakeRecord | null; error: { message: string } | null }

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to load intake',
            },
          },
          { status: 500 },
        )
      }

      intakeRecord = data ?? null
    } else {
      const patientId = body.patientId
      if (!patientId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'patientId is required when intakeId is not provided',
            },
          },
          { status: 400 },
        )
      }

      const { data: profile, error: profileError } = (await supabase
        .from('patient_profiles')
        .select('id')
        .eq('id', patientId)
        .eq('user_id', user.id)
        .maybeSingle()) as { data: { id: string } | null; error: { message: string } | null }

      if (profileError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to validate patient',
            },
          },
          { status: 500 },
        )
      }

      if (!profile) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Patient not found',
            },
          },
          { status: 404 },
        )
      }

      const { data, error } = (await supabase
        .from('clinical_intakes')
        .select('id, user_id, patient_id, structured_data')
        .eq('user_id', user.id)
        .eq('patient_id', profile.id)
        .order('version_number', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()) as { data: IntakeRecord | null; error: { message: string } | null }

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to load latest intake',
            },
          },
          { status: 500 },
        )
      }

      intakeRecord = data ?? null
    }

    if (!intakeRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Clinical intake not found',
          },
        },
        { status: 404 },
      )
    }

    let structuredData = intakeRecord.structured_data as unknown as StructuredIntakeData
    structuredData = applyAskedAnswerToStructuredData({
      structuredData,
      askedQuestionIds,
      answerText: body.asked_answer_text,
    })

    if (askedQuestionIds.length > 0) {
      structuredData = appendAskedQuestionIds({
        structuredData,
        askedQuestionIds,
      })
    }

    const blocked = isFollowupBlockedBySafety(structuredData)

    const followup = blocked
      ? {
          next_questions: [],
          asked_question_ids: structuredData.followup?.asked_question_ids ?? [],
          last_generated_at: new Date().toISOString(),
        }
      : generateFollowupQuestions({ structuredData })

    const followupValidation = validateClinicalFollowup(followup)

    if (!followupValidation.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FOLLOWUP_INVALID',
            message: followupValidation.errors.join('; ') || 'Generated followup is invalid',
          },
        },
        { status: 500 },
      )
    }

    const nextStructuredData: StructuredIntakeData = {
      ...structuredData,
      followup: followupValidation.value,
    }

    const { error: updateError } = await supabase
      .from('clinical_intakes')
      .update({
        structured_data: nextStructuredData as unknown as Json,
        updated_by: user.id,
      })
      .eq('id', intakeRecord.id)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to persist followup questions',
          },
        },
        { status: 500 },
      )
    }

    const eventPromises: Array<Promise<string | null>> = []

    if (askedQuestionIds.length > 0) {
      eventPromises.push(
        trackEvent({
          patientId: intakeRecord.patient_id,
          intakeId: intakeRecord.id,
          eventType: 'followup_answered',
          requestId: requestIdHeader ? `${requestIdHeader}:followup_answered` : null,
          payload: {
            answered_count: askedQuestionIds.length,
          },
        }),
      )

      if (askedQuestionIds.some(looksLikeUploadQuestionId)) {
        eventPromises.push(
          trackEvent({
            patientId: intakeRecord.patient_id,
            intakeId: intakeRecord.id,
            eventType: 'upload_received',
            requestId: requestIdHeader ? `${requestIdHeader}:upload_received` : null,
            payload: {
              source: 'followup_answered',
            },
          }),
        )
      }
    }

    if (blocked) {
      eventPromises.push(
        trackEvent({
          patientId: intakeRecord.patient_id,
          intakeId: intakeRecord.id,
          eventType: 'hard_stop_triggered',
          requestId: requestIdHeader ? `${requestIdHeader}:hard_stop` : null,
          payload: {
            source: 'followup_generate',
          },
        }),
      )
    }

    const nextQuestions = followupValidation.value.next_questions ?? []
    if (nextQuestions.length > 0) {
      eventPromises.push(
        trackEvent({
          patientId: intakeRecord.patient_id,
          intakeId: intakeRecord.id,
          eventType: 'followup_question_shown',
          requestId: requestIdHeader ? `${requestIdHeader}:followup_shown` : null,
          payload: {
            shown_count: nextQuestions.length,
            first_question_id: nextQuestions[0]?.id ?? null,
          },
        }),
      )
    } else {
      eventPromises.push(
        trackEvent({
          patientId: intakeRecord.patient_id,
          intakeId: intakeRecord.id,
          eventType: 'followup_skipped',
          requestId: requestIdHeader ? `${requestIdHeader}:followup_skipped` : null,
          payload: {
            blocked,
          },
        }),
      )
    }

    await Promise.allSettled(eventPromises)

    return NextResponse.json({
      success: true,
      data: {
        intake_id: intakeRecord.id,
        followup: followupValidation.value,
        next_questions: followupValidation.value.next_questions,
        blocked,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unexpected error',
        },
      },
      { status: 500 },
    )
  }
}
