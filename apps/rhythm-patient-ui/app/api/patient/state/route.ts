import { requireAuth } from '@/lib/api/authHelpers'
import { versionedSuccessResponse, internalErrorResponse } from '@/lib/api/responses'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { randomUUID } from 'crypto'
import {
  PATIENT_STATE_SCHEMA_VERSION,
  createEmptyPatientState,
  type PatientStateV01,
} from '@/lib/api/contracts/patient/state'

/**
 * I2.1: Patient State API - GET Endpoint
 * 
 * Returns canonical patient state v0.1 for authenticated user.
 * Creates empty state if none exists (lazy initialization).
 * 
 * Acceptance Criteria:
 * - AC1: Unauthenticated → 401
 * - AC2: Returns versioned state with schemaVersion
 * - AC3: Empty/missing state → returns clean default
 * - AC4: State persists across reload/navigation
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: { patient_state_version: "0.1", assessment: {...}, ... },
 *   schemaVersion: "v1",
 *   requestId: "uuid"
 * }
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const correlationId = randomUUID()

  // AC1: Auth check FIRST (401-first ordering)
  let authResult
  try {
    authResult = await requireAuth()
  } catch (authError) {
    console.error('[PATIENT_STATE_API] STEP=requireAuth success=false', {
      correlationId,
      errorType: authError instanceof Error ? authError.name : 'unknown',
      errorMessage: authError instanceof Error ? authError.message : String(authError),
    })
    return internalErrorResponse('Authentication check failed', correlationId)
  }

  if (authResult.error) {
    console.log('[PATIENT_STATE_API] STEP=requireAuth success=false reason=unauthorized', {
      correlationId,
    })
    return authResult.error
  }

  const user = authResult.user!
  console.log('[PATIENT_STATE_API] STEP=requireAuth success=true', {
    correlationId,
    userId: user.id,
  })

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch patient state from database
    const { data: stateRow, error: fetchError } = await supabase
      .from('patient_state')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('[PATIENT_STATE_API] STEP=fetchState success=false', {
        correlationId,
        errorCode: fetchError.code,
        errorMessage: fetchError.message,
      })
      return internalErrorResponse('Failed to fetch patient state', correlationId)
    }

    // AC3: If no state exists, return empty/default state (lazy init)
    if (!stateRow) {
      console.log('[PATIENT_STATE_API] STEP=fetchState reason=noStateFound returning=emptyState', {
        correlationId,
      })
      const emptyState = createEmptyPatientState()
      return versionedSuccessResponse(emptyState, PATIENT_STATE_SCHEMA_VERSION, 200, correlationId)
    }

    // Map database row to PatientStateV01
    const patientState: PatientStateV01 = {
      patient_state_version: stateRow.patient_state_version,
      assessment: {
        lastAssessmentId: stateRow.assessment_last_assessment_id,
        status: stateRow.assessment_status,
        progress: Number(stateRow.assessment_progress),
        completedAt: stateRow.assessment_completed_at,
      },
      results: {
        summaryCards: stateRow.results_summary_cards || [],
        recommendedActions: stateRow.results_recommended_actions || [],
        lastGeneratedAt: stateRow.results_last_generated_at,
      },
      dialog: {
        lastContext: stateRow.dialog_last_context,
        messageCount: stateRow.dialog_message_count,
        lastMessageAt: stateRow.dialog_last_message_at,
      },
      activity: {
        recentActivity: stateRow.activity_recent || [],
      },
      metrics: {
        healthScore: {
          current: stateRow.metrics_health_score_current !== null 
            ? Number(stateRow.metrics_health_score_current) 
            : null,
          delta: stateRow.metrics_health_score_delta !== null 
            ? Number(stateRow.metrics_health_score_delta) 
            : null,
        },
        keyMetrics: stateRow.metrics_key_metrics || [],
      },
    }

    console.log('[PATIENT_STATE_API] STEP=fetchState success=true', {
      correlationId,
    })

    // AC2: Return versioned response
    return versionedSuccessResponse(patientState, PATIENT_STATE_SCHEMA_VERSION, 200, correlationId)
  } catch (error) {
    console.error('[PATIENT_STATE_API] STEP=fetchState exception', {
      correlationId,
      errorType: error instanceof Error ? error.name : 'unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    return internalErrorResponse('Failed to load patient state', correlationId)
  }
}

/**
 * I2.1: Patient State API - POST/PATCH Endpoint
 * 
 * Updates canonical patient state v0.1 for authenticated user.
 * Supports partial updates (upsert pattern).
 * 
 * Acceptance Criteria:
 * - AC1: Unauthenticated → 401
 * - AC2: Validates request body
 * - AC3: Supports partial updates
 * - AC4: Returns updated state
 * - AC5: Creates state if doesn't exist (upsert)
 */

