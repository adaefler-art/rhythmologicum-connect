/**
 * E76.4: Diagnosis Run Execution Worker
 * 
 * Worker endpoint that processes queued diagnosis runs:
 * - Selects next queued run (with concurrency prevention)
 * - Sets status to 'running'
 * - Fetches patient context pack (E76.2)
 * - Calls LLM/MCP for diagnosis
 * - Creates diagnosis artifact
 * - Sets status to 'succeeded' or 'failed'
 * 
 * Strategy A Compliance:
 * - Literal callsite: (to be added with feature flag)
 * - Feature flag: NEXT_PUBLIC_FEATURE_DIAGNOSIS_WORKER_ENABLED (default: false)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  successResponse,
  forbiddenResponse,
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
  databaseErrorResponse,
} from '@/lib/api/responses'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { buildPatientContextPack } from '@/lib/mcp/contextPackBuilder'
import { getRequestId, withRequestId, sanitizeSupabaseError, logError } from '@/lib/db/errors'
import { featureFlags } from '@/lib/featureFlags'

/**
 * POST /api/workers/diagnosis-runs/execute
 * 
 * Processes the next queued diagnosis run.
 * Requires clinician/admin role.
 * Feature-gated behind DIAGNOSIS_WORKER_ENABLED flag.
 * 
 * Returns: { run_id, status, artifact_id? }
 */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)

  try {
    // Feature flag check (E76.4 requirement)
    if (!featureFlags.DIAGNOSIS_WORKER_ENABLED) {
      return withRequestId(
        forbiddenResponse('Diagnosis worker is not enabled', requestId),
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

    // Use admin client for worker operations (needs to access all runs)
    const adminClient = createAdminSupabaseClient()

    // Step 1: Select next queued run (with concurrency prevention)
    // Use PostgreSQL advisory lock to prevent concurrent processing
    const { data: queuedRuns, error: selectError } = await (adminClient as any)
      .from('diagnosis_runs')
      .select('id, patient_id, organization_id, input_config')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)

    if (selectError) {
      const safeErr = sanitizeSupabaseError(selectError)
      logError({ requestId, operation: 'select_queued_run', userId: user.id, error: safeErr })
      return withRequestId(databaseErrorResponse(undefined, requestId), requestId)
    }

    if (!queuedRuns || queuedRuns.length === 0) {
      // No queued runs available
      return withRequestId(
        successResponse({ message: 'No queued runs available', processed: false }, 200, requestId),
        requestId
      )
    }

    const run = queuedRuns[0]

    // Step 2: Mark run as 'running' (with optimistic locking)
    const now = new Date().toISOString()
    const { data: updatedRun, error: updateError } = await (adminClient as any)
      .from('diagnosis_runs')
      .update({
        status: 'running',
        started_at: now,
        updated_at: now,
      })
      .eq('id', run.id)
      .eq('status', 'queued') // Optimistic lock: only update if still queued
      .select()
      .single()

    if (updateError) {
      const safeErr = sanitizeSupabaseError(updateError)
      if (safeErr.code === 'PGRST116') {
        // Run was already picked up by another worker
        return withRequestId(
          successResponse(
            { message: 'Run already being processed by another worker', processed: false },
            200,
            requestId
          ),
          requestId
        )
      }
      logError({ requestId, operation: 'update_run_status', userId: user.id, error: safeErr })
      return withRequestId(databaseErrorResponse(undefined, requestId), requestId)
    }

    if (!updatedRun) {
      // Run disappeared (concurrent update)
      return withRequestId(
        successResponse(
          { message: 'Run no longer available', processed: false },
          200,
          requestId
        ),
        requestId
      )
    }

    try {
      // Step 3: Build patient context pack (E76.2)
      const contextPack = await buildPatientContextPack(adminClient, run.patient_id)

      // Step 4: Call LLM/MCP for diagnosis (stub for now - E76.4)
      // TODO: Implement actual LLM/MCP integration
      const diagnosisResult = await executeDiagnosis(contextPack, run.input_config)

      // Step 5: Validate diagnosis result
      const validationResult = validateDiagnosisResult(diagnosisResult)
      if (!validationResult.valid) {
        // Invalid result - mark as failed with VALIDATION_ERROR
        const failedNow = new Date().toISOString()
        await (adminClient as any)
          .from('diagnosis_runs')
          .update({
            status: 'failed',
            completed_at: failedNow,
            updated_at: failedNow,
            error_info: {
              code: 'VALIDATION_ERROR',
              message: validationResult.error,
              details: validationResult.details,
            },
          })
          .eq('id', run.id)

        return withRequestId(
          successResponse(
            {
              run_id: run.id,
              status: 'failed',
              error: 'VALIDATION_ERROR',
              processed: true,
            },
            200,
            requestId
          ),
          requestId
        )
      }

      // Step 6: Create diagnosis artifact
      const { data: artifact, error: artifactError } = await (adminClient as any)
        .from('diagnosis_artifacts')
        .insert({
          organization_id: run.organization_id,
          artifact_type: 'diagnosis_result',
          artifact_name: `Diagnosis for Patient ${run.patient_id}`,
          artifact_data: diagnosisResult,
        })
        .select()
        .single()

      if (artifactError) {
        const safeErr = sanitizeSupabaseError(artifactError)
        logError({ requestId, operation: 'create_artifact', userId: user.id, error: safeErr })
        
        // Artifact creation failed - mark run as failed
        const failedNow = new Date().toISOString()
        await (adminClient as any)
          .from('diagnosis_runs')
          .update({
            status: 'failed',
            completed_at: failedNow,
            updated_at: failedNow,
            error_info: {
              code: 'ARTIFACT_CREATION_FAILED',
              message: 'Failed to create diagnosis artifact',
              details: safeErr,
            },
          })
          .eq('id', run.id)

        return withRequestId(databaseErrorResponse(undefined, requestId), requestId)
      }

      // Step 7: Link artifact to run
      await (adminClient as any)
        .from('diagnosis_run_artifacts')
        .insert({
          run_id: run.id,
          artifact_id: artifact.id,
          sequence_order: 1,
        })

      // Step 8: Mark run as 'succeeded'
      const succeededNow = new Date().toISOString()
      await (adminClient as any)
        .from('diagnosis_runs')
        .update({
          status: 'succeeded',
          completed_at: succeededNow,
          updated_at: succeededNow,
          output_data: {
            artifact_id: artifact.id,
            summary: diagnosisResult.summary || null,
          },
        })
        .eq('id', run.id)

      return withRequestId(
        successResponse(
          {
            run_id: run.id,
            status: 'succeeded',
            artifact_id: artifact.id,
            processed: true,
          },
          200,
          requestId
        ),
        requestId
      )
    } catch (error) {
      // Execution error - mark run as failed
      const safeErr = sanitizeSupabaseError(error)
      logError({ requestId, operation: 'execute_diagnosis', userId: user.id, error: safeErr })

      const failedNow = new Date().toISOString()
      await (adminClient as any)
        .from('diagnosis_runs')
        .update({
          status: 'failed',
          completed_at: failedNow,
          updated_at: failedNow,
          error_info: {
            code: 'EXECUTION_ERROR',
            message: safeErr.message || 'Unknown execution error',
            details: safeErr,
          },
        })
        .eq('id', run.id)

      return withRequestId(internalErrorResponse(undefined, requestId), requestId)
    }
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    logError({ requestId, operation: 'POST /api/workers/diagnosis-runs/execute', error: safeErr })
    return withRequestId(internalErrorResponse(undefined, requestId), requestId)
  }
}

