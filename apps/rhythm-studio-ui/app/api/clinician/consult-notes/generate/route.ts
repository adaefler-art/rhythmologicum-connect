/**
 * Issue 5: Consult Note Generation API
 * 
 * POST /api/clinician/consult-notes/generate
 * Generates a consult note from chat history using LLM
 */

import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { getEngineEnv } from '@/lib/env'
import { getConsultNoteGenerationPrompt } from '@/lib/llm/prompts'
import type {
  ConsultNoteContent,
  ConsultNoteApiResponse,
  UncertaintyProfile,
  AssertivenessLevel,
  AudienceType,
  ConsultationType,
} from '@/lib/types/consultNote'
import { validateConsultNote } from '@/lib/validation/consultNote'
import { v4 as uuidv4 } from 'uuid'

const MODEL_FALLBACK = 'claude-sonnet-4-5-20250929'
const MAX_TOKENS = 4000

type GenerateRequestBody = {
  patient_id: string
  organization_id: string
  chat_session_id?: string
  consultation_type?: ConsultationType
  uncertainty_profile?: UncertaintyProfile
  assertiveness?: AssertivenessLevel
  audience?: AudienceType
  guideline_version?: string
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

/**
 * Fetch chat history for a patient
 */
async function getChatHistory(userId: string, supabase: any): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('amy_chat_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    console.error('[generate] Failed to fetch chat history', { error: error.message })
    return []
  }

  return (data || []) as ChatMessage[]
}

/**
 * Generate consult note content using LLM
 */
async function generateConsultNoteContent(
  chatHistory: ChatMessage[],
  uncertaintyProfile: UncertaintyProfile,
  assertiveness: AssertivenessLevel,
  audience: AudienceType
): Promise<ConsultNoteContent> {
  const engineEnv = getEngineEnv()
  const anthropicApiKey = engineEnv.ANTHROPIC_API_KEY || engineEnv.ANTHROPIC_API_TOKEN
  const model = engineEnv.ANTHROPIC_MODEL ?? MODEL_FALLBACK

  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not configured')
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey })
  const systemPrompt = getConsultNoteGenerationPrompt(uncertaintyProfile, assertiveness, audience)

  // Build conversation summary for LLM
  const conversationSummary = chatHistory
    .map((msg) => `${msg.role === 'user' ? 'Patient' : 'Assistant'}: ${msg.content}`)
    .join('\n\n')

  const userPrompt = `Hier ist die Gesprächshistorie:\n\n${conversationSummary}\n\nBitte erstelle basierend auf diesem Gespräch eine vollständige Consult Note im vorgegebenen JSON-Format.`

  const response = await anthropic.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    temperature: 0,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  // Extract JSON from response
  const textContent = response.content
    .filter((c) => c.type === 'text')
    .map((c) => ('text' in c ? c.text : ''))
    .join('\n')

  // Try to extract JSON (might be wrapped in markdown code block)
  let jsonText = textContent
  const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || textContent.match(/```\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1]
  }

  const consultNoteContent = JSON.parse(jsonText) as ConsultNoteContent

  return consultNoteContent
}

/**
 * POST - Generate consult note from chat history
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ConsultNoteApiResponse<{ content: ConsultNoteContent }>>> {
  const requestId = uuidv4()
  const endpoint = '/api/clinician/consult-notes/generate'

  try {
    console.log('[consult-notes/generate] POST request received', { requestId, endpoint })

    // Auth check
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[consult-notes/generate] Unauthorized access attempt', { requestId })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Check clinician role
    const isClinician = await hasClinicianRole(request)
    if (!isClinician) {
      console.warn('[consult-notes/generate] Non-clinician access attempt', {
        requestId,
        userId: user.id,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: 'Clinician role required',
          },
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body = (await request.json().catch(() => null)) as GenerateRequestBody | null

    if (!body || !body.patient_id || !body.organization_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'Missing required fields: patient_id, organization_id',
          },
        },
        { status: 400 }
      )
    }

    // Get patient's user_id from patient_profiles
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('user_id')
      .eq('id', body.patient_id)
      .single()

    if (profileError || !patientProfile) {
      console.error('[consult-notes/generate] Patient profile not found', {
        requestId,
        patientId: body.patient_id,
        error: profileError?.message,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Patient profile not found',
          },
        },
        { status: 404 }
      )
    }

    // Fetch chat history
    const chatHistory = await getChatHistory(patientProfile.user_id, supabase)

    if (chatHistory.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'No chat history found for patient',
          },
        },
        { status: 400 }
      )
    }

    console.log('[consult-notes/generate] Generating consult note', {
      requestId,
      patientId: body.patient_id,
      chatMessageCount: chatHistory.length,
      uncertaintyProfile: body.uncertainty_profile || 'qualitative',
      assertiveness: body.assertiveness || 'conservative',
      audience: body.audience || 'patient',
    })

    // Generate consult note using LLM
    const content = await generateConsultNoteContent(
      chatHistory,
      body.uncertainty_profile || 'qualitative',
      body.assertiveness || 'conservative',
      body.audience || 'patient'
    )

    // Validate generated content
    const validation = validateConsultNote(content)

    if (!validation.valid) {
      console.warn('[consult-notes/generate] Generated content validation failed', {
        requestId,
        errors: validation.errors,
        warnings: validation.warnings,
      })
      // Still return the content but include validation errors
    }

    console.log('[consult-notes/generate] Consult note generated successfully', {
      requestId,
      patientId: body.patient_id,
      valid: validation.valid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
    })

    return NextResponse.json({
      success: true,
      data: {
        content,
      },
    })
  } catch (error) {
    console.error('[consult-notes/generate] Unexpected error', {
      requestId,
      error: String(error),
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Failed to generate consult note',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    )
  }
}
