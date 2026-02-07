/**
 * E76.4: Diagnosis Execution Worker
 * 
 * Worker module for executing queued diagnosis runs:
 * 1. Sets status to 'running'
 * 2. Fetches context pack
 * 3. Calls LLM/MCP for diagnosis
 * 4. Validates diagnosis JSON output
 * 5. Persists artifact
 * 6. Updates status (completed/failed)
 * 
 * Handles concurrency prevention and error tracking.
 */

import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/types/supabase'
import { env } from '@/lib/env'
import { buildPatientContextPack } from '@/lib/mcp/contextPackBuilder'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'
import {
  DIAGNOSIS_RUN_STATUS,
  DIAGNOSIS_ERROR_CODE,
  ARTIFACT_TYPE,
  DEFAULT_SCHEMA_VERSION,
  DiagnosisResultSchema,
  type DiagnosisRun,
  type DiagnosisArtifact,
  type DiagnosisErrorCode,
} from '@/lib/contracts/diagnosis'

const MCP_TIMEOUT_MS = 30000

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Result of diagnosis execution
 */
export interface DiagnosisExecutionResult {
  success: boolean
  run_id: string
  artifact_id?: string
  error?: {
    code: DiagnosisErrorCode
    message: string
    details?: Json
  }
}

function serializeErrorDetails(error: unknown): Json {
  if (error === undefined || error === null) {
    return null
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack || null,
    }
  }

  try {
    return JSON.parse(JSON.stringify(error)) as Json
  } catch {
    return String(error)
  }
}

/**
 * Execute a single diagnosis run
 * 
 * @param adminClient - Supabase admin client (bypasses RLS)
 * @param runId - UUID of the diagnosis run to execute
 * @returns Execution result with artifact ID or error
 */
