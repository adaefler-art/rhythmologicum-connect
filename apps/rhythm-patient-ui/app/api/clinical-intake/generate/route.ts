/**
 * Issue 10: Clinical Intake Generation API
 * 
 * POST /api/clinical-intake/generate
 * 
 * Generates structured clinical intake from patient conversation messages.
 * Creates both STRUCTURED_INTAKE (machine-readable) and CLINICAL_SUMMARY (physician-readable).
 * 
 * Security:
 * - Requires authentication
 * - Users can only generate intakes for their own messages
 * - RLS policies ensure data isolation
 * 
 * API Contract:
 * Request: { messageIds?: string[], triggerReason?: string, force?: boolean }
 * Response: { success: true, data: { intake: ClinicalIntake, isNew: boolean } }
 * Error: { success: false, error: { code: string, message: string } }
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getClinicalIntakePrompt, CLINICAL_INTAKE_PROMPT_VERSION } from '@/lib/llm/prompts'
import { getEngineEnv } from '@/lib/env'
import { logError } from '@/lib/logging/logger'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { projectClinicalIntakeToAnamnesis } from '@/lib/clinicalIntake/projection'
import type {
  GenerateIntakeRequest,
  GenerateIntakeResponse,
  ClinicalIntake,
  StructuredIntakeData,
} from '@/lib/types/clinicalIntake'

const MODEL_FALLBACK = 'claude-sonnet-4-5-20250929'
const MAX_TOKENS = 2000
const MIN_MESSAGES_FOR_INTAKE = 3

type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

/**
 * Fetch messages for intake generation
 */
async function getMessagesForIntake(
  userId: string,
  messageIds: string[] | undefined,
  supabase: any
): Promise<ChatMessage[]> {
  try {
    let query = supabase
      .from('amy_chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (messageIds && messageIds.length > 0) {
      query = query.in('id', messageIds)
    } else {
      // If no specific messages, get recent conversation
      query = query.limit(50)
    }

    const { data, error } = await query

    if (error) {
      console.error('[clinical-intake/generate] Failed to fetch messages', { error: error.message })
      return []
    }

    return (data || []) as ChatMessage[]
  } catch (err) {
    console.error('[clinical-intake/generate] Error fetching messages', { error: String(err) })
    return []
  }
}

/**
 * Generate clinical intake using LLM
 */
async function generateIntakeWithLLM(messages: ChatMessage[]): Promise<{
  structuredData: StructuredIntakeData
  clinicalSummary: string
} | null> {
  const engineEnv = getEngineEnv()
  const anthropicApiKey = engineEnv.ANTHROPIC_API_KEY || engineEnv.ANTHROPIC_API_TOKEN
  const model = engineEnv.ANTHROPIC_MODEL ?? MODEL_FALLBACK

  if (!anthropicApiKey) {
    console.warn('[clinical-intake/generate] Anthropic not configured')
    return null
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey })
  const startTime = Date.now()

  try {
    // Build conversation context for LLM
    const conversationText = messages
      .map((msg) => `[${msg.role}]: ${msg.content}`)
      .join('\n\n')

    const systemPrompt = getClinicalIntakePrompt()
    const userPrompt = `Hier ist die Patientenkonversation. Erstelle daraus einen strukturierten Clinical Intake:\n\n${conversationText}`

    console.log('[clinical-intake/generate] Generating intake', {
      model,
      messageCount: messages.length,
      conversationLength: conversationText.length,
    })

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

    const duration = Date.now() - startTime
    const textParts = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))

    const responseText = textParts.join('\n').trim()

    console.log('[clinical-intake/generate] LLM response received', {
      duration: `${duration}ms`,
      responseLength: responseText.length,
    })

    // Parse OUTPUT_JSON
    const parsed = parseIntakeOutput(responseText)
    if (!parsed) {
      console.error('[clinical-intake/generate] Failed to parse LLM output')
      return null
    }

    return parsed
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[clinical-intake/generate] LLM request failed', {
      duration: `${duration}ms`,
      error: String(error),
    })

    logError('Clinical intake generation failed', {
      endpoint: '/api/clinical-intake/generate',
      error: String(error),
      duration,
    })

    return null
  }
}

/**
 * Parse LLM output to extract STRUCTURED_INTAKE and CLINICAL_SUMMARY
 */
