// app/api/amy/chat/route.ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { featureFlags } from '@/lib/featureFlags'
import { logError } from '@/lib/logging/logger'
import { env, getEngineEnv } from '@/lib/env'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getPatientConsultPrompt, PATIENT_CONSULT_PROMPT_VERSION } from '@/lib/llm/prompts'

/**
 * E73.8 — AMY Frontdesk Chat (LLM), ohne Steuerung
 * 
 * Simple chat endpoint that provides LLM responses without any control features.
 * NO funnel start, NO navigation, NO assessment mutations.
 * 
 * Acceptance Criteria:
 * - Chat responds via LLM
 * - Conversation persists over reload (stored in amy_chat_messages table)
 * - No side effects (no funnel/assessment endpoint calls)
 * - Feature flag gated (AMY_CHAT_ENABLED)
 * 
 * Security:
 * - Requires authentication
 * - RLS policies ensure users only see their own messages
 * - Input validation and sanitization
 * - Rate limiting via existing infrastructure
 * 
 * API Contract:
 * Request: { message: string }
 * Response: { success: true, data: { reply: string, messageId: string } }
 * Error: { success: false, error: { code: string, message: string } }
 */

const MODEL_FALLBACK = 'claude-sonnet-4-5-20250929'
const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY_MESSAGES = 20
const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu

type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  metadata?: Record<string, unknown> | null
}

const SYSTEM_PROMPT = getPatientConsultPrompt()
const OUTPUT_JSON_MARKER = 'OUTPUT_JSON'

type IntakeSnapshot = {
  status: 'draft'
  narrativeSummary?: string
  chiefComplaint?: string
  structured?: { timeline: string[]; keySymptoms: string[] }
  redFlags?: string[]
  openQuestions?: string[]
  evidenceRefs?: string[]
}

function sanitizeAssistantReply(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(EMOJI_REGEX, '').trim()
}

function mapOutputToIntakeSnapshot(payload: unknown): IntakeSnapshot | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const data = payload as Record<string, unknown>

  const summary = typeof data.summary === 'string' ? data.summary.trim() : ''
  const redFlags = Array.isArray(data.redFlags)
    ? data.redFlags.filter((flag) => typeof flag === 'string' && flag.trim())
    : []
  const missingData = Array.isArray(data.missingData)
    ? data.missingData.filter((item) => typeof item === 'string' && item.trim())
    : []

  if (!summary && redFlags.length === 0 && missingData.length === 0) {
    return null
  }

  return {
    status: 'draft',
    narrativeSummary: summary || undefined,
    structured: { timeline: [], keySymptoms: [] },
    redFlags: redFlags.length > 0 ? redFlags : undefined,
    openQuestions: missingData.length > 0 ? missingData : undefined,
    evidenceRefs: [],
  }
}

function splitAssistantOutput(raw: string) {
  const markerIndex = raw.indexOf(OUTPUT_JSON_MARKER)
  if (markerIndex === -1) {
    return { assistantText: raw.trim(), intakeSnapshot: null, hadOutputJson: false }
  }

  const before = raw.slice(0, markerIndex).trim()
  const after = raw.slice(markerIndex)
  const jsonStart = after.indexOf('{')
  const jsonEnd = after.lastIndexOf('}')

  let intakeSnapshot: IntakeSnapshot | null = null

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    const jsonString = after.slice(jsonStart, jsonEnd + 1)
    try {
      intakeSnapshot = mapOutputToIntakeSnapshot(JSON.parse(jsonString))
    } catch (err) {
      console.warn('[amy/chat] Failed to parse OUTPUT_JSON payload')
    }
  }

  return {
    assistantText: before || raw.replace(/OUTPUT_JSON[\s\S]*/g, '').trim(),
    intakeSnapshot,
    hadOutputJson: true,
  }
}

/**
 * Fetch recent chat history for context
 */
async function getChatHistory(userId: string, supabase: any): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('amy_chat_messages')
      .select('id, role, content, created_at, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY_MESSAGES)

    if (error) {
      console.warn('[amy/chat] Failed to fetch chat history', { error: error.message })
      return []
    }

    const rawMessages = (data || []) as ChatMessage[]
    const filteredMessages = rawMessages.filter((message) => {
      if (message.role !== 'assistant') {
        return true
      }
      const promptVersion = message.metadata?.promptVersion
      return promptVersion === PATIENT_CONSULT_PROMPT_VERSION
    })

    // Reverse to get chronological order for LLM context
    return filteredMessages.reverse()
  } catch (err) {
    console.error('[amy/chat] Error fetching chat history', { error: String(err) })
    return []
  }
}

/**
 * Save message to database
 */
async function saveMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  supabase: any,
  metadata: Record<string, any> = {}
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('amy_chat_messages')
      .insert({
        user_id: userId,
        role,
        content,
        metadata,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[amy/chat] Failed to save message', { role, error: error.message })
      return null
    }

    return data?.id || null
  } catch (err) {
    console.error('[amy/chat] Error saving message', { role, error: String(err) })
    return null
  }
}

/**
 * Call Anthropic API for chat response
 */
