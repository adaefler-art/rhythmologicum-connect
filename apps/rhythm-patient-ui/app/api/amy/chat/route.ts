// app/api/amy/chat/route.ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { featureFlags } from '@/lib/featureFlags'
import { logError } from '@/lib/logging/logger'
import { env, getEngineEnv } from '@/lib/env'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getPatientConsultPrompt, PATIENT_CONSULT_PROMPT_VERSION } from '@/lib/llm/prompts'
import { getFirstIntakeSociologicalAssessmentContext } from '@/lib/clinicalIntake/firstIntakeSociologicalContext'
import {
  assessTurnQuality,
  buildGuardRedirectReply,
} from '@/lib/cre/dialog/turnQualityGuard'

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
  interpreted_clinical_summary?: {
    short_summary?: string[]
    narrative_history?: string
    open_questions?: string[]
  }
}

function sanitizeAssistantReply(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(EMOJI_REGEX, '').trim()
}

function mapOutputToIntakeSnapshot(payload: unknown): IntakeSnapshot | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const data = payload as Record<string, unknown>

  const interpreted = data.interpreted_clinical_summary
  if (interpreted && typeof interpreted === 'object' && !Array.isArray(interpreted)) {
    const record = interpreted as Record<string, unknown>
    const shortSummary = Array.isArray(record.short_summary)
      ? record.short_summary.filter((item) => typeof item === 'string' && item.trim())
      : []
    const narrativeHistory =
      typeof record.narrative_history === 'string' && record.narrative_history.trim()
        ? record.narrative_history.trim()
        : ''
    const openQuestions = Array.isArray(record.open_questions)
      ? record.open_questions.filter((item) => typeof item === 'string' && item.trim())
      : []

    if (shortSummary.length === 0 && !narrativeHistory && openQuestions.length === 0) {
      return null
    }

    return {
      status: 'draft',
      interpreted_clinical_summary: {
        short_summary: shortSummary.length > 0 ? shortSummary : undefined,
        narrative_history: narrativeHistory || undefined,
        open_questions: openQuestions.length > 0 ? openQuestions : undefined,
      },
    }
  }

  const legacySummary = typeof data.summary === 'string' ? data.summary.trim() : ''
  const legacyMissing = Array.isArray(data.missingData)
    ? data.missingData.filter((item) => typeof item === 'string' && item.trim())
    : []

  if (!legacySummary && legacyMissing.length === 0) {
    return null
  }

  return {
    status: 'draft',
    interpreted_clinical_summary: {
      short_summary: legacySummary ? [legacySummary] : undefined,
      narrative_history: legacySummary || undefined,
      open_questions: legacyMissing.length > 0 ? legacyMissing : undefined,
    },
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
  history: ChatMessage[],
  options?: { context?: string; systemPrompt?: string }
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

    const basePrompt = options?.systemPrompt ?? SYSTEM_PROMPT
    const systemPrompt = options?.context
      ? `${basePrompt}\n\nCONTEXT:\n${options.context}`
      : basePrompt

    const response = await anthropic.messages.create({
      model,
      max_tokens: 500,
      temperature: 0,
      system: systemPrompt,
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

    const mode =
      body.mode === 'resume'
        ? 'resume'
        : body.mode === 'log_only'
          ? 'log_only'
          : 'default'

    const resumeContext =
      mode === 'resume' && body.resumeContext && typeof body.resumeContext === 'object'
        ? (body.resumeContext as Record<string, unknown>)
        : null

    const message =
      mode === 'resume'
        ? resumeContext
          ? JSON.stringify(resumeContext).slice(0, MAX_MESSAGE_LENGTH)
          : ''
        : body.message?.trim()

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message:
              mode === 'resume'
                ? 'Resume context is required'
                : 'Message is required',
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

    const baseContext =
      typeof body.context === 'string' && body.context.trim()
        ? body.context.trim().slice(0, 500)
        : undefined

    const structuredIntakeData =
      mode !== 'resume' && body.structuredIntakeData && typeof body.structuredIntakeData === 'object'
        ? (body.structuredIntakeData as Record<string, unknown>)
        : null

    const contextParts: string[] = []
    if (baseContext) contextParts.push(baseContext)
    if (structuredIntakeData) {
      contextParts.push(
        `STRUCTURED_INTAKE_DATA:\n${JSON.stringify(structuredIntakeData).slice(0, 1500)}`,
      )
    }

    if (mode === 'default') {
      try {
        const firstIntakeContext = await getFirstIntakeSociologicalAssessmentContext(user.id, supabase)
        if (firstIntakeContext?.contextText) {
          contextParts.push(
            `ERSTAUFNAHME_SOZIOLOGISCHE_ANAMNESE:\n${firstIntakeContext.contextText.slice(0, 1800)}`,
          )
        }
      } catch (error) {
        console.warn('[amy/chat] Failed to load first-intake context', {
          userId: user.id,
          error: String(error),
        })
      }
    }

    const context = contextParts.length > 0 ? contextParts.join('\n\n') : undefined

    const turnQuality =
      mode === 'default'
        ? assessTurnQuality(message)
        : {
            label: 'clinical_or_ambiguous' as const,
            shouldRedirect: false,
            reason: `mode_${mode}`,
          }

    console.log('[amy/chat] Processing chat request', {
      userId: user.id,
      messageLength: message.length,
      mode,
      turnQualityLabel: turnQuality.label,
      turnQualityReason: turnQuality.reason,
    })

    // Fetch chat history for context
    const history = mode === 'resume' ? [] : await getChatHistory(user.id, supabase)

    // Save user message (best-effort, non-blocking for response)
    const userMessageId =
      mode === 'resume'
        ? null
        : await saveMessage(user.id, 'user', message, supabase, {
            correlationId,
            turnQualityLabel: turnQuality.label,
            turnQualityReason: turnQuality.reason,
          })

    if (mode === 'log_only') {
      const totalDuration = Date.now() - requestStartTime
      console.log('[amy/chat] Log-only request completed', {
        duration: `${totalDuration}ms`,
        userMessageId,
        correlationId,
      })

      return NextResponse.json({
        success: true,
        data: {
          reply: '',
          intakeSnapshot: undefined,
          messageId: userMessageId || 'temp-' + Date.now(),
          logged: true,
        },
      })
    }

    if (mode === 'default' && turnQuality.shouldRedirect) {
      const guardReply = sanitizeAssistantReply(buildGuardRedirectReply(turnQuality))

      const assistantMessageId = await saveMessage(user.id, 'assistant', guardReply, supabase, {
        correlationId,
        model: 'guard-v1',
        promptVersion: PATIENT_CONSULT_PROMPT_VERSION,
        mode,
        guardTriggered: true,
        guardLabel: turnQuality.label,
      })

      const totalDuration = Date.now() - requestStartTime
      console.log('[amy/chat] Request completed with guard redirect', {
        duration: `${totalDuration}ms`,
        userMessageId,
        assistantMessageId,
        guardLabel: turnQuality.label,
        correlationId,
      })

      return NextResponse.json({
        success: true,
        data: {
          reply: guardReply,
          intakeSnapshot: undefined,
          messageId: assistantMessageId || 'temp-' + Date.now(),
        },
      })
    }

    // Get LLM response
    const resumePrompt =
      'Du bist ein medizinischer Aufnahmeassistent. Schreibe fehlerfreies Deutsch.\n' +
      'Formuliere maximal 2-3 kurze Saetze: 1 Satz Stand ("Wo stehen wir"), 1 Satz was noch gebraucht wird, 1 kurze Frage nach dem aktuellen Stand.\n' +
      'Wenn kein klarer Verlauf erkennbar ist, sage neutral, dass Vorinformationen vorliegen und was noch benoetigt wird.\n' +
      'Keine Zitate, keine Rohtexte, keine JSON-Ausgabe.'

    const rawReply = await getChatResponse(message, history, {
      systemPrompt: mode === 'resume' ? resumePrompt : undefined,
      context,
    })
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
      mode,
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
        intakeSnapshot: mode === 'resume' ? undefined : intakeSnapshot ?? undefined,
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
