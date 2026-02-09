/**
 * Issue 9: Clinician Colleague Mode Chat API
 * 
 * POST /api/clinician/chat
 * Enables clinicians to ask follow-up questions about patient cases.
 * Uses PAT in "clinician_colleague" mode for shorter, structured responses
 * focused on hypotheses, missing data, and next steps.
 * 
 * Acceptance Criteria:
 * - Clinician can ask questions about patient cases
 * - Responses differ from patient mode (shorter, more structured)
 * - Conversation stays case-bound (linked to patient record + consult note)
 * - Requires clinician role
 */

import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { getEngineEnv } from '@/lib/env'
import { getClinicianColleaguePrompt } from '@/lib/llm/prompts'
import { randomUUID } from 'crypto'

const MODEL_FALLBACK = 'claude-sonnet-4-5-20250929'
const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY_MESSAGES = 20
const MAX_TOKENS = 800 // Shorter responses for clinician mode
const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu

type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  metadata?: Record<string, unknown> | null
}

type ChatRequestBody = {
  message: string
  patient_id: string
  consult_note_id?: string
}

const SYSTEM_PROMPT = getClinicianColleaguePrompt()

function sanitizeAssistantReply(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(EMOJI_REGEX, '').trim()
}

/**
 * Fetch recent chat history for clinician-patient context
 */
async function getChatHistory(
  patientUserId: string,
  clinicianUserId: string,
  supabase: any
): Promise<ChatMessage[]> {
  try {
    // Fetch messages for this patient in clinician_colleague mode
    const { data, error } = await supabase
      .from('amy_chat_messages')
      .select('id, role, content, created_at, metadata')
      .eq('user_id', patientUserId)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY_MESSAGES)

    if (error) {
      console.warn('[clinician/chat] Failed to fetch chat history', { error: error.message })
      return []
    }

    const rawMessages = (data || []) as ChatMessage[]
    
    // Filter to only clinician_colleague mode messages
    const filteredMessages = rawMessages.filter((message) => {
      const mode = message.metadata?.conversationMode
      return mode === 'clinician_colleague'
    })

    // Reverse to get chronological order for LLM context
    return filteredMessages.reverse()
  } catch (err) {
    console.error('[clinician/chat] Error fetching chat history', { error: String(err) })
    return []
  }
}

/**
 * Save message to database with clinician mode metadata
 */
async function saveMessage(
  patientUserId: string,
  clinicianUserId: string,
  role: 'user' | 'assistant',
  content: string,
  supabase: any,
  metadata: Record<string, any> = {}
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('amy_chat_messages')
      .insert({
        user_id: patientUserId,
        role,
        content,
        metadata: {
          ...metadata,
          conversationMode: 'clinician_colleague',
          clinicianUserId, // Track which clinician asked
        },
      })
      .select('id')
      .single()

    if (error) {
      console.error('[clinician/chat] Failed to save message', { role, error: error.message })
      return null
    }

    return data?.id || null
  } catch (err) {
    console.error('[clinician/chat] Error saving message', { role, error: String(err) })
    return null
  }
}

/**
 * Get patient context for the LLM
 */
async function getPatientContext(
  patientId: string,
  consultNoteId: string | undefined,
  supabase: any
): Promise<string> {
  let context = ''

  // Get latest consult note if available
  if (consultNoteId) {
    const { data: consultNote, error } = await supabase
      .from('consult_notes')
      .select('content, rendered_markdown')
      .eq('id', consultNoteId)
      .single()

    if (!error && consultNote) {
      context += `\n\nAKTUELLE CONSULT NOTE:\n${consultNote.rendered_markdown || JSON.stringify(consultNote.content, null, 2)}`
    }
  }

  // Get recent anamnesis entries
  const { data: anamnesisEntries, error: anamnesisError } = await supabase
    .from('anamnesis_entries')
    .select('title, content, entry_type')
    .eq('patient_id', patientId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!anamnesisError && anamnesisEntries && anamnesisEntries.length > 0) {
    context += '\n\nANAMNESE-EINTRÄGE:\n'
    anamnesisEntries.forEach((entry: any) => {
      context += `- ${entry.title} (${entry.entry_type})\n`
    })
  }

  return context
}

/**
 * Call Anthropic API for clinician chat response
 */
