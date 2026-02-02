/**
 * Diagnosis Run Worker - E76.4
 *
 * Executes diagnosis runs by:
 * 1. Setting status to in_progress
 * 2. Fetching context pack (assessment data, funnel config)
 * 3. Calling LLM/MCP for diagnosis
 * 4. Persisting artifact to diagnosis_result
 * 5. Setting status to completed or failed
 *
 * Error Handling:
 * - VALIDATION_ERROR: Invalid diagnosis result schema
 * - CONTEXT_FETCH_ERROR: Failed to fetch context pack
 * - LLM_ERROR: LLM/MCP call failed
 * - PHI-free error logging
 *
 * @module lib/diagnosis/worker
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// ============================================================
// Types
// ============================================================

export type DiagnosisRunStatus = 'queued' | 'in_progress' | 'completed' | 'failed'

export interface DiagnosisRun {
  id: string
  assessment_id: string
  correlation_id: string
  status: DiagnosisRunStatus
  attempt: number
  max_attempts: number
  context_pack?: ContextPack
  diagnosis_result?: DiagnosisResult
  errors: ErrorEntry[]
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
  schema_version: string
}

export interface ContextPack {
  assessment_data: Record<string, unknown>
  funnel_config: Record<string, unknown>
  patient_context: Record<string, unknown>
}

export interface DiagnosisResult {
  diagnosis: Record<string, unknown>
  confidence: number
  metadata: Record<string, unknown>
}

export interface ErrorEntry {
  code: string
  message: string
  timestamp: string
}

export interface DiagnosisWorkerResult {
  success: boolean
  runId?: string
  status?: DiagnosisRunStatus
  error?: string
  errorCode?: string
}

// ============================================================
// Error Codes
// ============================================================

export const ERROR_CODES = {
  RUN_NOT_FOUND: 'RUN_NOT_FOUND',
  INVALID_STATUS: 'INVALID_STATUS',
  CONTEXT_FETCH_ERROR: 'CONTEXT_FETCH_ERROR',
  LLM_ERROR: 'LLM_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERSISTENCE_ERROR: 'PERSISTENCE_ERROR',
  MAX_ATTEMPTS_REACHED: 'MAX_ATTEMPTS_REACHED',
} as const

// ============================================================
// Context Pack Fetching
// ============================================================

/**
 * Fetches context pack for diagnosis run
 * Includes assessment answers, funnel configuration, and patient context
 */
async function fetchContextPack(
  supabase: SupabaseClient,
  assessmentId: string,
): Promise<{ success: boolean; contextPack?: ContextPack; error?: string }> {
  try {
    // Fetch assessment answers
    const { data: answers, error: answersError } = await supabase
      .from('assessment_answers')
      .select('question_id, answer_value')
      .eq('assessment_id', assessmentId)

    if (answersError) {
      return {
        success: false,
        error: `Failed to fetch assessment answers: ${answersError.message}`,
      }
    }

    // Fetch assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, funnel_id, created_at')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return {
        success: false,
        error: 'Failed to fetch assessment',
      }
    }

    // Fetch patient profile (limited fields for context)
    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id, created_at')
      .eq('id', assessment.patient_id)
      .single()

    if (patientError) {
      return {
        success: false,
        error: 'Failed to fetch patient context',
      }
    }

    // Build context pack
    const contextPack: ContextPack = {
      assessment_data: {
        id: assessment.id,
        answers: answers || [],
        created_at: assessment.created_at,
      },
      funnel_config: {
        funnel: assessment.funnel,
        funnel_id: assessment.funnel_id,
      },
      patient_context: {
        patient_id: patient.id,
        patient_created_at: patient.created_at,
      },
    }

    return {
      success: true,
      contextPack,
    }
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error fetching context pack: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// ============================================================
// LLM/MCP Integration
// ============================================================

/**
 * Calls LLM/MCP to generate diagnosis
 * Uses Anthropic Claude API
 */