export async function POST(request: Request) {
  const correlationId = randomUUID()

  // AC1: Auth check FIRST
  let authResult
  try {
    authResult = await requireAuth()
  } catch (authError) {
    console.error('[PATIENT_STATE_API] STEP=requireAuth success=false', {
      correlationId,
      errorType: authError instanceof Error ? authError.name : 'unknown',
      errorMessage: authError instanceof Error ? authError.message : String(authError),
    })
    return internalErrorResponse('Authentication check failed', correlationId)
  }

  if (authResult.error) {
    console.log('[PATIENT_STATE_API] STEP=requireAuth success=false reason=unauthorized', {
      correlationId,
    })
    return authResult.error
  }

  const user = authResult.user!
  console.log('[PATIENT_STATE_API] STEP=requireAuth success=true', {
    correlationId,
    userId: user.id,
  })

  try {
    // AC2: Parse and validate request body
    const body = await request.json()

    // Build update object from partial request
    const updateData: Record<string, unknown> = {
      user_id: user.id,
      patient_state_version: '0.1',
    }

    // Map assessment fields
    if (body.assessment) {
      if (body.assessment.lastAssessmentId !== undefined) {
        updateData.assessment_last_assessment_id = body.assessment.lastAssessmentId
      }
      if (body.assessment.status !== undefined) {
        updateData.assessment_status = body.assessment.status
      }
      if (body.assessment.progress !== undefined) {
        updateData.assessment_progress = body.assessment.progress
      }
      if (body.assessment.completedAt !== undefined) {
        updateData.assessment_completed_at = body.assessment.completedAt
      }
    }

    // Map results fields
    if (body.results) {
      if (body.results.summaryCards !== undefined) {
        updateData.results_summary_cards = body.results.summaryCards
      }
      if (body.results.recommendedActions !== undefined) {
        updateData.results_recommended_actions = body.results.recommendedActions
      }
      if (body.results.lastGeneratedAt !== undefined) {
        updateData.results_last_generated_at = body.results.lastGeneratedAt
      }
    }

    // Map dialog fields
    if (body.dialog) {
      if (body.dialog.lastContext !== undefined) {
        updateData.dialog_last_context = body.dialog.lastContext
      }
      if (body.dialog.messageCount !== undefined) {
        updateData.dialog_message_count = body.dialog.messageCount
      }
      if (body.dialog.lastMessageAt !== undefined) {
        updateData.dialog_last_message_at = body.dialog.lastMessageAt
      }
    }

    // Map activity fields
    if (body.activity) {
      if (body.activity.recentActivity !== undefined) {
        updateData.activity_recent = body.activity.recentActivity
      }
    }

    // Map metrics fields
    if (body.metrics) {
      if (body.metrics.healthScore?.current !== undefined) {
        updateData.metrics_health_score_current = body.metrics.healthScore.current
      }
      if (body.metrics.healthScore?.delta !== undefined) {
        updateData.metrics_health_score_delta = body.metrics.healthScore.delta
      }
      if (body.metrics.keyMetrics !== undefined) {
        updateData.metrics_key_metrics = body.metrics.keyMetrics
      }
    }

    const supabase = await createServerSupabaseClient()

    // AC5: Upsert - update if exists, insert if not
    const { data: stateRow, error: upsertError } = await supabase
      .from('patient_state')
      .upsert(updateData, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (upsertError) {
      console.error('[PATIENT_STATE_API] STEP=upsertState success=false', {
        correlationId,
        errorCode: upsertError.code,
        errorMessage: upsertError.message,
      })
      return internalErrorResponse('Failed to update patient state', correlationId)
    }

    // AC4: Map and return updated state
    const patientState: PatientStateV01 = {
      patient_state_version: stateRow.patient_state_version,
      assessment: {
        lastAssessmentId: stateRow.assessment_last_assessment_id,
        status: stateRow.assessment_status,
        progress: Number(stateRow.assessment_progress),
        completedAt: stateRow.assessment_completed_at,
      },
      results: {
        summaryCards: stateRow.results_summary_cards || [],
        recommendedActions: stateRow.results_recommended_actions || [],
        lastGeneratedAt: stateRow.results_last_generated_at,
      },
      dialog: {
        lastContext: stateRow.dialog_last_context,
        messageCount: stateRow.dialog_message_count,
        lastMessageAt: stateRow.dialog_last_message_at,
      },
      activity: {
        recentActivity: stateRow.activity_recent || [],
      },
      metrics: {
        healthScore: {
          current: stateRow.metrics_health_score_current !== null 
            ? Number(stateRow.metrics_health_score_current) 
            : null,
          delta: stateRow.metrics_health_score_delta !== null 
            ? Number(stateRow.metrics_health_score_delta) 
            : null,
        },
        keyMetrics: stateRow.metrics_key_metrics || [],
      },
    }

    console.log('[PATIENT_STATE_API] STEP=upsertState success=true', {
      correlationId,
    })

    return versionedSuccessResponse(patientState, PATIENT_STATE_SCHEMA_VERSION, 200, correlationId)
  } catch (error) {
    console.error('[PATIENT_STATE_API] STEP=updateState exception', {
      correlationId,
      errorType: error instanceof Error ? error.name : 'unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    return internalErrorResponse('Failed to update patient state', correlationId)
  }
}
