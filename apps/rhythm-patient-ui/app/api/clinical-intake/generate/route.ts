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
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { getClinicalIntakePrompt, CLINICAL_INTAKE_PROMPT_VERSION } from '@/lib/llm/prompts'
import { getEngineEnv } from '@/lib/env'
import { logError } from '@/lib/logging/logger'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { evaluateRedFlags, formatSafetySummaryLine } from '@/lib/cre/safety/redFlags'
import { applySafetyPolicy, getEffectiveSafetyState, loadSafetyPolicy } from '@/lib/cre/safety/policyEngine'
import { attachIntakeEvidenceAfterSave } from '@/lib/cre/safety/intakeEvidence'
import { loadActiveSafetyRuleOverrides } from '@/lib/cre/safety/safetyRuleVersions'
import { generateReasoningPack } from '@/lib/cre/reasoning/engine'
import { loadActiveClinicalReasoningConfig } from '@/lib/cre/reasoning/configStore'
import { INTAKE_TRIGGER_RULES } from '@/lib/clinicalIntake/intakeTriggerRules'
import type {
  GenerateIntakeRequest,
  GenerateIntakeResponse,
  ClinicalIntake,
  StructuredIntakeData,
} from '@/lib/types/clinicalIntake'

const MODEL_FALLBACK = 'claude-sonnet-4-5-20250929'
const MAX_TOKENS = 2000

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
      query = query.limit(INTAKE_TRIGGER_RULES.maxRecentMessages)
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

type IntakeGenerationResult =
  | {
      ok: true
      structuredData: StructuredIntakeData
      clinicalSummary: string
    }
  | {
      ok: false
      errorCode:
        | 'ANTHROPIC_NOT_CONFIGURED'
        | 'OUTPUT_JSON_MISSING'
        | 'OUTPUT_JSON_INVALID'
        | 'OUTPUT_JSON_MISSING_FIELDS'
        | 'OUTPUT_JSON_PARSE_ERROR'
        | 'LLM_REQUEST_FAILED'
    }

/**
 * Generate clinical intake using LLM
 */
async function generateIntakeWithLLM(messages: ChatMessage[]): Promise<IntakeGenerationResult> {
  const engineEnv = getEngineEnv()
  const anthropicApiKey = engineEnv.ANTHROPIC_API_KEY || engineEnv.ANTHROPIC_API_TOKEN
  const model = engineEnv.ANTHROPIC_MODEL ?? MODEL_FALLBACK

  if (!anthropicApiKey) {
    console.warn('[clinical-intake/generate] Anthropic not configured')
    return { ok: false, errorCode: 'ANTHROPIC_NOT_CONFIGURED' }
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
    if (!parsed.ok) {
      console.error('[clinical-intake/generate] Failed to parse LLM output', {
        errorCode: parsed.errorCode,
      })
      return parsed
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

    return { ok: false, errorCode: 'LLM_REQUEST_FAILED' }
  }
}

/**
 * Parse LLM output to extract STRUCTURED_INTAKE and CLINICAL_SUMMARY
 */
function parseIntakeOutput(text: string): IntakeGenerationResult {
  try {
    // Look for OUTPUT_JSON marker
    const jsonMarker = text.indexOf('OUTPUT_JSON')
    if (jsonMarker === -1) {
      console.warn('[clinical-intake/generate] No OUTPUT_JSON marker found')
      return { ok: false, errorCode: 'OUTPUT_JSON_MISSING' }
    }

    const afterMarker = text.slice(jsonMarker)
    const jsonStart = afterMarker.indexOf('{')
    const jsonEnd = afterMarker.lastIndexOf('}')

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.warn('[clinical-intake/generate] Invalid JSON structure')
      return { ok: false, errorCode: 'OUTPUT_JSON_INVALID' }
    }

    const jsonString = afterMarker.slice(jsonStart, jsonEnd + 1)
    const parsed = JSON.parse(jsonString)

    // Validate structure
    if (!parsed.STRUCTURED_INTAKE || !parsed.CLINICAL_SUMMARY) {
      console.warn('[clinical-intake/generate] Missing required fields in output')
      return { ok: false, errorCode: 'OUTPUT_JSON_MISSING_FIELDS' }
    }

    const structuredData = parsed.STRUCTURED_INTAKE as StructuredIntakeData
    const clinicalSummary = parsed.CLINICAL_SUMMARY as string

    // Ensure status is 'draft'
    structuredData.status = 'draft'

    return { ok: true, structuredData, clinicalSummary }
  } catch (err) {
    console.error('[clinical-intake/generate] JSON parse error', { error: String(err) })
    return { ok: false, errorCode: 'OUTPUT_JSON_PARSE_ERROR' }
  }
}

function appendSafetySummary(summary: string, safetyLine: string) {
  const trimmed = summary.trim()
  if (!trimmed) return safetyLine
  if (trimmed.includes(safetyLine)) return trimmed
  return `${trimmed}\n\n${safetyLine}`
}

/**
 * Save intake to database
 */
