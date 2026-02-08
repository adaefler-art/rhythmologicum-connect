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
import crypto from 'node:crypto'
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
  DiagnosisResultV2Schema,
  type DiagnosisRun,
  type DiagnosisArtifact,
  type DiagnosisErrorCode,
} from '@/lib/contracts/diagnosis'
import {
  validateDiagnosisPromptOutputV1,
  validateDiagnosisPromptOutputV2,
} from '@/lib/contracts/diagnosis-prompt'
import { logInfo } from '@/lib/logging/logger'

const MCP_TIMEOUT_MS = 60000

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

function computeHash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function extractDiagnosisPayload(rawResponse: unknown): unknown {
  if (!rawResponse || typeof rawResponse !== 'object') {
    return null
  }

  const responseRecord = rawResponse as Record<string, unknown>
  const responsePayload =
    (responseRecord.data as Record<string, unknown> | undefined) ?? responseRecord

  if (!responsePayload || typeof responsePayload !== 'object') {
    return null
  }

  const payloadRecord = responsePayload as Record<string, unknown>
  if (payloadRecord.diagnosis_result) {
    return payloadRecord.diagnosis_result
  }

  if (payloadRecord.parsed_result_v2) {
    return payloadRecord.parsed_result_v2
  }

  if (payloadRecord.data && typeof payloadRecord.data === 'object') {
    const nested = payloadRecord.data as Record<string, unknown>
    if (nested.diagnosis_result) {
      return nested.diagnosis_result
    }
  }

  return null
}

function shouldSanitizeMcpResponse(rawResponse: unknown): boolean {
  if (!rawResponse || typeof rawResponse !== 'object') {
    return false
  }

  const responseRecord = rawResponse as Record<string, unknown>
  const keys = Object.keys(responseRecord)
  const sensitiveKeys = new Set([
    'context_pack',
    'context',
    'patient_context',
    'context_bundle',
    'inputs',
    'input',
    'history',
    'documents',
    'attachments',
    'notes',
  ])

  if (keys.some((key) => sensitiveKeys.has(key))) {
    return true
  }

  try {
    const size = JSON.stringify(rawResponse).length
    return size > 50000
  } catch {
    return true
  }
}

