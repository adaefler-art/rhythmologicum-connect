import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  successResponse,
  forbiddenResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
  databaseErrorResponse,
  conflictResponse,
} from '@/lib/api/responses'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { getRequestId, withRequestId, sanitizeSupabaseError, logError } from '@/lib/db/errors'
import { buildPatientContextPack } from '@/lib/mcp/contextPackBuilder'
import { getEngineEnv } from '@/lib/env'

/**
 * E76.4 API Endpoint: Execute a diagnosis run
 * POST /api/studio/diagnosis-runs/{runId}/execute
 * 
 * Worker endpoint that executes a queued diagnosis run:
 * 1. Sets status to 'running'
 * 2. Fetches context pack for the patient
 * 3. Calls LLM/MCP for diagnosis
 * 4. Validates diagnosis JSON schema
 * 5. Persists artifact on success
 * 6. On error: sets status to 'failed' with error payload
 * 
 * Concurrency protection: Only runs in 'queued' status can be executed.
 * 
 * Strategy A Compliance:
 * - Literal callsite: apps/rhythm-studio-ui/components/studio/DiagnosisRunsPanel.tsx (feature-flagged)
 * - Feature flag: NEXT_PUBLIC_FEATURE_DIAGNOSIS_WORKER_ENABLED (default: false)
 * 
 * @endpoint-intent studio:diagnosis-worker Execute queued diagnosis runs
 */

const MODEL_FALLBACK = 'claude-sonnet-4-5-20250929'

// Diagnosis schema validation
interface DiagnosisResult {
  summary: string
  findings: string[]
  recommendations: string[]
  risk_level?: 'low' | 'moderate' | 'high' | 'critical'
  confidence_score?: number
}