function parseIntakeOutput(text: string): {
  structuredData: StructuredIntakeData
  clinicalSummary: string
} | null {
  try {
    // Look for OUTPUT_JSON marker
    const jsonMarker = text.indexOf('OUTPUT_JSON')
    if (jsonMarker === -1) {
      console.warn('[clinical-intake/generate] No OUTPUT_JSON marker found')
      return null
    }

    const afterMarker = text.slice(jsonMarker)
    const jsonStart = afterMarker.indexOf('{')
    const jsonEnd = afterMarker.lastIndexOf('}')

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.warn('[clinical-intake/generate] Invalid JSON structure')
      return null
    }

    const jsonString = afterMarker.slice(jsonStart, jsonEnd + 1)
    const parsed = JSON.parse(jsonString)

    // Validate structure
    if (!parsed.STRUCTURED_INTAKE || !parsed.CLINICAL_SUMMARY) {
      console.warn('[clinical-intake/generate] Missing required fields in output')
      return null
    }

    const structuredData = parsed.STRUCTURED_INTAKE as StructuredIntakeData
    const clinicalSummary = parsed.CLINICAL_SUMMARY as string

    // Ensure status is 'draft'
    structuredData.status = 'draft'

    return { structuredData, clinicalSummary }
  } catch (err) {
    console.error('[clinical-intake/generate] JSON parse error', { error: String(err) })
    return null
  }
}

/**
 * Save intake to database
 */
async function saveIntake(
  userId: string,
  structuredData: StructuredIntakeData,
  clinicalSummary: string,
  messageIds: string[],
  triggerReason: string,
  supabase: any
): Promise<ClinicalIntake | null> {
  try {
    const { data, error } = await supabase
      .from('clinical_intakes')
      .insert({
        user_id: userId,
        status: 'draft',
        structured_data: structuredData,
        clinical_summary: clinicalSummary,
        trigger_reason: triggerReason,
        last_updated_from_messages: messageIds,
        created_by: userId,
        metadata: {
          prompt_version: CLINICAL_INTAKE_PROMPT_VERSION,
          generated_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) {
      console.error('[clinical-intake/generate] Failed to save intake', { error: error.message })
      return null
    }

    return data as ClinicalIntake
  } catch (err) {
    console.error('[clinical-intake/generate] Error saving intake', { error: String(err) })
    return null
  }
}

/**
 * POST /api/clinical-intake/generate
 */
export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId()

  try {
    // Get authenticated user
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
        } satisfies GenerateIntakeResponse,
        { status: 401 }
      )
    }

    // Parse request body
    const body = (await req.json()) as GenerateIntakeRequest
    const { messageIds, triggerReason = 'manual', force = false } = body

    console.log('[clinical-intake/generate] Request received', {
      userId: user.id,
      messageIds: messageIds?.length || 'all',
      triggerReason,
      force,
      correlationId,
    })

    // Fetch messages for intake
    const messages = await getMessagesForIntake(user.id, messageIds, supabase)

    if (messages.length < MIN_MESSAGES_FOR_INTAKE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_DATA',
            message: `Need at least ${MIN_MESSAGES_FOR_INTAKE} messages for intake generation`,
          },
        } satisfies GenerateIntakeResponse,
        { status: 400 }
      )
    }

    // Generate intake with LLM
    const result = await generateIntakeWithLLM(messages)

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'GENERATION_FAILED',
            message: 'Failed to generate clinical intake',
          },
        } satisfies GenerateIntakeResponse,
        { status: 500 }
      )
    }

    // Save to database
    const intake = await saveIntake(
      user.id,
      result.structuredData,
      result.clinicalSummary,
      messages.map((m) => m.id),
      triggerReason,
      supabase
    )

    if (!intake) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SAVE_FAILED',
            message: 'Failed to save clinical intake',
          },
        } satisfies GenerateIntakeResponse,
        { status: 500 }
      )
    }

    const projection = await projectClinicalIntakeToAnamnesis(supabase, {
      userId: user.id,
      intakeId: intake.id,
      structuredData: result.structuredData,
      clinicalSummary: result.clinicalSummary,
      promptVersion:
        typeof intake.metadata?.prompt_version === 'string'
          ? intake.metadata.prompt_version
          : CLINICAL_INTAKE_PROMPT_VERSION,
      lastUpdatedFromMessages: intake.last_updated_from_messages ?? messages.map((m) => m.id),
    })

    if (!projection.success) {
      console.error('[clinical-intake/generate] Projection failed', {
        intakeId: intake.id,
        userId: user.id,
        error: projection.error,
        errorCode: projection.errorCode,
        correlationId,
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROJECTION_FAILED',
            message: 'Failed to project intake into anamnesis',
          },
        } satisfies GenerateIntakeResponse,
        { status: 500 }
      )
    }

    console.log('[clinical-intake/generate] Intake generated successfully', {
      intakeId: intake.id,
      userId: user.id,
      correlationId,
    })

    return NextResponse.json({
      success: true,
      data: {
        intake,
        isNew: true,
      },
    } satisfies GenerateIntakeResponse)
  } catch (error) {
    console.error('[clinical-intake/generate] Unexpected error', {
      error: String(error),
      correlationId,
    })

    logError('Clinical intake generation failed', {
      endpoint: '/api/clinical-intake/generate',
      error: String(error),
      correlationId,
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } satisfies GenerateIntakeResponse,
      { status: 500 }
    )
  }
}
