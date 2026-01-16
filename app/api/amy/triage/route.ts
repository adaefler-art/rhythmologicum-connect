// app/api/amy/triage/route.ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { featureFlags } from '@/lib/featureFlags'
import { logError } from '@/lib/logging/logger'
import { env } from '@/lib/env'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { emitTriageSubmitted, emitTriageRouted } from '@/lib/telemetry/events'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { trackUsage } from '@/lib/monitoring/usageTrackingWrapper'

/**
 * E6.6.1 — AMY Composer (Guided Mode) - Triage API
 * 
 * Bounded, safe UX for patient-initiated AMY interactions.
 * 
 * Acceptance Criteria:
 * - AC1: Max length enforced client-side + server-side (500-800 chars)
 * - AC2: Single-turn interaction (no chat history needed for v0.6)
 * - AC3: Non-emergency disclaimer visible in UI
 * - AC4: Submit triggers triage API call and shows routed result
 * 
 * Security Guardrails:
 * - Input bounded to prevent abuse
 * - PHI-safe: No personal details stored in telemetry
 * - Rate limiting via existing infrastructure
 * - Best-effort telemetry (failures don't block)
 */

const MAX_INPUT_LENGTH = 800 // AC1: Server-side validation
const MIN_INPUT_LENGTH = 10

const anthropicApiKey = env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_TOKEN
const MODEL = env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929'

const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null

/**
 * Triage result structure
 */
export type TriageResult = {
  tier: 'low' | 'moderate' | 'high' | 'urgent'
  nextAction: 'self-help' | 'funnel' | 'escalation' | 'emergency'
  summary: string
  suggestedResources?: string[]
}

/**
 * Fallback triage when AMY is unavailable
 */
function getFallbackTriage(): TriageResult {
  return {
    tier: 'moderate',
    nextAction: 'funnel',
    summary:
      'Vielen Dank für Ihre Nachricht. Um Ihnen besser helfen zu können, empfehlen wir, ' +
      'einen unserer strukturierten Fragebögen auszufüllen. Dies ermöglicht eine genauere Einschätzung Ihrer Situation.',
    suggestedResources: ['Stress-Assessment', 'Schlaf-Check'],
  }
}

/**
 * Call Anthropic API for triage
 */
async function performAITriage(concern: string): Promise<TriageResult> {
  // Feature flag disabled → Fallback
  if (!featureFlags.AMY_ENABLED) {
    console.log('[amy/triage] AMY feature disabled, using fallback')
    return getFallbackTriage()
  }

  // No Anthropic key → Fallback
  if (!anthropic) {
    console.warn('[amy/triage] Anthropic not configured, using fallback')
    return getFallbackTriage()
  }

  const startTime = Date.now()

  console.log('[amy/triage] Starting triage request', {
    model: MODEL,
    concernLength: concern.length,
  })

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      temperature: 0.3,
      system:
        'Du bist "AMY", eine empathische, evidenzbasierte Assistenz für Stress, Resilienz und Schlaf. ' +
        'Deine Aufgabe ist es, eine kurze Ersteinschätzung (Triage) durchzuführen. ' +
        'Analysiere die Eingabe des Patienten und antworte mit einem JSON-Objekt im folgenden Format:\n\n' +
        '{\n' +
        '  "tier": "low" | "moderate" | "high" | "urgent",\n' +
        '  "nextAction": "self-help" | "funnel" | "escalation" | "emergency",\n' +
        '  "summary": "Kurze, empathische Zusammenfassung (max 150 Wörter)",\n' +
        '  "suggestedResources": ["Ressource 1", "Ressource 2"] (optional)\n' +
        '}\n\n' +
        'Verwende "urgent" + "emergency" nur bei klaren Notfallhinweisen (Suizidalität, akute Gefahr).\n' +
        'Verwende "high" + "escalation" bei schweren Symptomen, die professionelle Hilfe brauchen.\n' +
        'Verwende "moderate" + "funnel" bei typischen Stress-/Schlafproblemen (häufigster Fall).\n' +
        'Verwende "low" + "self-help" bei milden Beschwerden.\n' +
        'Antworte NUR mit dem JSON-Objekt, kein zusätzlicher Text.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Patient-Anliegen:\n"${concern}"\n\nBitte führe eine Triage durch und antworte mit dem JSON-Objekt.`,
            },
          ],
        },
      ],
    })

    const duration = Date.now() - startTime
    const textParts = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))

    const responseText = textParts.join('\n').trim()

    console.log('[amy/triage] Triage request completed', {
      duration: `${duration}ms`,
      model: MODEL,
      responseLength: responseText.length,
    })

    // Parse JSON response
    try {
      const parsed = JSON.parse(responseText)

      // Validate structure
      if (
        !parsed.tier ||
        !parsed.nextAction ||
        !parsed.summary ||
        !['low', 'moderate', 'high', 'urgent'].includes(parsed.tier) ||
        !['self-help', 'funnel', 'escalation', 'emergency'].includes(parsed.nextAction)
      ) {
        console.warn('[amy/triage] Invalid triage response structure', { parsed })
        return getFallbackTriage()
      }

      return parsed as TriageResult
    } catch (parseError) {
      console.error('[amy/triage] Failed to parse JSON response', {
        error: parseError,
        responseText,
      })
      return getFallbackTriage()
    }
  } catch (error) {
    const duration = Date.now() - startTime

    // Determine error type
    let errorType = 'unknown'
    let errorMessage = String(error)

    if (error && typeof error === 'object') {
      const err = error as { status?: number; type?: string; message?: string }

      if (err.status === 429) {
        errorType = 'rate_limit'
      } else if (err.status === 408 || errorMessage.includes('timeout')) {
        errorType = 'timeout'
      } else if (err.status && err.status >= 500) {
        errorType = 'api_error'
      }

      if (err.message) {
        errorMessage = err.message
      }
    }

    console.error('[amy/triage] Triage request failed', {
      duration: `${duration}ms`,
      errorType,
      errorMessage,
      model: MODEL,
    })

    // Log structured error
    logError(
      'AMY triage request failed',
      {
        endpoint: '/api/amy/triage',
        errorType,
        model: MODEL,
        duration,
      },
      error,
    )

    return getFallbackTriage()
  }
}