function validateDiagnosisResult(data: unknown): { valid: boolean; errors?: string[] } {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Diagnosis result must be an object'] }
  }

  const diagnosis = data as Record<string, unknown>

  // Required fields
  if (!diagnosis.summary || typeof diagnosis.summary !== 'string') {
    errors.push('summary is required and must be a string')
  }

  if (!Array.isArray(diagnosis.findings)) {
    errors.push('findings is required and must be an array')
  } else {
    const invalidFindings = diagnosis.findings.filter((f) => typeof f !== 'string')
    if (invalidFindings.length > 0) {
      errors.push('all findings must be strings')
    }
  }

  if (!Array.isArray(diagnosis.recommendations)) {
    errors.push('recommendations is required and must be an array')
  } else {
    const invalidRecs = diagnosis.recommendations.filter((r) => typeof r !== 'string')
    if (invalidRecs.length > 0) {
      errors.push('all recommendations must be strings')
    }
  }

  // Optional fields validation
  if (diagnosis.risk_level !== undefined) {
    const validLevels = ['low', 'moderate', 'high', 'critical']
    if (!validLevels.includes(diagnosis.risk_level as string)) {
      errors.push(`risk_level must be one of: ${validLevels.join(', ')}`)
    }
  }

  if (diagnosis.confidence_score !== undefined) {
    const score = diagnosis.confidence_score
    if (typeof score !== 'number' || score < 0 || score > 1) {
      errors.push('confidence_score must be a number between 0 and 1')
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ runId: string }> }
) {
  const requestId = getRequestId(request)

  try {
    const { runId } = await context.params

    // Validate runId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(runId)) {
      return withRequestId(
        validationErrorResponse('Invalid run ID format', undefined, requestId),
        requestId
      )
    }

    // Auth gate
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(undefined, requestId), requestId)
    }

    // Authorization gate (clinician/admin only)
    const isAuthorized = await hasAdminOrClinicianRole()
    if (!isAuthorized) {
      return withRequestId(forbiddenResponse(undefined, requestId), requestId)
    }

    // Fetch diagnosis run (RLS will automatically filter to only accessible runs)
    const { data: run, error: fetchError } = await supabase
      .from('diagnosis_runs')
      .select('*')
      .eq('id', runId)
      .single()

    if (fetchError) {
      const safeErr = sanitizeSupabaseError(fetchError)
      if (safeErr.code === 'PGRST116') {
        return withRequestId(
          notFoundResponse('DiagnosisRun', `Diagnosis run not found: ${runId}`, requestId),
          requestId
        )
      }
      logError({ requestId, operation: 'fetch_diagnosis_run', userId: user.id, error: safeErr })
      return withRequestId(databaseErrorResponse(undefined, requestId), requestId)
    }

    if (!run) {
      return withRequestId(
        notFoundResponse('DiagnosisRun', `Diagnosis run not found: ${runId}`, requestId),
        requestId
      )
    }

    // Concurrency protection: Only 'queued' runs can be executed
    if (run.status !== 'queued') {
      return withRequestId(
        conflictResponse(
          `Run is not in 'queued' status (current: ${run.status})`,
          undefined,
          requestId
        ),
        requestId
      )
    }

    // Transition to 'running' status
    const { error: runningError } = await supabase
      .from('diagnosis_runs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', runId)
      .eq('status', 'queued') // Additional concurrency check

    if (runningError) {
      const safeErr = sanitizeSupabaseError(runningError)
      logError({
        requestId,
        operation: 'transition_to_running',
        userId: user.id,
        error: safeErr,
      })
      return withRequestId(databaseErrorResponse(undefined, requestId), requestId)
    }

    let diagnosisResult: DiagnosisResult | null = null
    let errorInfo: Record<string, unknown> | null = null

    try {
      // Step 1: Build patient context pack
      const adminSupabase = createAdminSupabaseClient()
      const contextPack = await buildPatientContextPack(adminSupabase, run.patient_id)

      // Step 2: Call LLM for diagnosis
      const engineEnv = getEngineEnv()
      const anthropicApiKey = engineEnv.ANTHROPIC_API_KEY || engineEnv.ANTHROPIC_API_TOKEN

      if (!anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY is not configured')
      }

      const anthropic = new Anthropic({
        apiKey: anthropicApiKey,
      })

      const model = engineEnv.ANTHROPIC_MODEL ?? MODEL_FALLBACK

      // Build prompt for diagnosis
      const systemPrompt = `You are a medical AI assistant helping to analyze patient stress and resilience data.
Your role is to review patient assessments and provide a structured diagnosis.

Return your analysis in the following JSON format:
{
  "summary": "Brief overview of the patient's condition",
  "findings": ["Finding 1", "Finding 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "risk_level": "low" | "moderate" | "high" | "critical",
  "confidence_score": 0.0 to 1.0
}

Base your analysis on the patient context provided. Be professional and evidence-based.`

      const userPrompt = `Please analyze the following patient context and provide a structured diagnosis:

Patient ID: ${contextPack.patient_id}
Demographics: ${JSON.stringify(contextPack.demographics)}
Current Measures: ${JSON.stringify(contextPack.current_measures)}
Anamnesis Entries: ${contextPack.anamnesis.entries.length} entries
Funnel Runs: ${contextPack.funnel_runs.runs.length} completed assessments

Context Pack:
${JSON.stringify(contextPack, null, 2)}`

      const response = await anthropic.messages.create({
        model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      })

      // Extract diagnosis from response
      const textContent = response.content.find((c) => c.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in LLM response')
      }

      // Parse JSON from response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response')
      }

      diagnosisResult = JSON.parse(jsonMatch[0]) as DiagnosisResult

      // Step 3: Validate diagnosis schema
      const validation = validateDiagnosisResult(diagnosisResult)
      if (!validation.valid) {
        errorInfo = {
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid diagnosis schema',
          validation_errors: validation.errors,
          raw_response: textContent.text,
        }

        // Set run to failed with validation error
        await supabase
          .from('diagnosis_runs')
          .update({
            status: 'failed',
            error_info: errorInfo,
            completed_at: new Date().toISOString(),
          })
          .eq('id', runId)

        return withRequestId(
          validationErrorResponse(
            'Diagnosis validation failed',
            { errors: validation.errors },
            requestId
          ),
          requestId
        )
      }

      // Step 4: Persist artifact
      const { data: artifact, error: artifactError } = await supabase
        .from('diagnosis_artifacts')
        .insert({
          organization_id: run.organization_id,
          artifact_type: 'diagnosis_report',
          artifact_name: `Diagnosis Report for Run ${runId}`,
          artifact_data: diagnosisResult,
        })
        .select()
        .single()

      if (artifactError) {
        throw new Error(`Failed to create artifact: ${artifactError.message}`)
      }

      // Link artifact to run
      const { error: linkError } = await supabase.from('diagnosis_run_artifacts').insert({
        run_id: runId,
        artifact_id: artifact.id,
        sequence_order: 0,
      })

      if (linkError) {
        throw new Error(`Failed to link artifact: ${linkError.message}`)
      }

      // Step 5: Mark run as succeeded
      const { error: successError } = await supabase
        .from('diagnosis_runs')
        .update({
          status: 'succeeded',
          output_data: {
            artifact_id: artifact.id,
            diagnosis: diagnosisResult,
            context_hash: contextPack.metadata.inputs_hash,
          },
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId)

      if (successError) {
        throw new Error(`Failed to update run to succeeded: ${successError.message}`)
      }

      return withRequestId(
        successResponse(
          {
            run: {
              id: runId,
              status: 'succeeded',
              artifact_id: artifact.id,
            },
          },
          200,
          requestId
        ),
        requestId
      )
    } catch (error) {
      // Handle any errors during execution
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      errorInfo = {
        error_code: 'EXECUTION_ERROR',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      }

      // Set run to failed with error info
      await supabase
        .from('diagnosis_runs')
        .update({
          status: 'failed',
          error_info: errorInfo,
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId)

      logError({
        requestId,
        operation: 'execute_diagnosis_run',
        userId: user.id,
        error: sanitizeSupabaseError(error),
      })

      return withRequestId(
        internalErrorResponse(
          { message: 'Failed to execute diagnosis run', details: errorInfo },
          requestId
        ),
        requestId
      )
    }
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    logError({
      requestId,
      operation: 'POST /api/studio/diagnosis-runs/[runId]/execute',
      error: safeErr,
    })
    return withRequestId(internalErrorResponse(undefined, requestId), requestId)
  }
}