async function getClinicianChatResponse(
  userMessage: string,
  history: ChatMessage[],
  patientContext: string
): Promise<string> {
  const engineEnv = getEngineEnv()
  const anthropicApiKey = engineEnv.ANTHROPIC_API_KEY || engineEnv.ANTHROPIC_API_TOKEN
  const model = engineEnv.ANTHROPIC_MODEL ?? MODEL_FALLBACK

  if (!anthropicApiKey) {
    console.warn('[clinician/chat] Anthropic not configured, using fallback')
    return 'Entschuldigung, der Chat-Service ist momentan nicht verfügbar.'
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey })
  const startTime = Date.now()

  try {
    console.log('[clinician/chat] Starting clinician chat request', {
      model,
      messageLength: userMessage.length,
      historyLength: history.length,
      hasPatientContext: patientContext.length > 0,
    })

    // Build messages array from history
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    
    // Add patient context as first system message if available
    if (patientContext) {
      messages.push({
        role: 'user',
        content: `PATIENT CONTEXT:${patientContext}\n\n---\n\nFrage des Kollegen wird folgen.`,
      })
      messages.push({
        role: 'assistant',
        content: 'Verstanden. Ich habe den Patientenkontext gelesen. Welche Frage hast du?',
      })
    }
    
    // Add history (excluding system messages)
    for (const msg of history) {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    })

    const response = await anthropic.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages,
    })

    const duration = Date.now() - startTime
    const textParts = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))

    const responseText = textParts.join('\n').trim()

    console.log('[clinician/chat] Chat request completed', {
      duration: `${duration}ms`,
      model,
      responseLength: responseText.length,
    })

    return responseText
  } catch (error) {
    const duration = Date.now() - startTime

    console.error('[clinician/chat] Chat request failed', {
      duration: `${duration}ms`,
      error: String(error),
      model,
    })

    return 'Entschuldigung, es gab einen Fehler beim Verarbeiten der Anfrage.'
  }
}

/**
 * POST - Send message in clinician colleague mode
 */
export async function POST(request: NextRequest) {
  const requestId = randomUUID()
  const endpoint = '/api/clinician/chat'

  try {
    console.log('[clinician/chat] POST request received', { requestId, endpoint })

    // Auth check
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[clinician/chat] Unauthorized access attempt', { requestId })
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
    const isClinician = await hasClinicianRole()
    if (!isClinician) {
      console.warn('[clinician/chat] Non-clinician access attempt', {
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
    const body = (await request.json().catch(() => null)) as ChatRequestBody | null

    if (!body || !body.message || !body.patient_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'Missing required fields: message, patient_id',
          },
        },
        { status: 400 }
      )
    }

    const message = body.message.trim()
    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'Message cannot be empty',
          },
        },
        { status: 400 }
      )
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`,
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
      console.error('[clinician/chat] Patient profile not found', {
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

    // Verify clinician has access to this patient
    const { data: assignment, error: assignmentError } = await supabase
      .from('clinician_patient_assignments')
      .select('id')
      .eq('clinician_user_id', user.id)
      .eq('patient_user_id', patientProfile.user_id)
      .single()

    if (assignmentError || !assignment) {
      console.warn('[clinician/chat] Clinician does not have access to patient', {
        requestId,
        clinicianUserId: user.id,
        patientUserId: patientProfile.user_id,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: 'You do not have access to this patient',
          },
        },
        { status: 403 }
      )
    }

    console.log('[clinician/chat] Processing clinician chat request', {
      requestId,
      clinicianUserId: user.id,
      patientId: body.patient_id,
      consultNoteId: body.consult_note_id,
      messageLength: message.length,
    })

    // Fetch chat history for context
    const history = await getChatHistory(patientProfile.user_id, user.id, supabase)

    // Get patient context
    const patientContext = await getPatientContext(body.patient_id, body.consult_note_id, supabase)

    // Save clinician message (best-effort, non-blocking)
    const userMessageId = await saveMessage(
      patientProfile.user_id,
      user.id,
      'user',
      message,
      supabase,
      {
        requestId,
        patientId: body.patient_id,
        consultNoteId: body.consult_note_id,
      }
    )

    // Get LLM response in clinician colleague mode
    const reply = sanitizeAssistantReply(
      await getClinicianChatResponse(message, history, patientContext)
    )

    // Save assistant message
    const assistantMessageId = await saveMessage(
      patientProfile.user_id,
      user.id,
      'assistant',
      reply,
      supabase,
      {
        requestId,
        model: getEngineEnv().ANTHROPIC_MODEL ?? MODEL_FALLBACK,
        patientId: body.patient_id,
        consultNoteId: body.consult_note_id,
      }
    )

    console.log('[clinician/chat] Request completed successfully', {
      requestId,
      userMessageId,
      assistantMessageId,
    })

    return NextResponse.json({
      success: true,
      data: {
        reply,
        messageId: assistantMessageId || 'temp-' + Date.now(),
      },
    })
  } catch (error) {
    console.error('[clinician/chat] Unexpected error', {
      requestId,
      error: String(error),
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to fetch clinician chat history for a patient
 */
export async function GET(request: NextRequest) {
  const requestId = randomUUID()

  try {
    console.log('[clinician/chat] GET request received', { requestId })

    // Auth check
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[clinician/chat] Unauthorized access attempt', { requestId })
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
    const isClinician = await hasClinicianRole()
    if (!isClinician) {
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

    // Get patient_id from query params
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'Missing required parameter: patient_id',
          },
        },
        { status: 400 }
      )
    }

    // Get patient's user_id
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('user_id')
      .eq('id', patientId)
      .single()

    if (profileError || !patientProfile) {
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
    const history = await getChatHistory(patientProfile.user_id, user.id, supabase)

    return NextResponse.json({
      success: true,
      data: {
        messages: history,
      },
    })
  } catch (error) {
    console.error('[clinician/chat] GET error', {
      requestId,
      error: String(error),
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
        },
      },
      { status: 500 }
    )
  }
}
