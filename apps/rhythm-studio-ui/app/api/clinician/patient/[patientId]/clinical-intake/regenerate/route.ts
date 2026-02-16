import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { getClinicalIntakePrompt, CLINICAL_INTAKE_PROMPT_VERSION } from '@/lib/llm/prompts'
import { getEngineEnv } from '@/lib/env'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

type IntakePayload = {
  STRUCTURED_INTAKE: Record<string, unknown>
  CLINICAL_SUMMARY: string
}

type ParseResult =
  | {
      ok: true
      payload: IntakePayload
    }
  | {
      ok: false
      code: 'OUTPUT_JSON_MISSING' | 'OUTPUT_JSON_INVALID' | 'OUTPUT_JSON_PARSE_ERROR'
    }

const MODEL_FALLBACK = 'claude-sonnet-4-5-20250929'
const MAX_TOKENS = 2000

const getUserRole = (user: {
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}) => {
  const appRole = user.app_metadata?.role
  if (typeof appRole === 'string') return appRole
  const userRole = user.user_metadata?.role
  if (typeof userRole === 'string') return userRole
  return null
}

const parseIntakeOutput = (text: string): ParseResult => {
  const jsonMarker = text.indexOf('OUTPUT_JSON')
  if (jsonMarker === -1) {
    return { ok: false, code: 'OUTPUT_JSON_MISSING' }
  }

  const afterMarker = text.slice(jsonMarker)
  const jsonStart = afterMarker.indexOf('{')
  const jsonEnd = afterMarker.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return { ok: false, code: 'OUTPUT_JSON_INVALID' }
  }

  try {
    const jsonText = afterMarker.slice(jsonStart, jsonEnd + 1)
    const parsed = JSON.parse(jsonText) as IntakePayload

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.STRUCTURED_INTAKE ||
      typeof parsed.STRUCTURED_INTAKE !== 'object' ||
      typeof parsed.CLINICAL_SUMMARY !== 'string'
    ) {
      return { ok: false, code: 'OUTPUT_JSON_INVALID' }
    }

    return {
      ok: true,
      payload: parsed,
    }
  } catch {
    return { ok: false, code: 'OUTPUT_JSON_PARSE_ERROR' }
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
    const supabase = await createServerSupabaseClient()
    const admin = createAdminSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.UNAUTHORIZED, message: 'Authentication required' },
        },
        { status: 401 },
      )
    }

    const role = getUserRole(user)
    const isAdmin = role === 'admin'
    const isClinician = role === 'clinician' || isAdmin

    if (!isClinician) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.FORBIDDEN, message: 'Clinician or admin role required' },
        },
        { status: 403 },
      )
    }

    const resolution = await resolvePatientIds(admin, patientId)
    if (!resolution.patientProfileId || !resolution.patientUserId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.NOT_FOUND, message: 'Patient not found' },
        },
        { status: 404 },
      )
    }

    if (!isAdmin) {
      const { data: assignment, error: assignmentError } = await supabase
        .from('clinician_patient_assignments')
        .select('id')
        .eq('clinician_user_id', user.id)
        .eq('patient_user_id', resolution.patientUserId)
        .maybeSingle()

      if (assignmentError || !assignment) {
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.FORBIDDEN, message: 'You do not have access to this patient' },
          },
          { status: 403 },
        )
      }
    }

    const body = (await request.json().catch(() => null)) as { focusHint?: string } | null
    const focusHint =
      body && typeof body.focusHint === 'string' && body.focusHint.trim()
        ? body.focusHint.trim().slice(0, 300)
        : null

    const { data: messages, error: messagesError } = await admin
      .from('amy_chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', resolution.patientUserId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })
      .limit(80)

    if (messagesError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to load chat history' },
        },
        { status: 500 },
      )
    }

    const chatMessages = (messages ?? []) as ChatMessage[]
    if (chatMessages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'No chat history found for intake regeneration',
          },
        },
        { status: 400 },
      )
    }

    const engineEnv = getEngineEnv()
    const anthropicApiKey = engineEnv.ANTHROPIC_API_KEY || engineEnv.ANTHROPIC_API_TOKEN
    if (!anthropicApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.CONFIGURATION_ERROR,
            message: 'Anthropic API key not configured',
          },
        },
        { status: 503 },
      )
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey })
    const model = engineEnv.ANTHROPIC_MODEL ?? MODEL_FALLBACK

    const conversationText = chatMessages
      .map((entry) => `[${entry.role}]: ${entry.content}`)
      .join('\n\n')

    const focusBlock = focusHint ? `\n\nKlinischer Fokus fuer diese Regeneration:\n${focusHint}` : ''
    const userPrompt =
      'Hier ist die Patientenkonversation. Erstelle daraus einen strukturierten Clinical Intake:\n\n' +
      `${conversationText}${focusBlock}`

    const completion = await anthropic.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system: getClinicalIntakePrompt(),
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const responseText = completion.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n')
      .trim()

    const parsed = parseIntakeOutput(responseText)
    if (!parsed.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: `Failed to parse intake output (${parsed.code})`,
          },
        },
        { status: 502 },
      )
    }

    const structuredData = {
      ...parsed.payload.STRUCTURED_INTAKE,
      status: 'draft',
    }

    const lastMessageIds = chatMessages.map((entry) => entry.id)

    const { data: inserted, error: insertError } = (await admin
      .from('clinical_intakes')
      .insert({
        user_id: resolution.patientUserId,
        patient_id: resolution.patientProfileId,
        status: 'draft',
        structured_data: structuredData,
        clinical_summary: parsed.payload.CLINICAL_SUMMARY,
        trigger_reason: 'clinician_regenerate',
        last_updated_from_messages: lastMessageIds,
        created_by: user.id,
        metadata: {
          prompt_version: CLINICAL_INTAKE_PROMPT_VERSION,
          regenerated_by: user.id,
          regenerated_at: new Date().toISOString(),
          focus_hint: focusHint,
        },
      })
      .select('id, status, version_number, clinical_summary, structured_data, trigger_reason, last_updated_from_messages, created_at, updated_at')
      .single()) as { data: Record<string, unknown> | null; error: unknown }

    if (insertError || !inserted) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to save regenerated intake' },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        intake: inserted,
      },
    })
  } catch (error) {
    console.error('[clinician/patient/clinical-intake/regenerate] Unexpected error', {
      error: String(error),
    })

    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'Failed to regenerate intake' },
      },
      { status: 500 },
    )
  }
}
