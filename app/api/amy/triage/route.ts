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
import {
  type TriageResultV1,
  TRIAGE_SCHEMA_VERSION,
  TRIAGE_TIER,
  TRIAGE_NEXT_ACTION,
  safeValidateTriageRequest,
  getOversizeErrorStatus,
  sanitizeRedFlags,
  boundRationale,
} from '@/lib/api/contracts/triage'

/**
 * E6.6.2 — AMY Triage with TriageResult v1 Contract
 * 
 * Bounded, safe UX for patient-initiated AMY interactions.
 * 
 * Acceptance Criteria:
 * - AC1: Runtime validation with Zod schemas
 * - AC2: Invalid request returns 400; oversize returns 413 or 400
 * - AC3: rationale hard-bounded; redFlags from allowlist only
 * 
 * Security Guardrails:
 * - Input bounded to prevent abuse
 * - PHI-safe: No personal details stored in telemetry
 * - Rate limiting via existing infrastructure
 * - Best-effort telemetry (failures don't block)
 */

const MAX_INPUT_LENGTH = 800 // Legacy constant for backward compatibility

const anthropicApiKey = env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_TOKEN
const MODEL = env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929'

const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null

/**
 * Legacy triage result structure (for internal AI response parsing)
 */
type LegacyTriageResult = {
  tier: 'low' | 'moderate' | 'high' | 'urgent'
  nextAction: 'self-help' | 'funnel' | 'escalation' | 'emergency'
  summary: string
  suggestedResources?: string[]
}

/**
 * Map legacy tier to v1 tier
 */
function mapLegacyTierToV1(legacyTier: LegacyTriageResult['tier']): TriageResultV1['tier'] {
  switch (legacyTier) {
    case 'low':
      return TRIAGE_TIER.INFO
    case 'moderate':
      return TRIAGE_TIER.ASSESSMENT
    case 'high':
    case 'urgent':
      return TRIAGE_TIER.ESCALATE
  }
}

/**
 * Map legacy nextAction to v1 nextAction
 */
function mapLegacyNextActionToV1(
  legacyAction: LegacyTriageResult['nextAction']
): TriageResultV1['nextAction'] {
  switch (legacyAction) {
    case 'self-help':
      return TRIAGE_NEXT_ACTION.SHOW_CONTENT
    case 'funnel':
      return TRIAGE_NEXT_ACTION.START_FUNNEL_A
    case 'escalation':
    case 'emergency':
      return TRIAGE_NEXT_ACTION.SHOW_ESCALATION
  }
}

/**
 * Convert legacy result to v1 contract
 */
function convertToV1Result(
  legacy: LegacyTriageResult,
  correlationId: string
): TriageResultV1 {
  const tier = mapLegacyTierToV1(legacy.tier)
  const nextAction = mapLegacyNextActionToV1(legacy.nextAction)
  
  // Determine red flags based on tier
  const redFlags: string[] = []
  if (tier === TRIAGE_TIER.ESCALATE) {
    redFlags.push('report_risk_level')
  }
  
  // Sanitize red flags to allowlist
  const sanitizedRedFlags = sanitizeRedFlags(redFlags)
  
  // Bound rationale
  const rationale = boundRationale(legacy.summary)

  return {
    tier,
    nextAction,
    redFlags: sanitizedRedFlags,
    rationale,
    version: TRIAGE_SCHEMA_VERSION,
    correlationId,
  }
}

/**
 * Fallback triage when AMY is unavailable
 */
function getFallbackTriage(): LegacyTriageResult {
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
async function performAITriage(concern: string): Promise<LegacyTriageResult> {
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

      return parsed as LegacyTriageResult
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

    // AC2: Validate request with TriageRequestV1 schema
    const validatedRequest = safeValidateTriageRequest({
      inputText: body.concern || body.inputText,
      locale: body.locale,
      patientContext: body.patientContext,
    })

    if (!validatedRequest) {
      // Check if it's an oversize error for AC2
      const inputText = (body.concern || body.inputText || '') as string
      const oversizeStatus = getOversizeErrorStatus(inputText)
      
      if (oversizeStatus) {
        console.warn('[amy/triage] Input exceeds max length', { 
          length: inputText.length,
          status: oversizeStatus,
        })
        return NextResponse.json(
          {
            success: false,
            error: {
              code: oversizeStatus === 413 ? 'REQUEST_TOO_LARGE' : 'VALIDATION_FAILED',
              message: `Input must not exceed ${MAX_INPUT_LENGTH} characters`,
            },
          },
          { status: oversizeStatus }
        )
      }

      // Other validation error
      console.warn('[amy/triage] Request validation failed', { body })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Request validation failed. Input must be 10-800 characters.',
          },
        },
        { status: 400 }
      )
    }

    console.log('[amy/triage] Processing triage request', {
      userId: user.id,
      inputLength: validatedRequest.inputText.length,
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

    // Perform AI triage (gets legacy result)
    const legacyTriageResult = await performAITriage(validatedRequest.inputText)
    
    // Convert to v1 contract (AC3: sanitize redFlags, bound rationale)
    const triageResultV1 = convertToV1Result(legacyTriageResult, correlationId)

    // Emit TRIAGE_ROUTED event (best-effort) - use legacy values for telemetry compatibility
    await emitTriageRouted({
      correlationId,
      assessmentId: syntheticAssessmentId,
      nextAction: legacyTriageResult.nextAction,
      tier: legacyTriageResult.tier,
      patientId: user.id,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit TRIAGE_ROUTED event', err)
    })

    const totalDuration = Date.now() - requestStartTime
    console.log('[amy/triage] Request completed successfully', {
      duration: `${totalDuration}ms`,
      tier: triageResultV1.tier,
      nextAction: triageResultV1.nextAction,
      correlationId,
    })

    // AC1: Return TriageResultV1 compliant response
    const response = NextResponse.json({
      success: true,
      data: triageResultV1,
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
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    )

    // Track usage (fire and forget)
    trackUsage('POST /api/amy/triage', response)

    return response
  }
}