async function getChatResponse(
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  const engineEnv = getEngineEnv()
  const anthropicApiKey = engineEnv.ANTHROPIC_API_KEY || engineEnv.ANTHROPIC_API_TOKEN
  const model = engineEnv.ANTHROPIC_MODEL ?? MODEL_FALLBACK

  // No API key → Fallback
  if (!anthropicApiKey) {
    console.warn('[amy/chat] Anthropic not configured, using fallback')
    return 'Entschuldigung, der Chat-Service ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.'
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey })
  const startTime = Date.now()

  try {
    console.log('[amy/chat] Starting chat request', {
      model,
      messageLength: userMessage.length,
      historyLength: history.length,
    })

    // Build messages array from history
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    
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
      max_tokens: 500,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages,
    })

    const duration = Date.now() - startTime
    const textParts = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))

    const responseText = textParts.join('\n').trim()

    console.log('[amy/chat] Chat request completed', {
      duration: `${duration}ms`,
      model,
      responseLength: responseText.length,
    })

    return responseText
  } catch (error) {
    const duration = Date.now() - startTime

    console.error('[amy/chat] Chat request failed', {
      duration: `${duration}ms`,
      error: String(error),
      model,
    })

    logError(
      'AMY chat request failed',
      {
        endpoint: '/api/amy/chat',
        model,
        duration,
      },
      error,
    )

    return 'Entschuldigung, es gab einen Fehler beim Verarbeiten Ihrer Nachricht. Bitte versuchen Sie es erneut.'
  }
}

export async function POST(req: Request) {
  const requestStartTime = Date.now()
  const correlationId = getCorrelationId(req)
  console.log('[amy/chat] POST request received', { correlationId })

  try {
    // Feature flag check
    if (!featureFlags.AMY_CHAT_ENABLED) {
      console.log('[amy/chat] Feature disabled')
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'AMY chat is currently disabled',
          },
        },
        { status: 503 }
      )
    }

    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[amy/chat] Unauthenticated request')
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await req.json().catch((parseError) => {
      console.error('[amy/chat] JSON parsing error', {
        error: String(parseError),
      })
      return null
    })

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
          },
        },
        { status: 400 }
      )
    }

    // Validate message
    const message = body.message?.trim()
    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Message is required',
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
            code: 'MESSAGE_TOO_LONG',
            message: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`,
          },
        },
        { status: 400 }
      )
    }

    console.log('[amy/chat] Processing chat request', {
      userId: user.id,
      messageLength: message.length,
    })

    // Fetch chat history for context
    const history = await getChatHistory(user.id, supabase)

    // Save user message (best-effort, non-blocking for response)
    const userMessageId = await saveMessage(user.id, 'user', message, supabase, {
      correlationId,
    })

    // Get LLM response
    const rawReply = await getChatResponse(message, history)
    const { assistantText, intakeSnapshot, hadOutputJson } = splitAssistantOutput(rawReply)
    const reply = sanitizeAssistantReply(assistantText)

    if (hadOutputJson && env.NODE_ENV !== 'production') {
      console.info('[amy/chat] OUTPUT_JSON sanitized from response')
    }

    // Save assistant message
    const assistantMessageId = await saveMessage(user.id, 'assistant', reply, supabase, {
      correlationId,
      model: getEngineEnv().ANTHROPIC_MODEL ?? MODEL_FALLBACK,
      promptVersion: PATIENT_CONSULT_PROMPT_VERSION,
    })

    const totalDuration = Date.now() - requestStartTime
    console.log('[amy/chat] Request completed successfully', {
      duration: `${totalDuration}ms`,
      userMessageId,
      assistantMessageId,
      correlationId,
    })

    return NextResponse.json({
      success: true,
      data: {
        reply,
        intakeSnapshot: intakeSnapshot ?? undefined,
        messageId: assistantMessageId || 'temp-' + Date.now(),
      },
    })
  } catch (err: unknown) {
    const totalDuration = Date.now() - requestStartTime
    const error = err as { message?: string }
    console.error('[amy/chat] Unexpected error', {
      duration: `${totalDuration}ms`,
      error: error?.message ?? String(err),
    })

    logError(
      'AMY chat unexpected error',
      {
        endpoint: '/api/amy/chat',
        duration: totalDuration,
      },
      err,
    )

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to fetch chat history
 */
export async function GET(req: Request) {
  const correlationId = getCorrelationId(req)
  console.log('[amy/chat] GET request received', { correlationId })

  try {
    // Feature flag check
    if (!featureFlags.AMY_CHAT_ENABLED) {
      console.log('[amy/chat] Feature disabled')
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'AMY chat is currently disabled',
          },
        },
        { status: 503 }
      )
    }

    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[amy/chat] Unauthenticated request')
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Fetch chat history
    const history = await getChatHistory(user.id, supabase)

    return NextResponse.json({
      success: true,
      data: {
        messages: history,
      },
    })
  } catch (err: unknown) {
    const error = err as { message?: string }
    console.error('[amy/chat] GET error', {
      error: error?.message ?? String(err),
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    )
  }
}