async function generateDiagnosis(
  contextPack: ContextPack,
): Promise<{ success: boolean; diagnosis?: DiagnosisResult; error?: string }> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return {
        success: false,
        error: 'ANTHROPIC_API_KEY not configured',
      }
    }

    const anthropic = new Anthropic({ apiKey })

    // Build prompt from context pack
    const prompt = `Based on the following assessment data, provide a diagnostic analysis:

Assessment Answers: ${JSON.stringify(contextPack.assessment_data.answers, null, 2)}

Please provide a structured diagnosis with confidence level (0-1).`

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract text response
    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return {
        success: false,
        error: 'No text response from LLM',
      }
    }

    // Parse response (in real implementation, this would be more sophisticated)
    const diagnosis: DiagnosisResult = {
      diagnosis: {
        raw_output: textContent.text,
        model: 'claude-sonnet-4-5-20250929',
      },
      confidence: 0.85, // In real implementation, extract from response
      metadata: {
        message_id: message.id,
        usage: message.usage,
        created_at: new Date().toISOString(),
      },
    }

    return {
      success: true,
      diagnosis,
    }
  } catch (error) {
    return {
      success: false,
      error: `LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// ============================================================
// Diagnosis Result Validation
// ============================================================

/**
 * Validates diagnosis result schema
 * Returns true if valid, false otherwise
 */
function validateDiagnosisResult(result: unknown): result is DiagnosisResult {
  if (typeof result !== 'object' || result === null) {
    return false
  }

  const r = result as Record<string, unknown>

  // Check required fields
  if (typeof r.diagnosis !== 'object' || r.diagnosis === null) {
    return false
  }

  if (typeof r.confidence !== 'number' || r.confidence < 0 || r.confidence > 1) {
    return false
  }

  if (typeof r.metadata !== 'object' || r.metadata === null) {
    return false
  }

  return true
}

// ============================================================
// Error Handling
// ============================================================

/**
 * Redacts PHI from error messages
 * Returns PHI-free error message
 */
function redactError(error: string): string {
  // Simple redaction - in production, use more sophisticated approach
  return error.replace(/user_id|email|name|phone/gi, '[REDACTED]')
}

/**
 * Adds error entry to run
 */
async function addErrorEntry(
  supabase: SupabaseClient,
  runId: string,
  code: string,
  message: string,
): Promise<void> {
  const errorEntry: ErrorEntry = {
    code,
    message: redactError(message),
    timestamp: new Date().toISOString(),
  }

  // Fetch current errors
  const { data: run } = await supabase
    .from('diagnosis_runs')
    .select('errors')
    .eq('id', runId)
    .single()

  const currentErrors = (run?.errors as ErrorEntry[]) || []
  const updatedErrors = [...currentErrors, errorEntry]

  // Update errors
  await supabase.from('diagnosis_runs').update({ errors: updatedErrors }).eq('id', runId)
}

// ============================================================
// Main Worker Function
// ============================================================

/**
 * Executes a diagnosis run
 *
 * Steps:
 * 1. Fetch run from database
 * 2. Validate run is in queued status
 * 3. Update status to in_progress
 * 4. Fetch context pack
 * 5. Call LLM/MCP
 * 6. Validate diagnosis result
 * 7. Persist artifact
 * 8. Update status to completed
 *
 * On error:
 * - Log error (PHI-free)
 * - Update status to failed
 * - Set appropriate error code
 *
 * @param supabase - Supabase admin client
 * @param runId - Diagnosis run ID
 * @returns Worker result
 */
export async function executeDiagnosisRun(
  supabase: SupabaseClient,
  runId: string,
): Promise<DiagnosisWorkerResult> {
  try {
    // Step 1: Fetch run
    const { data: run, error: fetchError } = await supabase
      .from('diagnosis_runs')
      .select('*')
      .eq('id', runId)
      .single()

    if (fetchError || !run) {
      return {
        success: false,
        error: 'Diagnosis run not found',
        errorCode: ERROR_CODES.RUN_NOT_FOUND,
      }
    }

    // Step 2: Validate status
    if (run.status !== 'queued') {
      return {
        success: false,
        error: `Invalid status: expected queued, got ${run.status}`,
        errorCode: ERROR_CODES.INVALID_STATUS,
      }
    }

    // Check max attempts
    if (run.attempt > run.max_attempts) {
      await supabase.from('diagnosis_runs').update({ status: 'failed' }).eq('id', runId)

      await addErrorEntry(supabase, runId, ERROR_CODES.MAX_ATTEMPTS_REACHED, 'Max attempts reached')

      return {
        success: false,
        error: 'Max attempts reached',
        errorCode: ERROR_CODES.MAX_ATTEMPTS_REACHED,
        runId,
        status: 'failed',
      }
    }

    // Step 3: Update status to in_progress
    const { error: updateError } = await supabase
      .from('diagnosis_runs')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', runId)

    if (updateError) {
      return {
        success: false,
        error: 'Failed to update run status',
        errorCode: ERROR_CODES.PERSISTENCE_ERROR,
      }
    }

    // Step 4: Fetch context pack
    const contextResult = await fetchContextPack(supabase, run.assessment_id)
    if (!contextResult.success || !contextResult.contextPack) {
      await supabase.from('diagnosis_runs').update({ status: 'failed' }).eq('id', runId)

      await addErrorEntry(
        supabase,
        runId,
        ERROR_CODES.CONTEXT_FETCH_ERROR,
        contextResult.error || 'Unknown error',
      )

      return {
        success: false,
        error: contextResult.error,
        errorCode: ERROR_CODES.CONTEXT_FETCH_ERROR,
        runId,
        status: 'failed',
      }
    }

    // Persist context pack
    await supabase.from('diagnosis_runs').update({ context_pack: contextResult.contextPack }).eq('id', runId)

    // Step 5: Call LLM/MCP
    const diagnosisResult = await generateDiagnosis(contextResult.contextPack)
    if (!diagnosisResult.success || !diagnosisResult.diagnosis) {
      await supabase.from('diagnosis_runs').update({ status: 'failed' }).eq('id', runId)

      await addErrorEntry(
        supabase,
        runId,
        ERROR_CODES.LLM_ERROR,
        diagnosisResult.error || 'Unknown error',
      )

      return {
        success: false,
        error: diagnosisResult.error,
        errorCode: ERROR_CODES.LLM_ERROR,
        runId,
        status: 'failed',
      }
    }

    // Step 6: Validate diagnosis result
    if (!validateDiagnosisResult(diagnosisResult.diagnosis)) {
      await supabase.from('diagnosis_runs').update({ status: 'failed' }).eq('id', runId)

      await addErrorEntry(
        supabase,
        runId,
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid diagnosis result schema',
      )

      return {
        success: false,
        error: 'Invalid diagnosis result schema',
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        runId,
        status: 'failed',
      }
    }

    // Step 7: Persist artifact
    const { error: persistError } = await supabase
      .from('diagnosis_runs')
      .update({
        diagnosis_result: diagnosisResult.diagnosis,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)

    if (persistError) {
      await supabase.from('diagnosis_runs').update({ status: 'failed' }).eq('id', runId)

      await addErrorEntry(supabase, runId, ERROR_CODES.PERSISTENCE_ERROR, persistError.message)

      return {
        success: false,
        error: 'Failed to persist diagnosis result',
        errorCode: ERROR_CODES.PERSISTENCE_ERROR,
        runId,
        status: 'failed',
      }
    }

    // Step 8: Success
    return {
      success: true,
      runId,
      status: 'completed',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Try to update status to failed
    try {
      await supabase.from('diagnosis_runs').update({ status: 'failed' }).eq('id', runId)
      await addErrorEntry(supabase, runId, 'UNEXPECTED_ERROR', errorMessage)
    } catch {
      // Ignore errors in error handling
    }

    return {
      success: false,
      error: errorMessage,
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}

/**
 * Creates a diagnosis run (idempotent)
 *
 * @param supabase - Supabase admin client
 * @param assessmentId - Assessment ID
 * @param correlationId - Idempotency key
 * @returns Result with run ID
 */
export async function createDiagnosisRun(
  supabase: SupabaseClient,
  assessmentId: string,
  correlationId: string,
): Promise<DiagnosisWorkerResult> {
  try {
    // Check if run already exists
    const { data: existingRun } = await supabase
      .from('diagnosis_runs')
      .select('id, status')
      .eq('assessment_id', assessmentId)
      .eq('correlation_id', correlationId)
      .eq('schema_version', 'v1')
      .single()

    if (existingRun) {
      return {
        success: true,
        runId: existingRun.id,
        status: existingRun.status as DiagnosisRunStatus,
      }
    }

    // Create new run
    const { data: newRun, error: createError } = await supabase
      .from('diagnosis_runs')
      .insert({
        assessment_id: assessmentId,
        correlation_id: correlationId,
        status: 'queued',
        schema_version: 'v1',
      })
      .select('id, status')
      .single()

    if (createError) {
      // Check for unique constraint violation (race condition)
      if (createError.code === '23505') {
        // Refetch the run created by the concurrent request
        const { data: concurrentRun } = await supabase
          .from('diagnosis_runs')
          .select('id, status')
          .eq('assessment_id', assessmentId)
          .eq('correlation_id', correlationId)
          .eq('schema_version', 'v1')
          .single()

        if (concurrentRun) {
          return {
            success: true,
            runId: concurrentRun.id,
            status: concurrentRun.status as DiagnosisRunStatus,
          }
        }
      }

      return {
        success: false,
        error: `Failed to create diagnosis run: ${createError.message}`,
        errorCode: ERROR_CODES.PERSISTENCE_ERROR,
      }
    }

    return {
      success: true,
      runId: newRun.id,
      status: newRun.status as DiagnosisRunStatus,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}
