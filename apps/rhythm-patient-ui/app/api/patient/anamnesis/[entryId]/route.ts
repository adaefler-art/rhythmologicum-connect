/**
 * E75.2: Patient Anamnesis API - Get Single Entry
 * E75.3: Patient Anamnesis API - Update Entry (creates new version)
 * 
 * GET /api/patient/anamnesis/[entryId]
 * 
 * Returns a single anamnesis entry with full version history.
 * 
 * Security:
 * - Requires authentication
 * - RLS ensures patient can only see their own entries
 * - Returns 404 if entry not found or not accessible
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     entry: {
 *       id: string,
 *       title: string,
 *       content: object,
 *       entry_type: string | null,
 *       tags: string[],
 *       is_archived: boolean,
 *       created_at: string,
 *       updated_at: string
 *     },
 *     versions: Array<{
 *       id: string,
 *       version_number: number,
 *       title: string,
 *       content: object,
 *       changed_at: string,
 *       change_reason: string | null
 *     }>
 *   }
 * }
 * 
 * PATCH /api/patient/anamnesis/[entryId]
 * 
 * Updates an anamnesis entry. Database trigger automatically creates new version.
 * 
 * Request Body:
 * {
 *   title?: string,
 *   content?: object,
 *   entry_type?: string,
 *   tags?: string[],
 *   change_reason?: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     entry: { id, title, content, ... },
 *     new_version_number: number
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getAnamnesisEntry, getEntryVersions } from '@/lib/api/anamnesis/helpers'
import { ErrorCode } from '@/lib/api/responseTypes'
import {
  interpretedClinicalSummaryObjectSchema,
  MAX_INTAKE_NARRATIVE_LENGTH,
  MAX_INTAKE_SHORT_SUMMARY_ITEMS,
  validateCreateVersion,
} from '@/lib/api/anamnesis/validation'
import { getEngineEnv } from '@/lib/env'
import {
  getClinicalWriteupFewShot,
  getClinicalWriteupInstruction,
  getClinicalWriteupSystemPrompt,
  getIntakeFactNormalizationPrompt,
} from '@/lib/llm/prompts'
import type { Json } from '@/lib/types/supabase'
import { z } from 'zod'

const logIntakeEvent = (params: {
  runId: string | null
  userId: string | null
  action: 'patch'
  entryId: string | null
  entryType: string | null
  ok: boolean
  errorCode?: string
}) => {
  console.info(
    JSON.stringify({
      runId: params.runId,
      userId: params.userId,
      action: params.action,
      entryId: params.entryId,
      entryType: params.entryType,
      ok: params.ok,
      errorCode: params.errorCode ?? null,
    }),
  )
}

type RouteContext = {
  params: Promise<{ entryId: string }>
}

const MODEL_FALLBACK = 'claude-sonnet-4-5-20250929'
const OUTPUT_JSON_MARKER = 'OUTPUT_JSON'
const FIRST_PERSON_REGEX = /\b(ich|mir|mein)\b/i
const MSG_ID_REGEX = /msg_/i

const normalizedFactsSchema = z.object({
  chief_complaint: z.string().max(240).default(''),
  timeline: z.string().max(MAX_INTAKE_NARRATIVE_LENGTH).default(''),
  positives: z.array(z.string().max(200)).max(20).default([]),
  negatives: z.array(z.string().max(200)).max(20).default([]),
  meds: z.array(z.string().max(200)).max(20).default([]),
  psychosocial: z.array(z.string().max(200)).max(20).default([]),
  uncertainty: z.array(z.string().max(200)).max(20).default([]),
  severity: z.enum(['mild', 'moderate', 'severe', 'unknown']).default('unknown'),
})

type InterpretedClinicalSummary = {
  short_summary?: string[]
  narrative_history?: string
  open_questions?: string[]
  relevant_negatives?: string[]
  meds?: string[]
  red_flags?: {
    present: boolean
    items: string[]
  }
}

type NormalizedFacts = z.infer<typeof normalizedFactsSchema>

function hasStructuredIntakeSignal(payload: Record<string, unknown>): boolean {
  const hasString = (value: unknown) => typeof value === 'string' && value.trim().length > 0
  const hasArray = (value: unknown) =>
    Array.isArray(value) && value.some((item) => typeof item === 'string' && item.trim())

  const structured = payload.structured
  if (structured && typeof structured === 'object' && !Array.isArray(structured)) {
    const structuredRecord = structured as Record<string, unknown>
    if (hasArray(structuredRecord.timeline) || hasArray(structuredRecord.key_symptoms)) {
      return true
    }
  }

  return (
    hasString(payload.chief_complaint) ||
    hasString(payload.narrative_summary) ||
    hasArray(payload.red_flags) ||
    hasArray(payload.open_questions) ||
    hasArray(payload.evidence_refs)
  )
}

function sanitizeInterpretedSummary(payload: unknown): InterpretedClinicalSummary | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const data = payload as Record<string, unknown>

  const summary = data.interpreted_clinical_summary
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return null

  const parsed = interpretedClinicalSummaryObjectSchema.safeParse(summary)
  if (!parsed.success) return null

  return parsed.data
}

function extractJsonCandidate(raw: string): string | null {
  if (!raw.trim()) return null
  const trimmed = raw.trim()
  const jsonMatch =
    trimmed.match(/```json\s*([\s\S]*?)\s*```/i) ||
    trimmed.match(/```\s*([\s\S]*?)\s*```/i)

  const base = jsonMatch ? jsonMatch[1] : trimmed
  const markerIndex = base.indexOf(OUTPUT_JSON_MARKER)
  const candidate = markerIndex !== -1 ? base.slice(markerIndex) : base
  const jsonStart = candidate.indexOf('{')
  const jsonEnd = candidate.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null
  return candidate.slice(jsonStart, jsonEnd + 1)
}

function parseOutputJson(raw: string): InterpretedClinicalSummary | null {
  const candidate = extractJsonCandidate(raw)
  if (!candidate) return null

  try {
    return sanitizeInterpretedSummary(JSON.parse(candidate))
  } catch (err) {
    return null
  }
}

function parseNormalizedFacts(raw: string): NormalizedFacts | null {
  const candidate = extractJsonCandidate(raw)
  if (!candidate) return null

  try {
    const parsed = normalizedFactsSchema.safeParse(JSON.parse(candidate))
    return parsed.success ? parsed.data : null
  } catch (err) {
    return null
  }
}

function passesSummaryQuality(summary: InterpretedClinicalSummary): string[] {
  const failures: string[] = []
  const narrative = summary.narrative_history ?? ''
  const shortSummary = summary.short_summary ?? []
  const serialized = JSON.stringify(summary)

  if (FIRST_PERSON_REGEX.test(narrative)) failures.push('narrative_first_person')
  if (MSG_ID_REGEX.test(serialized)) failures.push('contains_msg_id')

  const sentenceCount = narrative
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean).length
  if (sentenceCount < 2) failures.push('narrative_too_short')

  if (shortSummary.length < 5 || shortSummary.length > MAX_INTAKE_SHORT_SUMMARY_ITEMS) {
    failures.push('short_summary_count')
  }

  return failures
}

async function generateNormalizedFacts(
  structuredIntakeData: Record<string, unknown>,
  runId: string | null,
  entryId: string,
): Promise<NormalizedFacts | null> {
  const engineEnv = getEngineEnv()
  const anthropicApiKey = engineEnv.ANTHROPIC_API_KEY || engineEnv.ANTHROPIC_API_TOKEN
  const model = engineEnv.ANTHROPIC_MODEL ?? MODEL_FALLBACK

  if (!anthropicApiKey) {
    console.warn('[patient/anamnesis/[entryId] PATCH] Anthropic not configured', {
      runId,
      entryId,
    })
    return null
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey })
  const systemPrompt = getIntakeFactNormalizationPrompt()
  const userPrompt = `STRUCTURED_INTAKE_DATA:\n${JSON.stringify(structuredIntakeData).slice(0, 6000)}`

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 800,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const responseText = response.content
      .filter((item) => item.type === 'text')
      .map((item) => ('text' in item ? item.text : ''))
      .join('\n')
      .trim()

    return parseNormalizedFacts(responseText)
  } catch (err) {
    console.error('[patient/anamnesis/[entryId] PATCH] Normalization request failed', {
      runId,
      entryId,
      error: String(err),
    })
    return null
  }
}

async function generateClinicalWriteup(
  normalizedFacts: NormalizedFacts,
  runId: string | null,
  entryId: string,
  extraInstruction?: string,
): Promise<InterpretedClinicalSummary | null> {
  const engineEnv = getEngineEnv()
  const anthropicApiKey = engineEnv.ANTHROPIC_API_KEY || engineEnv.ANTHROPIC_API_TOKEN
  const model = engineEnv.ANTHROPIC_MODEL ?? MODEL_FALLBACK

  if (!anthropicApiKey) {
    console.warn('[patient/anamnesis/[entryId] PATCH] Anthropic not configured', {
      runId,
      entryId,
    })
    return null
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey })
  const systemPrompt = getClinicalWriteupSystemPrompt()
  const instruction = getClinicalWriteupInstruction()
  const fewShot = getClinicalWriteupFewShot()
  const retryHint = extraInstruction ? `\n${extraInstruction}` : ''
  const outputSchema = `{
  "interpreted_clinical_summary": {
    "short_summary": ["..."],
    "narrative_history": "...",
    "open_questions": ["..."],
    "relevant_negatives": ["..."],
    "meds": ["..."],
    "red_flags": { "present": false, "items": ["..."] }
  }
}`
  const userPrompt = `${instruction}\n${fewShot}\nInput (normalized_facts):\n${JSON.stringify(normalizedFacts, null, 2)}\n\nOutput-Schema:\n${outputSchema}\n\nGib NUR JSON mit interpreted_clinical_summary gemaess Schema aus.${retryHint}`

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1000,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const responseText = response.content
      .filter((item) => item.type === 'text')
      .map((item) => ('text' in item ? item.text : ''))
      .join('\n')
      .trim()

    return parseOutputJson(responseText)
  } catch (err) {
    console.error('[patient/anamnesis/[entryId] PATCH] Writeup request failed', {
      runId,
      entryId,
      error: String(err),
    })
    return null
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { entryId } = await context.params
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
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

    // Fetch entry (RLS will ensure it's patient's own entry)
    const entry = await getAnamnesisEntry(supabase, entryId)

    if (!entry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Anamnesis entry not found',
          },
        },
        { status: 404 }
      )
    }

    if (entry.entry_type === 'intake') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTAKE_NOT_SUPPORTED',
            message: 'Intake is sourced from clinical_intakes only.',
          },
        },
        { status: 410 },
      )
    }

    // Fetch all versions
    const versions = await getEntryVersions(supabase, entryId)

    // Transform versions to include only necessary fields
    const transformedVersions = versions.map((v) => ({
      id: v.id,
      version_number: v.version_number,
      title: v.title,
      content: v.content,
      entry_type: v.entry_type,
      tags: v.tags,
      changed_at: v.changed_at,
      change_reason: v.change_reason,
      changed_by: v.changed_by,
    }))

    return NextResponse.json({
      success: true,
      data: {
        entry: {
          id: entry.id,
          title: entry.title,
          content: entry.content,
          entry_type: entry.entry_type,
          tags: entry.tags,
          is_archived: entry.is_archived,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          created_by: entry.created_by,
          updated_by: entry.updated_by,
        },
        versions: transformedVersions,
      },
    })
  } catch (err) {
    console.error('[patient/anamnesis/[entryId] GET] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const runId = request.headers.get('x-intake-run-id')

  try {
    const { entryId } = await context.params
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logIntakeEvent({
        runId,
        userId: user?.id ?? null,
        action: 'patch',
        entryId,
        entryType: null,
        ok: false,
        errorCode: ErrorCode.UNAUTHORIZED,
      })
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

    // Fetch entry (RLS will ensure it's patient's own entry)
    const entry = await getAnamnesisEntry(supabase, entryId)

    if (!entry) {
      logIntakeEvent({
        runId,
        userId: user.id,
        action: 'patch',
        entryId,
        entryType: null,
        ok: false,
        errorCode: ErrorCode.NOT_FOUND,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Anamnesis entry not found',
          },
        },
        { status: 404 }
      )
    }

    if (entry.entry_type === 'intake') {
      logIntakeEvent({
        runId,
        userId: user.id,
        action: 'patch',
        entryId,
        entryType: entry.entry_type,
        ok: false,
        errorCode: 'INTAKE_NOT_SUPPORTED',
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTAKE_NOT_SUPPORTED',
            message: 'Intake is sourced from clinical_intakes only.',
          },
        },
        { status: 410 },
      )
    }

    // Parse and validate request body
    const body = await request.json()
    let validatedData

    try {
      validatedData = validateCreateVersion(body)
    } catch (err) {
      if (err instanceof z.ZodError) {
        logIntakeEvent({
          runId,
          userId: user.id,
          action: 'patch',
          entryId,
          entryType: typeof body?.entry_type === 'string' ? body.entry_type : entry.entry_type,
          ok: false,
          errorCode: ErrorCode.VALIDATION_FAILED,
        })
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.VALIDATION_FAILED,
              message: 'Validation failed',
              details: err.issues,
            },
          },
          { status: 400 }
        )
      }
      throw err
    }

    const nextEntryType = validatedData.entry_type || entry.entry_type
    if (nextEntryType === 'intake') {
      logIntakeEvent({
        runId,
        userId: user.id,
        action: 'patch',
        entryId,
        entryType: nextEntryType,
        ok: false,
        errorCode: 'INTAKE_NOT_SUPPORTED',
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTAKE_NOT_SUPPORTED',
            message: 'Intake is sourced from clinical_intakes only.',
          },
        },
        { status: 410 },
      )
    }
    const nextContent = validatedData.content as Record<string, unknown>
    const structuredIntakeData =
      nextEntryType === 'intake' &&
      nextContent.structured_intake_data &&
      typeof nextContent.structured_intake_data === 'object' &&
      !Array.isArray(nextContent.structured_intake_data)
        ? (nextContent.structured_intake_data as Record<string, unknown>)
        : null

    if (structuredIntakeData && hasStructuredIntakeSignal(structuredIntakeData)) {
      const normalizedFacts = await generateNormalizedFacts(structuredIntakeData, runId, entryId)

      if (normalizedFacts) {
        let interpretedSummary = await generateClinicalWriteup(
          normalizedFacts,
          runId,
          entryId,
        )
        let failures = interpretedSummary ? passesSummaryQuality(interpretedSummary) : ['invalid']

        if (!interpretedSummary || failures.length > 0) {
          interpretedSummary = await generateClinicalWriteup(
            normalizedFacts,
            runId,
            entryId,
            'Dein Output war nicht in Arztsprache. Schreibe strikt in 3. Person und als klinische Dokumentation.',
          )
          failures = interpretedSummary ? passesSummaryQuality(interpretedSummary) : ['invalid']
        }

        if (interpretedSummary && failures.length === 0) {
          nextContent.interpreted_clinical_summary = interpretedSummary
        } else if (failures.length > 0) {
          console.warn('[patient/anamnesis/[entryId] PATCH] Intake summary quality gate failed', {
            runId,
            entryId,
            failures,
          })
        }
      }
    }

    // Update entry (trigger will create new version automatically)
    const { data: updatedEntry, error: updateError } = await supabase
      .from('anamnesis_entries')
      .update({
        title: validatedData.title,
        content: nextContent as Json,
        entry_type: nextEntryType || null,
        tags: validatedData.tags || entry.tags,
        updated_by: user.id,
      })
      .eq('id', entryId)
      .select()
      .single()

    if (updateError) {
      console.error('[patient/anamnesis/[entryId] PATCH] Update error:', updateError)
      logIntakeEvent({
        runId,
        userId: user.id,
        action: 'patch',
        entryId,
        entryType: validatedData.entry_type || entry.entry_type,
        ok: false,
        errorCode: ErrorCode.DATABASE_ERROR,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to update anamnesis entry',
          },
        },
        { status: 500 }
      )
    }

    logIntakeEvent({
      runId,
      userId: user.id,
      action: 'patch',
      entryId: updatedEntry.id,
      entryType: updatedEntry.entry_type,
      ok: true,
    })

    // Get the latest version number (created by trigger)
    const { data: latestVersion, error: versionError } = await supabase
      .from('anamnesis_entry_versions')
      .select('version_number')
      .eq('entry_id', entryId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError) {
      console.error('[patient/anamnesis/[entryId] PATCH] Version fetch error:', versionError)
    }

    return NextResponse.json({
      success: true,
      data: {
        entry: updatedEntry,
        new_version_number: latestVersion?.version_number || null,
      },
    })
  } catch (err) {
    console.error('[patient/anamnesis/[entryId] PATCH] Unexpected error:', err)
    logIntakeEvent({
      runId,
      userId: null,
      action: 'patch',
      entryId: null,
      entryType: null,
      ok: false,
      errorCode: ErrorCode.INTERNAL_ERROR,
    })
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