async function saveIntake(
  userId: string,
  patientProfileId: string | null,
  organizationId: string | null,
  structuredData: StructuredIntakeData,
  clinicalSummary: string,
  messageIds: string[],
  triggerReason: string,
  supabase: any
): Promise<ClinicalIntake | null> {
  try {
    const { data, error } = await supabase
      .from('clinical_intakes' as any)
      .insert({
        user_id: userId,
        patient_id: patientProfileId,
        organization_id: organizationId,
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

    const { data: patientProfile, error: profileError } = (await supabase
      .from('patient_profiles')
      .select('id, organization_id')
      .eq('user_id', user.id)
      .maybeSingle()) as unknown as {
      data: { id: string; organization_id: string | null } | null
      error: { message: string } | null
    }

    if (profileError) {
      console.warn('[clinical-intake/generate] Failed to resolve patient profile', {
        error: profileError.message,
        userId: user.id,
      })
    }

    const patientProfileId = patientProfile?.id ?? null
    const organizationId = patientProfile?.organization_id ?? null

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

    if (messages.length < INTAKE_TRIGGER_RULES.minMessagesForIntake) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_DATA',
            message: `Need at least ${INTAKE_TRIGGER_RULES.minMessagesForIntake} messages for intake generation`,
          },
        } satisfies GenerateIntakeResponse,
        { status: 400 }
      )
    }

    const engineEnv = getEngineEnv()
    const anthropicApiKey = engineEnv.ANTHROPIC_API_KEY || engineEnv.ANTHROPIC_API_TOKEN

    if (!anthropicApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ANTHROPIC_NOT_CONFIGURED',
            message: 'Anthropic API key not configured',
          },
        } satisfies GenerateIntakeResponse,
        { status: 503 }
      )
    }

    // Generate intake with LLM
    const result = await generateIntakeWithLLM(messages)

    if (!result.ok) {
      const errorMap: Record<string, { status: number; message: string }> = {
        OUTPUT_JSON_MISSING: {
          status: 502,
          message: 'LLM output missing OUTPUT_JSON marker',
        },
        OUTPUT_JSON_INVALID: {
          status: 502,
          message: 'LLM output JSON structure invalid',
        },
        OUTPUT_JSON_MISSING_FIELDS: {
          status: 502,
          message: 'LLM output missing required fields',
        },
        OUTPUT_JSON_PARSE_ERROR: {
          status: 502,
          message: 'LLM output JSON parse error',
        },
        LLM_REQUEST_FAILED: {
          status: 502,
          message: 'LLM request failed',
        },
        ANTHROPIC_NOT_CONFIGURED: {
          status: 503,
          message: 'Anthropic API key not configured',
        },
      }

      const mapped = errorMap[result.errorCode] ?? {
        status: 500,
        message: 'Failed to generate clinical intake',
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.errorCode,
            message: mapped.message,
          },
        } satisfies GenerateIntakeResponse,
        { status: mapped.status }
      )
    }

    let ruleOverrides = {}
    const admin = createAdminSupabaseClient()
    try {
      ruleOverrides = await loadActiveSafetyRuleOverrides({ supabase: admin })
    } catch (error) {
      console.warn('[clinical-intake/generate] Failed to load safety rule versions', {
        error: String(error),
      })
    }

    const safetyResult = evaluateRedFlags({
      structuredData: result.structuredData,
      verbatimChatMessages: messages
        .filter((message) => message.role === 'user')
        .map((message) => ({ id: message.id, content: message.content })),
      ruleOverrides,
    })

    const triggeredRules = (safetyResult.triggered_rules ?? []).filter((rule) => rule.verified)

    const policy = loadSafetyPolicy({ organizationId, funnelId: null })
    const policyResult = applySafetyPolicy({ triggeredRules, policy })
    const effective = getEffectiveSafetyState({ policyResult, override: null })

    safetyResult.policy_result = policyResult
    safetyResult.override = null
    safetyResult.effective_action = effective.chatAction
    safetyResult.effective_level = effective.escalationLevel

    result.structuredData.safety = safetyResult
    result.structuredData.red_flags = safetyResult.red_flags.map((flag) => flag.id)

    const activeReasoning = await loadActiveClinicalReasoningConfig({ supabase: admin })
    if (!activeReasoning) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REASONING_CONFIG_MISSING',
            message: 'No active clinical reasoning config found',
          },
        } satisfies GenerateIntakeResponse,
        { status: 503 },
      )
    }

    result.structuredData.reasoning = generateReasoningPack(
      result.structuredData,
      activeReasoning.config_json,
    )

    const safetyLine = formatSafetySummaryLine(safetyResult)
    const clinicalSummary = appendSafetySummary(result.clinicalSummary, safetyLine)

    // Save to database
    let intake = await saveIntake(
      user.id,
      patientProfileId,
      organizationId,
      result.structuredData,
      clinicalSummary,
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

    const updatedTriggeredRules = attachIntakeEvidenceAfterSave({
      intakeId: intake.id,
      structuredData: result.structuredData,
      triggeredRules: safetyResult.triggered_rules ?? [],
    })

    if (updatedTriggeredRules.length > 0) {
      const updatedSafety = {
        ...safetyResult,
        triggered_rules: updatedTriggeredRules,
      }
      result.structuredData.safety = updatedSafety
      result.structuredData.reasoning = generateReasoningPack(
        result.structuredData,
        activeReasoning.config_json,
      )

      const { data: updated, error: updateError } = await supabase
        .from('clinical_intakes' as any)
        .update({
          structured_data: result.structuredData,
        })
        .eq('id', intake.id)
        .select()
        .single()

      if (updateError) {
        console.warn('[clinical-intake/generate] Failed to attach intake evidence', {
          intakeId: intake.id,
          error: updateError.message,
        })
      } else if (updated) {
        intake = updated as unknown as ClinicalIntake
      }
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