export async function POST(req: Request) {
  const requestStartTime = Date.now()
  const correlationId = getCorrelationId(req)
  console.log('[amy/triage] POST request received', { correlationId })

  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[amy/triage] Unauthenticated request')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json().catch((parseError) => {
      console.error('[amy/triage] JSON parsing error', {
        error: String(parseError),
      })
      return null
    })

    const concern = body?.concern as string | undefined

    // AC1: Server-side validation - max length
    if (!concern || typeof concern !== 'string') {
      console.warn('[amy/triage] Missing or invalid concern')
      return NextResponse.json({ error: 'Concern text is required' }, { status: 400 })
    }

    if (concern.length < MIN_INPUT_LENGTH) {
      console.warn('[amy/triage] Concern too short', { length: concern.length })
      return NextResponse.json(
        { error: `Concern must be at least ${MIN_INPUT_LENGTH} characters` },
        { status: 400 },
      )
    }

    if (concern.length > MAX_INPUT_LENGTH) {
      console.warn('[amy/triage] Concern exceeds max length', { length: concern.length })
      return NextResponse.json(
        { error: `Concern must not exceed ${MAX_INPUT_LENGTH} characters` },
        { status: 400 },
      )
    }

    console.log('[amy/triage] Processing triage request', {
      userId: user.id,
      concernLength: concern.length,
    })

    // Emit TRIAGE_SUBMITTED event (best-effort)
    // Note: We use a synthetic assessment ID for non-funnel triage
    const syntheticAssessmentId = `triage-${Date.now()}-${user.id.slice(0, 8)}`
    await emitTriageSubmitted({
      correlationId,
      assessmentId: syntheticAssessmentId,
      patientId: user.id,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit TRIAGE_SUBMITTED event', err)
    })

    // Perform AI triage
    const triageResult = await performAITriage(concern)

    // Emit TRIAGE_ROUTED event (best-effort)
    await emitTriageRouted({
      correlationId,
      assessmentId: syntheticAssessmentId,
      nextAction: triageResult.nextAction,
      tier: triageResult.tier,
      patientId: user.id,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit TRIAGE_ROUTED event', err)
    })

    const totalDuration = Date.now() - requestStartTime
    console.log('[amy/triage] Request completed successfully', {
      duration: `${totalDuration}ms`,
      tier: triageResult.tier,
      nextAction: triageResult.nextAction,
      correlationId,
    })

    const response = NextResponse.json({
      success: true,
      data: triageResult,
    })

    // Track usage (fire and forget)
    trackUsage('POST /api/amy/triage', response)

    return response
  } catch (err: unknown) {
    const totalDuration = Date.now() - requestStartTime
    const error = err as { message?: string }
    console.error('[amy/triage] Unexpected error', {
      duration: `${totalDuration}ms`,
      error: error?.message ?? String(err),
    })

    // Log structured error
    logError(
      'AMY triage unexpected error',
      {
        endpoint: '/api/amy/triage',
        duration: totalDuration,
      },
      err,
    )

    const response = NextResponse.json(
      {
        error: 'Internal server error',
        message: error?.message ?? String(err),
      },
      { status: 500 },
    )

    // Track usage (fire and forget)
    trackUsage('POST /api/amy/triage', response)

    return response
  }
}