/**
 * Execute diagnosis using LLM/MCP
 * TODO: Implement actual LLM/MCP integration (E76.4)
 */
async function executeDiagnosis(contextPack: any, inputConfig: any): Promise<any> {
  // Stub implementation - returns mock diagnosis
  // In real implementation, this would:
  // 1. Call MCP server with context pack
  // 2. Get LLM analysis
  // 3. Return structured diagnosis result
  
  return {
    patient_id: contextPack.patient_id,
    diagnosis: {
      primary_findings: ['Stress level assessment completed'],
      risk_level: 'moderate',
      recommendations: ['Regular stress monitoring recommended'],
      confidence_score: 0.75,
    },
    metadata: {
      context_version: contextPack.metadata.context_version,
      executed_at: new Date().toISOString(),
      processing_time_ms: 1500,
    },
    summary: 'Diagnosis completed successfully',
  }
}

/**
 * Validate diagnosis result structure
 */
function validateDiagnosisResult(result: any): { valid: boolean; error?: string; details?: any } {
  if (!result || typeof result !== 'object') {
    return {
      valid: false,
      error: 'Diagnosis result must be an object',
    }
  }

  if (!result.diagnosis) {
    return {
      valid: false,
      error: 'Missing diagnosis field in result',
    }
  }

  if (!result.metadata) {
    return {
      valid: false,
      error: 'Missing metadata field in result',
    }
  }

  // Check diagnosis structure
  const diagnosis = result.diagnosis
  if (
    !Array.isArray(diagnosis.primary_findings) ||
    !diagnosis.risk_level ||
    !Array.isArray(diagnosis.recommendations)
  ) {
    return {
      valid: false,
      error: 'Invalid diagnosis structure',
      details: {
        expected: {
          primary_findings: 'array',
          risk_level: 'string',
          recommendations: 'array',
        },
        received: {
          primary_findings: Array.isArray(diagnosis.primary_findings) ? 'array' : typeof diagnosis.primary_findings,
          risk_level: typeof diagnosis.risk_level,
          recommendations: Array.isArray(diagnosis.recommendations) ? 'array' : typeof diagnosis.recommendations,
        },
      },
    }
  }

  return { valid: true }
}