function sanitizeMcpResponse(rawResponse: unknown, diagnosisPayload: unknown): Json {
  if (!rawResponse || typeof rawResponse !== 'object') {
    return rawResponse as Json
  }

  const responseRecord = rawResponse as Record<string, unknown>
  const responsePayload =
    (responseRecord.data as Record<string, unknown> | undefined) ?? responseRecord
  const payloadRecord =
    responsePayload && typeof responsePayload === 'object'
      ? (responsePayload as Record<string, unknown>)
      : {}

  const sanitized = {
    run_id: payloadRecord.run_id ?? responseRecord.run_id ?? null,
    patient_id: payloadRecord.patient_id ?? responseRecord.patient_id ?? null,
    diagnosis_result: diagnosisPayload ?? null,
    raw_llm_text: payloadRecord.raw_llm_text ?? null,
    parsed_result_v2: payloadRecord.parsed_result_v2 ?? null,
    provenance: payloadRecord.provenance ?? null,
    metadata: payloadRecord.metadata ?? responseRecord.metadata ?? null,
  }

  return sanitized as Json
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
  const traceId = crypto.randomUUID()

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
              canary:
                typeof run.inputs_meta === 'object' && run.inputs_meta
                  ? Boolean((run.inputs_meta as Record<string, unknown>).canary)
                  : false,
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

      if (!mcpResponse) {
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
      const timeoutCodes = new Set([
        'MCP_TIMEOUT',
        'MCP_TIMEOUT_CLIENT',
        'MCP_TIMEOUT_PROVIDER',
        'MCP_TIMEOUT_UPSTREAM',
      ])
      const errorCode = isTimeout
        ? DIAGNOSIS_ERROR_CODE.TIMEOUT_ERROR
        : mcpErrorCode && timeoutCodes.has(mcpErrorCode)
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
    // STEP 5: Parse diagnosis payload + validate schema (non-fatal)
    // =========================================================================
    
    const diagnosisPayload = extractDiagnosisPayload(mcpResponse)
    const diagnosisResultValidation = diagnosisPayload
      ? DiagnosisResultSchema.safeParse(diagnosisPayload)
      : null
    const promptValidationV2 = diagnosisPayload
      ? validateDiagnosisPromptOutputV2(diagnosisPayload)
      : null
    const promptValidationV1 = diagnosisPayload
      ? validateDiagnosisPromptOutputV1(diagnosisPayload)
      : null

    const validationMetadata = {
      ok: Boolean(
        diagnosisResultValidation?.success ||
          promptValidationV2?.success ||
          promptValidationV1?.success,
      ),
      schema: diagnosisResultValidation?.success
        ? 'diagnosis_result'
        : promptValidationV2?.success
          ? 'prompt_output_v2'
          : promptValidationV1?.success
            ? 'prompt_output_v1'
            : null,
      reason:
        diagnosisResultValidation?.success ||
          promptValidationV2?.success ||
          promptValidationV1?.success
          ? null
          : 'schema_mismatch',
    }

    if (!validationMetadata.ok) {
      logInfo('DIAGNOSIS_VALIDATION', {
        run_id: runId,
        trace_id: traceId,
        ok: false,
        error_code: DIAGNOSIS_ERROR_CODE.VALIDATION_ERROR,
      })
    }

    const diagnosisResult = diagnosisResultValidation?.success
      ? diagnosisResultValidation.data
      : null

    // =========================================================================
    // STEP 6: Persist diagnosis artifacts (mcp_response always)
    // =========================================================================
    
    const processingTimeMs = Date.now() - startTime
    const responseRecord = mcpResponse as Record<string, unknown>
    const responsePayload =
      (responseRecord.data as Record<string, unknown> | undefined) ?? responseRecord
    const normalizeString = (value: unknown): string | null =>
      typeof value === 'string' ? value : null

    const mcpRunId = normalizeString(
      (responsePayload && (responsePayload as Record<string, unknown>).run_id) ||
        responseRecord.run_id ||
        null,
    )
    const responseTraceId = normalizeString(
      (responsePayload && (responsePayload as Record<string, unknown>).trace_id) ||
        responseRecord.trace_id ||
        null,
    )

    const rawLlmText = normalizeString(
      (responsePayload && (responsePayload as Record<string, unknown>).raw_llm_text) ||
        responseRecord.raw_llm_text ||
        null,
    )

    const parsedResultV2Candidate =
      (responsePayload && (responsePayload as Record<string, unknown>).parsed_result_v2) ||
      responseRecord.parsed_result_v2 ||
      null
    const parsedResultV2Validation = parsedResultV2Candidate
      ? validateDiagnosisPromptOutputV2(parsedResultV2Candidate)
      : null
    const parsedResultV2FromDiagnosis = DiagnosisResultV2Schema.safeParse(diagnosisResult)
    const parsedResultV2 = parsedResultV2Validation?.success
      ? parsedResultV2Validation.data
      : promptValidationV2?.success
        ? promptValidationV2.data
        : parsedResultV2FromDiagnosis.success
          ? parsedResultV2FromDiagnosis.data
          : null
    const outputVersion = parsedResultV2 ? 'v2' : null

    const provenanceCandidate =
      (responsePayload && (responsePayload as Record<string, unknown>).provenance) ||
      responseRecord.provenance ||
      (responsePayload && (responsePayload as Record<string, unknown>).metadata
        ? (responsePayload as Record<string, unknown>).metadata
        : null)
    const provenanceRecord =
      provenanceCandidate && typeof provenanceCandidate === 'object'
        ? ((provenanceCandidate as Record<string, unknown>).provenance &&
            typeof (provenanceCandidate as Record<string, unknown>).provenance === 'object'
            ? ((provenanceCandidate as Record<string, unknown>).provenance as Record<
                string,
                unknown
              >)
            : (provenanceCandidate as Record<string, unknown>))
        : null
    const normalizeNumber = (value: unknown): number | null =>
      typeof value === 'number' && Number.isFinite(value) ? value : null
    const fallbackResultSource = parsedResultV2 ? 'llm' : 'fallback'
    const resultSource =
      typeof provenanceRecord?.result_source === 'string'
        ? String(provenanceRecord?.result_source)
        : fallbackResultSource
    const llmUsed =
      typeof provenanceRecord?.llm_used === 'boolean'
        ? provenanceRecord.llm_used
        : resultSource === 'llm'
    const llmRawResponse = normalizeString(provenanceRecord?.llm_raw_response) ?? rawLlmText
    const provenance = {
      result_source: resultSource,
      llm_used: llmUsed,
      llm_provider: normalizeString(provenanceRecord?.llm_provider),
      llm_model: normalizeString(provenanceRecord?.llm_model),
      llm_prompt_version: normalizeString(provenanceRecord?.llm_prompt_version),
      llm_request_id: normalizeString(provenanceRecord?.llm_request_id),
      llm_latency_ms: normalizeNumber(provenanceRecord?.llm_latency_ms),
      llm_tokens_in: normalizeNumber(provenanceRecord?.llm_tokens_in),
      llm_tokens_out: normalizeNumber(provenanceRecord?.llm_tokens_out),
      llm_tokens_total: normalizeNumber(provenanceRecord?.llm_tokens_total),
      llm_error: normalizeString(provenanceRecord?.llm_error) ?? (llmUsed ? null : 'UNKNOWN'),
      llm_raw_response: llmRawResponse,
    }

    const legacyFindingsCount =
      diagnosisResult && typeof diagnosisResult === 'object'
        ? Array.isArray((diagnosisResult as { primary_findings?: unknown }).primary_findings)
          ? (diagnosisResult as { primary_findings?: unknown[] }).primary_findings?.length ?? 0
          : 0
        : 0
    const hasV2Summary = Boolean(parsedResultV2?.summary_for_clinician)
    const hasV2Output = parsedResultV2?.output_version === 'v2'
    const mappingSuspect =
      provenance.llm_used &&
      provenance.result_source === 'llm' &&
      !(hasV2Output || hasV2Summary || legacyFindingsCount > 1)
    const mappingAssertionEnabled = mappingSuspect && process.env.NODE_ENV !== 'production'
    const llmRawResponseHash = llmRawResponse ? computeHash(llmRawResponse) : null
    const parsedResultHash = (() => {
      try {
        if (parsedResultV2) {
          return computeHash(JSON.stringify(parsedResultV2))
        }
        if (diagnosisPayload) {
          return computeHash(JSON.stringify(diagnosisPayload))
        }
      } catch {
        return null
      }
      return null
    })()

    if (mappingAssertionEnabled) {
      logInfo('MAPPING_SUSPECT', {
        run_id: runId,
        trace_id: traceId,
        llm_used: provenance.llm_used,
        result_source: provenance.result_source,
        llm_raw_response_hash: llmRawResponseHash,
        parsed_result_hash: parsedResultHash,
      })
    }

    const rawMcpResponse = shouldSanitizeMcpResponse(mcpResponse)
      ? sanitizeMcpResponse(mcpResponse, diagnosisPayload)
      : (mcpResponse as Json)

    const baseMetadata: Json = {
      mcp_run_id: mcpRunId,
      executed_at: new Date().toISOString(),
      processing_time_ms: processingTimeMs,
      trace_id: traceId,
      response_trace_id: responseTraceId,
    }

    const persistStart = Date.now()

    const persistArtifact = async (payload: {
      artifact_type: typeof ARTIFACT_TYPE[keyof typeof ARTIFACT_TYPE]
      artifact_data: Json
      metadata: Json
      risk_level?: string | null
      confidence_score?: number | null
      primary_findings?: string[] | null
      recommendations_count?: number | null
      result_source?: string | null
      llm_used?: boolean | null
      llm_provider?: string | null
      llm_model?: string | null
      llm_prompt_version?: string | null
      llm_request_id?: string | null
      llm_latency_ms?: number | null
      llm_tokens_in?: number | null
      llm_tokens_out?: number | null
      llm_tokens_total?: number | null
      llm_error?: string | null
      llm_raw_response?: string | null
    }) => {
      const { data: existingArtifact, error: existingArtifactError } = await adminClient
        .from('diagnosis_artifacts')
        .select('id')
        .eq('run_id', runId)
        .eq('artifact_type', payload.artifact_type)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingArtifactError) {
        return { artifact: null, error: existingArtifactError }
      }

      const artifactPayload = {
        run_id: runId,
        patient_id: run.patient_id,
        artifact_type: payload.artifact_type,
        artifact_data: payload.artifact_data,
        schema_version: DEFAULT_SCHEMA_VERSION,
        created_by: run.clinician_id,
        risk_level: payload.risk_level ?? null,
        confidence_score: payload.confidence_score ?? null,
        primary_findings: payload.primary_findings ?? null,
        recommendations_count: payload.recommendations_count ?? null,
        metadata: payload.metadata,
        result_source: payload.result_source ?? null,
        llm_used: payload.llm_used ?? null,
        llm_provider: payload.llm_provider ?? null,
        llm_model: payload.llm_model ?? null,
        llm_prompt_version: payload.llm_prompt_version ?? null,
        llm_request_id: payload.llm_request_id ?? null,
        llm_latency_ms: payload.llm_latency_ms ?? null,
        llm_tokens_in: payload.llm_tokens_in ?? null,
        llm_tokens_out: payload.llm_tokens_out ?? null,
        llm_tokens_total: payload.llm_tokens_total ?? null,
        llm_error: payload.llm_error ?? null,
        llm_raw_response: payload.llm_raw_response ?? null,
      }

      const { data: artifact, error: artifactError } = existingArtifact
        ? await adminClient
            .from('diagnosis_artifacts')
            .update(artifactPayload)
            .eq('id', existingArtifact.id)
            .select()
            .single()
        : await adminClient
            .from('diagnosis_artifacts')
            .insert(artifactPayload)
            .select()
            .single()

      return { artifact, error: artifactError }
    }

    const mcpArtifactResult = await persistArtifact({
      artifact_type: ARTIFACT_TYPE.MCP_RESPONSE,
      artifact_data: rawMcpResponse,
      metadata: baseMetadata,
    })

    if (mcpArtifactResult.error || !mcpArtifactResult.artifact) {
      logInfo('DIAG_ARTIFACT_PERSIST', {
        run_id: runId,
        trace_id: traceId,
        mcp_run_id: mcpRunId,
        ok: false,
        error_code: DIAGNOSIS_ERROR_CODE.DIAGNOSIS_PERSIST_FAILED,
        artifact_type: ARTIFACT_TYPE.MCP_RESPONSE,
        elapsed_ms: Date.now() - persistStart,
      })
      await updateRunAsFailed(adminClient, runId, {
        code: DIAGNOSIS_ERROR_CODE.DIAGNOSIS_PERSIST_FAILED,
        message: 'Failed to persist MCP response artifact',
        details: {
          trace_id: traceId,
          mcp_run_id: mcpRunId ?? null,
          artifactError: serializeErrorDetails(mcpArtifactResult.error),
        },
      })
      return {
        success: false,
        run_id: runId,
        error: {
          code: DIAGNOSIS_ERROR_CODE.DIAGNOSIS_PERSIST_FAILED,
          message: 'Failed to persist MCP response artifact',
          details: {
            trace_id: traceId,
            mcp_run_id: mcpRunId ?? null,
            artifactError: serializeErrorDetails(mcpArtifactResult.error),
          },
        },
      }
    }

    logInfo('DIAG_ARTIFACT_PERSIST', {
      run_id: runId,
      trace_id: traceId,
      mcp_run_id: mcpRunId,
      artifact_id: mcpArtifactResult.artifact.id,
      ok: true,
      artifact_type: ARTIFACT_TYPE.MCP_RESPONSE,
      elapsed_ms: Date.now() - persistStart,
    })

    let diagnosisArtifact: DiagnosisArtifact | null = null

    if (diagnosisPayload) {
      const artifactData: Json = {
        run_id: runId,
        patient_id: run.patient_id,
        diagnosis_result: serializeErrorDetails(diagnosisPayload),
        raw_llm_text: rawLlmText ?? undefined,
        parsed_result_v2: parsedResultV2 ?? undefined,
        output_version: outputVersion ?? undefined,
        metadata: {
          ...baseMetadata,
          validation: validationMetadata,
          provenance,
          mapping_assertion: mappingAssertionEnabled
            ? {
                status: 'MAPPING_SUSPECT',
                llm_raw_response_hash: llmRawResponseHash,
                parsed_result_hash: parsedResultHash,
              }
            : { status: 'OK' },
        },
      }

      const isLegacyResult =
        diagnosisResult && typeof diagnosisResult === 'object'
          ? 'risk_level' in (diagnosisResult as Record<string, unknown>)
          : false
      const legacyResult = isLegacyResult
        ? (diagnosisResult as {
            risk_level?: string
            confidence_score?: number
            primary_findings?: string[]
            recommendations?: string[]
          })
        : null

      const diagnosisArtifactResult = await persistArtifact({
        artifact_type: ARTIFACT_TYPE.DIAGNOSIS_JSON,
        artifact_data: artifactData,
        metadata: (artifactData as { metadata?: Json }).metadata ?? null,
        risk_level: legacyResult?.risk_level ?? null,
        confidence_score: legacyResult?.confidence_score ?? null,
        primary_findings: legacyResult?.primary_findings ?? null,
        recommendations_count: legacyResult?.recommendations?.length ?? null,
        result_source: provenance.result_source,
        llm_used: provenance.llm_used,
        llm_provider: provenance.llm_provider,
        llm_model: provenance.llm_model,
        llm_prompt_version: provenance.llm_prompt_version,
        llm_request_id: provenance.llm_request_id,
        llm_latency_ms: provenance.llm_latency_ms,
        llm_tokens_in: provenance.llm_tokens_in,
        llm_tokens_out: provenance.llm_tokens_out,
        llm_tokens_total: provenance.llm_tokens_total,
        llm_error: provenance.llm_error,
        llm_raw_response: provenance.llm_raw_response,
      })

      if (diagnosisArtifactResult.error || !diagnosisArtifactResult.artifact) {
        logInfo('DIAG_ARTIFACT_PERSIST', {
          run_id: runId,
          trace_id: traceId,
          mcp_run_id: mcpRunId,
          ok: false,
          error_code: DIAGNOSIS_ERROR_CODE.DIAGNOSIS_PERSIST_FAILED,
          artifact_type: ARTIFACT_TYPE.DIAGNOSIS_JSON,
          elapsed_ms: Date.now() - persistStart,
        })
        await updateRunAsFailed(adminClient, runId, {
          code: DIAGNOSIS_ERROR_CODE.DIAGNOSIS_PERSIST_FAILED,
          message: 'Failed to persist diagnosis artifact',
          details: {
            trace_id: traceId,
            mcp_run_id: mcpRunId ?? null,
            artifactError: serializeErrorDetails(diagnosisArtifactResult.error),
          },
        })
        return {
          success: false,
          run_id: runId,
          error: {
            code: DIAGNOSIS_ERROR_CODE.DIAGNOSIS_PERSIST_FAILED,
            message: 'Failed to persist diagnosis artifact',
            details: {
              trace_id: traceId,
              mcp_run_id: mcpRunId ?? null,
              artifactError: serializeErrorDetails(diagnosisArtifactResult.error),
            },
          },
        }
      }

      diagnosisArtifact = diagnosisArtifactResult.artifact as DiagnosisArtifact | null
      logInfo('DIAG_ARTIFACT_PERSIST', {
        run_id: runId,
        trace_id: traceId,
        mcp_run_id: mcpRunId,
        artifact_id: diagnosisArtifact?.id ?? null,
        ok: true,
        artifact_type: ARTIFACT_TYPE.DIAGNOSIS_JSON,
        elapsed_ms: Date.now() - persistStart,
      })
    }

    // =========================================================================
    // STEP 7: Update run as completed
    // =========================================================================
    
    const { error: updateCompletedError } = await adminClient
      .from('diagnosis_runs')
      .update({
        status: DIAGNOSIS_RUN_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
        mcp_run_id: mcpRunId ?? null,
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
      artifact_id: diagnosisArtifact?.id ?? mcpArtifactResult.artifact.id,
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
