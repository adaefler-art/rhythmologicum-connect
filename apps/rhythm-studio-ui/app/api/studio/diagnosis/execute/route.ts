/**
 * E76.4: Diagnosis Execution API Route
 * 
 * Executes queued diagnosis runs by calling the diagnosis worker.
 * Feature-gated behind NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED.
 * 
 * @endpoint-intent diagnosis:execute Worker endpoint for processing diagnosis runs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { executeDiagnosisRun, processQueuedDiagnosisRuns } from '@/lib/diagnosis/worker'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { isValidUUID } from '@/lib/validators/uuid'

/**
 * POST /api/studio/diagnosis/execute
 * 
 * Execute a specific diagnosis run or process all queued runs.
 * 
 * Body:
 * - run_id (optional): UUID of specific run to execute
 * - limit (optional): Max runs to process if run_id not provided (default: 10)
 * 
 * DB Access: Uses admin client for diagnosis worker execution (documented justification)
 * 
 * Response:
 * - success: boolean
 * - data: Array of execution results or single result
 */
export async function POST(request: NextRequest) {
  try {
    // Feature flag check
    const diagnosisEnabled = isFeatureEnabled('DIAGNOSIS_ENABLED')
    if (!diagnosisEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Diagnosis execution feature is not enabled',
          },
        },
        { status: 503 },
      )
    }

    // Parse request body
    const body = await request.json()
    const { run_id, limit = 10 } = body

    // Check authentication and authorization
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
        },
        { status: 401 },
      )
    }

    // Check if user is clinician or admin
    const userRole = user.app_metadata?.role
    const isAuthorized = userRole === 'clinician' || userRole === 'admin'

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only clinicians and admins can execute diagnosis runs',
          },
        },
        { status: 403 },
      )
    }

    // Create admin client for worker (bypasses RLS)
    const adminClient = createAdminSupabaseClient()

    // Execute specific run or process queue
    if (run_id) {
      // Validate UUID format
      if (!isValidUUID(run_id)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_UUID',
              message: 'run_id must be a valid UUID',
            },
          },
          { status: 400 },
        )
      }

      const result = await executeDiagnosisRun(adminClient, run_id)

      return NextResponse.json({
        success: result.success,
        data: result,
      })
    } else {
      // Process queued runs
      const results = await processQueuedDiagnosisRuns(adminClient, limit)

      return NextResponse.json({
        success: true,
        data: {
          processed: results.length,
          results: results,
        },
      })
    }
  } catch (error) {
    console.error('Diagnosis execution error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: String(error),
        },
      },
      { status: 500 },
    )
  }
}