export async function executeDiagnosisRun(
  adminClient: SupabaseClient<Database>,
  runId: string,
): Promise<DiagnosisExecutionResult> {
  const startTime = Date.now()

  try {
    // =========================================================================
    // STEP 1: Fetch run and check status (concurrency prevention)
    // =========================================================================
    
    const { data: run, error: fetchError } = await adminClient
      .from('diagnosis_runs')
      .select('*')
      .eq('id', runId)
      .single()

    if (fetchError || !run) {
      return {
        success: false,
        run_id: runId,
        error: {
          code: DIAGNOSIS_ERROR_CODE.UNKNOWN_ERROR,
          message: 'Failed to fetch diagnosis run',
          details: { fetchError: serializeErrorDetails(fetchError) },
        },
      }
    }

    // Prevent processing if not in 'queued' status (concurrency check)
    if (run.status !== DIAGNOSIS_RUN_STATUS.QUEUED) {
      return {
        success: false,
        run_id: runId,
        error: {
          code: DIAGNOSIS_ERROR_CODE.VALIDATION_ERROR,
          message: `Run is not in queued status (current: ${run.status})`,
        },
      }
    }

    // =========================================================================
    // STEP 2: Update status to 'running'
    // =========================================================================
    
    const { error: updateRunningError } = await adminClient
      .from('diagnosis_runs')
      .update({
        status: DIAGNOSIS_RUN_STATUS.RUNNING,
        started_at: new Date().toISOString(),
      })
      .eq('id', runId)

    if (updateRunningError) {
      return {
        success: false,
        run_id: runId,
        error: {
          code: DIAGNOSIS_ERROR_CODE.UNKNOWN_ERROR,
          message: 'Failed to update run status to running',
          details: { updateRunningError: serializeErrorDetails(updateRunningError) },
        },
      }
    }

    // =========================================================================
    // STEP 3: Build context pack
    // =========================================================================
    
    let contextPack
    try {
      const resolution = await resolvePatientIds(adminClient, run.patient_id)

      if (!resolution.patientProfileId) {
        throw new Error('Patient profile not found for diagnosis run')
      }

      contextPack = await buildPatientContextPack(adminClient, resolution.patientProfileId)
    } catch (contextError) {
      await updateRunAsFailed(adminClient, runId, {
        code: DIAGNOSIS_ERROR_CODE.CONTEXT_PACK_ERROR,
        message: 'Failed to build patient context pack',
        details: { contextError: serializeErrorDetails(contextError) },
      })
      return {
        success: false,
        run_id: runId,
        error: {
          code: DIAGNOSIS_ERROR_CODE.CONTEXT_PACK_ERROR,
          message: 'Failed to build patient context pack',
          details: { contextError: serializeErrorDetails(contextError) },
        },
      }
    }

    // =========================================================================
    // STEP 4: Call MCP/LLM for diagnosis
    // =========================================================================
    
    let mcpResponse
    try {
      // Call MCP server's run_diagnosis tool
      // Note: In production, MCP_SERVER_URL must be set to the actual MCP server endpoint
      // Default 'http://localhost:3001' is for local development only
      const mcpUrl = env.MCP_SERVER_URL || 'http://localhost:3001'
      
      if (!env.MCP_SERVER_URL && env.NODE_ENV === 'production') {
        throw new Error('MCP_SERVER_URL must be configured in production environment')
      }
      
      const response = await fetchWithTimeout(`${mcpUrl}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'run_diagnosis',
          input: {
            patient_id: run.patient_id,
            options: {
              include_history: true,
            },
          },
        }),
      }, MCP_TIMEOUT_MS)

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        const errorCode =
          errorPayload && typeof errorPayload === 'object'
            ? (errorPayload as { error?: { code?: string } }).error?.code
            : undefined
        const errorMessage =
          errorPayload && typeof errorPayload === 'object'
            ? (errorPayload as { error?: { message?: string } }).error?.message
            : undefined
        const message = errorMessage || `MCP server returned ${response.status}`
        throw new Error(
          JSON.stringify({
            message,
            status: response.status,
            code: errorCode,
          }),
        )
      }

      mcpResponse = await response.json()

      if (!mcpResponse.success || !mcpResponse.data) {
        throw new Error('MCP response missing data')
      }
    } catch (mcpError) {
      const isTimeout = mcpError instanceof DOMException && mcpError.name === 'AbortError'
      const parsedDetails = (() => {
        if (mcpError instanceof Error) {
          try {
            return JSON.parse(mcpError.message)
          } catch {
            return { message: mcpError.message }
          }
        }
        return { message: String(mcpError) }
      })()

      const mcpErrorCode =
        parsedDetails && typeof parsedDetails === 'object'
          ? (parsedDetails as { code?: string }).code
          : undefined
      const errorCode = isTimeout
        ? DIAGNOSIS_ERROR_CODE.TIMEOUT_ERROR
        : mcpErrorCode === 'MCP_TIMEOUT'
          ? DIAGNOSIS_ERROR_CODE.TIMEOUT_ERROR
          : DIAGNOSIS_ERROR_CODE.MCP_ERROR

      await updateRunAsFailed(adminClient, runId, {
        code: errorCode,
        message:
          errorCode === DIAGNOSIS_ERROR_CODE.TIMEOUT_ERROR
            ? 'MCP request timed out'
            : 'Failed to call MCP server',
        details: {
          mcpError: serializeErrorDetails(mcpError),
          mcpErrorCode,
          mcpStatus: (parsedDetails as { status?: number } | null)?.status ?? null,
        },
      })
      return {
        success: false,
        run_id: runId,
        error: {
          code: errorCode,
          message:
            errorCode === DIAGNOSIS_ERROR_CODE.TIMEOUT_ERROR
              ? 'MCP request timed out'
              : 'Failed to call MCP server',
          details: {
            mcpError: serializeErrorDetails(mcpError),
            mcpErrorCode,
            mcpStatus: (parsedDetails as { status?: number } | null)?.status ?? null,
          },
        },
      }
    }

    // =========================================================================
    // STEP 5: Validate diagnosis result schema
    // =========================================================================
    
    let diagnosisResult
    try {
      diagnosisResult = DiagnosisResultSchema.parse(mcpResponse.data.diagnosis_result)
    } catch (validationError) {
      await updateRunAsFailed(adminClient, runId, {
        code: DIAGNOSIS_ERROR_CODE.VALIDATION_ERROR,
        message: 'Diagnosis result failed schema validation',
        details: {
          validationError: serializeErrorDetails(validationError),
          receivedData: serializeErrorDetails(mcpResponse.data.diagnosis_result),
        },
      })
      return {
        success: false,
        run_id: runId,
        error: {
          code: DIAGNOSIS_ERROR_CODE.VALIDATION_ERROR,
          message: 'Diagnosis result failed schema validation',
          details: { validationError: serializeErrorDetails(validationError) },
        },
      }
    }

    // =========================================================================
    // STEP 6: Persist diagnosis artifact
    // =========================================================================
    
    const processingTimeMs = Date.now() - startTime

    const artifactData = {
      run_id: runId,
      patient_id: run.patient_id,
      diagnosis_result: diagnosisResult,
      metadata: {
        mcp_run_id: mcpResponse.data.run_id,
        run_version: mcpResponse.version?.run_version,
        prompt_version: mcpResponse.version?.prompt_version,
        executed_at: new Date().toISOString(),
        processing_time_ms: processingTimeMs,
      },
    }

    const { data: artifact, error: artifactError } = await adminClient
      .from('diagnosis_artifacts')
      .insert({
        run_id: runId,
        patient_id: run.patient_id,
        artifact_type: ARTIFACT_TYPE.DIAGNOSIS_JSON,
        artifact_data: artifactData,
        schema_version: DEFAULT_SCHEMA_VERSION,
        created_by: run.clinician_id,
        risk_level: diagnosisResult.risk_level,
        confidence_score: diagnosisResult.confidence_score,
        primary_findings: diagnosisResult.primary_findings,
        recommendations_count: diagnosisResult.recommendations.length,
      })
      .select()
      .single()

    if (artifactError || !artifact) {
      await updateRunAsFailed(adminClient, runId, {
        code: DIAGNOSIS_ERROR_CODE.UNKNOWN_ERROR,
        message: 'Failed to persist diagnosis artifact',
        details: { artifactError: serializeErrorDetails(artifactError) },
      })
      return {
        success: false,
        run_id: runId,
        error: {
          code: DIAGNOSIS_ERROR_CODE.UNKNOWN_ERROR,
          message: 'Failed to persist diagnosis artifact',
          details: { artifactError: serializeErrorDetails(artifactError) },
        },
      }
    }

    // =========================================================================
    // STEP 7: Update run as completed
    // =========================================================================
    
    const { error: updateCompletedError } = await adminClient
      .from('diagnosis_runs')
      .update({
        status: DIAGNOSIS_RUN_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
        mcp_run_id: mcpResponse.data.run_id,
        processing_time_ms: processingTimeMs,
      })
      .eq('id', runId)

    if (updateCompletedError) {
      // Artifact is persisted, so this is not critical
      console.error('Failed to update run as completed:', updateCompletedError)
    }

    return {
      success: true,
      run_id: runId,
      artifact_id: artifact.id,
    }

  } catch (unexpectedError) {
    // Catch-all for unexpected errors
    await updateRunAsFailed(adminClient, runId, {
      code: DIAGNOSIS_ERROR_CODE.UNKNOWN_ERROR,
      message: 'Unexpected error during diagnosis execution',
      details: { unexpectedError: serializeErrorDetails(unexpectedError) },
    })

    return {
      success: false,
      run_id: runId,
      error: {
        code: DIAGNOSIS_ERROR_CODE.UNKNOWN_ERROR,
        message: 'Unexpected error during diagnosis execution',
        details: { unexpectedError: serializeErrorDetails(unexpectedError) },
      },
    }
  }
}

/**
 * Helper: Update diagnosis run as failed
 */
async function updateRunAsFailed(
  adminClient: SupabaseClient<Database>,
  runId: string,
  error: {
    code: DiagnosisErrorCode
    message: string
    details?: Json
  },
): Promise<void> {
  await adminClient
    .from('diagnosis_runs')
    .update({
      status: DIAGNOSIS_RUN_STATUS.FAILED,
      completed_at: new Date().toISOString(),
      error_code: error.code,
      error_message: error.message,
      error_details: error.details ?? null,
    })
    .eq('id', runId)
}

/**
 * Process all queued diagnosis runs
 * 
 * @param adminClient - Supabase admin client
 * @param limit - Maximum number of runs to process (default: 10)
 * @returns Array of execution results
 */
export async function processQueuedDiagnosisRuns(
  adminClient: SupabaseClient<Database>,
  limit: number = 10,
): Promise<DiagnosisExecutionResult[]> {
  // Fetch queued runs ordered by created_at (FIFO)
  const { data: queuedRuns, error: fetchError } = await adminClient
    .from('diagnosis_runs')
    .select('id')
    .eq('status', DIAGNOSIS_RUN_STATUS.QUEUED)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (fetchError || !queuedRuns) {
    console.error('Failed to fetch queued diagnosis runs:', fetchError)
    return []
  }

  // Execute each run sequentially (concurrency handled by status check)
  const results: DiagnosisExecutionResult[] = []
  for (const run of queuedRuns) {
    const result = await executeDiagnosisRun(adminClient, run.id)
    results.push(result)
  }

  return results
}
